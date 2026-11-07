/**
 * RACING ZONE - Real-Life Supercar Renderers
 * Authentic 2D top-down and perspective vector graphics for real-life sports cars.
 */

window.CarRenderer = {
  /**
   * Main function to render any real-life car onto a canvas context.
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} slug - car model slug
   * @param {string} bodyColor - hex color string
   * @param {object} options - { scale, lightsOn, nitroActive, steeringAngle, brakeActive }
   */
  drawTopDownCar(ctx, slug, bodyColor = '#f2f2f2', options = {}) {
    const scale = options.scale || 1.0;
    const lightsOn = options.lightsOn !== false;
    const nitroActive = !!options.nitroActive;
    const brakeActive = !!options.brakeActive;
    const steer = options.steeringAngle || 0; // radians for front wheels

    ctx.save();
    ctx.scale(scale, scale);

    // Car dimensions (approx 44px wide by 90px long standard top-down baseline)
    const W = 46;
    const L = 94;

    // Render drop shadow beneath car
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.filter = 'blur(4px)';
    ctx.beginPath();
    ctx.roundRect(-W/2 - 2, -L/2 - 2, W + 4, L + 6, 12);
    ctx.fill();
    ctx.restore();

    // Render Wheels with steering on front wheels
    this.drawWheels(ctx, W, L, steer);

    // Render Underbody & Diffusers
    ctx.fillStyle = '#111318';
    ctx.beginPath();
    ctx.roundRect(-W/2 + 2, -L/2 + 2, W - 4, L - 4, 10);
    ctx.fill();

    // Model specific chassis rendering
    switch (slug) {
      case 'porsche-911-gt3-rs':
        this.renderPorsche911GT3RS(ctx, bodyColor, W, L);
        break;
      case 'ferrari-sf90-stradale':
        this.renderFerrariSF90(ctx, bodyColor, W, L);
        break;
      case 'lamborghini-huracan-sto':
        this.renderLamborghiniSTO(ctx, bodyColor, W, L);
        break;
      case 'mclaren-765lt':
        this.renderMcLaren765LT(ctx, bodyColor, W, L);
        break;
      case 'bugatti-chiron-ss':
        this.renderBugattiChironSS(ctx, bodyColor, W, L);
        break;
      case 'nissan-gtr-nismo':
      default:
        this.renderNissanGTR(ctx, bodyColor, W, L);
        break;
    }

    // Nitro exhaust flames
    if (nitroActive) {
      this.renderNitroFlames(ctx, W, L);
    }

    // Taillights & Headlights (all suitable cars except F1)
    const isF1 = slug.startsWith('f1-') || slug === 'mclaren-mp45' || slug === 'f1-2025-concept';
    if (!isF1) {
      this.renderLights(ctx, W, L, lightsOn, brakeActive);
    }

    ctx.restore();
  },

  drawWheels(ctx, W, L, steerAngle) {
    const wheelW = 9;
    const wheelL = 20;
    const frontY = -L/2 + 22;
    const rearY = L/2 - 22;
    const trackX = W/2 - 2;

    const renderSingleWheel = (x, y, angle) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      // Tire rubber
      ctx.fillStyle = '#1a1a1e';
      ctx.beginPath();
      ctx.roundRect(-wheelW/2, -wheelL/2, wheelW, wheelL, 4);
      ctx.fill();
      // Wheel rim (alloy / bronze)
      ctx.fillStyle = '#444955';
      ctx.fillRect(-wheelW/4, -wheelL/3, wheelW/2, wheelL * 0.66);
      // Brake caliper accent
      ctx.fillStyle = '#ff2a5f';
      ctx.fillRect(wheelW/4 - 1, -4, 2, 8);
      ctx.restore();
    };

    // Front Wheels (steered)
    renderSingleWheel(-trackX, frontY, steerAngle);
    renderSingleWheel(trackX, frontY, steerAngle);

    // Rear Wheels (fixed)
    renderSingleWheel(-trackX, rearY, 0);
    renderSingleWheel(trackX, rearY, 0);
  },

  /** 1. Nissan GT-R Nismo (R35) */
  renderNissanGTR(ctx, color, W, L) {
    // Muscular body silhouette
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-W/2 + 5, -L/2 + 10);
    ctx.quadraticCurveTo(-W/2 + 2, -L/2 + 2, 0, -L/2);
    ctx.quadraticCurveTo(W/2 - 2, -L/2 + 2, W/2 - 5, -L/2 + 10);
    ctx.lineTo(W/2 - 2, -L/2 + 35); // Front flare
    ctx.lineTo(W/2 - 5, 5);          // Door waist
    ctx.lineTo(W/2 - 1, L/2 - 25);  // Wide rear quarter
    ctx.lineTo(W/2 - 3, L/2 - 4);
    ctx.quadraticCurveTo(0, L/2, -W/2 + 3, L/2 - 4);
    ctx.lineTo(-W/2 + 1, L/2 - 25);
    ctx.lineTo(-W/2 + 5, 5);
    ctx.lineTo(-W/2 + 2, -L/2 + 35);
    ctx.closePath();
    ctx.fill();

    // Carbon fiber side sills with signature Nismo red stripe
    ctx.strokeStyle = '#d90429';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-W/2 + 3, -L/2 + 8);
    ctx.lineTo(-W/2 + 3, L/2 - 6);
    ctx.moveTo(W/2 - 3, -L/2 + 8);
    ctx.lineTo(W/2 - 3, L/2 - 6);
    ctx.stroke();

    // Dark tinted greenhouse & windshield
    this.renderCockpit(ctx, W, L, {
      frontW: 30, rearW: 26, frontY: -18, rearY: 20,
      roofW: 24, roofL: 28, roofY: 0
    });

    // Hood NACA cooling ducts
    ctx.fillStyle = '#1e2129';
    ctx.beginPath();
    ctx.moveTo(-8, -L/2 + 20); ctx.lineTo(-4, -L/2 + 14); ctx.lineTo(-12, -L/2 + 14); ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, -L/2 + 20); ctx.lineTo(4, -L/2 + 14); ctx.lineTo(12, -L/2 + 14); ctx.closePath();
    ctx.fill();

    // GT-R Carbon Rear Wing
    ctx.fillStyle = '#11141a';
    ctx.beginPath();
    ctx.roundRect(-W/2 + 2, L/2 - 12, W - 4, 7, 2);
    ctx.fill();
    ctx.fillStyle = '#d90429';
    ctx.fillRect(-W/2 + 1, L/2 - 12, 3, 7);
    ctx.fillRect(W/2 - 4, L/2 - 12, 3, 7);

    // Iconic quad round GT-R taillights
    ctx.fillStyle = '#e60026';
    ctx.beginPath();
    ctx.arc(-13, L/2 - 3, 3, 0, Math.PI * 2);
    ctx.arc(-6, L/2 - 3, 3.5, 0, Math.PI * 2);
    ctx.arc(6, L/2 - 3, 3.5, 0, Math.PI * 2);
    ctx.arc(13, L/2 - 3, 3, 0, Math.PI * 2);
    ctx.fill();
  },

  /** 2. Porsche 911 GT3 RS (992) */
  renderPorsche911GT3RS(ctx, color, W, L) {
    // Classic aerodynamic teardrop silhouette with aggressive aero
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-W/2 + 8, -L/2 + 6);
    ctx.quadraticCurveTo(0, -L/2 - 2, W/2 - 8, -L/2 + 6);
    ctx.quadraticCurveTo(W/2 - 1, -L/2 + 24, W/2 - 5, -5);
    ctx.quadraticCurveTo(W/2 + 2, L/2 - 30, W/2 - 2, L/2 - 8); // Wide flared rear hips
    ctx.quadraticCurveTo(0, L/2 + 2, -W/2 + 2, L/2 - 8);
    ctx.quadraticCurveTo(-W/2 - 2, L/2 - 30, -W/2 + 5, -5);
    ctx.quadraticCurveTo(-W/2 + 1, -L/2 + 24, -W/2 + 8, -L/2 + 6);
    ctx.closePath();
    ctx.fill();

    // Hood dual nostrils (radiator air extraction)
    ctx.fillStyle = '#12151b';
    ctx.beginPath();
    ctx.roundRect(-10, -L/2 + 15, 8, 14, 2);
    ctx.roundRect(2, -L/2 + 15, 8, 14, 2);
    ctx.fill();

    // Fender louvers (GT3 RS carbon air blades)
    ctx.strokeStyle = '#12151b';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-W/2 + 5, -L/2 + 24 + i*3); ctx.lineTo(-W/2 + 12, -L/2 + 26 + i*3);
      ctx.moveTo(W/2 - 5, -L/2 + 24 + i*3); ctx.lineTo(W/2 - 12, -L/2 + 26 + i*3);
      ctx.stroke();
    }

    // Teardrop Cockpit & carbon roof with aerodynamic double bubbles
    this.renderCockpit(ctx, W, L, {
      frontW: 28, rearW: 22, frontY: -16, rearY: 18,
      roofW: 22, roofL: 26, roofY: 0
    });

    // Swan-neck GT3 RS Rear Wing (large high-downforce top mounted wing)
    ctx.fillStyle = '#0e1117';
    ctx.beginPath();
    ctx.roundRect(-W/2 - 1, L/2 - 14, W + 2, 9, 3);
    ctx.fill();
    // Wing endplates in body color
    ctx.fillStyle = color;
    ctx.fillRect(-W/2 - 2, L/2 - 16, 4, 13);
    ctx.fillRect(W/2 - 2, L/2 - 16, 4, 13);
    // Center swan neck carbon struts
    ctx.fillStyle = '#222733';
    ctx.fillRect(-5, L/2 - 22, 3, 10);
    ctx.fillRect(2, L/2 - 22, 3, 10);

    // Continuous 911 rear LED lightbar
    ctx.strokeStyle = '#ff0033';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-16, L/2 - 5);
    ctx.lineTo(16, L/2 - 5);
    ctx.stroke();
  },

  /** 3. Ferrari SF90 Stradale */
  renderFerrariSF90(ctx, color, W, L) {
    // Sharp wedge nose, low aggressive cockpit
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -L/2 - 3); // Pointy F1 nose
    ctx.lineTo(W/2 - 6, -L/2 + 10);
    ctx.lineTo(W/2 - 2, -L/2 + 32);
    ctx.lineTo(W/2 - 6, 8); // Aggressive waist
    ctx.lineTo(W/2 - 1, L/2 - 18);
    ctx.lineTo(W/2 - 4, L/2 - 4);
    ctx.lineTo(-W/2 + 4, L/2 - 4);
    ctx.lineTo(-W/2 + 1, L/2 - 18);
    ctx.lineTo(-W/2 + 6, 8);
    ctx.lineTo(-W/2 + 2, -L/2 + 32);
    ctx.lineTo(-W/2 + 6, -L/2 + 10);
    ctx.closePath();
    ctx.fill();

    // Contrasting Black Cockpit / Canopy
    ctx.fillStyle = '#0d0f14';
    ctx.beginPath();
    ctx.moveTo(-14, -20);
    ctx.lineTo(14, -20);
    ctx.quadraticCurveTo(16, 5, 12, 22);
    ctx.lineTo(-12, 22);
    ctx.quadraticCurveTo(-16, 5, -14, -20);
    ctx.fill();

    // Glass windshield & side windows
    ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.beginPath();
    ctx.moveTo(-12, -18);
    ctx.lineTo(12, -18);
    ctx.lineTo(13, -4);
    ctx.lineTo(-13, -4);
    ctx.fill();

    // Engine bay glass showcasing Ferrari V8
    ctx.fillStyle = 'rgba(255, 42, 95, 0.15)';
    ctx.fillRect(-7, 6, 14, 14);
    ctx.strokeStyle = '#d90429';
    ctx.strokeRect(-5, 8, 10, 10);

    // High twin center exhaust pipes
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(-4, L/2 - 5, 2.5, 0, Math.PI * 2);
    ctx.arc(4, L/2 - 5, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Horizontal matrix taillights
    ctx.fillStyle = '#ff1a40';
    ctx.fillRect(-17, L/2 - 6, 9, 3);
    ctx.fillRect(8, L/2 - 6, 9, 3);
  },

  /** 4. Lamborghini Huracán STO */
  renderLamborghiniSTO(ctx, color, W, L) {
    // Angular sharp hexagonal supercar design
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -L/2 - 2);
    ctx.lineTo(W/2 - 4, -L/2 + 12);
    ctx.lineTo(W/2 - 1, -L/2 + 34);
    ctx.lineTo(W/2 - 6, 6);
    ctx.lineTo(W/2 - 1, L/2 - 22);
    ctx.lineTo(W/2 - 3, L/2 - 6);
    ctx.lineTo(-W/2 + 3, L/2 - 6);
    ctx.lineTo(-W/2 + 1, L/2 - 22);
    ctx.lineTo(-W/2 + 6, 6);
    ctx.lineTo(-W/2 + 1, -L/2 + 34);
    ctx.lineTo(-W/2 + 4, -L/2 + 12);
    ctx.closePath();
    ctx.fill();

    // Contrast STO Orange / Blu racing livery stripes
    ctx.fillStyle = '#ff5400';
    ctx.beginPath();
    ctx.moveTo(-4, -L/2);
    ctx.lineTo(4, -L/2);
    ctx.lineTo(6, -L/2 + 25);
    ctx.lineTo(-6, -L/2 + 25);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    this.renderCockpit(ctx, W, L, {
      frontW: 28, rearW: 24, frontY: -16, rearY: 18,
      roofW: 20, roofL: 24, roofY: 0
    });

    // STO Roof Air Snorkel
    ctx.fillStyle = '#11141a';
    ctx.beginPath();
    ctx.roundRect(-4, -12, 8, 12, 3);
    ctx.fill();

    // Shark Fin running to rear wing
    ctx.fillStyle = '#ff5400';
    ctx.fillRect(-1.5, 0, 3, 26);

    // Massive STO Super Trofeo carbon rear wing with 3D endplates
    ctx.fillStyle = '#0f1218';
    ctx.beginPath();
    ctx.roundRect(-W/2, L/2 - 16, W, 8, 2);
    ctx.fill();
    ctx.fillStyle = '#ff5400';
    ctx.fillRect(-W/2 - 2, L/2 - 18, 3, 12);
    ctx.fillRect(W/2 - 1, L/2 - 18, 3, 12);

    // Y-shaped Lamborghini taillights
    ctx.strokeStyle = '#ff1e40';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-16, L/2 - 7); ctx.lineTo(-11, L/2 - 7); ctx.lineTo(-7, L/2 - 5);
    ctx.moveTo(16, L/2 - 7); ctx.lineTo(11, L/2 - 7); ctx.lineTo(7, L/2 - 5);
    ctx.stroke();
  },

  /** 5. McLaren 765LT */
  renderMcLaren765LT(ctx, color, W, L) {
    // Flowing lightweight Longtail carbon body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-W/2 + 7, -L/2 + 8);
    ctx.quadraticCurveTo(0, -L/2 - 2, W/2 - 7, -L/2 + 8);
    ctx.lineTo(W/2 - 2, -L/2 + 30);
    ctx.lineTo(W/2 - 7, 4);
    ctx.lineTo(W/2 - 1, L/2 - 16);
    ctx.lineTo(W/2 - 4, L/2 + 2); // Extended longtail
    ctx.lineTo(-W/2 + 4, L/2 + 2);
    ctx.lineTo(-W/2 + 1, L/2 - 16);
    ctx.lineTo(-W/2 + 7, 4);
    ctx.lineTo(-W/2 + 2, -L/2 + 30);
    ctx.closePath();
    ctx.fill();

    // Deep eye-socket headlights (McLaren design trademark)
    ctx.fillStyle = '#0b0d12';
    ctx.beginPath();
    ctx.ellipse(-14, -L/2 + 14, 5, 7, -0.2, 0, Math.PI * 2);
    ctx.ellipse(14, -L/2 + 14, 5, 7, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Glass teardrop cockpit
    this.renderCockpit(ctx, W, L, {
      frontW: 28, rearW: 22, frontY: -16, rearY: 18,
      roofW: 22, roofL: 26, roofY: 0
    });

    // Active Longtail rear wing & Quad titanium round exhaust tips
    ctx.fillStyle = '#111419';
    ctx.beginPath();
    ctx.roundRect(-W/2 + 2, L/2 - 12, W - 4, 8, 2);
    ctx.fill();

    // Quad round titanium exhaust tips
    ctx.fillStyle = '#00f0ff';
    for (let i = -3; i <= 3; i += 2) {
      ctx.beginPath();
      ctx.arc(i * 3.2, L/2 - 4, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  /** 6. Bugatti Chiron Super Sport */
  renderBugattiChironSS(ctx, color, W, L) {
    // Streamlined aerodynamic missile, elongated longtail rear
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-10, -L/2 + 4);
    ctx.lineTo(0, -L/2 - 3); // Bugatti horseshoe front
    ctx.lineTo(10, -L/2 + 4);
    ctx.lineTo(W/2 - 3, -L/2 + 18);
    ctx.lineTo(W/2 - 1, -L/2 + 40);
    ctx.lineTo(W/2 - 4, 8);
    ctx.lineTo(W/2 - 2, L/2 - 16);
    ctx.lineTo(W/2 - 5, L/2 + 8); // Extended 300+ mph longtail
    ctx.lineTo(-W/2 + 5, L/2 + 8);
    ctx.lineTo(-W/2 + 2, L/2 - 16);
    ctx.lineTo(-W/2 + 4, 8);
    ctx.lineTo(-W/2 + 1, -L/2 + 40);
    ctx.lineTo(-W/2 + 3, -L/2 + 18);
    ctx.closePath();
    ctx.fill();

    // Iconic Bugatti "C-Line" side swoosh in bright French blue
    ctx.strokeStyle = '#00a8ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(-10, 0, 16, Math.PI * 0.5, Math.PI * 1.5, true);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(10, 0, 16, Math.PI * 0.5, Math.PI * 1.5, false);
    ctx.stroke();

    // Center Bugatti Horseshoe grille
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(0, -L/2 + 3, 5, Math.PI, 0, false);
    ctx.fill();
    ctx.strokeStyle = '#e63946'; // Red Bugatti EB badge
    ctx.strokeRect(-2, -L/2 + 4, 4, 2);

    // Quad matrix LED front lights
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(-18, -L/2 + 12, 7, 2.5);
    ctx.fillRect(11, -L/2 + 12, 7, 2.5);

    // Cockpit
    this.renderCockpit(ctx, W, L, {
      frontW: 30, rearW: 24, frontY: -16, rearY: 18,
      roofW: 24, roofL: 26, roofY: 0
    });

    // Massive 8.0L W16 engine cover louvers
    ctx.fillStyle = '#181b22';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(-8, 14 + i * 4, 16, 2);
    }

    // Full-width continuous horizon rear light bar
    ctx.strokeStyle = '#ff0033';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-18, L/2 + 3);
    ctx.lineTo(18, L/2 + 3);
    ctx.stroke();

    // Vertically stacked twin exhausts on each side
    ctx.fillStyle = '#222';
    ctx.fillRect(-7, L/2 + 4, 3, 4);
    ctx.fillRect(4, L/2 + 4, 3, 4);
  },

  /** Shared Cockpit renderer */
  renderCockpit(ctx, W, L, cfg) {
    // Tinted windshield & side windows
    ctx.fillStyle = 'rgba(12, 16, 24, 0.9)';
    ctx.beginPath();
    ctx.moveTo(-cfg.frontW/2, cfg.frontY);
    ctx.lineTo(cfg.frontW/2, cfg.frontY);
    ctx.lineTo(cfg.rearW/2, cfg.rearY);
    ctx.lineTo(-cfg.rearW/2, cfg.rearY);
    ctx.closePath();
    ctx.fill();

    // Glass reflection highlight
    ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(-cfg.frontW/2 + 3, cfg.frontY + 2);
    ctx.lineTo(cfg.frontW/2 - 3, cfg.frontY + 2);
    ctx.lineTo(cfg.frontW/2 - 5, cfg.frontY + 8);
    ctx.lineTo(-cfg.frontW/2 + 5, cfg.frontY + 8);
    ctx.closePath();
    ctx.fill();

    // Solid roof panel
    ctx.fillStyle = '#090b10';
    ctx.beginPath();
    ctx.roundRect(-cfg.roofW/2, cfg.roofY - cfg.roofL/4, cfg.roofW, cfg.roofL * 0.75, 4);
    ctx.fill();
  },

  /** Dynamic Nitro flames coming from exhaust */
  renderNitroFlames(ctx, W, L) {
    const flameL = 20 + Math.random() * 14;
    const flameW = 6;

    ctx.save();
    // Cyan & Electric Blue Jet Core
    const grad = ctx.createLinearGradient(0, L/2, 0, L/2 + flameL);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.2, '#00f0ff');
    grad.addColorStop(0.7, '#0044ff');
    grad.addColorStop(1, 'rgba(0, 30, 255, 0)');

    ctx.fillStyle = grad;

    // Dual exhaust flame tongues
    ctx.beginPath();
    ctx.moveTo(-9 - flameW/2, L/2);
    ctx.lineTo(-9, L/2 + flameL);
    ctx.lineTo(-9 + flameW/2, L/2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(9 - flameW/2, L/2);
    ctx.lineTo(9, L/2 + flameL);
    ctx.lineTo(9 + flameW/2, L/2);
    ctx.fill();

    ctx.restore();
  },

  /** Realistic Headlights & Lit-up Taillights Glow */
  renderLights(ctx, W, L, lightsOn, brakeActive) {
    if (lightsOn) {
      // Headlights glow cones casting forward onto the asphalt
      ctx.save();
      const headGradLeft = ctx.createRadialGradient(-14, -L/2 - 10, 2, -14, -L/2 - 40, 50);
      headGradLeft.addColorStop(0, 'rgba(230, 245, 255, 0.55)');
      headGradLeft.addColorStop(1, 'rgba(230, 245, 255, 0)');

      ctx.fillStyle = headGradLeft;
      ctx.beginPath();
      ctx.moveTo(-16, -L/2);
      ctx.lineTo(-32, -L/2 - 80);
      ctx.lineTo(0, -L/2 - 80);
      ctx.closePath();
      ctx.fill();

      const headGradRight = ctx.createRadialGradient(14, -L/2 - 10, 2, 14, -L/2 - 40, 50);
      headGradRight.addColorStop(0, 'rgba(230, 245, 255, 0.55)');
      headGradRight.addColorStop(1, 'rgba(230, 245, 255, 0)');

      ctx.fillStyle = headGradRight;
      ctx.beginPath();
      ctx.moveTo(16, -L/2);
      ctx.lineTo(32, -L/2 - 80);
      ctx.lineTo(0, -L/2 - 80);
      ctx.closePath();
      ctx.fill();

      // Front Headlight lens glow dots
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#d0eeff';
      ctx.shadowBlur = 8;
      ctx.fillRect(-17, -L/2, 6, 3);
      ctx.fillRect(11, -L/2, 6, 3);

      // Lit-up Rear Taillights (active running lights; flares upon braking)
      ctx.shadowColor = brakeActive ? '#ff003b' : '#cc0022';
      ctx.shadowBlur = brakeActive ? 18 : 8;
      ctx.fillStyle = brakeActive ? '#ff1a4b' : '#dd0828';
      ctx.fillRect(-W/2 + 6, L/2 - 3, W - 12, 4);

      ctx.restore();
    }
  }
};
