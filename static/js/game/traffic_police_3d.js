/**
 * RACING ZONE - 3D Traffic & Police Pursuit Simulator (Three.js)
 */

class TrafficAndPoliceManager {
  constructor(scene) {
    this.scene = scene;
    this.policeCruisers = [];
    this.trafficCars = [];
    this.wantedLevel = 0; // 0 to 5 stars
    this.escapeTimer = 0;
    this.escapeRequiredTime = 8.0; // 8 seconds to evade
    this.isPursuitActive = false;
  }

  setWantedLevel(stars) {
    const prev = this.wantedLevel;
    this.wantedLevel = Math.max(0, Math.min(5, stars));

    if (this.wantedLevel > 0 && !this.isPursuitActive) {
      this.isPursuitActive = true;
      window.racingAudio.startPoliceSiren();
    } else if (this.wantedLevel === 0 && this.isPursuitActive) {
      this.isPursuitActive = false;
      window.racingAudio.stopPoliceSiren();
      this.despawnAllPolice();
    }

    this.updateWantedUI();
  }

  updateWantedUI() {
    const container = document.getElementById('wantedStarsDisplay');
    if (container && this.lastRenderedStars !== this.wantedLevel) {
      this.lastRenderedStars = this.wantedLevel;
      let starsHtml = '';
      for (let i = 1; i <= 5; i++) {
        starsHtml += i <= this.wantedLevel ? '<span style="color: #ffd600; text-shadow: 0 0 10px #ffb703;">★</span>' : '<span style="color: rgba(255,255,255,0.2);">★</span>';
      }
      container.innerHTML = starsHtml;
    }

    const escapeBar = document.getElementById('escapeMeterBar');
    if (escapeBar && this.isPursuitActive) {
      const pct = Math.round((this.escapeTimer / this.escapeRequiredTime) * 100);
      if (pct !== this.lastRenderedEscapePct) {
        this.lastRenderedEscapePct = pct;
        escapeBar.style.width = `${pct}%`;
      }
    }
  }

  spawnPoliceCruiser(targetX, targetZ, angle) {
    const mesh = window.CarModels3D.createVehicleMesh('police-interceptor', '#111111', { isPolice: true });
    mesh.position.set(targetX, 0, targetZ);
    mesh.rotation.y = angle;

    this.scene.add(mesh);
    this.policeCruisers.push({
      mesh,
      x: targetX,
      z: targetZ,
      angle: angle,
      speed: 0,
      maxSpeed: 52, // 180 km/h in m/s
      vx: 0,
      vz: 0,
      strobeTimer: 0
    });
  }

  despawnAllPolice() {
    for (const cop of this.policeCruisers) {
      this.scene.remove(cop.mesh);
    }
    this.policeCruisers = [];
  }

  initTraffic(trackDef, count = 12) {
    this.despawnAllTraffic();
    if (!trackDef || !trackDef.waypoints || trackDef.waypoints.length === 0) return;

    const wps = trackDef.waypoints;
    const scale = 0.5;
    const trafficConfigs = [
      { slug: 'bmw-m3-competition', color: '#ffd600', name: 'Metro Cab' },
      { slug: 'ford-mustang-dark-horse', color: '#181a1f', name: 'Executive Cruiser' },
      { slug: 'dodge-challenger-hellcat', color: '#c1121f', name: 'Red Sport Coupe' },
      { slug: 'chevrolet-corvette-z06', color: '#f4f4f4', name: 'White Commuter' },
      { slug: 'nissan-gt-r-nismo', color: '#1d3557', name: 'Navy Sedan' },
      { slug: 'bmw-m3-competition', color: '#8d99ae', name: 'Silver Fleet' }
    ];

    const lanes = [-9.5, -3.2, 3.2, 9.5]; // 4 Highway lanes

    for (let i = 0; i < count; i++) {
      const cfg = trafficConfigs[i % trafficConfigs.length];
      const wpIdx = Math.floor((i / count) * wps.length);
      const wp = wps[wpIdx];
      const wpNext = wps[(wpIdx + 1) % wps.length];

      const wx = (wp.z !== undefined) ? wp.x : (wp.x - 1400) * scale;
      const wz = (wp.z !== undefined) ? wp.z : (wp.y - 1200) * scale;
      const nwx = (wpNext.z !== undefined) ? wpNext.x : (wpNext.x - 1400) * scale;
      const nwz = (wpNext.z !== undefined) ? wpNext.z : (wpNext.y - 1200) * scale;

      const segAngle = Math.atan2(nwx - wx, nwz - wz);
      const nx = -Math.cos(segAngle);
      const nz = Math.sin(segAngle);

      const laneOffset = lanes[i % lanes.length];
      const spawnX = wx + nx * laneOffset;
      const spawnZ = wz + nz * laneOffset;

      const mesh = window.CarModels3D.createVehicleMesh(cfg.slug, cfg.color, { isTraffic: true });
      mesh.position.set(spawnX, 0, spawnZ);
      mesh.rotation.y = segAngle;
      this.scene.add(mesh);

      const baseSpd = 20 + Math.random() * 8;
      this.trafficCars.push({
        mesh,
        slug: cfg.slug,
        name: cfg.name,
        x: spawnX,
        y: 0,
        z: spawnZ,
        angle: segAngle,
        baseSpeed: baseSpd,
        speed: baseSpd, // 45 to 65 mph highway speed
        currentWpIdx: (wpIdx + 1) % wps.length,
        laneOffset: laneOffset,
        vx: Math.sin(segAngle) * baseSpd,
        vz: Math.cos(segAngle) * baseSpd
      });
    }
  }

