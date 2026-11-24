# Paris 3D Trip Guide — December 1–3, 2026

Interactive 3D Paris itinerary built for **Panos, Kostas, Iakovos & Imbrixis**, starting from **Rue Saint-Hyacinthe 3, 75001 Paris**.

🌐 **Live Site**: https://panosgeorgakopoulos.github.io/paris-trip-3d/

## Project Structure

```text
paris-trip-3d/
├── index.html                  # Semantic HTML shell, PWA tags & UI layout
├── manifest.json               # Standalone PWA manifest (Add to Home Screen)
├── sw.js                       # Offline-first Service Worker (works in Paris Métro!)
├── .nojekyll                   # Serves static ES modules directly on GitHub Pages
├── assets/
│   ├── icon.svg                # Vector app icon (gold Eiffel on midnight)
│   └── apple-touch-icon.png    # 180×180 iOS Home Screen icon
├── css/
│   ├── tailwind.min.css        # Pre-compiled static Tailwind CSS (zero runtime CDN compiler)
│   └── styles.css              # Frosted-glass theme, compass, safe-area layout & motion craft
├── data/
│   ├── paris-buildings.zbin    # Gzip-packed binary GIS data (26,928 real OSM Paris buildings)
│   └── paris-roads.zbin        # Gzip-packed binary GIS data (11,796 real OSM Paris streets)
└── js/
    ├── main.js                 # Scene bootstrap, lighting presets & 60fps animation loop
    ├── config.js               # WGS84 projection, terrain elevation, 3-day itinerary & bookings
    ├── state.js                # Shared 3D runtime context, localStorage state, fetchZbin & helpers
    ├── textures.js             # Procedural PBR textures (Haussmann limestone, zinc, roads, monuments)
    ├── controls.js             # Google Maps 3D touch gestures, inertia, rubber banding & camera arcs
    ├── features.js             # Live GPS beacon, Open-Meteo weather, compass, schedule & URL sync
    ├── ui.js                   # Sidebar/sheet, stop card peek/expand, 3D labels & playback controls
    └── scene/
        ├── environment.js      # Sky dome, sculpted zero-blur Paris terrain, Seine shader & 11 bridges
        ├── roads.js            # 11,796 real OSM vector streets + hero boulevards & streetlamps
        ├── parks.js            # Formal French gardens & instanced winter trees
        ├── buildings.js        # 26,928 real OSM Haussmannian buildings (2 GPU draw calls)
        ├── landmarks.js        # Eiffel Tower, museums & 12 core historic churches
        ├── places.js           # All 15 itinerary Places + 24 expanded Paris skyline sights & churches
        ├── squad.js            # 3-day routes, 4 animated friends, Street POV chase cam & snow
        └── transit.js          # Toggleable 3D Paris Métro Lines 1, 2, 9, RER C & FLV Shuttle overlay
```

## Highlights
- **Real 3D Paris Cityscape**: 26,928 real OpenStreetMap building footprints & 11,796 real Paris streets across all 20 arrondissements loaded as compact binary `.zbin` assets, sculpted hills (Montmartre, Panthéon, Chaillot, Belleville), and a clear running-water River Seine shader.
- **Offline PWA & Instant Load**: Pre-compiled static `tailwind.min.css` (23 KB) and an offline-first Service Worker (`sw.js`) so the full 3D map works underground in the Paris Métro and installs cleanly to iOS/Android Home Screen.
- **Live Paris Companion**: Pulsing 3D GPS "You Are Here" beacon with walking distance to your next stop, live Open-Meteo Paris weather pill, rotating North-Up compass, live `Europe/Paris` schedule & hard-deadline alerts (16:00 Express, 18:00/19:00 Eiffel sparkle, 13:40 FLV Shuttle, Mon 30/11 Notre-Dame slot), 1-tap stop-to-stop Google Maps walking/transit directions, and 1-tap URL-hash progress sync for all 4 friends.
- **3D Métro Overlay & Street POV Cam**: Toggle glowing 3D Métro Lines 1, 2, 9, RER C & FLV Shuttle station badges, and cycle camera modes between `Follow`, `🚶 Street POV` (over-the-shoulder chase behind Panos, Kostas, Iakovos & Imbrixis), and `Free`.
- **Mobile-First & Google Maps 3D Gestures**: 1-finger pan with inertia, 2-finger pinch/twist/tilt, double-tap zoom, compact peek cards with smart camera optical offset, and `localStorage` persistence.

## Local Development
Because the project uses native ES modules (`type="module"`), serve it over any local HTTP server:

```bash
python3 -m http.server 8765
```
Then open `http://localhost:8765/`.
