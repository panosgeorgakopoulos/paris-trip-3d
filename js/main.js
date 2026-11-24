// Application entry point: 3D scene initialization, 60fps render loop & bootstrap
import { TIME_PRESETS } from './config.js';
import { ctx, state, camCtrl, liveLight, prefersReducedMotion, showToast, updateCountdown, spawnCelebrationBurst } from './state.js';
import { buildSkyAndTerrain, buildSeineAndBridges } from './scene/environment.js';
import { buildRealParisRoadNetwork } from './scene/roads.js';
import { buildParksAndTrees } from './scene/parks.js';
import { buildClassicParisianHouses } from './scene/buildings.js';
import { buildParisLandmarks } from './scene/landmarks.js';
import { buildParisianPlaces } from './scene/places.js';
import { buildDayRoutes, buildSquad4Guys, applySquadPosition, sampleDayPath, buildStopMarkers, buildAtmosphereEffects } from './scene/squad.js';
import { buildTransitOverlay } from './scene/transit.js';
import { clampMapTarget, setupInteractionListeners, onWindowResize } from './controls.js';
import { updateProjectedLabels, bindUIEvents, renderItineraryList, renderBookings, renderPhotoSpots, applyDayVisibilityTo3D, setSidebarOpen, updateFollowButton, updatePlayButtonUI, selectStop } from './ui.js';
import { animateGpsBeacon, initParisWeather, updateCompassUI, updateLiveParisBanner, hydrateFromUrlHash, registerOfflinePWA } from './features.js';

function init3D() {
  const container = document.getElementById('canvas-container');
  ctx.scene = new THREE.Scene();
  ctx.scene.fog = new THREE.FogExp2(liveLight.fog.getHex(), liveLight.fogDensity);

  const w = container.clientWidth || window.innerWidth;
  const h = container.clientHeight || window.innerHeight;
  ctx.camera = new THREE.PerspectiveCamera(w < 640 ? 50 : 44, w / h, 0.5, 760);

  ctx.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  ctx.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  ctx.renderer.setSize(w, h);
  ctx.renderer.shadowMap.enabled = true;
  ctx.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  ctx.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  ctx.renderer.toneMappingExposure = 1.14;
  ctx.renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(ctx.renderer.domElement);

  ctx.clock = new THREE.Clock();

  // Rich Multi-Point Lighting Setup
  ctx.hemiLight = new THREE.HemisphereLight(liveLight.hemiSky, liveLight.hemiGround, liveLight.hemiInt);
  ctx.scene.add(ctx.hemiLight);

  ctx.dirLight = new THREE.DirectionalLight(liveLight.dirColor, liveLight.dirInt);
  ctx.dirLight.position.copy(liveLight.dirPos);
  ctx.dirLight.castShadow = true;
  ctx.dirLight.shadow.mapSize.width = window.innerWidth < 768 ? 1024 : 2048;
  ctx.dirLight.shadow.mapSize.height = window.innerWidth < 768 ? 1024 : 2048;
  ctx.dirLight.shadow.camera.near = 10;
  ctx.dirLight.shadow.camera.far = 340;
  const d = 132;
  ctx.dirLight.shadow.camera.left = -d;
  ctx.dirLight.shadow.camera.right = d;
  ctx.dirLight.shadow.camera.top = d;
  ctx.dirLight.shadow.camera.bottom = -d;
  ctx.dirLight.shadow.bias = -0.0005;
  ctx.scene.add(ctx.dirLight);

  ctx.fillLight = new THREE.DirectionalLight(0x6b92d6, 0.32);
  ctx.fillLight.position.set(-45, 25, -45);
  ctx.scene.add(ctx.fillLight);

  // Build Entire 3D Paris World (Seine first so roads, parks & houses respect exact riverbanks!)
  buildSkyAndTerrain();
  buildSeineAndBridges();
  buildRealParisRoadNetwork();
  buildParksAndTrees();
  buildClassicParisianHouses();
  buildParisLandmarks();
  buildParisianPlaces();
  buildDayRoutes();
  buildTransitOverlay();
  buildSquad4Guys();
  buildStopMarkers();
  buildAtmosphereEffects();
  setupInteractionListeners(container);

  window.addEventListener('resize', onWindowResize);
}


