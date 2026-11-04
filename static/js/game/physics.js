/**
 * RACING ZONE - Vehicle Physics & Particle Simulator
 * High-speed 2D arcade-sim dynamics with drift mechanics & particle trails.
 */

class VehiclePhysics {
  constructor(config = {}) {
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.angle = config.angle || 0; // 0 = pointing right (positive X)

    // Base specs
    this.slug = config.slug || 'nissan-gtr-nismo';
    this.name = config.name || 'GT-R Nismo';
    this.bodyColor = config.color || '#f2f2f2';
    this.isAI = !!config.isAI;

    // Real-life performance stats
    this.topSpeedMph = config.top_speed_mph || 205;
    this.accel060 = config.accel_0_60 || 2.9;
    this.horsepower = config.horsepower || 600;
    this.weightKg = config.weight_kg || 1500;
    this.handlingScore = config.handling_score || 90;
    this.brakingScore = config.braking_score || 90;

    // Upgrades
    this.engineLevel = config.engine_level || 1;
    this.handlingLevel = config.handling_level || 1;
    this.nitroLevel = config.nitro_level || 1;

    // Converted physical parameters
    // Top speed in game units (pixels/sec): ~200 mph -> ~750 px/s
    const engineBonus = (this.engineLevel - 1) * 0.05;
    this.maxSpeed = (this.topSpeedMph * 3.8) * (1 + engineBonus);

    // Acceleration power
    const powerToWeight = (this.horsepower / this.weightKg) * 850;
    this.accelPower = powerToWeight * (1 + engineBonus);

    // Braking & Drag
    const brakeBonus = (this.handlingLevel - 1) * 0.05;
    this.brakePower = (this.brakingScore * 14) * (1 + brakeBonus);
    this.dragCoeff = 0.985;
    this.angularDrag = 0.92;

    // Steer & Drift
    this.steerPower = (0.0035 + (this.handlingScore / 100) * 0.0025) * (1 + brakeBonus);
    this.gripFactor = 0.88 + (this.handlingScore / 100) * 0.08;

    // Motion State
    this.speed = 0;
    this.vx = 0;
    this.vy = 0;
    this.angularVelocity = 0;
    this.steerAngle = 0;
    this.driftSlip = 0;
    this.isDrifting = false;
    this.isBraking = false;
    this.isThrottle = false;

    // Nitro System
    this.nitroCapacity = 100 + (this.nitroLevel - 1) * 20;
    this.nitroAmount = this.nitroCapacity;
    this.isNitroActive = false;

    // Lap / Race progress state
    this.lap = 1;
    this.currentCheckpoint = 0;
    this.totalCheckpointsHit = 0;
    this.currentLapTime = 0;
    this.bestLapTime = 0;
    this.raceFinished = false;
    this.finishTime = 0;
    this.finishRank = 1;

    // Dimensions for collision
    this.width = 46;
    this.length = 92;
    this.radius = 38;
  }

  update(dt, input, trackHelper) {
    if (this.raceFinished) {
      this.speed *= 0.95;
      this.vx = Math.cos(this.angle) * this.speed;
      this.vy = Math.sin(this.angle) * this.speed;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      return;
    }

    // 1. Throttle & Nitro
    this.isThrottle = input.throttle;
    this.isBraking = input.brake;
    const handbrake = input.handbrake;

    // Nitro logic
    if (input.nitro && this.nitroAmount > 0 && this.speed > 50) {
      this.isNitroActive = true;
      this.nitroAmount = Math.max(0, this.nitroAmount - dt * 25);
    } else {
      this.isNitroActive = false;
      // Passive nitro refill
      this.nitroAmount = Math.min(this.nitroCapacity, this.nitroAmount + dt * 4);
    }

    const nitroMult = this.isNitroActive ? 1.45 : 1.0;
    const currentMaxSpeed = this.maxSpeed * (this.isNitroActive ? 1.25 : 1.0);

    // Acceleration
    if (this.isThrottle) {
      if (this.speed < currentMaxSpeed) {
        this.speed += this.accelPower * nitroMult * dt;
      }
    } else if (this.isBraking) {
      // Decelerate / Reverse
      if (this.speed > 10) {
        this.speed -= this.brakePower * dt;
      } else {
        this.speed = Math.max(-180, this.speed - (this.accelPower * 0.4) * dt);
      }
    } else {
      // Rolling natural engine resistance
      this.speed *= Math.pow(this.dragCoeff, dt * 60);
    }

    // Check if on road vs off road (grass/curbs)
    const onRoad = trackHelper ? trackHelper.isPointOnRoad(this.x, this.y) : true;
    if (!onRoad) {
      // Grass friction reduces max speed and slows down car
      this.speed *= Math.pow(0.92, dt * 60);
    }

    // 2. Steering & Turning
    let turnInput = 0;
    if (input.left) turnInput -= 1;
    if (input.right) turnInput += 1;

    this.steerAngle = turnInput * 0.45; // Front wheel visual angle

    // Turning rate scales with speed
    const speedRatio = Math.min(1.0, Math.abs(this.speed) / 400);
    const speedPenalty = Math.max(0.4, 1.0 - (Math.abs(this.speed) / currentMaxSpeed) * 0.45);

    if (Math.abs(this.speed) > 5) {
      const dir = this.speed >= 0 ? 1 : -1;
      let effectiveSteer = turnInput * this.steerPower * speedRatio * speedPenalty * dir;

      if (handbrake) {
        effectiveSteer *= 1.7; // Hard drift snap
      }
      this.angularVelocity = effectiveSteer;
    } else {
      this.angularVelocity = 0;
    }

    this.angle += this.angularVelocity * (dt * 60);

    // 3. Drift & Lateral Slide Mechanics
    const forwardX = Math.cos(this.angle);
    const forwardY = Math.sin(this.angle);

    // Current heading velocity
    const targetVx = forwardX * this.speed;
    const targetVy = forwardY * this.speed;

    let lateralGrip = this.gripFactor;
    if (handbrake) {
      lateralGrip = 0.55; // Break traction
      this.isDrifting = Math.abs(this.speed) > 120;
    } else {
      // Drift threshold: high speed + sharp turn
      const turnForce = Math.abs(this.angularVelocity) * Math.abs(this.speed);
      if (turnForce > 180) {
        lateralGrip = 0.72;
        this.isDrifting = true;
      } else {
        this.isDrifting = false;
      }
    }

    // Lerp velocity toward heading with grip
    const gripDt = Math.min(1.0, lateralGrip * dt * 14);
    this.vx += (targetVx - this.vx) * gripDt;
    this.vy += (targetVy - this.vy) * gripDt;

    // Drift slip angle
    const actualHeading = Math.atan2(this.vy, this.vx);
    this.driftSlip = Math.abs(actualHeading - this.angle);

    // 4. Update Coordinates
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // 5. Lap Timing & Checkpoints
    if (trackHelper) {
      this.currentLapTime += dt;
      trackHelper.checkVehicleProgress(this);
    }
  }

