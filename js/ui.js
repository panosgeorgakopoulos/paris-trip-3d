// Projected 3D labels, sidebar/bottom-sheet UI, bookings, stop card peek/rubber-drag & playback controls
import { P, DAY_META, ITINERARY_STOPS, BOOKINGS_DATA, PHOTO_SPOTS, mapsUrl } from './config.js';
import { ctx, state, camCtrl, prefersReducedMotion, saveState, showToast, spawnCelebrationBurst, triggerSquash } from './state.js';
import { sampleDayPath } from './scene/squad.js';
import { setTransitOverlayVisible } from './scene/transit.js';
import { flyCameraTo, focusHomeApartment, resetOverviewCamera } from './controls.js';
import { toggleLiveGPS, snapNorthUp, buildDirectionsUrl, shareTripProgress, updateLiveParisBanner } from './features.js';

const tempProj = new THREE.Vector3();
export function updateProjectedLabels() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const isMobile = w < 768;
  const activeDay = state.activeDay;

  ctx.landmarkLabelEntries.forEach((entry) => {
    const el = entry.el;
    if (!el) return;

    const visibleForDay = entry.isHome || entry.isSquad || entry.isFriend || activeDay === 'all' || entry.day === activeDay || entry.id === state.selectedStopId;
    if (!visibleForDay) {
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      return;
    }

    const dist = ctx.camera.position.distanceTo(entry.pos);
    const squadWalking = ctx.squadGuys.length > 0 && ctx.squadGuys[0].group.visible;

    // Smart Zoom LOD for Panos, Kostas, Iakovos & Imbrixis + Ambient Parisian Places:
    // Close-up while walking -> show all 4 individual names; zoomed out or on transit -> show combined group pill!
    if (entry.isFriend && (!squadWalking || dist > 30)) {
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      return;
    }
    if (entry.isSquad && squadWalking && dist <= 26) {
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      return;
    }
    if (entry.isPlace && dist > 46) {
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      return;
    }

    tempProj.copy(entry.pos).project(ctx.camera);
    const behind = tempProj.z > 1;
    const sx = (tempProj.x * 0.5 + 0.5) * w;
    const sy = (-tempProj.y * 0.5 + 0.5) * h;

    // Avoid top bars & bottom dock overlap
    const topPad = isMobile ? 105 : 64;
    const botPad = isMobile ? 102 : 95;
    if (behind || sx < -30 || sx > w + 30 || sy < topPad || sy > h - botPad) {
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      return;
    }

    const isSelected = entry.id === state.selectedStopId;
    el.classList.toggle('is-active', isSelected);

    let alpha = 1;
    if (!isSelected && !entry.isHome && !entry.isSquad && !entry.isFriend) {
      if (isMobile && activeDay === 'all' && dist > 105) alpha = 0;
      else if (activeDay === 'all' && dist > 145) alpha = 0.55;
      if (dist > 240) alpha = 0;
    }

    el.style.transform = `translate3d(${sx}px, ${sy}px, 0) translate(-50%, -120%)`;
    el.style.opacity = String(alpha);
    el.style.pointerEvents = (!entry.isFriend && alpha > 0.25) ? 'auto' : 'none';
    el.style.zIndex = entry.isFriend ? '29' : (entry.isSquad ? '28' : (isSelected ? '26' : (entry.isHome ? '24' : '15')));
  });

  // Project 3D Paris Métro / RER / FLV Shuttle Station Badges when Transit Overlay is active!
  if (state.metroOverlay && ctx.transitLabels && ctx.transitLabels.length) {
    const topPad = isMobile ? 105 : 64;
    const botPad = isMobile ? 102 : 95;
    const maxDist = isMobile ? 96 : 138;
    ctx.transitLabels.forEach((t) => {
      const dist = ctx.camera.position.distanceTo(t.pos);
      if (dist > maxDist) {
        t.el.style.opacity = '0';
        return;
      }
      tempProj.copy(t.pos).project(ctx.camera);
      const sx = (tempProj.x * 0.5 + 0.5) * w;
      const sy = (-tempProj.y * 0.5 + 0.5) * h;
      if (tempProj.z > 1 || sx < -20 || sx > w + 20 || sy < topPad || sy > h - botPad) {
        t.el.style.opacity = '0';
        return;
      }
      t.el.style.transform = `translate3d(${sx}px, ${sy}px, 0) translate(-50%, -115%)`;
      t.el.style.opacity = dist > maxDist * 0.78 ? '0.6' : '0.96';
      t.el.style.zIndex = '18';
    });
  }
}

