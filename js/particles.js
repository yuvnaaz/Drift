// Drift Particle System (Paper & Ink Art Direction)

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.maxParticles = 600;
    
    // Timers
    this.leafSpawnTimer = 0;
    this.fireflySpawnTimer = 0;
    this.windSpawnTimer = 0;
    this.birdSpawnTimer = 0;
    this.fogSpawnTimer = 0;

    // Viewport Screen Shake
    this.shakeIntensity = 0;
    this.shakeDecay = 0.88; // decay rate per frame
  }

  // Trigger viewport screen shake
  triggerShake(amount) {
    this.shakeIntensity = amount;
  }

  // Clear everything except ambient particles (e.g. on reset)
  clearTempParticles() {
    this.particles = this.particles.filter(p => p.type === 'leaf' || p.type === 'firefly' || p.type === 'bird');
  }

  // Clear all particles
  clearAll() {
    this.particles = [];
    this.shakeIntensity = 0;
  }

  // Spawn a particle
  spawn(p) {
    if (this.particles.length < this.maxParticles) {
      this.particles.push(p);
    }
  }

  // Spawn dissolving red feedback stroke for failed/short drawings
  spawnBadStroke(pathPoints) {
    if (!pathPoints || pathPoints.length < 2) return;
    const life = 35;
    this.spawn({
      type: 'badStroke',
      points: [...pathPoints],
      life: life,
      maxLife: life,
      alpha: 1.0
    });
  }

  // Spawn wet paper sinking concentric ripples
  spawnSinkRipples(x, y) {
    for (let i = 0; i < 5; i++) {
      const life = 50 + i * 22;
      this.spawn({
        type: 'wake',
        x,
        y,
        radius: 3,
        angle: Math.random() * Math.PI * 2, // wraps full circle
        life: life,
        maxLife: life,
        alpha: 0.65 - (i * 0.1) // concentric fades
      });
    }
  }

  spawnVictoryBurst(x, y, count = 100) {
    const goldColors = [
      'rgba(217, 119, 6, 0.75)',  // Amber/gold
      'rgba(234, 179, 8, 0.8)',   // Yellow
      'rgba(253, 224, 71, 0.75)', // Soft yellow
      'rgba(244, 239, 226, 0.95)' // Cream
    ];
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 4.0;
      const life = 60 + Math.random() * 60;
      
      this.spawn({
        type: 'victory',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 3,
        color: goldColors[Math.floor(Math.random() * goldColors.length)],
        life: life,
        maxLife: life,
        alpha: 1.0
      });
    }
  }

  update(physics, paths, boat, level, dt) {
    const rocks = level.rocks;
    const weather = level.weather || 'none';

    // Decay screen shake intensity
    this.shakeIntensity *= Math.pow(this.shakeDecay, dt);
    if (this.shakeIntensity < 0.05) this.shakeIntensity = 0;

    // 1. Spawn Sakura Leaves (constantly drift from top-right to bottom-left)
    this.leafSpawnTimer += dt;
    if (this.leafSpawnTimer > 60) {
      this.leafSpawnTimer = 0;
      const life = 350 + Math.random() * 200;
      this.spawn({
        type: 'leaf',
        x: Math.random() * 1400 - 100, // spawn offscreen right/top
        y: -30,
        vx: -1.2 - Math.random() * 0.8, // drift leftward
        vy: 0.8 + Math.random() * 0.6,   // drift downward
        size: 5 + Math.random() * 5,
        color: Math.random() > 0.4 
          ? `rgba(242, 191, 196, ${0.45 + Math.random() * 0.2})` // Sakura pink
          : `rgba(182, 196, 172, ${0.4 + Math.random() * 0.2})`, // Soft sage green
        angle: Math.random() * Math.PI * 2,
        vangle: (Math.random() - 0.5) * 0.02,
        life: life,
        maxLife: life,
        alpha: 0
      });
    }

    // 2. Spawn Fireflies around organic rocks
    if (rocks && rocks.length > 0) {
      this.fireflySpawnTimer += dt;
      if (this.fireflySpawnTimer > 40) {
        this.fireflySpawnTimer = 0;
        
        // Pick a random rock to hover around
        const rock = rocks[Math.floor(Math.random() * rocks.length)];
        const spawnAngle = Math.random() * Math.PI * 2;
        const dist = rock.radius + 10 + Math.random() * 60;
        const px = rock.x + Math.cos(spawnAngle) * dist;
        const py = rock.y + Math.sin(spawnAngle) * dist;
        
        const life = 120 + Math.random() * 120;
        this.spawn({
          type: 'firefly',
          x: px,
          y: py,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          size: 2 + Math.random() * 2,
          life: life,
          maxLife: life,
          alpha: 0
        });
      }
    }

    // 3. Spawn sky birds occasionally (high depth layer)
    this.birdSpawnTimer += dt;
    if (this.birdSpawnTimer > 350) {
      this.birdSpawnTimer = 0;
      const life = 400;
      this.spawn({
        type: 'bird',
        x: 1300, // spawn far right
        y: 80 + Math.random() * 180, // high altitude
        vx: -1.8 - Math.random() * 0.6,
        vy: (Math.random() - 0.5) * 0.15,
        size: 10 + Math.random() * 6,
        life: life,
        maxLife: life,
        alpha: 0
      });
    }

    // 3b. Spawn rain particles
    if (weather === 'rain') {
      const spawnCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < spawnCount; i++) {
        const rx = Math.random() * 1400 - 100;
        const targetY = Math.random() * 720 + 60;
        this.spawn({
          type: 'rain',
          x: rx,
          y: -10,
          vx: -2.5 - Math.random() * 1.5,
          vy: 12 + Math.random() * 4,
          targetY: targetY,
          life: 80,
          maxLife: 80,
          alpha: 0.45 + Math.random() * 0.35
        });
      }
    }

    // 3c. Spawn fog particles
    if (weather === 'fog') {
      this.fogSpawnTimer += dt;
      if (this.fogSpawnTimer > 120) {
        this.fogSpawnTimer = 0;
        const life = 700 + Math.random() * 400;
        this.spawn({
          type: 'fog',
          x: -200 - Math.random() * 100,
          y: Math.random() * 800,
          vx: 0.18 + Math.random() * 0.22,
          vy: (Math.random() - 0.5) * 0.08,
          radius: 140 + Math.random() * 80,
          angle: Math.random() * Math.PI * 2,
          vangle: (Math.random() - 0.5) * 0.0015,
          life: life,
          maxLife: life,
          alpha: 0
        });
      }
    }

    // 4. Spawn Wind path particles
    if (paths && paths.length > 0) {
      this.windSpawnTimer += dt;
      const spawnRate = Math.max(2, 5 - paths.length);
      if (this.windSpawnTimer >= spawnRate) {
        this.windSpawnTimer = 0;
        
        // Pick random path
        const path = paths[Math.floor(Math.random() * paths.length)];
        const pts = path.points;
        if (pts && pts.length >= 2) {
          // Spawn at a random segment point along the stroke path
          const idx = Math.floor(Math.random() * (pts.length - 1));
          const p1 = pts[idx];
          const p2 = pts[idx+1];
          const t = Math.random();
          
          const px = p1.x + (p2.x - p1.x) * t + (Math.random() - 0.5) * 25;
          const py = p1.y + (p2.y - p1.y) * t + (Math.random() - 0.5) * 25;
          
          const life = 70 + Math.random() * 50;
          this.spawn({
            type: 'wind',
            x: px,
            y: py,
            prevX: px,
            prevY: py,
            vx: 0,
            vy: 0,
            life: life,
            maxLife: life,
            alpha: 0
          });
        }
      }
    }

    // 5. Spawn Boat wake sketched ripples
    if (boat.isActive) {
      const speed = Math.sqrt(boat.vx * boat.vx + boat.vy * boat.vy);
      if (speed > 0.2) {
        const sternX = boat.x - Math.cos(boat.angle) * (boat.width / 2 - 4);
        const sternY = boat.y - Math.sin(boat.angle) * (boat.width / 2 - 4);
        
        if (Math.random() < speed * 0.35) {
          const life = 60 + Math.random() * 35;
          this.spawn({
            type: 'wake',
            x: sternX,
            y: sternY,
            radius: 1.5,
            angle: boat.angle + Math.PI, // opposite direction
            life: life,
            maxLife: life,
            alpha: 0.55
          });
        }
      }
    }

    // 6. Update all active particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      if (p.type === 'leaf') {
        p.angle += p.vangle * dt;
        p.x += p.vx * dt + Math.sin(p.life * 0.03) * 0.4; // sway drift
        p.y += p.vy * dt;
        
        // Fade boundary edges
        const lifeRatio = p.life / p.maxLife;
        if (lifeRatio > 0.85) {
          p.alpha = (1.0 - lifeRatio) / 0.15;
        } else {
          p.alpha = lifeRatio / 0.85;
        }
        
      } else if (p.type === 'firefly') {
        // Brownian walk
        p.vx += (Math.random() - 0.5) * 0.08 * dt;
        p.vy += (Math.random() - 0.5) * 0.08 * dt;
        // Damping
        p.vx *= Math.pow(0.92, dt);
        p.vy *= Math.pow(0.92, dt);
        
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        
        // Pulsing glow alpha
        const pulse = Math.sin(performance.now() * 0.006 + p.life) * 0.25;
        const lifeRatio = p.life / p.maxLife;
        p.alpha = lifeRatio * (0.5 + pulse);
        
      } else if (p.type === 'bird') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        
        const lifeRatio = p.life / p.maxLife;
        if (lifeRatio > 0.9) {
          p.alpha = (1.0 - lifeRatio) / 0.1;
        } else if (lifeRatio < 0.15) {
          p.alpha = lifeRatio / 0.15;
        } else {
          p.alpha = 1.0;
        }
        p.alpha *= 0.35; // Muted opacity for background depth
        
      } else if (p.type === 'wind') {
        p.prevX = p.x;
        p.prevY = p.y;
        
        // Read vector forces
        const force = physics.getTotalWindForce(paths, p.x, p.y);
        p.vx += force.x * 0.55 * dt;
        p.vy += force.y * 0.55 * dt;
        p.vx *= Math.pow(0.91, dt);
        p.vy *= Math.pow(0.91, dt);
        
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        
        const lifeRatio = p.life / p.maxLife;
        if (lifeRatio > 0.8) {
          p.alpha = (1.0 - lifeRatio) / 0.2;
        } else {
          p.alpha = lifeRatio / 0.8;
        }
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        p.alpha *= Math.min(1.0, speed * 0.45) * 0.45;
        
      } else if (p.type === 'wake') {
        p.radius += 0.55 * dt;
        p.alpha = (p.life / p.maxLife) * 0.6;
        
      } else if (p.type === 'victory') {
        p.vx *= Math.pow(0.95, dt);
        p.vy *= Math.pow(0.95, dt);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha = p.life / p.maxLife;
      } else if (p.type === 'badStroke') {
        // Just fade out bad watercolor strokes
        p.alpha = p.life / p.maxLife;
      } else if (p.type === 'rain') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.y >= p.targetY) {
          p.life = 0; // terminate
          this.spawn({
            type: 'rainRipple',
            x: p.x,
            y: p.y,
            radius: 0.5,
            maxRadius: 6 + Math.random() * 8,
            life: 30,
            maxLife: 30,
            alpha: p.alpha * 0.7
          });
        }
      } else if (p.type === 'rainRipple') {
        p.radius += 0.45 * dt;
        p.alpha = (p.life / p.maxLife) * 0.5;
      } else if (p.type === 'fog') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.angle += p.vangle * dt;
        
        const lifeRatio = p.life / p.maxLife;
        if (lifeRatio > 0.8) {
          p.alpha = (1.0 - lifeRatio) / 0.2;
        } else {
          p.alpha = lifeRatio / 0.8;
        }
        p.alpha *= 0.12; // soft transparency overlay
      }
    }
  }

  draw(ctx, layer = 'middle') {
    ctx.save();
    
    for (const p of this.particles) {
      // Background layer drawings (leaves, fireflies, birds, wakes)
      if (layer === 'background') {
        if (p.type === 'wake') {
          // Draw wobbly ink wake line
          ctx.strokeStyle = `rgba(43, 40, 36, ${p.alpha * 0.25})`; // charcoal shade
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          
          // Draw a sketched arc (slightly wobbly by adding wave term)
          const wobble = Math.sin(p.radius + p.life) * 1.5;
          const r = p.radius + wobble;
          
          ctx.arc(p.x, p.y, Math.max(1, r), p.angle - Math.PI / 3, p.angle + Math.PI / 3);
          ctx.stroke();
        }
        
        if (p.type === 'firefly') {
          // Fireflies soft yellow lantern glow
          ctx.fillStyle = `rgba(226, 142, 19, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        
        if (p.type === 'leaf') {
          ctx.fillStyle = p.color;
          ctx.strokeStyle = 'rgba(43, 40, 36, 0.1)';
          ctx.lineWidth = 0.5;
          
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          
          // Draw leaf/petal shape (almond curved paths)
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.quadraticCurveTo(p.size * 0.6, -p.size * 0.3, 0, p.size);
          ctx.quadraticCurveTo(-p.size * 0.6, -p.size * 0.3, 0, -p.size);
          ctx.fill();
          ctx.stroke();
          
          ctx.restore();
        }

        if (p.type === 'rainRipple') {
          ctx.strokeStyle = `rgba(43, 40, 36, ${p.alpha * 0.18})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.radius, p.radius * 0.45, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } 
      
      // Foreground wind layer drawings
      else if (layer === 'wind') {
        if (p.type === 'wind') {
          const dx = p.x - p.prevX;
          const dy = p.y - p.prevY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist > 1.2) {
            ctx.strokeStyle = `rgba(59, 163, 159, ${p.alpha * 1.2})`; // Teal stroke color
            ctx.lineWidth = 2.0;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(p.prevX, p.prevY);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }
        }
        
        if (p.type === 'badStroke' && p.points && p.points.length >= 2) {
          ctx.save();
          // Draw wobbly expanding red watercolor bleed
          ctx.strokeStyle = `rgba(212, 75, 60, ${p.alpha * 0.45})`; 
          ctx.lineWidth = 24 * (1.0 + (1.0 - p.alpha) * 0.45); // expands as it fades
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          ctx.beginPath();
          ctx.moveTo(p.points[0].x, p.points[0].y);
          for (let idx = 1; idx < p.points.length; idx++) {
            ctx.lineTo(p.points[idx].x, p.points[idx].y);
          }
          ctx.stroke();
          
          // Draw thin interior charcoal ink line
          ctx.strokeStyle = `rgba(43, 40, 36, ${p.alpha * 0.25})`;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(p.points[0].x, p.points[0].y);
          for (let idx = 1; idx < p.points.length; idx++) {
            ctx.lineTo(p.points[idx].x, p.points[idx].y);
          }
          ctx.stroke();
          ctx.restore();
        }
      }
      
      // Birds in sky / highest overlay layer
      else if (layer === 'sky') {
        if (p.type === 'bird') {
          ctx.strokeStyle = `rgba(43, 40, 36, ${p.alpha})`; // charcoal silhouette
          ctx.lineWidth = 1.2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          ctx.save();
          ctx.translate(p.x, p.y);
          
          // Flapping wing trigonometry
          const flap = Math.sin(p.life * 0.16) * (p.size * 0.45);
          
          // Draw V wing stroke: (Left WingTip) -> (Center Body) -> (Right WingTip)
          ctx.beginPath();
          ctx.moveTo(-p.size * 0.8, -flap);
          ctx.quadraticCurveTo(-p.size * 0.4, -p.size * 0.15, 0, 0);
          ctx.quadraticCurveTo(p.size * 0.4, -p.size * 0.15, p.size * 0.8, -flap);
          ctx.stroke();
          
          ctx.restore();
        }
        
        if (p.type === 'victory') {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        if (p.type === 'rain') {
          ctx.strokeStyle = `rgba(43, 40, 36, ${p.alpha * 0.25})`; // charcoal shade
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 1.5, p.y + p.vy * 1.5);
          ctx.stroke();
        }

        if (p.type === 'fog') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.radius);
          grad.addColorStop(0, `rgba(255, 255, 255, ${p.alpha})`);
          grad.addColorStop(0.5, `rgba(255, 255, 255, ${p.alpha * 0.4})`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }
    
    ctx.restore();
  }
}
export default ParticleSystem;
