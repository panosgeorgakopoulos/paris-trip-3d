// Real-Trip Smart Companion Features:
// • Live GPS "You Are Here" 3D Blue Beacon + Walking Distance to Next Stop
// • Live Paris Weather Sync (Open-Meteo, zero API key)
// • Google Maps Rotating North-Up Compass
// • Live "Right Now in Paris" Schedule & Hard-Deadline Alerts (Europe/Paris)
// • Stop-to-Stop Google Maps Walking/Transit Directions
// • 1-Tap Shareable URL-Hash Progress Sync for Panos, Kostas, Iakovos & Imbrixis
import { geoToXZ, getTerrainY, P, ITINERARY_STOPS, BOOKINGS_DATA, PHOTO_SPOTS, WORLD_SCALE } from './config.js';
import { ctx, state, camCtrl, saveState, showToast, triggerSquash, spawnCelebrationBurst } from './state.js';
import { flyCameraTo } from './controls.js';

// =========================================================================
// 1. LIVE GPS "YOU ARE HERE" 3D BEACON, DIRECTION CONE & WALKING DISTANCE
// =========================================================================
let gpsWatchId = null;
let gpsMesh = null;
let gpsPulseRing = null;
let gpsHeadingPivot = null;
let gpsWorldXZ = null;
let gpsHeadingDeg = null;
let gpsSmoothedRotY = 0;
let orientationListening = false;

function createHeadingConeTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 6, 64, 64, 64);
  grad.addColorStop(0.0, 'rgba(62, 152, 255, 0.78)');
  grad.addColorStop(0.45, 'rgba(62, 152, 255, 0.34)');
  grad.addColorStop(0.85, 'rgba(62, 152, 255, 0.08)');
  grad.addColorStop(1.0, 'rgba(62, 152, 255, 0.0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function handleDeviceOrientation(ev) {
  let heading = null;
  if (typeof ev.webkitCompassHeading === 'number' && !Number.isNaN(ev.webkitCompassHeading)) {
    // iOS Safari gives exact magnetic compass heading (0 = North, 90 = East)
    heading = ev.webkitCompassHeading;
  } else if (typeof ev.alpha === 'number' && !Number.isNaN(ev.alpha)) {
    // Android Chrome / absolute orientation fallback
    heading = (360 - ev.alpha) % 360;
  }
  if (heading !== null) gpsHeadingDeg = heading;
}

function startCompassOrientation() {
  if (orientationListening || typeof window === 'undefined') return;
  const attach = () => {
    if (orientationListening) return;
    window.addEventListener('deviceorientationabsolute', handleDeviceOrientation, true);
    window.addEventListener('deviceorientation', handleDeviceOrientation, true);
    orientationListening = true;
  };
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    // Must be called inside the user click gesture on iOS 13+ Safari!
    DeviceOrientationEvent.requestPermission()
      .then((res) => { if (res === 'granted') attach(); })
      .catch(() => {});
  } else {
    attach();
  }
}

function stopCompassOrientation() {
  if (!orientationListening || typeof window === 'undefined') return;
  window.removeEventListener('deviceorientationabsolute', handleDeviceOrientation, true);
  window.removeEventListener('deviceorientation', handleDeviceOrientation, true);
  orientationListening = false;
  gpsHeadingDeg = null;
}