function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(ctx.clock.getDelta(), 0.05);
  const elapsed = ctx.clock.getElapsedTime();

  // 1. Advance 4-Guys Squad along Real Paris Roads when Playing!
  if (state.squadPlaying) {
    const baseRate = 0.0155; // ~64s full day at 1x, 32s at 2x, 16s at 4x
    state.squadProgress += dt * baseRate * state.squadSpeed;
    if (state.squadProgress >= 1) {
      const finishedDay = state.squadDay;
      // Peak-End Rule: Champagne Gold Celebration at the end of every full day's Paris walk!
      spawnCelebrationBurst(window.innerWidth * 0.5, window.innerHeight * 0.38, finishedDay === 3 ? 28 : 16);
      if (state.activeDay === 'all') {
        state.squadDay = state.squadDay >= 3 ? 1 : state.squadDay + 1;
        state.squadProgress = 0;
        showToast(finishedDay === 3
          ? '🎉 Τέλος ταξιδιού στη Sacré-Cœur! Panos, Kostas, Iakovos & Imbrixis — Μαγικό Παρίσι! 🇫🇷✨'
          : `🎉 Τέλος Μέρας ${finishedDay}! Η παρέα ξεκινά τη Μέρα ${state.squadDay}!`);
      } else {
        state.squadProgress = 0;
        showToast(`🎉 Ολοκληρώθηκε η Μέρα ${finishedDay}! Επανάληψη διαδρομής...`);
      }
    }
  }
  applySquadPosition(dt, elapsed);

  // 2. Smooth Camera Interpolation + Google Maps Inertia + Map Rubber Banding + Parabolic Arcs!
  if (camCtrl.autoOrbit) {
    camCtrl.desiredTheta += dt * 0.045;
  }
  if (camCtrl.isDragging) {
    // Interruptible Motion: any user touch/drag immediately cancels an active fly-to arc
    camCtrl.arc = null;
  } else {
    if (Math.abs(camCtrl.panVelX || 0) > 0.02 || Math.abs(camCtrl.panVelZ || 0) > 0.02) {
      camCtrl.desiredTarget.x += camCtrl.panVelX * dt;
      camCtrl.desiredTarget.z += camCtrl.panVelZ * dt;
      clampMapTarget(camCtrl.desiredTarget, true);
      const friction = Math.exp(-dt * 5.2);
      camCtrl.panVelX *= friction;
      camCtrl.panVelZ *= friction;
    }
    // Smooth Rubber-Band Snap-Back if dragged past Paris outer boundaries!
    const snapDamp = 1 - Math.exp(-dt * 9.0);
    if (camCtrl.desiredTarget.x < -150) camCtrl.desiredTarget.x += (-150 - camCtrl.desiredTarget.x) * snapDamp;
    else if (camCtrl.desiredTarget.x > 110) camCtrl.desiredTarget.x += (110 - camCtrl.desiredTarget.x) * snapDamp;
    if (camCtrl.desiredTarget.z < -105) camCtrl.desiredTarget.z += (-105 - camCtrl.desiredTarget.z) * snapDamp;
    else if (camCtrl.desiredTarget.z > 100) camCtrl.desiredTarget.z += (100 - camCtrl.desiredTarget.z) * snapDamp;
  }

  const damp = 1 - Math.exp(-dt * (camCtrl.isDragging ? 14.5 : 6.2));
  camCtrl.target.lerp(camCtrl.desiredTarget, damp);
  camCtrl.theta += (camCtrl.desiredTheta - camCtrl.theta) * damp;
  camCtrl.phi += (camCtrl.desiredPhi - camCtrl.phi) * damp;
  camCtrl.radius += (camCtrl.desiredRadius - camCtrl.radius) * damp;

  // Parabolic Altitude Arc Boost during long cross-city flights
  let arcBoost = 0;
  if (camCtrl.arc) {
    camCtrl.arc.t += dt / camCtrl.arc.dur;
    if (camCtrl.arc.t >= 1) {
      camCtrl.arc = null;
    } else {
      arcBoost = Math.sin(camCtrl.arc.t * Math.PI) * camCtrl.arc.lift;
    }
  }

  // Smart Mobile Optical Offset: lifts the focused building into the unobstructed upper viewport above the bottom card!
  const vw = window.innerWidth, vh = window.innerHeight;
  const cardEl = document.getElementById('stop-card');
  const cardVisibleMobile = vw < 768 && cardEl && !cardEl.classList.contains('stop-card-hidden');
  const desiredOffY = cardVisibleMobile ? Math.round(vh * (cardEl.classList.contains('is-expanded') ? 0.21 : 0.125)) : 0;
  camCtrl.viewOffsetY = (camCtrl.viewOffsetY || 0) + (desiredOffY - (camCtrl.viewOffsetY || 0)) * (1 - Math.exp(-dt * 8.5));
  if (Math.abs(camCtrl.viewOffsetY) > 0.8) {
    ctx.camera.setViewOffset(vw, vh, 0, Math.round(camCtrl.viewOffsetY), vw, vh);
  } else if (ctx.camera.view && ctx.camera.view.enabled) {
    ctx.camera.clearViewOffset();
  }

  const effRadius = camCtrl.radius + arcBoost;
  ctx.camera.position.set(
    camCtrl.target.x + effRadius * Math.sin(camCtrl.phi) * Math.sin(camCtrl.theta),
    camCtrl.target.y + effRadius * Math.cos(camCtrl.phi) + arcBoost * 0.35,
    camCtrl.target.z + effRadius * Math.sin(camCtrl.phi) * Math.cos(camCtrl.theta)
  );
  ctx.camera.lookAt(camCtrl.target);

  // 3. Smooth Dynamic Sky & Lighting Transition
  const preset = TIME_PRESETS[state.currentResolvedTime] || TIME_PRESETS.dusk;
  const lDamp = 1 - Math.exp(-dt * 2.5);

  liveLight.skyTop.lerp(preset.skyTop, lDamp);
  liveLight.skyHorizon.lerp(preset.skyHorizon, lDamp);
  liveLight.fog.lerp(preset.fog, lDamp);
  liveLight.fogDensity += (preset.fogDensity - liveLight.fogDensity) * lDamp;
  liveLight.hemiSky.lerp(preset.hemiSky, lDamp);
  liveLight.hemiGround.lerp(preset.hemiGround, lDamp);
  liveLight.hemiInt += (preset.hemiInt - liveLight.hemiInt) * lDamp;
  liveLight.dirColor.lerp(preset.dirColor, lDamp);
  liveLight.dirInt += (preset.dirInt - liveLight.dirInt) * lDamp;
  liveLight.dirPos.lerp(preset.dirPos, lDamp);
  liveLight.windowGlow += (preset.windowGlow - liveLight.windowGlow) * lDamp;
  liveLight.starOpacity += (preset.starOpacity - liveLight.starOpacity) * lDamp;
  liveLight.beaconOpacity += (preset.beaconOpacity - liveLight.beaconOpacity) * lDamp;
  liveLight.monumentEmissive += (preset.monumentEmissive - liveLight.monumentEmissive) * lDamp;

  if (ctx.skyUniforms) {
    ctx.skyUniforms.topColor.value.copy(liveLight.skyTop);
    ctx.skyUniforms.horizonColor.value.copy(liveLight.skyHorizon);
    ctx.skyUniforms.uFogColor.value.copy(liveLight.fog);
    ctx.skyUniforms.uSunDir.value.copy(liveLight.dirPos).normalize();
    ctx.skyUniforms.uSunColor.value.copy(liveLight.dirColor);
    ctx.skyUniforms.uNightFactor.value = liveLight.starOpacity;
    if (!prefersReducedMotion) ctx.skyUniforms.uTime.value = elapsed;
  }
  ctx.scene.fog.color.copy(liveLight.fog);
  ctx.scene.fog.density = liveLight.fogDensity;
  ctx.hemiLight.color.copy(liveLight.hemiSky);
  ctx.hemiLight.groundColor.copy(liveLight.hemiGround);
  ctx.hemiLight.intensity = liveLight.hemiInt;
  ctx.dirLight.color.copy(liveLight.dirColor);
  ctx.dirLight.intensity = liveLight.dirInt;
  ctx.dirLight.position.copy(liveLight.dirPos);

  if (ctx.haussmannMat) ctx.haussmannMat.emissiveIntensity = liveLight.windowGlow;
  if (ctx.starField) ctx.starField.material.opacity = liveLight.starOpacity;
  if (ctx.beaconMesh) ctx.beaconMesh.material.opacity = liveLight.beaconOpacity;
  if (ctx.eiffelLight) ctx.eiffelLight.intensity = 0.65 + liveLight.monumentEmissive * 1.9;
  ctx.monumentGlowMaterials.forEach((m) => {
    m.emissiveIntensity = 0.22 + liveLight.monumentEmissive * 0.68;
  });

  // 4. Realistic Running Seine Water Shader + Bateaux Mouches Live Wake
  if (ctx.bateauxBoat && ctx.seineCurve) {
    const bt = (elapsed * 0.015) % 1;
    const pos = ctx.seineCurve.getPoint(bt);
    const next = ctx.seineCurve.getPoint((bt + 0.01) % 1);
    ctx.bateauxBoat.position.set(pos.x, 0.14 + Math.sin(elapsed * 2.6) * 0.018, pos.z);
    ctx.bateauxBoat.lookAt(next.x, 0.14, next.z);
    if (ctx.seineUniforms) {
      ctx.seineUniforms.uBoatPos.value.copy(ctx.bateauxBoat.position);
      ctx.seineUniforms.uBoatDir.value.copy(next).sub(pos).normalize();
    }
  }
  if (ctx.seineUniforms) {
    if (!prefersReducedMotion) ctx.seineUniforms.uTime.value = elapsed;
    ctx.seineUniforms.uSunDir.value.copy(liveLight.dirPos).normalize();
    ctx.seineUniforms.uSunColor.value.copy(liveLight.dirColor);
    ctx.seineUniforms.uSkyTop.value.copy(liveLight.skyTop);
    ctx.seineUniforms.uSkyHorizon.value.copy(liveLight.skyHorizon);
    ctx.seineUniforms.uFogColor.value.copy(liveLight.fog);
    ctx.seineUniforms.uFogDensity.value = liveLight.fogDensity;
    ctx.seineUniforms.uNightGlow.value = liveLight.windowGlow;
  }

  // 5. Eiffel Searchlight & Smooth Scintillement Sparkle (<3Hz safe shimmer)
  if (ctx.beaconPivot && !prefersReducedMotion) {
    ctx.beaconPivot.rotation.y = elapsed * 0.58;
  }
  if (ctx.eiffelSparkles) {
    const isSparkling = Date.now() < state.sparkleUntil;
    const btnSp = document.getElementById('btn-eiffel-sparkle');
    if (isSparkling) {
      ctx.eiffelSparkles.material.opacity = 0.85;
      const cols = ctx.eiffelSparkles.geometry.attributes.color.array;
      const phases = ctx.eiffelSparkles.geometry.userData.phases;
      for (let i = 0; i < phases.length; i++) {
        const tw = 0.45 + 0.55 * Math.sin(elapsed * 5.2 + phases[i]);
        cols[i * 3] = tw;
        cols[i * 3 + 1] = tw * 0.92;
        cols[i * 3 + 2] = tw * 0.68;
      }
      ctx.eiffelSparkles.geometry.attributes.color.needsUpdate = true;
      if (btnSp && !btnSp.classList.contains('sparkling-active')) btnSp.classList.add('sparkling-active');
    } else {
      ctx.eiffelSparkles.material.opacity = Math.max(0, ctx.eiffelSparkles.material.opacity - dt * 1.3);
      if (btnSp && btnSp.classList.contains('sparkling-active')) btnSp.classList.remove('sparkling-active');
    }
  }

  // 6. Moulin Rouge Windmill, Home Beacon & December Paris Christmas Decor Animations!
  if (ctx.moulinSails && !prefersReducedMotion) ctx.moulinSails.rotation.z = -elapsed * 0.82;
  if (ctx.tuileriesWheel && !prefersReducedMotion) ctx.tuileriesWheel.rotation.z = elapsed * 0.24;
  if (ctx.lafayetteTreeStar && !prefersReducedMotion) ctx.lafayetteTreeStar.rotation.y = elapsed * 1.4;
  if (ctx.xmasLightMat) {
    const nightBoost = 0.45 + liveLight.windowGlow * 0.95;
    ctx.xmasLightMat.emissiveIntensity = nightBoost + (prefersReducedMotion ? 0 : Math.sin(elapsed * 2.8) * 0.14);
  }
  if (ctx.homeBeacon) {
    ctx.homeBeacon.rotation.y = elapsed * 1.0;
    ctx.homeBeacon.position.y = 3.55 + Math.sin(elapsed * 2.2) * 0.22;
  }

  // 7. Route Light Pulses along exact street curves
  ctx.routePulses.forEach((p) => {
    const t = (elapsed * p.speed + p.offset) % 1;
    const s = sampleDayPath(p.day, t);
    if (s) p.mesh.position.set(s.x, s.y + 0.25, s.z);
  });

  // 8. Stop Pin Pulse
  ctx.stopPins.forEach((pin, idx) => {
    const sel = pin.id === state.selectedStopId;
    const pulse = 1 + Math.sin(elapsed * 3.0 + idx) * (sel ? 0.3 : 0.12);
    pin.ring.scale.set(pulse, pulse, 1);
    pin.sphere.position.y = 1.65 + Math.sin(elapsed * 2.2 + idx) * 0.12;
    const sc = sel ? 1.42 : 1.0;
    pin.sphere.scale.lerp(new THREE.Vector3(sc, sc, sc), 0.14);
  });

  // 9. Winter Snowfall
  if (ctx.snowPoints) {
    ctx.snowPoints.visible = state.snowEnabled;
    if (state.snowEnabled) {
      const arr = ctx.snowPoints.geometry.attributes.position.array;
      const sp = ctx.snowPoints.geometry.userData.speeds;
      for (let i = 0; i < sp.length; i++) {
        arr[i * 3 + 1] -= sp[i];
        arr[i * 3] += Math.sin(elapsed * 0.6 + i) * 0.01;
        if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] = 43;
      }
      ctx.snowPoints.geometry.attributes.position.needsUpdate = true;
    }
  }

  animateGpsBeacon(elapsed);
  updateCompassUI();
  updateProjectedLabels();
  ctx.renderer.render(ctx.scene, ctx.camera);
}


