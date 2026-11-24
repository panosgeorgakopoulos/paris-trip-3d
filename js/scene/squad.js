// 3-day street routes, 4 animated friends (Panos, Kostas, Iakovos, Imbrixis), stop markers & snow/stars
import { getTerrainY, P, DAY_META, ITINERARY_STOPS, DAY_ROUTES_DATA } from '../config.js';
import { ctx, state, camCtrl, showToast, spawnTapRipple } from '../state.js';
import { createCircleTexture } from '../textures.js';
import { flyCameraTo, focusHomeApartment } from '../controls.js';
import { selectStop, hideStopCard, updateFollowButton, triggerEiffelSparkle } from '../ui.js';

export function compileDayPath(dayNum) {
  const legs = DAY_ROUTES_DATA[dayNum];
  const segments = [];
  let totalDist = 0;

  legs.forEach((leg) => {
    for (let i = 0; i < leg.pts.length - 1; i++) {
      const [ax, az] = leg.pts[i];
      const [bx, bz] = leg.pts[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      if (len < 0.01) continue;
      // Transit modes move faster visually along long avenues
      const speedFactor = leg.mode === 'walk' ? 1.0 : 0.42;
      const weightedLen = len * speedFactor;
      segments.push({
        ax, az, bx, bz,
        startDist: totalDist,
        endDist: totalDist + weightedLen,
        weightedLen,
        mode: leg.mode,
        label: leg.label,
        clock: leg.clock,
        timeOfDay: leg.timeOfDay,
        stopId: leg.stopId,
        sparkleTrigger: !!leg.sparkleTrigger,
      });
      totalDist += weightedLen;
    }
  });

  // Build smooth 3D point list following exact real roads
  const points3D = [];
  legs.forEach((leg, lIdx) => {
    leg.pts.forEach(([px, pz], pIdx) => {
      if (lIdx > 0 && pIdx === 0) return;
      const y = getTerrainY(px, pz) + 0.36;
      points3D.push(new THREE.Vector3(px, y, pz));
    });
  });

  return { segments, totalDist, points3D };
}

export function sampleDayPath(dayNum, progress01) {
  const path = ctx.compiledDayPaths[dayNum];
  if (!path || !path.segments.length) return null;
  const clamped = Math.max(0, Math.min(1, progress01));
  const targetDist = clamped * path.totalDist;

  let seg = path.segments[path.segments.length - 1];
  for (let i = 0; i < path.segments.length; i++) {
    if (targetDist <= path.segments[i].endDist) {
      seg = path.segments[i];
      break;
    }
  }
  const localT = seg.weightedLen > 0 ? Math.max(0, Math.min(1, (targetDist - seg.startDist) / seg.weightedLen)) : 0;
  const x = seg.ax + (seg.bx - seg.ax) * localT;
  const z = seg.az + (seg.bz - seg.az) * localT;
  const y = getTerrainY(x, z) + 0.12;
  const heading = Math.atan2(seg.bx - seg.ax, seg.bz - seg.az);

  return {
    x, y, z, heading,
    mode: seg.mode,
    label: seg.label,
    clock: seg.clock,
    timeOfDay: seg.timeOfDay,
    stopId: seg.stopId,
    sparkleTrigger: seg.sparkleTrigger,
  };
}

export function buildDayRoutes() {
  [1, 2, 3].forEach((dayNum) => {
    const compiled = compileDayPath(dayNum);
    ctx.compiledDayPaths[dayNum] = compiled;

    const color = DAY_META[dayNum].colorInt;
    const group = new THREE.Group();

    // Piecewise linear CurvePath so the glowing route hugs EVERY real street corner!
    const curvePath = new THREE.CurvePath();
    for (let i = 0; i < compiled.points3D.length - 1; i++) {
      curvePath.add(new THREE.LineCurve3(compiled.points3D[i], compiled.points3D[i + 1]));
    }

    const coreGeo = new THREE.TubeGeometry(curvePath, 220, 0.12, 6, false);
    const coreMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.86,
    });
    group.add(new THREE.Mesh(coreGeo, coreMat));

    const haloGeo = new THREE.TubeGeometry(curvePath, 220, 0.28, 6, false);
    const haloMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    group.add(new THREE.Mesh(haloGeo, haloMat));

    // Animated directional light pulses along real streets
    const pulseCount = 4;
    for (let p = 0; p < pulseCount; p++) {
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 8, 8),
        new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      orb.add(halo);
      group.add(orb);
      ctx.routePulses.push({
        mesh: orb,
        day: dayNum,
        offset: p / pulseCount,
        speed: 0.036,
      });
    }

    group.userData = { coreMat, haloMat };
    ctx.routeGroups[dayNum] = group;
    ctx.scene.add(group);
  });
}

