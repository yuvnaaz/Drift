# Drift: A Paper & Ink Meditation

Drift is a peaceful, indirect-control physics puzzle game built around the theme of fluid dynamics and watercolor art. Players paint wind currents onto textured parchment paper to guide an origami paper boat home to its dock sanctuary without colliding with organic mossy islands.

The game is designed to be highly atmospheric, visual, and meditative, drawing inspiration from premium art-house games like *Monument Valley*, *Prune*, and *Alto's Odyssey*.

---

## 🌸 Key Features

### 1. "Paper & Ink" Aesthetics
- **Dynamic Viewport layers:** A layered rendering pipeline featuring procedural eggshell parchment paper texture, moving caustics (light reflections), and wobbly sketchy lines.
- **Organic Islands:** Seed-generated obstacles featuring charcoal rapidograph ink borders, sage-green linear moss washes, and soft drop shadows cast on the water bed.
- **Calligraphy Drawing Brush:** When painting wind paths, a detailed calligraphy brush tip tracks your pointer, leaving feathered watercolor wind currents in its wake.
- **Weather Overlays:** Specific chapters feature atmospheric weather overlays:
  - *Fog:* Soft white vapor clouds drifting slowly to add graphical depth.
  - *Rain:* Sketchy charcoal rain lines falling diagonally that splash into wobbly concentric ripples.

### 2. Meditative Generative Audio
- Built entirely on the Web Audio API, Drift synthesizes a slow, non-repeating background synthesizer pad.
- Every 6 to 10 seconds, it procedurally schedules chord tones from a peaceful pentatonic scale (A3, C4, D4, E4, G4, A4) to create an infinite, relaxing soundscape.
- Interlocking sound effects: soft wood-bump chimes on gentle collisions, gliding pitch drops on waterlogging crashes, and arpeggiated harp sparkles on lotus blooms.

### 3. Physical Steering & Speed-Threshold Collisions
- **Vector Field Projections:** Painted wind currents translate to physical force fields. The physics engine projects the boat's coordinates onto the closest segment of the spline, applying a tangent acceleration vector that decays quadratically with distance.
- **Soft Bounces:** If normal velocity $\le 1.28$, the boat slides along island edges and gently bounces with minor screen vibrations.
- **Waterlogged Sinking:** If normal velocity $> 1.28$, the impact sinks the paper boat, initiating a spin-out animation, concentric charcoal waves, heavy screen shake, and a retry menu.

### 4. Sequential Chapters & Star Ratings
- Features **15 progressive levels** divided across 5 recurring color/weather palettes (Dawn, Noon, Sunset, Night, Storm).
- Levels are locked sequentially. Completing a level unlocks the next chapter.
- A **Star Rating System** rewards efficiency: 3 gold stars if completed with minimal strokes, 2 stars if slightly over, and 1 star otherwise. The Level Selection grid displays the best star rating achieved for each unlocked card.

---

## 🛠️ Project Structure

```
├── index.html                  # Fullscreen UI overlay, modal panels, and game canvas
├── style.css                   # Glassmorphic overlay styling, star animations, and transitions
├── manifest.json               # PWA App Store properties & landscape orientation locks
├── sw.js                       # Service worker caching files for complete offline play
├── capacitor.config.json       # iOS Capacitor package bundle definitions
├── icon-192.png / icon-512.png # Generated square hand-drawn app icon assets
├── check_syntax.py             # Simple Python syntax validation script
└── js/
    ├── levels.js               # 15 chapter layouts, palettes, weather, and lotus locations
    ├── physics.js              # Vector projections, soft bounce equations, and mass/inertia parameters
    ├── particles.js            # Sakura leaves, fireflies, birds, rain, fog, and wake systems
    ├── audio.js                # Web Audio API synthesizers, chimes, and generative music loops
    └── game.js                 # State machine, canvas rendering, DOM bindings, and touch listeners
```

---

## 🚀 Getting Started

### Local Development
To run the project locally, serve the root directory using any local web server:

**Using Python:**
```bash
python -m http.server 8000
```
Then open **`http://localhost:8000`** in your browser.

---

## 📱 Publishing to the App Store

Drift is fully optimized as a mobile hybrid app using two distribution options:

### Route A: PWABuilder (Cloud Packaging — No Mac Required)
1. Host your project folder on a static web host (such as GitHub Pages, Netlify, or Vercel).
2. Go to **[pwabuilder.com](https://www.pwabuilder.com)** and enter your hosted URL.
3. Generate and download the native **iOS Package (.ipa)** generated in the cloud directly from your Windows environment.
4. Upload to App Store Connect.

### Route B: Capacitor (Local Compilation — Xcode & Mac Required)
1. Install Capacitor dependencies:
   ```bash
   npm install @capacitor/core @capacitor/cli
   npm install @capacitor/ios
   ```
2. Add the native platform:
   ```bash
   npx cap add ios
   ```
3. Copy local assets into the iOS container:
   ```bash
   npx cap sync
   ```
4. Open Xcode to compile, sign, and archive:
   ```bash
   npx cap open ios
   ```
