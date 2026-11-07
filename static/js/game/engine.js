/**
 * RACING ZONE - High Performance 60FPS Game Engine
 */

class RacingGameEngine {
  constructor(canvasId, minimapCanvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.minimapCanvas = document.getElementById(minimapCanvasId);
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

    // Viewport dimensions
    this.width = this.canvas.width = 1280;
    this.height = this.canvas.height = 720;

    // State
    this.state = 'STOPPED'; // 'COUNTDOWN', 'RACING', 'FINISHED', 'PAUSED'
    this.lastTime = 0;
    this.countdownTimer = 3;
    this.raceTotalTime = 0;
    this.totalLaps = 3;

    // Camera
    this.camera = { x: 0, y: 0, zoom: 1.0 };

    // Game objects
    this.player = null;
    this.aiCars = [];
    this.allVehicles = [];
    this.particles = new ParticleSystem();
    this.trackData = null;

    // Input state
    this.keys = {
      up: false, down: false, left: false, right: false,
      handbrake: false, nitro: false
    };

    // Pre-rendered offscreen track cache
    this.trackCanvas = document.createElement('canvas');
    this.trackCtx = this.trackCanvas.getContext('2d');

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) this.keys.up = true;
      if (['ArrowDown', 'KeyS'].includes(e.code)) this.keys.down = true;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) this.keys.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) this.keys.right = true;
      if (e.code === 'Space') { this.keys.handbrake = true; e.preventDefault(); }
      if (['ShiftLeft', 'KeyN'].includes(e.code)) this.keys.nitro = true;
    });

    window.addEventListener('keyup', (e) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) this.keys.up = false;
      if (['ArrowDown', 'KeyS'].includes(e.code)) this.keys.down = false;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) this.keys.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) this.keys.right = false;
      if (e.code === 'Space') this.keys.handbrake = false;
      if (['ShiftLeft', 'KeyN'].includes(e.code)) this.keys.nitro = false;
    });

    // Touch controls for mobile
    const bindTouch = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[key] = true; });
      el.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[key] = false; });
      el.addEventListener('mousedown', () => { this.keys[key] = true; });
      el.addEventListener('mouseup', () => { this.keys[key] = false; });
    };

    bindTouch('btnSteerLeft', 'left');
    bindTouch('btnSteerRight', 'right');
    bindTouch('btnGas', 'up');
    bindTouch('btnBrake', 'down');
    bindTouch('btnHandbrake', 'handbrake');
    bindTouch('btnNitro', 'nitro');
  }

  setupRace(trackSlug, playerCarConfig, aiCarConfigs) {
    this.trackData = window.RacingTracks[trackSlug] || window.RacingTracks['monaco-city-circuit'];
    this.totalLaps = this.trackData.laps;

    // Resize world offscreen track
    this.trackCanvas.width = this.trackData.worldWidth;
    this.trackCanvas.height = this.trackData.worldHeight;
    this.renderTrackToCache();

    // Spawn player vehicle
    const grid = this.trackData.startGrid;
    this.player = new VehiclePhysics({
      ...playerCarConfig,
      x: grid[0].x,
      y: grid[0].y,
      angle: grid[0].angle,
      isAI: false
    });

    // Spawn 3 AI rivals driving real-life supercars
    this.aiCars = [];
    for (let i = 0; i < 3; i++) {
      const slot = grid[i + 1] || grid[0];
      const cfg = aiCarConfigs[i] || { slug: 'ferrari-sf90-stradale', name: 'SF90', color: '#e60026' };
      const aiVehicle = new VehiclePhysics({
        ...cfg,
        x: slot.x,
        y: slot.y,
        angle: slot.angle,
        isAI: true
      });
      const controller = new AIRacerController(aiVehicle, this.trackData, 'normal', (i - 1) * 32);
      this.aiCars.push({ vehicle: aiVehicle, controller });
    }

    this.allVehicles = [this.player, ...this.aiCars.map(a => a.vehicle)];
    this.particles = new ParticleSystem();

    // Center camera on player
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;

    // Reset timings
    this.state = 'COUNTDOWN';
    this.countdownTimer = 3.0;
    this.countdownStep = 3;
    this.goTimer = 0.9;
    this.raceTotalTime = 0;

    // Start engine audio
    window.racingAudio.startEngine(this.player.audio_pitch || 1.0);
    window.racingAudio.playCountdownBeep(false);

    // Show countdown display in UI
    const cdEl = document.getElementById('countdownOverlay');
    const cdNum = document.getElementById('countdownNumber');
    if (cdEl) cdEl.style.display = 'flex';
    if (cdNum) {
      cdNum.textContent = '3';
      cdNum.classList.remove('pulse-active');
      void cdNum.offsetWidth;
      cdNum.classList.add('pulse-active');
    }

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  renderTrackToCache() {
    const ctx = this.trackCtx;
    const w = this.trackCanvas.width;
    const h = this.trackCanvas.height;
    const waypoints = this.trackData.waypoints;
    const roadW = this.trackData.roadWidth;

    // 1. Background terrain (dark asphalt runoff & grid lines)
    ctx.fillStyle = '#0a0c12';
    ctx.fillRect(0, 0, w, h);

    // Decorative terrain pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 100) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 100) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // 2. Road Curbs / Rumble strips (wider background path)
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = this.trackData.curbColorA;
    ctx.lineWidth = roadW + 36;
    this.strokeWaypointsPath(ctx, waypoints);

    ctx.strokeStyle = this.trackData.curbColorB;
    ctx.lineWidth = roadW + 28;
    this.strokeWaypointsPath(ctx, waypoints);

    // 3. Main Asphalt Road Ribbon
    ctx.strokeStyle = this.trackData.surfaceColor;
    ctx.lineWidth = roadW;
    this.strokeWaypointsPath(ctx, waypoints);

    // 4. White Road Outer Edge Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = roadW - 4;
    this.strokeWaypointsPath(ctx, waypoints);

    ctx.strokeStyle = this.trackData.surfaceColor;
    ctx.lineWidth = roadW - 12;
    this.strokeWaypointsPath(ctx, waypoints);

    // 5. Center Dashed Neon Guideline
    ctx.save();
    ctx.strokeStyle = this.trackData.lineColor;
    ctx.lineWidth = 4;
    ctx.setLineDash([30, 30]);
    this.strokeWaypointsPath(ctx, waypoints);
    ctx.restore();

    // 6. Start / Finish Line Checkered Bar
    const sf1 = waypoints[0];
    const sf2 = waypoints[1];
    const angle = Math.atan2(sf2.y - sf1.y, sf2.x - sf1.x);
    const sfX = (sf1.x + sf2.x) / 2;
    const sfY = (sf1.y + sf2.y) / 2;

    ctx.save();
    ctx.translate(sfX, sfY);
    ctx.rotate(angle + Math.PI / 2);
    // Draw checkered pattern across road
    const checkW = 12;
    const numChecks = Math.floor(roadW / checkW);
    for (let i = -numChecks / 2; i < numChecks / 2; i++) {
      ctx.fillStyle = (Math.abs(i) % 2 === 0) ? '#ffffff' : '#000000';
      ctx.fillRect(i * checkW, -8, checkW, 16);
    }
    ctx.restore();
  }

  strokeWaypointsPath(ctx, waypoints) {
    if (waypoints.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(waypoints[0].x, waypoints[0].y);
    for (let i = 1; i < waypoints.length; i++) {
      ctx.lineTo(waypoints[i].x, waypoints[i].y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  gameLoop(currentTime) {
    const dt = Math.min(0.05, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    if (this.state !== 'STOPPED') {
      requestAnimationFrame((t) => this.gameLoop(t));
    }
  }

  update(dt) {
    if (this.state === 'COUNTDOWN') {
      this.countdownTimer -= dt;
      const step = Math.max(1, Math.ceil(this.countdownTimer));
      const cdNum = document.getElementById('countdownNumber');

      if (this.countdownTimer > 0) {
        if (step !== this.countdownStep) {
          this.countdownStep = step;
          if (cdNum) {
            cdNum.textContent = step;
            cdNum.classList.remove('pulse-active');
            void cdNum.offsetWidth;
            cdNum.classList.add('pulse-active');
          }
          if (window.racingAudio && window.racingAudio.playCountdownBeep) {
            window.racingAudio.playCountdownBeep(false);
          }
        }
      } else {
        this.state = 'RACING';
        if (cdNum) {
          cdNum.textContent = 'GO!';
          cdNum.style.color = 'var(--accent-cyan)';
          cdNum.classList.remove('pulse-active');
          void cdNum.offsetWidth;
          cdNum.classList.add('pulse-active');
        }
        if (window.racingAudio && window.racingAudio.playCountdownBeep) {
          window.racingAudio.playCountdownBeep(true);
        }
      }
      return;
    }

    if (this.state === 'RACING') {
      if (this.goTimer > 0) {
        this.goTimer -= dt;
        if (this.goTimer <= 0) {
          const cdEl = document.getElementById('countdownOverlay');
          if (cdEl) cdEl.style.display = 'none';
        }
      }
    }

    if (this.state === 'RACING') {
      this.raceTotalTime += dt;

      // 1. Update Player Vehicle
      const playerInput = {
        throttle: this.keys.up,
        brake: this.keys.down,
        left: this.keys.left,
        right: this.keys.right,
        handbrake: this.keys.handbrake,
        nitro: this.keys.nitro
      };
      this.player.update(dt, playerInput, this);

      // Audio updates for player
      const { rpm, gear } = this.player.getRpmRatio();
      window.racingAudio.updateEngine(rpm, this.keys.up, this.player.speed / this.player.maxSpeed);

      if (this.player.isDrifting) {
        window.racingAudio.playTireScreech(0.6);
        // Leave skidmarks from rear tires
        const rx1 = this.player.x + Math.cos(this.player.angle + Math.PI/2) * 16;
        const ry1 = this.player.y + Math.sin(this.player.angle + Math.PI/2) * 16;
        const rx2 = this.player.x - Math.cos(this.player.angle + Math.PI/2) * 16;
        const ry2 = this.player.y - Math.sin(this.player.angle + Math.PI/2) * 16;
        this.particles.addSkidmark(rx1, ry1, rx1 - this.player.vx * dt, ry1 - this.player.vy * dt);
        this.particles.addSkidmark(rx2, ry2, rx2 - this.player.vx * dt, ry2 - this.player.vy * dt);
        this.particles.emitSmoke(rx1, ry1, -this.player.vx, -this.player.vy);
      } else {
        window.racingAudio.stopTireScreech();
      }

      if (this.player.isNitroActive) {
        window.racingAudio.playNitroSound();
      }

      // 2. Update AI Competitors
      for (const ai of this.aiCars) {
        const aiInput = ai.controller.update(dt, this.allVehicles);
        ai.vehicle.update(dt, aiInput, this);

        if (ai.vehicle.isDrifting) {
          const ax = ai.vehicle.x;
          const ay = ai.vehicle.y;
          this.particles.emitSmoke(ax, ay, -ai.vehicle.vx, -ai.vehicle.vy);
        }
      }

      // 3. Vehicle-to-Vehicle Collisions
      this.resolveCarCollisions();

      // 4. Update Particle System
      this.particles.update(dt);

      // 5. Update Camera (Smooth tracking on player car)
      const lookAhead = this.player.speed * 0.25;
      const targetCamX = this.player.x + Math.cos(this.player.angle) * lookAhead;
      const targetCamY = this.player.y + Math.sin(this.player.angle) * lookAhead;
      this.camera.x += (targetCamX - this.camera.x) * (dt * 5);
      this.camera.y += (targetCamY - this.camera.y) * (dt * 5);

      // 6. Rank calculation
      this.calculateRanks();

      // 7. Update HUD
      this.updateHUD(gear, rpm);

      // 8. Check if Player Finished Race
      if (this.player.lap > this.totalLaps && !this.player.raceFinished) {
        this.player.raceFinished = true;
        this.player.finishTime = this.raceTotalTime;
        this.state = 'FINISHED';

        window.racingAudio.stopTireScreech();
        window.racingAudio.playVictoryFanfare();

        // Dispatch finish event for results modal & Django API submission!
        if (window.onRaceFinished) {
          window.onRaceFinished({
            finishPosition: this.player.finishRank,
            raceTime: this.raceTotalTime,
            bestLapTime: this.player.bestLapTime || this.raceTotalTime / this.totalLaps,
            topSpeed: this.player.getSpeedMph(),
            trackSlug: this.trackData.slug,
            carSlug: this.player.slug
          });
        }
      }
    }
  }

  resolveCarCollisions() {
    for (let i = 0; i < this.allVehicles.length; i++) {
      for (let j = i + 1; j < this.allVehicles.length; j++) {
        const v1 = this.allVehicles[i];
        const v2 = this.allVehicles[j];

        const dx = v2.x - v1.x;
        const dy = v2.y - v1.y;
        const dist = Math.hypot(dx, dy);
        const minDist = v1.radius + v2.radius;

        if (dist < minDist && dist > 0) {
          // Elastic bump response
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;

          v1.x -= nx * overlap * 0.5;
          v1.y -= ny * overlap * 0.5;
          v2.x += nx * overlap * 0.5;
          v2.y += ny * overlap * 0.5;

          // Momentum transfer
          const vrel = (v1.vx - v2.vx) * nx + (v1.vy - v2.vy) * ny;
          if (vrel > 0) {
            v1.vx -= nx * vrel * 0.6;
            v1.vy -= ny * vrel * 0.6;
            v2.vx += nx * vrel * 0.6;
            v2.vy += ny * vrel * 0.6;

            // Sparks & crash sound
            this.particles.emitSparks((v1.x + v2.x) / 2, (v1.y + v2.y) / 2, 8);
            if (v1 === this.player || v2 === this.player) {
              window.racingAudio.playCrashSound(Math.min(1.0, vrel / 250));
            }
          }
        }
      }
    }
  }

  isPointOnRoad(px, py) {
    // Distance from point to closest waypoint line segment
    const wps = this.trackData.waypoints;
    const maxDist = this.trackData.roadWidth / 2 + 15;

    for (let i = 0; i < wps.length; i++) {
      const p1 = wps[i];
      const p2 = wps[(i + 1) % wps.length];
      const dist = this.distToSegment(px, py, p1.x, p1.y, p2.x, p2.y);
      if (dist <= maxDist) return true;
    }
    return false;
  }

  distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1)**2 + (y2 - y1)**2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  checkVehicleProgress(vehicle) {
    const wps = this.trackData.waypoints;
    const targetWp = wps[vehicle.currentCheckpoint];
    const dist = Math.hypot(vehicle.x - targetWp.x, vehicle.y - targetWp.y);

    if (dist < this.trackData.roadWidth) {
      vehicle.currentCheckpoint = (vehicle.currentCheckpoint + 1) % wps.length;
      vehicle.totalCheckpointsHit++;

      // Completed a full lap when hitting checkpoint 0 again!
      if (vehicle.currentCheckpoint === 0 && vehicle.totalCheckpointsHit > 3) {
        if (vehicle.bestLapTime === 0 || vehicle.currentLapTime < vehicle.bestLapTime) {
          vehicle.bestLapTime = vehicle.currentLapTime;
        }
        vehicle.lap++;
        vehicle.currentLapTime = 0;
      }
    }
  }

  calculateRanks() {
    // Sort all vehicles by total progress (totalCheckpointsHit + distance to next)
    const sorted = [...this.allVehicles].sort((a, b) => {
      if (a.totalCheckpointsHit !== b.totalCheckpointsHit) {
        return b.totalCheckpointsHit - a.totalCheckpointsHit;
      }
      const wpA = this.trackData.waypoints[a.currentCheckpoint];
      const wpB = this.trackData.waypoints[b.currentCheckpoint];
      const distA = Math.hypot(a.x - wpA.x, a.y - wpA.y);
      const distB = Math.hypot(b.x - wpB.x, b.y - wpB.y);
      return distA - distB;
    });

    sorted.forEach((veh, idx) => {
      veh.finishRank = idx + 1;
    });
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();
    // Center camera on screen
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);

    // 1. Draw Cached Track
    ctx.drawImage(this.trackCanvas, 0, 0);

    // 2. Draw Skidmarks
    this.particles.drawSkids(ctx);

    // 3. Draw All Real-Life Supercars (sorted by Y for proper layer depth)
    const sortedVehicles = [...this.allVehicles].sort((a, b) => a.y - b.y);
    for (const veh of sortedVehicles) {
      ctx.save();
      ctx.translate(veh.x, veh.y);
      ctx.rotate(veh.angle + Math.PI / 2); // Rotate top-down forward vector

      window.CarRenderer.drawTopDownCar(ctx, veh.slug, veh.bodyColor, {
        scale: 0.95,
        nitroActive: veh.isNitroActive,
        brakeActive: veh.isBraking,
        steeringAngle: veh.steerAngle,
        lightsOn: true
      });
      ctx.restore();
    }

    // 4. Draw Particle Smoke & Sparks
    this.particles.drawParticles(ctx);

    ctx.restore();

    // 5. Draw Mini-Map Radar
    this.renderMinimap();
  }

  renderMinimap() {
    if (!this.minimapCtx) return;
    const mctx = this.minimapCtx;
    const mw = this.minimapCanvas.width = 160;
    const mh = this.minimapCanvas.height = 160;

    mctx.clearRect(0, 0, mw, mh);

    const scaleX = mw / this.trackData.worldWidth;
    const scaleY = mh / this.trackData.worldHeight;

    // Draw track circuit outline
    mctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    mctx.lineWidth = 4;
    mctx.beginPath();
    const wps = this.trackData.waypoints;
    mctx.moveTo(wps[0].x * scaleX, wps[0].y * scaleY);
    for (let i = 1; i < wps.length; i++) {
      mctx.lineTo(wps[i].x * scaleX, wps[i].y * scaleY);
    }
    mctx.closePath();
    mctx.stroke();

    // Draw AI rivals blips (Red/Orange dots)
    for (const ai of this.aiCars) {
      mctx.fillStyle = '#ff2a5f';
      mctx.beginPath();
      mctx.arc(ai.vehicle.x * scaleX, ai.vehicle.y * scaleY, 3.5, 0, Math.PI * 2);
      mctx.fill();
    }

    // Draw Player blip (Glowing Cyan dot)
    if (this.player) {
      mctx.fillStyle = '#00f0ff';
      mctx.shadowColor = '#00f0ff';
      mctx.shadowBlur = 8;
      mctx.beginPath();
      mctx.arc(this.player.x * scaleX, this.player.y * scaleY, 5, 0, Math.PI * 2);
      mctx.fill();
      mctx.shadowBlur = 0;
    }
  }

  updateHUD(gear, rpm) {
    if (!this.player) return;

    // Position
    const posVal = document.getElementById('hudPositionVal');
    if (posVal) posVal.textContent = this.player.finishRank;

    // Lap
    const lapVal = document.getElementById('hudLapCounter');
    if (lapVal) lapVal.textContent = `LAP ${Math.min(this.totalLaps, this.player.lap)} / ${this.totalLaps}`;

    // Timer
    const timeVal = document.getElementById('hudTimeVal');
    if (timeVal) {
      const minutes = Math.floor(this.raceTotalTime / 60);
      const seconds = (this.raceTotalTime % 60).toFixed(2);
      timeVal.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    // Digital Speedometer
    const speedVal = document.getElementById('digitalSpeedVal');
    if (speedVal) speedVal.textContent = this.player.getSpeedMph();

    // Gear
    const gearVal = document.getElementById('hudGearVal');
    if (gearVal) gearVal.textContent = `G${gear}`;

    // Nitro Bar
    const nitroFill = document.getElementById('nitroBarFill');
    if (nitroFill) {
      const pct = (this.player.nitroAmount / this.player.nitroCapacity) * 100;
      nitroFill.style.width = `${pct}%`;
    }
  }

  stop() {
    this.state = 'STOPPED';
    window.racingAudio.stopEngine();
    window.racingAudio.stopTireScreech();
  }
}

window.RacingGameEngine = RacingGameEngine;