// -----------------------------------------------------------------------
// H. THE 4 GUYS ANIMATED SQUAD + PARIS TRANSIT VEHICLES (METRO / SHUTTLE / TAXI)

export function buildSquad4Guys() {
  ctx.squadRoot = new THREE.Group();

  // Subtle Glowing Emerald-Champagne Squad Aura Ring beneath their feet
  ctx.squadAuraRing = new THREE.Mesh(
    new THREE.RingGeometry(0.72, 1.05, 28),
    new THREE.MeshBasicMaterial({
      color: 0x4ade9a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.82,
    })
  );
  ctx.squadAuraRing.rotation.x = -Math.PI / 2;
  ctx.squadAuraRing.position.y = 0.09;
  ctx.squadRoot.add(ctx.squadAuraRing);

  // Soft PointLight so the 4 friends illuminate Parisian streets at night!
  const squadLight = new THREE.PointLight(0xffe4a8, 1.15, 7.5);
  squadLight.position.set(0, 1.6, 0);
  ctx.squadRoot.add(squadLight);

  // 4 Friends: Panos, Kostas, Iakovos, Imbrixis — distinct Parisian winter coats, scarves & staggered squad formation!
  const friendStyles = [
    { name: 'Panos', dotHex: '#f4c668', coat: 0x1e3a5f, scarf: 0xf4c668, pants: 0x1b202b, hat: 0x263248, ox: -0.42, oz: 0.32, phase: 0.0 },
    { name: 'Kostas', dotHex: '#f26d85', coat: 0xc2935b, scarf: 0xc92a42, pants: 0x242834, hat: 0x2c1f18, ox: 0.42, oz: 0.22, phase: 1.4 },
    { name: 'Iakovos', dotHex: '#4ade9a', coat: 0x2c5943, scarf: 0x4ade9a, pants: 0x1d2430, hat: 0x1d3557, ox: -0.34, oz: -0.38, phase: 2.8 },
    { name: 'Imbrixis', dotHex: '#5cc2ff', coat: 0x3b4254, scarf: 0x5cc2ff, pants: 0x21242e, hat: 0x4a3525, ox: 0.38, oz: -0.44, phase: 4.1 },
  ];

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf1c7a5, roughness: 0.65 });

  friendStyles.forEach((st, fIdx) => {
    const guy = new THREE.Group();
    const coatMat = new THREE.MeshStandardMaterial({ color: st.coat, roughness: 0.72 });
    const scarfMat = new THREE.MeshStandardMaterial({ color: st.scarf, emissive: st.scarf, emissiveIntensity: 0.25, roughness: 0.55 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: st.pants, roughness: 0.8 });
    const hatMat = new THREE.MeshStandardMaterial({ color: st.hat, roughness: 0.75 });

    // Articulated Legs (pivoting at hips)
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.08, 0.36, 0);
    const llMesh = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.36, 0.12), pantsMat);
    llMesh.position.y = -0.18;
    leftLeg.add(llMesh);
    guy.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.08, 0.36, 0);
    const rlMesh = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.36, 0.12), pantsMat);
    rlMesh.position.y = -0.18;
    rightLeg.add(rlMesh);
    guy.add(rightLeg);

    // Winter Coat Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.2), coatMat);
    torso.position.y = 0.57;
    torso.castShadow = true;
    guy.add(torso);

    // Winter Scarf Collar
    const scarf = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.09, 8), scarfMat);
    scarf.position.y = 0.81;
    guy.add(scarf);

    // Articulated Arms (pivoting at shoulders)
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.21, 0.74, 0);
    const laMesh = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.32, 0.1), coatMat);
    laMesh.position.y = -0.15;
    leftArm.add(laMesh);
    guy.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.21, 0.74, 0);
    const raMesh = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.32, 0.1), coatMat);
    raMesh.position.y = -0.15;
    rightArm.add(raMesh);
    guy.add(rightArm);

    // Head & Winter Beanie/Hair
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.145, 10, 8), skinMat);
    head.position.y = 0.96;
    guy.add(head);
    const hat = new THREE.Mesh(new THREE.SphereGeometry(0.152, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.56), hatMat);
    hat.position.y = 0.98;
    guy.add(hat);

    guy.position.set(st.ox, 0, st.oz);
    guy.scale.set(1.08, 1.08, 1.08);
    ctx.squadRoot.add(guy);

    // Individual 3D floating name tag (Panos, Kostas, Iakovos, Imbrixis) shown when zoomed in!
    const friendLabelEntry = {
      id: `friend-${fIdx}`,
      label: st.name,
      dotHex: st.dotHex,
      pos: new THREE.Vector3(P.home[0] + st.ox, 1.45, P.home[1] + st.oz),
      isFriend: true,
      isSquad: false,
      isHome: false,
      isStop: false,
      day: 'all',
    };
    ctx.landmarkLabelEntries.push(friendLabelEntry);

    ctx.squadGuys.push({ name: st.name, group: guy, leftLeg, rightLeg, leftArm, rightArm, phase: st.phase, labelEntry: friendLabelEntry });
  });

  // Vehicle 1: Paris RATP Métro / RER Train Car
  const metro = new THREE.Group();
  const mBody = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.72, 2.25), new THREE.MeshStandardMaterial({ color: 0xf4f7fa, roughness: 0.3 }));
  mBody.position.y = 0.45;
  metro.add(mBody);
  const mStripe = new THREE.Mesh(new THREE.BoxGeometry(0.91, 0.18, 2.26), new THREE.MeshStandardMaterial({ color: 0x00a88f, emissive: 0x007a68, emissiveIntensity: 0.4 }));
  mStripe.position.y = 0.3;
  metro.add(mStripe);
  const mWin = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.24, 1.8), new THREE.MeshBasicMaterial({ color: 0xffe49e }));
  mWin.position.y = 0.58;
  metro.add(mWin);
  metro.visible = false;
  ctx.squadRoot.add(metro);
  ctx.squadVehicles.metro = metro;

  // Vehicle 2: Fondation Louis Vuitton Electric Shuttle Bus
  const shuttle = new THREE.Group();
  const sBody = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.75, 1.95), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 }));
  sBody.position.y = 0.46;
  shuttle.add(sBody);
  const sWin = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.34, 1.65), new THREE.MeshBasicMaterial({ color: 0x9be2ff }));
  sWin.position.y = 0.58;
  shuttle.add(sWin);
  shuttle.visible = false;
  ctx.squadRoot.add(shuttle);
  ctx.squadVehicles.shuttle = shuttle;

  // Vehicle 3: Parisian Taxi with Illuminated Roof Sign
  const taxi = new THREE.Group();
  const tBody = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.34, 1.45), new THREE.MeshStandardMaterial({ color: 0x1c2538, roughness: 0.35, metalness: 0.5 }));
  tBody.position.y = 0.26;
  taxi.add(tBody);
  const tCab = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.28, 0.82), new THREE.MeshStandardMaterial({ color: 0x8cc9ff, emissive: 0x3b6fa0, emissiveIntensity: 0.4 }));
  tCab.position.y = 0.52;
  taxi.add(tCab);
  const tSign = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.14), new THREE.MeshBasicMaterial({ color: 0x4ade9a }));
  tSign.position.y = 0.72;
  taxi.add(tSign);
  taxi.visible = false;
  ctx.squadRoot.add(taxi);
  ctx.squadVehicles.taxi = taxi;

  // Place initial squad right outside 3 Rue Saint-Hyacinthe!
  ctx.squadRoot.position.set(P.home[0], 0.12, P.home[1]);
  ctx.scene.add(ctx.squadRoot);

  // Floating Squad Tag Label
  ctx.squadLabelEntry = {
    id: 'squad-4-guys',
    label: '👥 Panos, Kostas, Iakovos & Imbrixis',
    pos: new THREE.Vector3(P.home[0], 2.1, P.home[1]),
    isSquad: true,
    isHome: false,
    isStop: false,
    day: 'all',
  };
  ctx.landmarkLabelEntries.push(ctx.squadLabelEntry);
}