// =======================================================================
// 8. UI RENDERING, 4-GUYS CONTROLS & MOBILE-FIRST ORCHESTRATION
// =======================================================================
export function getVisibleStops() {
  if (state.activeDay === 'all') return ITINERARY_STOPS;
  return ITINERARY_STOPS.filter(s => s.day === state.activeDay);
}

export function applyDayVisibilityTo3D() {
  [1, 2, 3].forEach((d) => {
    const grp = ctx.routeGroups[d];
    if (!grp) return;
    const isActive = state.activeDay === 'all' || state.activeDay === d;
    grp.userData.coreMat.opacity = isActive ? (state.activeDay === 'all' ? 0.68 : 0.96) : 0.1;
    grp.userData.haloMat.opacity = isActive ? (state.activeDay === 'all' ? 0.14 : 0.26) : 0.02;
    ctx.routePulses.forEach((p) => {
      if (p.day === d) p.mesh.visible = isActive;
    });
  });

  ctx.stopPins.forEach((pin) => {
    pin.group.visible = state.activeDay === 'all' || pin.day === state.activeDay || pin.id === state.selectedStopId;
  });
}

export function renderItineraryList(shouldStagger = false) {
  const container = document.getElementById('tab-itinerary');
  if (!container) return;
  container.innerHTML = '';

  let staggerIdx = 0;
  const daysToRender = state.activeDay === 'all' ? [1, 2, 3] : [state.activeDay];
  daysToRender.forEach((dayNum) => {
    const meta = DAY_META[dayNum];
    const stops = ITINERARY_STOPS.filter(s => s.day === dayNum);

    const section = document.createElement('div');
    section.className = 'space-y-2';
    section.innerHTML = `
      <div class="sticky top-0 z-10 py-2 px-3 rounded-2xl bg-[#0e152b]/95 backdrop-blur-md border border-white/10">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:${meta.colorHex}"></span>
            <span class="text-xs font-bold uppercase tracking-wider text-ivory truncate">${meta.date}</span>
          </div>
          <button type="button" data-play-day="${dayNum}" class="play-day-btn px-2 py-0.5 rounded-lg bg-champagne/15 border border-champagne/35 text-champagne text-[10px] font-bold hover:bg-champagne/25 transition-all shrink-0">
            ▶ Παρέα
          </button>
        </div>
        <p class="text-[11px] text-ivory/70 mt-0.5 leading-snug">${meta.title}</p>
        <p class="text-[10px] text-champagne/80 font-mono mt-0.5">👟 ${meta.walkStats}</p>
      </div>
    `;

    section.querySelector('.play-day-btn').addEventListener('click', (ev) => {
      ev.stopPropagation();
      startSquadForDay(dayNum);
      if (window.innerWidth < 768) setSidebarOpen(false);
    });

    const listWrap = document.createElement('div');
    listWrap.className = 'space-y-1.5';

    stops.forEach((stop) => {
      const isSelected = stop.id === state.selectedStopId;
      const isDone = state.visited.has(stop.id);

      const item = document.createElement('div');
      item.dataset.stopId = stop.id;
      item.className = `group relative rounded-2xl p-2.5 border transition-all cursor-pointer flex items-start gap-2.5 ${isSelected
        ? 'bg-champagne/15 border-champagne/65 shadow-lg'
        : 'bg-white/[0.035] border-white/10 hover:bg-white/[0.07] hover:border-white/20'
        }${shouldStagger && staggerIdx < 8 ? ' stagger-item' : ''}`;
      if (shouldStagger && staggerIdx < 8) {
        item.style.animationDelay = `${staggerIdx * 22}ms`;
      }
      staggerIdx++;

      item.innerHTML = `
        <button type="button" aria-label="Σήμανση στάσης ως ολοκληρωμένη" class="stop-check-btn mt-0.5 w-7 h-7 rounded-full border flex items-center justify-center shrink-0 text-xs transition-all ${isDone
          ? 'bg-emerald-400/25 border-emerald-400 text-emerald-300 font-bold'
          : 'border-white/25 text-transparent hover:border-champagne hover:text-champagne/60'
        }">✓</button>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-1.5 mb-0.5">
            <span class="text-[11px] font-mono font-bold text-champagne">${stop.time}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${stop.bookingStatus === 'booked'
          ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/35'
          : stop.bookingRequired
            ? 'bg-amber-400/20 text-amber-200 border border-amber-400/35'
            : 'bg-white/10 text-ivory/80'
        }">${stop.tag}</span>
          </div>
          <h4 class="text-[13px] font-semibold leading-snug ${isDone ? 'line-through text-ivory/50' : 'text-ivory'}">${stop.title}</h4>
          <p class="text-[11px] text-ivory/65 line-clamp-2 mt-0.5 leading-relaxed">${stop.details}</p>
        </div>
      `;

      item.querySelector('.stop-check-btn').addEventListener('click', (ev) => {
        ev.stopPropagation();
        toggleVisited(stop.id, ev);
      });

      item.addEventListener('click', (ev) => {
        selectStop(stop.id, true, { x: ev.clientX, y: ev.clientY });
        if (window.innerWidth < 768) setSidebarOpen(false);
      });

      listWrap.appendChild(item);
    });

    section.appendChild(listWrap);
    container.appendChild(section);
  });

  updateProgressUI();
}

