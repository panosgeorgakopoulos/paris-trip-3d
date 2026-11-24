# Paris 3D Trip Guide — December 1–3, 2026

Interactive 3D Paris itinerary built for **Panos, Kostas, Iakovos & Imbrixis**, starting from **Rue Saint-Hyacinthe 3, 75001 Paris**.

🌐 **Live Site**: https://panosgeorgakopoulos.github.io/paris-trip-3d/

## Project Structure

```text
paris-trip-3d/
├── index.html                  # Semantic HTML shell & UI layout
├── .nojekyll                   # Serves static ES modules directly on GitHub Pages
├── css/
│   └── styles.css              # Frosted-glass theme, safe-area mobile layout & micro-interactions
├── data/
│   ├── paris-buildings.zbin    # Gzip-packed binary GIS data (26,928 real OSM Paris buildings)
│   └── paris-roads.zbin        # Gzip-packed binary GIS data (11,796 real OSM Paris streets)
└── js/
    ├── main.js                 # Scene bootstrap, lighting presets & 60fps animation loop
    ├── config.js               # WGS84 projection, terrain elevation, 3-day itinerary & bookings
    ├── state.js                # Shared 3D runtime context, localStorage state, fetchZbin & helpers
    ├── textures.js             # Procedural PBR textures (Haussmann limestone, zinc, roads, monuments)
    ├── controls.js             # Google Maps 3D touch gestures, inertia, rubber banding & camera arcs
    ├── ui.js                   # Sidebar/sheet, stop card peek/expand, 3D labels & playback controls
    └── scene/
        ├── environment.js      # Sky dome, sculpted zero-blur Paris terrain, Seine shader & 11 bridges
        ├── roads.js            # 11,796 real OSM vector streets + hero boulevards & streetlamps
        ├── parks.js            # Formal French gardens & instanced winter trees
        ├── buildings.js        # 26,928 real OSM Haussmannian buildings (2 GPU draw calls)
        ├── landmarks.js        # Eiffel Tower, museums & 12 core historic churches
        ├── places.js           # All 15 itinerary Places + 24 expanded Paris skyline sights & churches
        └── squad.js            # 3-day routes, 4 animated friends, transit vehicles, pins & snow
```

## Highlights
- **Real 3D Paris Cityscape**: 26,928 real OpenStreetMap building footprints & 11,796 real Paris streets across all 20 arrondissements loaded as compact binary `.zbin` assets, sculpted hills (Montmartre, Panthéon, Chaillot, Belleville), and a clear running-water River Seine shader.
- **Hand-Crafted Sights, Churches & Squares**: Eiffel Tower (with 18:00/19:00 sparkle), Louvre, Palais Garnier, Musée d'Orsay, Rodin, Invalides, Notre-Dame, Sainte-Chapelle, Panthéon, Sacré-Cœur, Grand Palais, Centre Pompidou, Tour Montparnasse, all formal gardens, and 39 labeled Paris *Places*, churches & sights.
- **Animated 4-Friend Squad**: Play/pause the 4 friends walking along real Parisian routes (including Day 2 Express Metro Line 1 Concorde → Châtelet, Day 3 FLV 13:40 shuttle & Metro Line 2) with Follow-Cam and speed controls.
- **Mobile-First & Google Maps 3D Gestures**: 1-finger pan with inertia, 2-finger pinch/twist/tilt, double-tap zoom, compact peek cards with smart camera optical offset, and `localStorage` persistence.

## Local Development
Because the project uses native ES modules (`type="module"`), serve it over any local HTTP server:

```bash
python3 -m http.server 8765
```
Then open `http://localhost:8765/`.
