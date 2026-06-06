// Drift Game Controller & Coordinator (Paper & Ink Redesign)
import levels from './levels.js';
import { PhysicsEngine, getRockRadiusAt } from './physics.js';
import { ParticleSystem } from './particles.js';
import audio from './audio.js';

class GameController {
  constructor() {
    this.physics = new PhysicsEngine();
    this.particles = new ParticleSystem();
    
    // Game state
    this.currentLevelIndex = 0;
    this.gameState = 'EDIT'; // 'EDIT', 'PLAY', 'VICTORY'
    this.boat = null;
    this.placedWinds = []; // Placed wind paths: [{ points: [{x,y}, ...] }]
    
    // Level Completion tracking
    this.completedLevelStars = {};
    try {
      this.completedLevelStars = JSON.parse(localStorage.getItem('drift_level_stars') || '{}');
      
      // Backward compatibility migration
      const legacyCompleted = JSON.parse(localStorage.getItem('drift_completed_levels') || '[]');
      if (Array.isArray(legacyCompleted) && legacyCompleted.length > 0) {
        legacyCompleted.forEach(id => {
          if (this.completedLevelStars[id] === undefined) {
            this.completedLevelStars[id] = 1;
          }
        });
        localStorage.setItem('drift_level_stars', JSON.stringify(this.completedLevelStars));
        localStorage.removeItem('drift_completed_levels');
      }
    } catch (e) {
      console.warn("localStorage is blocked or unavailable:", e);
    }

    // Interaction states
    this.selectedWind = null;
    this.hoveredWind = null;
    this.hoveredHandle = null; // 'delete', null
    
    this.isDrawingNew = false;
    this.tempDrawPoints = []; // coordinates during mouse drag drawing

    // Canvas scaling and translations
    this.scale = 1.0;
    this.offsetX = 0;
    this.offsetY = 0;

    // Procedural cached assets
    this.paperPattern = null;
    this.causticSeeds = [
      { x: 200, y: 150, r: 180, vx: 0.15, vy: 0.1, scale: 1.0 },
      { x: 900, y: 550, r: 240, vx: -0.12, vy: -0.08, scale: 1.2 },
      { x: 500, y: 350, r: 210, vx: 0.08, vy: -0.15, scale: 0.95 }
    ];

    // DOM cache
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // UI Elements
    this.levelChapterEl = document.getElementById('level-chapter');
    this.levelTitleEl = document.getElementById('level-title');
    this.levelDescEl = document.getElementById('level-description');
    this.windCountValEl = document.getElementById('wind-count-val');
    this.windMaxValEl = document.getElementById('wind-max-val');
    
    this.playPauseBtn = document.getElementById('play-pause-btn');
    this.playBtnText = document.getElementById('play-btn-text');
    this.resetBtn = document.getElementById('reset-btn');
    this.clearBtn = document.getElementById('clear-btn');
    this.soundBtn = document.getElementById('sound-btn');
    this.soundIcon = document.getElementById('sound-icon');
    
    this.levelSelectBtn = document.getElementById('level-select-btn');
    this.levelModal = document.getElementById('level-modal');
    this.levelGrid = document.getElementById('level-grid');
    this.closeLevelModalBtn = document.getElementById('close-level-modal');
    
    this.helpBtn = document.getElementById('help-btn');
    this.helpModal = document.getElementById('help-modal');
    this.closeHelpModalBtn = document.getElementById('close-help-modal');
    
    this.successModal = document.getElementById('success-modal');
    this.nextLevelBtn = document.getElementById('next-level-btn');
    this.replayLevelBtn = document.getElementById('replay-level-btn');
    
    // Fail modal bindings
    this.failModal = document.getElementById('fail-modal');
    this.failRetryBtn = document.getElementById('fail-retry-btn');
    this.failClearBtn = document.getElementById('fail-clear-btn');
    
    this.introOverlayEl = document.getElementById('intro-overlay');
    this.beginJourneyBtn = document.getElementById('begin-journey-btn');
    
    this.lastTime = 0;
    this.ghostOpacity = 1.0;
    this.activeLotuses = [];
  }

