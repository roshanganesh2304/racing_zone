/**
 * RACING ZONE - Application UI Controller & Single Page Router
 */

class RacingApp {
  constructor() {
    this.currentScreen = 'home';
    this.profile = null;
    this.cars = [];
    this.tracks = [];
    this.selectedCarIndex = 0;
    this.selectedTrackSlug = 'monza-f1';
    this.garageCategory = 'Formula 1';
    this.trackTimePrefs = {};
    this.gameEngine = null;

    // Showroom rotation & animation
    this.showroomAngle = 0;
    this.showroomAnimId = null;
    this.showroomScene = null;
    this.showroomCamera = null;
    this.showroomRenderer = null;
    this.showroomCarGroup = null;

    // Paint Studio Pending State
    this.pendingPaintColor = null;
    this.pendingPaintCarIndex = -1;

    // Need for Speed Hero Startup Showroom
    this.heroAnimId = null;
    this.heroScene = null;
    this.heroCamera = null;
    this.heroRenderer = null;
    this.heroCarGroup = null;

    this.init();
  }

  async init() {
    this.initMobileOrientationEnforcement();
    this.bindNavigation();
    this.bindAuthModal();
    this.bindGarageControls();
    this.bindResultsModal();

    window.addEventListener('resize', () => {
      this.resizeHeroShowroom();
      this.resizeShowroom();
      if (this.gameEngine && this.gameEngine.handleResize) {
        this.gameEngine.handleResize();
      }
    });

    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.resizeHeroShowroom();
        this.resizeShowroom();
        if (this.gameEngine && this.gameEngine.handleResize) {
          this.gameEngine.handleResize();
        }
      }, 150);
    });

    await this.loadInitialData();

    // Global finish callback from game engine
    window.onRaceFinished = (results) => this.handleRaceFinished(results);

    // Initial 3D renders (only start Hero showroom for home screen)
    this.initHero3DShowroom();
    this.startHeroShowroomLoop();
  }

  async loadInitialData() {
    try {
      const [profileData, carsData, tracksData] = await Promise.all([
        RacingAPI.getProfile(),
        RacingAPI.getCars(),
        RacingAPI.getTracks()
      ]);

      this.profile = profileData;
      this.cars = carsData;
      this.tracks = tracksData;

      // Find currently selected car or default to Ferrari F1-75
      const activeIdx = this.cars.findIndex(c => c.is_selected);
      if (activeIdx !== -1) {
        this.selectedCarIndex = activeIdx;
      } else {
        const ferrariIdx = this.cars.findIndex(c => c.slug === 'f1-2022-ferrari');
        if (ferrariIdx !== -1) this.selectedCarIndex = ferrariIdx;
      }
      const curCar = this.cars[this.selectedCarIndex];
      if (curCar && (curCar.category === 'Formula 1' || curCar.slug.startsWith('f1-'))) {
        this.garageCategory = 'Formula 1';
      }

      this.updateNavbarUser();
      this.renderTracksList();
      this.updateHeroFeaturedCar();
    } catch (e) {
      console.warn("Failed loading initial data:", e);
    }
  }

  bindNavigation() {
    document.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const screen = el.getAttribute('data-nav');
        this.navigateTo(screen);
      });
    });

    // Sound toggle in navbar
    const soundBtn = document.getElementById('btnToggleAudio');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        this.toggleAudio();
      });
    }
    this.updateAudioButtons(window.racingAudio ? window.racingAudio.isMuted : false);
  }

  initMobileOrientationEnforcement() {
    this.enforceMobileOrientation();

    window.addEventListener('resize', () => {
      this.enforceMobileOrientation();
    });

    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.enforceMobileOrientation(), 100);
      setTimeout(() => this.enforceMobileOrientation(), 350);
    });

    if (screen.orientation && screen.orientation.addEventListener) {
      screen.orientation.addEventListener('change', () => {
        this.enforceMobileOrientation();
      });
    }

    const btnReqLandscape = document.getElementById('btnRequestLandscape');
    if (btnReqLandscape) {
      btnReqLandscape.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.requestLandscapeOrientation();
      });
    }
  }

  enforceMobileOrientation() {
    const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (('ontouchstart' in window || navigator.maxTouchPoints > 0) && window.innerWidth <= 1024);

    const isPortrait = window.innerHeight > window.innerWidth;
    const overlay = document.getElementById('mobileRotateOverlay');

    if (isMobileDevice && isPortrait) {
      document.body.classList.add('mobile-portrait-active');
      document.body.classList.remove('mobile-landscape-active');
      if (overlay) overlay.style.display = 'flex';
    } else {
      document.body.classList.remove('mobile-portrait-active');
      document.body.classList.add('mobile-landscape-active');
      if (overlay) overlay.style.display = 'none';
    }
  }

  async requestLandscapeOrientation() {
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen().catch(() => {});
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen().catch(() => {});
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen().catch(() => {});
      }
    } catch (_) {}

    try {
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape').catch(() => {});
      }
    } catch (err) {
      console.log('Orientation lock requires physical rotation:', err);
    }

    this.enforceMobileOrientation();
  }

  toggleAudio() {
    if (!window.racingAudio) return false;
    const isMuted = window.racingAudio.toggleMute();
    this.updateAudioButtons(isMuted);
    return isMuted;
  }

  updateAudioButtons(isMuted) {
    const soundBtn = document.getElementById('btnToggleAudio');
    if (soundBtn) {
      soundBtn.textContent = isMuted ? '🔇 Audio Off' : '🔊 Audio On';
      soundBtn.classList.toggle('active', !isMuted);
    }
    const hudAudioBadge = document.getElementById('hudAudioBadge');
    if (hudAudioBadge) {
      hudAudioBadge.textContent = isMuted ? '🔇 AUDIO OFF' : '🔊 AUDIO ON';
      hudAudioBadge.style.color = isMuted ? '#888' : '#00f0ff';
    }
  }

  navigateTo(screenName) {
    if (this.currentScreen === 'game' && screenName !== 'game') {
      if (this.gameEngine) {
        this.gameEngine.stop();
      }
    }

    // Stop background 3D showroom animations when leaving respective screens to eliminate GPU thrashing
    if (screenName !== 'home' && this.heroAnimId) {
      cancelAnimationFrame(this.heroAnimId);
      this.heroAnimId = null;
    }
    if (screenName !== 'garage' && this.showroomAnimId) {
      cancelAnimationFrame(this.showroomAnimId);
      this.showroomAnimId = null;
    }

    document.querySelectorAll('.screen-view').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.mobile-nav-item').forEach(l => l.classList.remove('active'));

    const targetScreen = document.getElementById(`screen-${screenName}`);
    if (targetScreen) {
      targetScreen.classList.add('active');
    }

    const navLink = document.querySelector(`.nav-link[data-nav="${screenName}"]`);
    if (navLink) navLink.classList.add('active');

    const mobileNavItem = document.querySelector(`.mobile-nav-item[data-nav="${screenName}"]`);
    if (mobileNavItem) mobileNavItem.classList.add('active');

    this.currentScreen = screenName;

    // Toggle zero-scroll immersion mode for race view
    if (screenName === 'game') {
      document.body.classList.add('racing-active');
      document.documentElement.classList.add('racing-active');
      window.scrollTo(0, 0);
      if (this.gameEngine && this.gameEngine.handleResize) {
        setTimeout(() => this.gameEngine.handleResize(), 50);
      }
    } else {
      document.body.classList.remove('racing-active');
      document.documentElement.classList.remove('racing-active');
    }

    // Trigger screen-specific loaders
    if (screenName === 'garage') {
      setTimeout(() => {
        this.initGarageShowroom3D();
        this.resizeShowroom();
        this.renderGarageShowroom();
        this.startShowroomLoop();
      }, 30);
    } else if (screenName === 'home') {
      setTimeout(() => {
        this.initHero3DShowroom();
        this.resizeHeroShowroom();
        this.updateHeroFeaturedCar();
        this.startHeroShowroomLoop();
      }, 30);
    } else if (screenName === 'leaderboard') {
      this.loadLeaderboard();
    } else if (screenName === 'career') {
      this.loadCareerProfile();
    } else if (screenName === 'tracks') {
      this.renderTracksList();
    } else if (screenName === 'multiplayer') {
      this.initMultiplayerView();
    }
  }

  updateNavbarUser() {
    if (!this.profile) return;
    const nameEl = document.getElementById('navUserNickname');
    const levelEl = document.getElementById('navUserLevel');
    const coinsEl = document.getElementById('navUserCoins');

    if (nameEl) nameEl.textContent = this.profile.nickname || this.profile.username;
    if (levelEl) levelEl.textContent = `LVL ${this.profile.level}`;
    if (coinsEl) coinsEl.textContent = `$${this.profile.coins.toLocaleString()}`;
  }

  updateHeroFeaturedCar() {
    if (!this.heroCarGroup) return;

    const featuredCar = this.cars[this.selectedCarIndex] || this.cars[0];
    if (!featuredCar) return;

    const isF1Car = featuredCar.category === 'Formula 1' || featuredCar.slug.startsWith('f1-') || featuredCar.slug === 'mclaren-mp45';
    const isCustomPaint = !isF1Car && !!(featuredCar.custom_color && featuredCar.custom_color.toLowerCase() !== (featuredCar.default_color || '').toLowerCase());
    const carColor = isF1Car ? (featuredCar.default_color || '#c00000') : (featuredCar.custom_color || featuredCar.default_color);

    const existingMesh = this.heroCarGroup.children[0];
    if (existingMesh && existingMesh.userData && existingMesh.userData.slug === featuredCar.slug) {
      if (window.CarModels3D && window.CarModels3D.updateVehicleColor) {
        window.CarModels3D.updateVehicleColor(existingMesh, carColor, featuredCar.slug, isCustomPaint);
      }
    } else {
      while (this.heroCarGroup.children.length > 0) {
        this.heroCarGroup.remove(this.heroCarGroup.children[0]);
      }
      const car3DMesh = window.CarModels3D.createVehicleMesh(featuredCar.slug, carColor, { isCustomPaint });
      this.heroCarGroup.add(car3DMesh);
    }

    // Need for Speed Hero Supercar Badge Overlay
    const titleEl = document.getElementById('nfsHeroCarTitle');
    const specsEl = document.getElementById('nfsHeroCarSpecs');
    if (titleEl) titleEl.textContent = `${featuredCar.brand.toUpperCase()} ${featuredCar.name.toUpperCase()}`;
    if (specsEl) specsEl.textContent = `${featuredCar.horsepower} HP • ${featuredCar.top_speed_mph} MPH • 0-60 ${featuredCar.accel_0_60.toFixed(1)}s`;
  }

  /* --------------------------------------------------------------------------
     Garage & Real-Life Car Customization
     -------------------------------------------------------------------------- */
  bindGarageControls() {
    const prevBtn = document.getElementById('btnPrevCar');
    const nextBtn = document.getElementById('btnNextCar');

    // Garage Category Filter Tabs (Formula 1, Supercars, All)
    const catBtns = document.querySelectorAll('.garage-cat-btn');
    catBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        catBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.garageCategory = btn.getAttribute('data-cat') || 'all';

        const filtered = this.getFilteredGarageCars();
        if (filtered.length > 0 && !filtered.some(c => this.cars.indexOf(c) === this.selectedCarIndex)) {
          this.selectedCarIndex = this.cars.indexOf(filtered[0]);
        }
        if (this.showroomCarGroup) this.showroomCarGroup.rotation.y = -0.55;
        this.renderGarageShowroom();
      });
    });

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.pendingPaintColor = null;
        this.pendingPaintCarIndex = -1;
        const filtered = this.getFilteredGarageCars();
        if (filtered.length > 0) {
          const currentLocal = filtered.findIndex(c => this.cars.indexOf(c) === this.selectedCarIndex);
          const nextLocal = (currentLocal - 1 + filtered.length) % filtered.length;
          this.selectedCarIndex = this.cars.indexOf(filtered[nextLocal]);
        } else {
          this.selectedCarIndex = (this.selectedCarIndex - 1 + this.cars.length) % this.cars.length;
        }
        if (this.showroomCarGroup) this.showroomCarGroup.rotation.y = -0.55;
        if (window.racingAudio && window.racingAudio.playWhooshNearMiss) window.racingAudio.playWhooshNearMiss();
        this.renderGarageShowroom();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.pendingPaintColor = null;
        this.pendingPaintCarIndex = -1;
        const filtered = this.getFilteredGarageCars();
        if (filtered.length > 0) {
          const currentLocal = filtered.findIndex(c => this.cars.indexOf(c) === this.selectedCarIndex);
          const nextLocal = (currentLocal + 1) % filtered.length;
          this.selectedCarIndex = this.cars.indexOf(filtered[nextLocal]);
        } else {
          this.selectedCarIndex = (this.selectedCarIndex + 1) % this.cars.length;
        }
        if (this.showroomCarGroup) this.showroomCarGroup.rotation.y = -0.55;
        if (window.racingAudio && window.racingAudio.playWhooshNearMiss) window.racingAudio.playWhooshNearMiss();
        this.renderGarageShowroom();
      });
    }

    // Color Swatches
    document.querySelectorAll('.paint-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        const color = sw.getAttribute('data-color');
        this.selectPaintColor(color);
      });
    });

    const customColorInput = document.getElementById('customColorPicker');
    if (customColorInput) {
      customColorInput.addEventListener('input', (e) => {
        this.selectPaintColor(e.target.value);
      });
    }

    // Save Paint Button
    const savePaintBtn = document.getElementById('btnSavePaint');
    if (savePaintBtn) {
      savePaintBtn.addEventListener('click', async () => {
        await this.saveCustomPaint();
      });
    }

    // Factory OEM Color Reset Button
    const resetPaintBtn = document.getElementById('btnResetPaint');
    if (resetPaintBtn) {
      resetPaintBtn.addEventListener('click', async () => {
        await this.resetToFactoryPaint();
      });
    }

    // Buy / Select Button
    const actionBtn = document.getElementById('btnCarAction');
    if (actionBtn) {
      actionBtn.addEventListener('click', async () => {
        const car = this.cars[this.selectedCarIndex];
        if (!car) return;

        if (!car.is_unlocked) {
          // Buy car
          try {
            actionBtn.disabled = true;
            actionBtn.textContent = 'Purchasing...';
            const res = await RacingAPI.buyCar(car.slug);
            alert(res.message);
            await this.refreshCarData();
          } catch (err) {
            alert(err.message || 'Purchase failed');
          } finally {
            actionBtn.disabled = false;
          }
        } else if (!car.is_selected) {
          // Select car
          try {
            await RacingAPI.selectCar(car.slug);
            await this.refreshCarData();
          } catch (err) {
            alert(err.message || 'Selection failed');
          }
        }
      });
    }

    // Upgrade Buttons
    const bindUpgrade = (btnId, type) => {
      const btn = document.getElementById(btnId);
      if (!btn) return;
      btn.addEventListener('click', async () => {
        const car = this.cars[this.selectedCarIndex];
        if (!car || !car.is_unlocked) {
          alert('Unlock this vehicle first before tuning!');
          return;
        }
        try {
          const res = await RacingAPI.upgradeCar(car.slug, type);
          alert(res.message);
          await this.refreshCarData();
        } catch (err) {
          alert(err.message);
        }
      });
    };

    bindUpgrade('btnUpgradeEngine', 'engine');
    bindUpgrade('btnUpgradeHandling', 'handling');
    bindUpgrade('btnUpgradeNitro', 'nitro');
  }

  selectPaintColor(color) {
    const car = this.cars[this.selectedCarIndex];
    if (!car) return;

    // Formula 1 race cars use official FIA team liveries and have no color-changing option
    const isF1Car = car.category === 'Formula 1' || car.slug.startsWith('f1-') || car.slug === 'mclaren-mp45';
    if (isF1Car) {
      return;
    }

    // Colour changing only allowed if car is purchased
    if (!car.is_unlocked) {
      alert('This vehicle is locked! Purchase the car to unlock the Paint Studio.');
      return;
    }

    this.pendingPaintColor = color;
    this.pendingPaintCarIndex = this.selectedCarIndex;

    // Real-time live 3D preview on the turntable
    const carMesh = this.showroomCarGroup && this.showroomCarGroup.children[0];
    const isCustom = (color.toLowerCase() !== (car.default_color || '').toLowerCase());
    if (carMesh && window.CarModels3D && window.CarModels3D.updateVehicleColor) {
      window.CarModels3D.updateVehicleColor(carMesh, color, car.slug, isCustom);
    }

    // Highlight active swatch & update custom picker input
    document.querySelectorAll('.paint-swatch').forEach(sw => {
      const swColor = sw.getAttribute('data-color');
      if (swColor && swColor.toLowerCase() === color.toLowerCase()) {
        sw.classList.add('active');
      } else {
        sw.classList.remove('active');
      }
    });

    const picker = document.getElementById('customColorPicker');
    if (picker) picker.value = color;

    // Enable Save Paint button
    const saveBtn = document.getElementById('btnSavePaint');
    const saveText = document.getElementById('btnSavePaintText');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.classList.add('has-changes');
      if (saveText) saveText.textContent = 'Save Paint';
    }

    const badge = document.getElementById('paintStudioStatusBadge');
    if (badge) {
      badge.textContent = '🎨 Previewing';
    }
  }

  async saveCustomPaint() {
    const car = this.cars[this.selectedCarIndex];
    if (!car || !car.is_unlocked || !this.pendingPaintColor) return;

    const isF1Car = car.category === 'Formula 1' || car.slug.startsWith('f1-') || car.slug === 'mclaren-mp45';
    if (isF1Car) return;

    const saveBtn = document.getElementById('btnSavePaint');
    const saveText = document.getElementById('btnSavePaintText');
    if (saveBtn) {
      saveBtn.disabled = true;
      if (saveText) saveText.textContent = 'Saving...';
    }

    try {
      const colorToSave = this.pendingPaintColor;
      await RacingAPI.paintCar(car.slug, colorToSave);
      car.custom_color = colorToSave;
      this.pendingPaintColor = null;
      this.pendingPaintCarIndex = -1;

      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.classList.remove('has-changes');
        if (saveText) saveText.textContent = '✓ Saved!';
        setTimeout(() => {
          if (saveText) saveText.textContent = 'Save Paint';
        }, 2200);
      }

      const badge = document.getElementById('paintStudioStatusBadge');
      if (badge) {
        const isCustom = car.custom_color && car.custom_color.toLowerCase() !== car.default_color.toLowerCase();
        badge.textContent = isCustom ? '🎨 Custom' : '🎨 Factory';
      }

      if (window.racingAudio && window.racingAudio.playUpgradeChime) {
        window.racingAudio.playUpgradeChime();
      }
    } catch (err) {
      alert(err.message || 'Failed to save paint');
      if (saveBtn) {
        saveBtn.disabled = false;
        if (saveText) saveText.textContent = 'Save Paint';
      }
    }
  }

  async resetToFactoryPaint() {
    const car = this.cars[this.selectedCarIndex];
    if (!car) return;

    const isF1Car = car.category === 'Formula 1' || car.slug.startsWith('f1-') || car.slug === 'mclaren-mp45';
    if (isF1Car) return;

    if (!car.is_unlocked) {
      alert('This vehicle is locked! Purchase the car to unlock the Paint Studio.');
      return;
    }

    const factoryColor = car.default_color;
    this.pendingPaintColor = factoryColor;
    this.pendingPaintCarIndex = this.selectedCarIndex;

    // Apply factory color live on 3D showroom model
    const carMesh = this.showroomCarGroup && this.showroomCarGroup.children[0];
    if (carMesh && window.CarModels3D && window.CarModels3D.updateVehicleColor) {
      window.CarModels3D.updateVehicleColor(carMesh, factoryColor, car.slug, false);
    }

    try {
      await RacingAPI.paintCar(car.slug, factoryColor);
      car.custom_color = factoryColor;
      this.pendingPaintColor = null;
      this.pendingPaintCarIndex = -1;

      // Update UI
      document.querySelectorAll('.paint-swatch').forEach(sw => {
        const swColor = sw.getAttribute('data-color');
        if (swColor && swColor.toLowerCase() === factoryColor.toLowerCase()) {
          sw.classList.add('active');
        } else {
          sw.classList.remove('active');
        }
      });
      const picker = document.getElementById('customColorPicker');
      if (picker) picker.value = factoryColor;

      const saveBtn = document.getElementById('btnSavePaint');
      const saveText = document.getElementById('btnSavePaintText');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.classList.remove('has-changes');
        if (saveText) saveText.textContent = 'Factory Reset';
        setTimeout(() => {
          if (saveText) saveText.textContent = 'Save Paint';
        }, 2000);
      }

      const badge = document.getElementById('paintStudioStatusBadge');
      if (badge) {
        badge.textContent = '🎨 Factory';
      }

      if (window.racingAudio && window.racingAudio.playUpgradeChime) {
        window.racingAudio.playUpgradeChime();
      }
    } catch (err) {
      console.warn('Reset factory color error', err);
    }
  }

  async refreshCarData() {
    const [profileData, carsData] = await Promise.all([
      RacingAPI.getProfile(),
      RacingAPI.getCars()
    ]);
    this.profile = profileData;
    this.cars = carsData;
    this.updateNavbarUser();
    this.renderGarageShowroom();
    this.updateHeroFeaturedCar();
  }

  renderGarageShowroom() {
    const car = this.cars[this.selectedCarIndex];
    if (!car) return;

    // Text & Brand Info
    document.getElementById('showroomCarBrand').textContent = car.brand;
    document.getElementById('showroomCarName').textContent = car.name;
    document.getElementById('showroomCategory').textContent = car.category;

    // Sync active category button state
    document.querySelectorAll('.garage-cat-btn').forEach(btn => {
      const cat = btn.getAttribute('data-cat');
      if (this.garageCategory === cat) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Real Life Specs
    document.getElementById('statTopSpeedMph').textContent = `${car.top_speed_mph} MPH`;
    document.getElementById('statTopSpeedKmh').textContent = `${Math.round(car.top_speed_mph * 1.609)} KM/H`;
    document.getElementById('statAccel060').textContent = `${car.accel_0_60.toFixed(1)}s`;
    document.getElementById('statHorsepower').textContent = `${car.horsepower} HP`;
    document.getElementById('statWeight').textContent = `${car.weight_kg} KG`;
    document.getElementById('statEngineType').textContent = car.engine;
    document.getElementById('statDrivetrain').textContent = car.drivetrain;

    // Stat bars
    const speedPct = Math.min(100, (car.top_speed_mph / 280) * 100);
    const accelPct = Math.min(100, (4.5 - car.accel_0_60) / 2.5 * 100);
    document.getElementById('barTopSpeed').style.width = `${speedPct}%`;
    document.getElementById('barAccel').style.width = `${accelPct}%`;
    document.getElementById('barHandling').style.width = `${car.handling_score}%`;
    document.getElementById('barBraking').style.width = `${car.braking_score}%`;

    // Upgrade Stages
    document.getElementById('stageEngineVal').textContent = `Stage ${car.engine_level || 1} / 5`;
    document.getElementById('stageHandlingVal').textContent = `Stage ${car.handling_level || 1} / 5`;
    document.getElementById('stageNitroVal').textContent = `Stage ${car.nitro_level || 1} / 5`;

    // Action Button (Buy vs Select vs Selected)
    const btnAction = document.getElementById('btnCarAction');
    if (btnAction) {
      if (!car.is_unlocked) {
        btnAction.className = 'btn btn-primary';
        btnAction.innerHTML = `Acquire Car • $${car.price.toLocaleString()} Coins`;
      } else if (car.is_selected) {
        btnAction.className = 'btn btn-secondary';
        btnAction.innerHTML = `✓ Active Race Car`;
      } else {
        btnAction.className = 'btn btn-danger';
        btnAction.innerHTML = `Select for Racing`;
      }
    }

    // Formula 1 race cars use official FIA race liveries and have no color-changing option
    const isF1Car = car.category === 'Formula 1' || car.slug.startsWith('f1-') || car.slug === 'mclaren-mp45';
    const f1LiveryCard = document.getElementById('f1OfficialLiveryCard');
    const f1LiveryTeamName = document.getElementById('f1LiveryTeamName');
    const paintStudioCard = document.getElementById('paintStudioCard');
    const paintLockedBanner = document.getElementById('paintLockedBanner');
    const paintControls = document.getElementById('paintStudioControls');
    const savePaintBtn = document.getElementById('btnSavePaint');
    const savePaintText = document.getElementById('btnSavePaintText');
    const statusBadge = document.getElementById('paintStudioStatusBadge');

    if (isF1Car) {
      if (f1LiveryCard) {
        f1LiveryCard.style.display = 'block';
        if (f1LiveryTeamName) {
          f1LiveryTeamName.textContent = `${car.brand} • ${car.name}`;
        }
      }
      if (paintStudioCard) {
        paintStudioCard.style.display = 'none';
      }
      this.pendingPaintColor = null;
      this.pendingPaintCarIndex = -1;
    } else {
      if (f1LiveryCard) {
        f1LiveryCard.style.display = 'none';
      }
      if (paintStudioCard) {
        paintStudioCard.style.display = 'block';
      }

      if (!car.is_unlocked) {
        if (paintLockedBanner) paintLockedBanner.style.display = 'flex';
        if (paintControls) paintControls.classList.add('disabled');
        if (statusBadge) {
          statusBadge.textContent = '🔒 Locked';
          statusBadge.className = 'paint-status-badge locked';
        }
        if (savePaintBtn) {
          savePaintBtn.disabled = true;
          savePaintBtn.classList.remove('has-changes');
        }
        this.pendingPaintColor = null;
        this.pendingPaintCarIndex = -1;
      } else {
        if (paintLockedBanner) paintLockedBanner.style.display = 'none';
        if (paintControls) paintControls.classList.remove('disabled');
        if (statusBadge) {
          const isCustom = car.custom_color && car.custom_color.toLowerCase() !== car.default_color.toLowerCase();
          statusBadge.textContent = isCustom ? '🎨 Custom' : '🎨 Factory';
          statusBadge.className = 'paint-status-badge';
        }

        // Check if we have an unsaved pending paint for this car
        const hasPending = this.pendingPaintColor && this.pendingPaintCarIndex === this.selectedCarIndex;
        if (savePaintBtn) {
          savePaintBtn.disabled = !hasPending;
          if (hasPending) {
            savePaintBtn.classList.add('has-changes');
            if (savePaintText) savePaintText.textContent = 'Save Paint';
          } else {
            savePaintBtn.classList.remove('has-changes');
            if (savePaintText) savePaintText.textContent = 'Save Paint';
          }
        }
      }
    }

    // Active color for swatches and picker
    const activeColor = (this.pendingPaintColor && this.pendingPaintCarIndex === this.selectedCarIndex)
      ? this.pendingPaintColor
      : (car.custom_color || car.default_color);

    document.querySelectorAll('.paint-swatch').forEach(sw => {
      const swColor = sw.getAttribute('data-color');
      if (swColor && activeColor && swColor.toLowerCase() === activeColor.toLowerCase()) {
        sw.classList.add('active');
      } else {
        sw.classList.remove('active');
      }
    });

    const picker = document.getElementById('customColorPicker');
    if (picker && activeColor) {
      picker.value = activeColor;
    }

    // Render Thumbnails Strip
    this.renderCarThumbnailsStrip();

    // Update 3D car mesh in showroom
    this.updateShowroom3DCar();
  }

  getFilteredGarageCars() {
    if (!this.cars || this.cars.length === 0) return [];
    if (!this.garageCategory || this.garageCategory === 'all') return this.cars;
    if (this.garageCategory === 'Formula 1') {
      return this.cars.filter(c => c.category === 'Formula 1' || c.slug.startsWith('f1-') || c.slug === 'mclaren-mp45');
    }
    return this.cars.filter(c => c.category !== 'Formula 1' && !c.slug.startsWith('f1-') && c.slug !== 'mclaren-mp45');
  }

  renderCarThumbnailsStrip() {
    const strip = document.getElementById('carThumbnailsStrip');
    if (!strip) return;
    strip.innerHTML = '';

    const displayCars = this.getFilteredGarageCars();
    displayCars.forEach((c) => {
      const globalIdx = this.cars.indexOf(c);
      const chip = document.createElement('div');
      chip.className = `car-thumb-chip ${globalIdx === this.selectedCarIndex ? 'active' : ''}`;
      chip.textContent = `${c.brand} ${c.name}`;
      chip.addEventListener('click', () => {
        this.pendingPaintColor = null;
        this.pendingPaintCarIndex = -1;
        this.selectedCarIndex = globalIdx;
        if (this.showroomCarGroup) this.showroomCarGroup.rotation.y = -0.55;
        this.renderGarageShowroom();
      });
      strip.appendChild(chip);
    });
  }

  initGarageShowroom3D() {
    const container = document.getElementById('showroom3DContainer');
    if (!container) return;

    if (this.showroomScene && this.showroomRenderer) {
      this.updateShowroom3DCar();
      return;
    }

    if (this.showroomAnimId) {
      cancelAnimationFrame(this.showroomAnimId);
      this.showroomAnimId = null;
    }

    const w = container.clientWidth || 700;
    const h = container.clientHeight || 400;

    // Three.js 3D Showroom Scene
    this.showroomScene = new THREE.Scene();
    this.showroomCamera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    this.showroomCamera.position.set(-2.5, 1.5, 5.2);
    this.showroomCamera.lookAt(0, 0.42, 0);

    this.showroomRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.showroomRenderer.setSize(w, h);
    this.showroomRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.showroomRenderer.shadowMap.enabled = true;
    this.showroomRenderer.shadowMap.type = THREE.PCFShadowMap;
    this.showroomRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.showroomRenderer.toneMappingExposure = 1.15;

    container.innerHTML = '';
    container.appendChild(this.showroomRenderer.domElement);

    // Showroom Lighting (Balanced Studio Key + Accent lighting)
    const amb = new THREE.AmbientLight(0xffffff, 0.65);
    this.showroomScene.add(amb);

    // Primary High-CRI White Key Spotlight (authentic paint reflection with soft shadow)
    const spot = new THREE.SpotLight(0xffffff, 2.8, 35, Math.PI / 4, 0.35, 1.2);
    spot.position.set(3.5, 7.5, 4.5);
    spot.castShadow = true;
    spot.shadow.mapSize.width = 1024;
    spot.shadow.mapSize.height = 1024;
    spot.shadow.camera.near = 1;
    spot.shadow.camera.far = 25;
    spot.shadow.bias = -0.0001;
    spot.shadow.normalBias = 0.02;
    spot.shadow.radius = 1.5;
    this.showroomScene.add(spot);

    // Cyan Key Rim Light from rear-left
    const rimLight = new THREE.DirectionalLight(0x00f0ff, 1.6);
    rimLight.position.set(-6, 4.5, -4.5);
    this.showroomScene.add(rimLight);

    // Magenta Shoulder Highlight from rear-right
    const magentaRim = new THREE.DirectionalLight(0xff007f, 1.3);
    magentaRim.position.set(5.5, 3.5, -4.5);
    this.showroomScene.add(magentaRim);

    // Warm Front-Left Soft Fill
    const warmFill = new THREE.DirectionalLight(0xffeedd, 0.95);
    warmFill.position.set(-3.5, 5, 4.5);
    this.showroomScene.add(warmFill);

    // Circular Turntable Stage with carbon/metallic texture
    const stageGeo = new THREE.CylinderGeometry(3.3, 3.5, 0.22, 48);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0x11141c,
      roughness: 0.25,
      metalness: 0.85
    });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.position.y = -0.11;
    stage.receiveShadow = true;
    this.showroomScene.add(stage);

    // Glowing Neon Ring around stage
    const ringGeo = new THREE.TorusGeometry(3.35, 0.045, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.01;
    this.showroomScene.add(ring);

    this.showroomCarGroup = new THREE.Group();
    this.showroomCarGroup.position.set(0, 0.02, 0);
    this.showroomCarGroup.rotation.y = -0.55;
    this.showroomScene.add(this.showroomCarGroup);

    // Interactive pointer drag to rotate showroom car
    let isDragging = false;
    let prevMouseX = 0;
    container.addEventListener('pointerdown', (e) => {
      isDragging = true;
      this.showroomIsDragging = true;
      prevMouseX = e.clientX;
    });
    window.addEventListener('pointerup', () => { isDragging = false; this.showroomIsDragging = false; });
    window.addEventListener('pointercancel', () => { isDragging = false; this.showroomIsDragging = false; });
    window.addEventListener('pointermove', (e) => {
      if (isDragging && this.showroomCarGroup) {
        const deltaX = e.clientX - prevMouseX;
        prevMouseX = e.clientX;
        this.showroomCarGroup.rotation.y += deltaX * 0.012;
      }
    });

    this.showroomIsDragging = false;
    this.updateShowroom3DCar();
  }

  startShowroomLoop() {
    if (this.showroomAnimId) return;
    const animate = () => {
      if (this.currentScreen !== 'garage') {
        this.showroomAnimId = null;
        return;
      }
      if (!this.showroomIsDragging && this.showroomCarGroup) {
        this.showroomCarGroup.rotation.y += 0.0035; // Gentle cinematic turntable drift
      }
      if (this.showroomRenderer && this.showroomScene && this.showroomCamera) {
        this.showroomRenderer.render(this.showroomScene, this.showroomCamera);
      }
      this.showroomAnimId = requestAnimationFrame(animate);
    };
    this.showroomAnimId = requestAnimationFrame(animate);
  }

  resizeShowroom() {
    const container = document.getElementById('showroom3DContainer');
    if (!container || !this.showroomRenderer || !this.showroomCamera) return;
    const w = container.clientWidth || 700;
    const h = container.clientHeight || 400;
    if (w > 0 && h > 0) {
      this.showroomCamera.aspect = w / h;
      this.showroomCamera.updateProjectionMatrix();
      this.showroomRenderer.setSize(w, h);
    }
  }

  updateShowroom3DCar() {
    if (!this.showroomCarGroup) return;

    const car = this.cars[this.selectedCarIndex];
    if (!car) return;

    const isF1Car = car.category === 'Formula 1' || car.slug.startsWith('f1-') || car.slug === 'mclaren-mp45';
    const isCustomPaint = !isF1Car && !!(
      (this.pendingPaintColor && this.pendingPaintCarIndex === this.selectedCarIndex && this.pendingPaintColor.toLowerCase() !== (car.default_color || '').toLowerCase()) ||
      (car.custom_color && car.custom_color.toLowerCase() !== (car.default_color || '').toLowerCase())
    );

    const carColor = isF1Car
      ? (car.default_color || '#c00000')
      : ((this.pendingPaintColor && this.pendingPaintCarIndex === this.selectedCarIndex)
          ? this.pendingPaintColor
          : (car.custom_color || car.default_color));

    // If the active showroom car matches the selected car, update paint in real-time at 60 FPS
    const existingMesh = this.showroomCarGroup.children[0];
    if (existingMesh && existingMesh.userData && existingMesh.userData.slug === car.slug) {
      if (window.CarModels3D && window.CarModels3D.updateVehicleColor) {
        window.CarModels3D.updateVehicleColor(existingMesh, carColor, car.slug, isCustomPaint);
        return;
      }
    }

    while (this.showroomCarGroup.children.length > 0) {
      this.showroomCarGroup.remove(this.showroomCarGroup.children[0]);
    }

    const car3DMesh = window.CarModels3D.createVehicleMesh(car.slug, carColor, { isCustomPaint });
    this.showroomCarGroup.position.set(0, 0.02, 0);
    this.showroomCarGroup.rotation.y = -0.55;
    this.showroomCarGroup.add(car3DMesh);
  }

  /* --------------------------------------------------------------------------
     Need for Speed Startup Hero 3D Showroom
     -------------------------------------------------------------------------- */
  initHero3DShowroom() {
    const container = document.getElementById('hero3DContainer');
    if (!container) return;

    if (this.heroScene && this.heroRenderer) {
      this.updateHeroFeaturedCar();
      return;
    }

    if (this.heroAnimId) {
      cancelAnimationFrame(this.heroAnimId);
      this.heroAnimId = null;
    }

    const w = container.clientWidth || 560;
    const h = container.clientHeight || 360;

    this.heroScene = new THREE.Scene();
    // Dramatic low 3/4 Need for Speed signature angle
    this.heroCamera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    this.heroCamera.position.set(-2.8, 1.4, 5.2);
    this.heroCamera.lookAt(0, 0.45, 0);

    this.heroRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.heroRenderer.setSize(w, h);
    this.heroRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.heroRenderer.shadowMap.enabled = true;
    this.heroRenderer.shadowMap.type = THREE.PCFShadowMap;
    this.heroRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.heroRenderer.toneMappingExposure = 1.2;

    // Clear previous canvas if any
    const existingCanvas = container.querySelector('canvas');
    if (existingCanvas) existingCanvas.remove();
    container.appendChild(this.heroRenderer.domElement);

    // Need for Speed Moody Atmospheric Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.8);
    this.heroScene.add(amb);

    // Clean Key Spotlight with high-res soft shadows
    const keySpot = new THREE.SpotLight(0xffffff, 4.2, 40, Math.PI / 4, 0.35, 1.2);
    keySpot.position.set(4.5, 7.5, 5.5);
    keySpot.castShadow = true;
    keySpot.shadow.mapSize.width = 1024;
    keySpot.shadow.mapSize.height = 1024;
    keySpot.shadow.bias = -0.0001;
    keySpot.shadow.normalBias = 0.02;
    keySpot.shadow.radius = 1.5;
    this.heroScene.add(keySpot);

    // Blazing Magenta Rim Light from rear-left (NFS signature look)
    const rimSpot = new THREE.DirectionalLight(0xff0066, 2.8);
    rimSpot.position.set(-6.5, 4, -4.5);
    this.heroScene.add(rimSpot);

    // Cyan Fill from front-left
    const cyanFill = new THREE.DirectionalLight(0x00f0ff, 2.0);
    cyanFill.position.set(-3.5, 4, 4.5);
    this.heroScene.add(cyanFill);

    // Wet Reflective Turntable Ground Disc
    const groundGeo = new THREE.CylinderGeometry(3.4, 3.6, 0.18, 48);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0d111a,
      roughness: 0.18,
      metalness: 0.9
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.09;
    ground.receiveShadow = true;
    this.heroScene.add(ground);

    // Dual Glowing Neon Concentric Rings
    const ring1Geo = new THREE.TorusGeometry(3.45, 0.04, 16, 64);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.y = 0.01;
    this.heroScene.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(3.6, 0.025, 16, 64);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0xff007f });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 2;
    ring2.position.y = 0.01;
    this.heroScene.add(ring2);

    this.heroCarGroup = new THREE.Group();
    this.heroScene.add(this.heroCarGroup);

    // Interactive mouse / touch drag
    let isDragging = false;
    let prevMouseX = 0;
    container.addEventListener('pointerdown', (e) => {
      isDragging = true;
      this.heroIsDragging = true;
      prevMouseX = e.clientX;
    });
    window.addEventListener('pointerup', () => { isDragging = false; this.heroIsDragging = false; });
    window.addEventListener('pointercancel', () => { isDragging = false; this.heroIsDragging = false; });
    window.addEventListener('pointermove', (e) => {
      if (isDragging && this.heroCarGroup) {
        const deltaX = e.clientX - prevMouseX;
        prevMouseX = e.clientX;
        this.heroCarGroup.rotation.y += deltaX * 0.012;
      }
    });

    this.heroIsDragging = false;
    this.updateHeroFeaturedCar();
  }

  startHeroShowroomLoop() {
    if (this.heroAnimId) return;
    const animate = () => {
      if (this.currentScreen !== 'home') {
        this.heroAnimId = null;
        return;
      }
      if (!this.heroIsDragging && this.heroCarGroup) {
        this.heroCarGroup.rotation.y += 0.008; // Smooth cinematic turntable rotation
      }
      if (this.heroRenderer && this.heroScene && this.heroCamera) {
        this.heroRenderer.render(this.heroScene, this.heroCamera);
      }
      this.heroAnimId = requestAnimationFrame(animate);
    };
    this.heroAnimId = requestAnimationFrame(animate);
  }

  resizeHeroShowroom() {
    const container = document.getElementById('hero3DContainer');
    if (!container || !this.heroRenderer || !this.heroCamera) return;
    const w = container.clientWidth || 560;
    const h = container.clientHeight || 360;
    if (w > 0 && h > 0) {
      this.heroCamera.aspect = w / h;
      this.heroCamera.updateProjectionMatrix();
      this.heroRenderer.setSize(w, h);
    }
  }

  /* --------------------------------------------------------------------------
     Track Selection & Race Launch
     -------------------------------------------------------------------------- */
  renderTracksList() {
    const container = document.getElementById('tracksGridContainer');
    if (!container) return;
    container.innerHTML = '';

    // 1. CarX Mode Filter Tabs
    const modesHtml = `
      <div class="carx-modes-bar">
        <button class="carx-mode-tab ${this.selectedRaceMode === 'circuit' ? 'active' : ''}" id="btnModeCircuit">
          <span>🏁</span> HIGHWAY DUEL SPRINT
        </button>
        <button class="carx-mode-tab ${this.selectedRaceMode === 'police' ? 'active' : ''}" id="btnModePolice">
          <span>🚨</span> POLICE ENFORCER PURSUIT
        </button>
        <button class="carx-mode-tab ${this.selectedRaceMode === 'sprint' ? 'active' : ''}" id="btnModeSprint">
          <span>⚡</span> TIME ATTACK RADAR RUN
        </button>
        <button class="carx-mode-tab ${this.selectedRaceMode === 'freeroam' ? 'active' : ''}" id="btnModeFreeRoam">
          <span>🏙️</span> FREE RIDE TRAFFIC FLOW
        </button>
      </div>
    `;

    // 2. CarX Split Screen Stage: Left Track Carousel, Right Mission Briefing
    const stageHtml = `
      <div class="carx-stage-layout">
        <div class="carx-track-column" id="carxTrackColumn">
          <!-- Track Cards list rendered here -->
        </div>
        <div class="carx-mission-column" id="carxMissionStage">
          <!-- Mission Detail Stage rendered here -->
        </div>
      </div>
    `;

    container.innerHTML = modesHtml + stageHtml;

    // Render Track Cards List on Left
    this.renderHighwayTrackCards();

    // Render Active Mission Detail on Right
    this.renderHighwayMissionDetail(this.selectedTrackSlug);

    // Wire mode buttons
    const setMode = (id, mode) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.carx-mode-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedRaceMode = mode;
        this.renderHighwayMissionDetail(this.selectedTrackSlug);
      });
    };
    setMode('btnModeCircuit', 'circuit');
    setMode('btnModePolice', 'police');
    setMode('btnModeSprint', 'sprint');
    setMode('btnModeFreeRoam', 'freeroam');
  }

  renderHighwayTrackCards() {
    const col = document.getElementById('carxTrackColumn');
    if (!col) return;
    col.innerHTML = '';

    this.tracks.forEach(track => {
      const trackDef = (window.RacingTracks && window.RacingTracks[track.slug]) || (window.RacingTracks && window.RacingTracks['los-santos']);
      const isSelected = (track.slug === this.selectedTrackSlug);
      const heroImg = trackDef.heroImage || `/static/images/tracks/${track.slug}.jpg`;
      const diffClass = `difficulty-${track.difficulty.toLowerCase()}`;
      const isF1Track = (track.slug === 'monza-f1' || trackDef.isF1Track || trackDef.vehicleRestriction === 'f1_only');
      const badgeHtml = isF1Track
        ? `<span class="track-restriction-badge f1-badge">🏁 F1 ONLY</span>`
        : `<span class="track-restriction-badge street-badge">🏎️ SUPERCARS ONLY</span>`;

      const card = document.createElement('div');
      card.className = `carx-track-card ${isSelected ? 'active' : ''}`;
      card.style.backgroundImage = `linear-gradient(90deg, rgba(10, 14, 24, 0.94) 0%, rgba(10, 14, 24, 0.65) 60%, rgba(10, 14, 24, 0.3) 100%), url(${heroImg})`;

      card.innerHTML = `
        <div class="carx-card-left">
          <div class="carx-shield-badge">${trackDef.highwayCode ? trackDef.highwayCode.split(' ')[0] : 'ROUTE'}</div>
          <div>
            <div class="carx-card-highway-sub">${trackDef.highwayCode || 'INTERSTATE HIGHWAY'}</div>
            <div class="carx-card-title">${track.name}</div>
            <div class="carx-card-telemetry">
              <span>📏 ${track.length_km} KM</span>
              <span>🚗 ${trackDef.trafficDensity || 'Heavy Traffic'}</span>
              ${badgeHtml}
            </div>
          </div>
        </div>
        <div class="carx-card-right">
          <span class="track-difficulty-badge ${diffClass}">${track.difficulty}</span>
          <div class="carx-card-arrow">▶</div>
        </div>
      `;

      card.addEventListener('click', () => {
        this.selectedTrackSlug = track.slug;
        document.querySelectorAll('.carx-track-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.renderHighwayMissionDetail(track.slug);
      });

      col.appendChild(card);
    });
  }

  renderHighwayMissionDetail(trackSlug) {
    const stage = document.getElementById('carxMissionStage');
    if (!stage) return;

    const track = this.tracks.find(t => t.slug === trackSlug) || this.tracks[0];
    if (!track) return;

    const trackDef = (window.RacingTracks && window.RacingTracks[track.slug]) || (window.RacingTracks && window.RacingTracks['los-santos']);
    const heroImg = trackDef.heroImage || `/static/images/tracks/${track.slug}.jpg`;
    const activeCar = this.cars.find(c => c.is_selected) || this.cars[this.selectedCarIndex] || this.cars[0];

    const defaultTime = trackDef.defaultTime || 'sunset';
    if (!this.trackTimePrefs[track.slug]) {
      this.trackTimePrefs[track.slug] = defaultTime;
    }
    const currentTimePref = this.trackTimePrefs[track.slug];

    const carHp = activeCar ? activeCar.horsepower : 500;
    const reqHp = trackDef.recommendedHp || 520;
    const isHpReady = carHp >= (reqHp - 40);

    const isF1Track = (track.slug === 'monza-f1' || trackDef.isF1Track || trackDef.vehicleRestriction === 'f1_only');
    const isF1Car = activeCar ? (activeCar.category === 'Formula 1' || activeCar.slug.startsWith('f1-') || activeCar.slug === 'mclaren-mp45') : false;
    const isCarCompatible = isF1Track ? isF1Car : !isF1Car;

    const restrictionBannerHtml = isCarCompatible ? '' : `
      <div class="carx-track-restriction-banner ${isF1Track ? 'req-f1' : 'req-street'}">
        <div class="res-banner-left">
          <div class="res-icon">${isF1Track ? '🏁' : '🚫'}</div>
          <div>
            <div class="res-title">${isF1Track ? 'FORMULA 1 REGULATIONS ONLY' : 'PUBLIC HIGHWAY REGULATIONS'}</div>
            <div class="res-desc">${isF1Track
              ? 'Autodromo Nazionale Monza is strictly restricted to Formula 1 race cars. Street supercars and GT vehicles cannot enter this track.'
              : 'Formula 1 open-wheel single-seaters are not street legal for public highway duels. Please equip a Supercar, GT, or Tuner vehicle.'}</div>
          </div>
        </div>
        <button type="button" class="btn-res-autoswitch" id="btnResAutoSwitch">
          ${isF1Track ? '🏎️ AUTO-EQUIP F1 CAR' : '🚗 AUTO-EQUIP SUPERCAR'}
        </button>
      </div>
    `;

    stage.innerHTML = `
      <!-- Hero Highway Panoramic Banner -->
      <div class="carx-hero-banner" style="background-image: linear-gradient(180deg, rgba(6, 8, 14, 0.2) 0%, rgba(6, 8, 14, 0.88) 100%), url(${heroImg});">
        <div class="carx-banner-overlay-content">
          <div class="carx-hero-route-tag">
            <span class="shield-icon">${isF1Track ? '🏁' : '🛣️'}</span>
            <span>${trackDef.highwayCode || 'INTERSTATE HIGHWAY'}</span>
          </div>
          <h2 class="carx-hero-title">${track.name}</h2>
          <div class="carx-hero-district">📍 ${trackDef.district || track.country}</div>
        </div>

        <div class="carx-mini-gps-card">
          <canvas id="carxGpsCanvas" width="160" height="90"></canvas>
          <div class="gps-label">HOLOGRAPHIC GPS ROUTE</div>
        </div>
      </div>

      <!-- Highway Telemetry & Conditions (4-Card Grid) -->
      <div class="carx-telemetry-grid">
        <div class="telemetry-box">
          <span class="telemetry-label">TRAFFIC DENSITY</span>
          <div class="telemetry-val">${trackDef.trafficDensity || 'Heavy (85%)'}</div>
          <div class="traffic-bars-row">
            <div class="bar-unit ${trackDef.trafficLevel >= 1 ? 'active' : ''}"></div>
            <div class="bar-unit ${trackDef.trafficLevel >= 2 ? 'active' : ''}"></div>
            <div class="bar-unit ${trackDef.trafficLevel >= 3 ? 'active' : ''}"></div>
            <div class="bar-unit ${trackDef.trafficLevel >= 5 ? 'active' : ''}"></div>
          </div>
        </div>

        <div class="telemetry-box">
          <span class="telemetry-label">POLICE THREAT</span>
          <div class="telemetry-val" style="color: ${isF1Track ? '#00f0ff' : '#ffd600'};">${trackDef.policeThreat || '3-Star Interceptors'}</div>
          <div style="font-size: 0.72rem; color: ${isF1Track ? '#00f59b' : '#ff0055'}; font-weight: 800;">
            ${isF1Track ? 'FIA SAFETY CAR ONLY' : 'HIGHWAY PATROL ACTIVE'}
          </div>
        </div>

        <div class="telemetry-box">
          <span class="telemetry-label">ROAD SURFACE</span>
          <div class="telemetry-val" style="color: #00f0ff;">${trackDef.surfaceGrip || 'Dry Asphalt (100%)'}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">
            ${isF1Track ? 'PIRELLI F1 COMPOUND' : 'HIGH-SPEED TARMAC'}
          </div>
        </div>

        <div class="telemetry-box">
          <span class="telemetry-label">SECTOR LENGTH</span>
          <div class="telemetry-val" style="color: #fff;">${track.length_km} KM</div>
          <div style="font-size: 0.72rem; color: var(--accent-gold); font-weight: 800;">${track.laps} LAPS ${isF1Track ? 'GRAND PRIX' : 'SPRINT'}</div>
        </div>
      </div>

      <!-- Time of Day & Lighting Control -->
      <div class="carx-controls-strip">
        <div class="carx-time-selector">
          <span class="carx-strip-label">LIGHTING & TIME OF DAY:</span>
          <div class="carx-time-pills">
            <button type="button" class="carx-time-pill ${currentTimePref === 'day' ? 'active' : ''}" data-time="day">
              ☀️ CLEAR DAY
            </button>
            <button type="button" class="carx-time-pill ${currentTimePref === 'sunset' ? 'active' : ''}" data-time="sunset">
              🌅 GOLDEN SUNSET
            </button>
            <button type="button" class="carx-time-pill ${currentTimePref === 'night' ? 'active' : ''}" data-time="night">
              🌙 MIDNIGHT NEON
            </button>
          </div>
        </div>

        <!-- Vehicle Compatibility Check -->
        <div class="carx-car-check">
          <div class="carx-strip-label">EQUIPPED VEHICLE:</div>
          <div class="carx-equipped-car-row">
            <div class="car-swatch-dot" style="background: ${activeCar.custom_color || activeCar.default_color};"></div>
            <div>
              <div style="font-weight: 800; color: #fff; font-size: 0.88rem;">${activeCar.brand} ${activeCar.name}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">
                ${carHp} HP vs Rec: ${reqHp} HP
                <span class="hp-status-tag ${isCarCompatible ? 'ready' : 'tune'}">
                  ${isCarCompatible ? '✓ COMPATIBLE' : '⚠️ WRONG VEHICLE TYPE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vehicle Type Restriction Banner (if incompatible) -->
      ${restrictionBannerHtml}

      <!-- 3-Star Mission Objectives & Rewards -->
      <div class="carx-objectives-box">
        <div class="objectives-header">
          <span>EVENT MISSION OBJECTIVES</span>
          <span class="reward-purse-pill">💰 $${(trackDef.cashReward || 2500).toLocaleString()} + ⚡ ${trackDef.xpReward || 650} XP</span>
        </div>
        <div class="objectives-list">
          ${(trackDef.objectives || [
            { text: 'Finish 1st Place vs 3 AI Rivals', reward: '+$1,500 Cash', icon: '🏆' },
            { text: 'Execute 3+ High-Speed Near Misses', reward: '+$500 Cash', icon: '⚡' },
            { text: 'Reach Top Speed of 180+ MPH', reward: '+350 XP', icon: '🔥' }
          ]).map(obj => `
            <div class="objective-item">
              <span class="obj-star">⭐</span>
              <span class="obj-text">${obj.text}</span>
              <span class="obj-reward">${obj.reward}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Big CarX Glowing CTA Button -->
      <button class="btn-carx-drive" id="btnCarxDrive">
        <div class="drive-btn-inner">
          <span class="drive-btn-icon">${isF1Track ? '🏁' : '🏎️'}</span>
          <div style="text-align: left;">
            <div class="drive-btn-main">${isF1Track ? 'ENTER MONZA GRAND PRIX' : 'DRIVE HIGHWAY • START EVENT'}</div>
            <div class="drive-btn-sub">${isF1Track ? 'FORMULA 1 GRAND PRIX • 0 TRAFFIC • TEMPLE OF SPEED' : 'FULL SPEED TRAFFIC DUEL • ALL SYSTEMS ARMED'}</div>
          </div>
          <span class="drive-btn-chevron">➔</span>
        </div>
      </button>
    `;

    // Hook up auto-switch button if present
    const switchBtn = stage.querySelector('#btnResAutoSwitch');
    if (switchBtn) {
      switchBtn.addEventListener('click', async () => {
        if (isF1Track) {
          const f1Car = this.cars.find(c => c.slug === 'f1-2022-ferrari' && c.is_unlocked) ||
                        this.cars.find(c => (c.category === 'Formula 1' || c.slug.startsWith('f1-') || c.slug === 'mclaren-mp45') && c.is_unlocked) ||
                        this.cars.find(c => c.slug === 'f1-2022-ferrari') ||
                        this.cars.find(c => c.category === 'Formula 1');
          if (f1Car) {
            this.cars.forEach(c => c.is_selected = (c.slug === f1Car.slug));
            try { await RacingAPI.selectCar(f1Car.slug); } catch (e) {}
            this.renderHighwayMissionDetail(track.slug);
          }
        } else {
          const streetCar = this.cars.find(c => c.slug === 'nissan-gtr-nismo' && c.is_unlocked) ||
                            this.cars.find(c => c.category !== 'Formula 1' && !c.slug.startsWith('f1-') && c.slug !== 'mclaren-mp45' && c.is_unlocked) ||
                            this.cars.find(c => c.slug === 'nissan-gtr-nismo') ||
                            this.cars.find(c => c.category !== 'Formula 1');
          if (streetCar) {
            this.cars.forEach(c => c.is_selected = (c.slug === streetCar.slug));
            try { await RacingAPI.selectCar(streetCar.slug); } catch (e) {}
            this.renderHighwayMissionDetail(track.slug);
          }
        }
      });
    }

    // Time-of-day click handler
    stage.querySelectorAll('.carx-time-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        const chosenTime = pill.getAttribute('data-time');
        this.trackTimePrefs[track.slug] = chosenTime;
        stage.querySelectorAll('.carx-time-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
      });
    });

    // Start Race click handler
    stage.querySelector('#btnCarxDrive').addEventListener('click', () => {
      this.selectedTrackSlug = track.slug;
      this.startRace();
    });

    // Render holographic GPS canvas
    setTimeout(() => this.drawCarxGpsRoute(trackDef), 20);
  }

  drawCarxGpsRoute(trackDef) {
    const canvas = document.getElementById('carxGpsCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 160;
    canvas.height = 90;

    ctx.fillStyle = 'rgba(8, 12, 20, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const wps = trackDef.waypoints;
    if (!wps || wps.length === 0) return;

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

    const toCanvasX = (x) => pad + ((x - minX) / spanX) * drawW;
    const toCanvasY = (z) => pad + ((z - minZ) / spanZ) * drawH;

    // Outer neon glow line
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(toCanvasX(wps[0].x), toCanvasY(wps[0].z !== undefined ? wps[0].z : wps[0].y));
    for (let i = 1; i < wps.length; i++) {
      ctx.lineTo(toCanvasX(wps[i].x), toCanvasY(wps[i].z !== undefined ? wps[i].z : wps[i].y));
    }
    ctx.closePath();
    ctx.stroke();

    // Sharp cyan route line
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Start / Finish Marker
    ctx.fillStyle = '#ffd600';
    ctx.beginPath();
    ctx.arc(toCanvasX(wps[0].x), toCanvasY(wps[0].z !== undefined ? wps[0].z : wps[0].y), 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawTrackMiniThumbnail(track) {
    const canvas = document.getElementById(`preview_${track.slug}`);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 340;
    canvas.height = 200;

    const trackDef = (window.RacingTracks && window.RacingTracks[track.slug]) || (window.RacingTracks && window.RacingTracks['los-santos']);
    if (!trackDef) return;

    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const wps = trackDef.waypoints;
    if (!wps || wps.length === 0) return;

    // Normalize coordinates to fit canvas bounds
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
    const pad = 35;
    const drawW = canvas.width - pad * 2;
    const drawH = canvas.height - pad * 2;

    const toCanvasX = (x) => pad + ((x - minX) / spanX) * drawW;
    const toCanvasY = (z) => pad + ((z - minZ) / spanZ) * drawH;

    // Track path subtle neon glow
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(toCanvasX(wps[0].x), toCanvasY(wps[0].z !== undefined ? wps[0].z : wps[0].y));
    for (let i = 1; i < wps.length; i++) {
      ctx.lineTo(toCanvasX(wps[i].x), toCanvasY(wps[i].z !== undefined ? wps[i].z : wps[i].y));
    }
    ctx.closePath();
    ctx.stroke();

    // Sharp track guideline
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Start / Finish Line indicator dot
    const sfX = toCanvasX(wps[0].x);
    const sfY = toCanvasY(wps[0].z !== undefined ? wps[0].z : wps[0].y);
    ctx.fillStyle = '#ffd600';
    ctx.beginPath();
    ctx.arc(sfX, sfY, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  startRace() {
    this.navigateTo('game');

    // Attempt orientation lock to landscape on mobile devices
    this.requestLandscapeOrientation();

    // Find currently equipped car or fallback to selected in garage
    let activeCar = this.cars.find(c => c.is_selected) || this.cars[this.selectedCarIndex] || this.cars[0];

    const isF1Track = (this.selectedTrackSlug === 'monza-f1' || this.selectedTrackSlug === 'autodromo-monza' || (this.tracks && this.tracks.find(t => t.slug === this.selectedTrackSlug)?.isF1Track));
    let isF1Car = activeCar.category === 'Formula 1' || activeCar.slug.startsWith('f1-') || activeCar.slug === 'mclaren-mp45';

    // Strict two-way vehicle restriction:
    // 1. F1 track ONLY allows Formula 1 cars
    // 2. Public highway tracks ONLY allow Supercars / GT / Sports cars
    if (isF1Track && !isF1Car) {
      const f1Car = this.cars.find(c => c.slug === 'f1-2022-ferrari' && c.is_unlocked) ||
                    this.cars.find(c => (c.category === 'Formula 1' || c.slug.startsWith('f1-') || c.slug === 'mclaren-mp45') && c.is_unlocked) ||
                    this.cars.find(c => c.slug === 'f1-2022-ferrari') ||
                    this.cars.find(c => c.category === 'Formula 1');
      if (f1Car) {
        this.cars.forEach(c => c.is_selected = (c.slug === f1Car.slug));
        activeCar = f1Car;
        isF1Car = true;
        try { RacingAPI.selectCar(f1Car.slug); } catch (e) {}
      }
    } else if (!isF1Track && isF1Car) {
      const streetCar = this.cars.find(c => c.slug === 'nissan-gtr-nismo' && c.is_unlocked) ||
                        this.cars.find(c => c.category !== 'Formula 1' && !c.slug.startsWith('f1-') && c.slug !== 'mclaren-mp45' && c.is_unlocked) ||
                        this.cars.find(c => c.slug === 'nissan-gtr-nismo') ||
                        this.cars.find(c => c.category !== 'Formula 1');
      if (streetCar) {
        this.cars.forEach(c => c.is_selected = (c.slug === streetCar.slug));
        activeCar = streetCar;
        isF1Car = false;
        try { RacingAPI.selectCar(streetCar.slug); } catch (e) {}
      }
    }

    // Pick 3 diverse real-life AI rivals (use F1 rivals if F1 car or F1 track)
    let otherCars;
    if (isF1Car || isF1Track) {
      const f1Rivals = this.cars.filter(c => (c.category === 'Formula 1' || c.slug.startsWith('f1-') || c.slug === 'mclaren-mp45') && c.slug !== activeCar.slug);
      otherCars = f1Rivals.length >= 3 ? f1Rivals : this.cars.filter(c => c.slug !== activeCar.slug);
    } else {
      otherCars = this.cars.filter(c => c.category !== 'Formula 1' && !c.slug.startsWith('f1-') && c.slug !== 'mclaren-mp45' && c.slug !== activeCar.slug);
      if (otherCars.length < 3) otherCars = this.cars.filter(c => c.slug !== activeCar.slug);
    }

    const aiConfigs = otherCars.slice(0, 3).map(c => ({
      slug: c.slug,
      name: c.name,
      color: c.default_color,
      top_speed_mph: c.top_speed_mph,
      horsepower: c.horsepower,
      accel_0_60: c.accel_0_60,
      weight_kg: c.weight_kg,
      handling_score: c.handling_score,
      braking_score: c.braking_score,
      audio_pitch: c.audio_pitch,
      category: c.category
    }));

    // Stop old engine if running
    if (this.gameEngine) {
      this.gameEngine.stop();
    }

    // Launch 3D Three.js Engine
    this.gameEngine = new RacingGameEngine3D('game3DContainer');

    const selectedTime = this.trackTimePrefs[this.selectedTrackSlug] || 'day';

    this.gameEngine.setupRace(this.selectedTrackSlug, {
      slug: activeCar.slug,
      name: activeCar.name,
      category: activeCar.category,
      color: activeCar.custom_color || activeCar.default_color,
      top_speed_mph: activeCar.top_speed_mph,
      horsepower: activeCar.horsepower,
      accel_0_60: activeCar.accel_0_60,
      weight_kg: activeCar.weight_kg,
      handling_score: activeCar.handling_score,
      braking_score: activeCar.braking_score,
      engine_level: activeCar.engine_level || 1,
      handling_level: activeCar.handling_level || 1,
      nitro_level: activeCar.nitro_level || 1,
      audio_pitch: activeCar.audio_pitch
    }, aiConfigs, selectedTime);

    // Apply selected race mode if Police Escape
    if (this.selectedRaceMode === 'police') {
      setTimeout(() => {
        this.gameEngine.trafficPolice.setWantedLevel(3);
        const objEl = document.getElementById('hudMissionObjective');
        if (objEl) objEl.textContent = '🚨 POLICE ESCAPE: Evade 3-Star Pursuit & Reach Extraction!';
      }, 3500);
    } else if (this.selectedRaceMode === 'freeroam') {
      const objEl = document.getElementById('hudMissionObjective');
      if (objEl) objEl.textContent = '🏙️ OPEN WORLD FREE ROAM: Explore City or Exit Car [E]';
    }
  }

  /* --------------------------------------------------------------------------
     Race Results & Server Rewards Handling
     -------------------------------------------------------------------------- */
  async handleRaceFinished(results) {
    const modal = document.getElementById('resultsModal');
    if (!modal) return;

    // Update modal display
    const rankTitles = { 1: 'VICTORY - 1ST PLACE!', 2: '2ND PLACE PODIUM', 3: '3RD PLACE PODIUM', 4: '4TH PLACE' };
    const crowns = { 1: '👑', 2: '🥈', 3: '🥉', 4: '🏁' };

    document.getElementById('resCrown').textContent = crowns[results.finishPosition] || '🏁';
    document.getElementById('resPositionTitle').textContent = rankTitles[results.finishPosition] || 'RACE COMPLETE';
    document.getElementById('resTrackName').textContent = this.trackData?.name || 'Grand Prix Circuit';

    const min = Math.floor(results.raceTime / 60);
    const sec = (results.raceTime % 60).toFixed(2);
    document.getElementById('resTotalTime').textContent = `${min}:${sec < 10 ? '0' : ''}${sec}`;
    document.getElementById('resBestLap').textContent = `${results.bestLapTime.toFixed(2)}s`;
    document.getElementById('resTopSpeed').textContent = `${results.topSpeed} MPH`;

    // Send race results to Django backend
    try {
      const serverResponse = await RacingAPI.submitRace({
        track_slug: results.trackSlug,
        car_slug: results.carSlug,
        finish_position: results.finishPosition,
        race_time: results.raceTime,
        best_lap_time: results.bestLapTime,
        top_speed: results.topSpeed,
        mode: 'Quick Race'
      });

      document.getElementById('resPrizeCoins').textContent = `+$${serverResponse.prize_coins.toLocaleString()}`;
      document.getElementById('resXpEarned').textContent = `+${serverResponse.xp_earned} XP`;

      // Update local profile balance
      await this.refreshCarData();

      // Show level up notification if leveled up
      if (serverResponse.leveled_up) {
        alert(`🌟 LEVEL UP! You reached Driver Level ${serverResponse.new_level}! Bonus credits added to your account!`);
      }
      if (serverResponse.new_achievements && serverResponse.new_achievements.length > 0) {
        alert(`🏆 New Achievement Unlocked: ${serverResponse.new_achievements.join(', ')}!`);
      }
    } catch (e) {
      console.warn('Failed submitting race results:', e);
      document.getElementById('resPrizeCoins').textContent = '+$500';
      document.getElementById('resXpEarned').textContent = '+300 XP';
    }

    modal.classList.add('active');
  }

  bindResultsModal() {
    const modal = document.getElementById('resultsModal');
    const btnAgain = document.getElementById('btnResRaceAgain');
    const btnGarage = document.getElementById('btnResGarage');

    if (btnAgain) {
      btnAgain.addEventListener('click', () => {
        modal.classList.remove('active');
        this.startRace();
      });
    }

    if (btnGarage) {
      btnGarage.addEventListener('click', () => {
        modal.classList.remove('active');
        this.navigateTo('garage');
      });
    }
  }

  /* --------------------------------------------------------------------------
     Leaderboard & Career Screens
     -------------------------------------------------------------------------- */
  async loadLeaderboard(category = 'wins', trackSlug = '') {
    const tableBody = document.getElementById('leaderboardTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">Loading rankings...</td></tr>';

    try {
      const data = await RacingAPI.getLeaderboard(category, trackSlug);
      tableBody.innerHTML = '';

      if (category === 'track' && data.rankings) {
        data.rankings.forEach(item => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><span class="rank-badge rank-${item.rank}">${item.rank}</span></td>
            <td><strong>${item.player_name}</strong></td>
            <td>${item.car_name}</td>
            <td style="font-family: var(--font-mono); color: var(--accent-gold); font-weight:800;">${item.best_lap}s</td>
            <td>${item.date}</td>
          `;
          tableBody.appendChild(tr);
        });
      } else if (data.rankings) {
        data.rankings.forEach((player, idx) => {
          const rank = idx + 1;
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><span class="rank-badge rank-${rank}">${rank}</span></td>
            <td><strong>${player.player_name}</strong></td>
            <td><span class="level-chip">LVL ${player.level}</span></td>
            <td style="color: var(--accent-gold); font-weight: 800;">$${player.coins.toLocaleString()}</td>
            <td>${player.total_wins} Wins (${player.total_races} Races)</td>
          `;
          tableBody.appendChild(tr);
        });
      }
    } catch (e) {
      tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Failed to load leaderboard.</td></tr>';
    }
  }

  async loadCareerProfile() {
    if (!this.profile) return;
    document.getElementById('careerNickname').textContent = this.profile.nickname || this.profile.username;
    document.getElementById('careerLevel').textContent = `Driver Level ${this.profile.level}`;
    document.getElementById('careerCoins').textContent = `$${this.profile.coins.toLocaleString()}`;
    document.getElementById('careerRaces').textContent = this.profile.total_races;
    document.getElementById('careerWins').textContent = this.profile.total_wins;

    const winRate = this.profile.total_races > 0 ? ((this.profile.total_wins / this.profile.total_races) * 100).toFixed(1) : 0;
    document.getElementById('careerWinRate').textContent = `${winRate}%`;
    document.getElementById('careerBestLap').textContent = this.profile.best_lap_overall > 0 ? `${this.profile.best_lap_overall}s` : '--';

    // XP progress
    const xpPct = (this.profile.xp / this.profile.xp_needed) * 100;
    document.getElementById('careerXpFill').style.width = `${xpPct}%`;
    document.getElementById('careerXpText').textContent = `${this.profile.xp} / ${this.profile.xp_needed} XP`;

    // Load recent races history
    try {
      const history = await RacingAPI.getRaceHistory();
      const historyBody = document.getElementById('careerHistoryBody');
      if (historyBody) {
        historyBody.innerHTML = '';
        history.forEach(r => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><strong>${r.track_name}</strong></td>
            <td>${r.car_brand} ${r.car_name}</td>
            <td><strong style="color: ${r.finish_position === 1 ? 'var(--accent-gold)' : 'var(--text-main)'};">P${r.finish_position}</strong></td>
            <td style="font-family: var(--font-mono);">${r.best_lap_time}s</td>
            <td style="color: var(--accent-gold);">+$${r.prize_coins}</td>
          `;
          historyBody.appendChild(tr);
        });
      }
    } catch (e) {}

    // Load achievements
    try {
      const rewards = await RacingAPI.getRewards();
      const rewardsContainer = document.getElementById('achievementsContainer');
      if (rewardsContainer) {
        rewardsContainer.innerHTML = '';
        rewards.forEach(ach => {
          const div = document.createElement('div');
          div.className = `feature-card ${ach.unlocked ? 'unlocked' : ''}`;
          div.style.borderColor = ach.unlocked ? 'var(--accent-cyan)' : 'var(--border-color)';
          div.innerHTML = `
            <div class="feature-icon">${ach.icon}</div>
            <div class="feature-title">${ach.title}</div>
            <p class="feature-desc">${ach.description}</p>
            <div style="margin-top: 0.8rem; font-size: 0.85rem; color: var(--accent-gold); font-weight: 700;">
              ${ach.unlocked ? '✓ Unlocked' : `Reward: $${ach.reward_coins}`}
            </div>
          `;
          rewardsContainer.appendChild(div);
        });
      }
    } catch (e) {}
  }

  /* --------------------------------------------------------------------------
     Authentication Modal
     -------------------------------------------------------------------------- */
  bindAuthModal() {
    const modal = document.getElementById('authModal');
    const openBtn = document.getElementById('btnNavAuth');
    const closeBtn = document.getElementById('btnCloseAuth');
    const btnSubmit = document.getElementById('btnAuthSubmit');
    const toggleLink = document.getElementById('linkToggleAuthMode');
    let isRegisterMode = false;

    if (openBtn) openBtn.addEventListener('click', () => modal.classList.add('active'));
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));

    if (toggleLink) {
      toggleLink.addEventListener('click', (e) => {
        e.preventDefault();
        isRegisterMode = !isRegisterMode;
        document.getElementById('authTitle').textContent = isRegisterMode ? 'CREATE RACER ACCOUNT' : 'RACER LOGIN';
        document.getElementById('authNicknameGroup').style.display = isRegisterMode ? 'block' : 'none';
        btnSubmit.textContent = isRegisterMode ? 'Register & Save Progress' : 'Sign In';
        toggleLink.textContent = isRegisterMode ? 'Already have an account? Sign in' : 'Need an account? Register now';
      });
    }

    if (btnSubmit) {
      btnSubmit.addEventListener('click', async () => {
        const username = document.getElementById('authUsername').value.trim();
        const password = document.getElementById('authPassword').value.trim();
        const nickname = document.getElementById('authNickname').value.trim();

        if (!username || !password) {
          alert('Please enter username and password');
          return;
        }

        try {
          if (isRegisterMode) {
            await RacingAPI.register(username, password, nickname);
          } else {
            await RacingAPI.login(username, password);
          }
          modal.classList.remove('active');
          await this.loadInitialData();
          alert('Welcome to Racing Zone!');
        } catch (err) {
          alert(err.message || 'Authentication error');
        }
      });
    }
  }

  /* --------------------------------------------------------------------------
     Multiplayer Circuit & Lobby Integration
     -------------------------------------------------------------------------- */
  initMultiplayerView() {
    this.initMultiplayer();
    const mp = window.racingMultiplayer;
    if (mp) {
      mp.connect().then(() => {
        mp.requestRoomList();
      }).catch(err => {
        console.warn("Multiplayer connection error:", err);
      });
    }
  }

  initMultiplayer() {
    if (this._mpInitialized) return;
    this._mpInitialized = true;
    const mp = window.racingMultiplayer;
    if (!mp) return;

    this.mpLocalReady = false;

    // Connection events
    mp.on('connectionChange', ({ connected }) => {
      const dot = document.getElementById('mpStatusDot');
      const txt = document.getElementById('mpStatusText');
      if (dot) dot.style.background = connected ? '#00f59b' : '#ff2a5f';
      if (txt) txt.textContent = connected ? 'Online Matchmaker' : 'Offline';
    });

    setInterval(() => {
      const pingEl = document.getElementById('mpPingVal');
      if (pingEl && mp.isConnected) {
        pingEl.textContent = `${mp.ping} ms`;
      }
    }, 1500);

    // Room events
    mp.on('roomList', (rooms) => this.renderMpRoomsList(rooms));
    mp.on('roomJoined', (data) => this.showMpRoomLobby(data));
    mp.on('roomUpdated', (room) => this.updateMpRoomLobby(room));
    mp.on('chat', (data) => this.appendMpChat(data));
    mp.on('error', (err) => {
      const errEl = document.getElementById('mpJoinError');
      if (errEl) {
        errEl.textContent = err.message || 'Error occurred';
        errEl.style.display = 'block';
        setTimeout(() => { errEl.style.display = 'none'; }, 4000);
      }
    });

    // Start race countdown event
    mp.on('countdown', (data) => {
      this.launchMultiplayerRace(data);
    });

    // Race results event
    mp.on('raceResults', (standings) => {
      this.showMultiplayerResultsModal(standings);
    });

    // Bind UI Buttons
    const btnQuickMatch = document.getElementById('btnMpQuickMatch');
    if (btnQuickMatch) {
      btnQuickMatch.addEventListener('click', () => this.handleMpQuickMatch());
    }

    const btnCreateRoom = document.getElementById('btnMpCreateRoom');
    if (btnCreateRoom) {
      btnCreateRoom.addEventListener('click', () => this.handleMpCreateRoom());
    }

    const btnJoinWithCode = document.getElementById('btnMpJoinWithCode');
    if (btnJoinWithCode) {
      btnJoinWithCode.addEventListener('click', () => this.handleMpJoinWithCode());
    }

    const btnRefresh = document.getElementById('btnMpRefreshRooms');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => mp.requestRoomList());
    }

    const btnCopyCode = document.getElementById('btnMpCopyCode');
    if (btnCopyCode) {
      btnCopyCode.addEventListener('click', () => {
        if (mp.currentRoom && mp.currentRoom.code) {
          navigator.clipboard.writeText(mp.currentRoom.code).then(() => {
            btnCopyCode.textContent = '✅ Copied!';
            setTimeout(() => { btnCopyCode.textContent = '📋 Copy'; }, 2000);
          });
        }
      });
    }

    const btnLeave = document.getElementById('btnMpLeaveRoom');
    if (btnLeave) {
      btnLeave.addEventListener('click', () => {
        mp.leaveRoom();
        document.getElementById('mpLobbyView').style.display = 'none';
        document.getElementById('mpBrowserView').style.display = 'block';
        mp.requestRoomList();
      });
    }

    const btnToggleReady = document.getElementById('btnMpToggleReady');
    if (btnToggleReady) {
      btnToggleReady.addEventListener('click', () => {
        this.mpLocalReady = !this.mpLocalReady;
        const curCar = this.cars[this.selectedCarIndex] || {};
        mp.toggleReady(this.mpLocalReady, {
          slug: curCar.slug || 'porsche-911-gt3-rs',
          color: curCar.custom_color || curCar.default_color || '#00f0ff',
          name: curCar.name || 'Porsche 911 GT3 RS'
        });
        this.updateMpReadyButtonState();
      });
    }

    const btnStartRace = document.getElementById('btnMpStartRace');
    if (btnStartRace) {
      btnStartRace.addEventListener('click', () => {
        mp.startRace();
      });
    }

    // Quick chat buttons
    document.querySelectorAll('.mp-quick-chat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const msg = btn.getAttribute('data-msg');
        if (msg) mp.sendChat(msg);
      });
    });
  }

  getCurrentRacerConfig() {
    const curCar = this.cars[this.selectedCarIndex] || {};
    const username = (this.profile && this.profile.nickname) || 'Guest Racer';
    return {
      username: username,
      carSlug: curCar.slug || 'porsche-911-gt3-rs',
      carColor: curCar.custom_color || curCar.default_color || '#00f0ff',
      carName: curCar.name || 'Porsche 911 GT3 RS'
    };
  }

  async handleMpQuickMatch() {
    const mp = window.racingMultiplayer;
    await mp.connect();
    mp.on('roomList', function onList(rooms) {
      mp.off('roomList', onList);
      const openRoom = rooms.find(r => r.status === 'waiting' && r.player_count < 4);
      const racer = window.racingApp.getCurrentRacerConfig();
      if (openRoom) {
        mp.joinRoom(openRoom.code, racer);
      } else {
        mp.createRoom({
          ...racer,
          trackSlug: 'neon_city',
          laps: 2
        });
      }
    });
    mp.requestRoomList();
  }

  async handleMpCreateRoom() {
    const mp = window.racingMultiplayer;
    await mp.connect();
    const trackSlug = document.getElementById('mpCreateTrackSelect')?.value || 'neon_city';
    const laps = parseInt(document.getElementById('mpCreateLapsSelect')?.value || '2', 10);
    const racer = this.getCurrentRacerConfig();
    mp.createRoom({
      ...racer,
      trackSlug,
      laps
    });
  }

  async handleMpJoinWithCode() {
    const input = document.getElementById('mpJoinCodeInput');
    const code = input ? input.value.trim().toUpperCase() : '';
    if (!code) return;
    const mp = window.racingMultiplayer;
    await mp.connect();
    const racer = this.getCurrentRacerConfig();
    mp.joinRoom(code, racer);
  }

  renderMpRoomsList(rooms) {
    const container = document.getElementById('mpRoomsListContainer');
    if (!container) return;

    if (!rooms || rooms.length === 0) {
      container.innerHTML = '<div style="color: var(--text-muted); font-size: 0.9rem; padding: 1rem 0;">No active rooms found. Click "Create Room" or "Quick Match" to start one!</div>';
      return;
    }

    container.innerHTML = rooms.map(room => {
      const trackObj = window.RacingTracks ? window.RacingTracks[room.track_slug] : null;
      const trackName = trackObj ? trackObj.name : room.track_slug;
      return `
        <div class="feature-card" style="padding: 1rem; border: 1px solid var(--border-color);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-family: var(--font-mono); font-weight: 800; color: var(--accent-cyan); font-size: 1.1rem;">${room.code}</span>
            <span class="level-chip" style="font-size: 0.75rem;">${room.player_count}/${room.max_players} Racers</span>
          </div>
          <div style="font-size: 0.85rem; color: #fff; font-weight: 700; margin-bottom: 0.3rem;">${trackName}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.8rem;">Host: ${room.host_name} • ${room.laps} Laps</div>
          <button class="btn btn-primary btn-join-room-card" data-code="${room.code}" style="width: 100%; padding: 0.4rem; font-size: 0.85rem;">
            Join Room
          </button>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.btn-join-room-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-code');
        if (code) {
          const mp = window.racingMultiplayer;
          const racer = this.getCurrentRacerConfig();
          mp.joinRoom(code, racer);
        }
      });
    });
  }

  showMpRoomLobby(data) {
    const browser = document.getElementById('mpBrowserView');
    const lobby = document.getElementById('mpLobbyView');
    if (browser) browser.style.display = 'none';
    if (lobby) lobby.style.display = 'block';

    const codeEl = document.getElementById('mpRoomCodeDisplay');
    if (codeEl) codeEl.textContent = data.roomCode;

    this.mpLocalReady = false;
    this.updateMpReadyButtonState();
    this.updateMpRoomLobby(data.room);
  }

  updateMpRoomLobby(room) {
    if (!room) return;
    const mp = window.racingMultiplayer;

    const trackObj = window.RacingTracks ? window.RacingTracks[room.track_slug] : null;
    const trackNameEl = document.getElementById('mpRoomTrackName');
    if (trackNameEl) trackNameEl.textContent = trackObj ? trackObj.name : room.track_slug;

    const lapsEl = document.getElementById('mpRoomLapsCount');
    if (lapsEl) lapsEl.textContent = room.laps;

    const countEl = document.getElementById('mpPlayerCount');
    if (countEl) countEl.textContent = room.players.length;

    // Render Slots (0..3)
    const slotsContainer = document.getElementById('mpSlotsContainer');
    if (slotsContainer) {
      let slotsHtml = '';
      for (let s = 0; s < 4; s++) {
        const player = room.players.find(p => p.slot === s);
        if (player) {
          const isMe = (player.id === mp.playerId);
          const readyBadge = player.is_ready
            ? '<span style="color: #00f59b; font-weight: 700;">READY ✅</span>'
            : '<span style="color: var(--accent-gold); font-weight: 700;">NOT READY ⏳</span>';

          slotsHtml += `
            <div class="feature-card" style="padding: 1.2rem; border: 1px solid ${isMe ? 'var(--accent-cyan)' : 'var(--border-color)'}; background: ${isMe ? 'rgba(0, 240, 255, 0.05)' : 'var(--bg-card)'};">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
                <span class="level-chip" style="font-size: 0.75rem;">GRID P${s + 1}</span>
                ${player.is_host ? '<span style="color: var(--accent-gold); font-size: 0.8rem; font-weight: 800;">👑 HOST</span>' : ''}
              </div>
              <div style="font-weight: 800; font-size: 1.05rem; color: #fff; margin-bottom: 0.3rem;">
                ${player.username} ${isMe ? '<span style="font-size: 0.75rem; color: var(--accent-cyan);">(You)</span>' : ''}
              </div>
              <div style="font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.8rem;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${player.car_color}; border: 1px solid rgba(255,255,255,0.4);"></span>
                <span>${player.car_name}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.06);">
                <div>${readyBadge}</div>
                <div style="color: var(--text-dim); font-family: var(--font-mono); font-size: 0.75rem;">${player.ping || 15}ms</div>
              </div>
            </div>
          `;
        } else {
          slotsHtml += `
            <div class="feature-card" style="padding: 1.2rem; border: 1px dashed rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); opacity: 0.6; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 120px;">
              <span class="level-chip" style="font-size: 0.75rem; margin-bottom: 0.5rem;">GRID P${s + 1}</span>
              <span style="font-size: 0.85rem; color: var(--text-dim);">Waiting for racer...</span>
            </div>
          `;
        }
      }
      slotsContainer.innerHTML = slotsHtml;
    }

    // Host Launch controls
    const isHost = (room.host_id === mp.playerId);
    const allReady = room.players.length >= 1 && room.players.every(p => p.is_ready);
    const startBtn = document.getElementById('btnMpStartRace');
    const hostHint = document.getElementById('mpHostHint');

    if (startBtn) {
      if (isHost) {
        startBtn.style.display = 'inline-flex';
        startBtn.disabled = !allReady;
        if (hostHint) {
          hostHint.textContent = allReady
            ? '🏎️ All drivers ready! Launch the race when set.'
            : 'Waiting for all drivers to hit "Ready"...';
        }
      } else {
        startBtn.style.display = 'none';
        if (hostHint) {
          hostHint.textContent = allReady
            ? 'All drivers ready! Waiting for Host to launch race...'
            : 'Get ready for the green flag!';
        }
      }
    }
  }

  updateMpReadyButtonState() {
    const btn = document.getElementById('btnMpToggleReady');
    const icon = document.getElementById('btnMpReadyIcon');
    const text = document.getElementById('btnMpReadyText');
    if (!btn) return;

    if (this.mpLocalReady) {
      btn.style.borderColor = '#00f59b';
      btn.style.color = '#00f59b';
      if (icon) icon.textContent = '✅';
      if (text) text.textContent = 'Ready!';
    } else {
      btn.style.borderColor = '';
      btn.style.color = '';
      if (icon) icon.textContent = '⏳';
      if (text) text.textContent = 'I Am Ready';
    }
  }

  appendMpChat(data) {
    const box = document.getElementById('mpChatBox');
    if (!box) return;
    const line = document.createElement('div');
    line.innerHTML = `<strong>${data.username}:</strong> <span>${data.message}</span>`;
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
  }

  launchMultiplayerRace(data) {
    console.log("🏁 Launching Real-Time Multiplayer Race!", data);
    this.selectedTrackSlug = data.track_slug || 'los-santos';
    this.selectedRaceMode = 'multiplayer';

    // Transition to game viewport
    this.navigateTo('game');
    if (this.requestLandscapeOrientation) {
      this.requestLandscapeOrientation();
    }

    // Find local active car configuration
    let activeCar = (this.cars && this.cars.find(c => c.is_selected)) || 
                    (this.cars && this.cars[this.selectedCarIndex]) || 
                    (this.cars && this.cars[0]) || {
                      slug: 'porsche-911-gt3-rs',
                      name: 'Porsche 911 GT3 RS',
                      category: 'Supercars',
                      color: '#00f0ff',
                      default_color: '#00f0ff',
                      top_speed_mph: 205,
                      horsepower: 518,
                      accel_0_60: 3.0,
                      weight_kg: 1450,
                      handling_score: 95,
                      braking_score: 92,
                      engine_level: 1,
                      handling_level: 1,
                      nitro_level: 1,
                      audio_pitch: 1.0
                    };
    const mp = window.racingMultiplayer;

    // Launch Three.js 3D Engine with Multiplayer Options
    if (this.gameEngine) {
      this.gameEngine.stop();
    }
    this.gameEngine = new RacingGameEngine3D('game3DContainer');

    const selectedTime = (this.trackTimePrefs && this.trackTimePrefs[this.selectedTrackSlug]) || 'night';

    this.gameEngine.setupRace(this.selectedTrackSlug, {
      slug: activeCar.slug,
      name: activeCar.name,
      category: activeCar.category,
      color: activeCar.custom_color || activeCar.default_color || '#00f0ff',
      top_speed_mph: activeCar.top_speed_mph || 205,
      horsepower: activeCar.horsepower || 500,
      accel_0_60: activeCar.accel_0_60 || 3.2,
      weight_kg: activeCar.weight_kg || 1400,
      handling_score: activeCar.handling_score || 90,
      braking_score: activeCar.braking_score || 90,
      engine_level: activeCar.engine_level || 1,
      handling_level: activeCar.handling_level || 1,
      nitro_level: activeCar.nitro_level || 1,
      audio_pitch: activeCar.audio_pitch || 1.0
    }, [], selectedTime, {
      isMultiplayer: true,
      localPlayerId: mp.playerId,
      slot: mp.slot,
      start_timestamp: data.start_timestamp,
      track_slug: data.track_slug,
      laps: data.laps,
      players: data.players
    });

    const missionObj = document.getElementById('hudMissionObjective');
    if (missionObj) {
      missionObj.textContent = `🌐 MULTIPLAYER: ${data.players.length} Racers Circuit • ${data.laps} Laps`;
    }
  }

  showMultiplayerResultsModal(standings) {
    const modal = document.getElementById('resultsModal');
    if (!modal) return;

    const mp = window.racingMultiplayer;
    const myResult = standings.find(s => s.id === mp.playerId) || standings[0];
    const rankTitles = { 1: 'VICTORY - 1ST PLACE!', 2: '2ND PLACE PODIUM', 3: '3RD PLACE PODIUM', 4: '4TH PLACE' };
    const crowns = { 1: '👑', 2: '🥈', 3: '🥉', 4: '🏁' };

    document.getElementById('resCrown').textContent = crowns[myResult.rank] || '🏁';
    document.getElementById('resPositionTitle').textContent = rankTitles[myResult.rank] || `P${myResult.rank} FINISH`;
    document.getElementById('resTrackName').textContent = `Multiplayer Standings • ${(this.selectedTrackSlug || 'CIRCUIT').toUpperCase()}`;

    const min = Math.floor(myResult.race_time / 60);
    const sec = (myResult.race_time % 60).toFixed(2);
    document.getElementById('resTotalTime').textContent = `${min}:${sec < 10 ? '0' : ''}${sec}`;
    document.getElementById('resBestLap').textContent = `${myResult.best_lap ? myResult.best_lap.toFixed(2) : '--'}s`;

    // Coin rewards based on multiplayer rank
    const coinRewards = { 1: 1200, 2: 700, 3: 450, 4: 250 };
    const xpRewards = { 1: 500, 2: 300, 3: 200, 4: 100 };
    const rewardCoins = coinRewards[myResult.rank] || 250;
    const rewardXp = xpRewards[myResult.rank] || 100;

    const prizeCoinsEl = document.getElementById('resPrizeCoins');
    if (prizeCoinsEl) prizeCoinsEl.textContent = `+$${rewardCoins}`;

    const prizeXpEl = document.getElementById('resPrizeXp');
    if (prizeXpEl) prizeXpEl.textContent = `+${rewardXp} XP`;

    modal.classList.add('active');
  }
}

// Instantiate App when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.racingApp = new RacingApp();
  window.app = window.racingApp;
});
