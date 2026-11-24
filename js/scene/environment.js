// Sky dome, sculpted zero-blur Paris terrain, Seine running water shader, islands & bridges
import { geoToXZ, getTerrainY, MONTMARTRE_HILL_XZ, BELLEVILLE_HILL_XZ } from '../config.js';
import { ctx, liveLight } from '../state.js';

export function seineHalfWidthAt(x, z) {
  const distCite = Math.hypot(x - ctx.citeCenterXZ[0], z - ctx.citeCenterXZ[1]);
  const distStL = Math.hypot(x - ctx.ileStLouisXZ[0], z - ctx.ileStLouisXZ[1]);
  // True scale: ~150m main river (halfW=1.65), widening cleanly around Île de la Cité & Île Saint-Louis!
  let extra = 0;
  if (distCite < 11.4) extra = Math.max(extra, 2.3 * Math.cos((distCite / 11.4) * Math.PI * 0.5));
  if (distStL < 7.8) extra = Math.max(extra, 1.45 * Math.cos((distStL / 7.8) * Math.PI * 0.5));
  return 1.65 + extra;
}

// Exact point-to-riverbank clearance (positive = dry land, negative = in water!)
export function getSeineClearance(x, z) {
  let minDist = 999;
  for (let i = 0; i < ctx.seineDensePts.length - 1; i++) {
    const a = ctx.seineDensePts[i], b = ctx.seineDensePts[i + 1];
    const dx = b.x - a.x, dz = b.z - a.z;
    const l2 = dx * dx + dz * dz;
    let t = l2 > 0 ? ((x - a.x) * dx + (z - a.z) * dz) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(x - (a.x + t * dx), z - (a.z + t * dz));
    if (d < minDist) minDist = d;
  }
  return minDist - seineHalfWidthAt(x, z);
}

export function initSeineCurveData() {
  if (ctx.seineCurve && ctx.seineDensePts.length) return;
  ctx.citeCenterXZ = geoToXZ(48.8548, 2.3468);
  ctx.ileStLouisXZ = geoToXZ(48.8517, 2.3568);
  const seineWaypoints = [
    [48.8235, 2.3985], // Far SE Ivry / Charenton
    [48.8320, 2.3820], // Bercy / BnF
    [48.8415, 2.3720], // Gare de Lyon / East Paris
    [48.8465, 2.3640], // Pont d'Austerlitz
    [48.8508, 2.3578], // Île Saint-Louis
    [48.8535, 2.3502], // Notre-Dame / East Île de la Cité
    [48.8555, 2.3452], // Sainte-Chapelle / Mid Île de la Cité
    [48.8571, 2.3413], // Pont Neuf
    [48.8584, 2.3375], // Pont des Arts / Louvre
    [48.8601, 2.3300], // Pont Royal
    [48.8616, 2.3245], // Passerelle Senghor (Tuileries <-> Orsay)
    [48.8634, 2.3196], // Pont de la Concorde
    [48.8639, 2.3136], // Pont Alexandre III
    [48.8641, 2.3018], // Pont de l'Alma
    [48.8599, 2.2921], // Pont d'Iéna (Eiffel <-> Trocadéro)
    [48.8556, 2.2876], // Pont de Bir-Hakeim
    [48.8495, 2.2795], // Pont de Grenelle
    [48.8390, 2.2680], // Parc André-Citroën / Javel
    [48.8260, 2.2530], // Southwest Boulogne-Billancourt exit
  ].map(([la, lo]) => {
    const [x, z] = geoToXZ(la, lo);
    return new THREE.Vector3(x, 0.06, z);
  });

  ctx.seineCurve = new THREE.CatmullRomCurve3(seineWaypoints);
  ctx.seineDensePts = ctx.seineCurve.getPoints(220);
}