function ensureGpsBeaconMesh() {
  if (gpsMesh || !ctx.scene) return;
  const g = new THREE.Group();

  // Google Maps-style Cobalt-Blue Directional Light Cone showing which way your phone faces!
  gpsHeadingPivot = new THREE.Group();
  gpsHeadingPivot.position.y = 0.06;
  const coneGeo = new THREE.CircleGeometry(2.35, 22, Math.PI * 0.5 - Math.PI * 0.26, Math.PI * 0.52);
  coneGeo.rotateX(-Math.PI / 2); // Sector now points directly along -Z (True North at rotY = 0!)
  const coneMat = new THREE.MeshBasicMaterial({
    map: createHeadingConeTexture(),
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const coneMesh = new THREE.Mesh(coneGeo, coneMat);
  gpsHeadingPivot.add(coneMesh);
  g.add(gpsHeadingPivot);

  // Crisp white collar + Apple/Google Maps pulsing cobalt-blue GPS dot
  const collar = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  collar.scale.set(1, 0.5, 1);
  g.add(collar);

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x2f80ff })
  );
  core.position.y = 0.08;
  g.add(core);

  gpsPulseRing = new THREE.Mesh(
    new THREE.RingGeometry(0.45, 0.88, 28),
    new THREE.MeshBasicMaterial({
      color: 0x3b8dff,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  gpsPulseRing.rotation.x = -Math.PI / 2;
  gpsPulseRing.position.y = 0.05;
  g.add(gpsPulseRing);

  g.visible = false;
  ctx.scene.add(g);
  gpsMesh = g;
  ctx.gpsBeacon = g;
}

function setGpsWorldPosition(lat, lon, isSimulated = false) {
  ensureGpsBeaconMesh();
  const [x, z] = geoToXZ(lat, lon);
  const y = getTerrainY(x, z) + 0.35;
  gpsWorldXZ = [x, z];
  gpsMesh.position.set(x, y, z);
  gpsMesh.visible = true;

  // Compute live walking distance to selected or first unvisited stop
  const targetStop = ITINERARY_STOPS.find((s) => s.id === state.selectedStopId)
    || ITINERARY_STOPS.find((s) => !state.visited.has(s.id))
    || ITINERARY_STOPS[0];
  let distMsg = '';
  if (targetStop) {
    const meters = Math.round(Math.hypot(x - targetStop.pos[0], z - targetStop.pos[2]) * (1000 / WORLD_SCALE));
    const mins = Math.max(1, Math.round(meters / 78));
    distMsg = ` • ${meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`} (~${mins}') από ${targetStop.shortLabel}`;
  }

  flyCameraTo(new THREE.Vector3(x, y + 0.6, z), new THREE.Vector3(-8, 10, 12));
  showToast(isSimulated
    ? `📍 Προεπισκόπηση GPS (Rue Saint-Hyacinthe 3)${distMsg}`
    : `📍 Ζωντανό GPS + Πυξίδα στο Παρίσι${distMsg}`);
}

export function animateGpsBeacon(elapsed) {
  if (!gpsMesh || !gpsMesh.visible || !gpsPulseRing) return;
  const phase = (elapsed * 1.15) % 1;
  const sc = 1 + phase * 2.4;
  gpsPulseRing.scale.set(sc, sc, 1);
  gpsPulseRing.material.opacity = (1 - phase) * 0.62;

  // Smoothly align Google Maps blue direction cone with live DeviceOrientation compass heading
  // (or camera forward direction when previewing on desktop without hardware compass!)
  if (gpsHeadingPivot) {
    const desiredRotY = gpsHeadingDeg !== null
      ? -THREE.MathUtils.degToRad(gpsHeadingDeg)
      : camCtrl.theta;
    let diff = desiredRotY - gpsSmoothedRotY;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    gpsSmoothedRotY += diff * 0.16;
    gpsHeadingPivot.rotation.y = gpsSmoothedRotY;
  }
}

export function toggleLiveGPS(btnEl) {
  const active = !state.gpsActive;
  state.gpsActive = active;
  if (btnEl) {
    btnEl.classList.toggle('bg-sapphire/25', active);
    btnEl.classList.toggle('border-sapphire/70', active);
    btnEl.classList.toggle('text-sapphire', active);
    triggerSquash(btnEl);
  }

  if (!active) {
    if (gpsWatchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(gpsWatchId);
      gpsWatchId = null;
    }
    stopCompassOrientation();
    if (gpsMesh) gpsMesh.visible = false;
    showToast('📍 Ζωντανό GPS απενεργοποιήθηκε');
    return;
  }

  // Request live iOS/Android compass direction cone permission right inside user tap gesture!
  startCompassOrientation();

  if (!navigator.geolocation) {
    setGpsWorldPosition(48.8664, 2.3324, true);
    return;
  }

  showToast('📍 Αναζήτηση θέσης GPS...');
  let centeredOnce = false;
  gpsWatchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      // Check if user is physically inside Greater Paris (~20km of Louvre)
      const inParis = Math.abs(latitude - 48.864) < 0.16 && Math.abs(longitude - 2.332) < 0.25;
      if (inParis) {
        if (!centeredOnce) {
          centeredOnce = true;
          setGpsWorldPosition(latitude, longitude, false);
        } else if (gpsMesh) {
          const [x, z] = geoToXZ(latitude, longitude);
          gpsWorldXZ = [x, z];
          gpsMesh.position.set(x, getTerrainY(x, z) + 0.35, z);
          gpsMesh.visible = true;
        }
      } else if (!centeredOnce) {
        centeredOnce = true;
        // User is outside Paris right now -> place clean demo GPS dot at their Paris apartment!
        setGpsWorldPosition(48.8664, 2.3324, true);
      }
    },
    () => {
      // Permission denied or unavailable -> graceful Paris apartment preview
      setGpsWorldPosition(48.8664, 2.3324, true);
    },
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 8000 }
  );
}

