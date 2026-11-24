// Toggleable 3D Paris Métro / RER / FLV Shuttle Network Overlay (Lines 1, 2, 9, RER C & Shuttle)
import { geoToXZ, getTerrainY } from '../config.js';
import { ctx, state } from '../state.js';

export const TRANSIT_LINES = [
  {
    id: 'm1',
    badge: 'M1',
    name: 'Μετρό Γραμμή 1 (Express Concorde → Châtelet)',
    colorHex: '#ffcd00',
    colorInt: 0xffcd00,
    stations: [
      { name: 'Les Sablons (FLV)', ll: [48.8808, 2.2732] },
      { name: 'Porte Maillot', ll: [48.8778, 2.2825] },
      { name: 'Étoile', ll: [48.8738, 2.2950] },
      { name: 'Franklin D. Roosevelt', ll: [48.8689, 2.3095] },
      { name: 'Concorde (16:00 Express!)', ll: [48.8656, 2.3212] },
      { name: 'Tuileries', ll: [48.8644, 2.3292] },
      { name: 'Palais Royal • Louvre', ll: [48.8626, 2.3360] },
      { name: 'Châtelet (→ Sainte-Chapelle)', ll: [48.8584, 2.3471] },
      { name: 'Hôtel de Ville', ll: [48.8571, 2.3516] },
      { name: 'Saint-Paul', ll: [48.8552, 2.3608] },
      { name: 'Bastille', ll: [48.8532, 2.3692] },
    ],
  },
  {
    id: 'm2',
    badge: 'M2',
    name: 'Μετρό Γραμμή 2 (Προς Μονμάρτρη / Anvers)',
    colorHex: '#2e7bff',
    colorInt: 0x2e7bff,
    stations: [
      { name: 'Porte Dauphine', ll: [48.8716, 2.2753] },
      { name: 'Victor Hugo', ll: [48.8698, 2.2852] },
      { name: 'Étoile (M2)', ll: [48.8742, 2.2956] },
      { name: 'Monceau', ll: [48.8803, 2.3090] },
      { name: 'Place de Clichy', ll: [48.8835, 2.3272] },
      { name: 'Blanche (Moulin Rouge)', ll: [48.8836, 2.3324] },
      { name: 'Anvers (→ Sacré-Cœur)', ll: [48.8829, 2.3446] },
    ],
  },
  {
    id: 'm9',
    badge: 'M9',
    name: 'Μετρό Γραμμή 9 (La Muette • Marmottan)',
    colorHex: '#b6bd00',
    colorInt: 0xb6bd00,
    stations: [
      { name: 'La Muette (Marmottan)', ll: [48.8582, 2.2742] },
      { name: 'Trocadéro', ll: [48.8632, 2.2870] },
      { name: 'Alma – Marceau', ll: [48.8648, 2.3008] },
      { name: 'Havre – Caumartin (Lafayette)', ll: [48.8736, 2.3282] },
    ],
  },
  {
    id: 'rerc',
    badge: 'RER C',
    name: 'RER C (Άιφελ → Saint-Michel / Quartier Latin)',
    colorHex: '#f5a623',
    colorInt: 0xf5a623,
    stations: [
      { name: 'Champ de Mars – Tour Eiffel', ll: [48.8562, 2.2896] },
      { name: 'Pont de l\'Alma', ll: [48.8625, 2.3006] },
      { name: 'Invalides', ll: [48.8624, 2.3132] },
      { name: "Musée d'Orsay", ll: [48.8604, 2.3264] },
      { name: 'Saint-Michel Notre-Dame', ll: [48.8533, 2.3444] },
    ],
  },
  {
    id: 'flv-shuttle',
    badge: 'BUS',
    name: 'FLV Shuttle (13:40 Av. de Friedland → FLV)',
    colorHex: '#f282a8',
    colorInt: 0xf282a8,
    stations: [
      { name: 'Av. de Friedland (Shuttle 13:40)', ll: [48.8744, 2.2974] },
      { name: 'Fondation Louis Vuitton', ll: [48.8766, 2.2634] },
    ],
  },
];

export function buildTransitOverlay() {
  const group = new THREE.Group();
  group.visible = !!state.metroOverlay;

  const labelsLayer = document.getElementById('labels-layer');
  const transitLabels = [];

  TRANSIT_LINES.forEach((line) => {
    const pts3D = line.stations.map((st) => {
      const [x, z] = geoToXZ(st.ll[0], st.ll[1]);
      const y = getTerrainY(x, z) + 0.92;
      return new THREE.Vector3(x, y, z);
    });

    const curve = new THREE.CatmullRomCurve3(pts3D, false, 'catmullrom', 0.2);
    const tubeGeo = new THREE.TubeGeometry(curve, Math.max(24, line.stations.length * 14), 0.14, 6, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: line.colorInt,
      transparent: true,
      opacity: 0.9,
    });
    group.add(new THREE.Mesh(tubeGeo, tubeMat));

    const glowGeo = new THREE.TubeGeometry(curve, Math.max(24, line.stations.length * 14), 0.32, 6, false);
    const glowMat = new THREE.MeshBasicMaterial({
      color: line.colorInt,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    group.add(new THREE.Mesh(glowGeo, glowMat));

    // Station glowing pillars + roundel badges
    const ringGeo = new THREE.CylinderGeometry(0.38, 0.42, 0.16, 14);
    const ringMat = new THREE.MeshBasicMaterial({ color: line.colorInt });
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    line.stations.forEach((st, idx) => {
      const p = pts3D[idx];
      const disc = new THREE.Mesh(ringGeo, ringMat);
      disc.position.copy(p);
      group.add(disc);
      const center = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.2, 12), coreMat);
      center.position.copy(p);
      group.add(center);

      if (labelsLayer) {
        const el = document.createElement('div');
        el.className = 'paris-label is-transit';
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        el.innerHTML = `<div class="paris-label-badge" style="border-color:${line.colorHex};padding:2px 7px;font-size:10px;"><span style="background:${line.colorHex};color:#090e1d;font-weight:800;padding:0 4px;border-radius:4px;font-size:9px;">${line.badge}</span><span>${st.name}</span></div>`;
        labelsLayer.appendChild(el);
        transitLabels.push({
          pos: new THREE.Vector3(p.x, p.y + 0.9, p.z),
          el,
        });
      }
    });
  });

  ctx.transitGroup = group;
  ctx.transitLabels = transitLabels;
  ctx.scene.add(group);
}

export function setTransitOverlayVisible(visible) {
  state.metroOverlay = !!visible;
  if (ctx.transitGroup) ctx.transitGroup.visible = state.metroOverlay;
  if (!state.metroOverlay && ctx.transitLabels) {
    ctx.transitLabels.forEach((t) => {
      t.el.style.opacity = '0';
      t.el.style.pointerEvents = 'none';
    });
  }
}
