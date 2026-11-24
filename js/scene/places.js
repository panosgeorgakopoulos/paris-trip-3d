// All 15 itinerary Parisian Places + 24 expanded Paris skyline sights, grand squares & churches
import { geoToXZ, getTerrainY, P } from '../config.js';
import { ctx } from '../state.js';

export function buildParisianPlaces() {
  const surf = ctx.surfaces;
  const maxAniso = Math.min(16, ctx.renderer.capabilities.getMaxAnisotropy());
  // HD Procedural Radial Granite Cobblestone Plaza Texture (512x512, Full Anisotropy!)
  const pc = document.createElement('canvas');
  pc.width = 512; pc.height = 512;
  const pctx = pc.getContext('2d');
  pctx.fillStyle = '#5a606e';
  pctx.fillRect(0, 0, 512, 512);
  // Individual radial granite stone rings with crisp mortar joints
  for (let r = 18; r < 252; r += 10) {
    const stones = Math.max(12, Math.floor((2 * Math.PI * r) / 9));
    for (let i = 0; i < stones; i++) {
      const a0 = (i / stones) * Math.PI * 2;
      const a1 = ((i + 0.86) / stones) * Math.PI * 2;
      const shade = (r + i) % 3 === 0 ? '#787b85' : (r + i) % 3 === 1 ? '#686d7a' : '#85827c';
      pctx.strokeStyle = shade;
      pctx.lineWidth = 7.5;
      pctx.beginPath(); pctx.arc(256, 256, r, a0, a1); pctx.stroke();
    }
    pctx.strokeStyle = r % 40 === 18 ? 'rgba(228,220,204,0.46)' : 'rgba(18,22,30,0.38)';
    pctx.lineWidth = 1.8;
    pctx.beginPath(); pctx.arc(256, 256, r + 4.5, 0, Math.PI * 2); pctx.stroke();
  }
  for (let a = 0; a < 12; a++) {
    const ang = (a / 12) * Math.PI * 2;
    pctx.strokeStyle = 'rgba(238, 231, 218, 0.56)';
    pctx.lineWidth = 4;
    pctx.beginPath();
    pctx.moveTo(256 + Math.cos(ang) * 44, 256 + Math.sin(ang) * 44);
    pctx.lineTo(256 + Math.cos(ang) * 254, 256 + Math.sin(ang) * 254);
    pctx.stroke();
  }
  const starCobbleTex = new THREE.CanvasTexture(pc);
  starCobbleTex.anisotropy = maxAniso;
  starCobbleTex.encoding = THREE.sRGBEncoding;

  // Procedural Deep-Blue Tiled "Le Mur des Je t'aime" (Place des Abbesses, Montmartre!)
  const lc = document.createElement('canvas');
  lc.width = 256; lc.height = 128;
  const lctx = lc.getContext('2d');
  lctx.fillStyle = '#183d7a';
  lctx.fillRect(0, 0, 256, 128);
  lctx.strokeStyle = 'rgba(255,255,255,0.22)';
  for (let x = 0; x < 256; x += 24) { lctx.beginPath(); lctx.moveTo(x, 0); lctx.lineTo(x, 128); lctx.stroke(); }
  for (let y = 0; y < 128; y += 20) { lctx.beginPath(); lctx.moveTo(0, y); lctx.lineTo(256, y); lctx.stroke(); }
  lctx.fillStyle = '#f5f7fc';
  lctx.font = 'italic 16px Georgia, serif';
  lctx.fillText("Je t'aime • Σ'αγαπώ • I love you", 14, 42);
  lctx.fillText("Ti amo • Te quiero • 愛してる", 18, 74);
  lctx.fillStyle = '#e83e5e';
  lctx.fillRect(114, 90, 26, 14);
  const loveWallTex = new THREE.CanvasTexture(lc);
  loveWallTex.encoding = THREE.sRGBEncoding;

  const cobblePlazaMat = new THREE.MeshStandardMaterial({ map: starCobbleTex, bumpMap: surf.plazaBumpTex, bumpScale: 0.06, roughness: 0.78 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xe6dcc8, bumpMap: surf.stoneDetailTex, bumpScale: 0.03, roughness: 0.65 });
  const darkSlate = new THREE.MeshStandardMaterial({ color: 0x415066, roughness: 0.55, metalness: 0.25 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf6cf68, emissive: 0x996d1b, emissiveIntensity: 0.52, metalness: 0.88, roughness: 0.22 });
  const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x44594d, metalness: 0.65, roughness: 0.35 });
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x1e608a, emissive: 0x0f3b5a, emissiveIntensity: 0.4, roughness: 0.1, metalness: 0.78 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xcbeeff, emissive: 0xffd27a, emissiveIntensity: 0.55, transparent: true, opacity: 0.72, roughness: 0.1 });
  const warmLampMat = new THREE.MeshBasicMaterial({ color: 0xffe49e });
  const guimardGreen = new THREE.MeshStandardMaterial({ color: 0x1e5e46, metalness: 0.4, roughness: 0.45 });
  const lawnMat = new THREE.MeshStandardMaterial({ map: surf.grassTex, bumpMap: surf.grassBumpTex, bumpScale: 0.045, roughness: 0.92 });
  ctx.monumentGlowMaterials.push(goldMat);

  function addPlaceLabel(id, text, x, z, yOff = 2.1, day = 'all') {
    ctx.landmarkLabelEntries.push({
      id,
      label: text,
      pos: new THREE.Vector3(x, getTerrainY(x, z) + yOff, z),
      isPlace: true,
      isHome: false,
      isSquad: false,
      isStop: false,
      day,
    });
  }

  // 1. PLACE DU MARCHÉ SAINT-HONORÉ (Steps from Rue Saint-Hyacinthe 3! Bofill Glass Arcade)
  const mshG = new THREE.Group();
  const mshBase = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.1, 2.4), cobblePlazaMat);
  mshBase.position.y = 0.05;
  mshG.add(mshBase);
  const bofillPav = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.82, 0.72), glassMat);
  bofillPav.position.y = 0.46;
  mshG.add(bofillPav);
  const bofillRoof = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.12, 0.8), stoneMat);
  bofillRoof.position.y = 0.92;
  mshG.add(bofillRoof);
  mshG.position.set(P.marcheStHonore[0], 0, P.marcheStHonore[1]);
  ctx.scene.add(mshG);
  addPlaceLabel('pl-marche', 'Place du Marché St-Honoré', P.marcheStHonore[0], P.marcheStHonore[1], 1.75, 1);

  // 2. PLACE VENDÔME — Enclosed Octagonal Louis XIV Townhouse Ring around Colonne Vendôme!
  const vendRing = new THREE.Group();
  const vCob = new THREE.Mesh(new THREE.CylinderGeometry(2.85, 2.85, 0.09, 8), cobblePlazaMat);
  vCob.position.y = 0.06;
  vendRing.add(vCob);
  // 6 Enclosed Octagonal Sides (leaving North Rue de la Paix & South Rue de Castiglione open!)
  for (let s = 0; s < 8; s++) {
    if (s === 0 || s === 4) continue;
    const ang = (s / 8) * Math.PI * 2;
    const dist = 2.65;
    const bld = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.95, 0.58), ctx.haussmannMat);
    bld.position.set(Math.sin(ang) * dist, 0.52, Math.cos(ang) * dist);
    bld.rotation.y = ang;
    bld.castShadow = true;
    vendRing.add(bld);
    const rf = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.24, 0.52), darkSlate);
    rf.position.set(Math.sin(ang) * dist, 1.12, Math.cos(ang) * dist);
    rf.rotation.y = ang;
    vendRing.add(rf);
  }
  vendRing.position.set(P.vendome[0], 0, P.vendome[1]);
  ctx.scene.add(vendRing);
  addPlaceLabel('pl-vendome', 'Place Vendôme', P.vendome[0], P.vendome[1], 3.9, 1);

  // 3. PLACE DE L'OPÉRA (Radial Plaza + Art Nouveau Guimard Métro Entrance in front of Garnier!)
  const opPlazaXZ = geoToXZ(48.8708, 2.3318);
  const opPl = new THREE.Group();
  const opDisc = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.09, 20), cobblePlazaMat);
  opDisc.position.y = 0.06;
  opPl.add(opDisc);
  const opMetro = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.32, 0.35), guimardGreen);
  opMetro.position.set(0, 0.24, 0.35);
  opPl.add(opMetro);
  opPl.position.set(opPlazaXZ[0], 0, opPlazaXZ[1]);
  ctx.scene.add(opPl);
  addPlaceLabel('pl-opera', "Place de l'Opéra", opPlazaXZ[0], opPlazaXZ[1], 1.7, 1);

  // 4. PLACE DE LA CONCORDE — 8 French Cities Balustrade Pavilions & Gilded Rostral Columns!
  const concEnh = new THREE.Group();
  const cCob = new THREE.Mesh(new THREE.CylinderGeometry(3.85, 3.85, 0.09, 8), cobblePlazaMat);
  cCob.position.y = 0.06;
  concEnh.add(cCob);
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2 + Math.PI / 8;
    const px = Math.cos(ang) * 3.55, pz = Math.sin(ang) * 3.55;
    // 8 Stone Corner Statue Pavilions (Bordeaux, Lyon, Marseille, Lille, Rouen, Brest, Nantes, Strasbourg)
    const pav = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.65, 0.48), stoneMat);
    pav.position.set(px, 0.38, pz);
    concEnh.add(pav);
    const stat = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), stoneMat);
    stat.position.set(px, 0.82, pz);
    concEnh.add(stat);
    // Gilded Rostral Lamp Column beside each pavilion
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.72, 6), bronzeMat);
    col.position.set(Math.cos(ang) * 2.95, 0.42, Math.sin(ang) * 2.95);
    concEnh.add(col);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), warmLampMat);
    bulb.position.set(Math.cos(ang) * 2.95, 0.82, Math.sin(ang) * 2.95);
    concEnh.add(bulb);
  }
  concEnh.position.set(P.concorde[0], 0, P.concorde[1]);
  ctx.scene.add(concEnh);
  addPlaceLabel('pl-concorde', 'Place de la Concorde', P.concorde[0], P.concorde[1], 4.2, 2);

  // 5. PLACE VAUBAN (Semicircular Royal Fan Plaza directly south of Dôme des Invalides!)
  const vauG = new THREE.Group();
  const vauFan = new THREE.Mesh(new THREE.CylinderGeometry(2.65, 2.65, 0.09, 18, 1, false, -Math.PI * 0.5, Math.PI), cobblePlazaMat);
  vauFan.position.y = 0.06;
  vauG.add(vauFan);
  [-1.3, 1.3].forEach((vx) => {
    const wedge = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.12, 1.1), lawnMat);
    wedge.position.set(vx, 0.08, 0.95);
    vauG.add(wedge);
  });
  vauG.position.set(P.vauban[0], 0, P.vauban[1] + 0.5);
  ctx.scene.add(vauG);
  addPlaceLabel('pl-vauban', 'Place Vauban', P.vauban[0], P.vauban[1] + 0.5, 1.8, 1);

  // 6. PLACE DAUPHINE (Iconic Triangular Louis XIII Square on Île de la Cité!)
  const dauG = new THREE.Group();
  const triShape = new THREE.Shape();
  triShape.moveTo(-2.1, 0);
  triShape.lineTo(1.5, 1.15);
  triShape.lineTo(1.5, -1.15);
  triShape.closePath();
  const triGeo = new THREE.ExtrudeGeometry(triShape, { depth: 0.08, bevelEnabled: false });
  const triMesh = new THREE.Mesh(triGeo, cobblePlazaMat);
  triMesh.rotation.x = Math.PI / 2;
  triMesh.position.y = 0.52;
  dauG.add(triMesh);
  // Charming flanking Louis XIII brick-and-limestone townhouses along two triangle arms
  const side1 = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.72, 0.36), ctx.haussmannMat);
  side1.position.set(-0.2, 0.82, 0.78);
  side1.rotation.y = 0.31;
  dauG.add(side1);
  const side2 = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.72, 0.36), ctx.haussmannMat);
  side2.position.set(-0.2, 0.82, -0.78);
  side2.rotation.y = -0.31;
  dauG.add(side2);
  dauG.position.set(P.placeDauphine[0], 0, P.placeDauphine[1]);
  dauG.rotation.y = -0.62;
  ctx.scene.add(dauG);
  addPlaceLabel('pl-dauphine', 'Place Dauphine', P.placeDauphine[0], P.placeDauphine[1], 2.1, 2);

  // 7. PLACE SAINT-MICHEL (Monumental Red-Marble & Bronze Fontaine Saint-Michel!)
  const smXZ = geoToXZ(48.8533, 2.3438);
  const smG = new THREE.Group();
  const smDisc = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.85, 0.09, 16), cobblePlazaMat);
  smDisc.position.y = 0.06;
  smG.add(smDisc);
  // Monumental Triumphal Wall Fountain (Archangel Michael & Dragon)
  const smWall = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.75, 0.42), stoneMat);
  smWall.position.set(0, 0.92, 1.25);
  smG.add(smWall);
  const smNiche = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.12, 0.48), new THREE.MeshStandardMaterial({ color: 0x8f343c, roughness: 0.45 }));
  smNiche.position.set(0, 0.85, 1.22);
  smG.add(smNiche);
  const smAngel = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.56, 6), bronzeMat);
  smAngel.position.set(0, 0.88, 0.92);
  smG.add(smAngel);
  const smBasin = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.8, 0.22, 14), waterMat);
  smBasin.position.set(0, 0.2, 0.72);
  smG.add(smBasin);
  smG.position.set(smXZ[0], 0, smXZ[1]);
  ctx.scene.add(smG);
  addPlaceLabel('pl-stmichel', 'Place Saint-Michel', smXZ[0], smXZ[1], 2.3, 1);

  // 8. PLACE SAINT-GERMAIN-DES-PRÉS (Café de Flore & Les Deux Magots Glowing Terraces!)
  const sgpG = new THREE.Group();
  const sgpPlaza = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, 0.09, 16), cobblePlazaMat);
  sgpPlaza.position.y = 0.06;
  sgpG.add(sgpPlaza);
  // Illuminated Emerald & Burgundy Parisian Literary Café Awnings
  [[-1.15, 0.95, 0x164a34], [1.15, 0.95, 0x6b2030]].forEach(([cx, cz, col]) => {
    const awn = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.16, 0.48), new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 }));
    awn.position.set(cx, 0.52, cz);
    sgpG.add(awn);
    const glow = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.36, 0.36), glassMat);
    glow.position.set(cx, 0.26, cz);
    sgpG.add(glow);
  });
  sgpG.position.set(P.stGermain[0] - 0.6, 0, P.stGermain[1] + 1.2);
  ctx.scene.add(sgpG);
  addPlaceLabel('pl-stgermain', 'Place Saint-Germain-des-Prés', P.stGermain[0] - 0.6, P.stGermain[1] + 1.2, 2.0, 1);

  // 9. PLACE DU PANTHÉON (Grand Curved Crescent Plaza uniting Panthéon & St-Étienne!)
  const ppXZ = geoToXZ(48.8462, 2.3446);
  const ppY = getTerrainY(ppXZ[0], ppXZ[1]);
  const panPl = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.1, 20), cobblePlazaMat);
  panPl.position.set(ppXZ[0], ppY + 0.06, ppXZ[1]);
  ctx.scene.add(panPl);
  addPlaceLabel('pl-pantheon', 'Place du Panthéon', ppXZ[0], ppXZ[1], 1.9, 2);

  // 10. PLACE DE L'HÔTEL DE VILLE (Granite Esplanade + Twin Mirror Fountains + Winter Carousel!)
  const hdvXZ = geoToXZ(48.8566, 2.3502);
  const hdvPl = new THREE.Group();
  const hdvEspl = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.1, 3.0), cobblePlazaMat);
  hdvEspl.position.y = 0.06;
  hdvPl.add(hdvEspl);
  [-0.95, 0.95].forEach((fz) => {
    const fRim = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.14, 0.72), stoneMat);
    fRim.position.set(0.35, 0.1, fz);
    hdvPl.add(fRim);
    const fWat = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.16, 0.56), waterMat);
    fWat.position.set(0.35, 0.11, fz);
    hdvPl.add(fWat);
  });
  // Classic Parisian December Illuminated Carousel!
  const carBase = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.58, 0.12, 14), goldMat);
  carBase.position.set(-0.95, 0.16, 0);
  hdvPl.add(carBase);
  const carTop = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.42, 12), new THREE.MeshStandardMaterial({ color: 0xc92a42, emissive: 0x7a1626, emissiveIntensity: 0.55 }));
  carTop.position.set(-0.95, 0.72, 0);
  hdvPl.add(carTop);
  const carCore = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.45, 8), warmLampMat);
  carCore.position.set(-0.95, 0.42, 0);
  hdvPl.add(carCore);
  hdvPl.position.set(hdvXZ[0], 0, hdvXZ[1]);
  hdvPl.rotation.y = -0.35;
  ctx.scene.add(hdvPl);
  addPlaceLabel('pl-hdv', "Place de l'Hôtel de Ville", hdvXZ[0], hdvXZ[1], 2.0, 2);

  // 11. PLACE DES VOSGES — 4 Symmetrical Corner Fountains & Gravel Cross-Alleys inside Square Louis XIII!
  const vosF = new THREE.Group();
  const vosLawn = new THREE.Mesh(new THREE.BoxGeometry(3.25, 0.1, 3.25), lawnMat);
  vosLawn.position.y = 0.05;
  vosF.add(vosLawn);
  const cross1 = new THREE.Mesh(new THREE.BoxGeometry(3.26, 0.12, 0.55), stoneMat);
  cross1.position.y = 0.06;
  vosF.add(cross1);
  const cross2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 3.26), stoneMat);
  cross2.position.y = 0.06;
  vosF.add(cross2);
  [[-0.95, -0.95], [0.95, -0.95], [-0.95, 0.95], [0.95, 0.95]].forEach(([fx, fz]) => {
    const fnt = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.16, 12), waterMat);
    fnt.position.set(fx, 0.12, fz);
    vosF.add(fnt);
  });
  vosF.position.set(P.placeVosges[0], 0, P.placeVosges[1]);
  ctx.scene.add(vosF);

  // 12. PLACE CHARLES DE GAULLE (12-Ray Cobblestone Étoile Star Roundabout!)
  const etoileStar = new THREE.Mesh(new THREE.CylinderGeometry(3.85, 3.85, 0.09, 32), cobblePlazaMat);
  etoileStar.position.set(P.arcTriomphe[0], 0.065, P.arcTriomphe[1]);
  ctx.scene.add(etoileStar);
  addPlaceLabel('pl-etoile', 'Place Charles de Gaulle (Étoile)', P.arcTriomphe[0], P.arcTriomphe[1], 3.8, 3);

  // 13. PLACE DES ABBESSES (Le Mur des Je t'aime + Guimard Art Nouveau Métro Canopy + St-Jean-de-Montmartre!)
  const abY = getTerrainY(P.abbesses[0], P.abbesses[1]);
  const abG = new THREE.Group();
  const abPlaza = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.15, 0.1, 18), cobblePlazaMat);
  abPlaza.position.y = 0.06;
  abG.add(abPlaza);
  // Deep-Blue Tiled "Le Mur des Je t'aime" (Wall of Love!)
  const loveWall = new THREE.Mesh(
    new THREE.BoxGeometry(1.45, 0.82, 0.16),
    new THREE.MeshStandardMaterial({ map: loveWallTex, emissiveMap: loveWallTex, emissive: 0x6ea8ff, emissiveIntensity: 0.35 })
  );
  loveWall.position.set(-0.95, 0.52, -0.85);
  loveWall.rotation.y = 0.35;
  abG.add(loveWall);
  // Iconic Hector Guimard Green Glass Art Nouveau Métro Abbesses Canopy!
  const gCanopy = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.08, 0.62), glassMat);
  gCanopy.position.set(0.55, 0.62, 0.25);
  abG.add(gCanopy);
  [[-0.4, -0.25], [0.4, -0.25], [-0.4, 0.25], [0.4, 0.25]].forEach(([px, pz]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.55, 6), guimardGreen);
    post.position.set(0.55 + px, 0.34, 0.25 + pz);
    abG.add(post);
  });
  // Red-Brick Art Nouveau Église Saint-Jean-de-Montmartre beside Place des Abbesses!
  const sjmBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 1.35, 1.25),
    new THREE.MeshStandardMaterial({ color: 0x9e4c42, roughness: 0.78 })
  );
  sjmBody.position.set(1.25, 0.68, -0.85);
  abG.add(sjmBody);
  abG.position.set(P.abbesses[0], abY, P.abbesses[1]);
  ctx.scene.add(abG);
  addPlaceLabel('pl-abbesses', "Place des Abbesses • Mur des Je t'aime", P.abbesses[0], P.abbesses[1], 2.1, 3);

  // 14. PLACE DU TERTRE (Iconic Montmartre Hilltop Artists' Square with Painter Parasols & Easels!)
  const ptY = getTerrainY(P.placeTertre[0], P.placeTertre[1]);
  const ptG = new THREE.Group();
  const ptCob = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.1, 2.35), cobblePlazaMat);
  ptCob.position.y = 0.06;
  ptG.add(ptCob);
  const parasolColors = [0xf8f4ec, 0xd6364c, 0xf4c668, 0x266b4c];
  [[-0.85, -0.55], [0, -0.55], [0.85, -0.55], [-0.85, 0.55], [0, 0.55], [0.85, 0.55]].forEach(([ux, uz], idx) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.48, 5), bronzeMat);
    pole.position.set(ux, 0.3, uz);
    ptG.add(pole);
    const umbrella = new THREE.Mesh(
      new THREE.ConeGeometry(0.32, 0.16, 8),
      new THREE.MeshStandardMaterial({ color: parasolColors[idx % parasolColors.length], roughness: 0.65 })
    );
    umbrella.position.set(ux, 0.56, uz);
    ptG.add(umbrella);
  });
  ptG.position.set(P.placeTertre[0], ptY, P.placeTertre[1]);
  ctx.scene.add(ptG);
  addPlaceLabel('pl-tertre', 'Place du Tertre', P.placeTertre[0], P.placeTertre[1], 1.85, 3);

  // 15. PLACE BLANCHE (Illuminated Boulevard Plaza in front of Moulin Rouge)
  const pbY = getTerrainY(P.moulinRouge[0], P.moulinRouge[1] + 1.8);
  const pbCob = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, 0.09, 18), cobblePlazaMat);
  pbCob.position.set(P.moulinRouge[0], pbY + 0.06, P.moulinRouge[1] + 1.8);
  ctx.scene.add(pbCob);

  // =====================================================================
  // F3. EXPANDED PARIS SKYLINE — 24 ICONIC SIGHTS, GRAND SQUARES &
  //     HISTORIC CHURCHES FILLING ALL 20 ARRONDISSEMENTS!
  // =====================================================================
  const verdigrisMat = new THREE.MeshStandardMaterial({ color: 0x4aa896, emissive: 0x16443b, emissiveIntensity: 0.3, roughness: 0.38, metalness: 0.5 });
  const warmStoneMat = new THREE.MeshStandardMaterial({ color: 0xdfd3bc, roughness: 0.68 });
  const darkGlassMat = new THREE.MeshStandardMaterial({ color: 0x202b3d, emissive: 0x486284, emissiveIntensity: 0.35, roughness: 0.14, metalness: 0.78 });
  const clockGlowMat = new THREE.MeshBasicMaterial({ color: 0xffe49c });

  // 16. GRAND PALAIS (Right across from Petit Palais! Vast Ribbed Glass Barrel Vault + Quadrigas!)
  {
    const [gx, gz] = geoToXZ(48.8661, 2.3125);
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.05, 2.25), stoneMat);
    body.position.y = 0.52; body.castShadow = true; g.add(body);
    // Iconic arched iron-and-glass Beaux-Arts barrel nave + transverse wing
    const nave = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 4.2, 18, 1, false, 0, Math.PI), glassMat);
    nave.rotation.z = Math.PI / 2; nave.position.y = 1.04; g.add(nave);
    const trans = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.86, 2.65, 16, 1, false, 0, Math.PI), glassMat);
    trans.rotation.x = Math.PI / 2; trans.position.y = 1.06; g.add(trans);
    // Central glazed dome + steel ribs
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.96, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), glassMat);
    dome.position.y = 1.25; g.add(dome);
    for (let rx = -1.8; rx <= 1.8; rx += 0.6) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(0.94, 0.025, 5, 14, Math.PI), verdigrisMat);
      rib.rotation.y = Math.PI / 2; rib.position.set(rx, 1.04, 0); g.add(rib);
    }
    // Green bronze Quadriga chariots crowning East & West porticoes
    [-2.15, 2.15].forEach((qx) => {
      const q = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.45), verdigrisMat);
      q.position.set(qx, 1.22, 0); g.add(q);
    });
    g.position.set(gx, getTerrainY(gx, gz), gz);
    g.rotation.y = -0.35;
    ctx.scene.add(g);
    addPlaceLabel('st-grandpalais', 'Grand Palais', gx, gz, 2.5, 3);
  }

  // 17. TOUR MONTPARNASSE (Iconic 210m Dark Glass Skyscraper anchoring the South Paris Horizon!)
  {
    const [mx, mz] = geoToXZ(48.8421, 2.3219);
    const g = new THREE.Group();
    const podium = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.65, 1.8), stoneMat);
    podium.position.y = 0.32; g.add(podium);
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.86, 6.4, 6), darkGlassMat);
    tower.scale.set(1.25, 1, 0.68);
    tower.position.y = 3.55; tower.castShadow = true; g.add(tower);
    // Illuminated panoramic 56th-floor crown & red aviation beacon
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.84, 0.22, 6), warmLampMat);
    deck.scale.set(1.25, 1, 0.68); deck.position.y = 6.72; g.add(deck);
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.9, 5), darkSlate);
    spire.position.y = 7.25; g.add(spire);
    g.position.set(mx, getTerrainY(mx, mz), mz);
    g.rotation.y = 0.25;
    ctx.scene.add(g);
    addPlaceLabel('st-montparnasse', 'Tour Montparnasse', mx, mz, 7.6, 'all');
  }

  // 18. CENTRE POMPIDOU (Beaubourg — Iconic Hi-Tech Color-Coded Pipe Exoskeleton & Glass Escalator!)
  {
    const [px, pz] = geoToXZ(48.8606, 2.3522);
    const g = new THREE.Group();
    const piazza = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.08, 3.6), cobblePlazaMat);
    piazza.position.set(-0.6, 0.04, 0); g.add(piazza);
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.72, 3.25), glassMat);
    body.position.set(0.35, 0.86, 0); body.castShadow = true; g.add(body);
    // Color-coded exterior ducts: Blue (air), Green (water), Yellow (electric), Red (escalator/lifts)!
    const pipeCols = [0x1c6dd0, 0x269b54, 0xf2b705, 0xd9383a];
    pipeCols.forEach((col, idx) => {
      const pMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.42, metalness: 0.35 });
      const pipe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.65, 0.26), pMat);
      pipe.position.set(1.12, 0.86, -1.1 + idx * 0.72); g.add(pipe);
    });
    // Iconic diagonal transparent glass "caterpillar" escalator along the West Piazza facade!
    const esc = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 3.1), new THREE.MeshStandardMaterial({ color: 0xd9383a, roughness: 0.4 }));
    esc.position.set(-0.42, 0.88, 0); esc.rotation.x = 0.46; g.add(esc);
    g.position.set(px, getTerrainY(px, pz), pz);
    g.rotation.y = -0.18;
    ctx.scene.add(g);
    addPlaceLabel('st-pompidou', 'Centre Pompidou', px, pz, 2.35, 2);
  }

  // 19. PALAIS BOURBON (Assemblée Nationale — 12-Column Corinthian Temple facing Place de la Concorde!)
  {
    const [bx, bz] = geoToXZ(48.8618, 2.3186);
    const g = new THREE.Group();
    const main = new THREE.Mesh(new THREE.BoxGeometry(2.85, 1.18, 2.15), stoneMat);
    main.position.y = 0.59; main.castShadow = true; g.add(main);
    const steps = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.24, 0.55), warmStoneMat);
    steps.position.set(0, 0.12, -1.25); g.add(steps);
    for (let cx = -1.05; cx <= 1.05; cx += 0.21) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.052, 1.05, 6), stoneMat);
      col.position.set(cx, 0.65, -1.12); g.add(col);
    }
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.45, 3), stoneMat);
    ped.rotation.x = Math.PI / 2; ped.rotation.y = Math.PI / 2; ped.scale.set(0.35, 1, 1.1);
    ped.position.set(0, 1.35, -1.02); g.add(ped);
    g.position.set(bx, getTerrainY(bx, bz), bz);
    g.rotation.y = -0.22;
    ctx.scene.add(g);
    addPlaceLabel('st-bourbon', 'Assemblée Nationale', bx, bz, 2.0, 2);
  }

  // 20. INSTITUT DE FRANCE (Baroque Cupola & Semicircular Wings facing the Louvre across Pont des Arts!)
  {
    const [ix, iz] = geoToXZ(48.8573, 2.3370);
    const g = new THREE.Group();
    const cBody = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.08, 1.35), stoneMat);
    cBody.position.y = 0.54; g.add(cBody);
    [-1.18, 1.18].forEach((wx) => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.92, 0.85), warmStoneMat);
      wing.position.set(wx, 0.46, -0.22); wing.rotation.y = wx > 0 ? 0.35 : -0.35; g.add(wing);
    });
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.62, 0.62, 16), stoneMat);
    drum.position.y = 1.35; g.add(drum);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.58, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), darkSlate);
    dome.scale.set(1, 1.25, 1); dome.position.y = 1.64; g.add(dome);
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.42, 6), goldMat);
    fin.position.y = 2.48; g.add(fin);
    g.position.set(ix, getTerrainY(ix, iz), iz);
    g.rotation.y = -0.44;
    ctx.scene.add(g);
    addPlaceLabel('st-institut', 'Institut de France', ix, iz, 2.75, 1);
  }

  // 21. LA CONCIERGERIE (Iconic 3 Conical Medieval Slate Towers on North Quay of Île de la Cité!)
  {
    const [cx, cz] = geoToXZ(48.8560, 2.3456);
    const g = new THREE.Group();
    const hall = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.02, 0.72), warmStoneMat);
    hall.position.y = 0.51; hall.castShadow = true; g.add(hall);
    [-0.9, -0.25, 0.45].forEach((tx) => {
      const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.27, 1.48, 12), stoneMat);
      tw.position.set(tx, 0.74, -0.32); g.add(tw);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.78, 12), darkSlate);
      roof.position.set(tx, 1.85, -0.32); g.add(roof);
    });
    // Square Tour de l'Horloge with golden medieval clock
    const clkTw = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.85, 0.42), stoneMat);
    clkTw.position.set(1.12, 0.92, -0.25); g.add(clkTw);
    const clkGold = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.06), goldMat);
    clkGold.position.set(1.12, 1.18, -0.48); g.add(clkGold);
    g.position.set(cx, 0.44, cz);
    g.rotation.y = -0.62;
    ctx.scene.add(g);
    addPlaceLabel('st-conciergerie', 'La Conciergerie', cx, cz, 2.7, 2);
  }

  // 22. TOUR SAINT-JACQUES (Freestanding Flamboyant Gothic Bell Tower in Lush Square Garden!)
  {
    const [tx, tz] = geoToXZ(48.8580, 2.3489);
    const g = new THREE.Group();
    const sq = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 1.9), lawnMat);
    sq.position.y = 0.04; g.add(sq);
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.58, 2.55, 0.58), warmStoneMat);
    shaft.position.y = 1.28; shaft.castShadow = true; g.add(shaft);
    [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]].forEach(([px, pz]) => {
      const pin = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 4), stoneMat);
      pin.position.set(px, 2.75, pz); g.add(pin);
    });
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.65, 6), stoneMat);
    turret.position.set(-0.22, 2.85, -0.22); g.add(turret);
    g.position.set(tx, getTerrainY(tx, tz), tz);
    ctx.scene.add(g);
    addPlaceLabel('st-stjacques', 'Tour Saint-Jacques', tx, tz, 3.3, 2);
  }

  // 23. BOURSE DE COMMERCE (Pinault Collection — Circular Neoclassical Glass-Domed Rotunda!)
  {
    const [bx, bz] = geoToXZ(48.8628, 2.3428);
    const g = new THREE.Group();
    const rot = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.26, 1.05, 24), stoneMat);
    rot.position.y = 0.52; rot.castShadow = true; g.add(rot);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.12, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), glassMat);
    dome.position.y = 1.04; g.add(dome);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.65, 10), warmStoneMat);
    col.position.set(1.28, 0.82, 0.45); g.add(col); // Historic Medici Column!
    g.position.set(bx, getTerrainY(bx, bz), bz);
    ctx.scene.add(g);
    addPlaceLabel('st-bourse', 'Bourse de Commerce', bx, bz, 2.45, 2);
  }

  // 24. PALAIS DE TOKYO (Art Deco Twin Colonnades + Grand Mirror Pool facing the Seine!)
  {
    const [tx, tz] = geoToXZ(48.8641, 2.2970);
    const g = new THREE.Group();
    const plat = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.18, 2.3), stoneMat);
    plat.position.y = 0.09; g.add(plat);
    const pool = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 0.95), waterMat);
    pool.position.set(0, 0.11, 0.55); g.add(pool);
    [-1.55, 1.55].forEach((wx) => {
      const w = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.08, 1.15), stoneMat);
      w.position.set(wx, 0.62, -0.45); w.castShadow = true; g.add(w);
    });
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.35, 0.45), warmStoneMat);
    bridge.position.set(0, 0.92, -0.55); g.add(bridge);
    g.position.set(tx, getTerrainY(tx, tz), tz);
    g.rotation.y = 0.25;
    ctx.scene.add(g);
    addPlaceLabel('st-tokyo', 'Palais de Tokyo', tx, tz, 1.9, 1);
  }

  // 25. GARE DE LYON (Belle Époque Facade & Iconic 67m Golden Clock Tower!) & GARE DU NORD!
  {
    const [lx, lz] = geoToXZ(48.8443, 2.3735);
    const g = new THREE.Group();
    const hall = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.15, 2.2), warmStoneMat);
    hall.position.y = 0.58; hall.castShadow = true; g.add(hall);
    const shed = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 3.2, 14, 1, false, 0, Math.PI), glassMat);
    shed.rotation.z = Math.PI / 2; shed.position.set(0, 1.12, 0.35); g.add(shed);
    // Towering Tour de l'Horloge with 4 glowing gold clock dials
    const cTw = new THREE.Mesh(new THREE.BoxGeometry(0.62, 3.1, 0.62), stoneMat);
    cTw.position.set(-1.65, 1.55, -0.85); cTw.castShadow = true; g.add(cTw);
    const cBand = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.42, 0.66), clockGlowMat);
    cBand.position.set(-1.65, 2.62, -0.85); g.add(cBand);
    const cDome = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.68, 4), verdigrisMat);
    cDome.rotation.y = Math.PI / 4; cDome.position.set(-1.65, 3.42, -0.85); g.add(cDome);
    g.position.set(lx, getTerrainY(lx, lz), lz);
    g.rotation.y = -0.55;
    ctx.scene.add(g);
    addPlaceLabel('st-garelyon', 'Gare de Lyon', lx, lz, 4.1, 'all');

    const [nx, nz] = geoToXZ(48.8809, 2.3553);
    const gn = new THREE.Group();
    const nBody = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.32, 2.5), stoneMat);
    nBody.position.y = 0.66; nBody.castShadow = true; gn.add(nBody);
    const nShed = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 3.6, 14, 1, false, 0, Math.PI), glassMat);
    nShed.rotation.x = Math.PI / 2; nShed.position.set(0, 1.25, -0.35); gn.add(nShed);
    gn.position.set(nx, getTerrainY(nx, nz), nz);
    ctx.scene.add(gn);
    addPlaceLabel('st-garenord', 'Gare du Nord', nx, nz, 2.6, 'all');
  }

  // 26. PLACE DE LA BASTILLE (Colonne de Juillet + Golden Génie de la Liberté + Opéra Bastille!)
  {
    const [bx, bz] = geoToXZ(48.8532, 2.3692);
    const g = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(2.65, 2.7, 0.1, 24), cobblePlazaMat);
    disc.position.y = 0.05; g.add(disc);
    const ped = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.65, 0.68), stoneMat);
    ped.position.y = 0.36; g.add(ped);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.21, 2.55, 14), bronzeMat);
    col.position.y = 1.92; col.castShadow = true; g.add(col);
    const genie = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), goldMat);
    genie.scale.set(0.8, 1.4, 0.8); genie.position.y = 3.38; g.add(genie);
    // Modern curved glass-and-limestone Opéra Bastille flanking SE side
    const opB = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 1.55, 14, 1, false, -1.1, 2.2), glassMat);
    opB.position.set(2.35, 0.78, 1.25); g.add(opB);
    g.position.set(bx, getTerrainY(bx, bz), bz);
    ctx.scene.add(g);
    addPlaceLabel('pl-bastille', 'Place de la Bastille', bx, bz, 3.85, 'all');
  }

  // 27. PLACE DE LA RÉPUBLIQUE (Pedestrian Esplanade + Statue de Marianne + Reflecting Pool!)
  {
    const [rx, rz] = geoToXZ(48.8675, 2.3638);
    const g = new THREE.Group();
    const espl = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.09, 2.6), cobblePlazaMat);
    espl.position.y = 0.05; g.add(espl);
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.11, 0.85), waterMat);
    mirror.position.set(1.2, 0.06, 0); g.add(mirror);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.68, 1.35, 14), stoneMat);
    base.position.set(-0.6, 0.72, 0); g.add(base);
    const marianne = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.05, 10), bronzeMat);
    marianne.position.set(-0.6, 1.88, 0); marianne.castShadow = true; g.add(marianne);
    g.position.set(rx, getTerrainY(rx, rz), rz);
    g.rotation.y = -0.35;
    ctx.scene.add(g);
    addPlaceLabel('pl-republique', 'Place de la République', rx, rz, 2.85, 'all');
  }

  // 28. PLACE DE LA NATION, PLACE DU CHÂTELET, PLACE DES VICTOIRES, DENFERT & PLACE D'ITALIE!
  {
    // Place de la Nation (Triomphe de la République + Twin Barrière du Trône Columns!)
    const [nx, nz] = geoToXZ(48.8485, 2.3955);
    const gn = new THREE.Group();
    gn.add(new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.1, 0.09, 24), cobblePlazaMat));
    const nLawn = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.12, 22), lawnMat);
    nLawn.position.y = 0.04; gn.add(nLawn);
    const nMon = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.48, 1.45, 12), bronzeMat);
    nMon.position.y = 0.78; gn.add(nMon);
    [-1.3, 1.3].forEach((cz) => {
      const trCol = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 2.1, 10), stoneMat);
      trCol.position.set(3.2, 1.05, cz); gn.add(trCol);
    });
    gn.position.set(nx, getTerrainY(nx, nz), nz);
    ctx.scene.add(gn);
    addPlaceLabel('pl-nation', 'Place de la Nation', nx, nz, 2.5, 'all');

    // Place du Châtelet (Golden Fontaine du Palmier + Twin Theaters!)
    const [chx, chz] = geoToXZ(48.8576, 2.3471);
    const gc = new THREE.Group();
    gc.add(new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.09, 18), cobblePlazaMat));
    const chBasin = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.64, 0.18, 14), waterMat);
    chBasin.position.y = 0.14; gc.add(chBasin);
    const palm = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 1.75, 10), goldMat);
    palm.position.y = 1.05; gc.add(palm);
    [-1.55, 1.55].forEach((tx) => {
      const th = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.15, 1.35), stoneMat);
      th.position.set(tx, 0.58, 0); gc.add(th);
    });
    gc.position.set(chx, getTerrainY(chx, chz), chz);
    ctx.scene.add(gc);
    addPlaceLabel('pl-chatelet', 'Place du Châtelet', chx, chz, 2.2, 2);

    // Place des Victoires (Circular Louis XIV Equestrian Royal Square!)
    const [vx, vz] = geoToXZ(48.8658, 2.3412);
    const gv = new THREE.Group();
    gv.add(new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 0.09, 20), cobblePlazaMat));
    const vPed = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.58, 0.62), stoneMat);
    vPed.position.y = 0.34; gv.add(vPed);
    const vHorse = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.42, 0.45), bronzeMat);
    vHorse.position.y = 0.82; gv.add(vHorse);
    gv.position.set(vx, getTerrainY(vx, vz), vz);
    ctx.scene.add(gv);
    addPlaceLabel('pl-victoires', 'Place des Victoires', vx, vz, 1.65, 3);

    // Place Denfert-Rochereau (Lion de Belfort!) & Place d'Italie
    const [dx, dz] = geoToXZ(48.8340, 2.3324);
    const gd = new THREE.Group();
    gd.add(new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.09, 20), cobblePlazaMat));
    const lionPed = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.48, 0.95), stoneMat);
    lionPed.position.y = 0.28; gd.add(lionPed);
    const lion = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.42, 0.78), bronzeMat);
    lion.position.y = 0.72; gd.add(lion);
    gd.position.set(dx, getTerrainY(dx, dz), dz);
    ctx.scene.add(gd);
    addPlaceLabel('pl-denfert', 'Place Denfert-Rochereau', dx, dz, 1.75, 'all');

    const [itx, itz] = geoToXZ(48.8316, 2.3557);
    const gi = new THREE.Group();
    gi.add(new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.35, 0.09, 20), cobblePlazaMat));
    const itPool = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.2, 0.16, 18), waterMat);
    itPool.position.y = 0.12; gi.add(itPool);
    gi.position.set(itx, getTerrainY(itx, itz), itz);
    ctx.scene.add(gi);
    addPlaceLabel('pl-italie', "Place d'Italie", itx, itz, 1.8, 'all');
  }

  // 29. SIX ICONIC HISTORIC PARISIAN CHURCHES FILLING THE SKYLINE!
  // A. Église & Place Saint-Sulpice (Monumental Classical Colonnade + Asymmetric Twin Towers + Fountain!)
  {
    const [sx, sz] = geoToXZ(48.8509, 2.3348);
    const g = new THREE.Group();
    const nave = new THREE.Mesh(new THREE.BoxGeometry(2.95, 1.55, 1.65), stoneMat);
    nave.position.set(0.35, 0.78, 0); nave.castShadow = true; g.add(nave);
    // Famous Asymmetric Twin Bell Towers (North tower taller & octagonal, South shorter & unfinished!)
    const nTw = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 3.15, 8), stoneMat);
    nTw.position.set(-1.05, 1.58, -0.58); nTw.castShadow = true; g.add(nTw);
    const sTw = new THREE.Mesh(new THREE.BoxGeometry(0.62, 2.72, 0.62), warmStoneMat);
    sTw.position.set(-1.05, 1.36, 0.58); g.add(sTw);
    // Place Saint-Sulpice & Tiered Fontaine Saint-Sulpice directly west!
    const pl = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.09, 2.6), cobblePlazaMat);
    pl.position.set(-2.35, 0.05, 0); g.add(pl);
    const fBas = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.68, 0.2, 14), waterMat);
    fBas.position.set(-2.45, 0.14, 0); g.add(fBas);
    const fTier = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.72, 0.45), stoneMat);
    fTier.position.set(-2.45, 0.52, 0); g.add(fTier);
    g.position.set(sx, getTerrainY(sx, sz), sz);
    ctx.scene.add(g);
    addPlaceLabel('ch-stsulpice', 'Église Saint-Sulpice', sx, sz, 3.45, 1);
  }

  // B. Église Saint-Eustache (Colossal Gothic-Renaissance Basilica at Les Halles!)
  {
    const [ex, ez] = geoToXZ(48.8634, 2.3452);
    const g = new THREE.Group();
    const nave = new THREE.Mesh(new THREE.BoxGeometry(2.65, 1.68, 1.32), warmStoneMat);
    nave.position.y = 0.84; nave.castShadow = true; g.add(nave);
    const trans = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.62, 2.15), stoneMat);
    trans.position.set(0.15, 0.81, 0); g.add(trans);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 2.6, 3), darkSlate);
    roof.rotation.z = Math.PI / 2; roof.position.y = 1.92; g.add(roof);
    const tw = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.45, 0.55), stoneMat);
    tw.position.set(-1.18, 1.22, -0.45); g.add(tw);
    g.position.set(ex, getTerrainY(ex, ez), ez);
    g.rotation.y = -0.22;
    ctx.scene.add(g);
    addPlaceLabel('ch-steustache', 'Église Saint-Eustache', ex, ez, 2.75, 2);
  }

  // C. Église Saint-Augustin (Ribbed Verdigris-Copper Dome on Boulevard Haussmann!)
  {
    const [ax, az] = geoToXZ(48.8755, 2.3195);
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.35, 2.25), stoneMat);
    base.position.y = 0.68; base.castShadow = true; g.add(base);
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.72, 0.75, 16), warmStoneMat);
    drum.position.set(0, 1.68, -0.25); g.add(drum);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), verdigrisMat);
    dome.scale.set(1, 1.35, 1); dome.position.set(0, 2.02, -0.25); g.add(dome);
    const lantern = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.65, 6), goldMat);
    lantern.position.set(0, 3.25, -0.25); g.add(lantern);
    g.position.set(ax, getTerrainY(ax, az), az);
    ctx.scene.add(g);
    addPlaceLabel('ch-staugustin', 'Église Saint-Augustin', ax, az, 3.55, 3);
  }

  // D. Église de la Sainte-Trinité (Tall Renaissance Clock-Belfry north of Galeries Lafayette!)
  {
    const [tx, tz] = geoToXZ(48.8772, 2.3316);
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.32, 2.05), stoneMat);
    body.position.y = 0.66; g.add(body);
    const belfry = new THREE.Mesh(new THREE.BoxGeometry(0.58, 2.85, 0.58), warmStoneMat);
    belfry.position.set(0, 1.42, 0.85); belfry.castShadow = true; g.add(belfry);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.78, 8), darkSlate);
    spire.position.set(0, 3.22, 0.85); g.add(spire);
    const garden = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.1, 1.15), lawnMat);
    garden.position.set(0, 0.05, 1.65); g.add(garden);
    g.position.set(tx, getTerrainY(tx, tz), tz);
    ctx.scene.add(g);
    addPlaceLabel('ch-trinite', 'Église de la Trinité', tx, tz, 3.6, 3);
  }

  // E. Cathédrale Saint-Alexandre-Nevsky (5 Gleaming Golden Russian Onion Domes near Parc Monceau!)
  {
    const [nx, nz] = geoToXZ(48.8775, 2.3017);
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.25, 1.45), warmStoneMat);
    body.position.y = 0.62; g.add(body);
    [[0, 0, 0.34, 2.1], [-0.45, -0.45, 0.2, 1.65], [0.45, -0.45, 0.2, 1.65], [-0.45, 0.45, 0.2, 1.65], [0.45, 0.45, 0.2, 1.65]].forEach(([ox, oz, rad, oy]) => {
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.75, rad * 0.8, 0.45, 10), stoneMat);
      drum.position.set(ox, oy - 0.25, oz); g.add(drum);
      const onion = new THREE.Mesh(new THREE.SphereGeometry(rad, 12, 10), goldMat);
      onion.scale.set(1, 1.28, 1); onion.position.set(ox, oy + 0.1, oz); g.add(onion);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(rad * 0.35, 0.36, 6), goldMat);
      tip.position.set(ox, oy + rad * 1.45, oz); g.add(tip);
    });
    g.position.set(nx, getTerrainY(nx, nz), nz);
    ctx.scene.add(g);
    addPlaceLabel('ch-nevsky', 'Cathédrale St-Alexandre-Nevsky', nx, nz, 2.85, 3);
  }

  // F. Église Saint-Germain-l'Auxerrois (Gothic Royal Parish Church directly facing Cour Carrée!)
  {
    const [gx, gz] = geoToXZ(48.8595, 2.3413);
    const g = new THREE.Group();
    const nave = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.12, 1.05), warmStoneMat);
    nave.position.y = 0.56; g.add(nave);
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.95, 0.45), stoneMat);
    tower.position.set(-0.2, 0.98, -0.58); g.add(tower);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.95, 6), darkSlate);
    spire.position.set(-0.2, 2.38, -0.58); g.add(spire);
    g.position.set(gx, getTerrainY(gx, gz), gz);
    g.rotation.y = -0.42;
    ctx.scene.add(g);
    addPlaceLabel('ch-stgermaux', "St-Germain-l'Auxerrois", gx, gz, 2.9, 2);
  }
}