// =========================================================================
// 2. LIVE PARIS WEATHER SYNC (OPEN-METEO FREE API, NO KEY!)
// =========================================================================
function decodeWmoWeather(code, isDay) {
  if (code === 0) return { icon: isDay ? '☀️' : '🌙', label: 'Αίθριος', precip: 'none' };
  if (code <= 3) return { icon: isDay ? '⛅' : '☁️', label: 'Λίγα σύννεφα', precip: 'none' };
  if (code === 45 || code === 48) return { icon: '🌫️', label: 'Ομίχλη', precip: 'none' };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { icon: '🌧️', label: 'Βροχή', precip: 'rain' };
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return { icon: '❄️', label: 'Χιόνι', precip: 'snow' };
  if (code >= 95) return { icon: '⛈️', label: 'Καταιγίδα', precip: 'rain' };
  return { icon: '☁️', label: 'Συννεφιά', precip: 'none' };
}

export async function initParisWeather() {
  const pill = document.getElementById('paris-weather-pill');
  const iconEl = document.getElementById('weather-icon');
  const tempEl = document.getElementById('weather-temp');
  if (!pill || !iconEl || !tempEl) return;

  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=48.8640&longitude=2.3320&current=temperature_2m,weather_code,is_day&timezone=Europe%2FParis'
    );
    if (!res.ok) return;
    const data = await res.json();
    if (!data || !data.current) return;

    const temp = Math.round(data.current.temperature_2m);
    const wmo = decodeWmoWeather(data.current.weather_code, !!data.current.is_day);
    iconEl.textContent = wmo.icon;
    tempEl.textContent = `${temp}°C`;
    pill.title = `Καιρός Παρίσι τώρα: ${wmo.label} (${temp}°C)`;
    pill.classList.remove('hidden');
    pill.classList.add('inline-flex');

    // Subtly tint 3D precipitation particles if it's actively raining in Paris!
    if (wmo.precip === 'rain' && ctx.snowPoints) {
      ctx.snowPoints.material.color.setHex(0x9ecaff);
      ctx.snowPoints.material.opacity = 0.62;
    }
  } catch (_) {
    // Offline or blocked -> keep pill cleanly hidden
  }
}

