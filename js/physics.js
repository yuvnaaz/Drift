// Drift 2D Physics Engine (Paper & Ink Spline Redesign)

// Helper to calculate the organic wobbly radius of an island at a given angle
export function getRockRadiusAt(rock, angle) {
  if (!rock.seed) return rock.radius; 
  
  const s = rock.seed;
  const v = rock.variance || 0.2;
  
  const w1 = Math.sin(angle * 3 + s) * 0.45;
  const w2 = Math.cos(angle * 5 - s * 2) * 0.35;
  const w3 = Math.sin(angle * 2 + s * 4) * 0.2;
  
  const factor = 1.0 + (w1 + w2 + w3) * v;
  return rock.radius * factor;
}

export class PhysicsEngine {
  constructor() {
    this.gravity = 0;
    this.waterDrag = 0.015; 
    this.angularDrag = 0.05;
    this.boatMass = 1.0;
    this.boatInertia = 1.0;
    this.restitution = 0.3; 
    this.alignTorqueCoeff = 0.006; 
    this.boatRadius = 22; 
    
    // Impact threshold: normal velocity > 1.3 causes the paper boat to sink
    this.impactThreshold = 1.28; 
  }

  createBoat(x, y, angle = 0) {
    return {
      x,
      y,
      vx: 0,
      vy: 0,
      angle,
      vangle: 0,
      width: 52, 
      height: 26,
      mass: this.boatMass,
      inertia: this.boatInertia,
      isActive: false,
      isSinking: false,
      sinkTimer: 0
    };
  }

