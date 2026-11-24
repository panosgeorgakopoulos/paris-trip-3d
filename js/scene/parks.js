// Formal French gardens (Tuileries, Champ de Mars, Trocadéro, Luxembourg, Invalides, Bois de Boulogne) & trees
import { geoToXZ, getTerrainY, MONTMARTRE_HILL_XZ, P } from '../config.js';
import { ctx } from '../state.js';
import { getSeineClearance } from './environment.js';

export function buildParksAndTrees() {
  const surf = ctx.surfaces;
  const lawnMat = new THREE.MeshStandardMaterial({ map: surf.grassTex, bumpMap: surf.grassBumpTex, bumpScale: 0.045, roughness: 0.92 });
  const hedgeMat = new THREE.MeshStandardMaterial({ map: surf.grassTex, color: 0x82aa8c, roughness: 0.92 });
  const gravelMat = new THREE.MeshStandardMaterial({ map: surf.gravelTex, bumpMap: surf.gravelBumpTex, bumpScale: 0.04, roughness: 0.9 });
  const stoneRimMat = new THREE.MeshStandardMaterial({ color: 0xe6dcc8, bumpMap: surf.stoneDetailTex, bumpScale: 0.03, roughness: 0.68 });
  const palaceWallMat = new THREE.MeshStandardMaterial({ color: 0xe8dec9, roughness: 0.65 });
  const slateMat = new THREE.MeshStandardMaterial({ color: 0x415066, roughness: 0.55, metalness: 0.25 });
  const basinWaterMat = new THREE.MeshStandardMaterial({
    color: 0x1e608a,
    emissive: 0x103c5c,
    emissiveIntensity: 0.42,
    roughness: 0.1,
    metalness: 0.78,
  });
  const jetMat = new THREE.MeshBasicMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.85 });

  const treePositions = [];
  function pushSafeTree(tx, tz, sc) {
    if (getSeineClearance(tx, tz) < 0.95) return;
    treePositions.push([tx, getTerrainY(tx, tz), tz, sc]);
  }

  // Helper: add formal stone-rimmed fountain basin with sparkling water jet
  function addFountainBasin(parent, lx, lz, radius, sides, jetH) {
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.16, radius + 0.22, 0.18, sides), stoneRimMat);
    rim.position.set(lx, 0.11, lz);
    parent.add(rim);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.2, sides), basinWaterMat);
    water.position.set(lx, 0.12, lz);
    parent.add(water);
    if (jetH > 0) {
      const jet = new THREE.Mesh(new THREE.ConeGeometry(0.08, jetH, 6), jetMat);
      jet.position.set(lx, 0.2 + jetH * 0.5, lz);
      parent.add(jet);
    }
  }

  // ---------------------------------------------------------------------
  // 1. JARDIN DES TUILERIES — Grande Allée, Grand Bassin Rond,
  //    Bassin Octogonal, Boxwood Parterres & Chestnut Tree Quinconces!
  // ---------------------------------------------------------------------
  const tuilC = geoToXZ(48.8635, 2.3275);
  const tuilG = new THREE.Group();
  const tRot = -0.42;
  const tuilBase = new THREE.Mesh(new THREE.BoxGeometry(17.4, 0.1, 4.9), gravelMat);
  tuilBase.position.y = 0.05;
  tuilBase.receiveShadow = true;
  tuilG.add(tuilBase);
  // Elevated Stone Terrace Balustrades along Rue de Rivoli (North) & Seine (South)
  [-2.38, 2.38].forEach((tz) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(17.4, 0.22, 0.24), stoneRimMat);
    wall.position.set(0, 0.14, tz);
    tuilG.add(wall);
  });
  // Geometric French Formal Emerald Lawn Parterres with Boxwood Borders
  [[-5.4, -1.25], [-5.4, 1.25], [4.6, -1.25], [4.6, 1.25], [-0.4, -1.35], [-0.4, 1.35]].forEach(([px, pz]) => {
    const parterre = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.14, 1.45), lawnMat);
    parterre.position.set(px, 0.08, pz);
    parterre.receiveShadow = true;
    tuilG.add(parterre);
    const hedge = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.18, 0.12), hedgeMat);
    hedge.position.set(px, 0.12, pz + (pz > 0 ? -0.74 : 0.74));
    tuilG.add(hedge);
  });
  // Iconic West Bassin Octogonal (near Concorde/Orangerie) & East Grand Bassin Rond (near Louvre)!
  addFountainBasin(tuilG, -6.4, 0, 1.05, 8, 0.55);
  addFountainBasin(tuilG, 5.2, 0, 0.82, 16, 0.48);
  tuilG.position.set(tuilC[0], 0, tuilC[1] - 0.65);
  tuilG.rotation.y = tRot;
  ctx.scene.add(tuilG);

  // Symmetrical Chestnut Tree Bosquets (Quinconces) flanking the Grande Allée
  for (let lx = -4.2; lx <= 3.6; lx += 1.25) {
    [-1.85, -1.15, 1.15, 1.85].forEach((lz) => {
      const wx = tuilC[0] + lx * Math.cos(tRot) + lz * Math.sin(tRot);
      const wz = (tuilC[1] - 0.65) - lx * Math.sin(tRot) + lz * Math.cos(tRot);
      pushSafeTree(wx, wz, 0.72);
    });
  }

  // ---------------------------------------------------------------------
  // 2. CHAMP DE MARS — Symmetrical Parterres, Gravel Promenades &
  //    École Militaire Classical Perspective!
  // ---------------------------------------------------------------------
  const cdmC = geoToXZ(48.8554, 2.2988);
  const cdmG = new THREE.Group();
  const cdmRot = -0.68;
  const cdmBase = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.1, 15.6), gravelMat);
  cdmBase.position.y = 0.05;
  cdmBase.receiveShadow = true;
  cdmG.add(cdmBase);
  for (let rz = -5.6; rz <= 5.6; rz += 2.8) {
    [-1.3, 1.3].forEach((rx) => {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.14, 2.25), lawnMat);
      panel.position.set(rx, 0.08, rz);
      cdmG.add(panel);
    });
  }
  // Central Rectangular Lawn Esplanade leading straight toward Eiffel Tower
  const cdmCenter = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.13, 12.2), lawnMat);
  cdmCenter.position.y = 0.075;
  cdmG.add(cdmCenter);
  // École Militaire Classical Pavilion anchoring the SE end of Champ de Mars!
  const emBody = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.05, 1.25), palaceWallMat);
  emBody.position.set(0, 0.52, 7.9);
  cdmG.add(emBody);
  const emDome = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.68, 0.55, 4), slateMat);
  emDome.rotation.y = Math.PI / 4;
  emDome.position.set(0, 1.32, 7.9);
  cdmG.add(emDome);
  cdmG.position.set(cdmC[0], 0, cdmC[1]);
  cdmG.rotation.y = cdmRot;
  ctx.scene.add(cdmG);

  for (let lz = -6.2; lz <= 6.2; lz += 1.45) {
    [-2.25, 2.25].forEach((lx) => {
      const wx = cdmC[0] + lx * Math.cos(cdmRot) + lz * Math.sin(cdmRot);
      const wz = cdmC[1] - lx * Math.sin(cdmRot) + lz * Math.cos(cdmRot);
      pushSafeTree(wx, wz, 0.78);
    });
  }

  // ---------------------------------------------------------------------
  // 3. JARDINS DU TROCADÉRO — Perched Atop Colline de Chaillot with Stone
  //    Retaining Terraces, Palais de Chaillot Wings & Fontaine de Varsovie!
  // ---------------------------------------------------------------------
  const trocC = geoToXZ(48.8622, 2.2886);
  const trocY = getTerrainY(trocC[0], trocC[1]);
  const trocG = new THREE.Group();
  const trocRot = 0.62;
  // Solid cream limestone hillside retaining plinth so terrace never floats on the Chaillot slope!
  const trocPlinth = new THREE.Mesh(new THREE.BoxGeometry(7.9, 0.95, 4.9), stoneRimMat);
  trocPlinth.position.y = -0.45;
  trocG.add(trocPlinth);
  const trocLawn = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.12, 4.8), lawnMat);
  trocLawn.position.y = 0.06;
  trocLawn.receiveShadow = true;
  trocG.add(trocLawn);
  // Long Mirror Basin of the Fontaine de Varsovie + Illuminated Water Jets!
  const warsawRim = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.18, 3.8), stoneRimMat);
  warsawRim.position.set(0, 0.1, 0.35);
  trocG.add(warsawRim);
  const warsawWater = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.2, 3.5), basinWaterMat);
  warsawWater.position.set(0, 0.11, 0.35);
  trocG.add(warsawWater);
  for (let jz = -1.1; jz <= 1.1; jz += 0.55) {
    [-0.42, 0.42].forEach((jx) => {
      const jet = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.52, 5), jetMat);
      jet.position.set(jx, 0.43, 0.35 + jz);
      trocG.add(jet);
    });
  }
  // Grand Limestone Cascade Steps descending from Parvis des Droits de l'Homme
  for (let st = 0; st < 3; st++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(3.2 + st * 0.25, 0.14, 0.36), stoneRimMat);
    step.position.set(0, 0.42 - st * 0.12, -1.42 + st * 0.22);
    trocG.add(step);
  }
  // Palais de Chaillot Twin Curved Limestone Wings crowning the Chaillot Crest!
  const parvis = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.72, 1.55), stoneRimMat);
  parvis.position.set(0, 0.36, -2.18);
  trocG.add(parvis);
  [-2.85, 2.85].forEach((wx) => {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.65, 1.25, 0.98), palaceWallMat);
    wing.position.set(wx, 0.78, -1.88);
    wing.rotation.y = wx > 0 ? -0.35 : 0.35;
    wing.castShadow = true;
    trocG.add(wing);
  });
  trocG.position.set(trocC[0], trocY - 0.1, trocC[1]);
  trocG.rotation.y = trocRot;
  ctx.scene.add(trocG);

  for (let i = 0; i < 16; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const lx = side * (1.8 + (i % 4) * 0.55);
    const lz = -0.8 + Math.floor(i / 2) * 0.45;
    const wx = trocC[0] + lx * Math.cos(trocRot) + lz * Math.sin(trocRot);
    const wz = trocC[1] - lx * Math.sin(trocRot) + lz * Math.cos(trocRot);
    pushSafeTree(wx, wz, 0.72);
  }

  // ---------------------------------------------------------------------
  // 3b. ESPLANADE DES INVALIDES — Ceremonial Emerald Lawns & Twin Linden
  //     Alleys stretching north from Dôme des Invalides to Pont Alexandre III!
  // ---------------------------------------------------------------------
  const espC = geoToXZ(48.8602, 2.3132);
  const espG = new THREE.Group();
  const espBase = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.08, 10.6), gravelMat);
  espBase.position.y = 0.04;
  espBase.receiveShadow = true;
  espG.add(espBase);
  [-1.65, 1.65].forEach((lx) => {
    [-2.6, 2.6].forEach((lz) => {
      const lawn = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.12, 4.4), lawnMat);
      lawn.position.set(lx, 0.06, lz);
      lawn.receiveShadow = true;
      espG.add(lawn);
    });
  });
  espG.position.set(espC[0], 0, espC[1]);
  ctx.scene.add(espG);
  for (let lz = -4.6; lz <= 4.6; lz += 1.55) {
    [-2.65, 2.65].forEach((lx) => pushSafeTree(espC[0] + lx, espC[1] + lz, 0.72));
  }

  // ---------------------------------------------------------------------
  // 4. JARDIN DU LUXEMBOURG — Palais du Luxembourg (French Senate),
  //    Grand Bassin Octogonal, Sunken Parterres & Tree-Lined Bosquets!
  // ---------------------------------------------------------------------
  const luxG = new THREE.Group();
  const luxBase = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.1, 9.8), gravelMat);
  luxBase.position.y = 0.05;
  luxBase.receiveShadow = true;
  luxG.add(luxBase);
  // Sunken Central Parterre Terraces around the Grand Bassin Octogonal
  [[-3.6, 1.2], [3.6, 1.2], [-3.6, -2.0], [3.6, -2.0]].forEach(([px, pz]) => {
    const plot = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.14, 2.6), lawnMat);
    plot.position.set(px, 0.08, pz);
    luxG.add(plot);
  });
  addFountainBasin(luxG, 0, -0.35, 1.38, 8, 0.62);
  // Palais du Luxembourg (Florentine Renaissance Palace on North Edge!)
  const senMain = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.25, 1.35), palaceWallMat);
  senMain.position.set(0, 0.62, -4.15);
  senMain.castShadow = true;
  luxG.add(senMain);
  [-2.2, 2.2].forEach((sx) => {
    const sWing = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.18, 2.15), palaceWallMat);
    sWing.position.set(sx, 0.59, -3.55);
    luxG.add(sWing);
  });
  const senDome = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), slateMat);
  senDome.scale.set(1, 1.35, 1);
  senDome.position.set(0, 1.25, -4.15);
  luxG.add(senDome);
  luxG.position.set(P.luxembourg[0], getTerrainY(P.luxembourg[0], P.luxembourg[1]), P.luxembourg[1]);
  ctx.scene.add(luxG);

  // Lush perimeter tree bosquets around Jardin du Luxembourg
  for (let gx = -5.2; gx <= 5.2; gx += 1.65) {
    for (let gz = -2.6; gz <= 4.1; gz += 1.65) {
      if (Math.hypot(gx, gz + 0.35) < 2.6) continue;
      if (Math.abs(gx) < 3.2 && gz < -1.8) continue;
      pushSafeTree(P.luxembourg[0] + gx, P.luxembourg[1] + gz, 0.78);
    }
  }

  // ---------------------------------------------------------------------
  // 5. JARDIN DU PALAIS-ROYAL (Double Manicured Lime-Tree Colonnades & Basin)
  // ---------------------------------------------------------------------
  const prGardenC = geoToXZ(48.8648, 2.3378);
  const prGG = new THREE.Group();
  const prBase = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 4.4), gravelMat);
  prBase.position.y = 0.05;
  prGG.add(prBase);
  [-0.7, 0.7].forEach((px) => {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.14, 3.4), lawnMat);
    bed.position.set(px, 0.08, 0);
    prGG.add(bed);
  });
  addFountainBasin(prGG, 0, 0, 0.48, 16, 0.35);
  prGG.position.set(prGardenC[0], 0, prGardenC[1]);
  prGG.rotation.y = -0.42;
  ctx.scene.add(prGG);

  for (let lz = -1.7; lz <= 1.7; lz += 0.85) {
    [-1.08, 1.08].forEach((lx) => {
      const wx = prGardenC[0] + lx * Math.cos(-0.42) + lz * Math.sin(-0.42);
      const wz = prGardenC[1] - lx * Math.sin(-0.42) + lz * Math.cos(-0.42);
      pushSafeTree(wx, wz, 0.56);
    });
  }

  // ---------------------------------------------------------------------
  // 6. JARDIN DU RANELAGH & BOIS DE BOULOGNE (+ LAC INFÉRIEUR!)
  // ---------------------------------------------------------------------
  const ranC = geoToXZ(48.8588, 2.2702);
  const ranBase = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.1, 7.6), lawnMat);
  ranBase.position.set(ranC[0], 0.05, ranC[1]);
  ranBase.rotation.y = 0.15;
  ranBase.receiveShadow = true;
  ctx.scene.add(ranBase);
  const ranPath = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.12, 1.15), gravelMat);
  ranPath.position.set(ranC[0], 0.06, ranC[1]);
  ranPath.rotation.y = 0.15;
  ctx.scene.add(ranPath);

  let bs = 9911;
  const brnd = () => { bs = (bs * 16807) % 2147483647; return (bs - 1) / 2147483646; };
  for (let i = 0; i < 36; i++) {
    const lx = (brnd() - 0.5) * 8.4;
    const lz = (brnd() - 0.5) * 6.4;
    if (Math.abs(lz) < 0.8) continue;
    pushSafeTree(ranC[0] + lx, ranC[1] + lz, 0.78 + brnd() * 0.42);
  }

  // Bois de Boulogne Woodland + Scenic Lac Inférieur near Fondation Louis Vuitton!
  const bois = new THREE.Mesh(new THREE.CylinderGeometry(20.5, 21.5, 0.1, 32), lawnMat);
  bois.position.set(P.flv[0] - 2.5, 0.04, P.flv[1] + 1.0);
  bois.receiveShadow = true;
  ctx.scene.add(bois);
  const lac = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.14, 20), basinWaterMat);
  lac.scale.set(0.75, 1, 2.35);
  lac.position.set(P.flv[0] - 4.5, 0.07, P.flv[1] + 9.2);
  lac.rotation.y = 0.25;
  ctx.scene.add(lac);
  for (let i = 0; i < 120; i++) {
    const ang = brnd() * Math.PI * 2;
    const dist = 4.2 + brnd() * 15.5;
    const tx = P.flv[0] - 2.5 + Math.cos(ang) * dist;
    const tz = P.flv[1] + 1.0 + Math.sin(ang) * dist;
    if (Math.hypot(tx - P.flv[0], tz - P.flv[1]) > 4.6 && Math.hypot(tx - (P.flv[0] - 4.5), tz - (P.flv[1] + 9.2)) > 4.4) {
      pushSafeTree(tx, tz, 0.85 + brnd() * 0.65);
    }
  }

  // ---------------------------------------------------------------------
  // 7. CLOS MONTMARTRE VINEYARD ROWS & SQUARE LOUISE-MICHEL SLOPES
  // ---------------------------------------------------------------------
  const vineY = getTerrainY(P.maisonRose[0] + 1.1, P.maisonRose[1] + 0.8);
  const vineG = new THREE.Group();
  const vinePatch = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, 1.8), lawnMat);
  vinePatch.position.y = 0.06;
  vineG.add(vinePatch);
  for (let r = -0.68; r <= 0.68; r += 0.27) {
    const trellis = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.24, 0.08), hedgeMat);
    trellis.position.set(0, 0.2, r);
    vineG.add(trellis);
  }
  vineG.position.set(P.maisonRose[0] + 1.35, vineY, P.maisonRose[1] + 0.95);
  ctx.scene.add(vineG);

  // Montmartre wooded hillsides
  for (let i = 0; i < 52; i++) {
    const ang = brnd() * Math.PI * 2;
    const r = 4.4 + brnd() * 13.0;
    const tx = MONTMARTRE_HILL_XZ[0] + Math.cos(ang) * r;
    const tz = MONTMARTRE_HILL_XZ[1] + Math.sin(ang) * r;
    if (Math.hypot(tx - P.sacreCoeur[0], tz - P.sacreCoeur[1]) > 3.5 && Math.hypot(tx - P.placeTertre[0], tz - P.placeTertre[1]) > 2.2) {
      pushSafeTree(tx, tz, 0.68 + brnd() * 0.45);
    }
  }

  // Instanced Parisian Trees (Trunks + Layered Winter Foliage + Frost Caps)
  const trunkGeo = new THREE.CylinderGeometry(0.06, 0.09, 0.5, 5);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4b3b2f, roughness: 0.95 });
  const crownGeo = new THREE.DodecahedronGeometry(0.38, 0);
  const crownMat = new THREE.MeshStandardMaterial({ color: 0x2b5544, roughness: 0.86 });
  const frostGeo = new THREE.SphereGeometry(0.24, 6, 5);
  const frostMat = new THREE.MeshStandardMaterial({ color: 0xdbe8f6, roughness: 0.8 });

  const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treePositions.length);
  const crownInst = new THREE.InstancedMesh(crownGeo, crownMat, treePositions.length);
  const frostInst = new THREE.InstancedMesh(frostGeo, frostMat, treePositions.length);
  crownInst.castShadow = true;

  const dummy = new THREE.Object3D();
  treePositions.forEach(([x, y, z, sc], idx) => {
    dummy.position.set(x, y + 0.25 * sc, z);
    dummy.scale.set(sc, sc, sc);
    dummy.rotation.set(0, idx * 0.7, 0);
    dummy.updateMatrix();
    trunkInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(x, y + 0.72 * sc, z);
    dummy.scale.set(sc, sc * 1.15, sc);
    dummy.updateMatrix();
    crownInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(x, y + 0.96 * sc, z);
    dummy.scale.set(sc * 0.9, sc * 0.45, sc * 0.9);
    dummy.updateMatrix();
    frostInst.setMatrixAt(idx, dummy.matrix);
  });
  ctx.scene.add(trunkInst);
  ctx.scene.add(crownInst);
  ctx.scene.add(frostInst);
}