export function buildSeineAndBridges() {
  initSeineCurveData();

  // -------------------------------------------------------------------
  // CLEAR REALISTIC RUNNING SEINE WATER (Submerged Riverbed + GLSL Flow Shader)
  // -------------------------------------------------------------------
  const samples = 180;
  const acrossSegs = 10;

  const waterPos = [];
  const waterUvs = [];
  const waterIdx = [];
  const bedPos = [];
  const bedColors = [];
  const bedIdx = [];

  const quayLeft = [];
  const quayRight = [];
  const promenadeLeft = [];
  const promenadeRight = [];

  const shallowCol = new THREE.Color(0x5b7a78);
  const deepCol = new THREE.Color(0x0f2736);
  const tmpCol = new THREE.Color();

  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const pt = ctx.seineCurve.getPoint(t);
    const tan = ctx.seineCurve.getTangent(t).normalize();
    const norm = new THREE.Vector3(-tan.z, 0, tan.x);
    const w = seineHalfWidthAt(pt.x, pt.z);

    for (let j = 0; j <= acrossSegs; j++) {
      const v = j / acrossSegs;           // 0 (left bank) -> 1 (right bank)
      const s = (v - 0.5) * 2.0;          // -1 -> +1
      const px = pt.x + norm.x * (s * w);
      const pz = pt.z + norm.z * (s * w);

      // Water surface vertex (elevated cleanly above riverbed for crystal depth)
      waterPos.push(px, 0.14, pz);
      waterUvs.push(t * 28.0, v);

      // Sculpted riverbed vertex (shallower near quays, deeper in center channel)
      const edgeFactor = Math.abs(s); // 0 at center, 1 at bank
      const bedY = 0.03 + edgeFactor * edgeFactor * 0.07;
      bedPos.push(px, bedY, pz);
      tmpCol.copy(deepCol).lerp(shallowCol, Math.pow(edgeFactor, 1.6));
      bedColors.push(tmpCol.r, tmpCol.g, tmpCol.b);
    }

    if (i < samples) {
      const stride = acrossSegs + 1;
      for (let j = 0; j < acrossSegs; j++) {
        const a = i * stride + j;
        const b = a + 1;
        const c = (i + 1) * stride + j;
        const d = c + 1;
        waterIdx.push(a, b, c, b, d, c);
        bedIdx.push(a, b, c, b, d, c);
      }
    }

    const lx = pt.x + norm.x * (w + 0.12), lz = pt.z + norm.z * (w + 0.12);
    const rx = pt.x - norm.x * (w + 0.12), rz = pt.z - norm.z * (w + 0.12);
    quayLeft.push(new THREE.Vector3(lx, 0.28, lz));
    quayRight.push(new THREE.Vector3(rx, 0.28, rz));
    promenadeLeft.push(new THREE.Vector3(pt.x + norm.x * (w - 0.04), 0.15, pt.z + norm.z * (w - 0.04)));
    promenadeRight.push(new THREE.Vector3(pt.x - norm.x * (w - 0.04), 0.15, pt.z - norm.z * (w - 0.04)));
  }

  // 1. Submerged Riverbed Mesh (visible through clear shallow banks & sunlit ripples!)
  const bedGeo = new THREE.BufferGeometry();
  bedGeo.setAttribute('position', new THREE.Float32BufferAttribute(bedPos, 3));
  bedGeo.setAttribute('color', new THREE.Float32BufferAttribute(bedColors, 3));
  bedGeo.setIndex(bedIdx);
  bedGeo.computeVertexNormals();
  const bedMesh = new THREE.Mesh(
    bedGeo,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0.04 })
  );
  bedMesh.receiveShadow = true;
  ctx.scene.add(bedMesh);

  // 2. Custom GLSL Realistic Clear Running Water Shader
  const riverGeo = new THREE.BufferGeometry();
  riverGeo.setAttribute('position', new THREE.Float32BufferAttribute(waterPos, 3));
  riverGeo.setAttribute('uv', new THREE.Float32BufferAttribute(waterUvs, 2));
  riverGeo.setIndex(waterIdx);
  riverGeo.computeVertexNormals();

  ctx.seineUniforms = {
    uTime: { value: 0 },
    uSunDir: { value: liveLight.dirPos.clone().normalize() },
    uSunColor: { value: liveLight.dirColor.clone() },
    uSkyTop: { value: liveLight.skyTop.clone() },
    uSkyHorizon: { value: liveLight.skyHorizon.clone() },
    uFogColor: { value: liveLight.fog.clone() },
    uFogDensity: { value: liveLight.fogDensity },
    uNightGlow: { value: liveLight.windowGlow },
    uBoatPos: { value: new THREE.Vector3(0, 0, 0) },
    uBoatDir: { value: new THREE.Vector3(-1, 0, 0) },
  };

  const riverMat = new THREE.ShaderMaterial({
    uniforms: ctx.seineUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying float vWaveH;

      void main() {
        vUv = uv;
        vec3 pos = position;
        // Real fluid profile: faster current in mid-channel, gentler near stone quays
        float centerMask = sin(uv.y * 3.14159265);
        float flow = uTime * 1.45;
        float w1 = sin(uv.x * 5.2 - flow * 1.9 + uv.y * 6.0) * 0.022;
        float w2 = cos(uv.x * 9.5 - flow * 2.6 - uv.y * 11.0) * 0.012;
        float w3 = sin(uv.x * 16.0 - flow * 3.4 + uv.y * 15.0) * 0.006;
        float disp = (w1 + w2 + w3) * (0.35 + 0.65 * centerMask);
        pos.y += disp;
        vWaveH = disp;

        vec4 wp = modelMatrix * vec4(pos, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform vec3 uSkyTop;
      uniform vec3 uSkyHorizon;
      uniform vec3 uFogColor;
      uniform float uFogDensity;
      uniform float uNightGlow;
      uniform vec3 uBoatPos;
      uniform vec3 uBoatDir;

      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying float vWaveH;

      // Smooth procedural value noise for organic running water caustics & ripples
      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float vnoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }

      // Flowing multi-octave water height for analytical normal perturbation
      float waterHeight(vec2 p, float t) {
        vec2 p1 = vec2(p.x * 3.4 - t * 1.15, p.y * 5.2 + sin(p.x * 1.6 - t * 0.6) * 0.35);
        vec2 p2 = vec2(p.x * 7.2 - t * 1.85, p.y * 10.5 - t * 0.25);
        vec2 p3 = vec2(p.x * 14.5 - t * 2.55, p.y * 18.0 + t * 0.32);
        float n = vnoise(p1) * 0.55 + vnoise(p2) * 0.3 + vnoise(p3) * 0.15;
        return n;
      }

      void main() {
        float t = uTime;
        // Streamline flow UV (slightly faster current in center than edges)
        float bankDist = min(vUv.y, 1.0 - vUv.y); // 0 at edge, 0.5 at center
        float flowSpeed = 0.72 + 0.45 * smoothstep(0.0, 0.35, bankDist);
        vec2 flowUv = vec2(vUv.x, vUv.y);

        // Compute animated running-water surface normal via finite differences
        float eps = 0.04;
        float hC = waterHeight(flowUv, t * flowSpeed);
        float hX = waterHeight(flowUv + vec2(eps, 0.0), t * flowSpeed);
        float hY = waterHeight(flowUv + vec2(0.0, eps), t * flowSpeed);
        vec3 N = normalize(vec3((hC - hX) * 2.8, 1.0, (hC - hY) * 2.8));

        vec3 V = normalize(cameraPosition - vWorldPos);
        vec3 L = normalize(uSunDir);

        // Physical Fresnel term (clear looking down, mirror-like at low grazing angles)
        float ndotv = clamp(dot(N, V), 0.0, 1.0);
        float fresnel = 0.06 + 0.94 * pow(1.0 - ndotv, 3.6);

        // Clear Parisian Seine water tint (crystal teal-aqua shallows -> deep emerald-sapphire center)
        vec3 shallowWater = vec3(0.16, 0.45, 0.50);
        vec3 deepWater    = vec3(0.05, 0.18, 0.28);
        float depthFactor = smoothstep(0.02, 0.34, bankDist);
        vec3 waterBody = mix(shallowWater, deepWater, depthFactor);

        // Subsurface running-water light caustics dancing on shallow/clear water
        float caust1 = vnoise(vec2(vUv.x * 8.5 - t * 1.9, vUv.y * 13.0 + sin(t + vUv.x) * 0.4));
        float caust2 = vnoise(vec2(vUv.x * 13.0 - t * 2.4, vUv.y * 18.0 - t * 0.4));
        float caustic = pow(clamp(caust1 * caust2 * 2.4, 0.0, 1.0), 2.4);
        waterBody += vec3(0.24, 0.46, 0.52) * caustic * (1.0 - uNightGlow * 0.55) * 0.85;

        // Dynamic Sky Reflection
        vec3 R = reflect(-V, N);
        float skyGrad = clamp(R.y * 0.8 + 0.2, 0.0, 1.0);
        vec3 skyRefl = mix(uSkyHorizon, uSkyTop, skyGrad);

        // Crisp Sun / Moon Specular Glitter on Running Ripples
        vec3 H = normalize(L + V);
        float spec = pow(max(dot(N, H), 0.0), 110.0) * 1.55;
        float broadGlint = pow(max(dot(N, H), 0.0), 18.0) * 0.28;
        vec3 specularCol = uSunColor * (spec + broadGlint);

        // Warm Golden Shimmering City & Bridge Lamp Reflections at Dusk/Night!
        float shimmerMask = pow(clamp(vnoise(vec2(vUv.x * 6.0 - t * 1.4, vUv.y * 14.0)), 0.0, 1.0), 2.2);
        float bankGlow = smoothstep(0.42, 0.04, bankDist);
        vec3 cityRefl = vec3(1.0, 0.76, 0.36) * shimmerMask * (0.28 + 0.72 * bankGlow) * uNightGlow * 0.78;

        // Subtle White Current Streaks & Quay Shoreline Foam
        float edgeFoam = smoothstep(0.065, 0.0, bankDist) * (0.45 + 0.55 * vnoise(vec2(vUv.x * 18.0 - t * 2.2, vUv.y * 22.0)));
        float currentStreak = smoothstep(0.76, 0.94, hC) * 0.16;

        // Live V-Shaped Foam Wake Behind the Bateaux Mouches Cruise Boat!
        vec2 toFrag = vWorldPos.xz - uBoatPos.xz;
        vec2 bFwd = normalize(uBoatDir.xz + vec2(0.0001));
        vec2 bSide = vec2(-bFwd.y, bFwd.x);
        float behindBoat = -dot(toFrag, bFwd);
        float latDist = abs(dot(toFrag, bSide));
        float boatWake = 0.0;
        if (behindBoat > 0.4 && behindBoat < 5.2) {
          float vSpread = 0.22 + behindBoat * 0.24;
          float arm = exp(-pow((latDist - vSpread) * 4.5, 2.0));
          float centerTrail = exp(-pow(latDist * 4.2, 2.0)) * 0.55;
          float fade = smoothstep(5.2, 0.8, behindBoat) * smoothstep(0.4, 1.1, behindBoat);
          float ripple = 0.6 + 0.4 * sin(behindBoat * 9.0 - t * 10.0);
          boatWake = (arm + centerTrail) * fade * ripple * 0.85;
        }

        vec3 color = mix(waterBody, skyRefl, clamp(fresnel * 0.78, 0.14, 0.84));
        color += specularCol + cityRefl;
        color = mix(color, vec3(0.88, 0.95, 1.0), clamp(edgeFoam * 0.52 + currentStreak + boatWake, 0.0, 0.88));

        // Exponential Distance Fog matching ctx.scene.fog
        float camDist = length(cameraPosition - vWorldPos);
        float fogFactor = 1.0 - exp(-pow(camDist * uFogDensity, 2.0));
        color = mix(color, uFogColor, clamp(fogFactor, 0.0, 1.0));

        // Crystal-clear transparency near banks & straight-down view, richer opacity at grazing angles
        float alpha = clamp(0.56 + depthFactor * 0.2 + fresnel * 0.22 + edgeFoam * 0.25 + boatWake * 0.35, 0.58, 0.96);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });

  const riverMesh = new THREE.Mesh(riverGeo, riverMat);
  riverMesh.renderOrder = 2;
  ctx.scene.add(riverMesh);

  // Two-Tiered Parisian Cream Limestone Quay Walls & Lower Pedestrian Berges de Seine!
  const quayMat = new THREE.MeshStandardMaterial({ color: 0xc9beaa, roughness: 0.76 });
  const walkLedgeMat = new THREE.MeshStandardMaterial({ color: 0x8b8478, roughness: 0.88 });
  [quayLeft, quayRight].forEach((arr) => {
    const curve = new THREE.CatmullRomCurve3(arr);
    const wall = new THREE.Mesh(new THREE.TubeGeometry(curve, 110, 0.2, 4, false), quayMat);
    wall.scale.y = 1.55;
    wall.receiveShadow = true;
    ctx.scene.add(wall);
  });
  [promenadeLeft, promenadeRight].forEach((arr) => {
    const curve = new THREE.CatmullRomCurve3(arr);
    const ledge = new THREE.Mesh(new THREE.TubeGeometry(curve, 100, 0.14, 4, false), walkLedgeMat);
    ledge.scale.y = 0.45;
    ctx.scene.add(ledge);
  });

  // Iconic Dark-Green Parisian Bouquinistes Bookstalls along Quai de la Mégisserie!
  const bouqMat = new THREE.MeshStandardMaterial({ color: 0x194734, roughness: 0.6 });
  for (let b = 0; b < 8; b++) {
    const bt = 0.25 + b * 0.015;
    const pt = ctx.seineCurve.getPoint(bt);
    const tan = ctx.seineCurve.getTangent(bt).normalize();
    const norm = new THREE.Vector3(-tan.z, 0, tan.x);
    const hw = seineHalfWidthAt(pt.x, pt.z) + 0.42;
    const stall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.24, 0.22), bouqMat);
    stall.position.set(pt.x + norm.x * hw, 0.44, pt.z + norm.z * hw);
    stall.rotation.y = Math.atan2(tan.x, tan.z);
    ctx.scene.add(stall);
  }

  // Authentic Boat-Shaped Île de la Cité (aligned along true SE axis -0.62 rad under Place Dauphine, Sainte-Chapelle & Notre-Dame!)
  const citePivot = new THREE.Group();
  const citeShape = new THREE.Shape();
  citeShape.moveTo(-9.6, 0);
  citeShape.quadraticCurveTo(-4.8, 2.25, 1.8, 2.35);
  citeShape.quadraticCurveTo(7.8, 2.05, 10.2, 0.25);
  citeShape.quadraticCurveTo(7.8, -1.95, 1.8, -2.15);
  citeShape.quadraticCurveTo(-4.8, -2.15, -9.6, 0);

  const islandTopMat = new THREE.MeshStandardMaterial({
    map: ctx.surfaces.islandTex,
    bumpMap: ctx.surfaces.islandBumpTex,
    bumpScale: 0.06,
    roughness: 0.8,
  });
  const citeGeo = new THREE.ExtrudeGeometry(citeShape, { depth: 0.36, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 });
  const citeMesh = new THREE.Mesh(citeGeo, [islandTopMat, quayMat]);
  citeMesh.rotation.x = Math.PI / 2;
  citeMesh.position.y = 0.44;
  citeMesh.receiveShadow = true;
  citePivot.add(citeMesh);
  // Cream limestone retaining parapet around Île de la Cité
  citePivot.position.set(ctx.citeCenterXZ[0], 0, ctx.citeCenterXZ[1]);
  citePivot.rotation.y = -0.62;
  ctx.scene.add(citePivot);

  // Authentic Neighboring Île Saint-Louis (East of Notre-Dame) + Classic Quai Townhomes!
  const stlPivot = new THREE.Group();
  const stlShape = new THREE.Shape();
  stlShape.moveTo(-5.2, 0);
  stlShape.quadraticCurveTo(-2.4, 1.35, 1.2, 1.32);
  stlShape.quadraticCurveTo(4.2, 1.05, 5.4, 0.1);
  stlShape.quadraticCurveTo(4.0, -1.15, 0.8, -1.28);
  stlShape.quadraticCurveTo(-2.6, -1.32, -5.2, 0);
  const stlGeo = new THREE.ExtrudeGeometry(stlShape, { depth: 0.36, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 });
  const stlMesh = new THREE.Mesh(stlGeo, [islandTopMat, quayMat]);
  stlMesh.rotation.x = Math.PI / 2;
  stlMesh.position.y = 0.43;
  stlMesh.receiveShadow = true;
  stlPivot.add(stlMesh);
  // Classic 17th-century cream-stone hôtels particuliers along Rue Saint-Louis en l'Île
  const stlHouseMat = new THREE.MeshStandardMaterial({ color: 0xe6dbc6, roughness: 0.72 });
  const stlRoofMat = new THREE.MeshStandardMaterial({ color: 0x4b5c72, roughness: 0.58 });
  for (let hx = -3.4; hx <= 3.4; hx += 1.35) {
    [-0.48, 0.48].forEach((hz) => {
      const hb = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.78, 0.62), stlHouseMat);
      hb.position.set(hx, 0.82, hz);
      hb.castShadow = true;
      stlPivot.add(hb);
      const hr = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.18, 0.65), stlRoofMat);
      hr.position.set(hx, 1.28, hz);
      stlPivot.add(hr);
    });
  }
  stlPivot.position.set(ctx.ileStLouisXZ[0], 0, ctx.ileStLouisXZ[1]);
  stlPivot.rotation.y = -0.52;
  ctx.scene.add(stlPivot);

  // Iconic Narrow Tree-Lined Île aux Cygnes (SW Seine below Pont de Bir-Hakeim + mini Statue of Liberty!)
  const cygC = geoToXZ(48.8524, 2.2833);
  const cygG = new THREE.Group();
  const cygDeck = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.28, 10.6), new THREE.MeshStandardMaterial({ color: 0xbcb29f, roughness: 0.82 }));
  cygDeck.position.y = 0.24;
  cygG.add(cygDeck);
  const cygTreeMat = new THREE.MeshStandardMaterial({ color: 0x2b5544, roughness: 0.88 });
  for (let cz = -4.2; cz <= 4.2; cz += 1.2) {
    const ct = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), cygTreeMat);
    ct.position.set(0, 0.56, cz);
    cygG.add(ct);
  }
  // Miniature Parisian Statue of Liberty at SW tip facing West!
  const libBase = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.28), quayMat);
  libBase.position.set(0, 0.5, 5.0);
  cygG.add(libBase);
  const libStat = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.52, 6), new THREE.MeshStandardMaterial({ color: 0x4ba694, roughness: 0.45, metalness: 0.5 }));
  libStat.position.set(0, 0.9, 5.0);
  cygG.add(libStat);
  cygG.position.set(cygC[0], 0, cygC[1]);
  cygG.rotation.y = 0.72;
  ctx.scene.add(cygG);

  // Iconic Parisian Bridges (with true arched decks & golden lamps)
  const stoneBridgeMat = new THREE.MeshStandardMaterial({ color: 0xd6ccb6, roughness: 0.65 });
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x384054, roughness: 0.75 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf6cf68, emissive: 0x996d1b, emissiveIntensity: 0.55, metalness: 0.88, roughness: 0.22 });
  ctx.monumentGlowMaterials.push(goldMat);

  function addBridge(x, z, rotY, width, length, style) {
    const g = new THREE.Group();
    // Graceful subtle arch along length
    const segs = 7;
    for (let i = 0; i < segs; i++) {
      const f0 = -0.5 + i / segs;
      const f1 = -0.5 + (i + 1) / segs;
      const fm = (f0 + f1) * 0.5;
      const archY = 0.28 + Math.cos(fm * Math.PI) * 0.24;
      const seg = new THREE.Mesh(new THREE.BoxGeometry(width, 0.22, length / segs + 0.08), deckMat);
      seg.position.set(0, archY, fm * length);
      seg.castShadow = true;
      g.add(seg);

      // Stone parapets
      [-width / 2 + 0.06, width / 2 - 0.06].forEach(px => {
        const par = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, length / segs + 0.06), stoneBridgeMat);
        par.position.set(px, archY + 0.16, fm * length);
        g.add(par);
      });
    }

    // Bridge lamps
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe49e });
    for (let lz = -length * 0.42; lz <= length * 0.42; lz += 1.45) {
      const archY = 0.28 + Math.cos((lz / length) * Math.PI) * 0.24;
      [-width / 2 + 0.08, width / 2 - 0.08].forEach(lx => {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), bulbMat);
        b.position.set(lx, archY + 0.46, lz);
        g.add(b);
      });
    }

    // Pont Alexandre III: 4 monumental stone pylons + gilded winged Pegasus statues + ornate gilded center arch!
    if (style === 'alexandre') {
      [
        [-width / 2 - 0.16, -length / 2 + 0.18],
        [width / 2 + 0.16, -length / 2 + 0.18],
        [-width / 2 - 0.16, length / 2 - 0.18],
        [width / 2 + 0.16, length / 2 - 0.18],
      ].forEach(([px, pz]) => {
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.5), stoneBridgeMat);
        base.position.set(px, 0.4, pz);
        g.add(base);
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.75, 0.34), stoneBridgeMat);
        col.position.set(px, 1.45, pz);
        col.castShadow = true;
        g.add(col);
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.18, 0.46), stoneBridgeMat);
        cap.position.set(px, 2.38, pz);
        g.add(cap);
        // Winged Gilded Pegasus sculpture atop pylon
        const pegasus = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), goldMat);
        pegasus.scale.set(0.85, 1.2, 1.3);
        pegasus.position.set(px, 2.72, pz);
        g.add(pegasus);
        [-0.22, 0.22].forEach(wx => {
          const wing = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.05), goldMat);
          wing.position.set(px + wx, 2.82, pz);
          wing.rotation.z = wx > 0 ? 0.5 : -0.5;
          g.add(wing);
        });
      });
      // Gilded central crest medallions on both sides of bridge
      [-width / 2 - 0.06, width / 2 + 0.06].forEach(gx => {
        const crest = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.34, 0.8), goldMat);
        crest.position.set(gx, 0.55, 0);
        g.add(crest);
      });
    }

    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    ctx.scene.add(g);
  }

  // Exact WGS84 Bridge Placements & Proportions spanning the real Seine width!
  const bIena = geoToXZ(48.8599, 2.2921);
  const bAlma = geoToXZ(48.8641, 2.3018);
  const bAlex = geoToXZ(48.8639, 2.3136);
  const bConc = geoToXZ(48.8634, 2.3196);
  const bSeng = geoToXZ(48.8616, 2.3245);
  const bArts = geoToXZ(48.8584, 2.3375);
  const bNeuf = geoToXZ(48.8571, 2.3413);
  const bDoub = geoToXZ(48.8524, 2.3484);
  const bArco = geoToXZ(48.8552, 2.3510);
  const bStLo = geoToXZ(48.8526, 2.3532);
  const bSull = geoToXZ(48.8495, 2.3612);

  addBridge(bIena[0], bIena[1], 0.68, 1.05, 4.15, 'stone');      // Pont d'Iéna
  addBridge(bAlma[0], bAlma[1], 0.14, 0.95, 4.0, 'stone');       // Pont de l'Alma
  addBridge(bAlex[0], bAlex[1], -0.05, 1.4, 4.25, 'alexandre');  // Pont Alexandre III (Golden Pylons!)
  addBridge(bConc[0], bConc[1], 0.25, 1.0, 4.05, 'stone');       // Pont de la Concorde
  addBridge(bSeng[0], bSeng[1], 0.36, 0.65, 4.0, 'foot');        // Passerelle Léopold-Sédar-Senghor
  addBridge(bArts[0], bArts[1], 0.44, 0.68, 4.0, 'foot');        // Pont des Arts
  addBridge(bNeuf[0], bNeuf[1], 0.48, 1.15, 5.75, 'stone');      // Pont Neuf
  addBridge(bDoub[0], bDoub[1], 0.52, 0.68, 2.7, 'foot');        // Pont au Double (Notre-Dame -> Shakespeare & Co)
  addBridge(bArco[0], bArco[1], 0.46, 0.85, 2.85, 'stone');      // Pont d'Arcole (Notre-Dame -> Hôtel de Ville)
  addBridge(bStLo[0], bStLo[1], -0.55, 0.55, 1.85, 'foot');      // Pont Saint-Louis (Île de la Cité <-> Île Saint-Louis)
  addBridge(bSull[0], bSull[1], 0.58, 0.95, 4.85, 'stone');      // Pont Sully (Île Saint-Louis -> Right & Left Banks)

  // Illuminated Bateaux Mouches Cruise Boat gliding along the Seine!
  ctx.bateauxBoat = new THREE.Group();
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.24, 2.1),
    new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.35 })
  );
  hull.position.y = 0.22;
  ctx.bateauxBoat.add(hull);
  const glassDeck = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.24, 1.45),
    new THREE.MeshBasicMaterial({ color: 0xffe59e })
  );
  glassDeck.position.y = 0.42;
  ctx.bateauxBoat.add(glassDeck);
  const boatLight = new THREE.PointLight(0xffd275, 1.0, 7);
  boatLight.position.set(0, 0.75, 0);
  ctx.bateauxBoat.add(boatLight);
  ctx.scene.add(ctx.bateauxBoat);
}