// Position and animate the 4 guys along the exact street route
const friendWorldPos = new THREE.Vector3();
export function applySquadPosition(dt, elapsed) {
  const sample = sampleDayPath(state.squadDay, state.squadProgress);
  if (!sample || !ctx.squadRoot) return;

  ctx.squadRoot.position.set(sample.x, sample.y, sample.z);

  // Smooth heading rotation around street corners
  let hDiff = sample.heading - ctx.squadRoot.rotation.y;
  while (hDiff > Math.PI) hDiff -= Math.PI * 2;
  while (hDiff < -Math.PI) hDiff += Math.PI * 2;
  ctx.squadRoot.rotation.y += hDiff * Math.min(1, dt * 10);

  const isWalking = sample.mode === 'walk';
  ctx.squadRoot.updateMatrixWorld(true);
  ctx.squadGuys.forEach((g) => {
    g.group.visible = isWalking;
    if (isWalking) {
      if (state.squadPlaying) {
        const walkCycle = elapsed * (8.5 + state.squadSpeed * 2.2) + g.phase;
        const swing = Math.sin(walkCycle) * 0.65;
        g.leftLeg.rotation.x = swing;
        g.rightLeg.rotation.x = -swing;
        g.leftArm.rotation.x = -swing * 0.75;
        g.rightArm.rotation.x = swing * 0.75;
        g.group.position.y = Math.abs(Math.cos(walkCycle)) * 0.08;
      } else {
        g.leftLeg.rotation.x *= 0.85;
        g.rightLeg.rotation.x *= 0.85;
        g.leftArm.rotation.x *= 0.85;
        g.rightArm.rotation.x *= 0.85;
        g.group.position.y *= 0.85;
      }
      if (g.labelEntry) {
        g.group.getWorldPosition(friendWorldPos);
        g.labelEntry.pos.set(friendWorldPos.x, friendWorldPos.y + 1.38, friendWorldPos.z);
      }
    }
  });

  // Show appropriate transit vehicle on Metro/Shuttle/Taxi segments!
  ctx.squadVehicles.metro.visible = sample.mode === 'metro';
  ctx.squadVehicles.shuttle.visible = sample.mode === 'shuttle';
  ctx.squadVehicles.taxi.visible = sample.mode === 'taxi';

  // Gentle aura pulse
  if (ctx.squadAuraRing) {
    const s = 1 + Math.sin(elapsed * 3.5) * 0.14;
    ctx.squadAuraRing.scale.set(s, s, 1);
  }

  // Sync floating squad label
  if (ctx.squadLabelEntry) {
    ctx.squadLabelEntry.pos.set(sample.x, sample.y + 2.05, sample.z);
  }

  // Update Live Bottom Dock HUD
  const modeEl = document.getElementById('squad-mode-badge');
  const clockEl = document.getElementById('squad-clock');
  const streetEl = document.getElementById('squad-street-text');
  const dayPill = document.getElementById('squad-day-pill');
  const pctEl = document.getElementById('squad-pct');
  const scrub = document.getElementById('squad-scrubber');

  const modeMap = {
    walk: { text: '🚶 Περπάτημα', cls: 'bg-emeraldParis/20 text-emeraldParis border-emeraldParis/35' },
    metro: { text: '🚇 Μετρό / RER', cls: 'bg-sapphire/20 text-sapphire border-sapphire/40' },
    shuttle: { text: '🚌 FLV Shuttle', cls: 'bg-champagne/20 text-champagne border-champagne/45' },
    taxi: { text: '🚕 Ταξί / Uber', cls: 'bg-roseParis/20 text-roseParis border-roseParis/40' },
  };
  const mInfo = modeMap[sample.mode] || modeMap.walk;
  if (modeEl) {
    modeEl.textContent = mInfo.text;
    modeEl.className = `text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${mInfo.cls}`;
  }
  if (clockEl) clockEl.textContent = sample.clock;
  if (streetEl) streetEl.textContent = sample.label;
  if (dayPill) dayPill.textContent = `Μέρα ${state.squadDay}`;
  if (pctEl) pctEl.textContent = `${Math.round(state.squadProgress * 100)}%`;
  if (scrub && document.activeElement !== scrub) {
    scrub.value = String(Math.round(state.squadProgress * 1000));
  }

  // Sync Auto Time-of-Day & Eiffel Sparkle when playing!
  if (state.squadPlaying) {
    if (state.timeMode === 'auto') {
      state.currentResolvedTime = sample.timeOfDay;
    }
    if (sample.sparkleTrigger && Date.now() > state.sparkleUntil && Math.hypot(sample.x - P.eiffel[0], sample.z - P.eiffel[1]) < 6) {
      triggerEiffelSparkle(false);
    }
    if (state.squadFollowCam) {
      camCtrl.autoOrbit = false;
      camCtrl.desiredTarget.set(sample.x, sample.y + 1.1, sample.z);
      if (camCtrl.desiredRadius > 26) {
        camCtrl.desiredRadius = window.innerWidth < 768 ? 22 : 20;
      }
      if (camCtrl.desiredPhi < 0.72 || camCtrl.desiredPhi > 1.15) {
        camCtrl.desiredPhi = 0.92;
      }
    }
  }
}