  getSpeedMph() {
    return Math.max(0, Math.round((Math.abs(this.speed) / 3.8)));
  }

  getRpmRatio() {
    const mph = this.getSpeedMph();
    // 6-gear simulation
    const gearRatios = [35, 70, 110, 155, 205, 275];
    let gear = 1;
    for (let i = 0; i < gearRatios.length; i++) {
      if (mph <= gearRatios[i]) {
        gear = i + 1;
        break;
      }
    }
    const prevMax = gear === 1 ? 0 : gearRatios[gear - 2];
    const gearMax = gearRatios[gear - 1];
    const rpm = (mph - prevMax) / (gearMax - prevMax);
    return { rpm: Math.min(1.0, Math.max(0.15, rpm)), gear };
  }
}

/** Particle System for Tire Skidmarks, Smoke, and Collision Sparks */
class ParticleSystem {
  constructor() {
    this.skidmarks = []; // { x1, y1, x2, y2, alpha, width }
    this.smokes = [];    // { x, y, vx, vy, size, alpha, maxLife, life }
    this.sparks = [];    // { x, y, vx, vy, color, life, maxLife }
    this.maxSkids = 450;
  }

  addSkidmark(x1, y1, x2, y2, alpha = 0.5) {
    if (this.skidmarks.length > this.maxSkids) {
      this.skidmarks.shift();
    }
    this.skidmarks.push({ x1, y1, x2, y2, alpha, width: 8 });
  }

  emitSmoke(x, y, vx, vy) {
    if (this.smokes.length > 120) return;
    this.smokes.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: vx * 0.2 + (Math.random() - 0.5) * 20,
      vy: vy * 0.2 + (Math.random() - 0.5) * 20,
      size: 6 + Math.random() * 6,
      alpha: 0.45,
      life: 0,
      maxLife: 0.6 + Math.random() * 0.4
    });
  }

  emitSparks(x, y, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 220;
      this.sparks.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.2,
        color: Math.random() > 0.4 ? '#ffea00' : '#ff3300'
      });
    }
  }

  update(dt) {
    // Update smokes
    for (let i = this.smokes.length - 1; i >= 0; i--) {
      const s = this.smokes[i];
      s.life += dt;
      if (s.life >= s.maxLife) {
        this.smokes.splice(i, 1);
        continue;
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.size += dt * 25;
      s.alpha = (1 - s.life / s.maxLife) * 0.4;
    }

    // Update sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const sp = this.sparks[i];
      sp.life += dt;
      if (sp.life >= sp.maxLife) {
        this.sparks.splice(i, 1);
        continue;
      }
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
    }
  }

  drawSkids(ctx) {
    ctx.save();
    ctx.lineCap = 'round';
    for (const skid of this.skidmarks) {
      ctx.strokeStyle = `rgba(10, 10, 14, ${skid.alpha})`;
      ctx.lineWidth = skid.width;
      ctx.beginPath();
      ctx.moveTo(skid.x1, skid.y1);
      ctx.lineTo(skid.x2, skid.y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawParticles(ctx) {
    ctx.save();
    // Smoke
    for (const s of this.smokes) {
      ctx.fillStyle = `rgba(180, 190, 205, ${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sparks
    for (const sp of this.sparks) {
      const progress = sp.life / sp.maxLife;
      ctx.fillStyle = sp.color;
      ctx.globalAlpha = 1 - progress;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 2.5 * (1 - progress), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
