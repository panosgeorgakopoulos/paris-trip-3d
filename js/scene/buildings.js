// 26,928 real OpenStreetMap Paris Haussmannian buildings merged into 2 GPU draw calls
import { getTerrainY } from '../config.js';
import { ctx, liveLight, fetchZbin } from '../state.js';
import { createHaussmannTextures, createZincRoofTexture } from '../textures.js';

export function buildClassicParisianHouses() {
  const { diffuseTex, emissiveTex } = createHaussmannTextures();
  const zincTex = createZincRoofTexture();
  const maxAniso = Math.min(16, ctx.renderer.capabilities.getMaxAnisotropy());
  [diffuseTex, emissiveTex, zincTex].forEach((t) => {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = maxAniso;
  });

  // Preserved for Place Vendôme & Place Dauphine flanking townhouses
  ctx.haussmannMat = new THREE.MeshStandardMaterial({
    map: diffuseTex,
    emissive: new THREE.Color(0xffc970),
    emissiveMap: emissiveTex,
    emissiveIntensity: liveLight.windowGlow,
    roughness: 0.76,
    metalness: 0.04,
  });

  // Vertex-colored Haussmannian facade material for all 8,490 real OSM buildings
  const osmWallsMat = ctx.haussmannMat.clone();
  osmWallsMat.vertexColors = true;
  ctx.monumentGlowMaterials.push(osmWallsMat);

  const mansardMat = new THREE.MeshStandardMaterial({
    map: zincTex,
    color: 0x677991,
    roughness: 0.52,
    metalness: 0.36,
  });

  // Fast, rock-solid 2D Ear-Clipping Triangulator for concave L/U-shaped Parisian blocks!
  function earcutPoly(pts) {
    const n = pts.length;
    if (n === 3) return [0, 1, 2];
    const idx = [];
    for (let i = 0; i < n; i++) idx.push(i);
    const tris = [];
    let guard = n * n;
    const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const ptInTri = (p, a, b, c) => {
      const c1 = cross(a, b, p), c2 = cross(b, c, p), c3 = cross(c, a, p);
      return c1 >= -1e-6 && c2 >= -1e-6 && c3 >= -1e-6;
    };
    while (idx.length > 3 && guard-- > 0) {
      let clipped = false;
      for (let i = 0; i < idx.length; i++) {
        const i0 = idx[(i - 1 + idx.length) % idx.length];
        const i1 = idx[i];
        const i2 = idx[(i + 1) % idx.length];
        const a = pts[i0], b = pts[i1], c = pts[i2];
        if (cross(a, b, c) <= 1e-6) continue;
        let hasInside = false;
        for (let j = 0; j < idx.length; j++) {
          const k = idx[j];
          if (k === i0 || k === i1 || k === i2) continue;
          if (ptInTri(pts[k], a, b, c)) { hasInside = true; break; }
        }
        if (!hasInside) {
          tris.push(i0, i1, i2);
          idx.splice(i, 1);
          clipped = true;
          break;
        }
      }
      if (!clipped) break;
    }
    if (idx.length === 3) tris.push(idx[0], idx[1], idx[2]);
    return tris;
  }

  // Fetch gzip-packed binary GIS building footprints (26,928 real OSM Paris buildings)
  (async () => {
    const bytes = await fetchZbin('./data/paris-buildings.zbin');
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

      let totalEdges = 0, totalRoofTris = 0, off = 0;
      while (off + 6 <= bytes.length) {
        const n = dv.getUint8(off);
        off += 6 + (n - 1) * 2;
        totalEdges += n;
        totalRoofTris += Math.max(1, n - 2);
      }

      const wallPos = new Float32Array(totalEdges * 18);
      const wallNorm = new Float32Array(totalEdges * 18);
      const wallUv = new Float32Array(totalEdges * 12);
      const wallCol = new Float32Array(totalEdges * 18);
      const roofPos = new Float32Array(totalRoofTris * 9);
      const roofNorm = new Float32Array(totalRoofTris * 9);
      const roofUv = new Float32Array(totalRoofTris * 6);

      const limestoneShades = [
        [1.0, 0.99, 0.97],
        [0.97, 0.94, 0.88],
        [0.94, 0.90, 0.83],
        [0.92, 0.88, 0.80],
        [0.98, 0.96, 0.91],
      ];

      let wp = 0, wu = 0, rp = 0, ru = 0, bIdx = 0;
      off = 0;
      const invScale = 1 / 33.3333;
      while (off + 6 <= bytes.length) {
        const n = dv.getUint8(off);
        const h = dv.getUint8(off + 1) * 0.01;
        const x0q = dv.getInt16(off + 2, true);
        const z0q = dv.getInt16(off + 4, true);
        off += 6;

        const pts = new Array(n);
        pts[0] = [x0q * invScale, z0q * invScale];
        for (let i = 1; i < n; i++) {
          pts[i] = [(x0q + dv.getInt8(off)) * invScale, (z0q + dv.getInt8(off + 1)) * invScale];
          off += 2;
        }

        let minY = 999, maxY = -999;
        for (let i = 0; i < n; i++) {
          const gy = getTerrainY(pts[i][0], pts[i][1]);
          if (gy < minY) minY = gy;
          if (gy > maxY) maxY = gy;
        }
        const baseY = minY - 0.14;
        const topY = maxY + h;
        const wallH = topY - baseY;
        const shade = limestoneShades[bIdx % limestoneShades.length];
        bIdx++;

        let uAcc = 0;
        for (let i = 0; i < n; i++) {
          const a = pts[i], b = pts[(i + 1) % n];
          const dx = b[0] - a[0], dz = b[1] - a[1];
          const len = Math.hypot(dx, dz);
          if (len < 0.01) continue;
          const nx = dz / len, nz = -dx / len;
          const u0 = uAcc;
          const u1 = uAcc + len * 0.78;
          uAcc = u1;
          const vTop = wallH * 0.95;

          wallPos[wp] = a[0]; wallPos[wp + 1] = baseY; wallPos[wp + 2] = a[1];
          wallPos[wp + 3] = a[0]; wallPos[wp + 4] = topY; wallPos[wp + 5] = a[1];
          wallPos[wp + 6] = b[0]; wallPos[wp + 7] = topY; wallPos[wp + 8] = b[1];
          wallPos[wp + 9] = a[0]; wallPos[wp + 10] = baseY; wallPos[wp + 11] = a[1];
          wallPos[wp + 12] = b[0]; wallPos[wp + 13] = topY; wallPos[wp + 14] = b[1];
          wallPos[wp + 15] = b[0]; wallPos[wp + 16] = baseY; wallPos[wp + 17] = b[1];

          for (let k = 0; k < 18; k += 3) {
            wallNorm[wp + k] = nx; wallNorm[wp + k + 1] = 0; wallNorm[wp + k + 2] = nz;
            wallCol[wp + k] = shade[0]; wallCol[wp + k + 1] = shade[1]; wallCol[wp + k + 2] = shade[2];
          }
          wp += 18;

          wallUv[wu] = u0; wallUv[wu + 1] = 0;
          wallUv[wu + 2] = u0; wallUv[wu + 3] = vTop;
          wallUv[wu + 4] = u1; wallUv[wu + 5] = vTop;
          wallUv[wu + 6] = u0; wallUv[wu + 7] = 0;
          wallUv[wu + 8] = u1; wallUv[wu + 9] = vTop;
          wallUv[wu + 10] = u1; wallUv[wu + 11] = 0;
          wu += 12;
        }

        const roofY = topY + 0.01;
        const tris = earcutPoly(pts);
        for (let t = 0; t < tris.length; t += 3) {
          const p0 = pts[tris[t]], p1 = pts[tris[t + 1]], p2 = pts[tris[t + 2]];
          roofPos[rp] = p0[0]; roofPos[rp + 1] = roofY; roofPos[rp + 2] = p0[1];
          roofPos[rp + 3] = p2[0]; roofPos[rp + 4] = roofY; roofPos[rp + 5] = p2[1];
          roofPos[rp + 6] = p1[0]; roofPos[rp + 7] = roofY; roofPos[rp + 8] = p1[1];
          roofNorm[rp + 1] = 1; roofNorm[rp + 4] = 1; roofNorm[rp + 7] = 1;
          rp += 9;
          roofUv[ru] = p0[0] * 0.65; roofUv[ru + 1] = p0[1] * 0.65;
          roofUv[ru + 2] = p2[0] * 0.65; roofUv[ru + 3] = p2[1] * 0.65;
          roofUv[ru + 4] = p1[0] * 0.65; roofUv[ru + 5] = p1[1] * 0.65;
          ru += 6;
        }
      }

      const wallsGeo = new THREE.BufferGeometry();
      wallsGeo.setAttribute('position', new THREE.BufferAttribute(wallPos.subarray(0, wp), 3));
      wallsGeo.setAttribute('normal', new THREE.BufferAttribute(wallNorm.subarray(0, wp), 3));
      wallsGeo.setAttribute('uv', new THREE.BufferAttribute(wallUv.subarray(0, wu), 2));
      wallsGeo.setAttribute('color', new THREE.BufferAttribute(wallCol.subarray(0, wp), 3));
      const wallsMesh = new THREE.Mesh(wallsGeo, osmWallsMat);
      wallsMesh.castShadow = true;
      wallsMesh.receiveShadow = true;
      ctx.scene.add(wallsMesh);

      const roofsGeo = new THREE.BufferGeometry();
      roofsGeo.setAttribute('position', new THREE.BufferAttribute(roofPos.subarray(0, rp), 3));
      roofsGeo.setAttribute('normal', new THREE.BufferAttribute(roofNorm.subarray(0, rp), 3));
      roofsGeo.setAttribute('uv', new THREE.BufferAttribute(roofUv.subarray(0, ru), 2));
      const roofsMesh = new THREE.Mesh(roofsGeo, mansardMat);
      roofsMesh.castShadow = true;
      roofsMesh.receiveShadow = true;
      ctx.scene.add(roofsMesh);
    })().catch((e) => console.warn('OSM buildings load:', e));
}