  getWindForceAt(path, x, y) {
    const points = path.points;
    if (!points || points.length < 2) return { x: 0, y: 0 };

    let minDist = Infinity;
    let closestSegIdx = -1;
    let closestT = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const S = points[i];
      const E = points[i+1];
      
      const vx = E.x - S.x;
      const vy = E.y - S.y;
      const lenSq = vx * vx + vy * vy;
      if (lenSq < 1) continue;

      const ux = x - S.x;
      const uy = y - S.y;

      const t = (ux * vx + uy * vy) / lenSq;
      const tClamped = Math.max(0, Math.min(1, t));

      const cx = S.x + tClamped * vx;
      const cy = S.y + tClamped * vy;
      
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < minDist) {
        minDist = dist;
        closestSegIdx = i;
        closestT = t;
      }
    }

    if (closestSegIdx === -1) return { x: 0, y: 0 };

    const R = 125; 
    if (minDist > R) return { x: 0, y: 0 };

    const S = points[closestSegIdx];
    const E = points[closestSegIdx+1];
    const vx = E.x - S.x;
    const vy = E.y - S.y;
    const segLen = Math.sqrt(vx * vx + vy * vy);
    if (segLen < 0.1) return { x: 0, y: 0 };
    
    const dx = vx / segLen;
    const dy = vy / segLen;

    const ratio = minDist / R;
    const lateralFalloff = Math.cos(ratio * Math.PI * 0.5);

    let longFalloff = 1.0;
    if (closestSegIdx === 0 && closestT < 0) {
      const distBehind = -closestT * segLen;
      const fadeDist = 40;
      longFalloff = Math.max(0, 1.0 - distBehind / fadeDist);
    } else if (closestSegIdx === points.length - 2 && closestT > 1) {
      const distAhead = (closestT - 1) * segLen;
      const fadeDist = 90;
      longFalloff = Math.max(0, 1.0 - distAhead / fadeDist);
    }

    const strength = 0.095 * lateralFalloff * longFalloff;

    return {
      x: dx * strength,
      y: dy * strength
    };
  }

  getTotalWindForce(paths, x, y) {
    let fx = 0;
    let fy = 0;
    for (const path of paths) {
      const force = this.getWindForceAt(path, x, y);
      fx += force.x;
      fy += force.y;
    }
    return { x: fx, y: fy };
  }

  update(boat, paths, rocks, dt) {
    if (!boat.isActive) return false;

    // Sinking dynamics (spin and drag down in vortex)
    if (boat.isSinking) {
      boat.vx *= Math.pow(0.85, dt);
      boat.vy *= Math.pow(0.85, dt);
      boat.vangle += 0.015 * dt; // spin faster
      boat.x += boat.vx * dt;
      boat.y += boat.vy * dt;
      boat.angle += boat.vangle * dt;
      boat.sinkTimer += dt;
      return false; // skip normal collisions
    }

    // 1. Accumulate forces
    const windForce = this.getTotalWindForce(paths, boat.x, boat.y);
    const dragForceX = -this.waterDrag * boat.vx;
    const dragForceY = -this.waterDrag * boat.vy;

    const totalForceX = windForce.x + dragForceX;
    const totalForceY = windForce.y + dragForceY;

    // 2. Integrate linear velocity
    const ax = totalForceX / boat.mass;
    const ay = totalForceY / boat.mass;
    
    boat.vx += ax * dt;
    boat.vy += ay * dt;
    boat.x += boat.vx * dt;
    boat.y += boat.vy * dt;

    // 3. Torques and rotation
    const speed = Math.sqrt(boat.vx * boat.vx + boat.vy * boat.vy);
    let torque = 0;

    if (speed > 0.15) {
      const travelAngle = Math.atan2(boat.vy, boat.vx);
      let angleDiff = travelAngle - boat.angle;
      angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
      torque = angleDiff * speed * this.alignTorqueCoeff;
    }

    const waveSway = Math.sin(performance.now() * 0.001) * 0.0001;
    const torqueDrag = -this.angularDrag * boat.vangle;

    const alpha = (torque + torqueDrag + waveSway) / boat.inertia;
    boat.vangle += alpha * dt;
    boat.angle += boat.vangle * dt;
    boat.angle = Math.atan2(Math.sin(boat.angle), Math.cos(boat.angle));

    // 4. Resolve Collisions
    let collisionType = false; // false, 'bounce', 'sink'

    // Bounds check
    const borderL = this.boatRadius;
    const borderR = 1200 - this.boatRadius;
    const borderT = this.boatRadius;
    const borderB = 800 - this.boatRadius;

    if (boat.x < borderL) {
      boat.x = borderL;
      boat.vx = -boat.vx * this.restitution;
      boat.vangle += (Math.random() - 0.5) * 0.04;
      collisionType = 'bounce';
    } else if (boat.x > borderR) {
      boat.x = borderR;
      boat.vx = -boat.vx * this.restitution;
      boat.vangle += (Math.random() - 0.5) * 0.04;
      collisionType = 'bounce';
    }

    if (boat.y < borderT) {
      boat.y = borderT;
      boat.vy = -boat.vy * this.restitution;
      boat.vangle += (Math.random() - 0.5) * 0.04;
      collisionType = 'bounce';
    } else if (boat.y > borderB) {
      boat.y = borderB;
      boat.vy = -boat.vy * this.restitution;
      boat.vangle += (Math.random() - 0.5) * 0.04;
      collisionType = 'bounce';
    }

    // Organic Rocks Check
    for (const rock of rocks) {
      const rx = rock.x;
      const ry = rock.y;
      
      const dx = boat.x - rx;
      const dy = boat.y - ry;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const angle = Math.atan2(dy, dx);
      const rockRad = getRockRadiusAt(rock, angle);
      const minDist = rockRad + this.boatRadius;

      if (dist < minDist) {
        const nx = dx / dist;
        const ny = dy / dist;

        const penetration = minDist - dist;
        boat.x += nx * penetration;
        boat.y += ny * penetration;

        const vNormal = boat.vx * nx + boat.vy * ny;

        if (vNormal < 0) {
          const impactSpeed = Math.abs(vNormal);
          
          // Speed-threshold: Hitting hard sinks the boat, soft hits slide/bounce
          if (impactSpeed > this.impactThreshold) {
            boat.isSinking = true;
            boat.isActive = false;
            collisionType = 'sink';
            break;
          } else {
            const vNormalNew = -vNormal * this.restitution;
            
            const tx = -ny;
            const ty = nx;
            const vTangential = boat.vx * tx + boat.vy * ty;
            const vTangentialNew = vTangential * 0.82; 

            boat.vx = nx * vNormalNew + tx * vTangentialNew;
            boat.vy = ny * vNormalNew + ty * vTangentialNew;

            const headingX = Math.cos(boat.angle);
            const headingY = Math.sin(boat.angle);
            const cross = nx * headingY - ny * headingX;
            boat.vangle += cross * impactSpeed * 0.07;
            
            collisionType = 'bounce';
          }
        }
      }
    }

    return collisionType;
  }
}
export default PhysicsEngine;
