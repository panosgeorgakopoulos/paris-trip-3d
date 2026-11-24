// Google Maps 3D finger navigation (pan + inertia + rubber banding, pinch/twist/tilt), mouse & camera flights
import { P } from './config.js';
import { ctx, state, camCtrl, prefersReducedMotion, showToast, spawnTapRipple } from './state.js';
import { selectStop, hideStopCard, updateFollowButton } from './ui.js';

export function clampMapTarget(vec, allowRubber = false) {
  const minX = -150, maxX = 110, minZ = -105, maxZ = 100;
  if (!allowRubber) {
    vec.x = Math.max(minX, Math.min(maxX, vec.x));
    vec.z = Math.max(minZ, Math.min(maxZ, vec.z));
    return;
  }
  // Rubber Banding: damped elastic pull up to ±16 units beyond Paris boundaries!
  const over = 16;
  vec.x = Math.max(minX - over, Math.min(maxX + over, vec.x));
  vec.z = Math.max(minZ - over, Math.min(maxZ + over, vec.z));
}

export function panGroundByPixels(dxPx, dyPx) {
  const vh = Math.max(300, window.innerHeight || 700);
  const fovRad = THREE.MathUtils.degToRad(ctx.camera ? ctx.camera.fov : 48);
  const unitsPerPx = (2 * camCtrl.radius * Math.tan(fovRad * 0.5)) / vh;
  const vertBoost = Math.min(2.6, 1 / Math.max(0.34, Math.cos(camCtrl.phi)));
  const sinT = Math.sin(camCtrl.theta), cosT = Math.cos(camCtrl.theta);
  const rightX = cosT, rightZ = -sinT;
  const fwdX = -sinT, fwdZ = -cosT;

  // Apply elastic resistance when pulling beyond Paris outer ring
  const outX = (camCtrl.desiredTarget.x < -150 || camCtrl.desiredTarget.x > 110) ? 0.28 : 1;
  const outZ = (camCtrl.desiredTarget.z < -105 || camCtrl.desiredTarget.z > 100) ? 0.28 : 1;
  const moveRight = -dxPx * unitsPerPx;
  const moveFwd = dyPx * unitsPerPx * vertBoost;
  const wx = (rightX * moveRight + fwdX * moveFwd) * outX;
  const wz = (rightZ * moveRight + fwdZ * moveFwd) * outZ;
  camCtrl.desiredTarget.x += wx;
  camCtrl.desiredTarget.z += wz;
  clampMapTarget(camCtrl.desiredTarget, true);
  return [wx, wz];
}