  get level() {
    return levels[this.currentLevelIndex];
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.createPaperPattern(); // recreate pattern to match context
    });
    
    // Generate initial procedural paper pattern
    this.createPaperPattern();
    
    this.setupEventListeners();
    this.loadLevel(this.currentLevelIndex);
    
    let seenIntro = false;
    try {
      seenIntro = localStorage.getItem('drift_seen_intro') === 'true';
    } catch (e) {
      seenIntro = false;
    }

    if (seenIntro) {
      if (this.introOverlayEl) {
        this.introOverlayEl.classList.add('hidden');
      }
      let seenTutorial = false;
      try {
        seenTutorial = localStorage.getItem('drift_seen_tutorial') === 'true';
      } catch (e) {
        seenTutorial = false;
      }
      if (!seenTutorial) {
        setTimeout(() => this.showHelp(), 600);
        try {
          localStorage.setItem('drift_seen_tutorial', 'true');
        } catch (e) {}
      }
    } else {
      if (this.introOverlayEl) {
        this.introOverlayEl.classList.remove('hidden');
      }
    }
    
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  // Generate a high-fidelity seamless repeating paper grain pattern
  createPaperPattern() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Base eggshell parchment color
    const paperColor = this.level && this.level.palette ? this.level.palette.paperColor : '#f4efe2';
    ctx.fillStyle = paperColor; 
    ctx.fillRect(0, 0, size, size);
    
    // Add tiny random texture noise
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 5.0; // soft grain
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise - 1));
      data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise - 3));
    }
    ctx.putImageData(imgData, 0, 0);

    // Add faint long sketchbook fibers
    ctx.strokeStyle = 'rgba(43, 40, 36, 0.015)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      const sx = Math.random() * size;
      const sy = Math.random() * size;
      ctx.moveTo(sx, sy);
      ctx.bezierCurveTo(
        sx + (Math.random() - 0.5) * 60, sy + (Math.random() - 0.5) * 60,
        sx + (Math.random() - 0.5) * 60, sy + (Math.random() - 0.5) * 60,
        sx + (Math.random() - 0.5) * 120, sy + (Math.random() - 0.5) * 120
      );
      ctx.stroke();
    }

    this.paperPattern = this.ctx.createPattern(canvas, 'repeat');
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    const logicalW = 1200;
    const logicalH = 800;
    
    const scaleX = this.canvas.width / logicalW;
    const scaleY = this.canvas.height / logicalH;
    
    this.scale = Math.min(scaleX, scaleY);
    if (window.innerWidth > 768) {
      this.scale *= 0.88; 
    } else {
      this.scale *= 0.72; 
    }
    
    this.offsetX = (this.canvas.width - logicalW * this.scale) / 2;
    this.offsetY = (this.canvas.height - logicalH * this.scale) / 2;
  }

  loadLevel(index) {
    this.currentLevelIndex = index;
    const currentLevel = this.level;
    
    this.gameState = 'EDIT';
    this.placedWinds = [];
    this.selectedWind = null;
    this.hoveredWind = null;
    this.hoveredHandle = null;
    this.ghostOpacity = 1.0;
    this.activeLotuses = JSON.parse(JSON.stringify(currentLevel.lotuses || []));
    this.createPaperPattern();
    
    this.particles.clearAll();
    
    // Setup boat
    this.boat = this.physics.createBoat(currentLevel.spawn.x, currentLevel.spawn.y, currentLevel.spawn.angle);
    
    // UI elements
    document.body.classList.remove('simulation-active');
    this.levelChapterEl.textContent = `Chapter ${currentLevel.id}`;
    this.levelTitleEl.textContent = currentLevel.title.split(': ')[1] || currentLevel.title;
    this.levelDescEl.textContent = currentLevel.description;
    this.windCountValEl.textContent = "0";
    this.windMaxValEl.textContent = currentLevel.maxWind.toString();
    
    this.updateControlsUI();
    this.successModal.classList.add('hidden');
    this.failModal.classList.add('hidden');
    this.levelModal.classList.add('hidden');
  }

  setupEventListeners() {
    // Canvas Inputs
    this.canvas.addEventListener('mousedown', (e) => this.handlePointerDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handlePointerMove(e));
    this.canvas.addEventListener('mouseup', () => this.handlePointerUp());
    this.canvas.addEventListener('mouseleave', () => this.handlePointerUp());

    // Touch Support with Multi-Touch ignoring
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.touches && e.touches.length > 1) return; // ignore multi-touch
      this.handlePointerDown(e);
    }, { passive: false });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches && e.touches.length > 1) return;
      this.handlePointerMove(e);
    }, { passive: false });
    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.handlePointerUp();
    }, { passive: false });

    // Buttons
    this.playPauseBtn.addEventListener('click', () => this.togglePlayState());
    this.resetBtn.addEventListener('click', () => this.recallBoat());
    this.clearBtn.addEventListener('click', () => this.clearWind());
    this.soundBtn.addEventListener('click', () => this.toggleSound());
    
    // Fail Modal Buttons
    this.failRetryBtn.addEventListener('click', () => {
      this.failModal.classList.add('hidden');
      this.recallBoat();
    });
    this.failClearBtn.addEventListener('click', () => {
      this.failModal.classList.add('hidden');
      this.clearWind();
      this.recallBoat();
    });
    
    this.levelSelectBtn.addEventListener('click', () => this.openLevelModal());
    this.closeLevelModalBtn.addEventListener('click', () => this.levelModal.classList.add('hidden'));
    
    this.helpBtn.addEventListener('click', () => this.showHelp());
    this.closeHelpModalBtn.addEventListener('click', () => this.helpModal.classList.add('hidden'));
    
    this.nextLevelBtn.addEventListener('click', () => this.loadNextLevel());
    this.replayLevelBtn.addEventListener('click', () => this.loadLevel(this.currentLevelIndex));

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        this.togglePlayState();
      } else if (e.key === 'r' || e.key === 'R') {
        this.recallBoat();
      } else if (e.key === 'c' || e.key === 'C') {
        this.clearWind();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedWind) {
        this.deleteWind(this.selectedWind);
      }
    });

    if (this.beginJourneyBtn) {
      this.beginJourneyBtn.addEventListener('click', () => {
        audio.init();
        audio.playRecall();
        try {
          localStorage.setItem('drift_seen_intro', 'true');
        } catch(e) {}
        if (this.introOverlayEl) {
          this.introOverlayEl.classList.add('hidden');
          let seenTutorial = false;
          try {
            seenTutorial = localStorage.getItem('drift_seen_tutorial') === 'true';
          } catch (e) {
            seenTutorial = false;
          }
          if (!seenTutorial) {
            setTimeout(() => this.showHelp(), 600);
            try {
              localStorage.setItem('drift_seen_tutorial', 'true');
            } catch (e) {}
          }
        }
      });
    }
  }

  getLogicalMouse(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;
    
    return {
      x: (canvasX - this.offsetX) / this.scale,
      y: (canvasY - this.offsetY) / this.scale
    };
  }

  handlePointerDown(e) {
    audio.init();
    const pos = this.getLogicalMouse(e);
    
    if (this.gameState === 'PLAY' || this.gameState === 'FAIL') return;

    // 1. Check if clicked the red X delete handle on selected stroke
    if (this.selectedWind) {
      const delPos = this.getPathDeleteHandle(this.selectedWind);
      if (this.distance(pos, delPos) < 18) {
        this.deleteWind(this.selectedWind);
        return;
      }
    }

    // 2. Check if clicked near an existing wind stroke to select it
    for (const wind of this.placedWinds) {
      if (this.isPointNearPath(pos, wind, 24)) {
        this.selectedWind = wind;
        audio.playPlaceArrow();
        return;
      }
    }

    // 3. Clicked empty space - deselect immediately and let code fall through to start drawing
    if (this.selectedWind) {
      this.selectedWind = null;
    }

    if (this.placedWinds.length < this.level.maxWind) {
      this.isDrawingNew = true;
      this.tempDrawPoints = [{ x: pos.x, y: pos.y }];
    }
  }

  handlePointerMove(e) {
    const pos = this.getLogicalMouse(e);
    
    if (this.gameState === 'PLAY' || this.gameState === 'FAIL') return;

    // 1. Handle active brush stroke drawing
    if (this.isDrawingNew) {
      const lastPt = this.tempDrawPoints[this.tempDrawPoints.length - 1];
      const dist = this.distance(pos, lastPt);
      
      // Capture points with space separation to prevent dense vertices
      if (dist > 14) {
        this.tempDrawPoints.push({ x: pos.x, y: pos.y });
        // Fade out ghost hint during active drawing
        this.ghostOpacity = Math.max(0, this.ghostOpacity - 0.08);
      }
      return;
    }

    // 2. Handle delete button hover highlighting
    this.hoveredHandle = null;
    if (this.selectedWind) {
      const delPos = this.getPathDeleteHandle(this.selectedWind);
      if (this.distance(pos, delPos) < 18) {
        this.hoveredHandle = 'delete';
        return;
      }
    }

    // 3. Highlight wind paths under cursor
    this.hoveredWind = null;
    for (const wind of this.placedWinds) {
      if (this.isPointNearPath(pos, wind, 22)) {
        this.hoveredWind = wind;
        break;
      }
    }
  }

  handlePointerUp() {
    if (this.isDrawingNew) {
      this.isDrawingNew = false;
      
      if (this.tempDrawPoints.length >= 2) {
        // Calculate cumulative path length to ignore micro clicks
        let pathLength = 0;
        for (let i = 0; i < this.tempDrawPoints.length - 1; i++) {
          pathLength += this.distance(this.tempDrawPoints[i], this.tempDrawPoints[i+1]);
        }
        
        if (pathLength > 35 && this.placedWinds.length < this.level.maxWind) {
          const newPath = { points: [...this.tempDrawPoints] };
          this.placedWinds.push(newPath);
          this.selectedWind = newPath;
          this.windCountValEl.textContent = this.placedWinds.length.toString();
          audio.playPlaceArrow();
          this.updateAudioWind();
        } else {
          // Bad/short stroke feedback (diluted red watercolor drop and chime)
          this.particles.spawnBadStroke(this.tempDrawPoints);
          audio.playRecall();
        }
      }
      this.tempDrawPoints = [];
    }
  }

  deleteWind(wind) {
    const idx = this.placedWinds.indexOf(wind);
    if (idx !== -1) {
      this.placedWinds.splice(idx, 1);
      this.selectedWind = null;
      this.windCountValEl.textContent = this.placedWinds.length.toString();
      audio.playRecall();
      this.updateAudioWind();
    }
  }

  clearWind() {
    if (this.placedWinds.length === 0) return;
    this.placedWinds = [];
    this.selectedWind = null;
    this.windCountValEl.textContent = "0";
    audio.playRecall();
    this.updateAudioWind();
  }

  updateAudioWind() {
    let sumLength = 0;
    for (const w of this.placedWinds) {
      for (let i = 0; i < w.points.length - 1; i++) {
        sumLength += this.distance(w.points[i], w.points[i+1]);
      }
    }
    const maxVal = this.level.maxWind * 350;
    const intensity = Math.min(1.0, sumLength / maxVal);
    audio.setWindIntensity(intensity);
  }

  togglePlayState() {
    audio.init();
    
    if (this.gameState === 'EDIT') {
      this.gameState = 'PLAY';
      this.boat.isActive = true;
      this.selectedWind = null;
      
      document.body.classList.add('simulation-active');
      this.resetBtn.disabled = false;
    } else if (this.gameState === 'PLAY') {
      this.gameState = 'EDIT';
      this.boat.isActive = false;
      document.body.classList.remove('simulation-active');
    }
  }

  recallBoat() {
    if (this.gameState === 'VICTORY') return;
    
    this.gameState = 'EDIT';
    this.boat = this.physics.createBoat(this.level.spawn.x, this.level.spawn.y, this.level.spawn.angle);
    this.particles.clearTempParticles();
    
    document.body.classList.remove('simulation-active');
    this.updateControlsUI();
    
    audio.playRecall();
  }

  toggleSound() {
    const isMuted = audio.toggleMute();
    if (isMuted) {
      this.soundBtn.classList.remove('active');
      this.soundIcon.innerHTML = `
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <line x1="23" y1="9" x2="17" y2="15"></line>
        <line x1="17" y1="9" x2="23" y2="15"></line>
      `;
    } else {
      this.soundBtn.classList.add('active');
      this.soundIcon.innerHTML = `
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      `;
    }
  }

  openLevelModal() {
    this.levelGrid.innerHTML = '';
    levels.forEach((lvl, idx) => {
      const card = document.createElement('div');
      card.className = 'level-item';
      
      const isUnlocked = (idx === 0) || (this.completedLevelStars[levels[idx - 1].id] !== undefined);
      const starsAchieved = this.completedLevelStars[lvl.id] || 0;
      
      if (!isUnlocked) {
        card.classList.add('locked');
        card.innerHTML = `
          <div class="level-num">🔒</div>
          <div class="level-name">Chapter ${lvl.id}</div>
        `;
      } else {
        if (starsAchieved > 0) {
          card.classList.add('completed');
        }
        
        let starsHtml = '';
        if (starsAchieved > 0) {
          starsHtml = `<div class="level-stars gold">` + 
            '★'.repeat(starsAchieved) + '☆'.repeat(3 - starsAchieved) + 
            `</div>`;
        } else {
          starsHtml = `<div class="level-stars">☆☆☆</div>`;
        }
        
        card.innerHTML = `
          <div class="level-num">${lvl.id}</div>
          <div class="level-name">${lvl.title.split(': ')[1] || lvl.title}</div>
          ${starsHtml}
        `;
        
        card.addEventListener('click', () => {
          this.loadLevel(idx);
          this.levelModal.classList.add('hidden');
        });
      }
      this.levelGrid.appendChild(card);
    });
    this.levelModal.classList.remove('hidden');
  }

  showHelp() {
    this.helpModal.classList.remove('hidden');
  }

  loadNextLevel() {
    const nextIdx = this.currentLevelIndex + 1;
    if (nextIdx < levels.length) {
      this.loadLevel(nextIdx);
    } else {
      this.loadLevel(0);
    }
  }

  triggerVictory() {
    this.gameState = 'VICTORY';
    this.boat.isActive = false;
    
    // Calculate rating based on ink usage
    const strokes = this.placedWinds.length;
    let starCount = 1;
    if (strokes <= this.level.threeStarLimit) starCount = 3;
    else if (strokes <= this.level.twoStarLimit) starCount = 2;

    // Save/update stars rating for this level
    const prevStars = this.completedLevelStars[this.level.id] || 0;
    if (starCount > prevStars) {
      this.completedLevelStars[this.level.id] = starCount;
      try {
        localStorage.setItem('drift_level_stars', JSON.stringify(this.completedLevelStars));
      } catch (e) {}
    }

    audio.playVictory();
    
    // Celebratory visual effects: Screen shake + massive gold burst
    this.particles.triggerShake(10);
    this.particles.spawnVictoryBurst(this.level.shore.x, this.level.shore.y, 140);
    this.particles.spawnSinkRipples(this.level.shore.x, this.level.shore.y); // gold ripples

    // Reset stars
    const starEls = document.querySelectorAll('#victory-stars .star-outline');
    starEls.forEach(el => el.classList.remove('filled'));

    setTimeout(() => {
      if (this.gameState === 'VICTORY') {
        const nextIdx = this.currentLevelIndex + 1;
        const hasNext = nextIdx < levels.length;
        
        document.getElementById('success-message').textContent = hasNext 
          ? `The boat has safely navigated the channel. Journey onward?`
          : `You have successfully charted all waterways. Meditate in the sandbox anytime.`;
        
        this.nextLevelBtn.textContent = hasNext ? "Journey Onward" : "Return to Chapter 1";
        this.successModal.classList.remove('hidden');
        
        // Staggered star animation
        starEls.forEach((el, i) => {
          if (i < starCount) {
            setTimeout(() => {
              if (this.gameState === 'VICTORY') {
                el.classList.add('filled');
                audio.playPlaceArrow(); // soft chime for star pop
              }
            }, 300 + i * 250);
          }
        });
      }
    }, 1200);
  }

  triggerFailure() {
    this.gameState = 'FAIL';
    this.boat.isActive = false;
    this.boat.isSinking = true;
    
    // Impact visual/audio effects: screen shake, splash ripples, glide sound
    this.particles.triggerShake(18);
    this.particles.spawnSinkRipples(this.boat.x, this.boat.y);
    audio.playSink();
    
    setTimeout(() => {
      if (this.gameState === 'FAIL') {
        this.failModal.classList.remove('hidden');
      }
    }, 1300);
  }

  updateControlsUI() {
    this.playPauseBtn.classList.remove('pause-mode');
    this.playPauseBtn.classList.add('play-mode');
    this.playBtnText.textContent = "Cast Off";
    this.resetBtn.disabled = true;
  }

  // --- Maths Helpers ---
  distance(p1, p2) {
    return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
  }

  isPointNearLine(p, x1, y1, x2, y2, tolerance) {
    const A = p.x - x1;
    const B = p.y - y1;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    
    let param = -1;
    if (lenSq !== 0) {
      param = (A * dx + B * dy) / lenSq;
    }
    
    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * dx;
      yy = y1 + param * dy;
    }
    
    const dX = p.x - xx;
    const dY = p.y - yy;
    return Math.sqrt(dX * dX + dY * dY) < tolerance;
  }

  isPointNearPath(pos, path, tolerance) {
    const points = path.points;
    for (let i = 0; i < points.length - 1; i++) {
      if (this.isPointNearLine(pos, points[i].x, points[i].y, points[i+1].x, points[i+1].y, tolerance)) {
        return true;
      }
    }
    return false;
  }

  getPathDeleteHandle(path) {
    const points = path.points;
    const midIdx = Math.floor(points.length / 2);
    const p1 = points[midIdx];
    const p2 = points[Math.min(points.length - 1, midIdx + 1)];
    
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    let nx = -0.5, ny = 0.86;
    if (len > 0.1) {
      nx = -dy / len;
      ny = dx / len;
    }
    
    return {
      x: p1.x + nx * 40,
      y: p1.y + ny * 40
    };
  }

  // --- Animation loop ---
  loop(timestamp) {
    let dt = (timestamp - this.lastTime) / 16.666;
    if (dt > 4.0) dt = 4.0;
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    const curLevel = this.level;
    
    if (this.gameState === 'PLAY') {
      const collided = this.physics.update(this.boat, this.placedWinds, curLevel.rocks, dt);
      if (collided === 'bounce') {
        audio.playBounce();
        this.particles.triggerShake(4.5);
      } else if (collided === 'sink') {
        this.triggerFailure();
      }

      // Check success
      const distToShore = this.distance(this.boat, curLevel.shore);
      const winRadius = curLevel.shore.radius + this.physics.boatRadius - 5;
      if (distToShore < winRadius) {
        this.triggerVictory();
      }

      // Check lotus flower blooms
      for (const lotus of this.activeLotuses) {
        if (!lotus.bloomed) {
          const distToLotus = this.distance(this.boat, lotus);
          if (distToLotus < 45) {
            lotus.bloomed = true;
            audio.playLotusBloom();
            this.particles.spawnVictoryBurst(lotus.x, lotus.y, 25);
          }
        }
      }
    } else if (this.gameState === 'FAIL') {
      this.physics.update(this.boat, this.placedWinds, curLevel.rocks, dt);
    }

    // Fade out ghost path if user is drawing or has placed paths
    if (this.isDrawingNew || this.placedWinds.length > 0) {
      this.ghostOpacity = Math.max(0, this.ghostOpacity - 0.04 * dt);
    }

    this.particles.update(this.physics, this.placedWinds, this.boat, curLevel, dt);
    
    // Slowly drift underwater caustics
    for (const c of this.causticSeeds) {
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      // boundary wrap
      if (c.x < -100) c.x = 1300;
      if (c.x > 1300) c.x = -100;
      if (c.y < -100) c.y = 900;
      if (c.y > 900) c.y = -100;
    }
  }

  draw() {
    const ctx = this.ctx;
    
    // 1. Draw procedural paper texture background full-screen
    if (this.paperPattern) {
      ctx.fillStyle = this.paperPattern;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      ctx.fillStyle = '#f4efe2';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // 2. Draw soft watercolor vignette around boundaries
    const vignette = ctx.createRadialGradient(
      this.canvas.width / 2, this.canvas.height / 2, Math.min(this.canvas.width, this.canvas.height) * 0.45,
      this.canvas.width / 2, this.canvas.height / 2, Math.max(this.canvas.width, this.canvas.height) * 0.7
    );
    vignette.addColorStop(0, 'rgba(244, 239, 226, 0)');
    vignette.addColorStop(1, this.level.palette.vignetteColor); // soft level-themed vignette
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply viewport transformation matrix
    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    // Apply screen shake if any
    if (this.particles.shakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this.particles.shakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.particles.shakeIntensity;
      ctx.translate(shakeX, shakeY);
    }

    // 3. Draw Depth Layer 2: Moving underwater caustics (light reflections)
    this.drawCaustics(ctx);

    // Draw bounds frame wobbly pencil line
    this.drawDottedBoundsFrame(ctx);

    // 4. Draw Depth Layer 3: Sanctuary Dock Goal & Lantern
    this.drawDock(ctx, this.level.shore);

    // 5. Draw Placed Watercolor Wind Strokes (Layer 5)
    this.drawWinds(ctx);

    // 5b. Draw Lotus Buds & Flowers
    this.drawLotuses(ctx);

    // 6. Draw Depth Layer 3: Islands / Obstacles (with sketchy outlines, moss, shadows)
    for (const rock of this.level.rocks) {
      this.drawOrganicRock(ctx, rock);
    }

    // 7. Draw Background Particles (Wake, Leaves, Fireflies)
    this.particles.draw(ctx, 'background');

    // 8. Draw Foreground Wind Flow Particles
    this.particles.draw(ctx, 'wind');

    // 9. Draw Depth Layer 4: Origami Paper Boat
    this.drawOrigamiBoat(ctx, this.boat);

    // 10. Draw Sky Particles (Birds, Victory Sparkles, Weather)
    this.particles.draw(ctx, 'sky');

    // 10b. Draw Active Drawing Brush Tip
    if (this.isDrawingNew && this.tempDrawPoints.length > 0) {
      this.drawDrawingBrushTip(ctx);
    }

    // 11. Draw Tutorial overlay text
    if (this.gameState === 'EDIT' && this.level.tutorial) {
      ctx.fillStyle = 'rgba(43, 40, 36, 0.45)';
      ctx.font = '300 17px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.level.tutorial, 600, 755);
    }

    // Draw Ghost Tutorial Path (if in EDIT state and opacity > 0)
    if (this.gameState === 'EDIT' && this.level.tutorialPath && this.ghostOpacity > 0) {
      this.drawGhostTutorialPath(ctx);
    }

    ctx.restore();
  }

  // --- Aesthetic Canvas Painters ---

  drawCaustics(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    
    this.causticSeeds.forEach((c) => {
      const time = performance.now() * 0.0008;
      
      // Draw wobbly moving light caustic shape
      ctx.fillStyle = this.level.palette.causticColor;
      ctx.beginPath();
      
      const numPoints = 8;
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        // Wiggle the points dynamically using time
        const wiggle = Math.sin(time + angle * 2) * 14 * c.scale;
        const r = c.r + wiggle;
        const px = c.x + Math.cos(angle) * r;
        const py = c.y + Math.sin(angle) * r;
        
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    });

    ctx.restore();
  }

  drawDottedBoundsFrame(ctx) {
    ctx.strokeStyle = 'rgba(43, 40, 36, 0.04)';
    ctx.lineWidth = 1.5;
    
    // Draw 4 wobbly lines to simulate hand-drawn box
    const margin = 0;
    const w = 1200;
    const h = 800;
    
    ctx.beginPath();
    // Top
    this.drawWobblyLine(ctx, margin, margin, w - margin, margin);
    // Right
    this.drawWobblyLine(ctx, w - margin, margin, w - margin, h - margin);
    // Bottom
    this.drawWobblyLine(ctx, w - margin, h - margin, margin, h - margin);
    // Left
    this.drawWobblyLine(ctx, margin, h - margin, margin, margin);
    ctx.stroke();
  }

  drawWobblyLine(ctx, x1, y1, x2, y2) {
    const dist = Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
    const segments = Math.max(2, Math.floor(dist / 30));
    
    ctx.moveTo(x1, y1);
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const rx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 0.8;
      const ry = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 0.8;
      ctx.lineTo(rx, ry);
    }
    ctx.lineTo(x2, y2);
  }

  // Draw organic island with moss wash and double sketchy ink strokes
  drawOrganicRock(ctx, rock) {
    ctx.save();
    
    const numPoints = 40;
    
    // Draw drop shadow on water bed (translucent charcoal offset)
    ctx.fillStyle = 'rgba(43, 40, 36, 0.08)';
    ctx.beginPath();
    for (let i = 0; i <= numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const r = getRockRadiusAt(rock, angle);
      const px = rock.x + Math.cos(angle) * r + 5;
      const py = rock.y + Math.sin(angle) * r + 8;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Base wobbly polygon shape
    const getPath = (offset = 0) => {
      ctx.beginPath();
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const r = getRockRadiusAt(rock, angle);
        // add tiny wobbly offset
        const wobble = Math.sin(angle * 12 + rock.seed) * offset;
        const px = rock.x + Math.cos(angle) * (r + wobble);
        const py = rock.y + Math.sin(angle) * (r + wobble);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    // Draw main stone fill (warm watercolor stone grey)
    ctx.fillStyle = '#858076'; // slate grey-brown
    getPath(0);
    ctx.fill();
    
    // Blend a subtle inner shadow watercolor overlay
    const stoneGrad = ctx.createRadialGradient(
      rock.x - rock.radius * 0.2, rock.y - rock.radius * 0.2, rock.radius * 0.1,
      rock.x, rock.y, rock.radius
    );
    stoneGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    stoneGrad.addColorStop(0.7, 'rgba(43, 40, 36, 0.15)');
    stoneGrad.addColorStop(1, 'rgba(43, 40, 36, 0.35)');
    ctx.fillStyle = stoneGrad;
    getPath(0);
    ctx.fill();

    // Draw Moss Overlay (watercolor sage wash on top edges)
    ctx.save();
    getPath(0);
    ctx.clip(); // clip to rock shape
    
    // Draw moss gradient
    const mossGrad = ctx.createLinearGradient(
      rock.x + Math.cos(rock.mossAngle + Math.PI) * rock.radius,
      rock.y + Math.sin(rock.mossAngle + Math.PI) * rock.radius,
      rock.x + Math.cos(rock.mossAngle) * rock.radius * 0.4,
      rock.y + Math.sin(rock.mossAngle) * rock.radius * 0.4
    );
    mossGrad.addColorStop(0, 'rgba(110, 128, 90, 0.65)'); // moss green
    mossGrad.addColorStop(1, 'rgba(110, 128, 90, 0)');
    ctx.fillStyle = mossGrad;
    ctx.fillRect(rock.x - rock.radius - 10, rock.y - rock.radius - 10, rock.radius * 2 + 20, rock.radius * 2 + 20);
    ctx.restore();

    // Draw Double Sketch Ink Outlines
    ctx.strokeStyle = 'rgba(43, 40, 36, 0.65)'; // charcoal sketch ink
    ctx.lineWidth = 1.0;
    
    // First wobbly sketch outline
    ctx.save();
    ctx.translate((Math.random()-0.5)*0.5, (Math.random()-0.5)*0.5);
    getPath(0.6);
    ctx.stroke();
    ctx.restore();
    
    // Second wobbly sketch outline (slightly offset and wobbly)
    ctx.strokeStyle = 'rgba(43, 40, 36, 0.38)';
    ctx.save();
    ctx.translate((Math.random()-0.5)*0.8, (Math.random()-0.5)*0.8);
    ctx.rotate(0.01);
    getPath(1.2);
    ctx.stroke();
    ctx.restore();

    // Draw wobbly ripple ring around island edge
    ctx.strokeStyle = 'rgba(43, 40, 36, 0.06)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i <= numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const r = getRockRadiusAt(rock, angle) + 7 + Math.sin(performance.now()*0.0018 + angle*4)*1.0;
      const px = rock.x + Math.cos(angle) * r;
      const py = rock.y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }

  // Draw wood dock, vertical post, glowing lantern, and shimmering water reflections
  drawDock(ctx, shore) {
    ctx.save();
    
    const dx = Math.cos(shore.dockAngle);
    const dy = Math.sin(shore.dockAngle);
    
    // 1. Calculate Dock coordinates extending out from shore center
    // Dock is 90px long, 28px wide
    const dockLen = 85;
    const dockW = 28;
    
    // Perpendicular vectors
    const px = -dy;
    const py = dx;
    
    const startX = shore.x;
    const startY = shore.y;
    const endX = shore.x + dx * dockLen;
    const endY = shore.y + dy * dockLen;
    
    // Planks (draw 7 small boards)
    ctx.strokeStyle = 'rgba(43, 40, 36, 0.85)';
    ctx.lineWidth = 1.0;
    
    const numPlanks = 8;
    for (let i = 0; i < numPlanks; i++) {
      const t = i / (numPlanks - 1);
      const cx = startX + dx * dockLen * t;
      const cy = startY + dy * dockLen * t;
      
      // Board left and right points
      const lx = cx + px * (dockW / 2);
      const ly = cy + py * (dockW / 2);
      const rx = cx - px * (dockW / 2);
      const ry = cy - py * (dockW / 2);
      
      // Draw wood fills
      ctx.fillStyle = '#bfae93'; // weathered wood tan
      ctx.fillRect(cx - 3, cy - 3, 6, 6); // visual connector
      
      ctx.beginPath();
      // Add slight organic wobble to board ends
      ctx.moveTo(lx + (Math.random()-0.5)*0.5, ly);
      ctx.lineTo(rx + (Math.random()-0.5)*0.5, ry);
      
      // Draw board thickness
      const thickness = 5;
      ctx.lineTo(rx - dx * thickness, ry - dy * thickness);
      ctx.lineTo(lx - dx * thickness, ly - dy * thickness);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    
    // Draw two support side-rails (sketched lines)
    ctx.beginPath();
    ctx.moveTo(startX + px * (dockW/2), startY + py * (dockW/2));
    ctx.lineTo(endX + px * (dockW/2), endY + py * (dockW/2));
    ctx.moveTo(startX - px * (dockW/2), startY - py * (dockW/2));
    ctx.lineTo(endX - px * (dockW/2), endY - py * (dockW/2));
    ctx.stroke();

    // 2. Draw Lantern Post at the dock tip
    const postX = endX - dx * 8;
    const postY = endY - dy * 8;
    const postH = 40; // vertical height upwards
    
    // Shadow of the post
    ctx.fillStyle = 'rgba(43, 40, 36, 0.1)';
    ctx.beginPath();
    ctx.ellipse(postX + 6, postY + 8, 8, 3, 0, 0, Math.PI*2);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(43, 40, 36, 0.9)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(postX, postY);
    ctx.lineTo(postX, postY - postH); // vertical pole
    ctx.lineTo(postX - dx * 10, postY - postH); // cross hanger arm
    ctx.stroke();

    // 3. Draw Lantern Light (radial glow)
    const lanternX = postX - dx * 10;
    const lanternY = postY - postH + 4;
    
    const pulse = Math.sin(performance.now() * 0.003) * 4;
    const glowRad = 75 + pulse;
    
    // Radial light gradient
    const lightGrad = ctx.createRadialGradient(
      lanternX, lanternY, 0,
      lanternX, lanternY, glowRad
    );
    lightGrad.addColorStop(0, 'rgba(234, 179, 8, 0.35)'); // Gold 500
    lightGrad.addColorStop(0.3, 'rgba(234, 179, 8, 0.14)');
    lightGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
    
    ctx.fillStyle = lightGrad;
    ctx.beginPath();
    ctx.arc(lanternX, lanternY, glowRad, 0, Math.PI * 2);
    ctx.fill();

    // Tiny golden glass bulb
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(lanternX, lanternY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2b2824';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // 4. Shimmering Golden Water Reflection below lantern
    const refYStart = lanternY + postH + 6;
    const time = performance.now() * 0.0016;
    ctx.strokeStyle = 'rgba(226, 142, 19, 0.38)';
    ctx.lineWidth = 1.5;
    
    for (let offset = 5; offset < 110; offset += 10) {
      const rippleWidth = 35 * Math.max(0.1, 1.0 - offset / 110);
      const rx = lanternX + Math.sin(time + offset * 0.3) * 3;
      const ry = refYStart + offset;
      
      // Draw sketchy horizontal strokes
      ctx.beginPath();
      ctx.moveTo(rx - rippleWidth * (1.0 + Math.sin(time + ry)*0.1), ry);
      ctx.lineTo(rx + rippleWidth * (1.0 + Math.sin(time + ry)*0.1), ry);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Draw wobbly folding origami paper boat with shadow
  drawOrigamiBoat(ctx, boat) {
    ctx.save();
    ctx.translate(boat.x, boat.y);
    ctx.rotate(boat.angle);

    if (boat.isSinking) {
      const progress = Math.min(1.0, boat.sinkTimer / 70);
      const scaleVal = 1.0 - progress;
      ctx.scale(scaleVal, scaleVal);
      ctx.globalAlpha = 1.0 - progress;
    }

    // Meditative floating rocking pitch and vertical waves
    const floatY = Math.sin(performance.now() * 0.0016) * 1.8;
    const pitch = Math.cos(performance.now() * 0.0012) * 0.045;
    ctx.translate(0, floatY);
    ctx.rotate(pitch);

    // 1. Draw Offset Paper Shadow
    ctx.fillStyle = 'rgba(43, 40, 36, 0.06)';
    ctx.beginPath();
    // Offset shadow diagonally
    ctx.ellipse(4, 15, boat.width * 0.85, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Draw Origami boat panels
    const w = boat.width;
    const h = boat.height;

    const getWobble = (val) => val + (Math.random() - 0.5) * 0.3;

    // Draw Left Hull (shaded parchment)
    ctx.fillStyle = '#eae5d4'; // slightly darker folded side
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(getWobble(-w * 0.5), getWobble(0));
    ctx.lineTo(getWobble(-w * 0.35), getWobble(h * 0.45));
    ctx.lineTo(0, getWobble(h * 0.45));
    ctx.closePath();
    ctx.fill();

    // Draw Right Hull (illuminated parchment)
    ctx.fillStyle = '#ded9c7'; // shadows
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(getWobble(w * 0.5), getWobble(0));
    ctx.lineTo(getWobble(w * 0.35), getWobble(h * 0.45));
    ctx.lineTo(0, getWobble(h * 0.45));
    ctx.closePath();
    ctx.fill();

    // Draw Left Sail (parchment white)
    ctx.fillStyle = '#faf7ee';
    ctx.beginPath();
    ctx.moveTo(0, getWobble(-h * 1.3));
    ctx.lineTo(getWobble(-w * 0.32), 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    // Draw Right Sail (parchment grey)
    ctx.fillStyle = '#f2edd9';
    ctx.beginPath();
    ctx.moveTo(0, getWobble(-h * 1.3));
    ctx.lineTo(getWobble(w * 0.28), 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    // Draw Double Sketch Crease Lines
    ctx.strokeStyle = 'rgba(43, 40, 36, 0.3)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    // Mast crease
    ctx.moveTo(0, -h * 1.3);
    ctx.lineTo(0, h * 0.45);
    // Left edge
    ctx.moveTo(0, -h * 1.3);
    ctx.lineTo(-w * 0.32, 0);
    ctx.lineTo(-w * 0.5, 0);
    ctx.lineTo(-w * 0.35, h * 0.45);
    ctx.lineTo(0, h * 0.45);
    // Right edge
    ctx.moveTo(0, -h * 1.3);
    ctx.lineTo(w * 0.28, 0);
    ctx.lineTo(w * 0.5, 0);
    ctx.lineTo(w * 0.35, h * 0.45);
    ctx.lineTo(0, h * 0.45);
    ctx.stroke();

    ctx.restore();
  }

  // Draw watercolor wind paths
  drawWinds(ctx) {
    const windColor = this.level.palette.windColor;
    
    // 1. Draw preview of wind currently being drawn
    if (this.isDrawingNew && this.tempDrawPoints.length >= 2) {
      ctx.save();
      ctx.strokeStyle = `${windColor}, 0.16)`;
      ctx.lineWidth = 15;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Draw faint watercolor brush pathway preview
      ctx.beginPath();
      ctx.moveTo(this.tempDrawPoints[0].x, this.tempDrawPoints[0].y);
      for (let i = 1; i < this.tempDrawPoints.length; i++) {
        ctx.lineTo(this.tempDrawPoints[i].x, this.tempDrawPoints[i].y);
      }
      ctx.stroke();
      
      // Draw wobbly dashes along path
      ctx.strokeStyle = `${windColor}, 0.45)`;
      ctx.lineWidth = 1.0;
      ctx.setLineDash([8, 8]);
      ctx.stroke();

      ctx.restore();
    }

    // 2. Draw placed wind paths
    for (const wind of this.placedWinds) {
      const isSelected = (wind === this.selectedWind);
      const isHovered = (wind === this.hoveredWind);
      
      const pts = wind.points;
      if (!pts || pts.length < 2) continue;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Determine active stroke alpha opacity
      let alphaMultiplier = 1.0;
      if (isSelected) alphaMultiplier = 1.5;
      else if (isHovered) alphaMultiplier = 1.25;

      // Layered Watercolor Bleeding Simulation (Thicker outer faded -> narrow inner dark)
      
      // Outer feather
      ctx.strokeStyle = `${windColor}, ${0.05 * alphaMultiplier})`;
      ctx.lineWidth = 55;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();

      // Middle bleed
      ctx.strokeStyle = `${windColor}, ${0.07 * alphaMultiplier})`;
      ctx.lineWidth = 35;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();

      // Inner core
      ctx.strokeStyle = `${windColor}, ${0.09 * alphaMultiplier})`;
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();

      // Sketched ink line along wind path
      ctx.strokeStyle = isSelected ? `${windColor}, 0.65)` : `${windColor}, 0.3)`;
      ctx.lineWidth = 1.0;
      ctx.setLineDash([12, 10]);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
      ctx.setLineDash([]); // clear

      // Draw arrow tip on the last segment to show current direction
      const lastIdx = pts.length - 1;
      const pLast = pts[lastIdx];
      const pPrev = pts[lastIdx - 1];
      
      const dx = pLast.x - pPrev.x;
      const dy = pLast.y - pPrev.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0.1) {
        const udx = dx / len;
        const udy = dy / len;
        
        ctx.fillStyle = isSelected ? `${windColor}, 0.75)` : `${windColor}, 0.45)`;
        ctx.beginPath();
        ctx.moveTo(pLast.x, pLast.y);
        ctx.lineTo(pLast.x - udx * 16 + udy * 6, pLast.y - udy * 16 - udx * 6);
        ctx.lineTo(pLast.x - udx * 16 - udy * 6, pLast.y - udy * 16 + udx * 6);
        ctx.closePath();
        ctx.fill();
      }

      // Draw selected delete HUD handle
      if (isSelected && this.gameState === 'EDIT') {
        const delPos = this.getPathDeleteHandle(wind);

        // Selection outline corridor borders
        ctx.strokeStyle = `${windColor}, 0.15)`;
        ctx.lineWidth = 1.0;
        ctx.setLineDash([4, 4]);
        
        // Offset boundary lines
        const getOffsetPath = (dir) => {
          ctx.beginPath();
          for (let i = 0; i < pts.length - 1; i++) {
            const p1 = pts[i];
            const p2 = pts[i+1];
            const segDx = p2.x - p1.x;
            const segDy = p2.y - p1.y;
            const segLen = Math.sqrt(segDx*segDx + segDy*segDy);
            const nx = -segDy / segLen;
            const ny = segDx / segLen;
            const px = p1.x + nx * 125 * dir;
            const py = p1.y + ny * 125 * dir;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        };
        getOffsetPath(1);
        getOffsetPath(-1);
        ctx.setLineDash([]); // clear

        // Red erase button (drawn as wobbly hand sketch circle)
        ctx.fillStyle = this.hoveredHandle === 'delete' ? '#e11d48' : '#f43f5e';
        ctx.strokeStyle = '#2b2824';
        ctx.lineWidth = 1.8;
        
        ctx.beginPath();
        ctx.arc(delPos.x, delPos.y, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw White X
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(delPos.x - 4, delPos.y - 4);
        ctx.lineTo(delPos.x + 4, delPos.y + 4);
        ctx.moveTo(delPos.x + 4, delPos.y - 4);
        ctx.lineTo(delPos.x - 4, delPos.y + 4);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  drawGhostTutorialPath(ctx) {
    const pts = this.level.tutorialPath;
    if (!pts || pts.length < 2) return;

    ctx.save();

    // 1. Draw wider soft watercolor backing for the tutorial path
    ctx.save();
    ctx.globalAlpha = this.ghostOpacity * 0.06;
    ctx.strokeStyle = '#8c6d58'; // soft sepia
    ctx.lineWidth = 32;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
    ctx.restore();

    // 2. Draw dashed pencil guideline path
    ctx.save();
    ctx.globalAlpha = this.ghostOpacity * 0.35;
    ctx.strokeStyle = '#8c6d58';
    ctx.lineWidth = 2.0;
    ctx.setLineDash([6, 9]);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
    ctx.restore();

    // 3. Calculate animated brush position along path
    const time = performance.now() * 0.001;
    const cycleDuration = 3.5;
    const t = (time % cycleDuration) / cycleDuration;
    
    const progress = t * (pts.length - 1);
    const idx = Math.min(pts.length - 2, Math.floor(progress));
    const segT = progress - idx;
    
    const p1 = pts[idx];
    const p2 = pts[idx + 1];
    const bx = p1.x + (p2.x - p1.x) * segT;
    const by = p1.y + (p2.y - p1.y) * segT;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);

    // 4. Draw paint brush icon at the animated cursor position
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(angle);
    ctx.globalAlpha = this.ghostOpacity * 0.75;
    
    // Brush wooden handle (pointing backwards)
    ctx.strokeStyle = '#b08b6b'; // wood tan
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-28, -2);
    ctx.lineTo(-8, -1);
    ctx.stroke();
    
    // Silver brush ferrule
    ctx.fillStyle = '#9ca3af'; // silver grey
    ctx.fillRect(-8, -3, 4, 6);
    
    // Brush dark bristles
    ctx.fillStyle = '#4b5563'; // dark grey bristles
    ctx.beginPath();
    ctx.moveTo(-4, -3);
    ctx.quadraticCurveTo(2, -3, 6, 0); // brush tip at x=6
    ctx.quadraticCurveTo(2, 3, -4, 3);
    ctx.closePath();
    ctx.fill();
    
    // Watercolor tip drop glow (teal, since we paint teal wind)
    ctx.fillStyle = 'rgba(59, 163, 159, 0.7)';
    ctx.beginPath();
    ctx.arc(6, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();

    ctx.restore();
  }

  drawLotuses(ctx) {
    if (!this.activeLotuses) return;
    for (const lotus of this.activeLotuses) {
      ctx.save();
      ctx.translate(lotus.x, lotus.y);
      
      const pulse = Math.sin(performance.now() * 0.002 + lotus.seed * 10) * 1.2;
      const scale = 1.0 + Math.sin(performance.now() * 0.001 + lotus.seed) * 0.04;
      ctx.scale(scale, scale);
      
      if (lotus.bloomed) {
        // Draw golden glowing halo
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 28);
        glow.addColorStop(0, 'rgba(234, 179, 8, 0.25)'); // gold glow
        glow.addColorStop(1, 'rgba(234, 179, 8, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.fill();

        // Draw open pink petals (watercolor wash)
        ctx.fillStyle = 'rgba(242, 160, 180, 0.7)'; // soft pink watercolor
        ctx.strokeStyle = 'rgba(43, 40, 36, 0.6)'; // charcoal outline
        ctx.lineWidth = 1.0;
        
        for (let i = 0; i < 6; i++) {
          ctx.save();
          ctx.rotate((i / 6) * Math.PI * 2 + performance.now() * 0.0002);
          
          // Draw almond petal shape
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(8, -16 + pulse, 0, -22 + pulse);
          ctx.quadraticCurveTo(-8, -16 + pulse, 0, 0);
          ctx.fill();
          ctx.stroke();
          
          ctx.restore();
        }

        // Golden center bulb
        ctx.fillStyle = '#eab308'; // solid gold
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        // Draw closed bud (light green/pink wash sketch)
        ctx.fillStyle = 'rgba(182, 196, 172, 0.6)'; // green base
        ctx.strokeStyle = 'rgba(43, 40, 36, 0.5)';
        ctx.lineWidth = 1.0;
        
        // Bud base
        ctx.beginPath();
        ctx.ellipse(0, 4, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Petal petals wrapping closed
        ctx.fillStyle = 'rgba(242, 180, 190, 0.7)'; // pink tip
        ctx.beginPath();
        ctx.moveTo(-6, 2);
        ctx.quadraticCurveTo(0, -12, 0, -18 + pulse);
        ctx.quadraticCurveTo(6, 2, 0, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Outer sepals
        ctx.strokeStyle = 'rgba(43, 40, 36, 0.55)';
        ctx.beginPath();
        ctx.moveTo(-7, 2);
        ctx.quadraticCurveTo(-10, -5, -4, -10);
        ctx.moveTo(7, 2);
        ctx.quadraticCurveTo(10, -5, 4, -10);
        ctx.stroke();
      }
      
      ctx.restore();
    }
  }

  drawDrawingBrushTip(ctx) {
    const pos = this.tempDrawPoints[this.tempDrawPoints.length - 1];
    if (!pos) return;
    
    ctx.save();
    ctx.translate(pos.x, pos.y);
    
    // Angle the brush slightly
    ctx.rotate(-Math.PI / 4);
    
    // Wooden handle
    ctx.strokeStyle = '#b08b6b';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-35, -2);
    ctx.lineTo(-10, -1);
    ctx.stroke();
    
    // Ferrule
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(-10, -3.5, 4.5, 7);
    
    // Bristles
    ctx.fillStyle = '#4b5563';
    ctx.beginPath();
    ctx.moveTo(-5.5, -3.5);
    ctx.quadraticCurveTo(2, -3.5, 8, 0);
    ctx.quadraticCurveTo(2, 3.5, -5.5, 3.5);
    ctx.closePath();
    ctx.fill();
    
    // Wet paint tip (matching current level's wind colorHex)
    ctx.fillStyle = this.level.palette.windColorHex;
    ctx.beginPath();
    ctx.arc(8, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}

// Safe initialization handling readyState race conditions
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    const game = new GameController();
    game.init();
  });
} else {
  const game = new GameController();
  game.init();
}