// =========================================================================
// 3. GOOGLE MAPS ROTATING NORTH-UP COMPASS
// =========================================================================
export function updateCompassUI() {
  const btn = document.getElementById('btn-compass');
  const needle = document.getElementById('compass-needle');
  if (!btn || !needle) return;

  // Normalize theta to [-PI, PI]
  let t = camCtrl.theta % (Math.PI * 2);
  if (t > Math.PI) t -= Math.PI * 2;
  if (t < -Math.PI) t += Math.PI * 2;

  const deg = (t * 180) / Math.PI;
  needle.style.transform = `rotate(${deg.toFixed(1)}deg)`;

  const rotated = Math.abs(t) > 0.09;
  btn.classList.toggle('compass-visible', rotated);
}

export function snapNorthUp(btnEl) {
  camCtrl.autoOrbit = false;
  camCtrl.arc = null;
  // Shortest-angle snap back to theta = 0 (North Up!)
  const turns = Math.round(camCtrl.desiredTheta / (Math.PI * 2));
  camCtrl.desiredTheta = turns * Math.PI * 2;
  if (btnEl) triggerSquash(btnEl);
  showToast('🧭 Προσανατολισμός: Βορράς επάνω');
}

// =========================================================================
// 4. LIVE "RIGHT NOW IN PARIS" SCHEDULE & HARD-DEADLINE ALERTS
// =========================================================================
function getParisNowParts() {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, Number(p.value)]));
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    mins: parts.hour * 60 + parts.minute,
  };
}