export function setupInteractionListeners(container) {
  camCtrl.panVelX = 0;
  camCtrl.panVelZ = 0;
  camCtrl.viewOffsetY = 0;

  // Disable right-click menu on 3D canvas so right-drag can smoothly pan on desktop
  container.addEventListener('contextmenu', (e) => e.preventDefault());

  let mouseMode = 'orbit';
  container.addEventListener('mousedown', (e) => {
    camCtrl.isDragging = true;
    camCtrl.dragMoved = false;
    camCtrl.autoOrbit = false;
    camCtrl.panVelX = 0;
    camCtrl.panVelZ = 0;
    mouseMode = (e.button === 2 || e.button === 1 || e.shiftKey) ? 'pan' : 'orbit';
    camCtrl.lastX = e.clientX;
    camCtrl.lastY = e.clientY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!camCtrl.isDragging) return;
    const dx = e.clientX - camCtrl.lastX;
    const dy = e.clientY - camCtrl.lastY;
    if (Math.hypot(dx, dy) > 4) {
      camCtrl.dragMoved = true;
      if (state.squadPlaying && state.squadFollowCam) {
        state.squadFollowCam = false;
        state.camFollowMode = 'free';
        updateFollowButton();
      }
    }
    if (mouseMode === 'pan') {
      panGroundByPixels(dx, dy);
    } else {
      camCtrl.desiredTheta -= dx * 0.0065;
      camCtrl.desiredPhi = Math.max(0.16, Math.min(1.44, camCtrl.desiredPhi - dy * 0.0055));
    }
    camCtrl.lastX = e.clientX;
    camCtrl.lastY = e.clientY;
  });

  window.addEventListener('mouseup', (e) => {
    if (camCtrl.isDragging && !camCtrl.dragMoved && e.button === 0) {
      handleCanvasClick(e.clientX, e.clientY);
    }
    camCtrl.isDragging = false;
  });

  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    camCtrl.autoOrbit = false;
    camCtrl.arc = null;
    const factor = Math.exp(e.deltaY * 0.0014);
    camCtrl.desiredRadius = Math.max(7.5, Math.min(220, camCtrl.desiredRadius * factor));
  }, { passive: false });

  // ---------------------------------------------------------------------
  // GOOGLE MAPS 3D FINGER NAVIGATION FOR IPHONE & MOBILE TOUCHSCREENS!
  // • 1-Finger Drag          -> Smooth Ground-Plane Pan + Inertia Glide
  // • 2-Finger Pinch         -> Multiplicative Zoom In/Out
  // • 2-Finger Twist         -> 3D Compass Rotate (Yaw)
  // • 2-Finger Swipe Up/Down -> Smooth 3D Tilt (2D Top-Down <-> 3D Street)
  // • Double-Tap             -> Smooth Zoom In toward Tapped Spot
  // • Double-Tap + Drag      -> One-Handed Google Maps Thumb Zoom!
  // ---------------------------------------------------------------------
  let lastMidX = 0, lastMidY = 0, lastAngle = 0;
  let lastF0Y = 0, lastF1Y = 0, lastMoveTime = 0;
  let lastTapTime = 0, lastTapX = 0, lastTapY = 0;
  let oneHandZoom = false;
  let twoFingerActive = false;

  function stopFollowOnGesture() {
    if (state.squadPlaying && state.squadFollowCam) {
      state.squadFollowCam = false;
      state.camFollowMode = 'free';
      updateFollowButton();
    }
  }

  container.addEventListener('touchstart', (e) => {
    camCtrl.autoOrbit = false;
    camCtrl.panVelX = 0;
    camCtrl.panVelZ = 0;

    if (e.touches.length === 1) {
      const t = e.touches[0];
      const now = performance.now();
      const isDoubleTap = (now - lastTapTime < 310) && Math.hypot(t.clientX - lastTapX, t.clientY - lastTapY) < 42;
      camCtrl.isDragging = true;
      camCtrl.dragMoved = false;
      twoFingerActive = false;
      oneHandZoom = isDoubleTap;
      camCtrl.lastX = t.clientX;
      camCtrl.lastY = t.clientY;
      lastMoveTime = now;
    } else if (e.touches.length === 2) {
      e.preventDefault();
      camCtrl.isDragging = false;
      oneHandZoom = false;
      twoFingerActive = true;
      const t0 = e.touches[0], t1 = e.touches[1];
      camCtrl.pinchDist = Math.max(10, Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY));
      lastAngle = Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX);
      lastMidX = (t0.clientX + t1.clientX) * 0.5;
      lastMidY = (t0.clientY + t1.clientY) * 0.5;
      lastF0Y = t0.clientY;
      lastF1Y = t1.clientY;
    }
  }, { passive: false });

  container.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Prevent iOS Safari rubber-band & page pinch-zoom!
    const now = performance.now();

    if (e.touches.length === 1 && camCtrl.isDragging && !twoFingerActive) {
      const t = e.touches[0];
      const dx = t.clientX - camCtrl.lastX;
      const dy = t.clientY - camCtrl.lastY;
      if (Math.hypot(dx, dy) > 4) {
        camCtrl.dragMoved = true;
        stopFollowOnGesture();
      }

      if (oneHandZoom) {
        // Google Maps One-Handed Double-Tap + Slide Down = Zoom IN, Slide Up = Zoom OUT!
        const zoomFactor = Math.exp(-dy * 0.0085);
        camCtrl.desiredRadius = Math.max(7.5, Math.min(220, camCtrl.desiredRadius * zoomFactor));
      } else {
        // 1-Finger Ground-Plane Pan + Track Velocity for Silky Inertia!
        const [wx, wz] = panGroundByPixels(dx, dy);
        const dtMs = Math.max(8, now - lastMoveTime);
        const instVx = (wx / dtMs) * 1000;
        const instVz = (wz / dtMs) * 1000;
        camCtrl.panVelX = camCtrl.panVelX * 0.45 + instVx * 0.55;
        camCtrl.panVelZ = camCtrl.panVelZ * 0.45 + instVz * 0.55;
      }
      camCtrl.lastX = t.clientX;
      camCtrl.lastY = t.clientY;
      lastMoveTime = now;
    } else if (e.touches.length === 2) {
      stopFollowOnGesture();
      const t0 = e.touches[0], t1 = e.touches[1];
      const dist = Math.max(10, Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY));
      const angle = Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX);
      const midX = (t0.clientX + t1.clientX) * 0.5;
      const midY = (t0.clientY + t1.clientY) * 0.5;

      const dDist = dist - camCtrl.pinchDist;
      let dAng = angle - lastAngle;
      if (dAng > Math.PI) dAng -= Math.PI * 2;
      if (dAng < -Math.PI) dAng += Math.PI * 2;

      const dMidX = midX - lastMidX;
      const dMidY = midY - lastMidY;
      const f0dy = t0.clientY - lastF0Y;
      const f1dy = t1.clientY - lastF1Y;

      // Detect Google Maps 2-finger parallel vertical tilt vs pinch/twist/pan
      const parallelVertical = (f0dy * f1dy > 0) && Math.abs(dMidY) > Math.abs(dMidX) * 1.25 && Math.abs(dDist) < 7 && Math.abs(dAng) < 0.045;
      if (parallelVertical) {
        // Swipe 2 fingers UP -> tilt toward dramatic 3D street angle; DOWN -> top-down map!
        camCtrl.desiredPhi = Math.max(0.14, Math.min(1.44, camCtrl.desiredPhi - dMidY * 0.0055));
      } else {
        // Simultaneous Google Maps Pinch-Zoom + Twist-Rotate + Gentle 2-Finger Pan!
        if (Math.abs(dDist) > 0.5) {
          const zoomScale = camCtrl.pinchDist / dist;
          camCtrl.desiredRadius = Math.max(7.5, Math.min(220, camCtrl.desiredRadius * zoomScale));
        }
        if (Math.abs(dAng) > 0.0035) {
          camCtrl.desiredTheta += dAng;
        }
        panGroundByPixels(dMidX * 0.85, dMidY * 0.85);
      }

      camCtrl.pinchDist = dist;
      lastAngle = angle;
      lastMidX = midX;
      lastMidY = midY;
      lastF0Y = t0.clientY;
      lastF1Y = t1.clientY;
    }
  }, { passive: false });

  container.addEventListener('touchend', (e) => {
    const now = performance.now();
    if (e.touches.length === 0) {
      if (camCtrl.isDragging && !camCtrl.dragMoved && !twoFingerActive && e.changedTouches.length === 1) {
        const t = e.changedTouches[0];
        if (oneHandZoom) {
          // Quick Double-Tap -> Origin-Aware Golden Ripple + Smooth Google Maps Zoom In!
          spawnTapRipple(t.clientX, t.clientY);
          camCtrl.arc = null;
          camCtrl.desiredRadius = Math.max(9.5, camCtrl.desiredRadius * 0.56);
          lastTapTime = 0;
        } else {
          lastTapTime = now;
          lastTapX = t.clientX;
          lastTapY = t.clientY;
          handleCanvasClick(t.clientX, t.clientY);
        }
      } else if (now - lastMoveTime > 95) {
        // Finger paused before lifting -> cancel inertia
        camCtrl.panVelX = 0;
        camCtrl.panVelZ = 0;
      }
      camCtrl.isDragging = false;
      oneHandZoom = false;
      twoFingerActive = false;
    } else if (e.touches.length === 1) {
      // Smoothly transition from 2 fingers back to 1 finger without jumping!
      twoFingerActive = false;
      camCtrl.isDragging = true;
      camCtrl.dragMoved = true;
      camCtrl.lastX = e.touches[0].clientX;
      camCtrl.lastY = e.touches[0].clientY;
      camCtrl.panVelX = 0;
      camCtrl.panVelZ = 0;
    }
  });
}