export function updateProgressUI() {
  const total = ITINERARY_STOPS.length;
  const done = state.visited.size;
  const pct = Math.round((done / total) * 100);
  const textEl = document.getElementById('progress-text');
  const barEl = document.getElementById('progress-bar');
  if (textEl) textEl.textContent = `${done} / ${total} στάσεις (${pct}%)`;
  if (barEl) barEl.style.width = `${pct}%`;
}

export function toggleVisited(stopId, ev = null) {
  let justCompleted = false;
  if (state.visited.has(stopId)) {
    state.visited.delete(stopId);
  } else {
    state.visited.add(stopId);
    justCompleted = true;
    const allDone = state.visited.size >= ITINERARY_STOPS.length;
    // Secondary Action + Exaggeration + Peak-End Rule on 100% completion!
    if (ev && typeof ev.clientX === 'number') {
      spawnCelebrationBurst(ev.clientX, ev.clientY, allDone ? 28 : 9);
    } else {
      spawnCelebrationBurst(window.innerWidth * 0.5, window.innerHeight * 0.72, allDone ? 28 : 9);
    }
    showToast(allDone
      ? `🏆 ${ITINERARY_STOPS.length}/${ITINERARY_STOPS.length} Στάσεις! Panos, Kostas, Iakovos & Imbrixis — Κατακτήσατε όλο το Παρίσι! 🇫🇷✨`
      : '✓ Σημειώθηκε ως ολοκληρωμένο!');
  }
  saveState();
  renderItineraryList(false);
  if (state.selectedStopId === stopId) {
    renderStopCard(ITINERARY_STOPS.find(s => s.id === stopId));
    if (justCompleted) triggerSquash(document.getElementById('btn-card-visited'));
  }
}