// -----------------------------------------------------------------------
// I. INTERACTIVE 3D STOP MARKERS & PROJECTED LABELS
// -----------------------------------------------------------------------
export function buildStopMarkers() {
  const labelsLayer = document.getElementById('labels-layer');

  ITINERARY_STOPS.forEach((stop) => {
    const color = DAY_META[stop.day].colorInt;
    const group = new THREE.Group();
    const [x, y, z] = stop.pos;

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 1.55, 6),
      new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.75 })
    );
    stem.position.y = 0.78;
    group.add(stem);

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 14, 14),
      new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.88,
        roughness: 0.2,
      })
    );
    sphere.position.y = 1.65;
    sphere.userData.stopId = stop.id;
    group.add(sphere);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.44, 0.66, 22),
      new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide, transparent: true, opacity: 0.78 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.12;
    group.add(ring);

    group.position.set(x, y, z);
    ctx.scene.add(group);

    ctx.stopPins.push({
      id: stop.id,
      day: stop.day,
      group,
      ring,
      sphere,
    });

    const el = document.createElement('div');
    el.className = 'paris-label';
    el.dataset.stopId = stop.id;
    el.innerHTML = `
      <div class="paris-label-badge">
        <span style="width:7px;height:7px;border-radius:9999px;background:${DAY_META[stop.day].colorHex};display:inline-block;flex-shrink:0;"></span>
        <span>${stop.shortLabel}</span>
      </div>
    `;
    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      spawnTapRipple(ev.clientX, ev.clientY);
      selectStop(stop.id, true, { x: ev.clientX, y: ev.clientY });
    });
    labelsLayer.appendChild(el);

    ctx.landmarkLabelEntries.push({
      id: stop.id,
      label: stop.shortLabel,
      pos: new THREE.Vector3(x, y + 2.45, z),
      isHome: false,
      isSquad: false,
      isStop: true,
      day: stop.day,
      el,
    });
  });

  // Create HTML elements for special labels (Home, Squad, Individual Friends, Moulin Rouge)
  ctx.landmarkLabelEntries.forEach((entry) => {
    if (!entry.el) {
      const el = document.createElement('div');
      el.className = 'paris-label'
        + (entry.isHome ? ' is-home' : '')
        + (entry.isSquad ? ' is-squad' : '')
        + (entry.isFriend ? ' is-friend' : '');
      if (entry.isFriend) {
        el.innerHTML = `<div class="paris-label-badge"><span style="width:6px;height:6px;border-radius:9999px;background:${entry.dotHex};display:inline-block;flex-shrink:0;"></span><span>${entry.label}</span></div>`;
      } else {
        el.innerHTML = `<div class="paris-label-badge">${entry.label}</div>`;
      }
      if (entry.isHome) {
        el.addEventListener('click', (ev) => {
          ev.stopPropagation();
          focusHomeApartment();
        });
      } else if (entry.isSquad) {
        el.addEventListener('click', (ev) => {
          ev.stopPropagation();
          state.squadFollowCam = true;
          updateFollowButton();
          const s = sampleDayPath(state.squadDay, state.squadProgress);
          if (s) flyCameraTo(new THREE.Vector3(s.x, s.y + 1, s.z), new THREE.Vector3(-7, 9, 11));
          showToast('👥 Panos, Kostas, Iakovos & Imbrixis!');
        });
      } else if (entry.isPlace) {
        el.addEventListener('click', (ev) => {
          ev.stopPropagation();
          state.squadFollowCam = false;
          updateFollowButton();
          hideStopCard();
          flyCameraTo(
            new THREE.Vector3(entry.pos.x, Math.max(0.8, entry.pos.y - 1.1), entry.pos.z),
            new THREE.Vector3(-9, 10.5, 13.5)
          );
          showToast(`📍 ${entry.label}`);
        });
      }
      labelsLayer.appendChild(el);
      entry.el = el;
    }
  });
}

