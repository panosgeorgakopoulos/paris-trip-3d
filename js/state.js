// Application state, localStorage persistence, shared 3D runtime context & motion helpers
import { BOOKINGS_DATA, TIME_PRESETS } from './config.js';

export const STORAGE_KEY = 'paris_3d_squad4_dec2026_v3';

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) { }
  return null;
}

export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      visited: Array.from(state.visited),
      bookings: state.bookings,
      photos: state.photos,
    }));
  } catch (_) { }
}

const saved = loadState();
const defaultBookingsMap = {};
BOOKINGS_DATA.forEach(b => { defaultBookingsMap[b.id] = b.defaultBooked; });

export const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const state = {
  activeDay: 'all', // 'all' | 1 | 2 | 3
  selectedStopId: null,
  timeMode: 'auto', // 'auto' | 'morning' | 'afternoon' | 'dusk' | 'night'
  currentResolvedTime: 'dusk',
  snowEnabled: !prefersReducedMotion,
  sparkleUntil: 0,
  sidebarOpen: window.innerWidth >= 768,
  // 4-Guys Route Player State
  squadPlaying: false,
  squadFollowCam: true,
  camFollowMode: 'follow', // 'free' | 'follow' | 'pov'
  gpsActive: false,
  metroOverlay: false,
  squadSpeed: 1, // 1 | 2 | 4
  squadDay: 1,
  squadProgress: 0, // 0..1 across active timeline
  lastTriggeredStopId: null,
  visited: new Set(saved && Array.isArray(saved.visited) ? saved.visited : []),
  bookings: Object.assign({}, defaultBookingsMap, saved && saved.bookings ? saved.bookings : {}),
  photos: Object.assign({}, saved && saved.photos ? saved.photos : {}),
};

// =======================================================================
// 5. UI HELPERS (TOASTS & COUNTDOWN)
// =======================================================================
export function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast-msg';
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-8px)';
    setTimeout(() => el.remove(), 380);
  }, 2600);
}

export function updateCountdown() {
  const targetTime = new Date('2026-12-01T10:10:00+01:00').getTime();
  const diff = targetTime - Date.now();
  let text = '';
  if (diff <= 0) {
    text = 'Bon Voyage! 🇫🇷✨';
  } else {
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff / 3600000) % 24);
    const mins = Math.floor((diff / 60000) % 60);
    text = `${days}μ ${String(hours).padStart(2, '0')}ω ${String(mins).padStart(2, '0')}λ`;
  }
  const dEl = document.getElementById('countdown-text');
  const mEl = document.getElementById('countdown-mobile');
  if (dEl) dEl.textContent = text;
  if (mEl) mEl.textContent = text;
}


export const camCtrl = {
  target: new THREE.Vector3(-12, 1.5, 4),
  desiredTarget: new THREE.Vector3(-12, 1.5, 4),
  theta: 0.28,
  desiredTheta: 0.28,
  phi: 1.0,
  desiredPhi: 1.0,
  radius: 112,
  desiredRadius: 112,
  autoOrbit: !prefersReducedMotion,
  isDragging: false,
  dragMoved: false,
  lastX: 0,
  lastY: 0,
  pinchDist: 0,
};

export const liveLight = {
  skyTop: TIME_PRESETS.dusk.skyTop.clone(),
  skyHorizon: TIME_PRESETS.dusk.skyHorizon.clone(),
  fog: TIME_PRESETS.dusk.fog.clone(),
  fogDensity: TIME_PRESETS.dusk.fogDensity,
  hemiSky: TIME_PRESETS.dusk.hemiSky.clone(),
  hemiGround: TIME_PRESETS.dusk.hemiGround.clone(),
  hemiInt: TIME_PRESETS.dusk.hemiInt,
  dirColor: TIME_PRESETS.dusk.dirColor.clone(),
  dirInt: TIME_PRESETS.dusk.dirInt,
  dirPos: TIME_PRESETS.dusk.dirPos.clone(),
  windowGlow: TIME_PRESETS.dusk.windowGlow,
  starOpacity: TIME_PRESETS.dusk.starOpacity,
  beaconOpacity: TIME_PRESETS.dusk.beaconOpacity,
  monumentEmissive: TIME_PRESETS.dusk.monumentEmissive,
};


// Shared mutable Three.js runtime context across scene modules
export const ctx = {
  scene: null,
  camera: null,
  renderer: null,
  clock: null,
  hemiLight: null,
  dirLight: null,
  fillLight: null,
  eiffelLight: null,
  beaconPivot: null,
  beaconMesh: null,
  skyUniforms: null,
  seineUniforms: null,
  seineCurve: null,
  seineDensePts: [],
  citeCenterXZ: [23.82, 22.51],
  ileStLouisXZ: [39.91, 30.09],
  surfaces: null,
  snowPoints: null,
  starField: null,
  eiffelSparkles: null,
  moulinSails: null,
  bateauxBoat: null,
  haussmannMat: null,
  homeBeacon: null,
  routeGroups: { 1: null, 2: null, 3: null },
  routePulses: [],
  stopPins: [],
  landmarkLabelEntries: [],
  monumentGlowMaterials: [],
  roadPolylines: [],
  compiledDayPaths: { 1: null, 2: null, 3: null },
  squadRoot: null,
  squadGuys: [],
  squadVehicles: { metro: null, shuttle: null, taxi: null },
  squadAuraRing: null,
  squadLabelEntry: null,
  transitGroup: null,
  transitLabels: [],
  gpsBeacon: null,
  raycaster: new THREE.Raycaster(),
  pointer: new THREE.Vector2(),
};

// Fetch & safely decompress gzip-packed binary GIS files (guards against double-decompression)
export async function fetchZbin(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} loading ${url}`);
  const rawBuf = await res.arrayBuffer();
  const bytes = new Uint8Array(rawBuf);
  if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b && typeof DecompressionStream !== 'undefined') {
    const decomp = await new Response(
      new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
    ).arrayBuffer();
    return new Uint8Array(decomp);
  }
  return bytes;
}

export function spawnTapRipple(x, y) {
  if (prefersReducedMotion || typeof x !== 'number' || typeof y !== 'number') return;
  const r = document.createElement('div');
  r.className = 'tap-ripple-ring';
  r.style.left = `${x}px`;
  r.style.top = `${y}px`;
  document.body.appendChild(r);
  setTimeout(() => r.remove(), 300);
}

export function spawnCelebrationBurst(x, y, count = 10) {
  if (prefersReducedMotion) return;
  const cols = ['#ecc778', '#fff0c2', '#4ade9a', '#5cc2ff', '#f282a8'];
  const cx = typeof x === 'number' ? x : window.innerWidth * 0.5;
  const cy = typeof y === 'number' ? y : window.innerHeight * 0.45;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'celeb-spark';
    const ang = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
    const dist = (count > 14 ? 52 : 26) + Math.random() * (count > 14 ? 68 : 28);
    p.style.left = `${cx}px`;
    p.style.top = `${cy}px`;
    p.style.background = cols[i % cols.length];
    p.style.setProperty('--dx', `${(Math.cos(ang) * dist).toFixed(1)}px`);
    p.style.setProperty('--dy', `${(Math.sin(ang) * dist - 14).toFixed(1)}px`);
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 560);
  }
}

export function triggerSquash(el, cls = 'anim-squash-pop') {
  if (!el || prefersReducedMotion) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