function parseStartMinutes(timeStr) {
  const m = String(timeStr || '').match(/(\d{2}):(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
}

export function updateLiveParisBanner(onJumpToStop) {
  const banner = document.getElementById('live-paris-banner');
  const textEl = document.getElementById('live-banner-text');
  const jumpBtn = document.getElementById('btn-live-jump');
  if (!banner || !textEl) return;

  const now = getParisNowParts();
  const isTripDay = now.year === 2026 && now.month === 12 && (now.day === 1 || now.day === 2 || now.day === 3);

  if (isTripDay) {
    const todayStops = ITINERARY_STOPS.filter((s) => s.day === now.day);
    let nextStop = todayStops.find((s) => parseStartMinutes(s.time) >= now.mins - 20) || todayStops[todayStops.length - 1];
    if (nextStop) {
      const diff = parseStartMinutes(nextStop.time) - now.mins;
      let prefix = diff > 0 ? `Σε ${diff}'` : 'Τώρα';
      // Special high-priority Paris deadline highlights!
      if (now.day === 2 && now.mins >= 920 && now.mins <= 975) {
        prefix = '⚡ EXPRESS 16:00 → Concorde M1 → Châtelet';
      } else if (now.day === 1 && now.mins >= 1050 && now.mins <= 1145) {
        prefix = '✨ Λάμψη Άιφελ στις 18:00 / 19:00!';
      } else if (now.day === 3 && now.mins >= 795 && now.mins <= 840) {
        prefix = '🚌 Shuttle FLV φεύγει 13:40 από Av. Friedland!';
      }
      textEl.textContent = `${prefix} • ${nextStop.shortLabel}`;
      banner.classList.remove('hidden');
      banner.classList.add('flex');
      if (jumpBtn) {
        jumpBtn.classList.remove('hidden');
        jumpBtn.onclick = () => onJumpToStop && onJumpToStop(nextStop.id);
      }
      return;
    }
  }

  // Pre-trip smart reminder (Notre-Dame Monday 30/11 free slot!)
  const ndBooked = !!state.bookings['bk-notredame'];
  if (!ndBooked) {
    textEl.textContent = '📅 Δευτέρα 30/11: Κλείστε δωρεάν slot για Notre-Dame!';
    banner.classList.remove('hidden');
    banner.classList.add('flex');
    if (jumpBtn) {
      jumpBtn.classList.remove('hidden');
      jumpBtn.onclick = () => onJumpToStop && onJumpToStop('d2-7');
    }
  } else {
    banner.classList.add('hidden');
    banner.classList.remove('flex');
  }
}

// =========================================================================
// 5. STOP-TO-STOP GOOGLE MAPS WALKING / TRANSIT DIRECTIONS
// =========================================================================
export function buildDirectionsUrl(stop) {
  if (!stop) return '#';
  const dayStops = ITINERARY_STOPS.filter((s) => s.day === stop.day);
  const idx = dayStops.findIndex((s) => s.id === stop.id);
  const prevStop = idx > 0 ? dayStops[idx - 1] : null;
  const origin = prevStop ? (prevStop.mapsQuery || prevStop.title) : '3 Rue Saint-Hyacinthe';
  const destination = stop.mapsQuery || stop.title;
  const isTransit = /Μετρό|RER|Shuttle|Ταξί/i.test(stop.tag || '') || /Μετρό|RER|Shuttle/i.test(stop.details || '');
  const travelmode = isTransit ? 'transit' : 'walking';
  return (
    'https://www.google.com/maps/dir/?api=1'
    + '&origin=' + encodeURIComponent(origin + ', Paris, France')
    + '&destination=' + encodeURIComponent(destination + ', Paris, France')
    + '&travelmode=' + travelmode
  );
}

// =========================================================================
// 6. SHAREABLE URL-HASH PROGRESS SYNC (FOR ALL 4 FRIENDS!)
// =========================================================================
export function encodeProgressHash() {
  let vMask = 0;
  ITINERARY_STOPS.forEach((s, i) => { if (state.visited.has(s.id)) vMask |= (1 << i); });
  let bMask = 0;
  BOOKINGS_DATA.forEach((b, i) => { if (state.bookings[b.id]) bMask |= (1 << i); });
  let pMask = 0;
  PHOTO_SPOTS.forEach((p, i) => { if (state.photos[p.id]) pMask |= (1 << i); });
  return `#sync=v3.${vMask.toString(36)}.${bMask.toString(36)}.${pMask.toString(36)}`;
}

export function hydrateFromUrlHash() {
  const hash = window.location.hash || '';
  const m = hash.match(/^#sync=v3\.([0-9a-z]+)\.([0-9a-z]+)\.([0-9a-z]+)$/i);
  if (!m) return false;
  const vMask = parseInt(m[1], 36);
  const bMask = parseInt(m[2], 36);
  const pMask = parseInt(m[3], 36);
  ITINERARY_STOPS.forEach((s, i) => { if (vMask & (1 << i)) state.visited.add(s.id); });
  BOOKINGS_DATA.forEach((b, i) => { if (bMask & (1 << i)) state.bookings[b.id] = true; });
  PHOTO_SPOTS.forEach((p, i) => { if (pMask & (1 << i)) state.photos[p.id] = true; });
  saveState();
  // Clean hash gently after importing so reloads don't overwrite future unchecks
  try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch (_) {}
  setTimeout(() => showToast('🤝 Συγχρονίστηκε η πρόοδος της παρέας!'), 700);
  return true;
}

export async function shareTripProgress(btnEl) {
  const url = `${window.location.origin}${window.location.pathname}${encodeProgressHash()}`;
  if (btnEl) triggerSquash(btnEl);
  try {
    if (navigator.share) {
      await navigator.share({
        title: 'Παρίσι 3D • Panos, Kostas, Iakovos & Imbrixis',
        text: `Πρόοδος ταξιδιού Παρισιού (${state.visited.size}/${ITINERARY_STOPS.length} στάσεις)!`,
        url,
      });
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
      spawnCelebrationBurst(window.innerWidth * 0.5, window.innerHeight * 0.25, 10);
      showToast('🔗 Αντιγράφηκε link συγχρονισμού για την παρέα!');
      return;
    }
  } catch (_) {}
  window.prompt('Αντιγράψτε το link συγχρονισμού για την παρέα:', url);
}

// =========================================================================
// 7. SERVICE WORKER REGISTRATION (OFFLINE PWA!)
// =========================================================================
export function registerOfflinePWA() {
  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}