export function handleCanvasClick(clientX, clientY) {
  const rect = ctx.renderer.domElement.getBoundingClientRect();
  ctx.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  ctx.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  ctx.raycaster.setFromCamera(ctx.pointer, ctx.camera);

  const spheres = ctx.stopPins.filter(p => p.group.visible).map(p => p.sphere);
  const hits = ctx.raycaster.intersectObjects(spheres, false);
  if (hits.length > 0 && hits[0].object.userData.stopId) {
    spawnTapRipple(clientX, clientY);
    selectStop(hits[0].object.userData.stopId, true, { x: clientX, y: clientY });
  } else if (window.innerWidth < 768 && document.body.classList.contains('stop-card-open')) {
    // Tapping empty map on mobile cleanly dismisses the bottom card!
    hideStopCard();
  }
}

export function flyCameraTo(targetVec, offsetVec) {
  camCtrl.autoOrbit = false;
  camCtrl.panVelX = 0;
  camCtrl.panVelZ = 0;

  const flightDist = camCtrl.target.distanceTo(targetVec);
  camCtrl.desiredTarget.copy(targetVec);

  const isMobile = window.innerWidth < 768;
  const radius = offsetVec.length() * (isMobile ? 1.18 : 1.0);
  const theta = Math.atan2(offsetVec.x, offsetVec.z);
  const phi = Math.acos(Math.max(-0.98, Math.min(0.98, offsetVec.y / offsetVec.length())));

  let diff = theta - camCtrl.desiredTheta;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  camCtrl.desiredTheta += diff;

  camCtrl.desiredPhi = Math.max(0.24, Math.min(1.4, phi));
  camCtrl.desiredRadius = Math.max(10, Math.min(82, radius));

  // Natural Parabolic Arc over Paris rooftops for cross-city flights (interruptible on touch/drag!)
  if (!prefersReducedMotion && flightDist > 16) {
    camCtrl.arc = {
      t: 0,
      dur: Math.min(1.05, 0.55 + flightDist * 0.0045),
      lift: Math.min(26, flightDist * 0.25),
    };
  } else {
    camCtrl.arc = null;
  }
}

export function focusHomeApartment() {
  state.squadFollowCam = false;
  state.camFollowMode = 'free';
  updateFollowButton();
  flyCameraTo(new THREE.Vector3(P.home[0], 1.4, P.home[1]), new THREE.Vector3(-7, 9, 10));
  showToast('🏠 3 Rue Saint-Hyacinthe, 75001 — Το διαμέρισμά σας!');
}

export function resetOverviewCamera() {
  state.squadFollowCam = false;
  state.camFollowMode = 'free';
  updateFollowButton();
  camCtrl.desiredTarget.set(-14, 1.5, 4);
  camCtrl.desiredRadius = window.innerWidth < 768 ? 138 : 112;
  camCtrl.desiredPhi = 1.0;
  camCtrl.autoOrbit = !prefersReducedMotion;
}

export function onWindowResize() {
  if (!ctx.camera || !ctx.renderer) return;
  const container = document.getElementById('canvas-container');
  const w = container.clientWidth || window.innerWidth;
  const h = container.clientHeight || window.innerHeight;
  ctx.camera.fov = w < 640 ? 50 : 44;
  ctx.camera.aspect = w / h;
  ctx.camera.updateProjectionMatrix();
  ctx.renderer.setSize(w, h);
}