export function selectStop(stopId, shouldFly = true, originPt = null) {
  const stop = ITINERARY_STOPS.find(s => s.id === stopId);
  if (!stop) return;

  state.selectedStopId = stop.id;
  state.squadFollowCam = false;
  state.camFollowMode = 'free';
  updateFollowButton();

  if (state.timeMode === 'auto') {
    state.currentResolvedTime = stop.timeOfDay;
  }

  if (shouldFly) {
    const target = new THREE.Vector3(stop.pos[0], stop.pos[1] + 1.2, stop.pos[2]);
    const offset = new THREE.Vector3(stop.camOffset[0], stop.camOffset[1], stop.camOffset[2]);
    flyCameraTo(target, offset);
  }

  renderStopCard(stop, originPt);
  renderItineraryList(false);
  applyDayVisibilityTo3D();

  const activeRow = document.querySelector(`#tab-itinerary [data-stop-id="${stop.id}"]`);
  if (activeRow) activeRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export function renderStopCard(stop, originPt = null) {
  const card = document.getElementById('stop-card');
  if (!card || !stop) return;

  // Origin Awareness: bloom the card toward the exact tap/click X position!
  if (originPt && typeof originPt.x === 'number') {
    const pctX = Math.max(12, Math.min(88, Math.round((originPt.x / Math.max(1, window.innerWidth)) * 100)));
    card.style.transformOrigin = `${pctX}% 100%`;
  } else {
    card.style.transformOrigin = '50% 100%';
  }

  const meta = DAY_META[stop.day];
  const dayBadge = document.getElementById('card-day-badge');
  dayBadge.textContent = `Μέρα ${stop.day} • ${meta.date}`;
  dayBadge.className = `text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.badgeClass}`;

  document.getElementById('card-time').textContent = stop.time;
  document.getElementById('card-tag').textContent = stop.tag;
  document.getElementById('card-title').textContent = stop.title;
  document.getElementById('card-desc').textContent = stop.details;
  document.getElementById('card-tip').textContent = stop.tip;
  document.getElementById('btn-card-maps').href = mapsUrl(stop.mapsQuery || stop.title);
  const dirBtn = document.getElementById('btn-card-directions');
  if (dirBtn) dirBtn.href = buildDirectionsUrl(stop);

  // Follow-Through: inner card details settle a subtle beat after the card shell!
  const tipBox = document.getElementById('stop-card-body');
  if (tipBox && !prefersReducedMotion) {
    tipBox.classList.remove('card-follow-beat');
    void tipBox.offsetWidth;
    tipBox.classList.add('card-follow-beat');
  }

  const alertBox = document.getElementById('card-alert');
  if (stop.importantNote) {
    document.getElementById('card-alert-text').textContent = stop.importantNote;
    alertBox.classList.remove('hidden');
  } else {
    alertBox.classList.add('hidden');
  }

  const isDone = state.visited.has(stop.id);
  const vBtn = document.getElementById('btn-card-visited');
  const vIcon = document.getElementById('card-visited-icon');
  const vText = document.getElementById('card-visited-text');
  if (isDone) {
    vBtn.className = 'px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 bg-emerald-400/20 border border-emerald-400/45 text-emerald-300';
    vIcon.textContent = '✓';
    vText.textContent = 'Ολοκληρώθηκε';
  } else {
    vBtn.className = 'px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 bg-white/10 hover:bg-white/15 text-ivory border border-white/10';
    vIcon.textContent = '○';
    vText.textContent = 'Σήμανση ✓';
  }

  card.classList.remove('stop-card-hidden');
  document.body.classList.add('stop-card-open');
  // On mobile, always open in sleek compact peek mode so the 3D building stays 100% visible above!
  setStopCardExpanded(window.innerWidth >= 768);
}

export function setStopCardExpanded(expanded) {
  const card = document.getElementById('stop-card');
  const btn = document.getElementById('btn-expand-card');
  if (!card) return;
  card.classList.toggle('is-expanded', expanded);
  if (btn) btn.textContent = expanded ? 'Σύμπτυξη ⌄' : 'Περισσότερα ⌃';
}

export function hideStopCard() {
  const card = document.getElementById('stop-card');
  if (card) {
    card.classList.add('stop-card-hidden');
    card.classList.remove('is-expanded');
  }
  document.body.classList.remove('stop-card-open');
  state.selectedStopId = null;
  renderItineraryList();
}

export function stepStop(direction) {
  const list = getVisibleStops();
  if (!list.length) return;
  const currIdx = list.findIndex(s => s.id === state.selectedStopId);
  const nextIdx = currIdx === -1
    ? (direction > 0 ? 0 : list.length - 1)
    : (currIdx + direction + list.length) % list.length;
  selectStop(list[nextIdx].id, true);
}

export function renderBookings() {
  const list = document.getElementById('bookings-list');
  if (!list) return;
  list.innerHTML = '';

  let bookedCount = 0;
  BOOKINGS_DATA.forEach((item) => {
    const isBooked = !!state.bookings[item.id];
    if (isBooked) bookedCount++;
    const meta = DAY_META[item.day];

    const row = document.createElement('button');
    row.type = 'button';
    row.className = `w-full text-left rounded-2xl p-3 border transition-all flex items-start gap-3 ${isBooked
      ? 'bg-emerald-500/12 border-emerald-400/35'
      : 'bg-white/[0.04] border-white/10 hover:border-champagne/40'
      }`;

    row.innerHTML = `
      <span class="mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 text-xs font-bold ${isBooked ? 'bg-emerald-400 border-emerald-400 text-midnight' : 'border-white/30 text-transparent'
      }">✓</span>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-bold ${isBooked ? 'text-emerald-200 line-through' : 'text-ivory'}">${item.title}</span>
          <span class="w-2 h-2 rounded-full shrink-0" style="background:${meta.colorHex}"></span>
        </div>
        <div class="text-[11px] font-mono text-champagne/90 mt-0.5">${item.time}</div>
        <div class="text-[11px] text-ivory/65 mt-0.5">${item.note}</div>
      </div>
    `;

    row.addEventListener('click', () => {
      state.bookings[item.id] = !state.bookings[item.id];
      saveState();
      renderBookings();
      updateLiveParisBanner((id) => selectStop(id, true));
      showToast(state.bookings[item.id] ? `🎟️ Έτοιμο: ${item.title}` : `Εκκρεμεί: ${item.title}`);
    });
    list.appendChild(row);
  });

  const badge = document.getElementById('bookings-badge');
  if (badge) badge.textContent = `${bookedCount}/${BOOKINGS_DATA.length}`;
}

export function renderPhotoSpots() {
  const list = document.getElementById('photo-spots-list');
  if (!list) return;
  list.innerHTML = '';
  let count = 0;

  PHOTO_SPOTS.forEach((spot) => {
    const checked = !!state.photos[spot.id];
    if (checked) count++;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2.5 transition-all ${checked ? 'bg-champagne/15 text-champagne' : 'bg-white/[0.035] text-ivory/85 hover:bg-white/[0.07]'
      }`;
    btn.innerHTML = `
      <span class="w-4 h-4 rounded border flex items-center justify-center text-[10px] shrink-0 ${checked ? 'bg-champagne border-champagne text-midnight font-bold' : 'border-white/30 text-transparent'
      }">✓</span>
      <span class="${checked ? 'line-through opacity-80' : ''}">${spot.label}</span>
    `;
    btn.addEventListener('click', () => {
      state.photos[spot.id] = !state.photos[spot.id];
      saveState();
      renderPhotoSpots();
    });
    list.appendChild(btn);
  });

  const countEl = document.getElementById('photo-count');
  if (countEl) countEl.textContent = `${count}/${PHOTO_SPOTS.length}`;
}

// -----------------------------------------------------------------------
// M. 4-GUYS PLAYBACK CONTROLS & ATMOSPHERE ACTIONS
// -----------------------------------------------------------------------
export function updatePlayButtonUI() {
  const icon = document.getElementById('squad-play-icon');
  const label = document.getElementById('squad-play-label');
  if (icon) icon.textContent = state.squadPlaying ? '⏸' : '▶';
  if (label) label.textContent = state.squadPlaying ? 'Παύση' : 'Παρέα 4';
}

export function updateFollowButton() {
  const btn = document.getElementById('btn-follow-squad');
  const icon = document.getElementById('follow-cam-icon');
  const label = document.getElementById('follow-cam-label');
  if (!btn) return;
  btn.classList.remove(
    'bg-champagne/20', 'border-champagne/50', 'text-champagne',
    'bg-emeraldParis/20', 'border-emeraldParis/50', 'text-emeraldParis',
    'bg-white/10', 'border-transparent', 'text-ivory/65'
  );
  if (state.squadFollowCam && state.camFollowMode === 'pov') {
    btn.classList.add('bg-emeraldParis/20', 'border-emeraldParis/50', 'text-emeraldParis');
    if (icon) icon.textContent = '🚶';
    if (label) label.textContent = 'POV';
  } else if (state.squadFollowCam) {
    btn.classList.add('bg-champagne/20', 'border-champagne/50', 'text-champagne');
    if (icon) icon.textContent = '🎥';
    if (label) label.textContent = 'Follow';
  } else {
    btn.classList.add('bg-white/10', 'border-transparent', 'text-ivory/65');
    if (icon) icon.textContent = '🎥';
    if (label) label.textContent = 'Free';
  }
}

export function toggleSquadPlay() {
  state.squadPlaying = !state.squadPlaying;
  if (state.squadPlaying) {
    if (state.activeDay !== 'all') state.squadDay = state.activeDay;
    state.squadFollowCam = true;
    if (state.camFollowMode === 'free') state.camFollowMode = 'follow';
    updateFollowButton();
    hideStopCard();
    if (window.innerWidth < 768) setSidebarOpen(false);
    showToast(`🚶‍♂️ Η παρέα των 4 ξεκινά τη διαδρομή (Μέρα ${state.squadDay})!`);
  } else {
    showToast('⏸ Παύση διαδρομής παρέας');
  }
  updatePlayButtonUI();
}

export function startSquadForDay(dayNum) {
  setDayFilter(dayNum, false);
  state.squadDay = dayNum;
  state.squadProgress = 0;
  state.squadPlaying = true;
  state.squadFollowCam = true;
  if (state.camFollowMode === 'free') state.camFollowMode = 'follow';
  updateFollowButton();
  updatePlayButtonUI();
  hideStopCard();
  showToast(`🚶‍♂️ Οι 4 φίλοι ξεκινούν τη Μέρα ${dayNum} από τους δρόμους του Παρισιού!`);
}

export function triggerEiffelSparkle(flyToTower = true) {
  state.sparkleUntil = Date.now() + 14000;
  if (state.timeMode === 'auto' || state.currentResolvedTime === 'morning' || state.currentResolvedTime === 'afternoon') {
    state.currentResolvedTime = 'night';
  }
  if (flyToTower) {
    state.squadFollowCam = false;
    state.camFollowMode = 'free';
    updateFollowButton();
    flyCameraTo(new THREE.Vector3(P.eiffel[0], 6.8, P.eiffel[1]), new THREE.Vector3(-11, 9, 15));
  }
  showToast('✨ Scintillement! Ο Πύργος του Άιφελ αστράφτει!');
}

export function setSidebarOpen(open) {
  state.sidebarOpen = open;
  document.body.classList.toggle('sidebar-is-open', open);
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  sidebar.classList.toggle('sidebar-collapsed', !open);
  // On mobile, hide stop card when bottom sheet opens so they never collide!
  if (open && window.innerWidth < 768) {
    hideStopCard();
  }
}

export function setDayFilter(dayVal, autoFly = true) {
  state.activeDay = dayVal === 'all' ? 'all' : Number(dayVal);
  document.querySelectorAll('.day-pill').forEach((btn) => {
    const match = btn.dataset.day === String(dayVal);
    btn.classList.toggle('bg-champagne', match);
    btn.classList.toggle('text-midnight', match);
    btn.classList.toggle('font-bold', match);
    btn.classList.toggle('shadow-sm', match);
    btn.classList.toggle('text-ivory/80', !match);
  });

  if (state.activeDay !== 'all') {
    state.squadDay = state.activeDay;
    state.squadProgress = 0;
  }

  applyDayVisibilityTo3D();
  renderItineraryList(true);

  if (autoFly) {
    if (state.activeDay !== 'all') {
      const first = ITINERARY_STOPS.find(s => s.day === state.activeDay);
      if (first) selectStop(first.id, true);
    } else {
      resetOverviewCamera();
    }
  }
}

export function setTimeMode(mode) {
  state.timeMode = mode;
  document.querySelectorAll('.time-pill').forEach((btn) => {
    const match = btn.dataset.time === mode;
    btn.classList.toggle('bg-champagne/25', match);
    btn.classList.toggle('text-champagne', match);
    btn.classList.toggle('border', match);
    btn.classList.toggle('border-champagne/40', match);
    btn.classList.toggle('font-bold', match);
    btn.classList.toggle('text-ivory/75', !match);
  });

  const iconMap = { auto: '✨', morning: '🌅', dusk: '🌇', night: '🌙' };
  const mIcon = document.getElementById('time-cycle-icon');
  if (mIcon) mIcon.textContent = iconMap[mode] || '🌇';

  if (mode === 'auto') {
    const st = ITINERARY_STOPS.find(s => s.id === state.selectedStopId);
    state.currentResolvedTime = st ? st.timeOfDay : 'dusk';
  } else {
    state.currentResolvedTime = mode;
  }
}

export function bindUIEvents() {
  document.getElementById('btn-toggle-sidebar').addEventListener('click', () => setSidebarOpen(!state.sidebarOpen));
  document.getElementById('btn-close-sidebar').addEventListener('click', () => setSidebarOpen(false));

  // Sidebar tabs
  document.querySelectorAll('.sidebar-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.sidebar-tab').forEach((b) => {
        const active = b.dataset.tab === tab;
        b.setAttribute('aria-selected', String(active));
        b.classList.toggle('bg-champagne', active);
        b.classList.toggle('text-midnight', active);
        b.classList.toggle('font-bold', active);
        b.classList.toggle('text-ivory/75', !active);
      });
      document.getElementById('tab-itinerary').classList.toggle('hidden', tab !== 'itinerary');
      document.getElementById('progress-strip').classList.toggle('hidden', tab !== 'itinerary');
      document.getElementById('tab-bookings').classList.toggle('hidden', tab !== 'bookings');
      document.getElementById('tab-insider').classList.toggle('hidden', tab !== 'insider');
    });
  });

  // Day filter pills (desktop + mobile)
  document.querySelectorAll('.day-pill').forEach((btn) => {
    btn.addEventListener('click', () => setDayFilter(btn.dataset.day, true));
  });

  // Desktop Time-of-day pills
  document.querySelectorAll('.time-pill').forEach((btn) => {
    btn.addEventListener('click', () => setTimeMode(btn.dataset.time));
  });

  // Mobile quick cycle time-of-day button
  const timeOrder = ['auto', 'morning', 'dusk', 'night'];
  const timeLabels = { auto: 'Auto Φωτισμός', morning: '🌅 Χειμωνιάτικο Πρωί', dusk: '🌇 Δύση Ηλίου', night: '🌙 Νυχτερινό Παρίσι' };
  document.getElementById('btn-time-cycle').addEventListener('click', () => {
    const next = timeOrder[(timeOrder.indexOf(state.timeMode) + 1) % timeOrder.length];
    setTimeMode(next);
    showToast(timeLabels[next]);
  });

  // 4-Guys Route Player Controls (Squash & Stretch tactile feedback)
  document.getElementById('btn-play-squad').addEventListener('click', (ev) => {
    triggerSquash(ev.currentTarget);
    toggleSquadPlay();
  });

  const speeds = [1, 2, 4];
  document.getElementById('btn-squad-speed').addEventListener('click', (ev) => {
    state.squadSpeed = speeds[(speeds.indexOf(state.squadSpeed) + 1) % speeds.length];
    ev.currentTarget.textContent = `${state.squadSpeed}×`;
    showToast(`⚡ Ταχύτητα παρέας: ${state.squadSpeed}×`);
  });

  document.getElementById('btn-follow-squad').addEventListener('click', (ev) => {
    triggerSquash(ev.currentTarget);
    const nextMode = !state.squadFollowCam ? 'follow' : (state.camFollowMode === 'follow' ? 'pov' : 'free');
    state.camFollowMode = nextMode;
    state.squadFollowCam = nextMode !== 'free';
    updateFollowButton();
    const s = sampleDayPath(state.squadDay, state.squadProgress);
    if (nextMode === 'pov' && s) {
      camCtrl.autoOrbit = false;
      camCtrl.arc = null;
      camCtrl.desiredTarget.set(s.x, s.y + 1.05, s.z);
      camCtrl.desiredRadius = window.innerWidth < 768 ? 8.4 : 7.4;
      camCtrl.desiredPhi = 1.24;
      const chaseTheta = s.heading + Math.PI;
      let tDiff = chaseTheta - camCtrl.desiredTheta;
      while (tDiff > Math.PI) tDiff -= Math.PI * 2;
      while (tDiff < -Math.PI) tDiff += Math.PI * 2;
      camCtrl.desiredTheta += tDiff;
      showToast('🚶 Street POV κάμερα πίσω από την παρέα!');
    } else if (nextMode === 'follow' && s) {
      flyCameraTo(new THREE.Vector3(s.x, s.y + 1, s.z), new THREE.Vector3(-8, 10, 12));
      showToast('🎥 Follow Camera ενεργή στην παρέα');
    } else {
      showToast('🎥 Ελεύθερη κάμερα');
    }
  });

  // Live GPS, 3D Paris Métro/RER Overlay, North-Up Compass & 4-Friend Share Sync
  const gpsBtn = document.getElementById('btn-gps');
  if (gpsBtn) gpsBtn.addEventListener('click', (ev) => toggleLiveGPS(ev.currentTarget));

  const metroBtn = document.getElementById('btn-metro-overlay');
  if (metroBtn) {
    metroBtn.addEventListener('click', (ev) => {
      const next = !state.metroOverlay;
      setTransitOverlayVisible(next);
      metroBtn.classList.toggle('bg-champagne/25', next);
      metroBtn.classList.toggle('border-champagne/65', next);
      metroBtn.classList.toggle('text-champagne', next);
      triggerSquash(ev.currentTarget);
      showToast(next ? '🚇 Γραμμές Μετρό 1, 2, 9, RER C & FLV Shuttle ενεργές!' : '🚇 Απόκρυψη γραμμών Μετρό');
    });
  }

  const compassBtn = document.getElementById('btn-compass');
  if (compassBtn) compassBtn.addEventListener('click', (ev) => snapNorthUp(ev.currentTarget));

  const shareBtn = document.getElementById('btn-share-sync');
  if (shareBtn) shareBtn.addEventListener('click', (ev) => shareTripProgress(ev.currentTarget));

  document.getElementById('squad-scrubber').addEventListener('input', (ev) => {
    state.squadProgress = Number(ev.target.value) / 1000;
    const s = sampleDayPath(state.squadDay, state.squadProgress);
    if (s && state.timeMode === 'auto') {
      state.currentResolvedTime = s.timeOfDay;
    }
    if (s && state.squadFollowCam) {
      camCtrl.autoOrbit = false;
      camCtrl.desiredTarget.set(s.x, s.y + 1, s.z);
    }
  });

  // Eiffel Sparkle (Anticipation charge-up + Exaggerated golden burst!), Snow, Home, Reset View
  document.getElementById('btn-eiffel-sparkle').addEventListener('click', (ev) => {
    const btn = ev.currentTarget;
    triggerSquash(btn, 'anim-charge-pop');
    const r = btn.getBoundingClientRect();
    setTimeout(() => {
      spawnCelebrationBurst(r.left + r.width * 0.5, r.top + r.height * 0.5, 16);
      triggerEiffelSparkle(true);
    }, prefersReducedMotion ? 0 : 90);
  });

  const snowBtn = document.getElementById('btn-snow');
  snowBtn.addEventListener('click', () => {
    state.snowEnabled = !state.snowEnabled;
    snowBtn.classList.toggle('bg-sapphire/15', state.snowEnabled);
    snowBtn.classList.toggle('border-sapphire/40', state.snowEnabled);
    snowBtn.classList.toggle('opacity-55', !state.snowEnabled);
    showToast(state.snowEnabled ? '❄️ Χιονόπτωση ενεργή' : 'Χιόνι απενεργοποιημένο');
  });

  document.getElementById('btn-go-home').addEventListener('click', focusHomeApartment);
  document.getElementById('btn-reset-view').addEventListener('click', () => {
    resetOverviewCamera();
    hideStopCard();
    showToast('🌍 Πανοραμική θέα Παρισιού');
  });

  // Stop Detail Card Buttons + Mobile Peek/Expand & Swipe-to-Dismiss!
  document.getElementById('btn-close-card').addEventListener('click', hideStopCard);
  document.getElementById('btn-expand-card').addEventListener('click', () => {
    const card = document.getElementById('stop-card');
    setStopCardExpanded(!card.classList.contains('is-expanded'));
  });
  document.getElementById('stop-card-handle').addEventListener('click', () => {
    const card = document.getElementById('stop-card');
    setStopCardExpanded(!card.classList.contains('is-expanded'));
  });
  // Live Mobile Stop-Card Drag + Elastic Rubber Banding (pull up past expanded or drag down to dismiss!)
  let cardSwipeY = 0, cardDragging = false, cardDragDelta = 0;
  const stopCardEl = document.getElementById('stop-card');
  stopCardEl.addEventListener('touchstart', (e) => {
    if (window.innerWidth >= 768 || e.touches.length !== 1) return;
    cardSwipeY = e.touches[0].clientY;
    cardDragDelta = 0;
    cardDragging = true;
    stopCardEl.classList.remove('is-rubber-spring');
  }, { passive: true });
  stopCardEl.addEventListener('touchmove', (e) => {
    if (!cardDragging || window.innerWidth >= 768 || e.touches.length !== 1) return;
    const dy = e.touches[0].clientY - cardSwipeY;
    if (stopCardEl.scrollTop > 2 && dy > 0) return;
    cardDragDelta = dy;
    stopCardEl.classList.add('is-rubber-dragging');
    // Rubber-banding damped stretch when pulling upward past end, direct 1:1 follow when pulling down
    const visualY = dy < 0 ? dy * 0.24 : dy * 0.85;
    stopCardEl.style.transform = `translateY(${visualY.toFixed(1)}px)`;
  }, { passive: true });
  stopCardEl.addEventListener('touchend', () => {
    if (!cardDragging || window.innerWidth >= 768) return;
    cardDragging = false;
    stopCardEl.classList.remove('is-rubber-dragging');
    stopCardEl.classList.add('is-rubber-spring');
    stopCardEl.style.transform = '';
    if (cardDragDelta < -34) {
      setStopCardExpanded(true);
    } else if (cardDragDelta > 52 && stopCardEl.scrollTop <= 2) {
      if (stopCardEl.classList.contains('is-expanded')) setStopCardExpanded(false);
      else hideStopCard();
    }
    setTimeout(() => stopCardEl.classList.remove('is-rubber-spring'), 280);
  }, { passive: true });
  document.getElementById('btn-prev-stop').addEventListener('click', () => stepStop(-1));
  document.getElementById('btn-next-stop').addEventListener('click', () => stepStop(1));
  document.getElementById('btn-card-visited').addEventListener('click', (ev) => {
    if (state.selectedStopId) toggleVisited(state.selectedStopId, ev);
  });

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.key === 'ArrowRight') stepStop(1);
    else if (e.key === 'ArrowLeft') stepStop(-1);
    else if (e.key === ' ') { e.preventDefault(); toggleSquadPlay(); }
    else if (e.key === 'Escape') { hideStopCard(); if (window.innerWidth < 768) setSidebarOpen(false); }
  });
}

