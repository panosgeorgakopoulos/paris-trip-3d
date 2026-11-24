// Hand-crafted 3D Paris landmarks, museums, Eiffel Tower & 12 historic churches
import { getTerrainY, P } from '../config.js';
import { ctx } from '../state.js';
import { createCircleTexture, createMonumentTextures } from '../textures.js';

export function buildParisLandmarks() {
  const limestone = new THREE.MeshStandardMaterial({ color: 0xebe1cc, roughness: 0.62 });
  const warmStone = new THREE.MeshStandardMaterial({ color: 0xe2d5ba, roughness: 0.68 });
  const darkSlate = new THREE.MeshStandardMaterial({ color: 0x415066, roughness: 0.55, metalness: 0.25 });
  const verdigris = new THREE.MeshStandardMaterial({
    color: 0x49a695,
    emissive: 0x1a4f46,
    emissiveIntensity: 0.35,
    roughness: 0.38,
    metalness: 0.48,
  });
  const warmGlow = new THREE.MeshStandardMaterial({
    color: 0xf8d786,
    emissive: 0xe0a43b,
    emissiveIntensity: 0.78,
    roughness: 0.3,
    metalness: 0.45,
  });
  const goldLeaf = new THREE.MeshStandardMaterial({
    color: 0xffdc7d,
    emissive: 0xb07c1a,
    emissiveIntensity: 0.58,
    metalness: 0.9,
    roughness: 0.2,
  });
  const brickMat = new THREE.MeshStandardMaterial({ color: 0xa64e44, roughness: 0.8 });
  const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x4b5c4d, metalness: 0.65, roughness: 0.35 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xcbeeff,
    emissive: 0xffd27a,
    emissiveIntensity: 0.45,
    transparent: true,
    opacity: 0.68,
    roughness: 0.08,
    metalness: 0.3,
  });

  // High-Detail Procedural Monument Materials (Museums, Churches & Plazas)
  const mTex = createMonumentTextures();
  const palaceMat = new THREE.MeshStandardMaterial({
    map: mTex.palaceDiff,
    emissive: new THREE.Color(0xffc86b),
    emissiveMap: mTex.palaceEm,
    emissiveIntensity: 0.55,
    roughness: 0.65,
  });
  const gothicMat = new THREE.MeshStandardMaterial({
    map: mTex.gothicDiff,
    emissive: new THREE.Color(0xffd29e),
    emissiveMap: mTex.gothicEm,
    emissiveIntensity: 0.72,
    roughness: 0.68,
  });
  const roseWindowMat = new THREE.MeshStandardMaterial({
    map: mTex.roseTex,
    emissiveMap: mTex.roseTex,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.95,
    roughness: 0.2,
  });
  const sainteChapelleTexMat = new THREE.MeshStandardMaterial({
    map: mTex.scTex,
    emissiveMap: mTex.scTex,
    emissive: new THREE.Color(0xdcb8ff),
    emissiveIntensity: 0.95,
    roughness: 0.22,
  });
  const orsayClockMat = new THREE.MeshStandardMaterial({
    map: mTex.orsayClockTex,
    emissiveMap: mTex.orsayClockTex,
    emissive: new THREE.Color(0xffd888),
    emissiveIntensity: 0.82,
    roughness: 0.25,
  });
  const vosgesMat = new THREE.MeshStandardMaterial({
    map: mTex.vosgesTex,
    roughness: 0.75,
  });
  const burenMat = new THREE.MeshStandardMaterial({
    map: mTex.burenTex,
    roughness: 0.42,
  });
  const moulinSignMat = new THREE.MeshStandardMaterial({
    map: mTex.moulinSignTex,
    emissiveMap: mTex.moulinSignTex,
    emissive: new THREE.Color(0xff4265),
    emissiveIntensity: 1.0,
    roughness: 0.3,
  });
  const waterPoolMat = new THREE.MeshStandardMaterial({
    color: 0x1b527a,
    emissive: 0x0f3252,
    emissiveIntensity: 0.35,
    roughness: 0.1,
    metalness: 0.78,
  });

  ctx.monumentGlowMaterials.push(warmGlow, goldLeaf, glassMat, palaceMat, gothicMat, roseWindowMat, sainteChapelleTexMat, orsayClockMat);

  // =====================================================================
  // 1. YOUR APARTMENT: 3 RUE SAINT-HYACINTHE, 75001 PARIS
  // =====================================================================
  const homeGroup = new THREE.Group();
  const homeBody = new THREE.Mesh(new THREE.BoxGeometry(1.55, 2.05, 1.35), ctx.haussmannMat);
  homeBody.position.y = 1.025;
  homeBody.castShadow = true;
  homeGroup.add(homeBody);

  const homeRoof = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.95, 0.5, 4), darkSlate);
  homeRoof.rotation.y = Math.PI / 4;
  homeRoof.scale.set(1.1, 1, 0.96);
  homeRoof.position.y = 2.3;
  homeGroup.add(homeRoof);

  // Golden floating Home Star Beacon + glowing base ring
  ctx.homeBeacon = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.42, 0),
    new THREE.MeshStandardMaterial({
      color: 0xfff0b8,
      emissive: 0xf4bd46,
      emissiveIntensity: 1.15,
      metalness: 0.4,
      roughness: 0.15,
    })
  );
  ctx.homeBeacon.position.y = 3.55;
  homeGroup.add(ctx.homeBeacon);

  const homeRing = new THREE.Mesh(
    new THREE.RingGeometry(0.95, 1.22, 28),
    new THREE.MeshBasicMaterial({ color: 0xffe08a, side: THREE.DoubleSide, transparent: true, opacity: 0.78 })
  );
  homeRing.rotation.x = -Math.PI / 2;
  homeRing.position.y = 0.14;
  homeGroup.add(homeRing);

  homeGroup.position.set(P.home[0], 0, P.home[1]);
  homeGroup.scale.setScalar(0.68);
  ctx.scene.add(homeGroup);

  ctx.landmarkLabelEntries.push({
    id: 'home-apartment',
    label: '🏠 Σπίτι • Rue Saint-Hyacinthe 3',
    pos: new THREE.Vector3(P.home[0], 3.15, P.home[1]),
    isHome: true,
    isStop: false,
    day: 'all',
  });

  // =====================================================================
  // 2. EIFFEL TOWER — Architecturally Accurate Open-Truss Iron Lattice
  //    Exact 125m:330m proportions, 4 masonry piers, 4 hollow 4-chord
  //    curving box-truss legs, 4 double-ribbed arches with spandrels,
  //    hollow-center 1st floor, double-tiered 2nd floor, open X-braced
  //    spire, cantilevered summit deck, cupola & broadcast mast!
  // =====================================================================
  const eiffelGroup = new THREE.Group();
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x7b634b,         // Authentic "Brun Tour Eiffel" bronze-brown
    emissive: 0xd4963a,      // Warm Parisian sodium-amber uplighting
    emissiveIntensity: 0.52,
    roughness: 0.44,
    metalness: 0.72,
  });
  const darkIronMat = new THREE.MeshStandardMaterial({
    color: 0x5c4736,
    emissive: 0xa67028,
    emissiveIntensity: 0.4,
    roughness: 0.5,
    metalness: 0.76,
  });
  const eiffelGlassMat = new THREE.MeshStandardMaterial({
    color: 0xffe4ad,
    emissive: 0xffbe55,
    emissiveIntensity: 0.9,
    roughness: 0.2,
    metalness: 0.25,
  });
  ctx.monumentGlowMaterials.push(ironMat, darkIronMat, eiffelGlassMat);

  // Exact analytical outer half-width matching real Eiffel Tower profile:
  // y=0 -> 2.65 (125m), y=2.75 -> 1.63 (71m), y=5.55 -> 0.91 (41m), y=13.2 -> 0.25
  function eiffelOuterR(y) {
    const t = Math.max(0, Math.min(1, y / 13.2));
    return 0.25 + 2.40 * Math.pow(1 - t, 2.38);
  }
  // Inner edge of each 4-chord box-truss leg (converges smoothly above 2nd floor)
  function eiffelInnerR(y) {
    if (y >= 6.85) return 0;
    const out = eiffelOuterR(y);
    const legWidth = 0.92 - (y / 6.85) * 0.58;
    return Math.max(0, out - legWidth);
  }

  // Batch ALL ~420 3D iron truss beams into ONE InstancedMesh for 60fps on iPhone!
  const strutSpecs = [];
  function pushStrut(a, b, r) {
    const len = a.distanceTo(b);
    if (len < 0.01) return;
    strutSpecs.push({ a: a.clone(), b: b.clone(), r, len });
  }

  // Champ de Mars Esplanade Base Plaza + 4 Concrete/Limestone Corner Piers
  const eiffelPlaza = new THREE.Mesh(
    new THREE.BoxGeometry(6.4, 0.1, 6.4),
    new THREE.MeshStandardMaterial({ color: 0x6f6c64, roughness: 0.88 })
  );
  eiffelPlaza.position.y = 0.05;
  eiffelPlaza.receiveShadow = true;
  eiffelGroup.add(eiffelPlaza);

  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  corners.forEach(([cx, cz]) => {
    const out0 = eiffelOuterR(0);
    const in0 = eiffelInnerR(0);
    const mid = (out0 + in0) * 0.5;
    const span = out0 - in0;
    const pier = new THREE.Mesh(new THREE.BoxGeometry(span + 0.14, 0.42, span + 0.14), warmStone);
    pier.position.set(cx * mid, 0.22, cz * mid);
    pier.castShadow = true;
    pier.receiveShadow = true;
    eiffelGroup.add(pier);
  });

  // Helper: build one multi-bay 4-chord box-truss leg section between yStart and yEnd
  function buildLegSection(yStart, yEnd, bays, chordR, braceR) {
    for (let b = 0; b < bays; b++) {
      const y0 = yStart + (b / bays) * (yEnd - yStart);
      const y1 = yStart + ((b + 1) / bays) * (yEnd - yStart);
      const o0 = eiffelOuterR(y0), i0 = eiffelInnerR(y0);
      const o1 = eiffelOuterR(y1), i1 = eiffelInnerR(y1);

      corners.forEach(([cx, cz]) => {
        // 4 corner chords of this single leg's square box truss
        const bPts = [
          new THREE.Vector3(cx * o0, y0, cz * o0),
          new THREE.Vector3(cx * i0, y0, cz * o0),
          new THREE.Vector3(cx * i0, y0, cz * i0),
          new THREE.Vector3(cx * o0, y0, cz * i0),
        ];
        const tPts = [
          new THREE.Vector3(cx * o1, y1, cz * o1),
          new THREE.Vector3(cx * i1, y1, cz * o1),
          new THREE.Vector3(cx * i1, y1, cz * i1),
          new THREE.Vector3(cx * o1, y1, cz * i1),
        ];

        for (let k = 0; k < 4; k++) {
          const kn = (k + 1) % 4;
          // Main corner chord
          pushStrut(bPts[k], tPts[k], chordR);
          // Horizontal tie bar at top of bay
          pushStrut(tPts[k], tPts[kn], braceR * 1.05);
          // Crisp X-bracing diagonals on all 4 faces of each leg!
          pushStrut(bPts[k], tPts[kn], braceR);
          pushStrut(bPts[kn], tPts[k], braceR);
        }
      });
    }
  }

  // Ground -> 1st Floor (5 truss bays per leg)
  buildLegSection(0.36, 2.75, 5, 0.072, 0.036);

  // 4 Iconic Semicircular Iron Arches with Double Chords + Radial Spandrel Struts!
  const archSegs = 12;
  const archCrownY = 2.38;
  const archSpringY = 0.62;
  const archHalfSpan = 1.62;
  for (let face = 0; face < 4; face++) {
    const isZFace = face % 2 === 0;
    const sign = face < 2 ? 1 : -1;
    let prevOuter = null;
    let prevInner = null;

    for (let i = 0; i <= archSegs; i++) {
      const ang = Math.PI * (i / archSegs); // 0 .. PI
      const along = Math.cos(ang) * archHalfSpan;
      const yInner = archSpringY + Math.sin(ang) * (archCrownY - archSpringY);
      const yOuter = yInner + 0.16;
      const faceCoord = sign * (eiffelOuterR(yInner) - 0.14);

      const pIn = isZFace
        ? new THREE.Vector3(along, yInner, faceCoord)
        : new THREE.Vector3(faceCoord, yInner, along);
      const pOut = isZFace
        ? new THREE.Vector3(along, yOuter, faceCoord)
        : new THREE.Vector3(faceCoord, yOuter, along);

      if (prevInner && prevOuter) {
        pushStrut(prevInner, pIn, 0.052);
        pushStrut(prevOuter, pOut, 0.044);
        // Diagonal web bracing inside arch rib
        pushStrut(prevInner, pOut, 0.028);
      }
      // Radial spandrel struts rising vertically to 1st floor underside girder!
      if (i >= 2 && i <= archSegs - 2) {
        const topFace = sign * (eiffelOuterR(2.75) - 0.04);
        const pTop = isZFace
          ? new THREE.Vector3(along * 0.94, 2.74, topFace)
          : new THREE.Vector3(topFace, 2.74, along * 0.94);
        pushStrut(pOut, pTop, 0.026);
      }
      prevInner = pIn;
      prevOuter = pOut;
    }
  }

  // Helper: build hollow square observation deck ring (true open courtyard in center!)
  function buildHollowDeck(yBase, outerW, innerW, skirtH, railingH, withPavilions) {
    const band = (outerW - innerW) * 0.5;
    const offset = (outerW + innerW) * 0.25;
    const dirs = [
      [0, offset, outerW, band],
      [0, -offset, outerW, band],
      [offset, 0, band, innerW],
      [-offset, 0, band, innerW],
    ];
    dirs.forEach(([dx, dz, sw, sd]) => {
      const girder = new THREE.Mesh(new THREE.BoxGeometry(sw, skirtH, sd), darkIronMat);
      girder.position.set(dx, yBase + skirtH * 0.5, dz);
      girder.castShadow = true;
      eiffelGroup.add(girder);
    });
    // Golden frieze trim band (72 scientists frieze on 1st floor!)
    const trimH = skirtH * 0.28;
    [
      [0, outerW * 0.5 + 0.02, outerW + 0.06, 0.04],
      [0, -outerW * 0.5 - 0.02, outerW + 0.06, 0.04],
      [outerW * 0.5 + 0.02, 0, 0.04, outerW + 0.06],
      [-outerW * 0.5 - 0.02, 0, 0.04, outerW + 0.06],
    ].forEach(([tx, tz, tw, td]) => {
      const trim = new THREE.Mesh(new THREE.BoxGeometry(tw, trimH, td), warmGlow);
      trim.position.set(tx, yBase + skirtH * 0.62, tz);
      eiffelGroup.add(trim);
    });

    // Cantilevered Balcony Floor + Perimeter Railing
    const balW = outerW + 0.24;
    const rY = yBase + skirtH + railingH;
    const bCorners = [
      new THREE.Vector3(-balW * 0.5, rY, -balW * 0.5),
      new THREE.Vector3(balW * 0.5, rY, -balW * 0.5),
      new THREE.Vector3(balW * 0.5, rY, balW * 0.5),
      new THREE.Vector3(-balW * 0.5, rY, balW * 0.5),
    ];
    for (let k = 0; k < 4; k++) {
      pushStrut(bCorners[k], bCorners[(k + 1) % 4], 0.025);
    }

    // Subtle Illuminated Glass Pavilions on 1st Floor
    if (withPavilions) {
      [
        [0, offset * 0.96, innerW * 0.72, 0.24, band * 0.55],
        [0, -offset * 0.96, innerW * 0.72, 0.24, band * 0.55],
        [offset * 0.96, 0, band * 0.55, 0.24, innerW * 0.72],
        [-offset * 0.96, 0, band * 0.55, 0.24, innerW * 0.72],
      ].forEach(([px, pz, pw, ph, pd]) => {
        const pav = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, pd), eiffelGlassMat);
        pav.position.set(px, yBase + skirtH + ph * 0.5, pz);
        eiffelGroup.add(pav);
      });
    }
  }

  // 1st Floor Platform (y = 2.75 .. 3.16) — Iconic Open Center Courtyard!
  buildHollowDeck(2.75, 3.48, 1.88, 0.36, 0.14, true);

  // 1st -> 2nd Floor (4 steeply curving box-truss bays per leg)
  buildLegSection(3.12, 5.55, 4, 0.06, 0.032);

  // 2nd Floor Double-Tiered Observation Platform (y = 5.55 .. 6.14)
  buildHollowDeck(5.55, 2.18, 0.95, 0.28, 0.12, false);
  const deck2Upper = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.22, 1.86), darkIronMat);
  deck2Upper.position.y = 5.96;
  deck2Upper.castShadow = true;
  eiffelGroup.add(deck2Upper);
  const deck2Glow = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 1.9), warmGlow);
  deck2Glow.position.y = 5.98;
  eiffelGroup.add(deck2Glow);

  // 2nd Floor -> Summit (y = 6.08 .. 13.20): Graceful Open X-Braced Concave Spire!
  const spireBays = 13;
  for (let s = 0; s < spireBays; s++) {
    const y0 = 6.08 + (s / spireBays) * (13.20 - 6.08);
    const y1 = 6.08 + ((s + 1) / spireBays) * (13.20 - 6.08);
    const r0 = eiffelOuterR(y0);
    const r1 = eiffelOuterR(y1);
    const chordR = Math.max(0.038, 0.068 * (1 - s / spireBays * 0.42));
    const braceR = Math.max(0.02, 0.034 * (1 - s / spireBays * 0.35));

    const bPts = corners.map(([cx, cz]) => new THREE.Vector3(cx * r0, y0, cz * r0));
    const tPts = corners.map(([cx, cz]) => new THREE.Vector3(cx * r1, y1, cz * r1));

    for (let k = 0; k < 4; k++) {
      const kn = (k + 1) % 4;
      // Outer curved corner chord
      pushStrut(bPts[k], tPts[k], chordR);
      // Horizontal bay ring girder
      pushStrut(tPts[k], tPts[kn], braceR * 1.1);
      // Crisp X-truss diagonal latticework on all 4 faces!
      pushStrut(bPts[k], tPts[kn], braceR);
      pushStrut(bPts[kn], tPts[k], braceR);
    }

    // In lower fusion zone (first 2 bays above 2nd floor), add inner vertical leg merger struts
    if (s < 2) {
      const ir0 = eiffelInnerR(y0);
      const ir1 = eiffelInnerR(y1);
      corners.forEach(([cx, cz]) => {
        pushStrut(
          new THREE.Vector3(cx * ir0, y0, cz * ir0),
          new THREE.Vector3(cx * ir1, y1, cz * ir1),
          0.036
        );
      });
    }
  }

  // Subtle Internal Elevator Core Lattice Shaft inside upper spire
  const coreShaft = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 7.0, 0.24),
    new THREE.MeshStandardMaterial({ color: 0x4b3b2d, emissive: 0xd99b3d, emissiveIntensity: 0.35, wireframe: true })
  );
  coreShaft.position.y = 9.65;
  eiffelGroup.add(coreShaft);

  // Compile ALL Eiffel Tower iron truss struts into 1 single InstancedMesh!
  const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 5);
  const trussInst = new THREE.InstancedMesh(unitCyl, ironMat, strutSpecs.length);
  trussInst.castShadow = true;
  const upVec = new THREE.Vector3(0, 1, 0);
  const dirVec = new THREE.Vector3();
  const midVec = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scaleVec = new THREE.Vector3();
  const mat4 = new THREE.Matrix4();
  const ironTint = new THREE.Color();

  strutSpecs.forEach((st, idx) => {
    midVec.copy(st.a).lerp(st.b, 0.5);
    dirVec.copy(st.b).sub(st.a).normalize();
    quat.setFromUnitVectors(upVec, dirVec);
    scaleVec.set(st.r, st.len + st.r * 0.4, st.r);
    mat4.compose(midVec, quat, scaleVec);
    trussInst.setMatrixAt(idx, mat4);
    // Authentic 3-tone Eiffel Brown gradient (slightly lighter higher up!)
    const hNorm = Math.min(1, midVec.y / 14.0);
    ironTint.setRGB(0.88 + hNorm * 0.2, 0.84 + hNorm * 0.2, 0.78 + hNorm * 0.2);
    trussInst.setColorAt(idx, ironTint);
  });
  trussInst.instanceColor.needsUpdate = true;
  eiffelGroup.add(trussInst);

  // 3rd Floor / Summit Cantilevered Observation Decks + Eiffel's Cupola + Broadcast Mast!
  // Lower Summit Platform (y = 13.20)
  const sumBase = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.22, 0.96), darkIronMat);
  sumBase.position.y = 13.26;
  eiffelGroup.add(sumBase);
  // Glazed Summit Observation Room (warm amber glow!)
  const sumGlass = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.34, 0.84), eiffelGlassMat);
  sumGlass.position.y = 13.52;
  eiffelGroup.add(sumGlass);
  // Upper Open-Air Summit Gallery (y = 13.74)
  const sumUpper = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.16, 0.76), darkIronMat);
  sumUpper.position.y = 13.76;
  eiffelGroup.add(sumUpper);
  // Cylindrical Campanile (Gustave Eiffel's Office) + Dome Cap
  const campanile = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.42, 12), ironMat);
  campanile.position.y = 14.04;
  eiffelGroup.add(campanile);
  const cupola = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), darkIronMat);
  cupola.position.y = 14.24;
  eiffelGroup.add(cupola);
  // Beacon Lantern Housing
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.26, 10), warmGlow);
  lantern.position.y = 14.58;
  eiffelGroup.add(lantern);
  // Stepped Broadcast Radio/TV Antenna Spire (reaches y = 16.35)
  const antLower = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.11, 0.75, 6), ironMat);
  antLower.position.y = 15.05;
  eiffelGroup.add(antLower);
  const antUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.055, 0.92, 6), ironMat);
  antUpper.position.y = 15.85;
  eiffelGroup.add(antUpper);
  // Tiny red aviation warning beacon at the very peak
  const aviLight = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff3b4e }));
  aviLight.position.y = 16.34;
  eiffelGroup.add(aviLight);

  // Warm Eiffel Internal Uplight
  ctx.eiffelLight = new THREE.PointLight(0xffcb66, 2.2, 30);
  ctx.eiffelLight.position.set(0, 7.5, 0);
  eiffelGroup.add(ctx.eiffelLight);

  // Rotating Dual Searchlight Beacon at the Lantern Housing
  ctx.beaconPivot = new THREE.Group();
  ctx.beaconPivot.position.set(0, 14.58, 0);
  const beamGeo = new THREE.ConeGeometry(2.4, 30, 16, 1, true);
  beamGeo.translate(0, -15, 0);
  beamGeo.rotateX(Math.PI / 2);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xfff2c6,
    transparent: true,
    opacity: 0.24,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  ctx.beaconMesh = new THREE.Mesh(beamGeo, beamMat);
  ctx.beaconPivot.add(ctx.beaconMesh);
  const beam2 = ctx.beaconMesh.clone();
  beam2.rotation.y = Math.PI;
  ctx.beaconPivot.add(beam2);
  eiffelGroup.add(ctx.beaconPivot);

  // Eiffel Scintillement Sparkle Cloud hugging the exact curved iron silhouette!
  const sparkleCount = 300;
  const spPos = new Float32Array(sparkleCount * 3);
  const spColors = new Float32Array(sparkleCount * 3);
  const spPhases = new Float32Array(sparkleCount);
  for (let i = 0; i < sparkleCount; i++) {
    const h = 0.55 + Math.random() * 13.1;
    const rOut = eiffelOuterR(h);
    const side = Math.floor(Math.random() * 4);
    const along = (Math.random() * 2 - 1) * rOut;
    const jitter = 0.08;
    let sx = 0, sz = 0;
    if (side === 0) { sx = along; sz = rOut + jitter; }
    else if (side === 1) { sx = along; sz = -rOut - jitter; }
    else if (side === 2) { sx = rOut + jitter; sz = along; }
    else { sx = -rOut - jitter; sz = along; }
    spPos[i * 3] = sx;
    spPos[i * 3 + 1] = h;
    spPos[i * 3 + 2] = sz;
    spColors[i * 3] = 1.0; spColors[i * 3 + 1] = 0.94; spColors[i * 3 + 2] = 0.72;
    spPhases[i] = Math.random() * Math.PI * 2;
  }
  const spGeo = new THREE.BufferGeometry();
  spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
  spGeo.setAttribute('color', new THREE.BufferAttribute(spColors, 3));
  spGeo.userData.phases = spPhases;
  const spTex = createCircleTexture('rgba(255,253,240,1)', 'rgba(255,218,125,0.45)');
  const spMat = new THREE.PointsMaterial({
    size: 0.56,
    map: spTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  ctx.eiffelSparkles = new THREE.Points(spGeo, spMat);
  eiffelGroup.add(ctx.eiffelSparkles);

  eiffelGroup.position.set(P.eiffel[0], 0, P.eiffel[1]);
  eiffelGroup.rotation.y = 0.62;
  eiffelGroup.scale.setScalar(0.68); // True scale: ~150m base x 330m silhouette soaring ~12x over Haussmann roofs!
  ctx.scene.add(eiffelGroup);

  // =====================================================================
  // 3. PALAIS GARNIER (OPÉRA GARNIER) — Grand Beaux-Arts Steps, Paired
  //    Corinthian Loggia, Ribbed Verdigris Dome, Golden Apollo & Pegasus!
  // =====================================================================
  const operaGroup = new THREE.Group();
  // Broad Beaux-Arts entrance steps
  for (let s = 0; s < 3; s++) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(3.75 - s * 0.14, 0.09, 0.55), warmStone);
    st.position.set(0, 0.045 + s * 0.09, 1.85 - s * 0.16);
    operaGroup.add(st);
  }
  // Main textured Beaux-Arts opera house block
  const opBase = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.48, 3.15), palaceMat);
  opBase.position.y = 0.74;
  opBase.castShadow = true;
  opBase.receiveShadow = true;
  operaGroup.add(opBase);
  // Side pavilion wings (Emperor's Pavilion / Library Rotunda)
  [-1.92, 1.92].forEach((sx) => {
    const rot = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.48, 1.38, 12), palaceMat);
    rot.position.set(sx, 0.69, 0.15);
    operaGroup.add(rot);
    const rCap = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), verdigris);
    rCap.position.set(sx, 1.38, 0.15);
    operaGroup.add(rCap);
  });
  // South Facade Paired Corinthian Marble Columns + Golden Medallion Frieze
  for (let cx = -1.44; cx <= 1.44; cx += 0.48) {
    [-0.07, 0.07].forEach((pair) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.052, 0.92, 8), limestone);
      col.position.set(cx + pair, 1.02, 1.62);
      operaGroup.add(col);
    });
    // Gilded composer medallion bust above each bay
    const med = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), goldLeaf);
    med.position.set(cx, 1.38, 1.63);
    operaGroup.add(med);
  }
  // Ornate Golden Attic Balustrade & Sculpted Entablature
  const opCornice = new THREE.Mesh(new THREE.BoxGeometry(3.75, 0.14, 3.25), limestone);
  opCornice.position.y = 1.54;
  operaGroup.add(opCornice);
  const opFrieze = new THREE.Mesh(new THREE.BoxGeometry(3.68, 0.12, 0.16), goldLeaf);
  opFrieze.position.set(0, 1.64, 1.56);
  operaGroup.add(opFrieze);
  // Iconic Ribbed Verdigris Copper Auditorium Dome + Crowned Golden Apollo!
  const opDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.02, 0.48, 20), limestone);
  opDrum.position.set(0, 1.82, 0.35);
  operaGroup.add(opDrum);
  const opDome = new THREE.Mesh(new THREE.SphereGeometry(0.98, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), verdigris);
  opDome.scale.set(1, 1.12, 1);
  opDome.position.set(0, 2.04, 0.35);
  opDome.castShadow = true;
  operaGroup.add(opDome);
  // 12 vertical raised dome ribs
  for (let r = 0; r < 12; r++) {
    const ang = (r / 12) * Math.PI * 2;
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.99, 0.025, 5, 12, Math.PI / 2), goldLeaf);
    rib.position.set(0, 2.04, 0.35);
    rib.rotation.y = ang;
    operaGroup.add(rib);
  }
  // Golden Apollo Statue holding his Lyre high on summit!
  const apolloPed = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.24, 8), goldLeaf);
  apolloPed.position.set(0, 3.16, 0.35);
  operaGroup.add(apolloPed);
  const apollo = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.56, 6), goldLeaf);
  apollo.position.set(0, 3.5, 0.35);
  operaGroup.add(apollo);
  // Tall Triangular Stage-House Flytower & Gilded Pegasus Statues
  const stageWall = new THREE.Mesh(new THREE.BoxGeometry(2.55, 1.38, 1.05), limestone);
  stageWall.position.set(0, 2.15, -0.82);
  operaGroup.add(stageWall);
  const stageGable = new THREE.Mesh(new THREE.CylinderGeometry(1.38, 1.38, 1.08, 3), verdigris);
  stageGable.rotation.x = Math.PI / 2;
  stageGable.rotation.y = Math.PI / 2;
  stageGable.scale.set(0.55, 1, 1.02);
  stageGable.position.set(0, 3.12, -0.82);
  operaGroup.add(stageGable);
  [-1.32, 1.32].forEach((gx) => {
    const peg = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), goldLeaf);
    peg.position.set(gx, 2.92, -0.58);
    operaGroup.add(peg);
  });
  operaGroup.position.set(P.garnier[0], 0, P.garnier[1]);
  ctx.scene.add(operaGroup);

  // =====================================================================
  // 4. GALERIES LAFAYETTE HAUSSMANN (10-RIBBED ART NOUVEAU DOME + XMAS TREE)
  //    & PASSAGES COUVERTS (GALERIE VIVIENNE / PASSAGE DES PANORAMAS)
  // =====================================================================
  const glGroup = new THREE.Group();
  const glBody = new THREE.Mesh(new THREE.BoxGeometry(2.85, 1.55, 2.2), ctx.haussmannMat);
  glBody.position.y = 0.78;
  glBody.castShadow = true;
  glGroup.add(glBody);
  const glRoof = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.24, 2.1), darkSlate);
  glRoof.position.y = 1.66;
  glGroup.add(glRoof);
  // Glowing 10-Ribbed Art Nouveau Neo-Byzantine Stained-Glass Cupola
  const glDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({
      color: 0xffe49e,
      emissive: 0xffb340,
      emissiveIntensity: 0.95,
      transparent: true,
      opacity: 0.82,
      roughness: 0.18,
    })
  );
  glDome.position.y = 1.72;
  glGroup.add(glDome);
  for (let r = 0; r < 10; r++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.96, 0.024, 5, 12, Math.PI / 2), goldLeaf);
    rib.position.y = 1.72;
    rib.rotation.y = (r / 10) * Math.PI * 2;
    glGroup.add(rib);
  }
  // Multi-Tiered Giant Christmas Tree glowing in the December holiday display!
  const xmasMat = new THREE.MeshStandardMaterial({ color: 0x1a6944, emissive: 0x268a58, emissiveIntensity: 0.45 });
  [
    [0.44, 0.46, 2.02],
    [0.34, 0.42, 2.34],
    [0.22, 0.38, 2.64],
  ].forEach(([r, h, y]) => {
    const tier = new THREE.Mesh(new THREE.ConeGeometry(r, h, 8), xmasMat);
    tier.position.y = y;
    glGroup.add(tier);
  });
  const xmasStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.15, 0), goldLeaf);
  xmasStar.position.set(0, 2.94, 0);
  glGroup.add(xmasStar);
  glGroup.position.set(P.lafayette[0], 0, P.lafayette[1]);
  ctx.scene.add(glGroup);

  // Galerie Vivienne & Passage des Panoramas (19th-Century Glass-Vaulted Arcades)
  const galGroup = new THREE.Group();
  const galLeft = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.05, 2.65), palaceMat);
  galLeft.position.set(-0.46, 0.52, 0);
  galGroup.add(galLeft);
  const galRight = galLeft.clone(); galRight.position.x = 0.46; galGroup.add(galRight);
  const galGlowFloor = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 2.55), warmGlow);
  galGlowFloor.position.set(0, 0.05, 0);
  galGroup.add(galGlowFloor);
  const galVault = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.48, 2.6, 12, 1, false, 0, Math.PI),
    glassMat
  );
  galVault.rotation.x = Math.PI / 2;
  galVault.rotation.z = Math.PI / 2;
  galVault.position.y = 1.04;
  galGroup.add(galVault);
  // Iron skylight ribs along the arcade vault
  for (let gz = -1.1; gz <= 1.1; gz += 0.44) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.49, 0.022, 5, 12, Math.PI), darkSlate);
    rib.position.set(0, 1.04, gz);
    galGroup.add(rib);
  }
  galGroup.position.set(P.galVivienne[0], 0, P.galVivienne[1]);
  ctx.scene.add(galGroup);

  // =====================================================================
  // 5. PLACE VENDÔME (CHAMFERED OCTAGONAL PLAZA + BRONZE COLONNE VENDÔME)
  // =====================================================================
  const vendomeGroup = new THREE.Group();
  const vPlaza = new THREE.Mesh(
    new THREE.CylinderGeometry(2.15, 2.15, 0.1, 8),
    new THREE.MeshStandardMaterial({ color: 0x5d6473, roughness: 0.84 })
  );
  vPlaza.position.y = 0.05;
  vendomeGroup.add(vPlaza);
  // Tiered Limestone Pedestal + Green-Bronze Spiral Column + Capital + Napoleon Statue
  const vStep = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.16, 0.86), warmStone);
  vStep.position.y = 0.16;
  vendomeGroup.add(vStep);
  const vPed = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.56, 0.56), limestone);
  vPed.position.y = 0.52;
  vendomeGroup.add(vPed);
  const vCol = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.19, 2.65, 14), bronzeMat);
  vCol.position.y = 2.12;
  vCol.castShadow = true;
  vendomeGroup.add(vCol);
  // Subtle spiral bronze relief rings
  for (let sy = 1.0; sy <= 3.2; sy += 0.36) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.02, 5, 12), goldLeaf);
    band.rotation.x = Math.PI / 2 + 0.16;
    band.position.y = sy;
    vendomeGroup.add(band);
  }
  const vCap = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.16, 0.4), bronzeMat);
  vCap.position.y = 3.5;
  vendomeGroup.add(vCap);
  const vNap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.38, 8), goldLeaf);
  vNap.position.y = 3.76;
  vendomeGroup.add(vNap);
  vendomeGroup.position.set(P.vendome[0], 0, P.vendome[1]);
  ctx.scene.add(vendomeGroup);

  // =====================================================================
  // 6. PALAIS-ROYAL & LES DEUX PLATEAUX (TRUE STRIPED BUREN COLUMNS!)
  // =====================================================================
  const prGroup = new THREE.Group();
  const prFloor = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.08, 2.8),
    new THREE.MeshStandardMaterial({ color: 0x8a8376, roughness: 0.82 })
  );
  prFloor.position.y = 0.04;
  prGroup.add(prFloor);
  // Colonnaded Palace Wings framing Cour d'Honneur
  [
    [-1.38, 0, 0.48, 3.0],
    [1.38, 0, 0.48, 3.0],
    [0, -1.36, 3.2, 0.48],
  ].forEach(([px, pz, pw, pd]) => {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(pw, 1.08, pd), palaceMat);
    wing.position.set(px, 0.54, pz);
    wing.castShadow = true;
    prGroup.add(wing);
    const wRoof = new THREE.Mesh(new THREE.BoxGeometry(pw * 0.9, 0.24, pd * 0.9), darkSlate);
    wRoof.position.set(px, 1.2, pz);
    prGroup.add(wRoof);
  });
  // Iconic Vertically Black-and-White Striped Columns of Buren (Les Deux Plateaux)!
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const colH = 0.24 + ((Math.abs(r * 3 + c * 5 + 2) % 5) * 0.16);
      const colMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, colH, 10), burenMat);
      colMesh.position.set(c * 0.42, colH * 0.5 + 0.08, r * 0.42 + 0.18);
      colMesh.castShadow = true;
      prGroup.add(colMesh);
    }
  }
  // Central reflecting basin in adjacent Jardin du Palais-Royal
  const prBasin = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.12, 16), waterPoolMat);
  prBasin.position.set(0, 0.09, -2.05);
  prGroup.add(prBasin);
  prGroup.position.set(P.palaisRoyal[0], 0, P.palaisRoyal[1]);
  prGroup.rotation.y = -0.42;
  ctx.scene.add(prGroup);

  // =====================================================================
  // 7. MUSÉE DU LOUVRE — FRENCH RENAISSANCE PALACE, COUR CARRÉE,
  //    REFLECTING BASINS, GLASS PYRAMID & ARC DU CARROUSEL!
  // =====================================================================
  const louvreGroup = new THREE.Group();
  function addLouvreWing(x, z, w, d) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 1.38, d), palaceMat);
    wall.position.set(x, 0.69, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    louvreGroup.add(wall);
    const corn = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, 0.1, d + 0.08), limestone);
    corn.position.set(x, 1.4, z);
    louvreGroup.add(corn);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(w * 0.94, 0.34, d * 0.78), darkSlate);
    roof.position.set(x, 1.62, z);
    louvreGroup.add(roof);
  }
  function addLouvrePavilion(x, z) {
    const pav = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.65, 1.05), palaceMat);
    pav.position.set(x, 0.82, z);
    pav.castShadow = true;
    louvreGroup.add(pav);
    const pRoof = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.74, 0.65, 4), darkSlate);
    pRoof.rotation.y = Math.PI / 4;
    pRoof.position.set(x, 1.96, z);
    louvreGroup.add(pRoof);
  }
  // Richelieu (North) & Denon (South) Wings framing Cour Napoléon
  addLouvreWing(-0.6, -1.82, 5.5, 0.84);
  addLouvreWing(-0.6, 1.82, 5.5, 0.84);
  // Signature corner & central Pavilions (Pavillon de l'Horloge, Richelieu, Denon, Flore, Marsan)
  [[-3.2, -1.82], [-0.4, -1.82], [-3.2, 1.82], [-0.4, 1.82], [1.85, 0], [4.15, 0]].forEach(([px, pz]) => addLouvrePavilion(px, pz));
  // Enclosed Cour Carrée Square on the East side + central illuminated fountain
  addLouvreWing(3.0, -1.55, 2.9, 0.68);
  addLouvreWing(3.0, 1.55, 2.9, 0.68);
  addLouvreWing(4.15, 0, 0.68, 3.65);
  addLouvreWing(1.85, 0, 0.68, 3.65);
  const ccFountain = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.5, 0.14, 16), waterPoolMat);
  ccFountain.position.set(3.0, 0.08, 0);
  louvreGroup.add(ccFountain);
  const ccFountainJet = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), warmGlow);
  ccFountainJet.position.set(3.0, 0.24, 0);
  louvreGroup.add(ccFountainJet);

  // Cour Napoléon Stone Plaza + 3 Turquoise Reflecting Basins framing the Pyramid!
  const court = new THREE.Mesh(
    new THREE.BoxGeometry(5.1, 0.08, 2.95),
    new THREE.MeshStandardMaterial({ color: 0x857f74, roughness: 0.76 })
  );
  court.position.set(-0.4, 0.04, 0);
  louvreGroup.add(court);
  [[0.2, -1.15, 1.65, 0.52], [0.2, 1.15, 1.65, 0.52], [-1.02, 0, 0.58, 1.55]].forEach(([bx, bz, bw, bd]) => {
    const pool = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.1, bd), waterPoolMat);
    pool.position.set(bx, 0.06, bz);
    louvreGroup.add(pool);
  });

  // Main I.M. Pei Glowing Glass Pyramid + Fine Structural Diamond Lattice
  const pyrGeo = new THREE.ConeGeometry(1.22, 1.45, 4);
  const pyrMesh = new THREE.Mesh(pyrGeo, glassMat);
  pyrMesh.rotation.y = Math.PI / 4;
  pyrMesh.position.set(0.22, 0.76, 0);
  louvreGroup.add(pyrMesh);
  const pyrWire = new THREE.Mesh(
    new THREE.ConeGeometry(1.23, 1.46, 4, 7),
    new THREE.MeshBasicMaterial({ color: 0xffe8ad, wireframe: true })
  );
  pyrWire.rotation.y = Math.PI / 4;
  pyrWire.position.set(0.22, 0.76, 0);
  louvreGroup.add(pyrWire);
  // 3 Flanking Mini Glass Pyramids
  [[-0.85, -0.78], [-0.85, 0.78], [1.05, 0.85]].forEach(([mx, mz]) => {
    const mp = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.4, 4), glassMat);
    mp.rotation.y = Math.PI / 4;
    mp.position.set(mx, 0.24, mz);
    louvreGroup.add(mp);
  });

  // Arc de Triomphe du Carrousel (3-Arched Triumphal Arch + Golden Quadriga Chariot!)
  const carGroup = new THREE.Group();
  [-0.42, -0.15, 0.15, 0.42].forEach((cz) => {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.72, 0.14), warmStone);
    pier.position.set(0, 0.36, cz);
    carGroup.add(pier);
  });
  const carTop = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.28, 1.06), limestone);
  carTop.position.set(0, 0.84, 0);
  carGroup.add(carTop);
  const quadriga = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.36), goldLeaf);
  quadriga.position.set(0, 1.08, 0);
  carGroup.add(quadriga);
  carGroup.position.set(-3.1, 0, 0);
  louvreGroup.add(carGroup);

  louvreGroup.position.set(P.louvre[0] + 0.25, 0, P.louvre[1] - 0.78);
  louvreGroup.rotation.y = -0.42; // True Axe Historique parallel to Seine bank (zero water overlap!)
  louvreGroup.scale.setScalar(1.32);
  ctx.scene.add(louvreGroup);

  // =====================================================================
  // 8. MUSÉE DE L'ORANGERIE & PLACE DE LA CONCORDE (OBELISK + FOUNTAINS)
  // =====================================================================
  const oranGroup = new THREE.Group();
  const oranTerrace = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.14, 1.45), warmStone);
  oranTerrace.position.y = 0.07;
  oranGroup.add(oranTerrace);
  const oranBody = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.92, 1.04), palaceMat);
  oranBody.position.y = 0.56;
  oranBody.castShadow = true;
  oranGroup.add(oranBody);
  // Tall arched greenhouse glass bay facade
  const oranGlass = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.62, 1.08), glassMat);
  oranGlass.position.y = 0.54;
  oranGroup.add(oranGlass);
  const oranRoof = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.12, 1.12), limestone);
  oranRoof.position.y = 1.06;
  oranGroup.add(oranRoof);
  // Entrance pediment portico at east end
  const oranPed = new THREE.Mesh(new THREE.ConeGeometry(0.56, 0.32, 4), limestone);
  oranPed.rotation.y = Math.PI / 4;
  oranPed.position.set(1.22, 1.18, 0);
  oranGroup.add(oranPed);
  oranGroup.position.set(P.orangerie[0], 0, P.orangerie[1]);
  oranGroup.rotation.y = -0.42;
  ctx.scene.add(oranGroup);

  // Place de la Concorde — Luxor Obelisk with Gold Pyramidion + 2 Tiered Fountains
  const concGroup = new THREE.Group();
  const cPlaza = new THREE.Mesh(
    new THREE.CylinderGeometry(2.65, 2.65, 0.1, 8),
    new THREE.MeshStandardMaterial({ color: 0x5c6375, roughness: 0.82 })
  );
  cPlaza.position.y = 0.05;
  concGroup.add(cPlaza);
  const obStep = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.16, 0.82), warmStone);
  obStep.position.y = 0.16;
  concGroup.add(obStep);
  const obPed = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.62, 0.56), limestone);
  obPed.position.y = 0.54;
  concGroup.add(obPed);
  const obShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.2, 2.75, 4),
    new THREE.MeshStandardMaterial({ color: 0xdca899, roughness: 0.52 })
  );
  obShaft.rotation.y = Math.PI / 4;
  obShaft.position.y = 2.22;
  obShaft.castShadow = true;
  concGroup.add(obShaft);
  const obTip = new THREE.Mesh(new THREE.ConeGeometry(0.115, 0.36, 4), goldLeaf);
  obTip.rotation.y = Math.PI / 4;
  obTip.position.y = 3.76;
  concGroup.add(obTip);
  // Two Ornate Tiered Bronze & Gold Fountains (Fontaine des Mers & des Fleuves)
  [-1.55, 1.55].forEach((fz) => {
    const outer = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.6, 0.18, 16), bronzeMat);
    outer.position.set(0, 0.16, fz);
    concGroup.add(outer);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.2, 16), waterPoolMat);
    water.position.set(0, 0.18, fz);
    concGroup.add(water);
    const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.16, 0.36, 12), bronzeMat);
    tier1.position.set(0, 0.42, fz);
    concGroup.add(tier1);
    const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.28, 10), goldLeaf);
    tier2.position.set(0, 0.7, fz);
    concGroup.add(tier2);
  });
  concGroup.position.set(P.concorde[0], 0, P.concorde[1]);
  ctx.scene.add(concGroup);

  // =====================================================================
  // 9. MUSÉE D'ORSAY — Beaux-Arts Stone Facade, Ribbed Glass Barrel Vault
  //    & Two Hyper-Detailed Golden Roman-Numeral Station Clocks!
  // =====================================================================
  const orsayGroup = new THREE.Group();
  const orBody = new THREE.Mesh(new THREE.BoxGeometry(4.1, 1.24, 1.85), palaceMat);
  orBody.position.y = 0.62;
  orBody.castShadow = true;
  orBody.receiveShadow = true;
  orsayGroup.add(orBody);
  // Vaulted Iron-and-Glass Train-Shed Barrel Roof + Structural Arched Ribs!
  const orVault = new THREE.Mesh(
    new THREE.CylinderGeometry(0.88, 0.88, 3.65, 18, 1, false, 0, Math.PI),
    glassMat
  );
  orVault.rotation.z = Math.PI / 2;
  orVault.position.y = 1.24;
  orsayGroup.add(orVault);
  for (let rx = -1.6; rx <= 1.6; rx += 0.4) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.89, 0.025, 5, 14, Math.PI), darkSlate);
    rib.rotation.y = Math.PI / 2;
    rib.position.set(rx, 1.24, 0);
    orsayGroup.add(rib);
  }
  // Monumental Beaux-Arts Corner Pavilions with Mansard Roofs
  [-1.85, 1.85].forEach((px) => {
    const pav = new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.68, 1.98), palaceMat);
    pav.position.set(px, 0.84, 0);
    pav.castShadow = true;
    orsayGroup.add(pav);
    const pr = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.62, 0.56, 4), darkSlate);
    pr.rotation.y = Math.PI / 4;
    pr.scale.set(0.9, 1, 1.5);
    pr.position.set(px, 1.95, 0);
    orsayGroup.add(pr);
  });
  // Two Iconic Giant Illuminated Golden Roman-Numeral Clocks facing the Seine!
  [-0.86, 0.86].forEach((cx) => {
    const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.42, 0.14, 20), goldLeaf);
    bezel.rotation.x = Math.PI / 2;
    bezel.position.set(cx, 1.38, -0.96);
    orsayGroup.add(bezel);
    const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.36, 20), orsayClockMat);
    clockFace.position.set(cx, 1.38, -1.04);
    clockFace.rotation.y = Math.PI;
    orsayGroup.add(clockFace);
  });
  orsayGroup.position.set(P.orsay[0] - 0.55, 0, P.orsay[1] + 1.48);
  orsayGroup.rotation.y = -0.38; // Parallel to Quai Anatole-France, clocks facing Seine (100% dry bank!)
  orsayGroup.scale.setScalar(0.95);
  ctx.scene.add(orsayGroup);

  // =====================================================================
  // 10. MUSÉE RODIN (HÔTEL BIRON + PARTERRE GARDEN + BRONZE "THE THINKER")
  // =====================================================================
  const rodinGroup = new THREE.Group();
  const rLawn = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.08, 3.8),
    new THREE.MeshStandardMaterial({ color: 0x244a3c, roughness: 0.92 })
  );
  rLawn.position.set(0, 0.04, 0.45);
  rodinGroup.add(rLawn);
  // Central Formal Reflecting Pool in Rodin's Sculpture Garden
  const rPool = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.1, 18), waterPoolMat);
  rPool.position.set(-0.2, 0.07, 1.05);
  rodinGroup.add(rPool);
  // 18th-Century Rococo Hôtel Biron Mansion + Rounded Garden Pavilion
  const rMansion = new THREE.Mesh(new THREE.BoxGeometry(2.55, 1.25, 1.18), palaceMat);
  rMansion.position.set(0, 0.62, -0.98);
  rMansion.castShadow = true;
  rodinGroup.add(rMansion);
  const rCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 1.32, 14), palaceMat);
  rCenter.position.set(0, 0.66, -0.52);
  rodinGroup.add(rCenter);
  const rRoof = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.45, 0.44, 4), darkSlate);
  rRoof.rotation.y = Math.PI / 4;
  rRoof.scale.set(1.25, 1, 0.68);
  rRoof.position.set(0, 1.45, -0.98);
  rodinGroup.add(rRoof);
  // Tiered Stone Plinth + Sculpted Miniature Bronze "Le Penseur" (The Thinker)
  const plinth1 = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.16, 0.56), warmStone);
  plinth1.position.set(0.75, 0.14, 0.65);
  rodinGroup.add(plinth1);
  const plinth2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.52, 0.4), limestone);
  plinth2.position.set(0.75, 0.46, 0.65);
  rodinGroup.add(plinth2);
  const thBody = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.16), bronzeMat);
  thBody.position.set(0.75, 0.84, 0.65);
  thBody.rotation.x = 0.28;
  rodinGroup.add(thBody);
  const thHead = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), bronzeMat);
  thHead.position.set(0.75, 1.0, 0.7);
  rodinGroup.add(thHead);
  rodinGroup.position.set(P.rodin[0], 0, P.rodin[1]);
  ctx.scene.add(rodinGroup);

  // =====================================================================
  // 11. DÔME DES INVALIDES (NAPOLEON'S TOMB) — Portico Pediment, 20-Column
  //     Double Drum, 12-Ribbed Gleaming Gold-Leaf Dome & Needle Spire!
  // =====================================================================
  const invGroup = new THREE.Group();
  // Broad stone steps facing Place Vauban (South)
  for (let st = 0; st < 3; st++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(2.4 - st * 0.14, 0.08, 0.55), warmStone);
    step.position.set(0, 0.04 + st * 0.08, 2.25 - st * 0.14);
    invGroup.add(step);
  }
  const invBase = new THREE.Mesh(new THREE.BoxGeometry(3.65, 1.48, 3.65), palaceMat);
  invBase.position.y = 0.74;
  invBase.castShadow = true;
  invBase.receiveShadow = true;
  invGroup.add(invBase);
  // Two-Tiered Classical Portico & Triangular Pediment on Place Vauban Facade
  const invPortico = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.56, 0.58), limestone);
  invPortico.position.set(0, 0.78, 1.92);
  invGroup.add(invPortico);
  for (let cx = -0.78; cx <= 0.78; cx += 0.31) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.062, 1.42, 8), warmStone);
    col.position.set(cx, 0.74, 2.22);
    invGroup.add(col);
  }
  const invPed = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.62, 3), limestone);
  invPed.rotation.x = Math.PI / 2;
  invPed.rotation.y = Math.PI / 2;
  invPed.scale.set(0.38, 1, 1.05);
  invPed.position.set(0, 1.72, 1.96);
  invGroup.add(invPed);
  // Grand Double-Tiered Peristyle Colonnaded Drum (20 paired columns!)
  const invDrum1 = new THREE.Mesh(new THREE.CylinderGeometry(1.24, 1.32, 1.15, 24), limestone);
  invDrum1.position.y = 2.02;
  invGroup.add(invDrum1);
  for (let a = 0; a < 20; a++) {
    const ang = (a / 20) * Math.PI * 2;
    const dc = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.056, 1.1, 6), warmStone);
    dc.position.set(Math.cos(ang) * 1.34, 2.02, Math.sin(ang) * 1.34);
    invGroup.add(dc);
  }
  const invAttic = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.18, 0.62, 20), palaceMat);
  invAttic.position.y = 2.86;
  invGroup.add(invAttic);
  // Iconic 12-Ribbed Gleaming Gold-Leaf Dome + Open Golden Lantern + Needle Spire!
  const invDome = new THREE.Mesh(new THREE.SphereGeometry(1.16, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), goldLeaf);
  invDome.scale.set(1, 1.24, 1);
  invDome.position.y = 3.12;
  invDome.castShadow = true;
  invGroup.add(invDome);
  for (let r = 0; r < 12; r++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.032, 5, 14, Math.PI / 2), warmGlow);
    rib.scale.set(1, 1.24, 1);
    rib.position.y = 3.12;
    rib.rotation.y = (r / 12) * Math.PI * 2;
    invGroup.add(rib);
  }
  const invLantern = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.85, 10), goldLeaf);
  invLantern.position.y = 4.82;
  invGroup.add(invLantern);
  const invSpire = new THREE.Mesh(new THREE.ConeGeometry(0.13, 1.45, 8), goldLeaf);
  invSpire.position.y = 5.92;
  invGroup.add(invSpire);
  invGroup.position.set(P.invalides[0], 0, P.invalides[1]);
  ctx.scene.add(invGroup);

  // =====================================================================
  // 12. NOTRE-DAME DE PARIS (Gothic Twin Towers, Triple Portals, Radial
  //     Rose Window, Arched Flying Buttresses, Transepts & Gothic Flèche)
  //     & SAINTE-CHAPELLE (Towering Stained-Glass Rayonnant Jewel Box!)
  // =====================================================================
  const ndGroup = new THREE.Group();
  const ndNave = new THREE.Mesh(new THREE.BoxGeometry(3.25, 1.62, 1.38), gothicMat);
  ndNave.position.set(0.4, 0.81, 0);
  ndNave.castShadow = true;
  ndGroup.add(ndNave);
  // Rounded Gothic East Apse Choir
  const ndApse = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.7, 1.56, 12), gothicMat);
  ndApse.position.set(2.05, 0.78, 0);
  ndGroup.add(ndApse);
  // Steep Pitched Lead Nave Roof
  const ndRoof = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 3.2, 3), darkSlate);
  ndRoof.rotation.z = Math.PI / 2;
  ndRoof.scale.set(0.75, 1, 1);
  ndRoof.position.set(0.4, 1.9, 0);
  ndGroup.add(ndRoof);
  // North & South Transepts with Side Rose Windows!
  const ndTransept = new THREE.Mesh(new THREE.BoxGeometry(0.96, 1.58, 2.38), gothicMat);
  ndTransept.position.set(0.28, 0.79, 0);
  ndGroup.add(ndTransept);
  [-1.2, 1.2].forEach((tz) => {
    const sRose = new THREE.Mesh(new THREE.CircleGeometry(0.26, 16), roseWindowMat);
    sRose.position.set(0.28, 1.05, tz);
    if (tz < 0) sRose.rotation.y = Math.PI;
    ndGroup.add(sRose);
  });
  // Iconic West Facade: Triple Recessed Gothic Portals + Kings' Gallery + Twin Bell Towers!
  const ndWestBase = new THREE.Mesh(new THREE.BoxGeometry(0.84, 1.95, 1.66), limestone);
  ndWestBase.position.set(-1.12, 0.98, 0);
  ndGroup.add(ndWestBase);
  [-0.5, 0, 0.5].forEach((pz, idx) => {
    const portal = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, idx === 1 ? 0.68 : 0.56, idx === 1 ? 0.34 : 0.28),
      new THREE.MeshStandardMaterial({ color: 0x3b352c, roughness: 0.9 })
    );
    portal.position.set(-1.54, idx === 1 ? 0.34 : 0.28, pz);
    ndGroup.add(portal);
  });
  // Gallery of Kings horizontal sculpted frieze band
  const kingsBand = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.14, 1.72), warmStone);
  kingsBand.position.set(-1.12, 0.92, 0);
  ndGroup.add(kingsBand);
  // Authentic Glowing Stained-Glass West Rose Window!
  const roseWin = new THREE.Mesh(new THREE.CircleGeometry(0.36, 20), roseWindowMat);
  roseWin.position.set(-1.56, 1.46, 0);
  roseWin.rotation.y = -Math.PI / 2;
  ndGroup.add(roseWin);
  // Twin Flat-Topped West Bell Towers with Louvered Lancet Belfries
  [-0.52, 0.52].forEach((tz) => {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.76, 3.25, 0.62), gothicMat);
    tower.position.set(-1.12, 1.62, tz);
    tower.castShadow = true;
    ndGroup.add(tower);
    const crown = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.12, 0.68), limestone);
    crown.position.set(-1.12, 3.26, tz);
    ndGroup.add(crown);
  });
  // True Curved Arched Flying Buttresses along North & South Flanks!
  for (let bx = -0.35; bx <= 1.85; bx += 0.44) {
    [-0.95, 0.95].forEach((bz) => {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.15, 0.14), warmStone);
      pier.position.set(bx, 0.58, bz);
      ndGroup.add(pier);
      const pinnacle = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 4), limestone);
      pinnacle.position.set(bx, 1.28, bz);
      ndGroup.add(pinnacle);
      const flyer = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.46), limestone);
      flyer.position.set(bx, 1.12, bz * 0.78);
      flyer.rotation.x = bz > 0 ? 0.55 : -0.55;
      ndGroup.add(flyer);
    });
  }
  // Slender Reconstructed Viollet-le-Duc Gothic Spire (Flèche) with Gilded Cross!
  const flecheBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.52, 8), darkSlate);
  flecheBase.position.set(0.28, 2.25, 0);
  ndGroup.add(flecheBase);
  const fleche = new THREE.Mesh(new THREE.ConeGeometry(0.14, 2.45, 8), goldLeaf);
  fleche.position.set(0.28, 3.68, 0);
  ndGroup.add(fleche);
  ndGroup.position.set(P.notreDame[0] - 0.35, 0.44, P.notreDame[1] - 0.15);
  ndGroup.rotation.y = -0.62; // Aligned squarely along dry Île de la Cité island!
  ndGroup.scale.setScalar(0.88);
  ctx.scene.add(ndGroup);

  // Sainte-Chapelle (Towering Rayonnant Stained-Glass Walls + Buttress Pinnacles!)
  const scGroup = new THREE.Group();
  const scBase = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.42, 0.72), limestone);
  scBase.position.y = 0.21;
  scGroup.add(scBase);
  const scUpper = new THREE.Mesh(new THREE.BoxGeometry(1.36, 1.15, 0.64), sainteChapelleTexMat);
  scUpper.position.y = 0.98;
  scGroup.add(scUpper);
  // Delicate vertical limestone buttress pinnacles framing stained-glass bays
  for (let sx = -0.62; sx <= 0.62; sx += 0.31) {
    [-0.34, 0.34].forEach((sz) => {
      const butt = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.56, 0.08), limestone);
      butt.position.set(sx, 0.78, sz);
      scGroup.add(butt);
      const pin = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.24, 4), limestone);
      pin.position.set(sx, 1.66, sz);
      scGroup.add(pin);
    });
  }
  const scRoof = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.38, 3), darkSlate);
  scRoof.rotation.z = Math.PI / 2;
  scRoof.position.y = 1.72;
  scGroup.add(scRoof);
  const scRose = new THREE.Mesh(new THREE.CircleGeometry(0.2, 14), roseWindowMat);
  scRose.position.set(-0.7, 1.12, 0);
  scRose.rotation.y = -Math.PI / 2;
  scGroup.add(scRose);
  const scSpire = new THREE.Mesh(new THREE.ConeGeometry(0.11, 1.95, 6), goldLeaf);
  scSpire.position.set(0.15, 2.75, 0);
  scGroup.add(scSpire);
  scGroup.position.set(P.sainteChapelle[0], 0.44, P.sainteChapelle[1]);
  scGroup.rotation.y = -0.62;
  scGroup.scale.setScalar(0.86);
  ctx.scene.add(scGroup);

  // =====================================================================
  // 13. ALL HISTORIC PARIS CHURCHES & PANTHÉON ON YOUR ITINERARY!
  // =====================================================================
  // A. Panthéon — Greek-Cross Mausoleum, Hexastyle Corinthian Portico & 24-Column Drum!
  const panY = getTerrainY(P.pantheon[0], P.pantheon[1]);
  const panGroup = new THREE.Group();
  const panArmEW = new THREE.Mesh(new THREE.BoxGeometry(3.55, 1.38, 1.82), limestone);
  panArmEW.position.y = 0.69;
  panArmEW.castShadow = true;
  panGroup.add(panArmEW);
  const panArmNS = new THREE.Mesh(new THREE.BoxGeometry(1.82, 1.38, 3.25), limestone);
  panArmNS.position.y = 0.69;
  panGroup.add(panArmNS);
  // Broad West Steps + Hexastyle (6-Column) Corinthian Portico + Sculpted Pediment
  const panSteps = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.2, 1.95), warmStone);
  panSteps.position.set(-2.12, 0.1, 0);
  panGroup.add(panSteps);
  for (let cz = -0.8; cz <= 0.8; cz += 0.32) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.072, 1.34, 8), warmStone);
    col.position.set(-2.02, 0.72, cz);
    panGroup.add(col);
  }
  const panArch = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 1.96), limestone);
  panArch.position.set(-1.95, 1.44, 0);
  panGroup.add(panArch);
  const panPed = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.56, 3), limestone);
  panPed.rotation.z = Math.PI / 2;
  panPed.scale.set(0.45, 1, 1.0);
  panPed.position.set(-1.95, 1.76, 0);
  panGroup.add(panPed);
  // Grand 24-Column Circular Peristyle Drum + Ribbed Lead Dome + Golden Lantern!
  const panDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.96, 1.02, 1.42, 24), limestone);
  panDrum.position.y = 2.02;
  panGroup.add(panDrum);
  for (let a = 0; a < 24; a++) {
    const ang = (a / 24) * Math.PI * 2;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.048, 1.24, 6), warmStone);
    col.position.set(Math.cos(ang) * 1.1, 1.96, Math.sin(ang) * 1.1);
    panGroup.add(col);
  }
  const panDrumCap = new THREE.Mesh(new THREE.CylinderGeometry(1.14, 1.14, 0.14, 24), limestone);
  panDrumCap.position.y = 2.66;
  panGroup.add(panDrumCap);
  const panDome = new THREE.Mesh(new THREE.SphereGeometry(0.98, 22, 14, 0, Math.PI * 2, 0, Math.PI / 2), darkSlate);
  panDome.scale.set(1, 1.15, 1);
  panDome.position.y = 2.72;
  panGroup.add(panDome);
  const panLantern = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.72, 10), warmGlow);
  panLantern.position.y = 4.05;
  panGroup.add(panLantern);
  const panCross = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 6), goldLeaf);
  panCross.position.y = 4.58;
  panGroup.add(panCross);
  panGroup.position.set(P.pantheon[0], panY, P.pantheon[1]);
  ctx.scene.add(panGroup);

  // B. Église Saint-Étienne-du-Mont (3-Tier Renaissance Gable, Steps & Tall Belfry!)
  const steGroup = new THREE.Group();
  const steBody = new THREE.Mesh(new THREE.BoxGeometry(1.68, 1.32, 1.12), gothicMat);
  steBody.position.y = 0.66;
  steGroup.add(steBody);
  const steRoof = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 1.66, 3), darkSlate);
  steRoof.rotation.z = Math.PI / 2;
  steRoof.position.y = 1.54;
  steGroup.add(steRoof);
  // Iconic Stepped 3-Tier Asymmetric Facade + Rose Window
  const stePed = new THREE.Mesh(new THREE.ConeGeometry(0.58, 0.72, 4), limestone);
  stePed.rotation.y = Math.PI / 4;
  stePed.position.set(-0.78, 1.62, 0);
  steGroup.add(stePed);
  const steRose = new THREE.Mesh(new THREE.CircleGeometry(0.2, 14), roseWindowMat);
  steRose.position.set(-0.86, 1.12, 0);
  steRose.rotation.y = -Math.PI / 2;
  steGroup.add(steRose);
  // Tall Square Gothic Bell Tower + Turret
  const steTower = new THREE.Mesh(new THREE.BoxGeometry(0.46, 2.55, 0.46), limestone);
  steTower.position.set(-0.56, 1.28, -0.45);
  steGroup.add(steTower);
  const steTurret = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.55, 6), darkSlate);
  steTurret.position.set(-0.56, 2.78, -0.45);
  steGroup.add(steTurret);
  steGroup.position.set(P.stEtienne[0], getTerrainY(P.stEtienne[0], P.stEtienne[1]), P.stEtienne[1]);
  ctx.scene.add(steGroup);

  // C. Église de la Madeleine — Authentic Peripteral Greek Temple + Broad Steps + 26 Columns!
  const madGroup = new THREE.Group();
  const madPodium = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.36, 3.85), limestone);
  madPodium.position.y = 0.18;
  madGroup.add(madPodium);
  // Broad front staircase facing Rue Royale / Concorde
  for (let s = 0; s < 3; s++) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.1, 0.36), warmStone);
    st.position.set(0, 0.05 + s * 0.1, 2.25 - s * 0.16);
    madGroup.add(st);
  }
  const madCella = new THREE.Mesh(new THREE.BoxGeometry(1.58, 1.32, 2.65), warmStone);
  madCella.position.y = 1.02;
  madCella.castShadow = true;
  madGroup.add(madCella);
  // 26 Perimeter Corinthian Columns!
  for (let mz = -1.65; mz <= 1.65; mz += 0.41) {
    [-1.08, 1.08].forEach((mx) => {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.072, 1.35, 8), limestone);
      c.position.set(mx, 1.02, mz);
      madGroup.add(c);
    });
  }
  for (let mx = -0.78; mx <= 0.78; mx += 0.39) {
    [-1.65, 1.65].forEach((mz) => {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.072, 1.35, 8), limestone);
      c.position.set(mx, 1.02, mz);
      madGroup.add(c);
    });
  }
  const madEntab = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.22, 3.7), limestone);
  madEntab.position.y = 1.78;
  madGroup.add(madEntab);
  const madRoof = new THREE.Mesh(new THREE.CylinderGeometry(1.26, 1.26, 3.68, 3), darkSlate);
  madRoof.rotation.x = Math.PI / 2;
  madRoof.rotation.y = Math.PI / 2;
  madRoof.scale.set(0.42, 1, 1.02);
  madRoof.position.y = 2.16;
  madGroup.add(madRoof);
  madGroup.position.set(P.madeleine[0], 0, P.madeleine[1]);
  madGroup.rotation.y = -0.35;
  ctx.scene.add(madGroup);

  // D. Église Saint-Roch (Baroque Two-Tier Columned Facade, 1' from your apartment!)
  const srGroup = new THREE.Group();
  const srBody = new THREE.Mesh(new THREE.BoxGeometry(1.28, 1.42, 2.05), palaceMat);
  srBody.position.y = 0.71;
  srGroup.add(srBody);
  for (let cx = -0.48; cx <= 0.48; cx += 0.32) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.055, 1.32, 8), limestone);
    col.position.set(cx, 0.68, 1.06);
    srGroup.add(col);
  }
  const srPed = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.32, 3), limestone);
  srPed.rotation.x = Math.PI / 2;
  srPed.rotation.y = Math.PI / 2;
  srPed.scale.set(0.4, 1, 1);
  srPed.position.set(0, 1.62, 0.92);
  srGroup.add(srPed);
  srGroup.position.set(P.stRoch[0], 0, P.stRoch[1]);
  ctx.scene.add(srGroup);

  // E. Abbaye de Saint-Germain-des-Prés (Paris's Oldest Church + Café de Flore glow!)
  const sgGroup = new THREE.Group();
  const sgNave = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.22, 2.15), gothicMat);
  sgNave.position.y = 0.61;
  sgGroup.add(sgNave);
  const sgRoof = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 2.1, 3), darkSlate);
  sgRoof.rotation.x = Math.PI / 2;
  sgRoof.rotation.y = Math.PI / 2;
  sgRoof.scale.set(0.55, 1, 1);
  sgRoof.position.y = 1.45;
  sgGroup.add(sgRoof);
  // Iconic Romanesque West Bell Tower + Steep Slate Octagonal Spire!
  const sgTower = new THREE.Mesh(new THREE.BoxGeometry(0.66, 2.35, 0.66), limestone);
  sgTower.position.set(0, 1.18, -1.15);
  sgTower.castShadow = true;
  sgGroup.add(sgTower);
  const sgSpire = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.25, 8), darkSlate);
  sgSpire.position.set(0, 2.95, -1.15);
  sgGroup.add(sgSpire);
  sgGroup.position.set(P.stGermain[0], 0, P.stGermain[1]);
  sgGroup.rotation.y = 0.3;
  ctx.scene.add(sgGroup);

  // F. Église Saint-Séverin (Flamboyant Gothic Left-Bank Church near Rue de la Huchette)
  const sevGroup = new THREE.Group();
  const sevNave = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.15, 1.75), gothicMat);
  sevNave.position.y = 0.58;
  sevGroup.add(sevNave);
  const sevTower = new THREE.Mesh(new THREE.BoxGeometry(0.52, 2.1, 0.52), limestone);
  sevTower.position.set(-0.35, 1.05, -0.75);
  sevGroup.add(sevTower);
  const sevRoof = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.85, 4), darkSlate);
  sevRoof.rotation.y = Math.PI / 4;
  sevRoof.position.set(-0.35, 2.5, -0.75);
  sevGroup.add(sevRoof);
  sevGroup.position.set(P.stSeverin[0], 0, P.stSeverin[1]);
  ctx.scene.add(sevGroup);

  // G. Église Saint-Julien-le-Pauvre & Shakespeare and Company Bookstore!
  const sjGroup = new THREE.Group();
  const sjChurch = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.05, 1.35), gothicMat);
  sjChurch.position.set(0.55, 0.52, 0.25);
  sjGroup.add(sjChurch);
  // Shakespeare and Company (Iconic Deep Forest-Green Parisian Bookstore Facade!)
  const shBook = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 1.25, 0.85),
    new THREE.MeshStandardMaterial({ color: 0xe6dac5, roughness: 0.78 })
  );
  shBook.position.set(-0.48, 0.62, -0.15);
  sjGroup.add(shBook);
  const shFront = new THREE.Mesh(
    new THREE.BoxGeometry(0.98, 0.42, 0.88),
    new THREE.MeshStandardMaterial({ color: 0x164a32, emissive: 0x1e6644, emissiveIntensity: 0.45 })
  );
  shFront.position.set(-0.48, 0.22, -0.15);
  sjGroup.add(shFront);
  sjGroup.position.set(P.shakespeare[0], 0, P.shakespeare[1]);
  ctx.scene.add(sjGroup);

  // H. Église Saint-Gervais-Saint-Protais (3-Tier Classical Facade in Le Marais!)
  const gvGroup = new THREE.Group();
  const gvNave = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.45, 1.85), gothicMat);
  gvNave.position.y = 0.72;
  gvGroup.add(gvNave);
  const gvFront = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.92, 0.35), limestone);
  gvFront.position.set(0, 0.96, -0.95);
  gvGroup.add(gvFront);
  const gvArch = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 12, 1, false, 0, Math.PI), limestone);
  gvArch.rotation.x = Math.PI / 2;
  gvArch.position.set(0, 1.92, -0.95);
  gvGroup.add(gvArch);
  gvGroup.position.set(P.stGervais[0], 0, P.stGervais[1]);
  ctx.scene.add(gvGroup);

  // I. Église Saint-Paul-Saint-Louis (Baroque Jesuit Facade + Verdigris Dome in Le Marais!)
  const spGroup = new THREE.Group();
  const spNave = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.42, 1.9), palaceMat);
  spNave.position.y = 0.71;
  spGroup.add(spNave);
  const spFacade = new THREE.Mesh(new THREE.BoxGeometry(1.18, 2.05, 0.32), limestone);
  spFacade.position.set(0, 1.02, -0.98);
  spGroup.add(spFacade);
  const spDome = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), verdigris);
  spDome.scale.set(1, 1.35, 1);
  spDome.position.set(0, 1.42, 0.15);
  spGroup.add(spDome);
  const spLantern = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 6), goldLeaf);
  spLantern.position.set(0, 2.38, 0.15);
  spGroup.add(spLantern);
  spGroup.position.set(P.stPaul[0], 0, P.stPaul[1]);
  ctx.scene.add(spGroup);

  // =====================================================================
  // 14. HÔTEL DE VILLE & PLACE DES VOSGES (LOUIS XIII RED-BRICK ARCADES!)
  // =====================================================================
  const hdvGroup = new THREE.Group();
  const hdvBody = new THREE.Mesh(new THREE.BoxGeometry(3.45, 1.35, 1.9), palaceMat);
  hdvBody.position.y = 0.68;
  hdvBody.castShadow = true;
  hdvGroup.add(hdvBody);
  [-1.45, 0, 1.45].forEach((px, idx) => {
    const pav = new THREE.Mesh(new THREE.BoxGeometry(idx === 1 ? 0.92 : 0.78, 1.55, 2.05), palaceMat);
    pav.position.set(px, 0.78, 0);
    hdvGroup.add(pav);
    const pavRoof = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.66, 0.92, 4), darkSlate);
    pavRoof.rotation.y = Math.PI / 4;
    pavRoof.scale.set(0.9, 1, 1.45);
    pavRoof.position.set(px, 2.0, 0);
    hdvGroup.add(pavRoof);
  });
  const hdvBelfry = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.25, 6), goldLeaf);
  hdvBelfry.position.set(0, 2.95, 0);
  hdvGroup.add(hdvBelfry);
  hdvGroup.position.set(P.hotelDeVille[0], 0, P.hotelDeVille[1]);
  hdvGroup.rotation.y = -0.35;
  ctx.scene.add(hdvGroup);

  // Place des Vosges — Authentic Louis XIII Red-Brick & White-Stone Arcaded Square!
  const vosgesGroup = new THREE.Group();
  [
    [0, -1.95, 4.45, 0.62],
    [0, 1.95, 4.45, 0.62],
    [-1.95, 0, 0.62, 3.35],
    [1.95, 0, 0.62, 3.35],
  ].forEach(([vx, vz, vw, vd]) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(vw, 1.08, vd), vosgesMat);
    wall.position.set(vx, 0.54, vz);
    wall.castShadow = true;
    vosgesGroup.add(wall);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(vw + 0.06, 0.1, vd + 0.06), limestone);
    trim.position.set(vx, 1.08, vz);
    vosgesGroup.add(trim);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(vw * 0.88, 0.48, vd * 0.88), darkSlate);
    roof.position.set(vx, 1.36, vz);
    vosgesGroup.add(roof);
  });
  // Central Equestrian Statue of Louis XIII in Square Louis XIII
  const l13Ped = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.42, 0.45), limestone);
  l13Ped.position.set(0, 0.25, 0);
  vosgesGroup.add(l13Ped);
  const l13Stat = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.34, 0.38), bronzeMat);
  l13Stat.position.set(0, 0.62, 0);
  vosgesGroup.add(l13Stat);
  vosgesGroup.position.set(P.placeVosges[0], 0, P.placeVosges[1]);
  ctx.scene.add(vosgesGroup);

  // =====================================================================
  // 15. PETIT PALAIS (COURTYARD GARDEN + GOLDEN PORTAL) &
  //     ARC DE TRIOMPHE (TRUE CURVED BARREL VAULTS + RELIEFS + FLAME!)
  // =====================================================================
  const ppGroup = new THREE.Group();
  // Semicircular interior courtyard garden & reflecting mosaic pool
  const ppCourt = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.08, 1.5),
    new THREE.MeshStandardMaterial({ color: 0x2a5442, roughness: 0.9 })
  );
  ppCourt.position.set(0, 0.05, -0.1);
  ppGroup.add(ppCourt);
  const ppPool = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 14), waterPoolMat);
  ppPool.position.set(0, 0.08, -0.1);
  ppGroup.add(ppPool);

  const ppFront = new THREE.Mesh(new THREE.BoxGeometry(3.1, 1.12, 0.72), palaceMat);
  ppFront.position.set(0, 0.56, 0.78);
  ppFront.castShadow = true;
  ppGroup.add(ppFront);
  const ppLeft = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.02, 2.05), palaceMat);
  ppLeft.position.set(-1.2, 0.51, -0.15);
  ppGroup.add(ppLeft);
  const ppRight = ppLeft.clone(); ppRight.position.x = 1.2; ppGroup.add(ppRight);
  const ppBack = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.02, 0.56), palaceMat);
  ppBack.position.set(0, 0.51, -0.98);
  ppGroup.add(ppBack);
  // Monumental Gilded Arched Entrance Portal + Ribbed Verdigris-and-Gold Dome!
  const ppPortal = new THREE.Mesh(new THREE.BoxGeometry(0.84, 1.28, 0.88), limestone);
  ppPortal.position.set(0, 0.64, 0.82);
  ppGroup.add(ppPortal);
  const ppGate = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.88, 0.92), goldLeaf);
  ppGate.position.set(0, 0.45, 0.84);
  ppGroup.add(ppGate);
  const ppDome = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), verdigris);
  ppDome.scale.set(1, 1.15, 1);
  ppDome.position.set(0, 1.28, 0.78);
  ppGroup.add(ppDome);
  const ppLantern = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.48, 6), goldLeaf);
  ppLantern.position.set(0, 2.15, 0.78);
  ppGroup.add(ppLantern);
  ppGroup.position.set(P.petitPalais[0], 0, P.petitPalais[1]);
  ppGroup.rotation.y = -0.42;
  ctx.scene.add(ppGroup);

  // Arc de Triomphe (True Curved Vaulted Arch, Sculpted Marseillaise Reliefs & Eternal Flame!)
  const arcGroup = new THREE.Group();
  const etoile = new THREE.Mesh(
    new THREE.CylinderGeometry(3.25, 3.25, 0.1, 32),
    new THREE.MeshStandardMaterial({ color: 0x4b546b, roughness: 0.84 })
  );
  etoile.position.y = 0.05;
  arcGroup.add(etoile);
  // 4 Massive Limestone Piers with Sculpted Relief Plaques (La Marseillaise!)
  [[-0.96, -0.48], [-0.96, 0.48], [0.96, -0.48], [0.96, 0.48]].forEach(([px, pz]) => {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(0.76, 2.25, 0.54), limestone);
    pier.position.set(px, 1.12, pz);
    pier.castShadow = true;
    arcGroup.add(pier);
    // High-relief sculptural plaque on outer face
    const relief = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.82, 0.08), warmStone);
    relief.position.set(px, 0.92, pz + (pz > 0 ? 0.28 : -0.28));
    arcGroup.add(relief);
  });
  // Inner side transverse bridge vaults
  [-0.96, 0.96].forEach((px) => {
    const sideTop = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.72, 1.5), limestone);
    sideTop.position.set(px, 1.88, 0);
    arcGroup.add(sideTop);
  });
  // True Curved Semicircular Central Barrel Vault Soffit + Carved Arch Ring!
  const vaultRing = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.08, 8, 18, Math.PI), warmStone);
  vaultRing.position.set(0, 1.56, 0.75);
  arcGroup.add(vaultRing);
  const vaultRingBack = vaultRing.clone();
  vaultRingBack.position.z = -0.75;
  arcGroup.add(vaultRingBack);
  // Grand Entablature, Carved Frieze, Attic with 30 Shields & Cornice!
  const entab = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.92, 1.6), limestone);
  entab.position.y = 2.66;
  entab.castShadow = true;
  arcGroup.add(entab);
  const frieze = new THREE.Mesh(new THREE.BoxGeometry(2.96, 0.18, 1.68), warmStone);
  frieze.position.y = 2.25;
  arcGroup.add(frieze);
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(3.04, 0.14, 1.74), limestone);
  cornice.position.y = 3.12;
  arcGroup.add(cornice);
  const attic = new THREE.Mesh(new THREE.BoxGeometry(2.74, 0.44, 1.5), warmStone);
  attic.position.y = 3.38;
  arcGroup.add(attic);
  // Tomb of the Unknown Soldier & Flickering Eternal Flame
  const tombSlab = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.42), bronzeMat);
  tombSlab.position.set(0, 0.14, 0);
  arcGroup.add(tombSlab);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.36, 8), warmGlow);
  flame.position.set(0, 0.34, 0);
  arcGroup.add(flame);
  arcGroup.position.set(P.arcTriomphe[0], 0, P.arcTriomphe[1]);
  arcGroup.rotation.y = -0.42;
  arcGroup.scale.setScalar(0.72); // True proportion on grand Place Charles de Gaulle roundabout!
  ctx.scene.add(arcGroup);

  // =====================================================================
  // 16. FONDATION LOUIS VUITTON (FRANK GEHRY 12 BILLOWING GLASS SAILS!)
  // =====================================================================
  const flvGroup = new THREE.Group();
  // Stepped Cascading Reflection Water Basin
  const basin = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.12, 3.8), waterPoolMat);
  basin.position.y = 0.08;
  flvGroup.add(basin);
  // Tiered White Ductal Concrete "Iceberg" Galleries Core + Panoramic Terraces
  const iceMat = new THREE.MeshStandardMaterial({ color: 0xf8fafd, emissive: 0x9bd2ff, emissiveIntensity: 0.28, roughness: 0.3 });
  const iceberg1 = new THREE.Mesh(new THREE.BoxGeometry(3.1, 1.15, 1.95), iceMat);
  iceberg1.position.y = 0.68;
  flvGroup.add(iceberg1);
  const iceberg2 = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.78, 1.35), iceMat);
  iceberg2.position.set(0.2, 1.62, -0.1);
  flvGroup.add(iceberg2);
  const sailMat = new THREE.MeshStandardMaterial({
    color: 0xe0f5ff,
    emissive: 0x7ac4ff,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.6,
    roughness: 0.06,
    metalness: 0.3,
    side: THREE.DoubleSide,
  });
  ctx.monumentGlowMaterials.push(sailMat);
  // 12 Dynamic Overlapping Curved Glass Sails with Crisp Structural Ribs!
  const sailSpecs = [
    [-1.75, 1.5, 0.72, 0.25, 0.48, 0.36, 1.48],
    [-0.65, 2.38, -0.35, -0.18, 0.22, -0.14, 1.72],
    [0.58, 2.48, 0.48, 0.28, -0.24, -0.22, 1.68],
    [1.75, 1.55, -0.25, -0.22, -0.52, -0.38, 1.44],
    [0.05, 1.72, 1.35, 0.44, 0.12, 0.1, 1.38],
    [-1.05, 1.88, -1.18, -0.36, 0.35, 0.25, 1.42],
    [1.05, 1.92, -1.08, -0.3, -0.3, -0.2, 1.38],
    [-2.15, 1.25, -0.35, 0.15, 0.75, 0.42, 1.2],
    [2.15, 1.2, 0.55, 0.22, -0.7, -0.35, 1.18],
    [-0.1, 2.75, 0.05, 0.08, 0.12, -0.08, 1.35],
  ];
  sailSpecs.forEach(([sx, sy, sz, rx, ry, rz, rad]) => {
    const sGeo = new THREE.SphereGeometry(rad, 10, 8, 0, Math.PI * 0.62, 0.18, Math.PI * 0.56);
    const sail = new THREE.Mesh(sGeo, sailMat);
    sail.position.set(sx, sy, sz);
    sail.rotation.set(rx, ry, rz);
    flvGroup.add(sail);
    const wire = new THREE.Mesh(sGeo, new THREE.MeshBasicMaterial({ color: 0xf0f9ff, wireframe: true, transparent: true, opacity: 0.42 }));
    wire.position.copy(sail.position);
    wire.rotation.copy(sail.rotation);
    flvGroup.add(wire);
  });
  flvGroup.position.set(P.flv[0], 0.08, P.flv[1]);
  ctx.scene.add(flvGroup);

  // =====================================================================
  // 17. MUSÉE MARMOTTAN MONET (19th-Century Hôtel Particulier & Garden)
  // =====================================================================
  const marGroup = new THREE.Group();
  const marBody = new THREE.Mesh(new THREE.BoxGeometry(2.45, 1.32, 1.72), palaceMat);
  marBody.position.y = 0.66;
  marBody.castShadow = true;
  marGroup.add(marBody);
  const marPed = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.36, 4), limestone);
  marPed.rotation.y = Math.PI / 4;
  marPed.position.set(0, 1.48, 0.72);
  marGroup.add(marPed);
  const marRoof = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.42, 0.58, 4), darkSlate);
  marRoof.rotation.y = Math.PI / 4;
  marRoof.scale.set(1.22, 1, 0.86);
  marRoof.position.y = 1.62;
  marGroup.add(marRoof);
  marGroup.position.set(P.marmottan[0], 0, P.marmottan[1]);
  ctx.scene.add(marGroup);

  // =====================================================================
  // 18. MONTMARTRE: MOULIN ROUGE (NEON MARQUEE + ROTATING MILL),
  //     LA MAISON ROSE, CLOS MONTMARTRE, SACRÉ-CŒUR & SAINT-PIERRE!
  // =====================================================================
  const mrGroup = new THREE.Group();
  const mrRed = new THREE.MeshStandardMaterial({
    color: 0xe6294a,
    emissive: 0xd91a3c,
    emissiveIntensity: 0.94,
    roughness: 0.32,
  });
  ctx.monumentGlowMaterials.push(mrRed);
  const mrHall = new THREE.Mesh(new THREE.BoxGeometry(2.05, 1.15, 1.35), palaceMat);
  mrHall.position.y = 0.58;
  mrGroup.add(mrHall);
  // Glowing Neon "MOULIN ROUGE" Cabaret Marquee Sign!
  const mrSign = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.42, 0.14), moulinSignMat);
  mrSign.position.set(0, 0.92, 0.72);
  mrGroup.add(mrSign);
  const mrMill = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.56, 1.55, 12), mrRed);
  mrMill.position.y = 1.58;
  mrGroup.add(mrMill);
  const mrCap = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.45, 12), mrRed);
  mrCap.position.y = 2.52;
  mrGroup.add(mrCap);
  ctx.moulinSails = new THREE.Group();
  ctx.moulinSails.position.set(0, 2.02, 0.48);
  for (let s = 0; s < 4; s++) {
    const pivot = new THREE.Group();
    pivot.rotation.z = (s * Math.PI) / 2;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.12, 0.05), mrRed);
    blade.position.y = 0.56;
    pivot.add(blade);
    const lattice = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.12, 0.06), new THREE.MeshBasicMaterial({ color: 0xffe49e, wireframe: true }));
    lattice.position.y = 0.56;
    pivot.add(lattice);
    ctx.moulinSails.add(pivot);
  }
  mrGroup.add(ctx.moulinSails);
  mrGroup.position.set(P.moulinRouge[0], getTerrainY(P.moulinRouge[0], P.moulinRouge[1]), P.moulinRouge[1]);
  ctx.scene.add(mrGroup);

  ctx.landmarkLabelEntries.push({
    id: 'landmark-moulin',
    label: 'Moulin Rouge',
    pos: new THREE.Vector3(P.moulinRouge[0], getTerrainY(P.moulinRouge[0], P.moulinRouge[1]) + 3.0, P.moulinRouge[1]),
    isHome: false,
    isStop: false,
    day: 3,
  });

  // La Maison Rose (Iconic Pink Montmartre Corner Bistro + Green Shutters!)
  const roseY = getTerrainY(P.maisonRose[0], P.maisonRose[1]);
  const roseHouse = new THREE.Group();
  const rhBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.12, 1.12, 1.02),
    new THREE.MeshStandardMaterial({ color: 0xf4a8bc, roughness: 0.68 })
  );
  rhBody.position.y = 0.56;
  roseHouse.add(rhBody);
  // Dark forest-green Parisian shutters
  [-0.32, 0.32].forEach((sx) => {
    const shut = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.34, 1.06), new THREE.MeshStandardMaterial({ color: 0x1d4d3a }));
    shut.position.set(sx, 0.72, 0);
    roseHouse.add(shut);
  });
  const rhRoof = new THREE.Mesh(new THREE.ConeGeometry(0.86, 0.55, 4), brickMat);
  rhRoof.rotation.y = Math.PI / 4;
  rhRoof.position.y = 1.38;
  roseHouse.add(rhRoof);
  roseHouse.position.set(P.maisonRose[0], roseY, P.maisonRose[1]);
  ctx.scene.add(roseHouse);

  // Basilique du Sacré-Cœur (White Travertine Romano-Byzantine Masterwork)
  // + Église Saint-Pierre de Montmartre right beside it!
  const scY = getTerrainY(P.sacreCoeur[0], P.sacreCoeur[1]);
  const scMont = new THREE.Group();
  const travertine = new THREE.MeshStandardMaterial({
    color: 0xfefcf8,
    emissive: 0xffe8c7,
    emissiveIntensity: 0.38,
    roughness: 0.42,
  });
  ctx.monumentGlowMaterials.push(travertine);

  // Sweeping Stepped Terraces & Double Grand Staircase climbing Butte Montmartre
  for (let st = 0; st < 6; st++) {
    const stair = new THREE.Mesh(new THREE.BoxGeometry(3.1 - st * 0.18, 0.24, 0.58), warmStone);
    stair.position.set(0, -1.15 + st * 0.22, 3.1 - st * 0.44);
    scMont.add(stair);
  }
  const basBody = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.5, 2.55), travertine);
  basBody.position.y = 0.75;
  basBody.castShadow = true;
  scMont.add(basBody);
  // Triple-Arched South Entrance Porch + 2 Bronze Equestrian Statues (Joan of Arc & Louis IX)!
  const portico = new THREE.Mesh(new THREE.BoxGeometry(2.25, 1.42, 0.72), travertine);
  portico.position.set(0, 0.71, 1.48);
  scMont.add(portico);
  [-0.62, 0, 0.62].forEach((ax) => {
    const archVoid = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.85, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x2a2f3d })
    );
    archVoid.position.set(ax, 0.44, 1.82);
    scMont.add(archVoid);
  });
  [-0.58, 0.58].forEach((ex) => {
    const eq = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.36, 0.28), bronzeMat);
    eq.position.set(ex, 1.58, 1.55);
    scMont.add(eq);
  });
  // Tall Colonnaded Drum + Elongated Fluted Ovoid Main Dome + Lantern + Cross!
  const scDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.92, 0.96, 20), travertine);
  scDrum.position.set(0, 1.92, 0.05);
  scMont.add(scDrum);
  for (let a = 0; a < 16; a++) {
    const ang = (a / 16) * Math.PI * 2;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.82, 6), warmStone);
    col.position.set(Math.cos(ang) * 0.92, 1.92, 0.05 + Math.sin(ang) * 0.92);
    scMont.add(col);
  }
  const mainDome = new THREE.Mesh(new THREE.SphereGeometry(0.86, 22, 16), travertine);
  mainDome.scale.set(1, 1.78, 1);
  mainDome.position.set(0, 2.68, 0.05);
  mainDome.castShadow = true;
  scMont.add(mainDome);
  const mainLantern = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.68, 10), warmGlow);
  mainLantern.position.set(0, 4.35, 0.05);
  scMont.add(mainLantern);
  const scCross = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.42, 6), goldLeaf);
  scCross.position.set(0, 4.86, 0.05);
  scMont.add(scCross);
  // 4 Flanking Elongated Ovoid Cupolas with tiny lanterns
  [[-1.16, 0.64], [1.16, 0.64], [-1.16, -0.62], [1.16, -0.62]].forEach(([dx, dz]) => {
    const cup = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 10), travertine);
    cup.scale.set(1, 1.62, 1);
    cup.position.set(dx, 1.92, dz);
    scMont.add(cup);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.26, 8), warmGlow);
    cap.position.set(dx, 2.68, dz);
    scMont.add(cap);
  });
  // Tall Square Rear Campanile Bell Tower (Houses La Savoyarde Bell!)
  const camp = new THREE.Mesh(new THREE.BoxGeometry(0.72, 3.55, 0.72), travertine);
  camp.position.set(0, 1.98, -1.48);
  scMont.add(camp);
  const campCap = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 10), travertine);
  campCap.scale.set(1, 1.48, 1);
  campCap.position.set(0, 3.92, -1.48);
  scMont.add(campCap);

  // Ancient Medieval Église Saint-Pierre de Montmartre right beside Sacré-Cœur!
  const spmBody = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.95, 1.45), gothicMat);
  spmBody.position.set(-2.65, 0.38, 0.55);
  scMont.add(spmBody);
  const spmTower = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.45, 0.42), warmStone);
  spmTower.position.set(-2.65, 0.72, 1.15);
  scMont.add(spmTower);

  scMont.position.set(P.sacreCoeur[0], scY, P.sacreCoeur[1]);
  ctx.scene.add(scMont);
}

