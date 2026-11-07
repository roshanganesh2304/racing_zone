/**
 * RACING ZONE - Full 3D WebGL Racing Game Engine (Three.js)
 * Chase Camera, Real-Life 3D Vehicles, Character On-Foot [E], Multiple Cameras [C], and AI
 */

class RacingGameEngine3D {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);

    // Three.js Core
    const w = (this.container && this.container.clientWidth > 0) ? this.container.clientWidth : (window.innerWidth || 1280);
    const h = (this.container && this.container.clientHeight > 0) ? this.container.clientHeight : (window.innerHeight || 720);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, w / h, 0.2, 2500);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // Append WebGL canvas
    if (this.container) {
      this.container.innerHTML = '';
      this.container.appendChild(this.renderer.domElement);
    }

    // Systems
    this.world = new World3D(this.scene);
    this.character = new Character3D(this.scene);
    this.trafficPolice = new TrafficAndPoliceManager(this.scene);

    // 3D Particle FX Group & Shared Pooled Geometries (Prevents GC lag spikes)
    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);
    this.particles = [];

    this.sharedSmokeGeo = new THREE.PlaneGeometry(0.7, 0.7);
    this.sharedSmokeGeo.rotateX(-Math.PI / 2);
    this.sharedSmokeMat = new THREE.MeshBasicMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.5,
      depthWrite: false
    });

    // Zero-allocation particle pool for tire smoke
    this.smokePool = [];
    for (let i = 0; i < 40; i++) {
      const mesh = new THREE.Mesh(this.sharedSmokeGeo, this.sharedSmokeMat);
      mesh.visible = false;
      this.particleGroup.add(mesh);
      this.smokePool.push({
        mesh,
        vx: 0, vy: 0, vz: 0,
        life: 0, maxLife: 0.6,
        growth: 4.2, active: false
      });
    }

    this.sharedSparkGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    this.sharedSparkMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    this.sharedFireworkGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    this.fireworkMats = [
      new THREE.MeshBasicMaterial({ color: 0xff0055 }),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff }),
      new THREE.MeshBasicMaterial({ color: 0xffd600 }),
      new THREE.MeshBasicMaterial({ color: 0x00f59b }),
      new THREE.MeshBasicMaterial({ color: 0xff5500 })
    ];

    // State
    this.state = 'STOPPED'; // 'COUNTDOWN', 'RACING', 'FINISHED', 'PAUSED'
    this.cameraMode = 'CHASE'; // 'CHASE', 'HOOD', 'INTERIOR', 'AERIAL', 'CHARACTER'
    this.cameraLag = new THREE.Vector3();
    this.lookLag = new THREE.Vector3();

    // Vehicles
    this.playerVehicle = null;
    this.aiVehicles = [];
    this.allVehicles = [];

    this.countdownTimer = 3.0;
    this.countdownStep = 3;
    this.goTimer = 0.9;
    this.raceTotalTime = 0;
    this.totalLaps = 3;
    this.currentLap = 1;
    this.bestLapTime = 0;
    this.currentLapTime = 0;
    this.lastNearMissTime = 0;
    this.featTimeout = null;
    this.nearMissCount = 0;
    this.maxSpeedRecorded = 0;

    // Advanced Racing Dynamics
    this.currentDriftScore = 0;
    this.totalDriftScore = 0;
    this.isDrafting = false;
    this.camRoll = 0;
    this.finishOrbitAngle = 0;
    this.lastThrottleState = false;
    this.flamePopTimer = 0;
    this.rivalTagElements = null;
    this.crashShake = 0;
    this.lastCarCrashTime = 0;

    // Inputs
    this.keys = {
      up: false, down: false, left: false, right: false,
      handbrake: false, nitro: false, interact: false, switchCam: false
    };
    this.nitroDepleted = false;
    this.nitroKeysDown = new Set();

    this.lastTime = 0;
    this.bindInputs();
    this.handleResize();
  }

  handleResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const isMobile = window.innerWidth <= 950 || window.innerHeight <= 600;
    const isRacing = document.body.classList.contains('racing-active');
    const navHeight = (isMobile && isRacing) ? 0 : (isMobile ? 56 : 72);
    const w = this.container.clientWidth || window.innerWidth;
    const h = (isMobile && isRacing) ? window.innerHeight : (this.container.clientHeight || (window.innerHeight - navHeight));
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);

    const speedCanvas = document.getElementById('speedFxCanvas');
    if (speedCanvas) {
      speedCanvas.width = w;
      speedCanvas.height = h;
    }
  }

  bindInputs() {
    this.keydownHandler = (e) => {
      const code = e.code || '';
      const key = e.key ? e.key.toLowerCase() : '';

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code) || ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
        e.preventDefault();
      }

      if (['ArrowUp', 'KeyW'].includes(code) || key === 'arrowup' || key === 'w') {
        this.keys.up = true;
      }
      if (['ArrowDown', 'KeyS'].includes(code) || key === 'arrowdown' || key === 's') {
        this.keys.down = true;
      }
      if (['ArrowLeft', 'KeyA'].includes(code) || key === 'arrowleft' || key === 'a') {
        this.keys.left = true;
      }
      if (['ArrowRight', 'KeyD'].includes(code) || key === 'arrowright' || key === 'd') {
        this.keys.right = true;
      }
      if (code === 'Space' || key === ' ' || key === 'space') {
        this.keys.handbrake = true;
      }
      if (['ShiftLeft', 'ShiftRight', 'KeyN'].includes(code) || key === 'shift' || key === 'n') {
        this.nitroKeysDown.add(code || key);
        // Only activate nitro if not depleted and has enough charge (>5%)
        if (!this.nitroDepleted && this.playerVehicle && this.playerVehicle.nitroAmount > 5) {
          if (!this.keys.nitro && this.playerVehicle.speed > 8 && window.racingAudio && window.racingAudio.playNitroBurst) {
            window.racingAudio.playNitroBurst();
          }
          this.keys.nitro = true;
          const nitroBtn = document.getElementById('btnNitro');
          if (nitroBtn) nitroBtn.classList.add('touch-active');
        }
      }

      // Switch Camera [C]
      if (code === 'KeyC' || key === 'c') {
        this.toggleCameraMode();
      }

      // Enter / Exit Vehicle [E]
      if (code === 'KeyE' || key === 'e') {
        this.handleVehicleInteract();
      }

      // Police chase test toggle [P]
      if (code === 'KeyP' || key === 'p') {
        const nextWanted = (this.trafficPolice.wantedLevel + 1) % 6;
        this.trafficPolice.setWantedLevel(nextWanted);
      }

      // Time of Day toggle [T] (Day / Sunset / Night)
      if (code === 'KeyT' || key === 't') {
        this.toggleTimeOfDay();
      }

      // In-Car GTA Radio toggle [R]
      if (code === 'KeyR' || key === 'r') {
        this.toggleRadioStation();
      }

      // Audio Mute Toggle [M]
      if (code === 'KeyM' || key === 'm') {
        if (window.racingApp) window.racingApp.toggleAudio();
      }

      // Fast Reset / Recover to Track [F]
      if (code === 'KeyF' || key === 'f') {
        this.resetPlayerToTrack();
      }
    };
    window.addEventListener('keydown', this.keydownHandler);

    this.keyupHandler = (e) => {
      const code = e.code || '';
      const key = e.key ? e.key.toLowerCase() : '';

      if (['ArrowUp', 'KeyW'].includes(code) || key === 'arrowup' || key === 'w') this.keys.up = false;
      if (['ArrowDown', 'KeyS'].includes(code) || key === 'arrowdown' || key === 's') this.keys.down = false;
      if (['ArrowLeft', 'KeyA'].includes(code) || key === 'arrowleft' || key === 'a') this.keys.left = false;
      if (['ArrowRight', 'KeyD'].includes(code) || key === 'arrowright' || key === 'd') this.keys.right = false;
      if (code === 'Space' || key === ' ' || key === 'space') this.keys.handbrake = false;
      if (['ShiftLeft', 'ShiftRight', 'KeyN'].includes(code) || key === 'shift' || key === 'n') {
        this.nitroKeysDown.delete(code || key);
        if (this.nitroKeysDown.size === 0) {
          // Releasing key stops nitro boost and clears depletion state, allowing next press/tap
          this.keys.nitro = false;
          this.nitroDepleted = false;
          if (this.playerVehicle) {
            this.playerVehicle.isNitroActive = false;
          }
          const nitroBtn = document.getElementById('btnNitro');
          if (nitroBtn) nitroBtn.classList.remove('touch-active');
        }
      }
    };
    window.addEventListener('keyup', this.keyupHandler);

    this.blurHandler = () => {
      this.nitroKeysDown.clear();
      this.keys.nitro = false;
      this.nitroDepleted = false;
      if (this.playerVehicle) this.playerVehicle.isNitroActive = false;
      const nitroBtn = document.getElementById('btnNitro');
      if (nitroBtn) nitroBtn.classList.remove('touch-active');
    };
    window.addEventListener('blur', this.blurHandler);

    // Window resize & orientation change
    this.resizeHandler = () => this.handleResize();
    window.addEventListener('resize', this.resizeHandler);
    this.orientationHandler = () => {
      setTimeout(() => this.handleResize(), 150);
    };
    window.addEventListener('orientationchange', this.orientationHandler);

    // On-Screen Driving Controls (Pointer, Mouse, and Touch)
    const bindBtn = (id, key, onTap) => {
      const el = document.getElementById(id);
      if (!el) return;

      const onPress = (e) => {
        if (e && e.cancelable) e.preventDefault();
        if (e) e.stopPropagation();
        this.keys[key] = true;
        el.classList.add('touch-active');

        if (onTap) onTap();
      };

      const onRelease = (e) => {
        if (e && e.cancelable) e.preventDefault();
        if (e) e.stopPropagation();
        this.keys[key] = false;
        el.classList.remove('touch-active');
      };

      // Pointer Events (unifies Mouse, Touch & Pen with capture)
      el.addEventListener('pointerdown', (e) => {
        try { el.setPointerCapture(e.pointerId); } catch (_) {}
        onPress(e);
      });
      el.addEventListener('pointerup', (e) => {
        try { el.releasePointerCapture(e.pointerId); } catch (_) {}
        onRelease(e);
      });
      el.addEventListener('pointercancel', onRelease);
      el.addEventListener('pointerleave', onRelease);

      // Mouse & Touch fallback listeners
      el.addEventListener('mousedown', onPress);
      el.addEventListener('mouseup', onRelease);
      el.addEventListener('mouseleave', onRelease);
      el.addEventListener('touchstart', onPress, { passive: false });
      el.addEventListener('touchend', onRelease, { passive: false });
      el.addEventListener('touchcancel', onRelease, { passive: false });

      // Click fallback for immediate tactile tap
      el.addEventListener('click', (e) => {
        e.preventDefault();
        if (onTap) onTap();
      });
    };

    // Immediate forward motion impulse on gas tap (only active while racing)
    bindBtn('btnGas', 'up', () => {
      if (this.state === 'RACING' && this.playerVehicle && this.playerVehicle.speed < 24) {
        this.playerVehicle.speed = Math.max(this.playerVehicle.speed + 16, 22);
      }
    });

    // Immediate reverse or hard braking on brake tap (only active while racing)
    bindBtn('btnBrake', 'down', () => {
      if (this.state === 'RACING' && this.playerVehicle) {
        if (this.playerVehicle.speed > 3) {
          this.playerVehicle.speed = Math.max(0, this.playerVehicle.speed - 18);
        } else {
          this.playerVehicle.speed = Math.min(this.playerVehicle.speed - 12, -14);
        }
      }
    });

    // Immediate turn impulse on steer taps (only active while racing)
    bindBtn('btnSteerLeft', 'left', () => {
      if (this.state === 'RACING' && this.playerVehicle) {
        const dir = this.playerVehicle.speed < 0 ? -1 : 1;
        this.playerVehicle.angle += 0.10 * dir;
      }
    });

    bindBtn('btnSteerRight', 'right', () => {
      if (this.state === 'RACING' && this.playerVehicle) {
        const dir = this.playerVehicle.speed < 0 ? -1 : 1;
        this.playerVehicle.angle -= 0.10 * dir;
      }
    });

    // Standalone Mobile / Touch Nitro Button (Hold-to-Boost / Long-Press)
    const nitroBtn = document.getElementById('btnNitro');
    if (nitroBtn) {
      const onNitroPress = (e) => {
        if (e && e.cancelable) e.preventDefault();
        if (e) e.stopPropagation();

        if (!this.nitroDepleted && this.playerVehicle && this.playerVehicle.nitroAmount > 5) {
          this.keys.nitro = true;
          this.playerVehicle.isNitroActive = true;
          nitroBtn.classList.add('touch-active');
          if (this.playerVehicle.speed > 8 && window.racingAudio && window.racingAudio.playNitroBurst) {
            window.racingAudio.playNitroBurst();
          }
        }
      };

      const onNitroRelease = (e) => {
        if (e && e.cancelable) e.preventDefault();
        if (e) e.stopPropagation();

        this.keys.nitro = false;
        this.nitroDepleted = false; // Finger released; clears depleted flag so next tap can activate
        if (this.playerVehicle) {
          this.playerVehicle.isNitroActive = false;
        }
        nitroBtn.classList.remove('touch-active');
      };

      nitroBtn.addEventListener('pointerdown', (e) => {
        try { nitroBtn.setPointerCapture(e.pointerId); } catch (_) {}
        onNitroPress(e);
      });
      nitroBtn.addEventListener('pointerup', (e) => {
        try { nitroBtn.releasePointerCapture(e.pointerId); } catch (_) {}
        onNitroRelease(e);
      });
      nitroBtn.addEventListener('pointercancel', onNitroRelease);
      nitroBtn.addEventListener('pointerleave', onNitroRelease);

      nitroBtn.addEventListener('touchstart', onNitroPress, { passive: false });
      nitroBtn.addEventListener('touchend', onNitroRelease, { passive: false });
      nitroBtn.addEventListener('touchcancel', onNitroRelease, { passive: false });
      nitroBtn.addEventListener('mousedown', onNitroPress);
      nitroBtn.addEventListener('mouseup', onNitroRelease);
      nitroBtn.addEventListener('mouseleave', onNitroRelease);

      nitroBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    }

    bindBtn('btnHandbrake', 'handbrake', () => {
      if (this.playerVehicle) {
        this.playerVehicle.isDrifting = true;
        if (window.racingAudio && window.racingAudio.playTireScreech) {
          window.racingAudio.playTireScreech();
        }
      }
    });

    this.initMobileSteerModes();
  }

  initMobileSteerModes() {
    this.steerControlMode = localStorage.getItem('racing_steer_mode') || 'buttons';
    this.mobileSteerValue = 0;
    this.virtualWheelAngle = 0;
    this.isWheelDragging = false;
    this.boundOrientationHandler = null;

    // 1. Wire Mode Selector Tabs
    const tabs = document.querySelectorAll('.steer-mode-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const targetMode = tab.dataset.steerMode;
        if (targetMode) {
          this.setSteerControlMode(targetMode);
        }
      });
    });

    // 2. Setup Interactive Virtual Steering Wheel
    const wheel = document.getElementById('virtualSteeringWheel');
    if (wheel) {
      let startX = 0;
      let startAngle = 0;

      const onWheelDown = (e) => {
        this.isWheelDragging = true;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        startX = clientX;
        startAngle = this.virtualWheelAngle || 0;
        try { wheel.setPointerCapture(e.pointerId); } catch (_) {}
      };

      const onWheelMove = (e) => {
        if (!this.isWheelDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const deltaX = clientX - startX;
        // Map deltaX to rotation angle (-75deg to +75deg)
        const angle = Math.max(-75, Math.min(75, startAngle + deltaX * 1.2));
        this.virtualWheelAngle = angle;
        wheel.style.transform = `rotate(${angle}deg)`;
        // In engine_3d: left steer is positive (+1), right steer is negative (-1)
        this.mobileSteerValue = -(angle / 75);
      };

      const onWheelUp = (e) => {
        if (!this.isWheelDragging) return;
        this.isWheelDragging = false;
        try { wheel.releasePointerCapture(e.pointerId); } catch (_) {}
        // Spring return to center
        this.virtualWheelAngle = 0;
        this.mobileSteerValue = 0;
        wheel.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
        wheel.style.transform = 'rotate(0deg)';
        setTimeout(() => {
          wheel.style.transition = '';
        }, 200);
      };

      wheel.addEventListener('pointerdown', onWheelDown);
      window.addEventListener('pointermove', onWheelMove);
      window.addEventListener('pointerup', onWheelUp);
      window.addEventListener('pointercancel', onWheelUp);

      // Touch fallback
      wheel.addEventListener('touchstart', onWheelDown, { passive: false });
      window.addEventListener('touchmove', onWheelMove, { passive: false });
      window.addEventListener('touchend', onWheelUp, { passive: false });
    }

    // Apply saved mode
    this.setSteerControlMode(this.steerControlMode);
  }

  setSteerControlMode(mode) {
    this.steerControlMode = mode;
    localStorage.setItem('racing_steer_mode', mode);

    // Update active tab UI
    const tabs = document.querySelectorAll('.steer-mode-tab');
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.steerMode === mode);
    });

    const buttonsGroup = document.getElementById('steerButtonsGroup');
    const wheelGroup = document.getElementById('steerWheelGroup');
    const tiltGroup = document.getElementById('steerTiltGroup');

    if (buttonsGroup) buttonsGroup.style.display = (mode === 'buttons') ? 'flex' : 'none';
    if (wheelGroup) wheelGroup.style.display = (mode === 'wheel') ? 'flex' : 'none';
    if (tiltGroup) tiltGroup.style.display = (mode === 'tilt') ? 'flex' : 'none';

    // Reset steering value
    this.mobileSteerValue = 0;
    this.keys.left = false;
    this.keys.right = false;

    // Handle Tilt Gyro Listener
    if (mode === 'tilt') {
      this.enableTiltSteering();
    } else {
      this.disableTiltSteering();
    }
  }

  enableTiltSteering() {
    const tiltBubble = document.getElementById('tiltBubble');
    const tiltAngleVal = document.getElementById('tiltAngleVal');
    const tiltStatusSub = document.getElementById('tiltStatusSub');

    const handleOrientation = (e) => {
      if (this.steerControlMode !== 'tilt') return;
      if (e.beta === null && e.gamma === null) return;

      const orientationAngle = (window.screen && window.screen.orientation) ? window.screen.orientation.angle : (window.orientation || 0);
      let rawAngle = 0;

      if (orientationAngle === 90) {
        // Landscape (rotated counter-clockwise)
        rawAngle = e.beta;
      } else if (orientationAngle === -90 || orientationAngle === 270) {
        // Landscape (rotated clockwise)
        rawAngle = -e.beta;
      } else {
        // Portrait (0 or 180 deg)
        rawAngle = e.gamma;
      }

      if (rawAngle === null || rawAngle === undefined || isNaN(rawAngle)) return;

      const deadzone = 2.5; // degrees of deadzone
      const maxAngle = 26;  // degrees for full steering lock
      let effective = 0;

      if (Math.abs(rawAngle) > deadzone) {
        const sign = Math.sign(rawAngle);
        effective = sign * Math.min(maxAngle, Math.abs(rawAngle) - deadzone);
      }

      // Left steer is positive (+1), right steer is negative (-1)
      const steerRatio = Math.max(-1, Math.min(1, -(effective / (maxAngle - deadzone))));
      this.mobileSteerValue = steerRatio;

      // Update HUD Tilt Gauge Feedback
      if (tiltBubble) {
        const pct = 50 + (-steerRatio * 42); // 50% is center
        tiltBubble.style.left = `${Math.max(8, Math.min(92, pct))}%`;
      }
      if (tiltAngleVal) {
        tiltAngleVal.textContent = `${Math.round(rawAngle)}°`;
      }
      if (tiltStatusSub) {
        if (Math.abs(steerRatio) < 0.05) {
          tiltStatusSub.textContent = 'CENTERED (0%)';
          tiltStatusSub.style.color = 'var(--text-muted)';
        } else {
          const dir = steerRatio > 0 ? '◀ LEFT' : 'RIGHT ▶';
          const p = Math.round(Math.abs(steerRatio) * 100);
          tiltStatusSub.textContent = `${dir} ${p}%`;
          tiltStatusSub.style.color = '#00f0ff';
        }
      }
    };

    // iOS 13+ permission request
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(response => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
            this.boundOrientationHandler = handleOrientation;
          } else {
            if (tiltStatusSub) tiltStatusSub.textContent = 'Permission denied';
          }
        })
        .catch(err => {
          console.warn('DeviceOrientation error:', err);
          window.addEventListener('deviceorientation', handleOrientation);
          this.boundOrientationHandler = handleOrientation;
        });
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
      this.boundOrientationHandler = handleOrientation;
    }
  }

  disableTiltSteering() {
    if (this.boundOrientationHandler) {
      window.removeEventListener('deviceorientation', this.boundOrientationHandler);
      this.boundOrientationHandler = null;
    }
    this.mobileSteerValue = 0;
  }

  toggleCameraMode(targetMode = null) {
    if (!this.character.isInVehicle) {
      this.cameraMode = 'CHARACTER';
      this.updatePlayerMeshVisibility();
      return;
    }
    const modes = ['CHASE', 'HOOD', 'INTERIOR', 'AERIAL'];
    if (targetMode && modes.includes(targetMode)) {
      this.cameraMode = (this.cameraMode === targetMode) ? 'CHASE' : targetMode;
    } else {
      const currentIdx = modes.indexOf(this.cameraMode);
      const nextIdx = (currentIdx === -1 ? 0 : (currentIdx + 1) % modes.length);
      this.cameraMode = modes[nextIdx];
    }

    const isInterior = this.cameraMode === 'INTERIOR' || this.cameraMode === 'COCKPIT';
    const isHood = this.cameraMode === 'HOOD';
    if (this.camera) {
      this.camera.near = (isInterior || isHood) ? 0.05 : 0.2;
      this.camera.updateProjectionMatrix();
    }

    const camBadge = document.getElementById('cameraModeBadge');
    if (camBadge) {
      const labels = {
        'CHASE': '🏎️ CHASE',
        'HOOD': '🚗 HOOD',
        'INTERIOR': '💺 INTERIOR',
        'AERIAL': '🚁 AERIAL'
      };
      camBadge.textContent = labels[this.cameraMode] || this.cameraMode;
    }

    const cockpitOverlay = document.getElementById('cockpitInteriorOverlay');
    if (cockpitOverlay) {
      cockpitOverlay.style.display = isInterior ? 'block' : 'none';
    }

    if (this.cameraMode === 'AERIAL' && this.playerVehicle) {
      const car = this.playerVehicle;
      const speedPct = Math.abs(car.speed) / car.maxSpeed;
      const aerialAltitude = 16.0 + speedPct * 3.5;
      const followDist = 11.0 + speedPct * 2.5;
      const baseY = (car.y !== undefined ? car.y : (car.mesh ? car.mesh.position.y : 0.045));
      this.cameraLag.set(
        car.x - Math.sin(car.angle) * followDist,
        baseY + aerialAltitude,
        car.z - Math.cos(car.angle) * followDist
      );
      this.lookLag.set(
        car.x + Math.sin(car.angle) * 14.0,
        baseY + 0.4,
        car.z + Math.cos(car.angle) * 14.0
      );
    }

    this.updatePlayerMeshVisibility();
  }

  updatePlayerMeshVisibility() {
    if (!this.playerVehicle || !this.playerVehicle.mesh) return;

    const isExternalView = this.cameraMode === 'CHASE' || this.cameraMode === 'CHARACTER' || this.cameraMode === 'AERIAL';
    const carMesh = this.playerVehicle.mesh;
    const userData = carMesh.userData || {};

    if (isExternalView) {
      // Restore full 3D car body visibility for Chase and Aerial view
      if (userData.isRealModelLoaded) {
        if (userData.realModelContainer) userData.realModelContainer.visible = true;
        if (userData.proceduralChassis) userData.proceduralChassis.visible = false;
        if (userData.wheels && userData.wheels.group) userData.wheels.group.visible = false;
      } else {
        if (userData.proceduralChassis) userData.proceduralChassis.visible = true;
        if (userData.wheels && userData.wheels.group) userData.wheels.group.visible = true;
      }

      const shadow = carMesh.getObjectByName('contactShadowPlane');
      if (shadow) shadow.visible = true;

      // Restore optical surface flares
      if (userData.lightsGroup && userData.lightsGroup.userData) {
        if (userData.lightsGroup.userData.headlightFlares) {
          userData.lightsGroup.userData.headlightFlares.forEach(item => { item.mesh.visible = true; });
        }
        if (userData.lightsGroup.userData.tailFlares) {
          userData.lightsGroup.userData.tailFlares.forEach(item => { item.mesh.visible = true; });
        }
      }
    } else {
      // HOOD & INTERIOR modes: Hide car body, chassis, wheels, and contact shadow
      // so the track is 100% visible, crystal-clear, with zero clipping!
      if (userData.realModelContainer) userData.realModelContainer.visible = false;
      if (userData.proceduralChassis) userData.proceduralChassis.visible = false;
      if (userData.wheels && userData.wheels.group) userData.wheels.group.visible = false;

      const shadow = carMesh.getObjectByName('contactShadowPlane');
      if (shadow) shadow.visible = false;

      // Hide surface optical flares so they don't clip into the camera lens
      if (userData.lightsGroup && userData.lightsGroup.userData) {
        if (userData.lightsGroup.userData.headlightFlares) {
          userData.lightsGroup.userData.headlightFlares.forEach(item => { item.mesh.visible = false; });
        }
        if (userData.lightsGroup.userData.tailFlares) {
          userData.lightsGroup.userData.tailFlares.forEach(item => { item.mesh.visible = false; });
        }
      }

      // Keep forward dynamic SpotLights active so headlights illuminate the track ahead at night
      if (userData.lightsGroup) {
        userData.lightsGroup.visible = true;
      }
    }
  }

  toggleTimeOfDay() {
    if (!this.trackData) return;
    const available = this.trackData.availableTimes || ['night', 'day', 'sunset'];
    const current = this.selectedTimeOfDay || this.trackData.defaultTime || 'night';
    const nextIdx = (available.indexOf(current) + 1) % available.length;
    this.selectedTimeOfDay = available[nextIdx];
    this.world.setupTimeOfDay(this.selectedTimeOfDay, this.trackData.biome);
    this.updateTimeOfDayHUD();
  }

  updateTimeOfDayHUD() {
    const badge = document.getElementById('hudTimeOfDayBadge');
    if (badge) {
      const labels = {
        day: '☀️ DAY',
        sunset: '🌅 SUNSET',
        night: '🌙 NIGHT'
      };
      const colors = {
        day: '#00e5ff',
        sunset: '#ff9800',
        night: '#ffd600'
      };
      badge.textContent = labels[this.selectedTimeOfDay] || '🌙 NIGHT';
      badge.style.color = colors[this.selectedTimeOfDay] || '#ffd600';
    }
  }

  toggleRadioStation() {
    if (window.racingAudio) {
      const stationName = window.racingAudio.nextRadioStation();
      this.showRadioToast(stationName);
    }
  }

  showRadioToast(stationName) {
    let toast = document.getElementById('gtaRadioToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'gtaRadioToast';
      toast.style.cssText = `
        position: absolute;
        top: 4.8rem;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(10, 14, 24, 0.88);
        border: 1px solid #00f0ff;
        border-radius: 9999px;
        padding: 0.5rem 1.4rem;
        font-size: 0.92rem;
        font-weight: 800;
        color: #fff;
        text-shadow: 0 0 10px #00f0ff;
        box-shadow: 0 4px 20px rgba(0, 240, 255, 0.35);
        pointer-events: none;
        z-index: 100;
        transition: opacity 0.4s ease, transform 0.4s ease;
      `;
      this.container.appendChild(toast);
    }
    toast.textContent = stationName;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';

    clearTimeout(this.radioToastTimeout);
    this.radioToastTimeout = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(-12px)';
    }, 2800);
  }

  showGtaDistrictBanner(title, subtitle) {
    let banner = document.getElementById('gtaDistrictBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'gtaDistrictBanner';
      banner.style.cssText = `
        position: absolute;
        bottom: 5.6rem;
        left: 50%;
        transform: translateX(-50%) translateY(0);
        background: rgba(8, 10, 18, 0.90);
        border: 1px solid rgba(255, 214, 0, 0.5);
        border-radius: 8px;
        padding: 0.35rem 1.4rem;
        font-family: var(--font-display, sans-serif);
        pointer-events: none;
        z-index: 90;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
        text-align: center;
        transition: opacity 0.5s ease, transform 0.5s ease;
      `;
      this.container.appendChild(banner);
    }
    banner.innerHTML = `
      <div style="font-size: 0.65rem; font-weight: 900; letter-spacing: 1.5px; color: #ffd600; text-transform: uppercase;">📍 ${title}</div>
      <div style="font-size: 0.78rem; font-weight: 700; color: #00f0ff; letter-spacing: 0.5px;">${subtitle || 'San Andreas Highway'}</div>
    `;
    banner.style.opacity = '1';
    banner.style.transform = 'translateX(-50%) translateY(0)';

    clearTimeout(this.gtaDistrictTimeout);
    this.gtaDistrictTimeout = setTimeout(() => {
      banner.style.opacity = '0';
      banner.style.transform = 'translateX(-50%) translateY(10px)';
    }, 2200);
  }

  handleVehicleInteract() {
    if (this.character.isInVehicle) {
      // Exit vehicle
      if (Math.abs(this.playerVehicle.speed) < 8) {
        this.playerVehicle.speed = 0;
        this.character.exitVehicle(this.playerVehicle);
        this.cameraMode = 'CHARACTER';
        this.updateInteractionPrompt(false);
        this.updatePlayerMeshVisibility();
        const cockpitOverlay = document.getElementById('cockpitInteriorOverlay');
        if (cockpitOverlay) cockpitOverlay.style.display = 'none';
      }
    } else {
      // Check if close to player vehicle or any car
      const dist = Math.hypot(this.character.x - this.playerVehicle.x, this.character.z - this.playerVehicle.z);
      if (dist < 4.0) {
        this.character.enterVehicle(this.playerVehicle);
        this.cameraMode = 'CHASE';
        this.updateInteractionPrompt(false);
        this.updatePlayerMeshVisibility();
      }
    }
  }

  setupRace(trackSlug, playerCarConfig, aiCarConfigs, selectedTimeOfDay = null, multiplayerOptions = null) {
    this.handleResize();
    this.trackData = window.RacingTracks[trackSlug] || window.RacingTracks['los-santos'] || window.RacingTracks['vice-city'];
    this.totalLaps = (multiplayerOptions && multiplayerOptions.laps) ? multiplayerOptions.laps : this.trackData.laps;
    this.currentLap = 1;
    this.raceTotalTime = 0;
    this.bestLapTime = 0;
    this.currentLapTime = 0;

    // Apply Time of Day preference (day, sunset, night)
    this.selectedTimeOfDay = selectedTimeOfDay || this.trackData.defaultTime || 'sunset';

    // Build 3D world environment with biome & lighting
    this.world.buildTrackWorld(this.trackData, this.selectedTimeOfDay);
    this.cacheGpsTrack();
    this.updateTimeOfDayHUD();

    // Populate CarX Highway Race Screen Interface (Matching Track Selection Screen)
    const shieldEl = document.getElementById('hudTrackShieldBadge');
    if (shieldEl) shieldEl.textContent = this.trackData.highwayCode ? this.trackData.highwayCode.split(' ')[0] : 'ROUTE';

    const codeEl = document.getElementById('hudTrackHighwayCode');
    if (codeEl) codeEl.textContent = this.trackData.highwayCode || 'INTERSTATE HIGHWAY';

    const nameEl = document.getElementById('hudTrackName');
    if (nameEl) nameEl.textContent = this.trackData.name;

    const trafficEl = document.getElementById('hudTrafficVal');
    if (trafficEl) trafficEl.textContent = this.trackData.trafficDensity || 'Heavy (85%)';

    const policeEl = document.getElementById('hudPoliceVal');
    if (policeEl) policeEl.textContent = this.trackData.policeThreat || '3-Star Patrol';

    const surfaceEl = document.getElementById('hudSurfaceVal');
    if (surfaceEl) surfaceEl.textContent = this.trackData.surfaceGrip || 'Dry Asphalt 100%';

    this.nearMissCount = 0;
    this.maxSpeedRecorded = 0;

    this.isF1Track = (trackSlug === 'monza-f1' || this.trackData.isF1Track || this.trackData.is_f1_track);

    // Spawn 3D Civilian Highway Traffic (DISABLED on Formula 1 Grand Prix Circuits)
    if (this.isF1Track) {
      this.trafficPolice.initTraffic(this.trackData, 0);
      this.trafficPolice.setWantedLevel(0);
      const trafficEl = document.getElementById('hudTrafficVal');
      if (trafficEl) trafficEl.textContent = 'FIA GP (No Traffic)';
      if (policeEl) policeEl.textContent = 'None (Safety Car)';
    } else {
      this.trafficPolice.initTraffic(this.trackData, 14);
    }

    // Trigger GTA District notification card
    this.showGtaDistrictBanner(this.trackData.name, this.trackData.district || this.trackData.country);

    // Start GTA in-car radio groove
    if (window.racingAudio) {
      window.racingAudio.setRadioStation(1);
    }

    // Vehicle Spawning: Multiplayer vs Single Player
    const scale = 0.5;
    this.isMultiplayer = !!(multiplayerOptions && multiplayerOptions.isMultiplayer);
    this.multiplayerOptions = multiplayerOptions || null;

    const playerSlotIdx = (this.isMultiplayer && multiplayerOptions.slot !== undefined) ? multiplayerOptions.slot : 0;
    const startSlot = this.trackData.startGrid[playerSlotIdx] || this.trackData.startGrid[0];
    const spawnX = (startSlot.x !== undefined) ? (startSlot.z !== undefined ? startSlot.x : (startSlot.x - 1400) * scale) : 0;
    const spawnZ = (startSlot.z !== undefined) ? startSlot.z : (startSlot.y !== undefined ? (startSlot.y - 1200) * scale : 0);

    const isF1Car = playerCarConfig.slug.startsWith('f1-') || playerCarConfig.slug === 'mclaren-mp45';
    const isCustomPaint = !isF1Car && !!(playerCarConfig.color && playerCarConfig.default_color && playerCarConfig.color.toLowerCase() !== playerCarConfig.default_color.toLowerCase());
    const playerMesh = window.CarModels3D.createVehicleMesh(playerCarConfig.slug, playerCarConfig.color || '#f2f2f2', { isPlayer: true, isCustomPaint });
    playerMesh.position.set(spawnX, 0.045, spawnZ);
    playerMesh.rotation.order = 'YXZ';
    playerMesh.rotation.set(0, startSlot.angle || 0, 0);
    this.scene.add(playerMesh);

    this.playerVehicle = {
      mesh: playerMesh,
      slug: playerCarConfig.slug,
      name: playerCarConfig.name,
      x: spawnX,
      y: 0.045,
      z: spawnZ,
      angle: startSlot.angle || 0,
      pitch: 0,
      roll: 0,
      speed: 0,
      maxSpeed: (playerCarConfig.top_speed_mph || 205) * 0.447, // convert to m/s
      accel: 22.0,
      brakeForce: 35.0,
      handling: (playerCarConfig.handling_score || 90) / 100,
      steerAngle: 0,
      isDrifting: false,
      isNitroActive: false,
      isAI: false,
      currentCheckpoint: 1,
      totalCheckpoints: 0,
      lap: 1,
      finishRank: playerSlotIdx + 1
    };

    if (this.isMultiplayer) {
      // Multiplayer: Spawn Real Remote Player Supercars
      this.aiVehicles = [];
      this.remoteVehicles = new Map();

      if (multiplayerOptions.players && Array.isArray(multiplayerOptions.players)) {
        for (const p of multiplayerOptions.players) {
          if (p.id === multiplayerOptions.localPlayerId) continue;
          const rSlotIdx = (p.slot !== undefined) ? p.slot : 1;
          const rSlot = this.trackData.startGrid[rSlotIdx] || startSlot;
          const rSpawnX = (rSlot.x !== undefined) ? (rSlot.z !== undefined ? rSlot.x : (rSlot.x - 1400) * scale) : 0;
          const rSpawnZ = (rSlot.z !== undefined) ? rSlot.z : (rSlot.y !== undefined ? (rSlot.y - 1200) * scale : 0);

          const rMesh = window.CarModels3D.createVehicleMesh(p.car_slug || 'ferrari-488-gtb', p.car_color || '#ff2a5f', { isCustomPaint: false });
          rMesh.position.set(rSpawnX, 0.045, rSpawnZ);
          rMesh.rotation.order = 'YXZ';
          rMesh.rotation.set(0, rSlot.angle || 0, 0);
          this.scene.add(rMesh);

          // Add floating 3D nametag above roof
          const nameplate = this.createPlayerNameplate(p.username || 'Racer');
          nameplate.position.set(0, 1.45, 0);
          rMesh.add(nameplate);

          const remoteCar = {
            id: p.id,
            username: p.username || 'Racer',
            mesh: rMesh,
            slug: p.car_slug || 'ferrari-488-gtb',
            x: rSpawnX,
            y: 0.045,
            z: rSpawnZ,
            targetX: rSpawnX,
            targetY: 0.045,
            targetZ: rSpawnZ,
            angle: rSlot.angle || 0,
            targetAngle: rSlot.angle || 0,
            speed: 0,
            targetSpeed: 0,
            steerAngle: 0,
            targetSteerAngle: 0,
            isNitroActive: false,
            isAI: false,
            isRemote: true,
            currentCheckpoint: 1,
            totalCheckpoints: 0,
            lap: 1,
            finishRank: rSlotIdx + 1
          };
          this.remoteVehicles.set(p.id, remoteCar);
        }
      }

      this.allVehicles = [this.playerVehicle, ...Array.from(this.remoteVehicles.values())];

      // Hook remote player network listener
      if (window.racingMultiplayer) {
        this.onRemoteUpdateHandler = (data) => {
          if (!this.remoteVehicles) return;
          const rVeh = this.remoteVehicles.get(data.player_id);
          if (rVeh) {
            rVeh.targetX = data.x;
            rVeh.targetY = data.y;
            rVeh.targetZ = data.z;
            rVeh.targetAngle = data.angle;
            rVeh.targetSpeed = data.speed;
            rVeh.targetSteerAngle = data.steerAngle;
            rVeh.isNitroActive = data.nitro;
            rVeh.lap = data.lap;
            rVeh.currentCheckpoint = data.checkpoint;
          }
        };
        window.racingMultiplayer.on('remoteUpdate', this.onRemoteUpdateHandler);
      }
    } else {
      // Single Player: Spawn 3D AI Rival Supercars on circuit grid (Original logic)
      this.aiVehicles = [];
      for (let i = 0; i < 3; i++) {
        const slot = this.trackData.startGrid[i + 1] || startSlot;
        const cfg = aiCarConfigs[i] || { slug: 'bmw-m3-competition', color: '#00334e' };
        const aiMesh = window.CarModels3D.createVehicleMesh(cfg.slug, cfg.color, { isCustomPaint: false, isAI: true });

        const aiSpawnX = (slot.x !== undefined) ? (slot.z !== undefined ? slot.x : (slot.x - 1400) * scale) : 0;
        const aiSpawnZ = (slot.z !== undefined) ? slot.z : (slot.y !== undefined ? (slot.y - 1200) * scale : 0);
        aiMesh.position.set(aiSpawnX, 0.045, aiSpawnZ);
        aiMesh.rotation.order = 'YXZ';
        aiMesh.rotation.set(0, slot.angle || 0, 0);
        this.scene.add(aiMesh);

        const aiVeh = {
          mesh: aiMesh,
          slug: cfg.slug,
          x: aiSpawnX,
          y: 0.045,
          z: aiSpawnZ,
          angle: slot.angle || 0,
          speed: 0,
          maxSpeed: (cfg.top_speed_mph || 200) * 0.43,
          accel: 20.0,
          isAI: true,
          currentWpIdx: 1,
          laneOffset: (i - 1) * 3.5,
          steerAngle: 0,
          currentCheckpoint: 1,
          totalCheckpoints: 0,
          lap: 1,
          finishRank: i + 2
        };
        this.aiVehicles.push(aiVeh);
      }

      this.allVehicles = [this.playerVehicle, ...this.aiVehicles];
    }

    // Initialize character inside player car
    this.character.isInVehicle = true;
    this.cameraMode = 'CHASE';
    this.updatePlayerMeshVisibility();
    const cockpitOverlay = document.getElementById('cockpitInteriorOverlay');
    if (cockpitOverlay) cockpitOverlay.style.display = 'none';

    // Start engine audio
    window.racingAudio.startEngine(playerCarConfig.audio_pitch || 1.0);

    // Ensure camera aspect and renderer dimensions match container
    const curW = (this.container && this.container.clientWidth > 0) ? this.container.clientWidth : window.innerWidth;
    const curH = (this.container && this.container.clientHeight > 0) ? this.container.clientHeight : window.innerHeight;
    this.camera.aspect = curW / curH;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(curW, curH);

    // Initial camera placement behind player car oriented along track angle
    const initCamDist = 7.0;
    const initCamH = 2.8;
    this.cameraLag.set(
      this.playerVehicle.x - Math.sin(this.playerVehicle.angle) * initCamDist,
      0.04 + initCamH,
      this.playerVehicle.z - Math.cos(this.playerVehicle.angle) * initCamDist
    );
    this.lookLag.set(
      this.playerVehicle.x + Math.sin(this.playerVehicle.angle) * 8,
      0.04 + 1.2,
      this.playerVehicle.z + Math.cos(this.playerVehicle.angle) * 8
    );
    this.camera.up.set(0, 1, 0);
    this.camera.position.copy(this.cameraLag);
    this.camera.lookAt(this.lookLag);

    this.isF1Mode = !!(this.trackData.isF1Track || (playerCarConfig.category === 'Formula 1') || (playerCarConfig.slug && playerCarConfig.slug.startsWith('f1-')));
    this.f1SectorTimes = [null, null, null];
    this.f1BestSectorTimes = [27.42, 29.85, 21.63];
    this.f1CurrentSector = 1;
    this.f1CurrentLapTime = 0;
    this.f1CountdownStep = -1;
    this.f1DrsActive = false;
    this.f1DrsAvailable = false;

    this.state = 'COUNTDOWN';
    this.countdownTimer = this.isF1Mode ? 4.8 : 3.0;
    this.countdownStep = 3;
    this.goTimer = 0.9;

    const cdEl = document.getElementById('countdownOverlay');
    const f1GantryEl = document.getElementById('f1GantryOverlay');
    const f1TimingBox = document.getElementById('f1TimingSignalsBox');

    if (this.isF1Mode) {
      if (cdEl) cdEl.style.display = 'none';
      if (f1GantryEl) {
        f1GantryEl.style.display = 'flex';
        const gpTitle = document.getElementById('f1GantryGpTitle');
        if (gpTitle) gpTitle.textContent = (this.trackData.name || 'ITALIAN GRAND PRIX').toUpperCase();
        for (let l = 1; l <= 5; l++) {
          const col = document.getElementById(`f1Light${l}`);
          if (col) col.classList.remove('lit');
        }
        const statusEl = document.getElementById('f1GantryStatus');
        if (statusEl) {
          statusEl.textContent = 'STAND BY FOR START';
          statusEl.classList.remove('lights-out');
        }
      }
      if (f1TimingBox) f1TimingBox.style.display = 'flex';
    } else {
      if (cdEl) cdEl.style.display = 'flex';
      if (f1GantryEl) f1GantryEl.style.display = 'none';
      if (f1TimingBox) f1TimingBox.style.display = 'none';
      this.triggerCountdownDisplay(3);
    }

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  triggerCountdownDisplay(val) {
    const cdEl = document.getElementById('countdownOverlay');
    const cdNum = document.getElementById('countdownNumber');
    if (!cdEl || !cdNum) return;

    cdEl.style.display = 'flex';
    cdNum.textContent = val;

    // Retrigger pulse animation cleanly on every countdown step
    cdNum.classList.remove('pulse-active');
    void cdNum.offsetWidth; // Force CSS reflow
    cdNum.classList.add('pulse-active');

    if (val === 'GO!') {
      cdNum.style.color = '#00f0ff';
      cdNum.style.textShadow = '0 0 50px rgba(0, 240, 255, 0.95), 0 0 80px rgba(0, 240, 255, 0.6)';
      if (window.racingAudio && window.racingAudio.playCountdownBeep) {
        window.racingAudio.playCountdownBeep(true);
      }
    } else {
      const colors = {
        3: '#ff2d55', // Red
        2: '#ff9500', // Amber
        1: '#ffd60a'  // Yellow
      };
      const color = colors[val] || '#ff2d55';
      cdNum.style.color = color;
      cdNum.style.textShadow = `0 0 50px ${color}, 0 0 80px rgba(255, 255, 255, 0.4)`;
      if (window.racingAudio && window.racingAudio.playCountdownBeep) {
        window.racingAudio.playCountdownBeep(false);
      }
    }
  }

  loop(currentTime) {
    const dt = Math.min(0.05, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    try {
      this.update(dt);
      this.render();
    } catch (err) {
      console.error('Racing engine loop error:', err);
    }

    if (this.state !== 'STOPPED') {
      requestAnimationFrame((t) => this.loop(t));
    }
  }

  update(dt) {
    // Keep directional sunlight shadow camera centered on the active car
    if (this.world && this.world.updateShadowFocus && this.playerVehicle) {
      this.world.updateShadowFocus(this.playerVehicle);
    }

    // 1. Countdown Sequence
    if (this.state === 'COUNTDOWN') {
      this.countdownTimer -= dt;

      if (this.isF1Mode) {
        // Authentic 5-Red-Light F1 Sequence:
        let litCount = 0;
        if (this.countdownTimer <= 0.8) litCount = 5;
        else if (this.countdownTimer <= 1.6) litCount = 4;
        else if (this.countdownTimer <= 2.4) litCount = 3;
        else if (this.countdownTimer <= 3.2) litCount = 2;
        else if (this.countdownTimer <= 4.0) litCount = 1;

        if (litCount !== this.f1CountdownStep) {
          this.f1CountdownStep = litCount;
          for (let l = 1; l <= 5; l++) {
            const col = document.getElementById(`f1Light${l}`);
            if (col) {
              if (l <= litCount) col.classList.add('lit');
              else col.classList.remove('lit');
            }
          }
          if (this.world && this.world.setF1StartingLights3D) {
            this.world.setF1StartingLights3D(litCount);
          }
          if (litCount > 0 && litCount <= 5) {
            if (window.racingAudio && window.racingAudio.playCountdownBeep) {
              window.racingAudio.playCountdownBeep(false);
            }
          }
          const statusBar = document.getElementById('f1GantryStatus');
          if (statusBar) {
            if (litCount === 5) statusBar.textContent = 'ALL LIGHTS ON - HOLDING...';
            else if (litCount > 0) statusBar.textContent = `RED LIGHT ${litCount} / 5`;
          }
        }

        if (this.countdownTimer <= 0) {
          this.state = 'RACING';
          this.f1CurrentLapTime = 0;
          for (let l = 1; l <= 5; l++) {
            const col = document.getElementById(`f1Light${l}`);
            if (col) col.classList.remove('lit');
          }
          if (this.world && this.world.setF1StartingLights3D) {
            this.world.setF1StartingLights3D(0);
          }
          const statusBar = document.getElementById('f1GantryStatus');
          if (statusBar) {
            statusBar.textContent = 'LIGHTS OUT AND AWAY WE GO!';
            statusBar.classList.add('lights-out');
          }
          if (window.racingAudio && window.racingAudio.playCountdownBeep) {
            window.racingAudio.playCountdownBeep(true);
          }
          setTimeout(() => {
            const gantryEl = document.getElementById('f1GantryOverlay');
            if (gantryEl) gantryEl.style.display = 'none';
          }, 1800);
        }
      } else {
        const step = Math.max(1, Math.ceil(this.countdownTimer));
        if (this.countdownTimer > 0) {
          if (step !== this.countdownStep) {
            this.countdownStep = step;
            this.triggerCountdownDisplay(step);
          }
        } else {
          this.state = 'RACING';
          this.triggerCountdownDisplay('GO!');
        }
      }

      // Keep vehicles oriented straight down the track and stationary during countdown
      if (this.playerVehicle) {
        this.playerVehicle.speed = 0;
        if (this.playerVehicle.mesh) {
          this.playerVehicle.mesh.position.set(this.playerVehicle.x, 0.045, this.playerVehicle.z);
          this.playerVehicle.mesh.rotation.order = 'YXZ';
          this.playerVehicle.mesh.rotation.set(0, this.playerVehicle.angle, 0);
        }
      }
      if (this.aiVehicles) {
        for (const ai of this.aiVehicles) {
          ai.speed = 0;
          if (ai.mesh) {
            ai.mesh.position.set(ai.x, 0.045, ai.z);
            ai.mesh.rotation.order = 'YXZ';
            ai.mesh.rotation.set(0, ai.angle, 0);
          }
        }
      }
      if (this.remoteVehicles) {
        for (const rVeh of this.remoteVehicles.values()) {
          if (rVeh.mesh) {
            rVeh.mesh.position.set(rVeh.x, 0.045, rVeh.z);
            rVeh.mesh.rotation.order = 'YXZ';
            rVeh.mesh.rotation.set(0, rVeh.angle, 0);
          }
        }
      }
      this.updateCamera(dt);
      return;
    }

    if (this.state === 'RACING') {
      // Fade out 'GO!' overlay smoothly after display duration
      if (this.goTimer > 0) {
        this.goTimer -= dt;
        if (this.goTimer <= 0) {
          const cdEl = document.getElementById('countdownOverlay');
          if (cdEl) cdEl.style.display = 'none';
        }
      }

      this.raceTotalTime += dt;
      this.currentLapTime += dt;

      // 1. Update 3D World (Snow particles, animated billboards, ambient effects)
      if (this.world) {
        this.world.update(dt);
      }

      // 2. Player Controls & 3D Physics
      if (this.character.isInVehicle) {
        this.updatePlayerCar(dt);
      } else {
        // Character on foot
        this.character.update(dt, this.keys, this.camera.rotation.y);

        // Check distance to car for Enter prompt
        const distToCar = Math.hypot(this.character.x - this.playerVehicle.x, this.character.z - this.playerVehicle.z);
        this.updateInteractionPrompt(distToCar < 3.8);
      }

      // 3. Update AI Rival Vehicles or Multiplayer Remote Players
      if (this.isMultiplayer) {
        this.updateRemoteVehicles(dt);
        this.mpTelemetryTimer = (this.mpTelemetryTimer || 0) + dt;
        if (this.mpTelemetryTimer >= 0.033) {
          this.mpTelemetryTimer = 0;
          if (window.racingMultiplayer && window.racingMultiplayer.isConnected) {
            window.racingMultiplayer.sendTelemetry({
              x: this.playerVehicle.x,
              y: this.playerVehicle.y,
              z: this.playerVehicle.z,
              angle: this.playerVehicle.angle,
              speed: this.playerVehicle.speed,
              steerAngle: this.playerVehicle.steerAngle,
              nitro: this.playerVehicle.isNitroActive,
              lap: this.playerVehicle.lap,
              checkpoint: this.playerVehicle.currentCheckpoint
            });
          }
        }
      } else {
        this.updateAIVehicles(dt);
      }

      // 4. Update Traffic & Police Pursuit System (Skipped on F1 track and in Multiplayer)
      if (!this.isF1Track && !this.isMultiplayer) {
        const pX = this.character.isInVehicle ? this.playerVehicle.x : this.character.x;
        const pZ = this.character.isInVehicle ? this.playerVehicle.z : this.character.z;
        this.trafficPolice.update(dt, pX, pZ, this.playerVehicle.speed, this.trackData);
      }

      // 4.5 Multi-Vehicle Solid Collision & Momentum Transfer
      this.handleVehicleCollisions(dt);

      // 5. Update Camera
      this.updateCamera(dt);

      // 6. Checkpoints & Laps
      this.updateCheckpoints();

      // 6.2 Compute Real-Time Race Positions
      this.updateRacePositions();

      // 6.5 CarX Near-Miss & High-Speed Combos
      this.checkNearMisses(dt);

      // 7. Update Particles (Smoke, Sparks, Fireworks)
      this.updateParticles(dt);

      // 8. Update HUD & Gauges
      this.updateHUD(dt);
      if (this.isF1Mode) {
        this.updateF1Telemetry(dt);
      }

      // 9. Race Finish Check
      if (this.playerVehicle.lap > this.totalLaps) {
        this.state = 'FINISHED';
        window.racingAudio.stopTireScreech();
        window.racingAudio.playVictoryFanfare();
        this.spawnVictoryFireworks();

        if (this.isMultiplayer && window.racingMultiplayer) {
          window.racingMultiplayer.sendFinish(this.raceTotalTime, this.bestLapTime || (this.raceTotalTime / this.totalLaps));
        }

        if (window.onRaceFinished) {
          window.onRaceFinished({
            finishPosition: this.playerVehicle.finishRank,
            raceTime: this.raceTotalTime,
            bestLapTime: this.bestLapTime || this.raceTotalTime / this.totalLaps,
            topSpeed: Math.round(this.playerVehicle.speed * 2.237),
            trackSlug: this.trackData.slug,
            carSlug: this.playerVehicle.slug
          });
        }
      }
    } else if (this.state === 'FINISHED') {
      // Cinematic 360-degree Victory Orbit Camera
      this.finishOrbitAngle = (this.finishOrbitAngle || 0) + dt * 0.7;
      const orbitDist = 9.0;
      this.camera.position.set(
        this.playerVehicle.x + Math.sin(this.finishOrbitAngle) * orbitDist,
        2.8,
        this.playerVehicle.z + Math.cos(this.finishOrbitAngle) * orbitDist
      );
      this.camera.lookAt(this.playerVehicle.x, 1.2, this.playerVehicle.z);

      // Smooth deceleration
      this.playerVehicle.speed *= Math.pow(0.96, dt * 60);
      this.playerVehicle.x += Math.sin(this.playerVehicle.angle) * this.playerVehicle.speed * dt;
      this.playerVehicle.z += Math.cos(this.playerVehicle.angle) * this.playerVehicle.speed * dt;
      this.playerVehicle.mesh.position.set(this.playerVehicle.x, 0, this.playerVehicle.z);

      this.updateParticles(dt);
      if (Math.random() < 0.1) this.spawnVictoryFireworks();
    }
  }

  updatePlayerCar(dt) {
    const car = this.playerVehicle;

    // 1. Nitro Boost & Exhaust Flames (Hold-to-Boost; never auto-fires on refill)
    const canUseNitro = this.keys.nitro && !this.nitroDepleted && car.nitroAmount > 0 && car.speed > 8;
    if (canUseNitro) {
      car.isNitroActive = true;
      car.nitroAmount = Math.max(0, car.nitroAmount - dt * 28);
      if (car.nitroAmount <= 0) {
        // Tank emptied completely; deactivate and mark depleted so it won't auto-activate when refilling
        car.nitroAmount = 0;
        car.isNitroActive = false;
        this.keys.nitro = false;
        this.nitroDepleted = true;
        const nitroBtn = document.getElementById('btnNitro');
        if (nitroBtn) nitroBtn.classList.remove('touch-active');
      }
      if (window.racingAudio && window.racingAudio.playNitroSound) {
        window.racingAudio.playNitroSound();
      }
    } else {
      car.isNitroActive = false;
      // Refill nitro passively up to 100% - requires new press/tap to activate again
      car.nitroAmount = Math.min(100, car.nitroAmount + dt * 5.5);
    }

    // Throttle Lift Exhaust Backfire Detection
    const speedMph = Math.round(Math.abs(car.speed) * 2.237);
    if (this.lastThrottleState && !this.keys.up && speedMph > 40) {
      this.flamePopTimer = 0.18;
      if (window.racingAudio && window.racingAudio.playExhaustPop) {
        window.racingAudio.playExhaustPop();
      }
    }
    this.lastThrottleState = this.keys.up;

    if (this.flamePopTimer > 0) {
      this.flamePopTimer -= dt;
    }

    // Animate Exhaust Flame Cones
    if (car.mesh.userData && car.mesh.userData.nitroFlames) {
      const showFlames = car.isNitroActive || this.flamePopTimer > 0;
      car.mesh.userData.nitroFlames.forEach(flame => {
        flame.visible = showFlames;
        if (showFlames) {
          const s = 1.0 + Math.random() * 0.5;
          flame.scale.set(s, s, s * (car.isNitroActive ? 1.7 : 0.85));
        }
      });
    }

    // 2. Aerodynamic Slipstream / Drafting Surge
    let isDraftingNow = false;
    const forwardX = Math.sin(car.angle);
    const forwardZ = Math.cos(car.angle);
    const potentialLeaders = [...this.aiVehicles, ...(this.trafficPolice ? this.trafficPolice.trafficCars : [])];

    for (const leader of potentialLeaders) {
      const dx = leader.x - car.x;
      const dz = leader.z - car.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 5.5 && dist < 24.0) {
        const dirX = dx / dist;
        const dirZ = dz / dist;
        const dot = dirX * forwardX + dirZ * forwardZ;
        if (dot > 0.86) {
          isDraftingNow = true;
          car.speed += 14.0 * dt; // Extra acceleration surge from slipstream!
          break;
        }
      }
    }

    if (isDraftingNow) {
      if (!this.isDrafting) {
        this.isDrafting = true;
        if (window.racingAudio && window.racingAudio.playDraftingSound) {
          window.racingAudio.playDraftingSound();
        }
        this.triggerCarxFeat('💨 SLIPSTREAM DRAFT!', 100);
      }
    } else {
      this.isDrafting = false;
    }

    const nitroMult = car.isNitroActive ? 1.45 : (this.isDrafting ? 1.15 : 1.0);
    const maxSpd = car.maxSpeed * (car.isNitroActive ? 1.25 : (this.isDrafting ? 1.1 : 1.0));

    // 3. Throttle & Braking
    if (this.keys.up) {
      if (car.speed < maxSpd) {
        car.speed += car.accel * nitroMult * dt;
      }
    } else if (this.keys.down) {
      if (car.speed > 1.2) {
        car.speed -= car.brakeForce * dt; // strong braking
      } else {
        // High-torque responsive reverse power
        car.speed = Math.max(-25, car.speed - 28 * dt);
      }
    } else {
      car.speed *= Math.pow(0.985, dt * 60); // rolling friction
    }



    // 4. Steering & Dynamic Drift Physics (Buttons, Virtual Wheel, and Tilt Gyro)
    let steerInput = 0;
    if (Math.abs(this.mobileSteerValue || 0) > 0.01) {
      steerInput = this.mobileSteerValue; // Analog steering from Virtual Wheel or Tilt Gyro
    } else {
      if (this.keys.left) steerInput += 1;  // Left steering turns car left on screen
      if (this.keys.right) steerInput -= 1; // Right steering turns car right on screen
    }

    car.steerAngle = steerInput * 0.45;

    if (Math.abs(car.speed) > 0.1 || Math.abs(steerInput) > 0.01) {
      const isReversing = car.speed < -0.1;
      // Allow responsive steering even when stopped/maneuvering against obstacles
      const speedFactor = Math.abs(car.speed) < 0.1
        ? 0.75
        : (isReversing ? 1.0 : Math.max(0.65, Math.min(1.25, Math.abs(car.speed) / 10)));
      let steerRate = steerInput * (car.handling * 2.8) * speedFactor * (isReversing ? -1 : 1);

      if (this.keys.handbrake) {
        steerRate *= 1.85;
        car.isDrifting = Math.abs(car.speed) > 12;
      } else {
        car.isDrifting = Math.abs(steerInput) > 0 && Math.abs(car.speed) > 30;
      }

      car.angle += steerRate * dt;
    } else {
      car.isDrifting = false;
    }

    // 5. Dynamic Drift Scoring & Tire Smoke Particles
    const driftBox = document.getElementById('hudDriftScoreBox');
    const driftVal = document.getElementById('hudDriftScoreVal');

    if (car.isDrifting && speedMph > 22) {
      this.currentDriftScore = (this.currentDriftScore || 0) + Math.round(speedMph * dt * 8);
      if (driftBox && driftVal) {
        driftBox.style.display = 'flex';
        driftVal.textContent = `${this.currentDriftScore} PTS`;
      }
      this.spawnTireSmoke(car);
    } else {
      if (this.currentDriftScore > 200) {
        const bonus = Math.round(this.currentDriftScore / 2);
        this.triggerCarxFeat(`⚡ DRIFT KING +$${bonus}`, bonus);
      }
      this.currentDriftScore = 0;
      if (driftBox) driftBox.style.display = 'none';
    }

    // Move forward
    car.x += Math.sin(car.angle) * car.speed * dt;
    car.z += Math.cos(car.angle) * car.speed * dt;

    // 6. Realistic Suspension Dynamics (Weight Transfer Pitch & Body Roll)
    const speedRatio = Math.min(1.0, Math.abs(car.speed) / 22);
    const targetRoll = -steerInput * speedRatio * 0.075;

    let targetPitch = 0;
    if (this.keys.up && car.speed > 0) {
      targetPitch = 0.035; // rear squat under hard acceleration
    } else if (this.keys.down && car.speed > 2) {
      targetPitch = -0.048; // front nose dive under heavy braking
    }

    car.pitch = (car.pitch || 0) + (targetPitch - (car.pitch || 0)) * dt * 9;
    car.roll = (car.roll || 0) + (targetRoll - (car.roll || 0)) * dt * 10;

    // 7. Building Collision Pushback & Wall Sparks (with fast AABB rejection and reverse support)
    if (this.world && this.world.buildingColliders) {
      for (const col of this.world.buildingColliders) {
        const dx = car.x - col.x;
        const dz = car.z - col.z;
        const minDist = col.radius + 2.5;
        // Fast AABB rejection avoids expensive distance checks
        if (Math.abs(dx) > minDist || Math.abs(dz) > minDist) continue;

        const dist = Math.hypot(dx, dz);
        if (dist < minDist && dist > 0.001) {
          const overlap = minDist - dist;
          const nx = dx / dist;
          const nz = dz / dist;
          car.x += nx * (overlap + 0.12);
          car.z += nz * (overlap + 0.12);
          this.spawnSparks(car.x, 0.4, car.z, nx, nz);

          // Head-on crash vs glancing barrier scrape
          const headingDot = (Math.sin(car.angle) * nx + Math.cos(car.angle) * nz);
          if (car.speed < 0) {
            // Reversing away from barrier - never clamp reverse speed!
          } else if (headingDot < -0.35 && car.speed > 6) {
            car.speed = -Math.min(3.5, Math.max(1.2, car.speed * 0.18)); // slight rebound on head-on hit
            if (window.racingAudio && window.racingAudio.playCrashSound) {
              window.racingAudio.playCrashSound();
            }
          } else {
            // Glancing scrape against barrier - maintain forward drive with wall friction
            car.speed = Math.max(3.0, car.speed * 0.96);
          }
        }
      }
    }

    // Update 3D mesh position and suspension angles
    // Dynamically compensate origin height for suspension pitch dive / acceleration squat / body roll
    // so front splitter and wheels never sink below the road surface!
    const pitchDrop = Math.abs(Math.sin(car.pitch || 0)) * 2.35;
    const rollDrop = Math.abs(Math.sin(car.roll || 0)) * 0.95;
    const dynamicY = 0.045 + pitchDrop + rollDrop;

    car.mesh.position.set(car.x, dynamicY, car.z);
    car.mesh.rotation.order = 'YXZ';
    car.mesh.rotation.set(car.pitch || 0, car.angle, car.roll || 0);

    // Keep contact shadow locked horizontally on road surface at world Y = 0.038
    const shadow = car.mesh.getObjectByName('contactShadowPlane');
    if (shadow) {
      shadow.rotation.set(-Math.PI / 2 - (car.pitch || 0), 0, -(car.roll || 0));
      shadow.position.y = 0.038 - dynamicY;
    }

    // Wheels rotation & steering for procedural fallback
    if (car.mesh.userData && car.mesh.userData.wheels && !car.mesh.userData.isRealModelLoaded) {
      const rollRate = (car.speed / 0.34) * dt;
      const w = car.mesh.userData.wheels;
      w.fl.roll.rotation.x += rollRate;
      w.fr.roll.rotation.x += rollRate;
      w.rl.roll.rotation.x += rollRate;
      w.rr.roll.rotation.x += rollRate;

      w.fl.hub.rotation.y = car.steerAngle;
      w.fr.hub.rotation.y = car.steerAngle;
    }

    // Dynamic Brake Lights (lit-up ruby red running lights by default; flares upon braking/drifting)
    if (car.mesh.userData && (car.mesh.userData.brakeGlow || car.mesh.userData.brakeMat || car.mesh.userData.realModelRearMats)) {
      const isBraking = (this.keys.down && car.speed > 0) || this.keys.handbrake || car.isDrifting;
      if (car.mesh.userData.brakeGlow) {
        car.mesh.userData.brakeGlow.intensity = isBraking ? 3.4 : 1.1;
      }
      if (car.mesh.userData.brakeMat) {
        car.mesh.userData.brakeMat.color.setHex(isBraking ? 0xff3355 : 0xff0828);
      }
      if (car.mesh.userData.realModelRearMats) {
        const targetIntensity = isBraking ? 4.2 : 2.2;
        car.mesh.userData.realModelRearMats.forEach(m => {
          m.emissiveIntensity = targetIntensity;
        });
      }
    }

    // Dynamic Nitro Flame Exhaust Cones
    if (car.mesh.userData && car.mesh.userData.nitroFlames) {
      const isNitro = car.isNitroActive;
      car.mesh.userData.nitroFlames.forEach(flame => {
        flame.visible = isNitro;
        if (isNitro) {
          const s = 0.85 + Math.random() * 0.35;
          flame.scale.set(s, s, s);
        }
      });
    }

    // Audio Engine
    const rpmRatio = (speedMph % 45) / 45;
    window.racingAudio.updateEngine(rpmRatio, this.keys.up, speedMph / 200);

    if (car.isDrifting) {
      window.racingAudio.playTireScreech(0.7);
    } else {
      window.racingAudio.stopTireScreech();
    }
  }

  updateAIVehicles(dt) {
    const scale = 0.5;
    const wps = this.trackData.waypoints;

    for (const ai of this.aiVehicles) {
      const targetWp = wps[ai.currentWpIdx];
      const targetX = (targetWp.z !== undefined) ? targetWp.x : (targetWp.x - 1400) * scale;
      const targetZ = (targetWp.z !== undefined) ? targetWp.z : (targetWp.y - 1200) * scale;

      const dx = targetX - ai.x;
      const dz = targetZ - ai.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 25) {
        const hitWp = ai.currentWpIdx;
        ai.currentWpIdx = (ai.currentWpIdx + 1) % wps.length;
        ai.currentCheckpoint = ai.currentWpIdx;
        ai.totalCheckpoints = (ai.totalCheckpoints || 0) + 1;
        if (hitWp === 0 && ai.totalCheckpoints >= wps.length - 1) {
          ai.lap = (ai.lap || 1) + 1;
        }
      }

      const targetAngle = Math.atan2(dx, dz);
      let angleDiff = targetAngle - ai.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      ai.angle += angleDiff * Math.min(1.0, dt * 3.2);

      if (ai.speed < ai.maxSpeed) {
        ai.speed += ai.accel * dt;
      }

      ai.x += Math.sin(ai.angle) * ai.speed * dt;
      ai.z += Math.cos(ai.angle) * ai.speed * dt;

      ai.mesh.position.set(ai.x, 0.045, ai.z);
      ai.mesh.rotation.order = 'YXZ';
      ai.mesh.rotation.set(0, ai.angle, 0);

      // Wheel animations for procedural fallback
      if (ai.mesh.userData && ai.mesh.userData.wheels && !ai.mesh.userData.isRealModelLoaded) {
        const rollRate = (ai.speed / 0.34) * dt;
        const w = ai.mesh.userData.wheels;
        w.fl.roll.rotation.x += rollRate;
        w.fr.roll.rotation.x += rollRate;
        w.rl.roll.rotation.x += rollRate;
        w.rr.roll.rotation.x += rollRate;
        w.fl.hub.rotation.y = -angleDiff * 0.4;
        w.fr.hub.rotation.y = -angleDiff * 0.4;
      }

      // Dynamic taillights and braking response for AI vehicles
      if (ai.mesh.userData && (ai.mesh.userData.brakeGlow || ai.mesh.userData.brakeMat || ai.mesh.userData.realModelRearMats)) {
        const isAIBraking = Math.abs(angleDiff) > 0.40 && ai.speed > 25;
        if (ai.mesh.userData.brakeGlow) {
          ai.mesh.userData.brakeGlow.intensity = isAIBraking ? 2.8 : 1.1;
        }
        if (ai.mesh.userData.brakeMat) {
          ai.mesh.userData.brakeMat.color.setHex(isAIBraking ? 0xff3355 : 0xff0828);
        }
        if (ai.mesh.userData.realModelRearMats) {
          const targetIntensity = isAIBraking ? 3.8 : 2.2;
          ai.mesh.userData.realModelRearMats.forEach(m => {
            m.emissiveIntensity = targetIntensity;
          });
        }
      }
    }
  }

  // ==========================================================================
  // Realistic Multi-Sphere Vehicle Physics & Solid Collision Resolution
  // ==========================================================================

  getVehicleCollisionSpheres(veh) {
    const angle = veh.angle || 0;
    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);
    const x = veh.x || 0;
    const z = veh.z || 0;
    const radius = 1.05; // 2.10m total body width coverage

    return [
      { x: x + sinA * 1.35, z: z + cosA * 1.35, r: radius, type: 'front' },
      { x: x,               z: z,               r: radius, type: 'center' },
      { x: x - sinA * 1.35, z: z - cosA * 1.35, r: radius, type: 'rear' }
    ];
  }

  resolveVehiclePairCollision(carA, carB, isPlayerA = true) {
    if (!carA || !carB) return false;

    // Fast broadphase distance check to avoid sphere math when far away
    const bDx = carA.x - carB.x;
    const bDz = carA.z - carB.z;
    if (Math.abs(bDx) > 6.0 || Math.abs(bDz) > 6.0) return false;

    const spheresA = this.getVehicleCollisionSpheres(carA);
    const spheresB = this.getVehicleCollisionSpheres(carB);

    let minDistance = 9999;
    let closestPair = null;

    for (let i = 0; i < spheresA.length; i++) {
      for (let j = 0; j < spheresB.length; j++) {
        const sA = spheresA[i];
        const sB = spheresB[j];
        const dx = sA.x - sB.x;
        const dz = sA.z - sB.z;
        const dist = Math.hypot(dx, dz);
        const minDist = sA.r + sB.r; // 2.10m contact threshold

        if (dist < minDist && dist < minDistance) {
          minDistance = dist;
          closestPair = { sA, sB, dx, dz, dist, minDist };
        }
      }
    }

    if (!closestPair) return false;

    // Contact detected!
    const { sA, sB, dx, dz, dist, minDist } = closestPair;
    const overlap = Math.max(0.04, minDist - dist);
    let nx = dist > 0.001 ? (dx / dist) : Math.sin(carA.angle || 0);
    let nz = dist > 0.001 ? (dz / dist) : Math.cos(carA.angle || 0);

    // 1. Position Separation with generous push out to eliminate sticking
    const sepA = isPlayerA ? 0.45 : 0.5;
    const sepB = isPlayerA ? 0.75 : 0.5;

    carA.x += nx * (overlap + 0.08) * sepA;
    carA.z += nz * (overlap + 0.08) * sepA;
    carB.x -= nx * (overlap + 0.08) * sepB;
    carB.z -= nz * (overlap + 0.08) * sepB;

    if (carA.mesh) carA.mesh.position.set(carA.x, 0.045, carA.z);
    if (carB.mesh) carB.mesh.position.set(carB.x, 0.045, carB.z);

    // 2. Velocity & Momentum Transfer (Eliminates car getting stuck!)
    const spdA = carA.speed || 0;
    const spdB = carB.speed || 0;
    const angA = carA.angle || 0;
    const angB = carB.angle || 0;

    const vAx = Math.sin(angA) * spdA;
    const vAz = Math.cos(angA) * spdA;
    const vBx = Math.sin(angB) * spdB;
    const vBz = Math.cos(angB) * spdB;

    // Relative velocity of A with respect to B along collision normal
    const vRelX = vAx - vBx;
    const vRelZ = vAz - vBz;
    const vNormal = vRelX * nx + vRelZ * nz;

    // Forward direction of car A
    const fAx = Math.sin(angA);
    const fAz = Math.cos(angA);
    const toBDx = carB.x - carA.x;
    const toBDz = carB.z - carA.z;
    const isAhead = (fAx * toBDx + fAz * toBDz) > 0;

    if (isAhead && spdA > spdB) {
      // Rear-end shove: Car A hits Car B from behind
      const shoveSpeed = Math.max(spdB + 6.0, spdA * 0.85 + 3.0);
      carB.speed = shoveSpeed;
      if (carB.laneOffset !== undefined) {
        const laneShift = (nx > 0 ? -2.2 : 2.2);
        carB.laneOffset = Math.max(-12, Math.min(12, carB.laneOffset + laneShift));
      }

      // Player car A maintains forward drive without dropping to 0 or getting stuck
      carA.speed = Math.max(14.0, spdA * 0.92);

      // Deflect car angle slightly
      const steerTorque = (nx * Math.cos(angA) - nz * Math.sin(angA));
      carA.angle += steerTorque * 0.02;
    } else if (vNormal < -2.0) {
      // Strong head-on closing collision
      carA.speed = -Math.min(3.5, Math.max(1.0, spdA * 0.15));
      carB.speed = -Math.min(3.5, Math.max(1.0, spdB * 0.15));
    } else {
      // Glancing side scrape: maintain forward drive, never lock to negative speeds!
      carA.speed = Math.max(carA.speed < 0 ? carA.speed : 8.0, spdA * 0.96);
      carB.speed = Math.max(carB.speed < 0 ? carB.speed : 8.0, spdB * 0.96);
      const steerTorque = (nx * Math.cos(angA) - nz * Math.sin(angA));
      carA.angle += steerTorque * 0.025;
    }

    // 3. Contact Sparks, Crash Sound, and Impact Rumble
    const contactX = (sA.x + sB.x) / 2;
    const contactZ = (sA.z + sB.z) / 2;
    this.spawnSparks(contactX, 0.5, contactZ, nx, nz);

    if (isPlayerA) {
      const now = performance.now();
      if (!this.lastCarCrashTime || (now - this.lastCarCrashTime) > 200) {
        this.lastCarCrashTime = now;
        if (window.racingAudio && window.racingAudio.playCrashSound) {
          window.racingAudio.playCrashSound();
        }
      }
      this.crashShake = Math.min(0.3, (this.crashShake || 0) + 0.14);
    }

    return true;
  }

  handleVehicleCollisions(dt) {
    if (!this.playerVehicle) return;
    const player = this.playerVehicle;

    // 1. Player vs. Civilian Traffic Cars
    if (this.trafficPolice && this.trafficPolice.trafficCars) {
      for (const tCar of this.trafficPolice.trafficCars) {
        this.resolveVehiclePairCollision(player, tCar, true);
      }
    }

    // 2. Player vs. Police Cruisers
    if (this.trafficPolice && this.trafficPolice.policeCruisers) {
      for (const cop of this.trafficPolice.policeCruisers) {
        this.resolveVehiclePairCollision(player, cop, true);
      }
    }

    // 3. Player vs. AI Rival Vehicles
    if (this.aiVehicles && this.aiVehicles.length > 0) {
      for (const ai of this.aiVehicles) {
        this.resolveVehiclePairCollision(player, ai, true);
      }
    }

    // 4. AI Rivals vs. Civilian Traffic Cars (prevents AI ghosting through traffic)
    if (this.aiVehicles && this.trafficPolice && this.trafficPolice.trafficCars) {
      for (const ai of this.aiVehicles) {
        for (const tCar of this.trafficPolice.trafficCars) {
          const dCenter = Math.hypot(ai.x - tCar.x, ai.z - tCar.z);
          if (dCenter < 6.0) {
            this.resolveVehiclePairCollision(ai, tCar, false);
          }
        }
      }
    }
  }

  updateCamera(dt) {
    const car = this.playerVehicle;

    if (this.cameraMode === 'CHARACTER') {
      // Third-person camera following on-foot player
      const targetCam = new THREE.Vector3(
        this.character.x - Math.sin(this.character.yaw) * 4.5,
        this.character.y + 2.5,
        this.character.z - Math.cos(this.character.yaw) * 4.5
      );
      this.camera.position.lerp(targetCam, dt * 8);
      this.camera.lookAt(this.character.x, this.character.y + 1.4, this.character.z);
      return;
    }

    if (this.cameraMode === 'HOOD') {
      // Front hood / bumper nose camera (Forza/GT style, 100% unobstructed road view)
      const fX = Math.sin(car.angle);
      const fZ = Math.cos(car.angle);
      const rX = -Math.cos(car.angle);
      const rZ = Math.sin(car.angle);
      const noseDist = 2.15;
      const camY = (car.y !== undefined ? car.y : (car.mesh ? car.mesh.position.y : 0.045)) + 0.85;

      this.camera.position.set(
        car.x + fX * noseDist,
        camY,
        car.z + fZ * noseDist
      );
      const lookDist = 55;
      const targetY = camY - 0.04 + (car.pitch || 0) * 1.5;
      this.camera.lookAt(
        car.x + fX * (noseDist + lookDist),
        targetY,
        car.z + fZ * (noseDist + lookDist)
      );
      this.camera.up.set(rX * (car.roll || 0) * 1.2, 1, rZ * (car.roll || 0) * 1.2);
    } else if (this.cameraMode === 'INTERIOR' || this.cameraMode === 'COCKPIT') {
      // Realistic Driver Cockpit Interior View (framed through transparent windshield HUD)
      const fX = Math.sin(car.angle);
      const fZ = Math.cos(car.angle);
      const rX = -Math.cos(car.angle); // right vector
      const rZ = Math.sin(car.angle);

      // Driver seated at left side, slightly forward
      const seatX = -rX * 0.32 + fX * 0.18;
      const seatZ = -rZ * 0.32 + fZ * 0.18;
      const eyeHeight = (car.y !== undefined ? car.y : (car.mesh ? car.mesh.position.y : 0.045)) + 1.08;

      this.camera.position.set(
        car.x + seatX,
        eyeHeight,
        car.z + seatZ
      );

      // Look ahead through windshield frame onto the track
      const lookDist = 55;
      const lookX = car.x + seatX + fX * lookDist;
      const lookY = eyeHeight - 0.06 + (car.pitch || 0) * 1.4;
      const lookZ = car.z + seatZ + fZ * lookDist;

      this.camera.lookAt(lookX, lookY, lookZ);

      // Cockpit banking roll for G-force immersion
      this.camera.up.set(rX * (car.roll || 0) * 1.3, 1, rZ * (car.roll || 0) * 1.3);
    } else if (this.cameraMode === 'AERIAL') {
      // Helicopter / Drone Aerial Bird's-Eye View (Exciting Top-Down Perspective)
      const speedPct = Math.abs(car.speed) / car.maxSpeed;
      const aerialAltitude = 16.0 + speedPct * 3.5;
      const followDist = 11.0 + speedPct * 2.5;
      const baseY = (car.y !== undefined ? car.y : (car.mesh ? car.mesh.position.y : 0.045));

      const targetCam = new THREE.Vector3(
        car.x - Math.sin(car.angle) * followDist,
        baseY + aerialAltitude,
        car.z - Math.cos(car.angle) * followDist
      );

      const lookDist = 14.0;
      const lookTarget = new THREE.Vector3(
        car.x + Math.sin(car.angle) * lookDist,
        baseY + 0.4,
        car.z + Math.cos(car.angle) * lookDist
      );

      this.cameraLag.lerp(targetCam, dt * 6.0);
      this.lookLag.lerp(lookTarget, dt * 8.0);

      this.camera.up.set(0, 1, 0);
      this.camera.position.copy(this.cameraLag);
      this.camera.lookAt(this.lookLag);

      // Smooth aerial FOV adjustment
      const targetFOV = car.isNitroActive ? 78 : (65 + speedPct * 6);
      this.camera.fov += (targetFOV - this.camera.fov) * (dt * 6);
      this.camera.updateProjectionMatrix();
    } else {
      // Dynamic Chase Camera [CHASE] (With banking roll & speed rumble)
      const speedMph = Math.round(Math.abs(car.speed) * 2.237);
      const speedPct = Math.abs(car.speed) / car.maxSpeed;
      const followDist = 7.0 + speedPct * 2.5;
      const followHeight = 2.8 + speedPct * 0.4;

      const targetCam = new THREE.Vector3(
        car.x - Math.sin(car.angle) * followDist,
        car.y + followHeight,
        car.z - Math.cos(car.angle) * followDist
      );

      const lookTarget = new THREE.Vector3(
        car.x + Math.sin(car.angle) * 8,
        car.y + 1.2,
        car.z + Math.cos(car.angle) * 8
      );

      this.cameraLag.lerp(targetCam, dt * 7.5);
      this.lookLag.lerp(lookTarget, dt * 10);

      this.camera.up.set(0, 1, 0);
      this.camera.position.copy(this.cameraLag);
      this.camera.lookAt(this.lookLag);

      // High Speed Camera Rumble / Vibration (lateral micro-jitter)
      if (speedMph > 85) {
        const shake = Math.min(0.025, ((speedMph - 85) / 115) * 0.02);
        this.camera.position.x += (Math.random() - 0.5) * shake;
        this.camera.position.y += (Math.random() - 0.5) * shake;
      }

      // Crash Impact Camera Shake
      if (this.crashShake > 0.001) {
        this.camera.position.x += (Math.random() - 0.5) * this.crashShake;
        this.camera.position.y += (Math.random() - 0.5) * this.crashShake * 0.7;
        this.crashShake = Math.max(0, this.crashShake - dt * 2.2);
      }

      // FOV expands dynamically on nitro rush!
      const targetFOV = car.isNitroActive ? 86 : (65 + speedPct * 9);
      this.camera.fov += (targetFOV - this.camera.fov) * (dt * 7);
      this.camera.updateProjectionMatrix();
    }
  }

  updateCheckpoints() {
    const scale = 0.5;
    const wps = this.trackData.waypoints;
    const targetWp = wps[this.playerVehicle.currentCheckpoint];
    if (!targetWp) return;
    const gx = (targetWp.z !== undefined) ? targetWp.x : (targetWp.x - 1400) * scale;
    const gz = (targetWp.z !== undefined) ? targetWp.z : (targetWp.y - 1200) * scale;

    const dist = Math.hypot(this.playerVehicle.x - gx, this.playerVehicle.z - gz);
    if (dist < 32) {
      const hitWp = this.playerVehicle.currentCheckpoint;
      this.world.flashCheckpoint(this.playerVehicle.currentCheckpoint);
      this.playerVehicle.currentCheckpoint = (this.playerVehicle.currentCheckpoint + 1) % wps.length;
      this.playerVehicle.totalCheckpoints++;

      if (hitWp === 0 && this.playerVehicle.totalCheckpoints >= wps.length - 1) {
        if (this.bestLapTime === 0 || this.currentLapTime < this.bestLapTime) {
          this.bestLapTime = this.currentLapTime;
        }
        this.playerVehicle.lap++;
        this.currentLap = this.playerVehicle.lap;
        this.currentLapTime = 0;
      }
    }
  }

  updateRacePositions() {
    if (!this.playerVehicle || !this.allVehicles || !this.trackData || !this.trackData.waypoints) return;
    const wps = this.trackData.waypoints;
    const scale = 0.5;

    for (const veh of this.allVehicles) {
      const nextIdx = veh.isAI ? (veh.currentWpIdx || 0) : (veh.currentCheckpoint || 0);
      const targetWp = wps[nextIdx] || wps[0];
      const gx = (targetWp.z !== undefined) ? targetWp.x : (targetWp.x - 1400) * scale;
      const gz = (targetWp.z !== undefined) ? targetWp.z : (targetWp.y - 1200) * scale;

      const prevIdx = (nextIdx - 1 + wps.length) % wps.length;
      const prevWp = wps[prevIdx] || wps[0];
      const px = (prevWp.z !== undefined) ? prevWp.x : (prevWp.x - 1400) * scale;
      const pz = (prevWp.z !== undefined) ? prevWp.z : (prevWp.y - 1200) * scale;

      const segLen = Math.hypot(gx - px, gz - pz) || 100;
      const distToNext = Math.hypot(veh.x - gx, veh.z - gz);
      const frac = Math.max(0, Math.min(1, 1 - (distToNext / segLen)));

      veh.raceScore = ((veh.totalCheckpoints || 0) * 1000) + (frac * 1000);
    }

    const sorted = [...this.allVehicles].sort((a, b) => (b.raceScore || 0) - (a.raceScore || 0));
    sorted.forEach((veh, idx) => {
      veh.finishRank = idx + 1;
    });
  }

  updateHUD(dt = 0.016) {
    if (!this.playerVehicle) return;
    const speedMph = Math.round(Math.abs(this.playerVehicle.speed) * 2.237);

    // Gear computation (N, G1 to G6)
    let currentGear = 'N';
    if (speedMph < 2) currentGear = 'N';
    else if (speedMph < 35) currentGear = 'G1';
    else if (speedMph < 70) currentGear = 'G2';
    else if (speedMph < 110) currentGear = 'G3';
    else if (speedMph < 155) currentGear = 'G4';
    else if (speedMph < 205) currentGear = 'G5';
    else currentGear = 'G6';

    // Speedometer
    const speedEl = document.getElementById('digitalSpeedVal');
    if (speedEl) speedEl.textContent = speedMph;

    // Gear indicator
    const gearEl = document.getElementById('hudGearVal');
    if (gearEl) gearEl.textContent = currentGear;

    // Update Cockpit Interior Display if active
    if (this.cameraMode === 'INTERIOR') {
      const cSpeed = document.getElementById('cockpitSpeedVal');
      if (cSpeed) cSpeed.textContent = speedMph;

      const cGear = document.getElementById('cockpitGear');
      if (cGear) cGear.textContent = currentGear;

      const cRpm = document.getElementById('cockpitRpmFill');
      if (cRpm) {
        const rpmPct = Math.min(1.0, (speedMph % 45) / 45);
        cRpm.style.width = Math.round(rpmPct * 100) + '%';
      }

      const wheelEl = document.getElementById('cockpitSteeringWheel');
      if (wheelEl) {
        const rotDeg = (this.playerVehicle.steerAngle || 0) * 110;
        wheelEl.style.transform = `rotate(${rotDeg}deg)`;
      }

      // Rearview mirror traffic / rival blips
      const mirrorBlipsContainer = document.getElementById('mirrorBlips');
      if (mirrorBlipsContainer) {
        const p = this.playerVehicle;
        const forwardX = Math.sin(p.angle);
        const forwardZ = Math.cos(p.angle);
        const rightX = -Math.cos(p.angle);
        const rightZ = Math.sin(p.angle);

        let blipsHtml = '';
        const behindList = [];
        if (this.aiVehicles) behindList.push(...this.aiVehicles);
        if (this.trafficPolice && this.trafficPolice.trafficCars) behindList.push(...this.trafficPolice.trafficCars);
        if (this.trafficPolice && this.trafficPolice.policeCruisers) behindList.push(...this.trafficPolice.policeCruisers);

        for (const other of behindList) {
          const dx = other.x - p.x;
          const dz = other.z - p.z;
          const dist = Math.hypot(dx, dz);
          if (dist > 3 && dist < 55) {
            const dot = dx * forwardX + dz * forwardZ;
            if (dot < -2) { // strictly behind player
              const latDot = dx * rightX + dz * rightZ;
              const mirrorX = 115 - latDot * 8;
              const mirrorY = 22 + (dist / 55) * 15;
              const color = other.isPolice ? '#00f0ff' : '#ff0055';
              blipsHtml += `<div class="mirror-car-blip" style="left:${Math.max(10, Math.min(205, mirrorX))}px; top:${mirrorY}px; background:${color}; box-shadow:0 0 6px ${color};"></div>`;
            }
          }
        }
        mirrorBlipsContainer.innerHTML = blipsHtml;
      }
    }

    // Position & Laps
    const posEl = document.getElementById('hudPositionVal');
    if (posEl) posEl.textContent = this.playerVehicle.finishRank;

    const lapEl = document.getElementById('hudLapCounter');
    if (lapEl) lapEl.textContent = `LAP ${Math.min(this.totalLaps, this.currentLap)} / ${this.totalLaps}`;

    const timerEl = document.getElementById('hudTimeVal');
    if (timerEl) {
      const min = Math.floor(this.raceTotalTime / 60);
      const sec = (this.raceTotalTime % 60).toFixed(2);
      timerEl.textContent = `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }

    // Nitro Bar & Button State
    const nitroFill = document.getElementById('nitroBarFill');
    if (nitroFill) {
      nitroFill.style.width = `${this.playerVehicle.nitroAmount}%`;
    }
    const nitroBtn = document.getElementById('btnNitro');
    if (nitroBtn) {
      if (this.nitroDepleted || this.playerVehicle.nitroAmount <= 5) {
        nitroBtn.classList.add('nitro-empty');
      } else {
        nitroBtn.classList.remove('nitro-empty');
      }
    }

    // CarX Highway Distance Progress Tracker
    const totalWps = (this.trackData && this.trackData.waypoints) ? this.trackData.waypoints.length : 12;
    const totalRaceUnits = Math.max(1, this.totalLaps * totalWps * 1000);
    const playerProgressPct = Math.min(100, Math.max(0, ((this.playerVehicle.raceScore || 0) / totalRaceUnits) * 100));

    const highwayFill = document.getElementById('highwayTrackFill');
    if (highwayFill) highwayFill.style.width = `${playerProgressPct.toFixed(1)}%`;

    const playerMarker = document.getElementById('hudPlayerMarker');
    if (playerMarker) playerMarker.style.left = `${playerProgressPct.toFixed(1)}%`;

    if (this.aiVehicles && this.aiVehicles.length > 0) {
      this.aiVehicles.forEach((ai, idx) => {
        const rivalMarker = document.getElementById(`hudRivalMarker${idx + 1}`);
        if (rivalMarker) {
          const aiProgressPct = Math.min(98, Math.max(0, ((ai.raceScore || 0) / totalRaceUnits) * 100));
          rivalMarker.style.left = `${aiProgressPct.toFixed(1)}%`;
        }
      });
    }

    const policeMarker = document.getElementById('hudPoliceMarker');
    if (policeMarker) {
      const policeProgress = Math.min(95, Math.max(0, playerProgressPct - 7.5));
      policeMarker.style.left = `${policeProgress.toFixed(1)}%`;
    }

    const totalDistEl = document.getElementById('hudTotalDistanceLabel');
    if (totalDistEl && this.trackData) {
      totalDistEl.textContent = `${this.trackData.length_km || 4.2} KM`;
    }

    // CarX Event Mission Objectives Checklist Updates
    this.maxSpeedRecorded = Math.max(this.maxSpeedRecorded, speedMph);

    const obj1 = document.getElementById('hudObj1');
    const obj1Status = document.getElementById('hudObj1Status');
    if (obj1 && obj1Status) {
      const isFirst = this.playerVehicle.finishRank === 1;
      obj1.classList.toggle('completed', isFirst);
      obj1Status.textContent = isFirst ? '✓ 1ST PLACE' : `POS ${this.playerVehicle.finishRank}/4`;
    }

    const obj2 = document.getElementById('hudObj2');
    const obj2Status = document.getElementById('hudObj2Status');
    if (obj2 && obj2Status) {
      const isNearMissDone = this.nearMissCount >= 3;
      obj2.classList.toggle('completed', isNearMissDone);
      obj2Status.textContent = isNearMissDone ? `✓ ${this.nearMissCount}/3` : `${this.nearMissCount} / 3`;
    }

    const obj3 = document.getElementById('hudObj3');
    const obj3Status = document.getElementById('hudObj3Status');
    if (obj3 && obj3Status) {
      const isSpeedDone = this.maxSpeedRecorded >= 180;
      obj3.classList.toggle('completed', isSpeedDone);
      obj3Status.textContent = isSpeedDone ? `✓ ${Math.round(this.maxSpeedRecorded)} MPH` : `${Math.round(this.maxSpeedRecorded)} MPH`;
    }

    // Analog curved racing tachometer
    const rpmRatio = (speedMph % 45) / 45;
    this.renderAnalogSpeedo(rpmRatio, speedMph, currentGear);

    // Fullscreen Speed Motion Lines & Nitro Warp
    this.updateSpeedFX(dt);

    // Floating 3D AI Rival Overhead Distance Tags
    this.updateRivalNametags();

    // Live Holographic GPS Route Minimap
    this.renderLiveGpsMinimap();
  }

  /* --------------------------------------------------------------------------
     Official F1 Grand Prix Telemetry, Live Delta & DRS Zone Signals
     -------------------------------------------------------------------------- */
  updateF1Telemetry(dt) {
    if (!this.playerVehicle) return;

    this.f1CurrentLapTime = (this.f1CurrentLapTime || 0) + dt;

    // High precision millisecond F1 lap timer display: 01:23.456
    const timerEl = document.getElementById('hudTimeVal');
    if (timerEl) {
      const min = Math.floor(this.f1CurrentLapTime / 60);
      const sec = (this.f1CurrentLapTime % 60).toFixed(3);
      timerEl.textContent = `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
    }

    // Determine current waypoint progress and sector
    const wps = (this.trackData && this.trackData.waypoints) ? this.trackData.waypoints : [];
    const totalWps = Math.max(1, wps.length);
    const curWp = (this.playerVehicle.currentWpIdx || 0) % totalWps;

    // Sectors: 0 to ~35% (S1), ~35% to ~70% (S2), ~70% to 100% (S3)
    const sec1End = Math.max(1, Math.floor(totalWps * 0.35));
    const sec2End = Math.max(2, Math.floor(totalWps * 0.70));

    let currentSec = 1;
    if (curWp >= sec2End) currentSec = 3;
    else if (curWp >= sec1End) currentSec = 2;

    // Sector crossing splits
    if (currentSec !== this.f1CurrentSector) {
      const completedSec = this.f1CurrentSector;
      this.f1CurrentSector = currentSec;

      if (completedSec === 1) {
        const s1Time = this.f1CurrentLapTime;
        this.f1SectorTimes[0] = s1Time;
        const chip = document.getElementById('f1Sector1');
        const val = document.getElementById('f1Sector1Val');
        if (chip && val) {
          val.textContent = s1Time.toFixed(3);
          chip.className = 'f1-sector-chip ' + (s1Time < this.f1BestSectorTimes[0] ? 'purple' : (s1Time < 28.5 ? 'green' : 'yellow'));
        }
      } else if (completedSec === 2) {
        const s2Time = Math.max(0.1, this.f1CurrentLapTime - (this.f1SectorTimes[0] || 27.5));
        this.f1SectorTimes[1] = s2Time;
        const chip = document.getElementById('f1Sector2');
        const val = document.getElementById('f1Sector2Val');
        if (chip && val) {
          val.textContent = s2Time.toFixed(3);
          chip.className = 'f1-sector-chip ' + (s2Time < this.f1BestSectorTimes[1] ? 'purple' : (s2Time < 31.0 ? 'green' : 'yellow'));
        }
      }
    }

    // Live Lap Delta Calculation against pole pace
    const targetLapPace = 79.5; // Benchmark Monza pace (1:19.500)
    const progressPct = curWp / totalWps;
    const expectedElapsed = progressPct * targetLapPace;
    const delta = (this.f1CurrentLapTime - expectedElapsed);
    const deltaEl = document.getElementById('f1DeltaVal');
    if (deltaEl) {
      if (delta <= 0) {
        deltaEl.textContent = `Δ ${delta.toFixed(3)}`;
        deltaEl.classList.remove('trailing');
      } else {
        deltaEl.textContent = `Δ +${delta.toFixed(3)}`;
        deltaEl.classList.add('trailing');
      }
    }

    // DRS Zone Detection:
    // Rettifilo Straight (wps 0 to 2) and Serraglio Straight (wps 8 to 10)
    const inDrsZone = (curWp <= 2 || (curWp >= 8 && curWp <= 10));
    const drsBadge = document.getElementById('f1DrsStatusBadge');
    const drsInd = document.getElementById('f1DrsIndicator');

    if (inDrsZone) {
      this.f1DrsAvailable = true;
      const isActivating = (this.keys && (this.keys.nitro || this.keys.up));
      if (isActivating && Math.abs(this.playerVehicle.speed) > 25) {
        this.f1DrsActive = true;
        // Aerodynamic DRS top speed & acceleration boost (+15% max speed)
        this.playerVehicle.speed += dt * 12.0;
        if (drsBadge) drsBadge.className = 'f1-drs-status-badge active';
        if (drsInd) drsInd.textContent = '🚀 DRS ACTIVE (+15% TOP SPEED)';
      } else {
        this.f1DrsActive = false;
        if (drsBadge) drsBadge.className = 'f1-drs-status-badge available';
        if (drsInd) drsInd.textContent = '🟢 DRS AVAILABLE [PRESS BOOST]';
      }
    } else {
      this.f1DrsAvailable = false;
      this.f1DrsActive = false;
      if (drsBadge) drsBadge.className = 'f1-drs-status-badge';
      if (drsInd) drsInd.textContent = '⚪ DRS ZONE 350M';
    }
  }

  renderAnalogSpeedo(rpmRatio, speedMph, currentGear) {
    const canvas = document.getElementById('speedoCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const radius = 52;

    // Background circular dial
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(8, 12, 20, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Start angle 135 deg to 405 deg (270 deg total arc)
    const startAngle = Math.PI * 0.75;
    const endAngle = Math.PI * 2.25;
    const totalArc = endAngle - startAngle;

    // Normal RPM Arc (Cyan to Gold)
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, startAngle + totalArc * 0.72);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Redline Arc (Red 7k-9k)
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle + totalArc * 0.72, endAngle);
    ctx.strokeStyle = 'rgba(255, 0, 85, 0.75)';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Ticks (0 to 9)
    for (let i = 0; i <= 9; i++) {
      const a = startAngle + (i / 9) * totalArc;
      const isRed = i >= 7;
      const x1 = cx + Math.cos(a) * (radius - 5);
      const y1 = cy + Math.sin(a) * (radius - 5);
      const x2 = cx + Math.cos(a) * (radius + 1);
      const y2 = cy + Math.sin(a) * (radius + 1);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = isRed ? '#ff0055' : 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = (i % 2 === 0) ? 2.2 : 1.0;
      ctx.stroke();
    }

    // Active RPM Glowing Arc
    const activeAngle = startAngle + Math.min(1.0, Math.max(0, rpmRatio)) * totalArc;
    const isRedline = rpmRatio > 0.82;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, activeAngle);
    ctx.strokeStyle = isRedline ? '#ff0055' : '#00f0ff';
    ctx.lineWidth = 5;
    ctx.shadowColor = isRedline ? '#ff0055' : '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Sweeping Needle
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const nx = cx + Math.cos(activeAngle) * (radius - 3);
    const ny = cy + Math.sin(activeAngle) * (radius - 3);
    ctx.lineTo(nx, ny);
    ctx.strokeStyle = isRedline ? '#ff0055' : '#00f0ff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Center Gear Hub
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0e1a';
    ctx.fill();
    ctx.strokeStyle = isRedline ? '#ff0055' : 'rgba(0, 240, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(currentGear || 'G1', cx, cy);
  }

  updateSpeedFX(dt) {
    const canvas = document.getElementById('speedFxCanvas');
    if (!canvas) return;

    const speedMph = Math.round(Math.abs(this.playerVehicle ? this.playerVehicle.speed : 0) * 2.237);
    const isNitro = this.playerVehicle && this.playerVehicle.isNitroActive;

    if (speedMph < 85 && !isNitro) {
      if (this.speedFxActive) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.speedFxActive = false;
      }
      return;
    }

    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.speedFxActive = true;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const count = isNitro ? 32 : Math.min(22, Math.floor((speedMph - 85) / 4.5));

    ctx.save();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
      const distStart = Math.min(cx, cy) * (isNitro ? 0.4 : 0.6) + Math.random() * 80;
      const length = isNitro ? 160 + Math.random() * 190 : 75 + Math.random() * 95;

      const x1 = cx + Math.cos(angle) * distStart;
      const y1 = cy + Math.sin(angle) * distStart;
      const x2 = cx + Math.cos(angle) * (distStart + length);
      const y2 = cy + Math.sin(angle) * (distStart + length);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = isNitro ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = isNitro ? 2.4 : 1.2;
      ctx.stroke();
    }
    ctx.restore();
  }

  updateRivalNametags() {
    const container = document.getElementById('hudRivalTagsContainer');
    if (!container || !this.camera || !this.playerVehicle) return;

    if (this.state === 'COUNTDOWN') {
      if (this.rivalTagElements) {
        this.rivalTagElements.forEach(pill => { pill.style.display = 'none'; });
      }
      return;
    }

    if (!this.rivalTagElements) {
      this.rivalTagElements = [];
      this.aiVehicles.forEach((ai, idx) => {
        const pill = document.createElement('div');
        pill.className = 'rival-nametag-pill';
        pill.innerHTML = `
          <span class="rival-nametag-rank">${idx + 2}</span>
          <span class="rival-nametag-name">${ai.name || 'RIVAL'}</span>
          <span class="rival-nametag-dist">+0m</span>
        `;
        container.appendChild(pill);
        this.rivalTagElements.push(pill);
      });
    }

    const tempVec = new THREE.Vector3();
    const halfW = window.innerWidth / 2;
    const halfH = window.innerHeight / 2;

    this.aiVehicles.forEach((ai, idx) => {
      const pill = this.rivalTagElements[idx];
      if (!pill) return;

      tempVec.set(ai.x, 1.8, ai.z);
      tempVec.project(this.camera);

      // Only show if in front of camera
      if (tempVec.z > 0 && tempVec.z < 1) {
        const sx = tempVec.x * halfW + halfW;
        const sy = -(tempVec.y * halfH) + halfH;

        const dx = ai.x - this.playerVehicle.x;
        const dz = ai.z - this.playerVehicle.z;
        const dist = Math.round(Math.hypot(dx, dz));

        const forwardX = Math.sin(this.playerVehicle.angle);
        const forwardZ = Math.cos(this.playerVehicle.angle);
        const dot = dx * forwardX + dz * forwardZ;
        const distSign = dot >= 0 ? '+' : '-';

        pill.style.left = `${sx}px`;
        pill.style.top = `${sy}px`;
        pill.style.display = (dist < 130) ? 'flex' : 'none';

        const rankEl = pill.querySelector('.rival-nametag-rank');
        if (rankEl) rankEl.textContent = ai.finishRank || (idx + 2);

        const distEl = pill.querySelector('.rival-nametag-dist');
        if (distEl) distEl.textContent = `${distSign}${dist}m`;
      } else {
        pill.style.display = 'none';
      }
    });
  }

  spawnTireSmoke(car) {
    if (!this.smokePool) return;
    const sin = Math.sin(car.angle);
    const cos = Math.cos(car.angle);
    const rearX = car.x - sin * 1.5;
    const rearZ = car.z - cos * 1.5;

    const offsets = [-0.85, 0.85];
    for (const off of offsets) {
      let particle = this.smokePool.find(p => !p.active);
      if (!particle) {
        let lowestLife = Infinity;
        for (const p of this.smokePool) {
          if (p.life < lowestLife) {
            lowestLife = p.life;
            particle = p;
          }
        }
      }
      if (!particle) continue;

      particle.active = true;
      particle.life = 0.6;
      particle.maxLife = 0.6;
      particle.growth = 4.2;
      particle.vx = (Math.random() - 0.5) * 1.2;
      particle.vy = 1.0 + Math.random() * 1.5;
      particle.vz = (Math.random() - 0.5) * 1.2;

      particle.mesh.position.set(rearX + cos * off, 0.35 + Math.random() * 0.15, rearZ - sin * off);
      particle.mesh.scale.set(1, 1, 1);
      particle.mesh.visible = true;
    }
  }

  spawnSparks(x, y, z, nx, nz) {
    if (!this.particleGroup) return;
    for (let i = 0; i < 4; i++) {
      const p = new THREE.Mesh(this.sharedSparkGeo, this.sharedSparkMat);
      p.position.set(x, y, z);
      this.particleGroup.add(p);
      this.particles.push({
        mesh: p,
        vx: nx * (6 + Math.random() * 9) + (Math.random() - 0.5) * 4,
        vy: 2.5 + Math.random() * 4.5,
        vz: nz * (6 + Math.random() * 9) + (Math.random() - 0.5) * 4,
        life: 0.32,
        maxLife: 0.32,
        gravity: 16.0
      });
    }
  }

  spawnVictoryFireworks() {
    if (!this.particleGroup || !this.playerVehicle) return;
    const mat = (this.fireworkMats && this.fireworkMats.length > 0)
      ? this.fireworkMats[Math.floor(Math.random() * this.fireworkMats.length)]
      : new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const startX = this.playerVehicle.x + (Math.random() - 0.5) * 20;
    const startY = 8 + Math.random() * 12;
    const startZ = this.playerVehicle.z + (Math.random() - 0.5) * 20;

    for (let i = 0; i < 24; i++) {
      const p = new THREE.Mesh(this.sharedFireworkGeo, mat);
      p.position.set(startX, startY, startZ);
      this.particleGroup.add(p);

      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 12;
      this.particles.push({
        mesh: p,
        vx: Math.cos(angle) * speed,
        vy: (Math.random() - 0.2) * speed,
        vz: Math.sin(angle) * speed,
        life: 0.9,
        maxLife: 0.9,
        gravity: 8.0
      });
    }
  }

  updateParticles(dt) {
    // 1. Update Pooled Smoke Particles (zero GC overhead)
    if (this.smokePool) {
      for (const p of this.smokePool) {
        if (!p.active) continue;
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
          p.mesh.visible = false;
          continue;
        }
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        const s = 1 + (1 - p.life / p.maxLife) * p.growth;
        p.mesh.scale.set(s, s, s);
      }
    }

    // 2. Update Dynamic Sparks / Fireworks
    if (!this.particleGroup || !this.particles) return;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particleGroup.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      if (p.gravity) p.vy -= p.gravity * dt;
    }
  }

  checkNearMisses(dt) {
    if (!this.playerVehicle || !this.character.isInVehicle) return;
    const speedMph = Math.abs(this.playerVehicle.speed) * 2.237;
    if (speedMph < 52) return;

    const now = performance.now();
    if (now - this.lastNearMissTime < 1400) return;

    const checkList = [];
    if (this.aiVehicles) checkList.push(...this.aiVehicles);
    if (this.trafficPolice) {
      if (this.trafficPolice.trafficCars) checkList.push(...this.trafficPolice.trafficCars);
      if (this.trafficPolice.policeCruisers) checkList.push(...this.trafficPolice.policeCruisers);
    }

    for (const other of checkList) {
      const ox = other.x !== undefined ? other.x : (other.mesh ? other.mesh.position.x : null);
      const oz = other.z !== undefined ? other.z : (other.mesh ? other.mesh.position.z : null);
      if (ox === null || oz === null) continue;

      const d = Math.hypot(this.playerVehicle.x - ox, this.playerVehicle.z - oz);
      if (d > 2.5 && d < 5.0) {
        this.lastNearMissTime = now;
        this.nearMissCount++;

        // Audio Effects
        if (window.racingAudio) {
          if (window.racingAudio.playWhooshNearMiss) window.racingAudio.playWhooshNearMiss();
          if (Math.random() < 0.4 && window.racingAudio.playTrafficHorn) window.racingAudio.playTrafficHorn();
        }

        const reward = speedMph > 115 ? 250 : 100;
        const text = speedMph > 115 ? `🔥 SPEED COMBO x${this.nearMissCount}! +$${reward}` : `⚡ NEAR MISS x${this.nearMissCount}! +$${reward}`;
        this.triggerCarxFeat(text, reward);
        break;
      }
    }
  }

  cacheGpsTrack() {
    if (!this.trackData || !this.trackData.waypoints) return;
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 90;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(8, 12, 20, 0.92)';
    ctx.fillRect(0, 0, 160, 90);

    const wps = this.trackData.waypoints;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    wps.forEach(p => {
      const px = p.x;
      const pz = (p.z !== undefined) ? p.z : (p.y !== undefined ? p.y : 0);
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (pz < minZ) minZ = pz;
      if (pz > maxZ) maxZ = pz;
    });

    const spanX = (maxX - minX) || 1;
    const spanZ = (maxZ - minZ) || 1;
    const pad = 12;
    const drawW = canvas.width - pad * 2;
    const drawH = canvas.height - pad * 2;

    this.gpsBounds = { minX, spanX, minZ, spanZ, pad, drawW, drawH };

    const toCanvasX = (x) => pad + ((x - minX) / spanX) * drawW;
    const toCanvasY = (z) => pad + ((z - minZ) / spanZ) * drawH;

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(toCanvasX(wps[0].x), toCanvasY(wps[0].z !== undefined ? wps[0].z : wps[0].y));
    for (let i = 1; i < wps.length; i++) {
      ctx.lineTo(toCanvasX(wps[i].x), toCanvasY(wps[i].z !== undefined ? wps[i].z : wps[i].y));
    }
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    this.cachedGpsTrackCanvas = canvas;
  }

  renderLiveGpsMinimap() {
    const canvas = document.getElementById('hudLiveGpsCanvas');
    if (!canvas || !this.trackData || !this.trackData.waypoints) return;
    if (!this.cachedGpsTrackCanvas || !this.gpsBounds) {
      this.cacheGpsTrack();
      if (!this.cachedGpsTrackCanvas) return;
    }

    if (canvas.width !== 160) canvas.width = 160;
    if (canvas.height !== 90) canvas.height = 90;
    const ctx = canvas.getContext('2d');

    // Blit pre-rendered background track outline
    ctx.drawImage(this.cachedGpsTrackCanvas, 0, 0);

    const { minX, spanX, minZ, spanZ, pad, drawW, drawH } = this.gpsBounds;
    const toCanvasX = (x) => pad + ((x - minX) / spanX) * drawW;
    const toCanvasY = (z) => pad + ((z - minZ) / spanZ) * drawH;

    // AI Rivals (Red Dots)
    if (this.aiVehicles) {
      ctx.fillStyle = '#ff0055';
      for (const ai of this.aiVehicles) {
        ctx.beginPath();
        ctx.arc(toCanvasX(ai.x), toCanvasY(ai.z), 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Police Cruisers (Flashing Red & Blue)
    if (this.trafficPolice && this.trafficPolice.policeCruisers && this.trafficPolice.policeCruisers.length > 0) {
      const isRed = Math.floor(performance.now() / 250) % 2 === 0;
      ctx.fillStyle = isRed ? '#ff0033' : '#0088ff';
      for (const pc of this.trafficPolice.policeCruisers) {
        ctx.beginPath();
        ctx.arc(toCanvasX(pc.x), toCanvasY(pc.z), 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Player Vehicle (Bright Cyan Dot with directional headlight indicator)
    if (this.playerVehicle) {
      const px = toCanvasX(this.playerVehicle.x);
      const py = toCanvasY(this.playerVehicle.z);

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      const beamLen = 8;
      const bx = px + Math.sin(this.playerVehicle.angle) * beamLen;
      const by = py + Math.cos(this.playerVehicle.angle) * beamLen;
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
  }

  checkNearMisses(dt) {
    if (!this.playerVehicle || !this.character.isInVehicle) return;
    const speedMph = Math.abs(this.playerVehicle.speed) * 2.237;
    if (speedMph < 58) return;

    const now = performance.now();
    if (now - this.lastNearMissTime < 1800) return; // 1.8s cooldown

    const checkList = [];
    if (this.aiVehicles) checkList.push(...this.aiVehicles);
    if (this.trafficPolice) {
      if (this.trafficPolice.trafficCars) checkList.push(...this.trafficPolice.trafficCars);
      if (this.trafficPolice.policeCruisers) checkList.push(...this.trafficPolice.policeCruisers);
    }

    for (const other of checkList) {
      const ox = other.x !== undefined ? other.x : (other.mesh ? other.mesh.position.x : null);
      const oz = other.z !== undefined ? other.z : (other.mesh ? other.mesh.position.z : null);
      if (ox === null || oz === null) continue;

      const d = Math.hypot(this.playerVehicle.x - ox, this.playerVehicle.z - oz);
      if (d > 2.0 && d < 4.8) {
        this.lastNearMissTime = now;
        this.nearMissCount++;
        const reward = speedMph > 115 ? 250 : 100;
        const text = speedMph > 115 ? `🔥 HIGHWAY COMBO! +$${reward}` : `⚡ NEAR MISS! +$${reward}`;
        this.triggerCarxFeat(text, reward);
        break;
      }
    }
  }

  triggerCarxFeat(text, reward = 100) {
    const popup = document.getElementById('carxFeatPopup');
    if (!popup) return;
    popup.textContent = text;
    popup.classList.add('active');

    // Add cash bonus to user career wallet
    if (window.racingApp && typeof window.racingApp.userCash === 'number') {
      window.racingApp.userCash += reward;
      window.racingApp.updateUI();
    }

    clearTimeout(this.featTimeout);
    this.featTimeout = setTimeout(() => {
      popup.classList.remove('active');
    }, 1200);
  }

  updateInteractionPrompt(show) {
    let promptEl = document.getElementById('vehicleInteractPrompt');
    if (!promptEl) {
      promptEl = document.createElement('div');
      promptEl.id = 'vehicleInteractPrompt';
      promptEl.style.cssText = `
        position: absolute;
        top: 60%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 240, 255, 0.2);
        border: 2px solid #00f0ff;
        border-radius: 8px;
        padding: 0.6rem 1.4rem;
        font-size: 1.1rem;
        font-weight: 800;
        color: #fff;
        text-shadow: 0 0 10px #00f0ff;
        display: none;
        z-index: 50;
      `;
      promptEl.textContent = '[E] ENTER VEHICLE';
      this.container.appendChild(promptEl);
    }
    promptEl.style.display = show ? 'block' : 'none';
  }

  resetPlayerToTrack() {
    if (!this.playerVehicle || !this.trackData || !this.trackData.waypoints) return;
    const wps = this.trackData.waypoints;
    const scale = 0.5;

    let closestDist = Infinity;
    let closestIdx = 0;
    wps.forEach((wp, idx) => {
      const wx = (wp.z !== undefined) ? wp.x : (wp.x - 1400) * scale;
      const wz = (wp.z !== undefined) ? wp.z : (wp.y - 1200) * scale;
      const d = Math.hypot(this.playerVehicle.x - wx, this.playerVehicle.z - wz);
      if (d < closestDist) {
        closestDist = d;
        closestIdx = idx;
      }
    });

    const currWp = wps[closestIdx];
    const nextWp = wps[(closestIdx + 1) % wps.length];
    const cx = (currWp.z !== undefined) ? currWp.x : (currWp.x - 1400) * scale;
    const cz = (currWp.z !== undefined) ? currWp.z : (currWp.y - 1200) * scale;
    const nx = (nextWp.z !== undefined) ? nextWp.x : (nextWp.x - 1400) * scale;
    const nz = (nextWp.z !== undefined) ? nextWp.z : (nextWp.y - 1200) * scale;

    const forwardAngle = Math.atan2(nx - cx, nz - cz);

    this.playerVehicle.x = cx;
    this.playerVehicle.z = cz;
    this.playerVehicle.angle = forwardAngle;
    this.playerVehicle.pitch = 0;
    this.playerVehicle.roll = 0;
    this.playerVehicle.speed = 18.0; // ~40 MPH healthy launch speed back down the track
    this.playerVehicle.isDrifting = false;
    this.playerVehicle.mesh.position.set(cx, 0.045, cz);
    this.playerVehicle.mesh.rotation.order = 'YXZ';
    this.playerVehicle.mesh.rotation.set(0, forwardAngle, 0);

    this.triggerCarxFeat('🏎️ RECOVERED TO TRACK', 0);
  }

  createPlayerNameplate(username) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Background pill
    ctx.fillStyle = 'rgba(8, 12, 22, 0.88)';
    if (ctx.roundRect) {
      ctx.roundRect(8, 8, 240, 48, 12);
    } else {
      ctx.fillRect(8, 8, 240, 48);
    }
    ctx.fill();

    // Border glow
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#00f0ff';
    ctx.stroke();

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(username || 'Racer', 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3.2, 0.8, 1);
    return sprite;
  }

  updateRemoteVehicles(dt) {
    if (!this.remoteVehicles) return;
    for (const rVeh of this.remoteVehicles.values()) {
      if (!rVeh.mesh) continue;

      // Smooth position interpolation (LERP)
      rVeh.x += (rVeh.targetX - rVeh.x) * 0.35;
      rVeh.y += (rVeh.targetY - rVeh.y) * 0.35;
      rVeh.z += (rVeh.targetZ - rVeh.z) * 0.35;
      rVeh.mesh.position.set(rVeh.x, rVeh.y, rVeh.z);

      // Angle interpolation (handling shortest angular distance)
      let diff = rVeh.targetAngle - rVeh.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      rVeh.angle += diff * 0.35;
      rVeh.mesh.rotation.set(0, rVeh.angle, 0);

      // Speed & Steer
      rVeh.steerAngle += (rVeh.targetSteerAngle - rVeh.steerAngle) * 0.4;
      rVeh.speed += (rVeh.targetSpeed - rVeh.speed) * 0.35;

      // Animate wheels
      if (rVeh.mesh.userData && rVeh.mesh.userData.wheels) {
        const wheelRotSpeed = (rVeh.speed / 0.35) * dt;
        for (const w of rVeh.mesh.userData.wheels) {
          w.rotation.x += wheelRotSpeed;
          if (w.userData && w.userData.isFront) {
            w.rotation.y = rVeh.steerAngle;
          }
        }
      }
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  stop() {
    this.state = 'STOPPED';
    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    if (this.keyupHandler) {
      window.removeEventListener('keyup', this.keyupHandler);
      this.keyupHandler = null;
    }
    if (this.blurHandler) {
      window.removeEventListener('blur', this.blurHandler);
      this.blurHandler = null;
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    if (this.orientationHandler) {
      window.removeEventListener('orientationchange', this.orientationHandler);
      this.orientationHandler = null;
    }
    if (this.isMultiplayer && window.racingMultiplayer && this.onRemoteUpdateHandler) {
      window.racingMultiplayer.off('remoteUpdate', this.onRemoteUpdateHandler);
    }
    if (window.racingAudio) {
      window.racingAudio.stopEngine();
      window.racingAudio.stopTireScreech();
      window.racingAudio.stopPoliceSiren();
      window.racingAudio.stopRadio();
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

window.RacingGameEngine3D = RacingGameEngine3D;
