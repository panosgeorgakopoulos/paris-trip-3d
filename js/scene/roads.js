// 11,796 real OpenStreetMap Paris streets + hero itinerary boulevards & cast-iron lamps
import { geoToXZ, getTerrainY, P } from '../config.js';
import { ctx, fetchZbin } from '../state.js';
import { createParisRoadTextures } from '../textures.js';
import { getSeineClearance } from './environment.js';

export function buildRealParisRoadNetwork() {
  const { boulevardTex, streetTex, cobbleTex } = createParisRoadTextures();
  const surf = ctx.surfaces;
  const boulevardMat = new THREE.MeshStandardMaterial({ map: boulevardTex, bumpMap: surf.microDetailTex, bumpScale: 0.04, roughness: 0.68, metalness: 0.08 });
  const streetMat = new THREE.MeshStandardMaterial({ map: streetTex, bumpMap: surf.microDetailTex, bumpScale: 0.04, roughness: 0.72, metalness: 0.06 });
  const cobbleMat = new THREE.MeshStandardMaterial({ map: cobbleTex, bumpMap: surf.stoneDetailTex, bumpScale: 0.08, roughness: 0.82, metalness: 0.05 });
  const junctionAsphaltMat = new THREE.MeshStandardMaterial({ color: 0x333946, bumpMap: surf.microDetailTex, bumpScale: 0.04, roughness: 0.72 });
  const junctionCobbleMat = new THREE.MeshStandardMaterial({ map: surf.plazaTex, bumpMap: surf.plazaBumpTex, bumpScale: 0.07, roughness: 0.84 });

  // -------------------------------------------------------------------
  // 100% REAL OPENSTREETMAP PARIS STREET NETWORK (11,796 REAL STREETS
  // ACROSS ALL 20 ARRONDISSEMENTS — GZIP-PACKED, 2-PASS TYPED ARRAYS!)
  // -------------------------------------------------------------------
  // Fetch gzip-packed binary GIS road network (11,796 real OSM Paris streets)
  (async () => {
    const bytes = await fetchZbin('./data/paris-roads.zbin');
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

      const tierWidths = [0.64, 0.44, 0.30, 0.21];
      let segCount = 0, off = 0;
      while (off + 2 <= bytes.length) {
        const n = dv.getUint8(off + 1);
        off += 2;
        let px0 = dv.getInt16(off, true) * 0.05, pz0 = dv.getInt16(off + 2, true) * 0.05;
        off += 4;
        for (let i = 1; i < n; i++) {
          const nx = dv.getInt16(off, true) * 0.05, nz = dv.getInt16(off + 2, true) * 0.05;
          off += 4;
          if (getSeineClearance((px0 + nx) * 0.5, (pz0 + nz) * 0.5) > 0.25 && Math.hypot(nx - px0, nz - pz0) > 0.04) segCount++;
          px0 = nx; pz0 = nz;
        }
      }
      if (segCount === 0) return;

      const curbPos = new Float32Array(segCount * 18);
      const roadPos = new Float32Array(segCount * 18);
      const roadUvs = new Float32Array(segCount * 12);
      let pIdx = 0, uIdx = 0;
      off = 0;
      while (off + 2 <= bytes.length) {
        const tier = dv.getUint8(off);
        const n = dv.getUint8(off + 1);
        off += 2;
        const hw = (tierWidths[tier] || 0.24) * 0.5;
        const chw = hw + 0.095;
        let prevX = dv.getInt16(off, true) * 0.05;
        let prevZ = dv.getInt16(off + 2, true) * 0.05;
        off += 4;
        for (let i = 1; i < n; i++) {
          const nx = dv.getInt16(off, true) * 0.05;
          const nz = dv.getInt16(off + 2, true) * 0.05;
          off += 4;
          const mx = (prevX + nx) * 0.5, mz = (prevZ + nz) * 0.5;
          const dx = nx - prevX, dz = nz - prevZ;
          const len = Math.hypot(dx, dz);
          if (len > 0.04 && getSeineClearance(mx, mz) > 0.25) {
            const px = -dz / len, pz = dx / len;
            const yA = getTerrainY(prevX, prevZ);
            const yB = getTerrainY(nx, nz);
            const yM = Math.max((yA + yB) * 0.5, getTerrainY(mx, mz));
            const liftA = Math.max(yA, yM - 0.02);
            const liftB = Math.max(yB, yM - 0.02);

            const cyA = liftA + 0.036, cyB = liftB + 0.036;
            const c1x = prevX + px * chw, c1z = prevZ + pz * chw;
            const c2x = prevX - px * chw, c2z = prevZ - pz * chw;
            const c3x = nx - px * chw,    c3z = nz - pz * chw;
            const c4x = nx + px * chw,    c4z = nz + pz * chw;
            curbPos[pIdx] = c1x; curbPos[pIdx + 1] = cyA; curbPos[pIdx + 2] = c1z;
            curbPos[pIdx + 3] = c3x; curbPos[pIdx + 4] = cyB; curbPos[pIdx + 5] = c3z;
            curbPos[pIdx + 6] = c2x; curbPos[pIdx + 7] = cyA; curbPos[pIdx + 8] = c2z;
            curbPos[pIdx + 9] = c1x; curbPos[pIdx + 10] = cyA; curbPos[pIdx + 11] = c1z;
            curbPos[pIdx + 12] = c4x; curbPos[pIdx + 13] = cyB; curbPos[pIdx + 14] = c4z;
            curbPos[pIdx + 15] = c3x; curbPos[pIdx + 16] = cyB; curbPos[pIdx + 17] = c3z;

            const ryA = liftA + 0.052, ryB = liftB + 0.052;
            const r1x = prevX + px * hw, r1z = prevZ + pz * hw;
            const r2x = prevX - px * hw, r2z = prevZ - pz * hw;
            const r3x = nx - px * hw,    r3z = nz - pz * hw;
            const r4x = nx + px * hw,    r4z = nz + pz * hw;
            roadPos[pIdx] = r1x; roadPos[pIdx + 1] = ryA; roadPos[pIdx + 2] = r1z;
            roadPos[pIdx + 3] = r3x; roadPos[pIdx + 4] = ryB; roadPos[pIdx + 5] = r3z;
            roadPos[pIdx + 6] = r2x; roadPos[pIdx + 7] = ryA; roadPos[pIdx + 8] = r2z;
            roadPos[pIdx + 9] = r1x; roadPos[pIdx + 10] = ryA; roadPos[pIdx + 11] = r1z;
            roadPos[pIdx + 12] = r4x; roadPos[pIdx + 13] = ryB; roadPos[pIdx + 14] = r4z;
            roadPos[pIdx + 15] = r3x; roadPos[pIdx + 16] = ryB; roadPos[pIdx + 17] = r3z;
            pIdx += 18;

            const vLen = len * 0.65;
            roadUvs[uIdx] = 0; roadUvs[uIdx + 1] = 0;
            roadUvs[uIdx + 2] = 1; roadUvs[uIdx + 3] = vLen;
            roadUvs[uIdx + 4] = 1; roadUvs[uIdx + 5] = 0;
            roadUvs[uIdx + 6] = 0; roadUvs[uIdx + 7] = 0;
            roadUvs[uIdx + 8] = 0; roadUvs[uIdx + 9] = vLen;
            roadUvs[uIdx + 10] = 1; roadUvs[uIdx + 11] = vLen;
            uIdx += 12;
          }
          prevX = nx; prevZ = nz;
        }
      }

      const cGeo = new THREE.BufferGeometry();
      cGeo.setAttribute('position', new THREE.BufferAttribute(curbPos, 3));
      cGeo.computeVertexNormals();
      const cMesh = new THREE.Mesh(cGeo, new THREE.MeshStandardMaterial({ color: 0xd6cebe, roughness: 0.82 }));
      cMesh.receiveShadow = true;
      ctx.scene.add(cMesh);

      const rGeo = new THREE.BufferGeometry();
      rGeo.setAttribute('position', new THREE.BufferAttribute(roadPos, 3));
      rGeo.setAttribute('uv', new THREE.BufferAttribute(roadUvs, 2));
      rGeo.computeVertexNormals();
      const osmRoadMat = new THREE.MeshStandardMaterial({
        color: 0x353c4a,
        bumpMap: surf.microDetailTex,
        bumpScale: 0.035,
        roughness: 0.7,
        metalness: 0.07,
      });
      const rMesh = new THREE.Mesh(rGeo, osmRoadMat);
      rMesh.receiveShadow = true;
      ctx.scene.add(rMesh);
    })().catch((e) => console.warn('OSM roads load:', e));

  const lampPositions = [];
  const junctionSet = new Set();

  function addRoadPolyline(pts, width, addLamps, style = 'street') {
    ctx.roadPolylines.push({ pts, width });
    const segMat = style === 'boulevard' ? boulevardMat : (style === 'cobble' ? cobbleMat : streetMat);
    const jMat = style === 'cobble' ? junctionCobbleMat : junctionAsphaltMat;

    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, z1] = pts[i];
      const [x2, z2] = pts[i + 1];
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.hypot(dx, dz);
      if (len < 0.08) continue;

      // Smooth circular junction hub at road endpoints (prevents jagged box corners!)
      [[x1, z1], [x2, z2]].forEach(([jx, jz]) => {
        const key = `${Math.round(jx * 2)}_${Math.round(jz * 2)}`;
        if (!junctionSet.has(key) && getSeineClearance(jx, jz) > 0.45) {
          junctionSet.add(key);
          const jy = getTerrainY(jx, jz);
          const hub = new THREE.Mesh(new THREE.CylinderGeometry(width * 0.56, width * 0.58, 0.075, 14), jMat);
          hub.position.set(jx, jy + 0.038, jz);
          hub.receiveShadow = true;
          ctx.scene.add(hub);
        }
      });

      const y1 = getTerrainY(x1, z1), y2 = getTerrainY(x2, z2);
      const isSloped = Math.abs(y2 - y1) > 0.08 || y1 > 0.1 || y2 > 0.1;
      const steps = Math.max(1, Math.ceil(len / (isSloped ? 2.1 : 3.8)));
      for (let s = 0; s < steps; s++) {
        const t0 = s / steps;
        const t1 = (s + 1) / steps;
        const ax = x1 + dx * t0, az = z1 + dz * t0;
        const bx = x1 + dx * t1, bz = z1 + dz * t1;
        const mx = (ax + bx) * 0.5, mz = (az + bz) * 0.5;
        // Never paint asphalt segments inside the River Seine (real 3D bridges span water!)
        if (getSeineClearance(mx, mz) < 0.15) continue;

        const ya = getTerrainY(ax, az);
        const yb = getTerrainY(bx, bz);
        const my = Math.max(getTerrainY(mx, mz), (ya + yb) * 0.5);
        const horizLen = Math.hypot(bx - ax, bz - az);
        const segLen = Math.hypot(horizLen, yb - ya) + 0.14;
        const repY = Math.max(1, segLen / 3.2);

        // Orient plane flat in XZ & pitch smoothly along Montmartre/Panthéon/Chaillot hill slopes!
        const segGeo = new THREE.PlaneGeometry(width + 0.46, segLen);
        const uvAttr = segGeo.attributes.uv;
        for (let u = 0; u < uvAttr.count; u++) {
          uvAttr.setY(u, uvAttr.getY(u) * repY);
        }
        segGeo.rotateX(-Math.PI / 2);

        const roadMesh = new THREE.Mesh(segGeo, segMat);
        roadMesh.rotation.order = 'YXZ';
        roadMesh.rotation.y = Math.atan2(bx - ax, bz - az);
        roadMesh.rotation.x = -Math.atan2(yb - ya, Math.max(0.001, horizLen));
        roadMesh.position.set(mx, my + 0.095, mz);
        roadMesh.receiveShadow = true;
        ctx.scene.add(roadMesh);
      }

      // Classic Parisian cast-iron streetlamps along major avenues & boulevards
      if (addLamps) {
        const count = Math.max(1, Math.floor(len / 4.2));
        const nx = -dz / len;
        const nz = dx / len;
        for (let k = 1; k <= count; k++) {
          const f = k / (count + 1);
          const px = x1 + dx * f;
          const pz = z1 + dz * f;
          if (getSeineClearance(px, pz) < 0.75) continue;
          const offset = width * 0.5 + 0.22;
          const lx1 = px + nx * offset, lz1 = pz + nz * offset;
          const lx2 = px - nx * offset, lz2 = pz - nz * offset;
          if (getSeineClearance(lx1, lz1) > 0.45) lampPositions.push([lx1, getTerrainY(lx1, lz1), lz1]);
          if (getSeineClearance(lx2, lz2) > 0.45) lampPositions.push([lx2, getTerrainY(lx2, lz2), lz2]);
        }
      }
    }
  }

  // Major Real Paris Boulevards, Avenues & Historic Cobblestone Streets!
  // 1. Axe Historique: Louvre -> Tuileries -> Concorde -> Champs-Élysées -> Arc de Triomphe -> Porte Maillot -> FLV
  addRoadPolyline([P.louvre, P.tuileriesMid, P.concorde, P.champsMid, P.arcTriomphe, P.porteMaillot, P.flv], 1.68, true, 'boulevard');
  // 2. Rue de Rivoli -> Hôtel de Ville -> Saint-Paul -> Place des Vosges
  addRoadPolyline([P.concorde, P.castiglione, P.palaisRoyal, P.courCarree, P.hotelDeVille, P.stPaul, P.placeVosges], 1.18, true, 'boulevard');
  // 3. Rue Saint-Honoré & Rue Saint-Hyacinthe -> Place Vendôme -> Rue de la Paix -> Opéra -> Lafayette
  addRoadPolyline([P.concorde, P.vendome, P.marcheStHonore, P.home, P.stRoch, P.palaisRoyal], 0.82, false, 'street');
  addRoadPolyline([P.vendome, P.ruePaixMid, P.garnier, P.lafayette], 1.18, true, 'boulevard');
  // 4. Rue Royale (Concorde -> Madeleine) -> Bd Haussmann -> Lafayette -> Passage des Panoramas
  addRoadPolyline([P.concorde, P.madeleine, P.garnier, P.lafayette, P.panoramas, P.galVivienne, P.palaisRoyal], 1.08, true, 'boulevard');
  // 5. Rue de Castiglione -> Passerelle Senghor -> Musée d'Orsay -> Rue de Bellechasse -> Rue de Grenelle -> Rodin -> Invalides
  addRoadPolyline([P.vendome, P.castiglione, P.tuileriesMid, P.senghorN], 0.85, false, 'street');
  addRoadPolyline([P.orsay, P.bellechasse, P.grenelleLunch, P.rodin, P.vauban, P.invalides], 0.92, true, 'street');
  // 6. Avenue de Tourville -> Cobblestone Rue Cler -> Champ de Mars -> Eiffel -> Trocadéro
  addRoadPolyline([P.invalides, P.tourville], 0.95, true, 'street');
  addRoadPolyline([P.tourville, P.rueCler, P.champDeMars], 0.72, false, 'cobble');
  addRoadPolyline([P.champDeMars, P.eiffel, P.pontIenaS], 0.92, true, 'street');
  addRoadPolyline([P.pontIenaN, P.trocadero, P.arcTriomphe], 1.22, true, 'boulevard');
  // 7. Petit Palais -> Pont Alexandre III -> Invalides Esplanade
  addRoadPolyline([P.concorde, P.petitPalais, P.alexandreN], 1.12, true, 'boulevard');
  addRoadPolyline([P.alexandreS, P.invalides], 1.2, true, 'boulevard');
  // 8. Left Bank: Quai d'Orsay -> Boulevard Saint-Germain -> Quartier Latin Cobblestone Lanes -> Panthéon
  addRoadPolyline([P.pontIenaS, geoToXZ(48.8622, 2.3018), P.alexandreS, P.orsay, geoToXZ(48.8576, 2.3335), P.pontNeufS], 0.92, false, 'street');
  addRoadPolyline([P.orsay, P.stGermain, P.procope], 1.15, true, 'boulevard');
  addRoadPolyline([P.procope, P.stSeverin, P.huchette, P.shakespeare], 0.68, false, 'cobble');
  addRoadPolyline([P.stGermain, P.bonaparteMid, P.pontNeufS], 0.78, false, 'street');
  addRoadPolyline([P.shakespeare, P.rueStJacques, P.soufflot, P.pantheon, P.stEtienne], 0.96, true, 'street');
  addRoadPolyline([P.luxembourg, P.soufflot], 0.98, false, 'boulevard');
  // 9. Le Marais Historic Cobblestone Streets & Quai de la Mégisserie
  addRoadPolyline([P.courCarree, P.pontNeufN, P.hotelDeVille], 0.95, false, 'street');
  addRoadPolyline([P.hotelDeVille, P.stGervais, P.rueDesBarres, P.stPaul, P.placeVosges, P.francsBourg, P.rueRosiers, P.hotelDeVille], 0.72, false, 'cobble');
  // 10. 16th Arrondissement (FLV -> La Muette -> Marmottan -> Trocadéro)
  addRoadPolyline([P.flv, P.laMuette, P.marmottan], 1.0, false, 'street');
  addRoadPolyline([P.laMuette, P.trocadero], 1.05, false, 'boulevard');
  // 11. North Paris -> Bd de Clichy -> Montmartre Winding Cobblestone Alleys -> Sacré-Cœur!
  addRoadPolyline([P.arcTriomphe, geoToXZ(48.8832, 2.3270), P.moulinRouge], 1.15, true, 'boulevard');
  addRoadPolyline([P.moulinRouge, P.abbesses, P.rueRavignan, P.placeTertre, P.maisonRose, P.sacreCoeur], 0.68, true, 'cobble');
  addRoadPolyline([P.lafayette, P.moulinRouge], 0.98, false, 'street');

  // Instanced Cast-Iron Parisian Streetlamps + Warm Lanterns & Soft Glow Halos!
  if (lampPositions.length > 0) {
    const postGeo = new THREE.CylinderGeometry(0.035, 0.055, 0.72, 5);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x1a2624, roughness: 0.55, metalness: 0.65 });
    const bulbGeo = new THREE.SphereGeometry(0.11, 6, 6);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe29a });

    const postInst = new THREE.InstancedMesh(postGeo, postMat, lampPositions.length);
    const bulbInst = new THREE.InstancedMesh(bulbGeo, bulbMat, lampPositions.length);
    const dummy = new THREE.Object3D();

    lampPositions.forEach(([x, y, z], idx) => {
      dummy.position.set(x, y + 0.38, z);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      postInst.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(x, y + 0.78, z);
      dummy.updateMatrix();
      bulbInst.setMatrixAt(idx, dummy.matrix);
    });
    ctx.scene.add(postInst);
    ctx.scene.add(bulbInst);
  }
}

