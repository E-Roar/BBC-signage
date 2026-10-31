# BRAVEN Business Center — 8th Wall AR World Canvas Signage (React PWA)

Holographic 3D Metallic Gold PBR Signage with 8th Wall Local Open-Source Image Tracking AR, Symmetrical 3D World-Canvas Spatial UI, and Progressive Web App (PWA) architecture.

---

## 🌟 Features Overview

- **8th Wall Studio Native Integration**:
  - Full `.expanse.json` ECS scene graph ready to open directly in the **8th Wall Studio** desktop app (`~/.local/bin/8thwall`).
  - Image target metadata and marker descriptor pipeline configured in `image-targets/`.
  - First-class 3D model asset bundled at `src/assets/braven-logo.glb`.
  - Registered 8th Wall ECS components (`image-target-sync`, `braven-scene-controller`, `world-canvas-signage`).
- **3D World Canvas Spatial UI (In-Scene, Not Screen-Stuck)**:
  - Symmetrical 2x2 Car Racing Sci-Fi Smart Signage floating directly in 3D world space around the central logo.
  - **Left 3D Column**: Card 01 (*Executive Suites*) & Card 02 (*Security & Access*) angled 13° inward.
  - **Right 3D Column**: Card 03 (*Architecture*) & Card 04 (*Instant Deployment*) angled -13° inward.
  - **Top Telemetry Header Plane**: Sector status and metric pill with animated speed-slash flash.
  - **Bottom Tachometer Control Plane**: Interactive `◀ PREV`, `NEXT ▶`, Autoplay toggle, live RPM progress bar, 6 sector dots, and slide counter.
  - Full 3D raycasting pointer hover with spring-damper perspective tilt physics and interactive clicks.
  - 60 FPS text scrambling (`scrambleText`) and staggered racing cascade transitions.
- **True 24K Yellow-Champagne Gold PBR**:
  - Smooth micro-grain Poliigon 7253 PBR maps (BaseColor, roughness ~0.18, smooth tangent-space normal map, clearcoat 0.35, anisotropy).
  - High-polish mirror gold accent material for bevels and diamond nodes.
  - 3 Strictly Perpendicular (90° orthogonal) Tumbling Golden Rings with inner machined accent rings and cardinal octahedral nodes.
  - 90 Ambient golden shimmer dust particles drifting in world space.
  - ACESFilmicToneMapping and UnrealBloomPass glow.
- **8th Wall Open-Source AR & Image Tracking**:
  - Offline/local tracking engine with `@8thwall/engine-binary`, `@8thwall/engine`, and `@8thwall/ecs` (no cloud subscription needed).
  - High-contrast optical marker card with central Braven emblem, telemetry markings, and corner crosshairs in `image-targets/` and `public/braven-marker.png`.
  - 3D Simulation Mode with OrbitControls for desktop testing without physical cameras.
- **Dual-Engine Audio System**:
  - Built-in 106 BPM Afrobeat Billionaire Synthesizer (WebAudio log-drums, shakers, warm Rhodes chords).
  - YouTube player bridge option (`ffCAdXPO0K0`).
- **Progressive Web App (PWA)**:
  - Installable on desktop and mobile (`manifest.webmanifest`).
  - Service worker (`sw.js`) for fast asset caching and offline performance.

---

## 🚀 How to Run Locally