// -----------------------------------------------------------------------
// J. DECEMBER SNOW & STARFIELD DOME
// -----------------------------------------------------------------------
export function buildAtmosphereEffects() {
  const snowTex = createCircleTexture('rgba(255,255,255,0.95)', 'rgba(215,235,255,0.35)');
  const snowCount = window.innerWidth < 768 ? 550 : 900;
  const snowPos = new Float32Array(snowCount * 3);
  const snowSpd = new Float32Array(snowCount);
  for (let i = 0; i < snowCount; i++) {
    snowPos[i * 3] = (Math.random() - 0.5) * 290;
    snowPos[i * 3 + 1] = Math.random() * 68;
    snowPos[i * 3 + 2] = (Math.random() - 0.5) * 230;
    snowSpd[i] = 0.035 + Math.random() * 0.055;
  }
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
  snowGeo.userData.speeds = snowSpd;
  ctx.snowPoints = new THREE.Points(
    snowGeo,
    new THREE.PointsMaterial({ size: 0.65, map: snowTex, transparent: true, opacity: 0.78, depthWrite: false })
  );
  ctx.scene.add(ctx.snowPoints);

  // Starfield Dome
  const starCount = 750;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(0.14 + Math.random() * 0.86);
    const r = 340;
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.cos(phi);
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  ctx.starField = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ size: 2.1, map: snowTex, color: 0xfff3d4, transparent: true, opacity: 0.5, depthWrite: false })
  );
  ctx.scene.add(ctx.starField);
}