window.addEventListener('load', () => {
  try {
    const bar = document.getElementById('loader-bar');
    if (bar) bar.style.width = '70%';

    init3D();
    hydrateFromUrlHash();
    bindUIEvents();
    renderItineraryList();
    renderBookings();
    renderPhotoSpots();
    applyDayVisibilityTo3D();
    setSidebarOpen(state.sidebarOpen);
    updateFollowButton();
    updatePlayButtonUI();
    updateCountdown();
    updateLiveParisBanner((id) => selectStop(id, true));
    initParisWeather();
    registerOfflinePWA();
    setInterval(updateCountdown, 30000);
    setInterval(() => updateLiveParisBanner((id) => selectStop(id, true)), 60000);

    animate();

    if (bar) bar.style.width = '100%';
    setTimeout(() => {
      const loader = document.getElementById('intro-loader');
      if (loader) loader.classList.add('hidden-loader');
    }, 420);
  } catch (err) {
    console.error('Paris 3D init error:', err);
    const loader = document.getElementById('intro-loader');
    if (loader) {
      const errMsg = (err && err.message) ? String(err.message) : String(err || 'Unknown error');
      const isWebGL = /webgl|context|canvas|gpu/i.test(errMsg);
      const safeErr = errMsg.replace(/[<>&"']/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[ch]));
      loader.innerHTML = `
        <div class="text-center px-6 max-w-md space-y-3">
          <h2 class="font-serif text-3xl text-champagne">Paris 3D</h2>
          <p class="text-sm text-ivory/85 leading-relaxed">${isWebGL
            ? 'Δεν ήταν δυνατή η εκκίνηση του WebGL σε αυτή τη συσκευή. Ελέγξτε ότι το hardware acceleration είναι ενεργό.'
            : 'Παρουσιάστηκε σφάλμα κατά τη φόρτωση της εφαρμογής (πιθανώς παλιά cache).'}</p>
          <p class="text-[11px] font-mono text-roseParis/90 bg-white/5 border border-white/10 rounded-xl px-3 py-2 break-words">${safeErr}</p>
          <button id="btn-clear-cache-reload" type="button"
            class="px-4 py-2.5 rounded-2xl bg-champagne text-midnight font-bold text-xs shadow-lg active:scale-95 transition-all">
            🔄 Καθαρισμός Cache &amp; Επαναφόρτωση
          </button>
        </div>
      `;
      const btn = document.getElementById('btn-clear-cache-reload');
      if (btn) {
        btn.addEventListener('click', async () => {
          try {
            if ('serviceWorker' in navigator) {
              const regs = await navigator.serviceWorker.getRegistrations();
              await Promise.all(regs.map((r) => r.unregister()));
            }
            if ('caches' in window) {
              const keys = await caches.keys();
              await Promise.all(keys.map((k) => caches.delete(k)));
            }
          } catch (_) {}
          window.location.reload();
        });
      }
    }
  }
});