### 1. Run React PWA (Vite Dev Server)
```bash
npm run dev
# or: npm run preview
```
Open [http://localhost:3005](http://localhost:3005) in your browser (port 3005 is configured to prevent conflicts with Codeman on port 3000).

### 2. Open in 8th Wall Studio Software
Launch the 8th Wall Studio desktop app:
```bash
8thwall
```
In 8th Wall Studio:
- The project appears automatically in your **Recent Projects** list as both:
  - `BBC-signage` (`/home/glitcher/Desktop/BBC-signage`)
  - `BBC-Signage-Studio` (`/home/glitcher/Documents/8th Wall/BBC-Signage-Studio`)
- Click either entry to open the scene.
- 8th Wall Studio loads `src/.expanse.json` with the full hierarchy:
  - **AR / 3D World Camera** (Perspective camera with World / Image Tracking)
  - **Studio Lighting** (Key, Rim, Ambient, Glints)
  - **Braven AR Marker Anchor** (Image Target entity linked to `braven-marker`)
    - **Braven 3D Metallic Gold PBR Logo**
    - **3D World Canvas Smart Signage**

---

## 🎯 How to Assign or Edit Markers in 8th Wall Studio

1. **View Existing Marker**:
   - The project includes the pre-configured image target `braven-marker` inside `image-targets/`:
     - `braven-marker.json`
     - `braven-marker_original.png`
     - `braven-marker_cropped.png`
     - `braven-marker_thumbnail.png`
     - `braven-marker_luminance.png`
2. **Assign in 8th Wall Studio**:
   - In 8th Wall Studio's left entity tree, select **Braven AR Marker Anchor**.
   - In the inspector panel on the right, under **Image Target**, select `braven-marker` or click **Add Image Target** to upload any new poster, business card, or magazine cover.
   - The studio automatically generates feature descriptors and attaches the 3D logo & World Canvas UI to track the new marker!
3. **Generate Marker via CLI Script**:
   - You can also re-generate marker assets anytime using:
     ```bash
     npm run generate-marker
     ```

---

## 📦 Project Structure

```
BBC-signage/
├── config/                     # 8th Wall Studio Webpack & Dev8 Plugins
│   ├── webpack.config.js
│   ├── entry-plugin.js
│   ├── asset-loader.js
│   └── dev8-plugin.js
├── image-targets/              # 8th Wall Image Tracking Targets
│   ├── braven-marker.json
│   ├── braven-marker_original.png
│   ├── braven-marker_cropped.png
│   ├── braven-marker_thumbnail.png
│   └── braven-marker_luminance.png
├── public/                     # PWA Static Assets & Printable Marker
│   ├── braven-marker.png
│   ├── braven-logo.glb
│   ├── manifest.webmanifest
│   └── sw.js
├── scripts/                    # Asset Exporters & Generation Scripts
│   ├── export-glb.mjs          # Generates 3D GLB model
│   └── generate-marker.mjs     # Generates multi-res marker images
├── src/
│   ├── .expanse.json           # 8th Wall Studio ECS Scene Graph
│   ├── app.ts                  # 8th Wall Studio ECS Entry Point
│   ├── App.tsx                 # React UI, Telemetry HUD, Studio Sliders
│   ├── main.tsx                # React Mount Root & PWA registration
│   ├── braven-3d-scene.ts      # Three.js 24K Gold PBR & Ring Engine
│   ├── world-canvas-signage.ts # Symmetrical 3D World Canvas Signage
│   ├── ar-controller.ts        # 8th Wall XR & Camera Image Tracking
│   ├── audio-engine.ts         # 106 BPM Afrobeat Synth & YouTube bridge
│   ├── state.ts                # Shared Reactive State & 6 Sectors
│   ├── index.css               # Styling, Glassmorphic Tokens & Fonts
│   └── components/             # 8th Wall ECS Component Registrations
│       ├── image-target-sync.ts
│       ├── braven-scene-controller.ts
│       └── world-canvas-signage.ts
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🛠 Available Scripts

- `npm run dev`: Starts the Vite React PWA development server.
- `npm run build`: Builds the production React PWA bundle into `dist/`.
- `npm run serve`: Starts the 8th Wall Studio development server.
- `npm run build:studio`: Compiles the 8th Wall Studio bundle using Webpack.
- `npm run export-model`: Re-exports `braven-logo.glb` from procedural geometry.
- `npm run generate-marker`: Re-generates all 8th Wall image target files.