  despawnAllTraffic() {
    for (const car of this.trafficCars) {
      this.scene.remove(car.mesh);
    }
    this.trafficCars = [];
  }

  update(dt, playerX, playerZ, playerSpeed, trackData = null) {
    // 1. Update Civilian Highway Traffic
    if (this.trafficCars.length > 0 && trackData && trackData.waypoints) {
      const wps = trackData.waypoints;
      const scale = 0.5;

      for (const car of this.trafficCars) {
        const targetWp = wps[car.currentWpIdx];
        const nextWp = wps[(car.currentWpIdx + 1) % wps.length];
        const tx = (targetWp.z !== undefined) ? targetWp.x : (targetWp.x - 1400) * scale;
        const tz = (targetWp.z !== undefined) ? targetWp.z : (targetWp.y - 1200) * scale;
        const ntx = (nextWp.z !== undefined) ? nextWp.x : (nextWp.x - 1400) * scale;
        const ntz = (nextWp.z !== undefined) ? nextWp.z : (nextWp.y - 1200) * scale;

        const segAngle = Math.atan2(ntx - tx, ntz - tz);
        const nx = -Math.cos(segAngle);
        const nz = Math.sin(segAngle);

        const destX = tx + nx * car.laneOffset;
        const destZ = tz + nz * car.laneOffset;

        const dx = destX - car.x;
        const dz = destZ - car.z;
        const dist = Math.hypot(dx, dz);

        if (dist < 24) {
          car.currentWpIdx = (car.currentWpIdx + 1) % wps.length;
        }

        const targetAngle = Math.atan2(dx, dz);
        let angleDiff = targetAngle - car.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        car.angle += angleDiff * Math.min(1.0, dt * 3.5);

        // Smoothly settle speed back down to cruising baseSpeed after being pushed
        if (car.baseSpeed && car.speed > car.baseSpeed) {
          car.speed = Math.max(car.baseSpeed, car.speed - dt * 6.0);
        }

        car.vx = Math.sin(car.angle) * car.speed;
        car.vz = Math.cos(car.angle) * car.speed;

        car.x += car.vx * dt;
        car.z += car.vz * dt;

        car.mesh.position.set(car.x, 0, car.z);
        car.mesh.rotation.y = car.angle;

        // Wheels animation
        if (car.mesh.userData && car.mesh.userData.wheels) {
          const rollRate = (car.speed / 0.34) * dt;
          const w = car.mesh.userData.wheels;
          w.fl.roll.rotation.x += rollRate;
          w.fr.roll.rotation.x += rollRate;
          w.rl.roll.rotation.x += rollRate;
          w.rr.roll.rotation.x += rollRate;
        }

        // Relocate traffic that falls far behind the player to appear ahead!
        const distToPlayer = Math.hypot(car.x - playerX, car.z - playerZ);
        if (distToPlayer > 180) {
          const aheadIdx = (car.currentWpIdx + 4) % wps.length;
          const aheadWp = wps[aheadIdx];
          const aheadNext = wps[(aheadIdx + 1) % wps.length];
          const ax = (aheadWp.z !== undefined) ? aheadWp.x : (aheadWp.x - 1400) * scale;
          const az = (aheadWp.z !== undefined) ? aheadWp.z : (aheadWp.y - 1200) * scale;
          const anx = (aheadNext.z !== undefined) ? aheadNext.x : (aheadNext.x - 1400) * scale;
          const anz = (aheadNext.z !== undefined) ? aheadNext.z : (aheadNext.y - 1200) * scale;
          const aAngle = Math.atan2(anx - ax, anz - az);

          const lanes = [-9.5, -3.2, 3.2, 9.5];
          car.laneOffset = lanes[Math.floor(Math.random() * lanes.length)];
          car.x = ax - Math.cos(aAngle) * car.laneOffset;
          car.z = az + Math.sin(aAngle) * car.laneOffset;
          car.angle = aAngle;
          car.currentWpIdx = (aheadIdx + 1) % wps.length;
        }
      }
    }

    // 2. Update Police Pursuit Vehicles (if active)
    if (!this.isPursuitActive) return;

    // Maintain 1-3 police cars depending on wanted level
    const requiredCops = Math.min(3, Math.ceil(this.wantedLevel / 1.5));
    if (this.policeCruisers.length < requiredCops) {
      // Spawn behind or ahead of player
      const spawnDist = 70;
      const spawnAngle = Math.random() * Math.PI * 2;
      this.spawnPoliceCruiser(playerX + Math.cos(spawnAngle) * spawnDist, playerZ + Math.sin(spawnAngle) * spawnDist, spawnAngle);
    }

    let closestDist = 9999;

    // Update each police cruiser
    for (const cop of this.policeCruisers) {
      const dx = playerX - cop.x;
      const dz = playerZ - cop.z;
      const dist = Math.hypot(dx, dz);
      if (dist < closestDist) closestDist = dist;

      // Rotate toward player
      const targetAngle = Math.atan2(dx, dz);
      let angleDiff = targetAngle - cop.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      cop.angle += angleDiff * Math.min(1.0, dt * 2.8);

      // Accelerate / Chase
      if (cop.speed < cop.maxSpeed) {
        cop.speed += 18 * dt;
      }
      cop.vx = Math.sin(cop.angle) * cop.speed;
      cop.vz = Math.cos(cop.angle) * cop.speed;

      cop.x += cop.vx * dt;
      cop.z += cop.vz * dt;

      cop.mesh.position.set(cop.x, 0, cop.z);
      cop.mesh.rotation.y = cop.angle;

      // Wheels animation
      if (cop.mesh.userData && cop.mesh.userData.wheels) {
        const rollRate = (cop.speed / 0.34) * dt;
        const w = cop.mesh.userData.wheels;
        w.fl.roll.rotation.x += rollRate;
        w.fr.roll.rotation.x += rollRate;
        w.rl.roll.rotation.x += rollRate;
        w.rr.roll.rotation.x += rollRate;
        w.fl.hub.rotation.y = -angleDiff * 0.4;
        w.fr.hub.rotation.y = -angleDiff * 0.4;
      }

      // Roof Strobe LEDs (Red / Blue alternating flash)
      cop.strobeTimer += dt * 14;
      if (cop.mesh.userData && cop.mesh.userData.policeLightbar) {
        const lb = cop.mesh.userData.policeLightbar;
        const isRed = Math.floor(cop.strobeTimer) % 2 === 0;
        lb.red.material.color.setHex(isRed ? 0xff0022 : 0x220000);
        lb.blue.material.color.setHex(!isRed ? 0x0066ff : 0x001133);
      }
    }

    // Escape Mechanism
    if (closestDist > 90) {
      // Out of close pursuit range -> timer counts up
      this.escapeTimer += dt;
      if (this.escapeTimer >= this.escapeRequiredTime) {
        // Escaped! Clear wanted level
        this.setWantedLevel(0);
        alert('🚨 EVADED! You successfully lost the police pursuit! +$2,000 Escape Bonus awarded!');
        if (window.racingApp && window.racingApp.profile) {
          window.racingApp.profile.coins += 2000;
          window.racingApp.updateNavbarUser();
        }
      }
    } else {
      // Still in sight: reset escape timer
      this.escapeTimer = Math.max(0, this.escapeTimer - dt * 2);
    }

    if (this.isPursuitActive) {
      this.updateWantedUI();
    }
  }
}

window.TrafficAndPoliceManager = TrafficAndPoliceManager;