export function buildSkyAndTerrain() {
  // Photorealistic Procedural Atmospheric Real Sky Dome
  // (Rayleigh zenith-to-horizon scatter, Mie sun/moon corona & disc, drifting multi-octave winter clouds & night stars)
  ctx.skyUniforms = {
    topColor: { value: liveLight.skyTop.clone() },
    horizonColor: { value: liveLight.skyHorizon.clone() },
    uFogColor: { value: liveLight.fog.clone() },
    uSunDir: { value: liveLight.dirPos.clone().normalize() },
    uSunColor: { value: liveLight.dirColor.clone() },
    uTime: { value: 0 },
    uNightFactor: { value: liveLight.starOpacity },
  };
  const skyMat = new THREE.ShaderMaterial({
    uniforms: ctx.skyUniforms,
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 uFogColor;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform float uTime;
      uniform float uNightFactor;
      varying vec3 vWorldPos;

      float hash21(vec2 p) {
        p = fract(p * vec2(234.34, 435.345));
        p += dot(p, p + 34.23);
        return fract(p.x * p.y);
      }

      float vnoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
        for (int i = 0; i < 4; i++) {
          v += a * vnoise(p);
          p = rot * p * 2.04 + vec2(17.1, 31.7);
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 dir = normalize(vWorldPos);
        float h = dir.y;
        float hClamped = max(h, 0.0);

        // 1. Atmospheric Rayleigh Zenith-to-Horizon Gradient + Horizon Haze Band
        float zenithPow = pow(hClamped, 0.52);
        vec3 col = mix(horizonColor, topColor, zenithPow);

        vec3 sunDir = normalize(uSunDir);
        float sunDot = dot(dir, sunDir);
        float dayMask = clamp(1.0 - uNightFactor * 1.15, 0.0, 1.0);
        float nightMask = clamp((uNightFactor - 0.15) * 1.35, 0.0, 1.0);

        // 2. Solar Mie Atmospheric Scattering Halo + Sunset Horizon Glow
        float horizonBand = exp(-abs(hClamped) * 6.5);
        float sunGlowWide = pow(max(sunDot, 0.0), 5.0);
        float sunGlowTight = pow(max(sunDot, 0.0), 64.0);
        float sunDisc = smoothstep(0.99925, 0.99972, sunDot);
        col += uSunColor * (sunGlowWide * 0.26 * (0.4 + 0.6 * horizonBand) + sunGlowTight * 0.42) * dayMask;
        col += mix(uSunColor, vec3(1.0, 0.98, 0.92), 0.7) * sunDisc * 1.45 * dayMask;

        // 3. Soft Silver Winter Moon & Subtle Lunar Halo at Night
        vec3 moonDir = normalize(vec3(-sunDir.x * 0.65, max(0.32, sunDir.y * 0.72), -sunDir.z * 0.75));
        float moonDot = dot(dir, moonDir);
        float moonHalo = pow(max(moonDot, 0.0), 18.0) * 0.22;
        float moonDisc = smoothstep(0.99945, 0.99975, moonDot);
        col += vec3(0.76, 0.85, 1.0) * moonHalo * nightMask;
        col += vec3(0.96, 0.97, 1.0) * moonDisc * 1.15 * nightMask;

        // 4. Procedural Multi-Octave Drifting Parisian Winter Clouds
        float cloudAlpha = 0.0;
        if (h > 0.015) {
          vec2 cloudUV = dir.xz / (h + 0.16);
          vec2 wind = vec2(uTime * 0.012, uTime * 0.005);
          float cBase = fbm(cloudUV * 0.62 + wind);
          float cDetail = fbm(cloudUV * 1.55 - wind * 0.7);
          float density = smoothstep(0.47, 0.78, cBase * 0.76 + cDetail * 0.28);
          float horizonFade = smoothstep(0.015, 0.22, h) * smoothstep(0.98, 0.55, h);
          cloudAlpha = density * horizonFade * mix(0.76, 0.44, nightMask);

          // Cloud self-shadowing & golden dusk / cool morning / moonlit rim lighting
          float cLit = clamp(fbm(cloudUV * 0.62 + wind + sunDir.xz * 0.14) * 1.25 - cBase * 0.45 + 0.35, 0.0, 1.0);
          vec3 cloudShadowCol = mix(topColor * 0.88, horizonColor * 0.75, 0.45);
          vec3 cloudSunCol = mix(vec3(0.97, 0.96, 0.95), uSunColor * 1.25, 0.62);
          vec3 cloudNightCol = mix(topColor * 1.25, vec3(0.32, 0.40, 0.56), 0.45 + 0.35 * max(moonDot, 0.0));
          vec3 cloudDayCol = mix(cloudShadowCol, cloudSunCol, clamp(cLit + sunGlowWide * 0.45, 0.0, 1.0));
          vec3 cloudCol = mix(cloudDayCol, cloudNightCol, nightMask);
          col = mix(col, cloudCol, cloudAlpha);
        }

        // 5. Fine Crisp High-Altitude Sky Stars (masked behind clouds at night)
        if (nightMask > 0.05 && h > 0.06) {
          vec2 starGrid = floor(dir.xz / (h + 0.25) * 85.0);
          float starSeed = hash21(starGrid);
          if (starSeed > 0.9935) {
            float tw = 0.55 + 0.45 * sin(uTime * 2.2 + starSeed * 250.0);
            col += vec3(0.95, 0.96, 1.0) * tw * nightMask * (1.0 - cloudAlpha * 0.92) * smoothstep(0.06, 0.28, h) * 0.85;
          }
        }

        // 6. Seamless Atmospheric Fog Blend right along the Paris Horizon
        float fogBlend = smoothstep(0.11, -0.02, h);
        col = mix(col, uFogColor, fogBlend * 0.85);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  });
  ctx.scene.add(new THREE.Mesh(new THREE.SphereGeometry(460, 48, 32), skyMat));

  // Ensure Seine centerline data is ready so terrain carves the riverbed & paints quays accurately!
  initSeineCurveData();

  // -------------------------------------------------------------------
  // SHARED HD SEAMLESS PBR SURFACE TEXTURE LIBRARY (512 x 512, FULL ANISOTROPY)
  // Eliminates ALL flat plastic/Roblox look on ground, parks, gravel, plazas & islands!
  // -------------------------------------------------------------------
  const maxAniso = Math.min(16, ctx.renderer.capabilities.getMaxAnisotropy());
  ctx.surfaces = (function createParisSurfaceTextures() {
    let s = 424242;
    const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

    function prepTex(canvas, repX, repY, isColor = true) {
      const t = new THREE.CanvasTexture(canvas);
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repX, repY);
      t.anisotropy = maxAniso;
      if (isColor) t.encoding = THREE.sRGBEncoding;
      return t;
    }

    // 1. Seamless Parisian Limestone Flagstone & Pavés Detail Tile (512x512, world-space detail + plazas)
    const sc = document.createElement('canvas'); sc.width = 512; sc.height = 512;
    const sctx = sc.getContext('2d');
    sctx.fillStyle = '#5c5a56'; // dark recessed mortar joints
    sctx.fillRect(0, 0, 512, 512);
    const rows = 16, cols = 16;
    const cw = 512 / cols, ch = 512 / rows;
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * (cw * 0.5);
      for (let c = -1; c <= cols; c++) {
        const x = c * cw + off;
        const y = r * ch;
        const v = Math.floor(136 + (rnd() - 0.5) * 42);
        const warm = Math.floor((rnd() - 0.4) * 10);
        sctx.fillStyle = `rgb(${v + warm}, ${v + Math.floor(warm * 0.6)}, ${v - Math.floor(warm * 0.4)})`;
        sctx.fillRect(x + 1.5, y + 1.5, cw - 3, ch - 3);
        // Subtle top-left stone bevel highlight & bottom-right bevel shadow
        sctx.fillStyle = 'rgba(255,252,244,0.16)';
        sctx.fillRect(x + 1.5, y + 1.5, cw - 3, 2);
        sctx.fillStyle = 'rgba(18,20,26,0.22)';
        sctx.fillRect(x + 1.5, y + ch - 3.5, cw - 3, 2);
      }
    }
    // Fine mineral stone speckle
    for (let i = 0; i < 6000; i++) {
      const px = rnd() * 512, py = rnd() * 512;
      sctx.fillStyle = i % 2 === 0 ? 'rgba(255,250,240,0.09)' : 'rgba(15,18,24,0.1)';
      sctx.fillRect(px, py, 2, 2);
    }

    // 2. Seamless Multi-Channel Micro-Detail Texture (R=asphalt aggregate, G=grass blades, B=limestone speckle)
    const mc = document.createElement('canvas'); mc.width = 512; mc.height = 512;
    const mctx = mc.getContext('2d');
    const mImg = mctx.createImageData(512, 512);
    const md = mImg.data;
    for (let y = 0; y < 512; y++) {
      const stripe = Math.sin((y / 512) * Math.PI * 12) * 14;
      for (let x = 0; x < 512; x++) {
        const idx = (y * 512 + x) * 4;
        const n1 = rnd();
        const n2 = rnd();
        const n3 = rnd();
        const wave = Math.sin((x * 0.08) + Math.cos(y * 0.06) * 1.4) * 16;
        md[idx] = Math.max(0, Math.min(255, Math.floor(128 + (n1 - 0.5) * 110 + wave * 0.5)));       // R: asphalt mineral aggregate
        md[idx + 1] = Math.max(0, Math.min(255, Math.floor(128 + (n2 - 0.5) * 95 + stripe)));        // G: organic mown grass grain
        md[idx + 2] = Math.max(0, Math.min(255, Math.floor(128 + (n3 - 0.5) * 125)));                // B: limestone/gravel micro-pebble
        md[idx + 3] = 255;
      }
    }
    mctx.putImageData(mImg, 0, 0);

    // 3. Seamless Manicured French Garden Turf Texture (512x512, Tuileries/Champ de Mars/Luxembourg!)
    const lc = document.createElement('canvas'); lc.width = 512; lc.height = 512;
    const lctx = lc.getContext('2d');
    lctx.fillStyle = '#2d5a43';
    lctx.fillRect(0, 0, 512, 512);
    // Subtle royal French garden mowing bands
    for (let x = 0; x < 512; x += 64) {
      lctx.fillStyle = (x / 64) % 2 === 0 ? 'rgba(255,255,240,0.045)' : 'rgba(8,24,14,0.06)';
      lctx.fillRect(x, 0, 32, 512);
    }
    for (let i = 0; i < 14000; i++) {
      const gx = rnd() * 512, gy = rnd() * 512;
      const pick = i % 4;
      lctx.fillStyle = pick === 0 ? 'rgba(92,154,102,0.22)' : pick === 1 ? 'rgba(22,52,36,0.28)' : pick === 2 ? 'rgba(64,122,82,0.18)' : 'rgba(130,156,98,0.12)';
      lctx.fillRect(gx, gy, 1.5, 4 + rnd() * 3);
    }

    // 4. Seamless Parisian Crushed Limestone Park Gravel (*Sable Stabilisé*, 512x512)
    const vc = document.createElement('canvas'); vc.width = 512; vc.height = 512;
    const vctx = vc.getContext('2d');
    vctx.fillStyle = '#cbc0a8';
    vctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 16000; i++) {
      const px = rnd() * 512, py = rnd() * 512;
      const p = i % 3;
      vctx.fillStyle = p === 0 ? 'rgba(255,252,244,0.24)' : p === 1 ? 'rgba(116,104,86,0.22)' : 'rgba(168,154,132,0.2)';
      vctx.fillRect(px, py, 2, 2);
    }

    // 5. Seamless Parisian Granite Plaza Cobblestones (512x512, warm stone-slate for islands & squares)
    const pc = document.createElement('canvas'); pc.width = 512; pc.height = 512;
    const pctx = pc.getContext('2d');
    pctx.fillStyle = '#383d48';
    pctx.fillRect(0, 0, 512, 512);
    const pShades = ['#8e8980', '#7c7a76', '#9b9487', '#6f727a', '#86827b'];
    for (let r = 0; r < 32; r++) {
      const off = (r % 2) * 8;
      for (let c = -1; c <= 32; c++) {
        pctx.fillStyle = pShades[(r * 11 + c * 5 + 320) % pShades.length];
        pctx.fillRect(c * 16 + off + 1, r * 16 + 1, 14, 14);
        pctx.fillStyle = 'rgba(255,250,242,0.12)';
        pctx.fillRect(c * 16 + off + 1, r * 16 + 1, 14, 2);
      }
    }

    return {
      stoneDetailTex: prepTex(sc, 1, 1, false),
      microDetailTex: prepTex(mc, 1, 1, false),
      grassTex: prepTex(lc, 3, 3, true),
      grassBumpTex: prepTex(mc, 4, 4, false),
      gravelTex: prepTex(vc, 4, 4, true),
      gravelBumpTex: prepTex(mc, 5, 5, false),
      plazaTex: prepTex(pc, 4, 4, true),
      plazaBumpTex: prepTex(sc, 4, 4, false),
      islandTex: prepTex(pc, 0.75, 0.75, true),
      islandBumpTex: prepTex(sc, 0.75, 0.75, false),
    };
  })();

  // -------------------------------------------------------------------
  // ZERO-BLUR ULTRA-CRISP PARISIAN LIMESTONE TERRAIN + VERTEX BIOMES!
  // Instead of stretching a single blurry bitmap over 17.7km, the ground
  // uses a seamless 512x512 Lutetian limestone flagstone tile repeated
  // 96x80 times (1 texel = ~34cm, 16x anisotropy -> RAZOR-SHARP AT ANY ZOOM!)
  // paired with smooth vertex-color landscape biomes + 100% REAL 3D vector
  // OSM roads, 3D outer parks, 3D Canal Saint-Martin & 8,490 REAL buildings!
  // -------------------------------------------------------------------
  const TERRAIN_W = 390;
  const TERRAIN_H = 320;
  const groundTileTex = ctx.surfaces.stoneDetailTex.clone();
  groundTileTex.needsUpdate = true;
  groundTileTex.encoding = THREE.sRGBEncoding;
  groundTileTex.repeat.set(96, 80);
  groundTileTex.anisotropy = maxAniso;

  const groundBumpTex = ctx.surfaces.stoneDetailTex.clone();
  groundBumpTex.needsUpdate = true;
  groundBumpTex.repeat.set(96, 80);
  groundBumpTex.anisotropy = maxAniso;

  // High-Resolution Sculpted Paris Topography Mesh (220 x 180) with Carved Seine Valley & Smooth Biome Vertex Colors!
  const terrainGeo = new THREE.PlaneGeometry(TERRAIN_W, TERRAIN_H, 220, 180);
  terrainGeo.rotateX(-Math.PI / 2);
  const posAttr = terrainGeo.attributes.position;
  const vColors = new Float32Array(posAttr.count * 3);

  const cCoreStone = new THREE.Color(0xcbc4b6);   // Warm Haussmannian Parisian Limestone
  const cWarmHistoric = new THREE.Color(0xc4b9a6);// Le Marais / Quartier Latin Warm Sandstone
  const cOuterSlate = new THREE.Color(0x525a6a);  // Outer Arrondissements Architectural Slate
  const cHorizon = new THREE.Color(0x232b3c);     // Seamless Horizon Fog Edge
  const cWoodland = new THREE.Color(0x3a6449);    // Bois de Boulogne & Montmartre Green Slopes
  const cRiverBed = new THREE.Color(0x162b3b);    // Carved Seine Canyon Floor
  const cQuayEdge = new THREE.Color(0xd8cfc0);    // Crisp Pale Limestone River Embankment
  const boisC = geoToXZ(48.8675, 2.2565);
  const maraisC = geoToXZ(48.8560, 2.3580);
  const latinC = geoToXZ(48.8500, 2.3420);
  const tmpCol = new THREE.Color();

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    let y = getTerrainY(x, z);

    // Radial architectural stone gradient (smooth per-vertex, zero bitmap blur!)
    const rNorm = Math.hypot((x + 14) / 142, z / 118);
    if (rNorm < 0.62) {
      tmpCol.copy(cCoreStone).lerp(cOuterSlate, Math.pow(rNorm / 0.62, 2.2) * 0.42);
    } else if (rNorm < 1.0) {
      tmpCol.copy(cCoreStone).lerp(cOuterSlate, 0.42).lerp(cOuterSlate, (rNorm - 0.62) / 0.38);
    } else {
      tmpCol.copy(cOuterSlate).lerp(cHorizon, Math.min(1, (rNorm - 1.0) / 0.45));
    }

    // Historic district subtle warmth (Le Marais & Quartier Latin)
    const dMar = Math.hypot(x - maraisC[0], z - maraisC[1]);
    if (dMar < 24) tmpCol.lerp(cWarmHistoric, (1 - dMar / 24) * 0.45);
    const dLat = Math.hypot(x - latinC[0], z - latinC[1]);
    if (dLat < 24) tmpCol.lerp(cWarmHistoric, (1 - dLat / 24) * 0.45);

    // Natural woodland tints for Bois de Boulogne, Butte Montmartre & Belleville
    const dBois = Math.hypot((x - boisC[0]) / 26, (z - boisC[1]) / 36);
    if (dBois < 1.15) tmpCol.lerp(cWoodland, Math.max(0, 1 - dBois / 1.15) * 0.85);
    const dMont = Math.hypot(x - MONTMARTRE_HILL_XZ[0], z - MONTMARTRE_HILL_XZ[1]);
    if (dMont < 16) tmpCol.lerp(cWoodland, (1 - dMont / 16) * 0.35);
    const dBell = Math.hypot(x - BELLEVILLE_HILL_XZ[0], z - BELLEVILLE_HILL_XZ[1]);
    if (dBell < 20) tmpCol.lerp(cWoodland, (1 - dBell / 20) * 0.32);

    // Physically carve the Seine river valley beneath the embankment so water sits recessed & never Z-fights!
    const riverClr = getSeineClearance(x, z);
    if (riverClr < 0.65) {
      const carve = Math.max(0, Math.min(1, (0.65 - riverClr) / 1.05));
      y -= carve * 0.44;
      tmpCol.lerp(cRiverBed, carve * 0.92);
    } else if (riverClr < 2.2) {
      const qf = 1 - (riverClr - 0.65) / 1.55;
      tmpCol.lerp(cQuayEdge, qf * 0.45);
    }

    posAttr.setY(i, y);
    vColors[i * 3] = tmpCol.r;
    vColors[i * 3 + 1] = tmpCol.g;
    vColors[i * 3 + 2] = tmpCol.b;
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(vColors, 3));
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    map: groundTileTex,
    bumpMap: groundBumpTex,
    bumpScale: 0.055,
    vertexColors: true,
    roughness: 0.86,
    metalness: 0.04,
  });
  const terrain = new THREE.Mesh(terrainGeo, terrainMat);
  terrain.receiveShadow = true;
  ctx.scene.add(terrain);

  // Crisp 3D Outer Parisian Parks & Glossy Canal Saint-Martin (ZERO blurry painted blobs!)
  const outerParkMat = new THREE.MeshStandardMaterial({
    map: ctx.surfaces.grassTex,
    bumpMap: ctx.surfaces.grassBumpTex,
    bumpScale: 0.04,
    roughness: 0.92,
  });
  const outerParkRimMat = new THREE.MeshStandardMaterial({ color: 0xd4cbb8, roughness: 0.72 });
  [
    [48.8797, 2.3089, 5.2, 3.8, -0.2],  // Parc Monceau (8e)
    [48.8439, 2.3598, 8.2, 3.6, -0.35], // Jardin des Plantes (5e)
    [48.8643, 2.3608, 2.6, 2.2, 0],     // Square du Temple (3e)
    [48.8870, 2.3168, 3.6, 2.6, 0.2],   // Square des Batignolles (17e)
    [48.8805, 2.3828, 7.2, 5.4, 0.15],  // Parc des Buttes-Chaumont (19e)
    [48.8415, 2.2745, 5.8, 3.4, -0.45], // Parc André-Citroën (15e)
    [48.8360, 2.3825, 6.8, 3.2, -0.4],  // Parc de Bercy (12e)
  ].forEach(([la, lo, rx, rz, rot]) => {
    const [px, pz] = geoToXZ(la, lo);
    const py = getTerrainY(px, pz);
    const pg = new THREE.Group();
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.04, 1.06, 0.07, 24), outerParkRimMat);
    rim.scale.set(rx, 1, rz);
    rim.position.y = 0.035;
    pg.add(rim);
    const turf = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.09, 24), outerParkMat);
    turf.scale.set(rx, 1, rz);
    turf.position.y = 0.048;
    turf.receiveShadow = true;
    pg.add(turf);
    pg.position.set(px, py, pz);
    pg.rotation.y = rot;
    ctx.scene.add(pg);
  });

  // Crisp 3D Canal Saint-Martin & Bassin de l'Arsenal Waterway
  const canalPts = [
    [48.8458, 2.3652], [48.8528, 2.3688], [48.8678, 2.3662],
    [48.8732, 2.3635], [48.8825, 2.3698], [48.8910, 2.3775],
  ].map(([la, lo]) => {
    const [cx, cz] = geoToXZ(la, lo);
    return new THREE.Vector3(cx, getTerrainY(cx, cz) + 0.06, cz);
  });
  const canalCurve = new THREE.CatmullRomCurve3(canalPts);
  const canalWater = new THREE.Mesh(
    new THREE.TubeGeometry(canalCurve, 64, 0.42, 6, false),
    new THREE.MeshStandardMaterial({ color: 0x1b5c7e, emissive: 0x0b2e44, emissiveIntensity: 0.35, roughness: 0.12, metalness: 0.72 })
  );
  canalWater.scale.y = 0.12;
  ctx.scene.add(canalWater);
}

