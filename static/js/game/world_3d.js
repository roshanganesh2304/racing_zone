/**
 * RACING ZONE - Real-Life GTA Series Cities & 3D World Engine (Three.js)
 * Los Santos, Vice City, Liberty City, Las Venturas, and Blaine County
 */

class World3D {
  constructor(scene) {
    this.scene = scene;
    this.biome = 'los_santos';
    this.timeOfDay = 'sunset';

    // Groups
    this.environmentGroup = new THREE.Group();
    this.scene.add(this.environmentGroup);

    this.checkpoints3D = [];
    this.snowParticles = null;
    this.animatedObjects = [];
    this.buildingColliders = [];

    // Lighting nodes
    this.sunLight = null;
    this.ambientLight = null;
    this.hemiLight = null;
  }

  isNearTrack(x, z, trackDef, minDistance = 55) {
    if (this.denseTrackPoints && this.denseTrackPoints.length > 0) {
      for (let i = 0; i < this.denseTrackPoints.length; i++) {
        const p1 = this.denseTrackPoints[i];
        const p2 = this.denseTrackPoints[(i + 1) % this.denseTrackPoints.length];
        const dx = p2.x - p1.x;
        const dz = p2.z - p1.z;
        const l2 = dx * dx + dz * dz;
        let dist;
        if (l2 < 0.0001) {
          dist = Math.hypot(x - p1.x, z - p1.z);
        } else {
          let t = ((x - p1.x) * dx + (z - p1.z) * dz) / l2;
          t = Math.max(0, Math.min(1, t));
          dist = Math.hypot(x - (p1.x + t * dx), z - (p1.z + t * dz));
        }
        if (dist < minDistance) return true;
      }
      return false;
    }

    if (!trackDef || !trackDef.waypoints || trackDef.waypoints.length === 0) return false;
    const wps = trackDef.waypoints;
    for (let i = 0; i < wps.length; i++) {
      const p1 = wps[i];
      const p2 = wps[(i + 1) % wps.length];
      const p1z = (p1.z !== undefined) ? p1.z : p1.y;
      const p2z = (p2.z !== undefined) ? p2.z : p2.y;

      const dx = p2.x - p1.x;
      const dz = p2z - p1z;
      const l2 = dx * dx + dz * dz;
      if (l2 < 0.001) continue;

      let t = ((x - p1.x) * dx + (z - p1z) * dz) / l2;
      t = Math.max(0, Math.min(1, t));
      const projX = p1.x + t * dx;
      const projZ = p1z + t * dz;
      const dist = Math.hypot(x - projX, z - projZ);
      if (dist < minDistance) return true;
    }
    return false;
  }

  setupTimeOfDay(timeOfDay = 'sunset', biome = 'los_santos') {
    this.timeOfDay = timeOfDay;
    this.biome = biome;

    if (this.sunLight) this.scene.remove(this.sunLight);
    if (this.ambientLight) this.scene.remove(this.ambientLight);
    if (this.hemiLight) this.scene.remove(this.hemiLight);

    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x141824, 0.75);
    this.scene.add(this.hemiLight);

    if (timeOfDay === 'day') {
      // Bright crisp daylight
      if (biome === 'vice_city') {
        // Tropical Miami sunshine & cyan sky
        this.scene.background = new THREE.Color(0x48cae4);
        this.scene.fog = new THREE.FogExp2(0x90e0ef, 0.0016);
        this.ambientLight = new THREE.AmbientLight(0xe0f7fa, 0.95);
        this.sunLight = new THREE.DirectionalLight(0xfffdf0, 1.9);
      } else if (biome === 'blaine_county') {
        // Baking California desert sun
        this.scene.background = new THREE.Color(0x8ecae6);
        this.scene.fog = new THREE.FogExp2(0xdfb086, 0.0018);
        this.ambientLight = new THREE.AmbientLight(0xffebd8, 0.95);
        this.sunLight = new THREE.DirectionalLight(0xfff5c0, 2.1);
      } else if (biome === 'liberty_city') {
        // Steel-blue overcast East Coast
        this.scene.background = new THREE.Color(0x78909c);
        this.scene.fog = new THREE.FogExp2(0x90a4ae, 0.002);
        this.ambientLight = new THREE.AmbientLight(0xcfd8dc, 0.9);
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.7);
      } else {
        // Los Santos / Las Venturas sunny California
        this.scene.background = new THREE.Color(0x56a0d3);
        this.scene.fog = new THREE.FogExp2(0x8bc34a, 0.0012);
        this.ambientLight = new THREE.AmbientLight(0xf1f8e9, 0.9);
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.85);
      }
      this.sunLight.position.set(160, 360, 140);

    } else if (timeOfDay === 'sunset') {
      // Iconic GTA California Golden Hour & Vice City Magenta Sunset
      if (biome === 'vice_city') {
        // Tropical Vice City Synthwave Sunset (Magenta & Cyan)
        this.scene.background = new THREE.Color(0x3a0ca3);
        this.scene.fog = new THREE.FogExp2(0x7209b7, 0.0028);
        this.ambientLight = new THREE.AmbientLight(0xb5179e, 1.05);
        this.sunLight = new THREE.DirectionalLight(0xf72585, 2.3);
      } else if (biome === 'blaine_county') {
        // Copper / Crimson desert dust twilight
        this.scene.background = new THREE.Color(0x3d1a12);
        this.scene.fog = new THREE.FogExp2(0x6b2d1c, 0.0026);
        this.ambientLight = new THREE.AmbientLight(0x8a3818, 0.95);
        this.sunLight = new THREE.DirectionalLight(0xff6b35, 2.4);
      } else {
        // Los Santos Vinewood Golden Hour
        this.scene.background = new THREE.Color(0x2d132c);
        this.scene.fog = new THREE.FogExp2(0x561e38, 0.0024);
        this.ambientLight = new THREE.AmbientLight(0x80224b, 0.95);
        this.sunLight = new THREE.DirectionalLight(0xff7b00, 2.4);
      }
      this.sunLight.position.set(300, 110, -220); // Low sunset angle

    } else {
      // Night (GTA Neon Atmosphere)
      if (biome === 'vice_city') {
        // Vice City Neon Night (Midnight Blue with Magenta Neon haze)
        this.scene.background = new THREE.Color(0x08071a);
        this.scene.fog = new THREE.FogExp2(0x130e2e, 0.0032);
        this.ambientLight = new THREE.AmbientLight(0x3d205a, 0.75);
        this.sunLight = new THREE.DirectionalLight(0x00f0ff, 1.1);
      } else if (biome === 'las_venturas') {
        // Inky black desert night contrasting dazzling casino strip
        this.scene.background = new THREE.Color(0x05060b);
        this.scene.fog = new THREE.FogExp2(0x0b0d18, 0.0028);
        this.ambientLight = new THREE.AmbientLight(0x382845, 0.7);
        this.sunLight = new THREE.DirectionalLight(0xffb703, 1.15);
      } else if (biome === 'blaine_county') {
        // Clear Starry Desert Night with Moonlight
        this.scene.background = new THREE.Color(0x060913);
        this.scene.fog = new THREE.FogExp2(0x0a101f, 0.0025);
        this.ambientLight = new THREE.AmbientLight(0x1b2838, 0.6);
        this.sunLight = new THREE.DirectionalLight(0x8da4c4, 0.95);
      } else {
        // Los Santos / Liberty City Urban Skyline Night
        this.scene.background = new THREE.Color(0x080912);
        this.scene.fog = new THREE.FogExp2(0x0b0e1b, 0.0032);
        this.ambientLight = new THREE.AmbientLight(0x232d42, 0.65);
        this.sunLight = new THREE.DirectionalLight(0x8aa8d0, 1.1);
      }
      this.sunLight.position.set(180, 290, 140);
    }

    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.bias = -0.0003;
    this.sunLight.shadow.normalBias = 0.035;
    this.sunLight.shadow.radius = 1.5;
    const d = 260;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.camera.near = 20;
    this.sunLight.shadow.camera.far = 850;

    this.sunLightOffset = this.sunLight.position.clone();

    this.scene.add(this.ambientLight);
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);
  }

  updateShadowFocus(targetPos) {
    if (!this.sunLight || !targetPos) return;
    const offset = this.sunLightOffset || new THREE.Vector3(180, 290, 140);
    this.sunLight.position.set(
      targetPos.x + offset.x,
      targetPos.y + offset.y,
      targetPos.z + offset.z
    );
    this.sunLight.target.position.set(targetPos.x, targetPos.y, targetPos.z);
    this.sunLight.target.updateMatrixWorld();
  }

  buildTrackWorld(trackDef, timeOfDay = null) {
    while (this.environmentGroup.children.length > 0) {
      this.environmentGroup.remove(this.environmentGroup.children[0]);
    }
    this.checkpoints3D = [];
    this.animatedObjects = [];
    this.buildingColliders = [];

    const selectedTime = timeOfDay || trackDef.defaultTime || 'sunset';
    const biome = trackDef.biome || 'los_santos';
    this.setupTimeOfDay(selectedTime, biome);

    // Precalculate authentic Catmull-Rom spline curve and dense points for accurate track clearance
    const wps = trackDef.waypoints || [];
    const pts = wps.map(p => new THREE.Vector3(p.x, 0.05, (p.z !== undefined ? p.z : p.y)));
    this.trackCurve = new THREE.CatmullRomCurve3(pts, true);
    this.denseTrackPoints = this.trackCurve.getPoints(450);

    // 1. Terrain Ground
    this.buildTerrain(trackDef, biome, selectedTime);

    // 2. Road Network & Curbs
    this.buildRoadNetwork(trackDef, biome);

    // 3. Iconic GTA City Landmarks & Biome Scenery
    if (biome === 'monza_f1' || trackDef.slug === 'monza-f1') {
      this.buildMonzaScenery(trackDef, selectedTime);
    } else if (biome === 'vice_city' || trackDef.slug === 'vice-city') {
      this.buildViceCityScenery(trackDef, selectedTime);
    } else if (biome === 'liberty_city' || trackDef.slug === 'liberty-city') {
      this.buildLibertyCityScenery(trackDef, selectedTime);
    } else if (biome === 'las_venturas' || trackDef.slug === 'las-venturas') {
      this.buildLasVenturasScenery(trackDef, selectedTime);
    } else if (biome === 'blaine_county' || trackDef.slug === 'blaine-county') {
      this.buildBlaineCountyScenery(trackDef, selectedTime);
    } else {
      // Default: Los Santos (Vinewood & Downtown)
      this.buildLosSantosScenery(trackDef, selectedTime);
    }

    // 4. Checkpoint Gates
    this.buildCheckpointGates(trackDef);
  }

  buildTerrain(trackDef, biome, timeOfDay) {
    const terrainGeo = new THREE.PlaneGeometry(4200, 4200, 48, 48);

    let terrainColor = trackDef.terrainColor || 0x18201a;
    let roughness = 0.9;

    if (biome === 'monza_f1') {
      terrainColor = 0x16341c; // Royal Monza park lush grass
      roughness = 0.88;
    } else if (biome === 'vice_city') {
      terrainColor = 0x0f2b46; // Ocean turquoise
      roughness = 0.3;
    } else if (biome === 'blaine_county') {
      terrainColor = (timeOfDay === 'sunset') ? 0xb55428 : 0xd88a58; // Red rock desert
    } else if (biome === 'las_venturas') {
      terrainColor = 0x140e10; // Dark casino asphalt/sand
    } else if (biome === 'liberty_city') {
      terrainColor = 0x0a0c10; // Dark gritty Manhattan pavement
    }

    const terrainMat = new THREE.MeshStandardMaterial({
      color: terrainColor,
      roughness: roughness,
      metalness: 0.1
    });

    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -0.05;
    terrain.receiveShadow = true;
    this.environmentGroup.add(terrain);
  }

  createTrackRibbonGeometry(curve, segments = 320, halfWidth = 18, heightY = 0.035) {
    const geo = new THREE.BufferGeometry();
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) % 1.0;
      const pt = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);

      // In XZ plane, 2D perpendicular normal to (tangent.x, tangent.z) is (-tangent.z, tangent.x)
      let nx = -tangent.z;
      let nz = tangent.x;
      const len = Math.hypot(nx, nz) || 1;
      nx /= len;
      nz /= len;

      // Left vertex
      positions.push(pt.x + nx * halfWidth, heightY, pt.z + nz * halfWidth);
      normals.push(0, 1, 0);
      uvs.push(0, (i / segments) * 60);

      // Right vertex
      positions.push(pt.x - nx * halfWidth, heightY, pt.z - nz * halfWidth);
      normals.push(0, 1, 0);
      uvs.push(1, (i / segments) * 60);

      if (i < segments) {
        const v0 = i * 2;
        const v1 = i * 2 + 1;
        const v2 = (i + 1) * 2;
        const v3 = (i + 1) * 2 + 1;

        // Front-facing quad with upward normal (0, 1, 0)
        indices.push(v0, v1, v2);
        indices.push(v1, v3, v2);
      }
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    return geo;
  }

  buildRoadNetwork(trackDef, biome) {
    const wps = trackDef.waypoints;
    const roadW = trackDef.isF1Track ? (trackDef.roadWidth || 32) : Math.max(36, trackDef.roadWidth || 36);

    const points = wps.map(p => new THREE.Vector3(p.x, 0.05, (p.z !== undefined ? p.z : p.y)));
    const curve = this.trackCurve || new THREE.CatmullRomCurve3(points, true);
    this.trackCurve = curve;

    // 1. High-Grade Interstate Asphalt (Pristine, non-intersecting upward ribbon geometry)
    const roadMat = new THREE.MeshStandardMaterial({
      color: trackDef.surfaceColor || 0x181c24,
      roughness: 0.82,
      metalness: 0.18
    });

    const roadGeo = this.createTrackRibbonGeometry(curve, 320, roadW / 2, 0.035);
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    this.environmentGroup.add(roadMesh);

    // 2. Concrete Shoulder Curbs / Outer Barriers
    const curbGeo = this.createTrackRibbonGeometry(curve, 320, roadW / 2 + 1.2, 0.025);
    const curbMat = new THREE.MeshStandardMaterial({
      color: 0x4a505c, // Concrete grey shoulder
      roughness: 0.9
    });
    const curbMesh = new THREE.Mesh(curbGeo, curbMat);
    this.environmentGroup.add(curbMesh);

    // 3. Road Markings & Infrastructure
    if (!trackDef.isF1Track) {
      this.buildHighwayLaneStripes(curve, roadW);
      this.buildOverheadHighwayGantries(trackDef, points, curve, roadW);
      this.buildHighwayOverpassBridges(points, curve, roadW);
    } else {
      this.buildF1CircuitTrackMarkings(trackDef, curve, points, roadW);
    }

    // 6. Start / Finish Line Checkered Bar in 3D
    const sf1 = points[0];
    const sf2 = points[1];
    const sfAngle = Math.atan2(sf2.x - sf1.x, sf2.z - sf1.z);
    const sfGroup = new THREE.Group();
    sfGroup.position.set((sf1.x + sf2.x)/2, 0.06, (sf1.z + sf2.z)/2);
    sfGroup.rotation.y = sfAngle + Math.PI / 2;

    const checkSize = 1.8;
    const numChecks = Math.floor(roadW / checkSize);
    for (let i = -numChecks/2; i <= numChecks/2; i++) {
      const isWhite = Math.abs(i) % 2 === 0;
      const chk = new THREE.Mesh(
        new THREE.PlaneGeometry(checkSize, 3.0),
        new THREE.MeshBasicMaterial({ color: isWhite ? 0xffffff : 0x000000 })
      );
      chk.rotation.x = -Math.PI / 2;
      chk.position.x = i * checkSize;
      sfGroup.add(chk);
    }
    this.environmentGroup.add(sfGroup);
  }

  buildHighwayLaneStripes(curve, roadW) {
    const totalSamples = 280;
    const samples = curve.getPoints(totalSamples);
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xffd600 });
    const stripeGroup = new THREE.Group();

    for (let i = 0; i < totalSamples; i++) {
      const p1 = samples[i];
      const p2 = samples[(i + 1) % totalSamples];
      const dx = p2.x - p1.x;
      const dz = p2.z - p1.z;
      const len = Math.hypot(dx, dz);
      if (len < 0.01) continue;

      const angle = Math.atan2(dx, dz);
      const nx = -Math.cos(angle);
      const nz = Math.sin(angle);
      const midX = (p1.x + p2.x) / 2;
      const midZ = (p1.z + p2.z) / 2;

      // Solid yellow shoulder lines on left & right
      const yLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.3, len), yellowMat);
      yLeft.rotation.x = -Math.PI / 2;
      yLeft.rotation.z = -angle;
      yLeft.position.set(midX + nx * 16.5, 0.05, midZ + nz * 16.5);
      stripeGroup.add(yLeft);

      const yRight = new THREE.Mesh(new THREE.PlaneGeometry(0.3, len), yellowMat);
      yRight.rotation.x = -Math.PI / 2;
      yRight.rotation.z = -angle;
      yRight.position.set(midX - nx * 16.5, 0.05, midZ - nz * 16.5);
      stripeGroup.add(yRight);

      // Dashed white lane markings at -8.2m and +8.2m (every other segment)
      if (i % 2 === 0) {
        const dLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.35, len * 0.7), whiteMat);
        dLeft.rotation.x = -Math.PI / 2;
        dLeft.rotation.z = -angle;
        dLeft.position.set(midX + nx * 8.2, 0.05, midZ + nz * 8.2);
        stripeGroup.add(dLeft);

        const dRight = new THREE.Mesh(new THREE.PlaneGeometry(0.35, len * 0.7), whiteMat);
        dRight.rotation.x = -Math.PI / 2;
        dRight.rotation.z = -angle;
        dRight.position.set(midX - nx * 8.2, 0.05, midZ - nz * 8.2);
        stripeGroup.add(dRight);
      }
    }
    this.environmentGroup.add(stripeGroup);
  }



  buildOverheadHighwayGantries(trackDef, points, curve, roadW) {
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x5a606d, metalness: 0.75, roughness: 0.35 });
    const gantryIndices = [1, 4, 7, 9].filter(idx => idx < points.length);

    const highwayCode = trackDef.highwayCode || 'CA I-10 WESTBOUND';
    const district = trackDef.district || 'DOWNTOWN / VINEWOOD';

    gantryIndices.forEach((wIdx) => {
      const p1 = points[wIdx];
      const p2 = points[(wIdx + 1) % points.length];
      const dx = p2.x - p1.x;
      const dz = p2.z - p1.z;
      const angle = Math.atan2(dx, dz);

      const gantryGroup = new THREE.Group();
      gantryGroup.position.set(p1.x, 0, p1.z);
      gantryGroup.rotation.y = angle;

      const span = roadW + 12;
      const height = 10.0;

      // Left Column
      const colL = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, height, 8), trussMat);
      colL.position.set(-span / 2, height / 2, 0);
      gantryGroup.add(colL);

      // Right Column
      const colR = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, height, 8), trussMat);
      colR.position.set(span / 2, height / 2, 0);
      gantryGroup.add(colR);

      // Overhead Horizontal Truss Beams
      const trussTop = new THREE.Mesh(new THREE.BoxGeometry(span, 0.8, 0.8), trussMat);
      trussTop.position.set(0, height - 0.4, 0);
      gantryGroup.add(trussTop);

      const trussBot = new THREE.Mesh(new THREE.BoxGeometry(span, 0.4, 0.4), trussMat);
      trussBot.position.set(0, height - 2.8, 0);
      gantryGroup.add(trussBot);

      // Hanging Highway Signs (Green Interstate Signs with Canvas Texture)
      const signTex1 = this.createHighwaySignCanvas(highwayCode, district, 'EXIT 14B', '10');
      const signMat1 = new THREE.MeshBasicMaterial({ map: signTex1 });
      const sign1 = new THREE.Mesh(new THREE.PlaneGeometry(12, 4.2), signMat1);
      sign1.position.set(-5.5, height - 1.6, 0.45);
      gantryGroup.add(sign1);

      const signTex2 = this.createHighwaySignCanvas('AIRPORT / SAN PEDRO', 'SPEED LIMIT 65', 'EXIT 15A 1 MI', '10');
      const signMat2 = new THREE.MeshBasicMaterial({ map: signTex2 });
      const sign2 = new THREE.Mesh(new THREE.PlaneGeometry(9.5, 4.2), signMat2);
      sign2.position.set(7.0, height - 1.6, 0.45);
      gantryGroup.add(sign2);

      this.environmentGroup.add(gantryGroup);
    });
  }

  createHighwaySignCanvas(mainText, subText, exitText, shieldNum) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 220;
    const ctx = canvas.getContext('2d');

    // Interstate Green background
    ctx.fillStyle = '#005f38';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // White highway sign border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Interstate Shield
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(30, 26, 60, 30);
    ctx.fillStyle = '#2980b9';
    ctx.fillRect(30, 56, 60, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(shieldNum || '10', 60, 84);

    // Main Destination Text
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.fillText(mainText, 108, 62);

    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillStyle = '#ffd600';
    ctx.fillText(subText, 108, 98);

    // Exit badge & Lane Down Arrows
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillText(exitText, 32, 160);

    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.fillText('⬇    ⬇    ⬇', 240, 185);

    return new THREE.CanvasTexture(canvas);
  }

  createSignTexture(config) {
    const canvas = document.createElement('canvas');
    canvas.width = config.width || 512;
    canvas.height = config.height || 256;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = config.bgColor || '#0b111e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Glowing border
    if (config.borderColor) {
      ctx.strokeStyle = config.borderColor;
      ctx.lineWidth = config.borderWidth || 8;
      ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);
    }

    // Top Header or Badge
    if (config.badge) {
      ctx.fillStyle = config.badgeColor || '#ffd600';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(config.badge, canvas.width / 2, 42);
    }

    // Main Title
    ctx.fillStyle = config.textColor || '#ffffff';
    ctx.font = config.font || '900 48px "Arial Black", Arial, sans-serif';
    ctx.textAlign = 'center';
    if (config.shadowColor) {
      ctx.shadowColor = config.shadowColor;
      ctx.shadowBlur = config.shadowBlur || 15;
    }
    const titleY = config.subtitle ? (config.badge ? 120 : 110) : canvas.height / 2 + 16;
    ctx.fillText(config.text, canvas.width / 2, titleY);

    // Subtitle
    if (config.subtitle) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = config.subColor || '#ffd600';
      ctx.font = config.subFont || 'bold 24px Arial, sans-serif';
      ctx.fillText(config.subtitle, canvas.width / 2, titleY + 44);
    }

    return new THREE.CanvasTexture(canvas);
  }

  createRoute68DecalTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 256, 256);

    // US Route Shield Outer Contour
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(128, 20);
    ctx.quadraticCurveTo(220, 20, 220, 110);
    ctx.quadraticCurveTo(220, 200, 128, 240);
    ctx.quadraticCurveTo(36, 200, 36, 110);
    ctx.quadraticCurveTo(36, 20, 128, 20);
    ctx.fill();

    // Dark Inner Cutout
    ctx.fillStyle = '#1c202a';
    ctx.beginPath();
    ctx.moveTo(128, 32);
    ctx.quadraticCurveTo(208, 32, 208, 110);
    ctx.quadraticCurveTo(208, 192, 128, 228);
    ctx.quadraticCurveTo(48, 192, 48, 110);
    ctx.quadraticCurveTo(48, 32, 128, 32);
    ctx.fill();

    // Stencil Text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '900 32px "Arial Black", Arial, sans-serif';
    ctx.fillText('ROUTE', 128, 80);

    ctx.font = '900 90px "Arial Black", Arial, sans-serif';
    ctx.fillText('68', 128, 180);

    return new THREE.CanvasTexture(canvas);
  }

  buildHighwayOverpassBridges(points, curve, roadW) {
    if (points.length < 5) return;
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x828894, roughness: 0.9, metalness: 0.1 });
    const railingMat = new THREE.MeshStandardMaterial({ color: 0x3d434d, metalness: 0.8 });
    const carMat1 = new THREE.MeshStandardMaterial({ color: 0xcc2222, metalness: 0.8 });
    const carMat2 = new THREE.MeshStandardMaterial({ color: 0x2266cc, metalness: 0.8 });

    const bridgeIndices = [2, 6].filter(idx => idx < points.length);

    bridgeIndices.forEach((bIdx) => {
      const p1 = points[bIdx];
      const p2 = points[(bIdx + 1) % points.length];
      const dx = p2.x - p1.x;
      const dz = p2.z - p1.z;
      const angle = Math.atan2(dx, dz);

      const bridgeGroup = new THREE.Group();
      bridgeGroup.position.set((p1.x + p2.x) / 2, 0, (p1.z + p2.z) / 2);
      bridgeGroup.rotation.y = angle + Math.PI / 2;

      const bridgeLen = roadW + 64;
      const bridgeHeight = 11.5;

      // Concrete Deck Slab
      const deck = new THREE.Mesh(new THREE.BoxGeometry(bridgeLen, 1.8, 16), bridgeMat);
      deck.position.y = bridgeHeight;
      deck.castShadow = true;
      deck.receiveShadow = true;
      bridgeGroup.add(deck);

      // Support Abutment Piers far outside Shoulders (24m clearance from road edge!)
      const pier1 = new THREE.Mesh(new THREE.BoxGeometry(3.0, bridgeHeight - 0.9, 5.0), bridgeMat);
      pier1.position.set(-roadW / 2 - 24.0, (bridgeHeight - 0.9) / 2, 0);
      bridgeGroup.add(pier1);

      const pier2 = new THREE.Mesh(new THREE.BoxGeometry(3.0, bridgeHeight - 0.9, 5.0), bridgeMat);
      pier2.position.set(roadW / 2 + 24.0, (bridgeHeight - 0.9) / 2, 0);
      bridgeGroup.add(pier2);

      // Side Safety Parapets / Railings
      const railFront = new THREE.Mesh(new THREE.BoxGeometry(bridgeLen, 1.2, 0.4), railingMat);
      railFront.position.set(0, bridgeHeight + 1.4, 7.8);
      bridgeGroup.add(railFront);

      const railBack = new THREE.Mesh(new THREE.BoxGeometry(bridgeLen, 1.2, 0.4), railingMat);
      railBack.position.set(0, bridgeHeight + 1.4, -7.8);
      bridgeGroup.add(railBack);

      // Overpass Traffic Cars passing across!
      const traffic1 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.4, 2.0), carMat1);
      traffic1.position.set(-8, bridgeHeight + 1.6, 3.5);
      bridgeGroup.add(traffic1);

      const traffic2 = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.6, 2.2), carMat2);
      traffic2.position.set(12, bridgeHeight + 1.7, -3.5);
      bridgeGroup.add(traffic2);

      this.environmentGroup.add(bridgeGroup);
    });
  }

  /* --------------------------------------------------------------------------
     GTA CITY 1: LOS SANTOS (Los Angeles)
     Landmarks: 3D VINEWOOD Sign, Maze Bank Tower, Del Perro Ferris Wheel, Palms
     -------------------------------------------------------------------------- */
  buildLosSantosScenery(trackDef, timeOfDay) {
    const isNight = (timeOfDay === 'night');
    const isSunset = (timeOfDay === 'sunset');

    // 1. Giant 3D "VINEWOOD" Hillside Sign
    this.buildVinewoodSign(-290, 48, -360);

    // 2. Downtown Icon: Maze Bank Tower (210m tall cylindrical skyscraper)
    this.buildMazeBankTower(160, 0, -180);

    // 3. Del Perro Pier & 3D Rotating Ferris Wheel (Placed 85m safely on the ocean beachside)
    this.buildDelPerroPierAndFerrisWheel(485, 0, 30);

    // 4. Downtown Los Santos Skyscraper Skyline
    const towerMatDark = new THREE.MeshStandardMaterial({ color: 0x181c28, roughness: 0.35, metalness: 0.6 });
    const towerMatGlass = new THREE.MeshStandardMaterial({ color: 0x223048, roughness: 0.15, metalness: 0.85 });
    const neonCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const neonGold = new THREE.MeshBasicMaterial({ color: 0xffd600 });
    const neonRed = new THREE.MeshBasicMaterial({ color: 0xff0055 });

    const gtaBrands = ['SPRUNK', 'eCOLA', 'FLYUS', 'MAZE BANK', 'WEAZEL NEWS', 'AMMU-NATION'];

    for (let i = 0; i < 48; i++) {
      const angle = (i / 48) * Math.PI * 2;
      const rad = 250 + (i % 4) * 85;
      const bx = Math.cos(angle) * rad + (Math.random() - 0.5) * 50;
      const bz = Math.sin(angle) * rad + (Math.random() - 0.5) * 50;

      const bw = 28 + Math.random() * 32;
      const bd = 28 + Math.random() * 32;
      const bh = 55 + Math.random() * 125;
      const bRadius = Math.hypot(bw / 2, bd / 2);
      const reqDist = (trackDef.roadWidth || 28) / 2 + bRadius + 30;

      // Skip areas reserved for landmarks
      if (Math.hypot(bx - 160, bz - (-180)) < 70) continue;
      if (Math.hypot(bx - (-290), bz - (-360)) < 90) continue;
      if (Math.hypot(bx - 485, bz - 30) < 100) continue;
      if (this.isNearTrack(bx, bz, trackDef, reqDist)) continue;

      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), i % 2 === 0 ? towerMatDark : towerMatGlass);
      bMesh.position.set(bx, bh / 2, bz);
      bMesh.castShadow = (i < 8);
      bMesh.receiveShadow = true;
      this.environmentGroup.add(bMesh);

      // Register building collider for collision pushback (strictly outside track buffer)
      this.buildingColliders.push({ x: bx, z: bz, radius: bRadius });

      // Rooftop aircraft warning red beacons
      if (bh > 90) {
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.8, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff0033 }));
        beacon.position.set(bx, bh + 1.2, bz);
        this.environmentGroup.add(beacon);
      }

      // GTA Billboard Ads on Skyscrapers
      if (Math.random() > 0.4) {
        const adColor = (i % 3 === 0) ? neonCyan : (i % 3 === 1 ? neonGold : neonRed);
        const bill = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.75, 7.5, 0.7), adColor);
        bill.position.set(bx, bh * 0.6, bz + bd / 2 + 0.45);
        this.environmentGroup.add(bill);
      }
    }

    // 5. California Royal Palm Trees lining Vinewood & Ocean Boulevards
    this.placePalmTrees(trackDef, 80);

    // 6. Streetlights with warm California illumination
    this.placeStreetlightsAlongCircuit(trackDef, isSunset ? 0xffb703 : 0xffe6a3, isNight || isSunset);
  }

  buildVinewoodSign(x, y, z) {
    const signGroup = new THREE.Group();
    signGroup.position.set(x, y, z);
    signGroup.rotation.y = Math.PI / 4;

    // Hillside base
    const hillMat = new THREE.MeshStandardMaterial({ color: 0x4a4031, roughness: 0.95 });
    const hill = new THREE.Mesh(new THREE.CylinderGeometry(80, 110, 45, 12), hillMat);
    hill.position.y = -22;
    signGroup.add(hill);

    // Letter builder: V-I-N-E-W-O-O-D
    const letters = ['V', 'I', 'N', 'E', 'W', 'O', 'O', 'D'];
    const letterMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.1
    });
    const scaffoldMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });

    letters.forEach((char, idx) => {
      const lx = (idx - 3.5) * 14.5;
      const lGroup = new THREE.Group();
      lGroup.position.set(lx, 0, 0);

      // Support legs / scaffolding
      const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 12, 6), scaffoldMat);
      leg1.position.set(-2.5, 6, -1);
      const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 12, 6), scaffoldMat);
      leg2.position.set(2.5, 6, -1);
      lGroup.add(leg1, leg2);

      // 3D Block Letter Mesh (simplified bold shapes)
      const letterMesh = this.create3DLetterMesh(char, letterMat);
      letterMesh.position.set(0, 10, 0);
      lGroup.add(letterMesh);

      signGroup.add(lGroup);
    });

    this.environmentGroup.add(signGroup);
  }

  create3DLetterMesh(char, mat) {
    const group = new THREE.Group();
    const w = 7.5, h = 10, d = 0.8, t = 1.4;

    if (char === 'I') {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(t * 1.5, h, d), mat);
      group.add(bar);
    } else if (char === 'E') {
      const vert = new THREE.Mesh(new THREE.BoxGeometry(t, h, d), mat);
      vert.position.x = -w/2 + t/2;
      const top = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), mat);
      top.position.y = h/2 - t/2;
      const mid = new THREE.Mesh(new THREE.BoxGeometry(w * 0.8, t, d), mat);
      const bot = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), mat);
      bot.position.y = -h/2 + t/2;
      group.add(vert, top, mid, bot);
    } else if (char === 'O' || char === 'D') {
      const left = new THREE.Mesh(new THREE.BoxGeometry(t, h, d), mat);
      left.position.x = -w/2 + t/2;
      const right = new THREE.Mesh(new THREE.BoxGeometry(t, h, d), mat);
      right.position.x = w/2 - t/2;
      const top = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), mat);
      top.position.y = h/2 - t/2;
      const bot = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), mat);
      bot.position.y = -h/2 + t/2;
      group.add(left, right, top, bot);
    } else if (char === 'N') {
      const left = new THREE.Mesh(new THREE.BoxGeometry(t, h, d), mat);
      left.position.x = -w/2 + t/2;
      const right = new THREE.Mesh(new THREE.BoxGeometry(t, h, d), mat);
      right.position.x = w/2 - t/2;
      const diag = new THREE.Mesh(new THREE.BoxGeometry(t, h * 1.15, d), mat);
      diag.rotation.z = -0.6;
      group.add(left, right, diag);
    } else if (char === 'W') {
      const l1 = new THREE.Mesh(new THREE.BoxGeometry(t, h, d), mat);
      l1.position.x = -w/2 + t/2;
      const l2 = new THREE.Mesh(new THREE.BoxGeometry(t, h * 0.7, d), mat);
      l2.position.set(0, -h * 0.15, 0);
      const l3 = new THREE.Mesh(new THREE.BoxGeometry(t, h, d), mat);
      l3.position.x = w/2 - t/2;
      const bot = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), mat);
      bot.position.y = -h/2 + t/2;
      group.add(l1, l2, l3, bot);
    } else { // 'V'
      const left = new THREE.Mesh(new THREE.BoxGeometry(t, h, d), mat);
      left.position.set(-w/4, 0, 0);
      left.rotation.z = 0.28;
      const right = new THREE.Mesh(new THREE.BoxGeometry(t, h, d), mat);
      right.position.set(w/4, 0, 0);
      right.rotation.z = -0.28;
      group.add(left, right);
    }

    return group;
  }

  buildMazeBankTower(x, y, z) {
    const towerGroup = new THREE.Group();
    towerGroup.position.set(x, y, z);

    const graniteMat = new THREE.MeshStandardMaterial({ color: 0x1f2430, roughness: 0.3, metalness: 0.7 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x274060, roughness: 0.1, metalness: 0.9 });
    const cyanNeon = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const yellowPaint = new THREE.MeshBasicMaterial({ color: 0xffd600 });

    // Base podium
    const base = new THREE.Mesh(new THREE.CylinderGeometry(36, 42, 35, 24), graniteMat);
    base.position.y = 17.5;
    towerGroup.add(base);

    // Main Cylindrical Shaft (210m tall)
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(26, 28, 160, 24), glassMat);
    shaft.position.y = 35 + 80;
    towerGroup.add(shaft);

    // Glowing Cyan Crown Rings
    for (let r = 0; r < 4; r++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(26.8, 0.45, 8, 24), cyanNeon);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 70 + r * 35;
      towerGroup.add(ring);
    }

    // Rooftop Helipad
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(24, 25, 4, 24), graniteMat);
    pad.position.y = 197;
    towerGroup.add(pad);

    // Helipad "H" letter
    const hGroup = new THREE.Group();
    hGroup.position.y = 199.1;
    hGroup.rotation.x = -Math.PI / 2;
    const bar1 = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 14), yellowPaint);
    bar1.position.x = -4.5;
    const bar2 = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 14), yellowPaint);
    bar2.position.x = 4.5;
    const midBar = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.5), yellowPaint);
    hGroup.add(bar1, bar2, midBar);
    towerGroup.add(hGroup);

    // Beacon tower
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.2, 18, 8), graniteMat);
    beacon.position.y = 208;
    const redLight = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0044 }));
    redLight.position.y = 217;
    towerGroup.add(beacon, redLight);

    this.environmentGroup.add(towerGroup);
  }

  buildDelPerroPierAndFerrisWheel(x, y, z) {
    const pierGroup = new THREE.Group();
    pierGroup.position.set(x, y, z);

    // Wooden Boardwalk
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5a4838, roughness: 0.85 });
    const pierPlanks = new THREE.Mesh(new THREE.BoxGeometry(45, 3.5, 110), woodMat);
    pierPlanks.position.set(0, 1.75, 0);
    pierGroup.add(pierPlanks);

    // Ferris Wheel Frame
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(0, 32, -15);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8 });
    const rimMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const spokeMat = new THREE.MeshBasicMaterial({ color: 0xff007f });

    // Outer & Inner neon rims
    const outerRim = new THREE.Mesh(new THREE.TorusGeometry(26, 0.45, 8, 32), rimMat);
    const innerRim = new THREE.Mesh(new THREE.TorusGeometry(14, 0.35, 8, 24), spokeMat);
    wheelGroup.add(outerRim, innerRim);

    // Spokes and 12 passenger pods
    for (let s = 0; s < 12; s++) {
      const ang = (s / 12) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 52, 6), frameMat);
      spoke.rotation.z = ang;
      wheelGroup.add(spoke);

      // Glowing passenger cabin pod
      const pod = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 2.4), new THREE.MeshBasicMaterial({
        color: (s % 2 === 0) ? 0xffd600 : 0x00f0ff
      }));
      pod.position.set(Math.cos(ang) * 26, Math.sin(ang) * 26, 0);
      wheelGroup.add(pod);
    }

    // A-frame support legs
    const aLegL = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.2, 36, 8), frameMat);
    aLegL.position.set(-8, 16, -15);
    aLegL.rotation.z = -0.22;
    const aLegR = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.2, 36, 8), frameMat);
    aLegR.position.set(8, 16, -15);
    aLegR.rotation.z = 0.22;
    pierGroup.add(aLegL, aLegR);

    pierGroup.add(wheelGroup);
    this.environmentGroup.add(pierGroup);

    // Ferris Wheel rotation animation in update(dt)
    this.animatedObjects.push({
      update: (dt) => {
        wheelGroup.rotation.z += 0.25 * dt;
      }
    });
  }

  /* --------------------------------------------------------------------------
     GTA CITY 2: VICE CITY (Miami)
     Landmarks: Ocean Drive Art Deco Neon Strip, Marina Speedboats, Pink Palms
     Matches Real Image: Ocean View Hotel, Cafe Cabana, Palm Court, Beach & Ocean
     -------------------------------------------------------------------------- */
  buildViceCityScenery(trackDef, timeOfDay) {
    const isNight = (timeOfDay === 'night');
    const isSunset = (timeOfDay === 'sunset');

    // 0. Coastal Beach & Ocean Strip (matching Image 2)
    const sandGeo = new THREE.PlaneGeometry(1600, 360);
    const sandMat = new THREE.MeshStandardMaterial({ color: 0xdec096, roughness: 0.95 });
    const sand = new THREE.Mesh(sandGeo, sandMat);
    sand.rotation.x = -Math.PI / 2;
    sand.position.set(0, 0.02, 380);
    this.environmentGroup.add(sand);

    const seaGeo = new THREE.PlaneGeometry(2400, 800);
    const seaMat = new THREE.MeshStandardMaterial({
      color: 0x0096c7,
      roughness: 0.15,
      metalness: 0.2,
      transparent: true,
      opacity: 0.88
    });
    const ocean = new THREE.Mesh(seaGeo, seaMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.set(0, 0.01, 940);
    this.environmentGroup.add(ocean);

    // 1. Signature Art Deco Hotels from Real Image 2
    this.buildArtDecoSignHotel(-140, 130, 'OCEAN VIEW HOTEL', 0xc5dff8, '#00f0ff', 'OCEAN DRIVE • ART DECO SUITES');
    this.buildArtDecoSignHotel(0, 130, 'CAFE CABANA', 0xffd6a5, '#ff6b35', 'AUTHENTIC CUBAN CUISINE & COCKTAILS');
    this.buildArtDecoSignHotel(140, 130, 'PALM COURT', 0xa0c4ff, '#00f0ff', 'HISTORIC LUXURY HOTEL');

    // 2. Background Pastel Art Deco Hotel Row
    const hotelPastels = [0xffcbf2, 0xa0c4ff, 0xfde2e4, 0xcaffbf, 0xffd6a5];
    const neonPink = new THREE.MeshBasicMaterial({ color: 0xff007f });
    const neonCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const neonGold = new THREE.MeshBasicMaterial({ color: 0xffd600 });

    for (let i = 0; i < 26; i++) {
      const angle = (i / 26) * Math.PI * 2;
      const rad = 240 + (i % 3) * 75;
      const hx = Math.cos(angle) * rad;
      const hz = Math.sin(angle) * rad;
      const hw = 26 + Math.random() * 12;
      const hh = 22 + Math.random() * 26;
      const hd = 22 + Math.random() * 10;
      const hRadius = Math.hypot(hw / 2, hd / 2);
      const reqDist = (trackDef.roadWidth || 26) / 2 + hRadius + 30;

      // Skip spots reserved for signature hotels & ocean
      if (hz > 110 && Math.abs(hx) < 220) continue;
      if (this.isNearTrack(hx, hz, trackDef, reqDist)) continue;

      const hotel = new THREE.Group();
      hotel.position.set(hx, 0, hz);
      hotel.rotation.y = -angle + Math.PI / 2;
      const pColor = hotelPastels[i % hotelPastels.length];

      // Pastel Facade
      const bodyMat = new THREE.MeshStandardMaterial({ color: pColor, roughness: 0.5 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(hw, hh, hd), bodyMat);
      body.position.y = hh / 2;
      hotel.add(body);

      this.buildingColliders.push({ x: hx, z: hz, radius: hRadius });

      // Curved Art Deco Eyebrow Overhang
      const browMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
      const eyebrow = new THREE.Mesh(new THREE.BoxGeometry(hw + 3, 1.2, 4.5), browMat);
      eyebrow.position.set(0, 5, hd / 2 + 1.2);
      hotel.add(eyebrow);

      // Horizontal Neon Tube Trim lines
      if (isNight || isSunset) {
        const nCol = (i % 2 === 0) ? neonPink : neonCyan;
        const trim1 = new THREE.Mesh(new THREE.BoxGeometry(hw + 0.4, 0.4, 0.4), nCol);
        trim1.position.set(0, hh * 0.4, hd / 2 + 0.3);
        const trim2 = new THREE.Mesh(new THREE.BoxGeometry(hw + 0.4, 0.4, 0.4), neonGold);
        trim2.position.set(0, hh * 0.75, hd / 2 + 0.3);
        hotel.add(trim1, trim2);
      }

      this.environmentGroup.add(hotel);
    }

    // 3. Marina Docked Speedboats & Luxury Yachts
    const boatHullMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const boatGlassMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, roughness: 0.1 });
    for (let b = 0; b < 10; b++) {
      const boat = new THREE.Group();
      boat.position.set(-320 + b * 75, 0, 360 + (b % 2) * 45);

      const hull = new THREE.Mesh(new THREE.BoxGeometry(9, 3.5, 24), boatHullMat);
      hull.position.y = 1.0;
      boat.add(hull);

      const flybridge = new THREE.Mesh(new THREE.BoxGeometry(6.5, 3.2, 11), boatGlassMat);
      flybridge.position.set(0, 3.8, -2);
      boat.add(flybridge);

      this.environmentGroup.add(boat);
    }

    // 4. Miami Royal Palm Trees with Pink/Cyan Uplights
    this.placePalmTrees(trackDef, 90, true);

    // 5. Streetlights
    this.placeStreetlightsAlongCircuit(trackDef, 0xff007f, true);
  }

  buildArtDecoSignHotel(x, z, name, pColor, neonColor, subtitle = 'OCEAN DRIVE') {
    const hotel = new THREE.Group();
    hotel.position.set(x, 0, z);
    const hw = 36, hh = 28, hd = 24;

    const bodyMat = new THREE.MeshStandardMaterial({ color: pColor, roughness: 0.5 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(hw, hh, hd), bodyMat);
    body.position.y = hh / 2;
    hotel.add(body);

    // Eyebrows
    const browMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const eyebrow = new THREE.Mesh(new THREE.BoxGeometry(hw + 4, 1.4, 6), browMat);
    eyebrow.position.set(0, 5, hd / 2 + 2);
    hotel.add(eyebrow);

    // Stepped Art Deco rooftop crown
    const crownMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const crown = new THREE.Mesh(new THREE.BoxGeometry(18, 7, hd - 4), crownMat);
    crown.position.set(0, hh + 3.5, 0);
    hotel.add(crown);

    // Neon Marquee Canvas Sign
    const signTex = this.createSignTexture({
      width: 512,
      height: 192,
      bgColor: '#0f1422',
      borderColor: neonColor,
      borderWidth: 6,
      text: name,
      textColor: neonColor,
      font: '900 40px "Arial Black", Arial, sans-serif',
      shadowColor: neonColor,
      shadowBlur: 18,
      subtitle: subtitle,
      subColor: '#ffffff',
      subFont: 'bold 20px Arial, sans-serif'
    });
    const signMat = new THREE.MeshBasicMaterial({ map: signTex });
    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(20, 7.5), signMat);
    signMesh.position.set(0, hh + 5.5, hd / 2 + 0.6);
    hotel.add(signMesh);

    this.environmentGroup.add(hotel);
    this.buildingColliders.push({ x: x, z: z, radius: 24 });
  }

  /* --------------------------------------------------------------------------
     GTA CITY 3: LIBERTY CITY (New York)
     Landmarks: Star Junction (Times Square) Giant Billboards, Rotterdam Spire
     Matches Real Image: Coke, iFruit, Sprunk, LC Herald, Burger Shot, Love Fist
     -------------------------------------------------------------------------- */
  buildLibertyCityScenery(trackDef, timeOfDay) {
    const isNight = (timeOfDay === 'night');
    const brickMat = new THREE.MeshStandardMaterial({ color: 0x4a2820, roughness: 0.85 });
    const limestoneMat = new THREE.MeshStandardMaterial({ color: 0x9e9a93, roughness: 0.4 });
    const darkGlass = new THREE.MeshStandardMaterial({ color: 0x111622, roughness: 0.2, metalness: 0.8 });

    // 1. Rotterdam Tower (Empire State Spire) - safely centered in skyline plaza, 190m clear of track
    this.buildRotterdamTower(-80, 0, 0);

    // 2. Broker Bridge Overhead Suspension Towers
    this.buildSuspensionBridgeArch(0, 0, 250, trackDef.roadWidth || 28);

    // 3. Signature Star Junction Video Billboards matching Image 3
    const realBillboards = [
      { text: 'LC HERALD', sub: 'DAILY NEWSPAPER • SINCE 1898', bg: '#081220', textCol: '#ffffff', border: '#00f0ff' },
      { text: 'COKE', sub: 'OPEN HAPPINESS', bg: '#cc0011', textCol: '#ffffff', border: '#ffffff' },
      { text: 'iFRUIT', sub: 'SMARTPHONE 14 PRO', bg: '#0d0d0d', textCol: '#ffffff', border: '#00f0ff' },
      { text: 'SPRUNK', sub: 'THE ESSENCE OF LIFE', bg: '#008822', textCol: '#ffffff', border: '#ffd600' },
      { text: 'BURGER SHOT', sub: 'HIT ME WITH YOUR BEST SHOT', bg: '#b31e00', textCol: '#ffd600', border: '#ffd600' },
      { text: 'LOVE FIST', sub: 'WORLD TOUR LIVE IN CONCERT', bg: '#2b0938', textCol: '#f72585', border: '#f72585' },
      { text: 'THE MENACE', sub: 'BROADWAY SMASH HIT MUSICAL', bg: '#160824', textCol: '#ffd600', border: '#ff0055' }
    ];

    for (let i = 0; i < 44; i++) {
      const angle = (i / 44) * Math.PI * 2;
      const rad = 250 + (i % 4) * 85;
      const bx = Math.cos(angle) * rad;
      const bz = Math.sin(angle) * rad;

      const bw = 28 + Math.random() * 28;
      const bd = 28 + Math.random() * 28;
      const bh = 65 + Math.random() * 135;
      const bRadius = Math.hypot(bw / 2, bd / 2);
      const reqDist = (trackDef.roadWidth || 27) / 2 + bRadius + 30;

      if (Math.hypot(bx - (-80), bz - 0) < 80) continue;
      if (this.isNearTrack(bx, bz, trackDef, reqDist)) continue;

      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), i % 3 === 0 ? brickMat : (i % 3 === 1 ? limestoneMat : darkGlass));
      bMesh.position.set(bx, bh / 2, bz);
      bMesh.castShadow = (i < 8);
      bMesh.receiveShadow = true;
      this.environmentGroup.add(bMesh);
      this.buildingColliders.push({ x: bx, z: bz, radius: bRadius });

      // Times Square Illuminated Electronic Video Billboards
      if (bh > 70) {
        const adConfig = realBillboards[i % realBillboards.length];
        const adTex = this.createSignTexture({
          width: 512,
          height: 256,
          bgColor: adConfig.bg,
          borderColor: adConfig.border,
          borderWidth: 8,
          text: adConfig.text,
          textColor: adConfig.textCol,
          font: '900 46px "Arial Black", Arial, sans-serif',
          shadowColor: adConfig.border,
          shadowBlur: 16,
          subtitle: adConfig.sub,
          subColor: '#ffd600',
          subFont: 'bold 22px Arial, sans-serif'
        });
        const adMat = new THREE.MeshBasicMaterial({ map: adTex });
        const adMesh = new THREE.Mesh(new THREE.PlaneGeometry(bw * 0.82, 16), adMat);
        adMesh.position.set(bx, 32, bz + bd / 2 + 0.55);
        this.environmentGroup.add(adMesh);
      }
    }

    // 4. Street-Level Subway Entrance & Yellow Cabs (matching Image 3)
    this.buildNycSubwayEntrance(25, 0, 245);
    this.buildYellowCabs(trackDef);

    // Streetlights
    this.placeStreetlightsAlongCircuit(trackDef, 0xffd166, isNight);
  }

  buildNycSubwayEntrance(x, y, z) {
    const subGroup = new THREE.Group();
    subGroup.position.set(x, y, z);

    // Green iron railing
    const railMat = new THREE.MeshStandardMaterial({ color: 0x194d33, roughness: 0.7, metalness: 0.5 });
    const railing = new THREE.Mesh(new THREE.BoxGeometry(6, 1.4, 10), railMat);
    railing.position.y = 0.7;
    subGroup.add(railing);

    // Dark stairs cavity
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const stairs = new THREE.Mesh(new THREE.PlaneGeometry(5, 9), holeMat);
    stairs.rotation.x = -Math.PI / 2;
    stairs.position.y = 0.05;
    subGroup.add(stairs);

    // Glowing Green Subway Globes
    const globeMat = new THREE.MeshBasicMaterial({ color: 0x00f59b });
    const postMat = new THREE.MeshStandardMaterial({ color: 0x194d33 });
    for (let gx of [-2.8, 2.8]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2), postMat);
      post.position.set(gx, 1.6, 4.8);
      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), globeMat);
      globe.position.set(gx, 3.4, 4.8);
      subGroup.add(post, globe);
    }

    this.environmentGroup.add(subGroup);
  }

  buildYellowCabs(trackDef) {
    const cabMat = new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.25, metalness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x111622, roughness: 0.1 });
    const taxiSignMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const wps = trackDef.waypoints;
    const cabSpots = [1, 3, 5, 7].filter(i => i < wps.length);
    cabSpots.forEach(idx => {
      const p = wps[idx];
      const cab = new THREE.Group();
      cab.position.set(p.x + (idx % 2 === 0 ? 18 : -18), 0, p.z + 10);

      const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.2, 5.0), cabMat);
      body.position.y = 0.65;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.9, 2.8), glassMat);
      cabin.position.set(0, 1.4, -0.2);
      const sign = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 1.4), taxiSignMat);
      sign.position.set(0, 1.95, -0.2);

      cab.add(body, cabin, sign);
      this.environmentGroup.add(cab);
    });
  }

  buildRotterdamTower(x, y, z) {
    const tower = new THREE.Group();
    tower.position.set(x, y, z);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8d877e, roughness: 0.45 });
    const winMat = new THREE.MeshStandardMaterial({ color: 0x1f2633, roughness: 0.2 });

    // Tier 1 Base
    const t1 = new THREE.Mesh(new THREE.BoxGeometry(45, 60, 45), stoneMat);
    t1.position.y = 30;
    // Tier 2 Mid
    const t2 = new THREE.Mesh(new THREE.BoxGeometry(34, 75, 34), winMat);
    t2.position.y = 60 + 37.5;
    // Tier 3 Spire base
    const t3 = new THREE.Mesh(new THREE.BoxGeometry(22, 55, 22), stoneMat);
    t3.position.y = 135 + 27.5;

    // Art Deco Spire needle
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 4.5, 45, 8), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 }));
    spire.position.y = 190 + 22.5;

    // Flashing red aircraft warning beacon
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0033 }));
    beacon.position.y = 236;

    tower.add(t1, t2, t3, spire, beacon);
    this.environmentGroup.add(tower);
  }

  buildSuspensionBridgeArch(x, y, z, roadW) {
    const bridge = new THREE.Group();
    bridge.position.set(x, y, z);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6c6b68, roughness: 0.7 });
    const cableMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });

    // Twin Gothic Arch Towers placed outside the road shoulders (20m clearance from road edge!)
    const towerH = 52;
    const clearWidth = roadW + 40; // 40m wider than roadway
    const postL = new THREE.Mesh(new THREE.BoxGeometry(6.5, towerH, 5.5), stoneMat);
    postL.position.set(0, towerH / 2, -clearWidth / 2);
    const postR = new THREE.Mesh(new THREE.BoxGeometry(6.5, towerH, 5.5), stoneMat);
    postR.position.set(0, towerH / 2, clearWidth / 2);

    // Arch Beam high above the road
    const beam = new THREE.Mesh(new THREE.BoxGeometry(6.5, 6, clearWidth + 8), stoneMat);
    beam.position.set(0, towerH - 3, 0);

    // Suspension Cables strictly along outer shoulder edges (never blocking lanes!)
    for (let c = -4; c <= 4; c++) {
      const cableL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, towerH - 8, 6), cableMat);
      cableL.position.set(c * 6, (towerH - 8) / 2 + 4, -clearWidth / 2 + 0.5);
      const cableR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, towerH - 8, 6), cableMat);
      cableR.position.set(c * 6, (towerH - 8) / 2 + 4, clearWidth / 2 - 0.5);
      bridge.add(cableL, cableR);
    }

    bridge.add(postL, postR, beam);
    this.environmentGroup.add(bridge);
  }

  /* --------------------------------------------------------------------------
     GTA CITY 4: LAS VENTURAS (Las Vegas)
     Landmarks: Caligula's Palace, The Pharaoh Pyramid & Sphinx, The Four Dragons, Starfish
     Matches Real Image: Classical Colonnade, Golden Sphinx, Pagoda Dragon, Starfish Neon
     -------------------------------------------------------------------------- */
  buildLasVenturasScenery(trackDef, timeOfDay) {
    const isNight = (timeOfDay === 'night');

    // 1. The Pharaoh / Luxor Giant Obsidian Pyramid & Blinding Sky Beam
    this.buildCasinoPyramid(-160, 0, -100);
    this.buildSphinxStatue(-160, 0, -45);

    // 2. Caligula's Palace Roman Colonnade Casino (matching Image 4)
    this.buildCaligulasPalace(160, 0, -100);

    // 3. The Four Dragons Asian Pagoda Casino (matching Image 4)
    this.buildFourDragonsCasino(-160, 0, 120);

    // 4. Starfish Casino with Neon Starfish (matching Image 4)
    this.buildStarfishCasino(160, 0, 120);

    // 5. The Strip Casino Towers & Glowing Marquees
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.2, metalness: 0.85 });
    const mirrorGlass = new THREE.MeshStandardMaterial({ color: 0x1f1f2e, roughness: 0.1, metalness: 0.95 });
    const casinoNeonCols = [0xffd600, 0x9d4edd, 0xff0055, 0x00f0ff];

    for (let i = 0; i < 36; i++) {
      const angle = (i / 36) * Math.PI * 2;
      const rad = 250 + (i % 4) * 85;
      const bx = Math.cos(angle) * rad;
      const bz = Math.sin(angle) * rad;

      const bw = 32 + Math.random() * 26;
      const bd = 32 + Math.random() * 26;
      const bh = 60 + Math.random() * 110;
      const bRadius = Math.hypot(bw / 2, bd / 2);
      const reqDist = (trackDef.roadWidth || 28) / 2 + bRadius + 30;

      if (Math.hypot(bx - (-160), bz - (-100)) < 90) continue;
      if (Math.hypot(bx - 160, bz - (-100)) < 80) continue;
      if (Math.hypot(bx - (-160), bz - 120) < 80) continue;
      if (Math.hypot(bx - 160, bz - 120) < 80) continue;
      if (this.isNearTrack(bx, bz, trackDef, reqDist)) continue;

      const tower = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), i % 2 === 0 ? goldMat : mirrorGlass);
      tower.position.set(bx, bh / 2, bz);
      tower.castShadow = (i < 8);
      tower.receiveShadow = true;
      this.environmentGroup.add(tower);
      this.buildingColliders.push({ x: bx, z: bz, radius: bRadius });

      // Neon Casino Marquee Signs
      if (isNight) {
        const nCol = casinoNeonCols[i % casinoNeonCols.length];
        const marquee = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.8, 9, 0.8), new THREE.MeshBasicMaterial({ color: nCol }));
        marquee.position.set(bx, 28, bz + bd / 2 + 0.5);
        this.environmentGroup.add(marquee);
      }
    }

    // 6. Giant 3D Rolling Dice Sculptures at Casino Entrances
    this.buildGiantCasinoDice(60, 0, 160);

    // 7. Palm trees lining the Strip
    this.placePalmTrees(trackDef, 75);

    // 8. Golden Casino Streetlights
    this.placeStreetlightsAlongCircuit(trackDef, 0xffd600, true);
  }

  buildCaligulasPalace(x, y, z) {
    const palace = new THREE.Group();
    palace.position.set(x, y, z);

    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xedeae1, roughness: 0.35 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8 });

    // Main Hall
    const hall = new THREE.Mesh(new THREE.BoxGeometry(45, 24, 30), marbleMat);
    hall.position.y = 12;
    palace.add(hall);

    // Classical Roman Colonnade (6 pillars)
    for (let c = -2.5; c <= 2.5; c += 1) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.2, 22, 12), marbleMat);
      col.position.set(c * 7.5, 11, 16);
      palace.add(col);
    }

    // Triangular Pediment Roof
    const pediment = new THREE.Mesh(new THREE.ConeGeometry(24, 8, 4), goldMat);
    pediment.rotation.y = Math.PI / 4;
    pediment.position.set(0, 26, 16);
    palace.add(pediment);

    // Neon Chariot Signboard
    const signTex = this.createSignTexture({
      width: 512,
      height: 192,
      bgColor: '#160808',
      borderColor: '#ff0033',
      borderWidth: 6,
      text: "CALIGULA'S PALACE",
      textColor: '#ffd600',
      font: '900 36px "Times New Roman", serif',
      shadowColor: '#ffd600',
      shadowBlur: 16,
      subtitle: 'ROMAN EMPIRE CASINO & RESORT',
      subColor: '#ff0033',
      subFont: 'bold 18px Arial, sans-serif'
    });
    const signMat = new THREE.MeshBasicMaterial({ map: signTex });
    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(24, 9), signMat);
    signMesh.position.set(0, 31, 16.5);
    palace.add(signMesh);

    this.environmentGroup.add(palace);
    this.buildingColliders.push({ x: x, z: z, radius: 28 });
  }

  buildSphinxStatue(x, y, z) {
    const sphinx = new THREE.Group();
    sphinx.position.set(x, y, z);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xc99b38, roughness: 0.4, metalness: 0.6 });

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(16, 12, 28), goldMat);
    body.position.y = 6;
    // Head / Headdress
    const head = new THREE.Mesh(new THREE.ConeGeometry(5, 9, 8), goldMat);
    head.position.set(0, 15, 10);
    // Paws
    const pawL = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 10), goldMat);
    pawL.position.set(-6, 1.5, 16);
    const pawR = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 10), goldMat);
    pawR.position.set(6, 1.5, 16);

    sphinx.add(body, head, pawL, pawR);
    this.environmentGroup.add(sphinx);
  }

  buildFourDragonsCasino(x, y, z) {
    const casino = new THREE.Group();
    casino.position.set(x, y, z);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x992222, roughness: 0.5 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 });
    const goldMat = new THREE.MeshBasicMaterial({ color: 0xffd600 });

    // Multi-tier pagoda body
    const t1 = new THREE.Mesh(new THREE.BoxGeometry(34, 14, 34), wallMat);
    t1.position.y = 7;
    const r1 = new THREE.Mesh(new THREE.ConeGeometry(26, 6, 4), roofMat);
    r1.rotation.y = Math.PI / 4;
    r1.position.y = 17;

    const t2 = new THREE.Mesh(new THREE.BoxGeometry(24, 12, 24), wallMat);
    t2.position.y = 23;
    const r2 = new THREE.Mesh(new THREE.ConeGeometry(18, 5, 4), roofMat);
    r2.rotation.y = Math.PI / 4;
    r2.position.y = 31.5;

    // Glowing Dragon Sign
    const signTex = this.createSignTexture({
      width: 512,
      height: 192,
      bgColor: '#1a0505',
      borderColor: '#ffd600',
      borderWidth: 6,
      text: 'THE FOUR DRAGONS',
      textColor: '#ffd600',
      font: '900 36px "Arial Black", Arial, sans-serif',
      shadowColor: '#ff0033',
      shadowBlur: 16,
      subtitle: '🐉 CASINO & ORIENTAL GARDENS 🐉',
      subColor: '#ff3344',
      subFont: 'bold 20px Arial, sans-serif'
    });
    const signMat = new THREE.MeshBasicMaterial({ map: signTex });
    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(20, 7.5), signMat);
    signMesh.position.set(0, 36, 10);

    casino.add(t1, r1, t2, r2, signMesh);
    this.environmentGroup.add(casino);
    this.buildingColliders.push({ x: x, z: z, radius: 25 });
  }

  buildStarfishCasino(x, y, z) {
    const casino = new THREE.Group();
    casino.position.set(x, y, z);

    const blueGlass = new THREE.MeshStandardMaterial({ color: 0x003566, roughness: 0.1, metalness: 0.9 });
    const tower = new THREE.Mesh(new THREE.BoxGeometry(32, 65, 32), blueGlass);
    tower.position.y = 32.5;

    // Giant Illuminated Neon Starfish Emblem
    const starTex = this.createSignTexture({
      width: 512,
      height: 256,
      bgColor: '#001233',
      borderColor: '#00f0ff',
      borderWidth: 8,
      text: '★ STARFISH CASINO ★',
      textColor: '#00f0ff',
      font: '900 38px "Arial Black", Arial, sans-serif',
      shadowColor: '#00f0ff',
      shadowBlur: 20,
      subtitle: 'VIP SLOTS • HIGH ROLLER LOUNGE',
      subColor: '#ffd600',
      subFont: 'bold 20px Arial, sans-serif'
    });
    const starMat = new THREE.MeshBasicMaterial({ map: starTex });
    const starMesh = new THREE.Mesh(new THREE.PlaneGeometry(22, 11), starMat);
    starMesh.position.set(0, 48, 16.5);

    casino.add(tower, starMesh);
    this.environmentGroup.add(casino);
    this.buildingColliders.push({ x: x, z: z, radius: 24 });
  }

  buildCasinoPyramid(x, y, z) {
    const pyramidGroup = new THREE.Group();
    pyramidGroup.position.set(x, y, z);

    // 85m wide Obsidian Glass Pyramid
    const pyrMat = new THREE.MeshStandardMaterial({
      color: 0x0c0f17,
      roughness: 0.15,
      metalness: 0.9
    });
    const pyramid = new THREE.Mesh(new THREE.ConeGeometry(55, 65, 4), pyrMat);
    pyramid.rotation.y = Math.PI / 4;
    pyramid.position.y = 32.5;
    pyramidGroup.add(pyramid);

    // Golden Apex Capstone
    const capMat = new THREE.MeshBasicMaterial({ color: 0xffd600 });
    const cap = new THREE.Mesh(new THREE.ConeGeometry(9, 11, 4), capMat);
    cap.rotation.y = Math.PI / 4;
    cap.position.y = 60;
    pyramidGroup.add(cap);

    // Blinding Sky Beam shooting into the clouds
    const beamGeo = new THREE.CylinderGeometry(4.5, 9.5, 320, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.65
    });
    const skyBeam = new THREE.Mesh(beamGeo, beamMat);
    skyBeam.position.y = 65 + 160;
    pyramidGroup.add(skyBeam);

    this.environmentGroup.add(pyramidGroup);
  }

  buildGiantCasinoDice(x, y, z) {
    const diceGroup = new THREE.Group();
    diceGroup.position.set(x, y, z);

    const diceMat = new THREE.MeshStandardMaterial({ color: 0xee0033, roughness: 0.3 });
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let d = 0; d < 2; d++) {
      const die = new THREE.Mesh(new THREE.BoxGeometry(7, 7, 7), diceMat);
      die.position.set(d * 9.5, 3.5, 0);
      die.rotation.set(0.2, (d + 1) * 0.6, 0.1);

      // Pips
      const pip = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8), dotMat);
      pip.position.set(0, 0, 3.6);
      die.add(pip);

      diceGroup.add(die);
    }

    this.environmentGroup.add(diceGroup);
  }

  /* --------------------------------------------------------------------------
     GTA CITY 5: BLAINE COUNTY (San Andreas Countryside)
     Landmarks: Mount Chiliad, Route 68 Gas Station, Spinning Wind Turbines
     Matches Real Image: Route 68 Road Decals, Coyote Bite Diner, Telephone Poles
     -------------------------------------------------------------------------- */
  buildBlaineCountyScenery(trackDef, timeOfDay) {
    const isNight = (timeOfDay === 'night');

    // 1. Colossal Mount Chiliad Mountain Massif (safely placed in background)
    this.buildMountChiliad(580, 0, -480);

    // 2. Coyote Bite Roadside Diner & Gas Station (matching Image 5)
    this.buildCoyoteBiteDiner(-120, 0, 150);

    // 3. Stencil "ROUTE 68" Decals painted on the asphalt (matching Image 5)
    this.buildRoute68RoadDecals(trackDef);

    // 4. Wooden Utility Telephone Poles with crossarms (matching Image 5)
    this.buildWoodenTelephonePoles(trackDef);

    // 5. Spinning Wind Turbine Farm (safely placed 150m south)
    this.buildWindTurbineFarm();

    // 6. Red Rock Canyon Buttes & Saguaro Cacti
    this.buildDesertMesasAndCacti(trackDef);

    // Guardrails & Desert Highway Lighting
    this.placeGuardrails(trackDef, 0xb55428);
    this.placeStreetlightsAlongCircuit(trackDef, 0xffd166, isNight);
  }

  buildRoute68RoadDecals(trackDef) {
    const decalTex = this.createRoute68DecalTexture();
    const decalMat = new THREE.MeshBasicMaterial({
      map: decalTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2
    });

    const wps = trackDef.waypoints;
    const indices = [0, 2, 4, 6].filter(i => i < wps.length);
    indices.forEach(idx => {
      const p1 = wps[idx];
      const p2 = wps[(idx + 1) % wps.length];
      const angle = Math.atan2(p2.x - p1.x, p2.z - p1.z);
      const mx = (p1.x + p2.x) / 2;
      const mz = (p1.z + p2.z) / 2;

      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), decalMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = -angle;
      mesh.position.set(mx, 0.08, mz);
      this.environmentGroup.add(mesh);
    });
  }

  buildWoodenTelephonePoles(trackDef) {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x5a4332, roughness: 0.95 });
    const armMat = new THREE.MeshStandardMaterial({ color: 0x3d2d22, roughness: 0.95 });
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    const wps = trackDef.waypoints;
    const poles = [];
    for (let i = 0; i < wps.length; i++) {
      const p1 = wps[i];
      const p2 = wps[(i + 1) % wps.length];
      const angle = Math.atan2(p2.x - p1.x, p2.z - p1.z);
      const nx = -Math.cos(angle);
      const nz = Math.sin(angle);
      const offset = (trackDef.roadWidth || 28) / 2 + 14;

      const px = p1.x + nx * offset;
      const pz = p1.z + nz * offset;

      const pole = new THREE.Group();
      pole.position.set(px, 0, pz);

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 14, 6), poleMat);
      post.position.y = 7;
      const cross = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.35, 0.35), armMat);
      cross.position.y = 13;
      cross.rotation.y = angle;

      pole.add(post, cross);
      this.environmentGroup.add(pole);
      poles.push({ x: px, y: 13, z: pz });
    }

    // Connect power lines between adjacent poles
    for (let i = 0; i < poles.length; i++) {
      const next = (i + 1) % poles.length;
      const pA = poles[i];
      const pB = poles[next];
      const dist = Math.hypot(pB.x - pA.x, pB.z - pA.z);
      if (dist < 350) {
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(pA.x, pA.y, pA.z),
          new THREE.Vector3((pA.x + pB.x) / 2, pA.y - 1.2, (pA.z + pB.z) / 2),
          new THREE.Vector3(pB.x, pB.y, pB.z)
        ]);
        const line = new THREE.Line(lineGeo, wireMat);
        this.environmentGroup.add(line);
      }
    }
  }

  buildCoyoteBiteDiner(x, y, z) {
    const dinerGroup = new THREE.Group();
    dinerGroup.position.set(x, y, z);

    // Weathered rustic desert building matching Image 5
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8a7055, roughness: 0.95 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2d, roughness: 0.9 });
    const bldg = new THREE.Mesh(new THREE.BoxGeometry(28, 7.5, 16), woodMat);
    bldg.position.y = 3.75;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(30, 1.2, 18), roofMat);
    roof.position.y = 8.1;
    dinerGroup.add(bldg, roof);

    // Retro diner canopy
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.6 });
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(30, 0.8, 8), canopyMat);
    canopy.position.set(0, 4.5, 11);
    dinerGroup.add(canopy);

    // Fuel pumps
    const pumpMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    for (let p of [-8, 8]) {
      const pump = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.5, 1.6), pumpMat);
      pump.position.set(p, 1.75, 12);
      dinerGroup.add(pump);
    }

    // Iconic "COYOTE BITE" Marquee Sign (matching Image 5)
    const signTex = this.createSignTexture({
      width: 512,
      height: 256,
      bgColor: '#16202c',
      borderColor: '#00f0ff',
      borderWidth: 10,
      badge: '★ ROUTE 68 FAMOUS DINER ★',
      badgeColor: '#ffd600',
      text: 'COYOTE BITE',
      textColor: '#00f0ff',
      font: '900 48px "Arial Black", Arial, sans-serif',
      shadowColor: '#00f0ff',
      shadowBlur: 16,
      subtitle: 'HOT COFFEE • GAS • COLD BEER',
      subColor: '#ff0055',
      subFont: 'bold 22px Arial, sans-serif'
    });
    const signMat = new THREE.MeshBasicMaterial({ map: signTex });
    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), signMat);
    signMesh.position.set(0, 13.5, 11.2);
    dinerGroup.add(signMesh);

    // Vintage parked jalopy cars
    const rustMat1 = new THREE.MeshStandardMaterial({ color: 0x6e432c, roughness: 0.9 });
    const rustMat2 = new THREE.MeshStandardMaterial({ color: 0x4a525d, roughness: 0.85 });
    for (let c = 0; c < 3; c++) {
      const jalopy = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 5.2), c % 2 === 0 ? rustMat1 : rustMat2);
      jalopy.position.set(-18 + c * 8, 0.7, 18);
      jalopy.rotation.y = 0.2 * (c - 1);
      dinerGroup.add(jalopy);
    }

    this.environmentGroup.add(dinerGroup);
    this.buildingColliders.push({ x: x, z: z, radius: 26 });
  }

  buildMountChiliad(x, y, z) {
    const mtnGroup = new THREE.Group();
    mtnGroup.position.set(x, y, z);

    const rockMat = new THREE.MeshStandardMaterial({ color: 0x5a3d2c, roughness: 0.95 });
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xf0f4f8, roughness: 0.4 });

    // Main Mountain Massif (160m tall)
    const mtn = new THREE.Mesh(new THREE.ConeGeometry(180, 160, 10), rockMat);
    mtn.position.y = 80;
    mtnGroup.add(mtn);

    // Snow-dusted Summit Peak
    const peak = new THREE.Mesh(new THREE.ConeGeometry(55, 48, 10), snowMat);
    peak.position.y = 138;
    mtnGroup.add(peak);

    // Cable car station silhouette on peak
    const station = new THREE.Mesh(new THREE.BoxGeometry(16, 7, 12), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    station.position.y = 163;
    mtnGroup.add(station);

    this.environmentGroup.add(mtnGroup);
  }

  buildRoute68GasStation(x, y, z) {
    const stationGroup = new THREE.Group();
    stationGroup.position.set(x, y, z);

    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xcc0022, roughness: 0.5 });
    const pumpMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });

    // Canopy Roof
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(32, 2.5, 18), canopyMat);
    canopy.position.y = 7.5;
    stationGroup.add(canopy);

    // 4 Support Pillars
    for (let px of [-12, 12]) {
      for (let pz of [-6, 6]) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 7.5, 6), pumpMat);
        pillar.position.set(px, 3.75, pz);
        stationGroup.add(pillar);
      }
    }

    // Fuel Pumps
    for (let p of [-6, 6]) {
      const pump = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.8, 1.8), new THREE.MeshStandardMaterial({ color: 0x00f0ff }));
      pump.position.set(p, 1.9, 0);
      stationGroup.add(pump);
    }

    // Neon Route 68 Sign
    const sign = new THREE.Mesh(new THREE.BoxGeometry(8, 3.2, 0.5), new THREE.MeshBasicMaterial({ color: 0xffd600 }));
    sign.position.set(0, 10.5, 9.2);
    stationGroup.add(sign);

    this.environmentGroup.add(stationGroup);
  }

  buildWindTurbineFarm() {
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.7 });
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

    for (let w = 0; w < 6; w++) {
      const wx = 30 + w * 45;
      const wz = -480 - (w % 2) * 35;

      const turbine = new THREE.Group();
      turbine.position.set(wx, 0, wz);

      // Tower
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.6, 55, 8), towerMat);
      tower.position.y = 27.5;
      turbine.add(tower);

      // Nacelle hub
      const hub = new THREE.Mesh(new THREE.BoxGeometry(3.5, 3.5, 7), towerMat);
      hub.position.set(0, 55, 0);
      turbine.add(hub);

      // Rotor blades
      const rotorGroup = new THREE.Group();
      rotorGroup.position.set(0, 55, 3.6);

      for (let b = 0; b < 3; b++) {
        const ang = (b / 3) * Math.PI * 2;
        const blade = new THREE.Mesh(new THREE.BoxGeometry(1.2, 24, 0.2), bladeMat);
        blade.position.set(Math.sin(ang) * 12, Math.cos(ang) * 12, 0);
        blade.rotation.z = -ang;
        rotorGroup.add(blade);
      }

      turbine.add(rotorGroup);
      this.environmentGroup.add(turbine);

      // Spin animation in update(dt)
      this.animatedObjects.push({
        update: (dt) => {
          rotorGroup.rotation.z += (1.4 + w * 0.15) * dt;
        }
      });
    }
  }

  buildDesertMesasAndCacti(trackDef) {
    const rockMat = new THREE.MeshStandardMaterial({ color: 0xb55428, roughness: 0.95 });
    const cactusMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.8 });

    // Tiered Mesas (strictly verified clear of track)
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const rad = 280 + (i % 3) * 90;
      const rx = Math.cos(angle) * rad;
      const rz = Math.sin(angle) * rad;

      const rw = 40 + Math.random() * 45;
      const rh = 35 + Math.random() * 70;
      const reqDist = (trackDef.roadWidth || 26) / 2 + rw + 35;
      if (this.isNearTrack(rx, rz, trackDef, reqDist)) continue;

      const mesa = new THREE.Mesh(new THREE.CylinderGeometry(rw * 0.7, rw, rh, 7), rockMat);
      mesa.position.set(rx, rh / 2, rz);
      this.environmentGroup.add(mesa);
    }

    // 3D Saguaro Cacti (strictly verified clear of track)
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 140 + Math.random() * 280;
      const cx = Math.cos(angle) * dist;
      const cz = Math.sin(angle) * dist;
      if (this.isNearTrack(cx, cz, trackDef, (trackDef.roadWidth || 26) / 2 + 20)) continue;

      const cactus = new THREE.Group();
      cactus.position.set(cx, 0, cz);

      const h = 5 + Math.random() * 3.5;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, h, 8), cactusMat);
      trunk.position.y = h / 2;
      cactus.add(trunk);

      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 2.5, 8), cactusMat);
      arm.position.set(-0.8, h * 0.65, 0);
      const conn = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.3), cactusMat);
      conn.position.set(-0.4, h * 0.5, 0);
      cactus.add(arm, conn);

      this.environmentGroup.add(cactus);
    }
  }

  /* --------------------------------------------------------------------------
     Common Props: Palm Trees, Streetlights, Checkpoints
     -------------------------------------------------------------------------- */
  placePalmTrees(trackDef, count = 70, isMiami = false) {
    const palmTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3f28, roughness: 0.85 });
    const palmFrondMat = new THREE.MeshStandardMaterial({ color: 0x22553b, roughness: 0.4 });
    const uplightMat = new THREE.MeshBasicMaterial({ color: isMiami ? 0xff007f : 0xffd600 });

    let placed = 0;
    for (let attempts = 0; attempts < count * 3 && placed < count; attempts++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 145 + Math.random() * 260;
      const px = Math.cos(angle) * dist;
      const pz = Math.sin(angle) * dist;

      // Never place trees on the track road
      if (this.isNearTrack(px, pz, trackDef, 48)) continue;

      const palm = new THREE.Group();
      palm.position.set(px, 0, pz);

      // Curved Trunk (9m tall)
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 9.5, 8), palmTrunkMat);
      trunk.position.y = 4.75;
      trunk.rotation.z = (Math.random() - 0.5) * 0.16;
      palm.add(trunk);

      // Palm Crown fronds
      for (let f = 0; f < 7; f++) {
        const frondAngle = (f / 7) * Math.PI * 2;
        const frond = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.15, 0.95), palmFrondMat);
        frond.rotation.y = frondAngle;
        frond.rotation.z = -0.38;
        frond.position.set(Math.cos(frondAngle) * 2.0, 9.3, Math.sin(frondAngle) * 2.0);
        palm.add(frond);
      }

      // Uplight lamp at base
      if (isMiami && Math.random() > 0.4) {
        const uplight = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8), uplightMat);
        uplight.position.y = 0.15;
        palm.add(uplight);
      }

      this.environmentGroup.add(palm);
    }
  }

  placeStreetlightsAlongCircuit(trackDef, lightColor = 0xffe6a3, turnOnLights = true) {
    const wps = trackDef.waypoints;
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x2f3442, roughness: 0.5 });
    const bulbMat = new THREE.MeshBasicMaterial({ color: lightColor });
    const roadW = trackDef.roadWidth || 36;
    const offset = roadW / 2 + 4.5;

    for (let i = 0; i < wps.length; i += 2) {
      const p = wps[i];
      const pNext = wps[(i + 1) % wps.length];
      const pz = (p.z !== undefined) ? p.z : p.y;
      const pNextZ = (pNext.z !== undefined) ? pNext.z : pNext.y;

      const dx = pNext.x - p.x;
      const dz = pNextZ - pz;
      const angle = Math.atan2(dx, dz);
      const nx = -Math.cos(angle);
      const nz = Math.sin(angle);

      const lightGroup = new THREE.Group();
      lightGroup.position.set(p.x + nx * offset, 0, pz + nz * offset);
      lightGroup.rotation.y = angle;

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 9, 8), poleMat);
      pole.position.y = 4.5;
      lightGroup.add(pole);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.2, 0.3), poleMat);
      arm.position.set(1.5, 9, 0);
      lightGroup.add(arm);

      const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.5), bulbMat);
      bulb.position.set(3.0, 8.8, 0);
      lightGroup.add(bulb);

      if (turnOnLights) {
        // High-performance ground illumination decal (avoids heavy hardware spotlight uniforms)
        if (!this.streetlightGlowGeo) {
          this.streetlightGlowGeo = new THREE.PlaneGeometry(8, 8);
          this.streetlightGlowGeo.rotateX(-Math.PI / 2);
          this.streetlightGlowMat = new THREE.MeshBasicMaterial({
            color: lightColor,
            transparent: true,
            opacity: 0.22,
            depthWrite: false
          });
        }
        const glowPool = new THREE.Mesh(this.streetlightGlowGeo, this.streetlightGlowMat);
        glowPool.position.set(3.0, 0.02, 0);
        lightGroup.add(glowPool);
      }

      this.environmentGroup.add(lightGroup);
    }
  }

  placeGuardrails(trackDef, railColor = 0x888888) {
    if (!this.trackCurve) return;
    const roadW = trackDef.roadWidth || 36;
    const railMat = new THREE.MeshStandardMaterial({ color: railColor, roughness: 0.5, metalness: 0.7 });
    const railGeo = new THREE.TubeGeometry(this.trackCurve, 260, roadW / 2 + 2.5, 8, true);
    const pos = railGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, 0.45);
    }
    railGeo.computeVertexNormals();
    const railMesh = new THREE.Mesh(railGeo, railMat);
    this.environmentGroup.add(railMesh);
  }

  buildCheckpointGates(trackDef) {
    this.checkpoints3D = [];
    const wps = trackDef.waypoints;
    const roadW = trackDef.roadWidth || 36;

    const gateMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.75
    });

    wps.forEach((wp, idx) => {
      const wpNext = wps[(idx + 1) % wps.length];
      const wpz = (wp.z !== undefined) ? wp.z : wp.y;
      const nextz = (wpNext.z !== undefined) ? wpNext.z : wpNext.y;

      const angle = Math.atan2(wpNext.x - wp.x, nextz - wpz);

      const gateGroup = new THREE.Group();
      gateGroup.position.set(wp.x, 0, wpz);
      gateGroup.rotation.y = angle;

      const span = roadW + 10;
      const pillarGeo = new THREE.CylinderGeometry(0.4, 0.4, 12, 8);
      const pillarL = new THREE.Mesh(pillarGeo, gateMat);
      pillarL.position.set(-span / 2, 6, 0);

      const pillarR = new THREE.Mesh(pillarGeo, gateMat);
      pillarR.position.set(span / 2, 6, 0);

      const barGeo = new THREE.BoxGeometry(span + 2, 0.7, 0.7);
      const bar = new THREE.Mesh(barGeo, gateMat);
      bar.position.set(0, 12, 0);

      gateGroup.add(pillarL, pillarR, bar);
      this.environmentGroup.add(gateGroup);
      this.checkpoints3D.push(gateGroup);
    });
  }

  /* --------------------------------------------------------------------------
     F1 CIRCUIT: AUTODROMO NAZIONALE MONZA (Temple of Speed)
     -------------------------------------------------------------------------- */
  buildMonzaScenery(trackDef, timeOfDay) {
    // 1. F1 Pit Complex & Pit Lane Wall along Rettifilo Straight
    this.buildMonzaPitComplex(trackDef);

    // 2. F1 3D Starting Gantry with 5 Red Lights overhead
    this.buildF1StartingGantry3D(trackDef);

    // 3. Rolex, Pirelli, and DHL Overhead Sponsor Gantries
    this.buildMonzaSponsorGantries(trackDef);

    // 4. Italian Grand Prix Tifosi Grandstands along Rettifilo, Ascari & Parabolica
    this.buildMonzaGrandstands(trackDef);

    // 5. Official F1 Distance Braking Boards (150m, 100m, 50m) and DRS Activation signs
    this.buildF1TracksideSignage(trackDef);

    // 6. Lush Parco di Monza Poplar and Pine Trees (strictly setback from road)
    this.buildMonzaParklandTrees(trackDef);
  }

  buildF1CircuitTrackMarkings(trackDef, curve, points, roadW) {
    // Starting Grid Boxes: Staggered FIA Grid Slots with Pole Position
    const gridMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const poleLineMat = new THREE.MeshBasicMaterial({ color: 0xffd600 });

    const gridSlots = trackDef.startGrid || [
      { x: -80, z: 256, angle: Math.PI / 2 },
      { x: -120, z: 264, angle: Math.PI / 2 },
      { x: -160, z: 256, angle: Math.PI / 2 },
      { x: -200, z: 264, angle: Math.PI / 2 }
    ];

    gridSlots.forEach((slot, idx) => {
      const slotGroup = new THREE.Group();
      slotGroup.position.set(slot.x, 0.045, slot.z);
      slotGroup.rotation.y = slot.angle || (Math.PI / 2);

      // Grid box outline
      const boxW = 2.4;
      const boxL = 5.2;
      const boxThick = 0.22;

      // Front line
      const frontLine = new THREE.Mesh(new THREE.PlaneGeometry(boxW, boxThick), idx === 0 ? poleLineMat : gridMat);
      frontLine.rotation.x = -Math.PI / 2;
      frontLine.position.set(0, 0, boxL / 2);
      slotGroup.add(frontLine);

      // Side lines
      const leftLine = new THREE.Mesh(new THREE.PlaneGeometry(boxThick, boxL), gridMat);
      leftLine.rotation.x = -Math.PI / 2;
      leftLine.position.set(-boxW / 2, 0, 0);
      const rightLine = new THREE.Mesh(new THREE.PlaneGeometry(boxThick, boxL), gridMat);
      rightLine.rotation.x = -Math.PI / 2;
      rightLine.position.set(boxW / 2, 0, 0);
      slotGroup.add(leftLine, rightLine);

      this.environmentGroup.add(slotGroup);
    });

    // Outer Tarmac Red & White Curbs around corner apexes
    const curbRed = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.8 });
    const curbWhite = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.8 });

    // Build apex piano kerbs near chicanes (Rettifilo at Turn 1/2, Roggia, Ascari)
    const apexLocations = [
      { x: 380, z: 235, len: 45, ang: 0.3 },
      { x: 410, z: 200, len: 40, ang: 1.2 },
      { x: 375, z: -155, len: 45, ang: -0.4 },
      { x: 230, z: -275, len: 50, ang: -0.9 },
      { x: -320, z: -225, len: 55, ang: 0.8 },
      { x: -400, z: 90, len: 65, ang: 1.5 }
    ];

    apexLocations.forEach(apex => {
      const kerbGroup = new THREE.Group();
      kerbGroup.position.set(apex.x, 0.05, apex.z);
      kerbGroup.rotation.y = apex.ang;

      const numSlices = Math.floor(apex.len / 1.8);
      for (let s = 0; s < numSlices; s++) {
        const mat = (s % 2 === 0) ? curbRed : curbWhite;
        const slice = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 1.4), mat);
        slice.position.set((s - numSlices / 2) * 1.6, 0, 0);
        kerbGroup.add(slice);
      }
      this.environmentGroup.add(kerbGroup);
    });
  }

  buildMonzaPitComplex(trackDef) {
    const pitBuilding = new THREE.Group();
    // Positioned parallel to Rettifilo main straight (road is at z = 260, pit building is at z = 292)
    pitBuilding.position.set(-150, 0, 292);

    const concMat = new THREE.MeshStandardMaterial({ color: 0xd8dde6, roughness: 0.6, metalness: 0.2 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x1a2b3c, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.85 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x181a20, roughness: 0.4 });
    const redGlow = new THREE.MeshBasicMaterial({ color: 0xff0033 });

    // Main 160m Long Modern Two-Story Pit Building
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(160, 11, 20), concMat);
    mainBody.position.y = 5.5;
    pitBuilding.add(mainBody);

    // Upper VIP Paddock Club continuous glass facade
    const vipGlass = new THREE.Mesh(new THREE.BoxGeometry(158, 4.2, 0.4), glassMat);
    vipGlass.position.set(0, 8.2, -10.1);
    pitBuilding.add(vipGlass);

    // 8 Authentic F1 Team Pit Garages along ground floor
    const f1Teams = [
      { name: 'SCUDERIA FERRARI', color: 0xe60000 },
      { name: 'RED BULL RACING', color: 0x001a4d },
      { name: 'MERCEDES-AMG F1', color: 0x00a19c },
      { name: 'MCLAREN F1 TEAM', color: 0xff8000 },
      { name: 'ASTON MARTIN F1', color: 0x00594f },
      { name: 'ALPINE F1 TEAM', color: 0x0078d0 },
      { name: 'WILLIAMS RACING', color: 0x005aff },
      { name: 'HAAS F1 TEAM', color: 0x7c7c7c }
    ];

    f1Teams.forEach((team, idx) => {
      const gx = -70 + idx * 20;

      // Pit Garage Opening
      const garageDoor = new THREE.Mesh(new THREE.BoxGeometry(16, 4.2, 0.4), darkMat);
      garageDoor.position.set(gx, 2.2, -10.1);
      pitBuilding.add(garageDoor);

      // Team Header Neon Nameplate
      const nameplateMat = new THREE.MeshBasicMaterial({ color: team.color });
      const nameplate = new THREE.Mesh(new THREE.BoxGeometry(16, 0.8, 0.6), nameplateMat);
      nameplate.position.set(gx, 4.8, -10.2);
      pitBuilding.add(nameplate);
    });

    // Concrete Pit Wall separating Pit Lane from Track
    const pitWall = new THREE.Mesh(new THREE.BoxGeometry(165, 1.3, 0.8), concMat);
    pitWall.position.set(0, 0.65, -16.5);
    pitBuilding.add(pitWall);

    // Team Pit Perches & Radio Consoles on Pit Wall
    for (let p = 0; p < 8; p++) {
      const px = -65 + p * 18;
      const perch = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.2, 2.2), darkMat);
      perch.position.set(px, 1.4, -16.5);
      pitBuilding.add(perch);

      // Mini timing display screens
      const screen = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.9, 0.2), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
      screen.position.set(px, 2.0, -17.65);
      pitBuilding.add(screen);
    }

    this.environmentGroup.add(pitBuilding);
  }

  buildF1StartingGantry3D(trackDef) {
    // Positioned right at start/finish line on Rettifilo straight
    const gantry = new THREE.Group();
    gantry.position.set(-340, 0, 260);

    const steelMat = new THREE.MeshStandardMaterial({ color: 0x22262e, roughness: 0.4, metalness: 0.8 });
    const blackMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
    const rolexGreen = new THREE.MeshBasicMaterial({ color: 0x006039 });
    const rolexGold = new THREE.MeshBasicMaterial({ color: 0xffd700 });

    const span = 28; // spans across the 26m track

    // Left & Right Support Truss Pillars
    const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 12, 8), steelMat);
    pL.position.set(0, 6, -span / 2);
    const pR = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 12, 8), steelMat);
    pR.position.set(0, 6, span / 2);
    gantry.add(pL, pR);

    // Overhead Heavy Truss Crossbeam
    const beam = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, span + 2), steelMat);
    beam.position.set(0, 11, 0);
    gantry.add(beam);

    // Central Starting Light Enclosure (Black housing)
    const boxGeo = new THREE.BoxGeometry(0.8, 1.8, 9.5);
    const lightBox = new THREE.Mesh(boxGeo, blackMat);
    lightBox.position.set(-0.9, 9.8, 0);
    gantry.add(lightBox);

    // 5 Pairs of Red LED Cluster Lights
    this.startingGantryLights3D = [];
    for (let i = 0; i < 5; i++) {
      const zPos = -3.2 + i * 1.6;
      const lightGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.2, 16);
      lightGeo.rotateZ(Math.PI / 2);

      const lightMat = new THREE.MeshStandardMaterial({
        color: 0x2a0408,
        emissive: 0x000000,
        roughness: 0.2
      });
      const lightMesh = new THREE.Mesh(lightGeo, lightMat);
      lightMesh.position.set(-1.25, 9.8, zPos);
      gantry.add(lightMesh);
      this.startingGantryLights3D.push(lightMesh);
    }

    // Rolex Sponsor Sign above Start Line
    const rolexSign = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 6.5), rolexGreen);
    rolexSign.position.set(-1.0, 12.0, 0);
    const rolexCrown = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 2.0), rolexGold);
    rolexCrown.position.set(-1.1, 12.0, 0);
    gantry.add(rolexSign, rolexCrown);

    this.environmentGroup.add(gantry);
  }

  setF1StartingLights3D(activeCount) {
    if (!this.startingGantryLights3D) return;
    for (let i = 0; i < 5; i++) {
      const mesh = this.startingGantryLights3D[i];
      if (mesh && mesh.material) {
        if (i < activeCount) {
          mesh.material.color.setHex(0xff0022);
          if (mesh.material.emissive) mesh.material.emissive.setHex(0xff0011);
        } else {
          mesh.material.color.setHex(0x2a0408);
          if (mesh.material.emissive) mesh.material.emissive.setHex(0x000000);
        }
      }
    }
  }

  buildMonzaSponsorGantries(trackDef) {
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x2a2f38, roughness: 0.4, metalness: 0.7 });
    const pirelliYellow = new THREE.MeshBasicMaterial({ color: 0xffd600 });
    const pirelliRed = new THREE.MeshBasicMaterial({ color: 0xd90429 });
    const dhlYellow = new THREE.MeshBasicMaterial({ color: 0xffcc00 });

    // 1. Pirelli Gantry at Rettifilo (x = 100, z = 260)
    const gantry1 = new THREE.Group();
    gantry1.position.set(100, 0, 260);
    gantry1.rotation.y = Math.PI / 2;

    const span = 28;
    const pL1 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 11, 8), steelMat);
    pL1.position.set(-span / 2, 5.5, 0);
    const pR1 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 11, 8), steelMat);
    pR1.position.set(span / 2, 5.5, 0);
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(span + 2, 1.6, 1.2), pirelliYellow);
    b1.position.set(0, 10.5, 0);
    const redStripe = new THREE.Mesh(new THREE.BoxGeometry(span + 2.1, 0.4, 1.25), pirelliRed);
    redStripe.position.set(0, 10.5, 0);
    gantry1.add(pL1, pR1, b1, redStripe);
    this.environmentGroup.add(gantry1);

    // 2. DHL Fastest Lap Gantry on Serraglio Straight (x = -160, z = -320)
    const gantry2 = new THREE.Group();
    gantry2.position.set(-160, 0, -320);
    gantry2.rotation.y = Math.PI / 2;
    const pL2 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 11, 8), steelMat);
    pL2.position.set(-span / 2, 5.5, 0);
    const pR2 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 11, 8), steelMat);
    pR2.position.set(span / 2, 5.5, 0);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(span + 2, 1.6, 1.2), dhlYellow);
    b2.position.set(0, 10.5, 0);
    gantry2.add(pL2, pR2, b2);
    this.environmentGroup.add(gantry2);
  }

  buildMonzaGrandstands(trackDef) {
    const concMat = new THREE.MeshStandardMaterial({ color: 0xc4c9d4, roughness: 0.7 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.5 }); // Ferrari red roof
    const seatMatRed = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.6 });
    const seatMatWhite = new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.6 });

    const createGrandstand = (x, z, angle, length = 60) => {
      const stand = new THREE.Group();
      stand.position.set(x, 0, z);
      stand.rotation.y = angle;

      // Tiered stepped structure
      const tiers = 6;
      for (let t = 0; t < tiers; t++) {
        const tierGeo = new THREE.BoxGeometry(length, 1.2, 2.0);
        const tier = new THREE.Mesh(tierGeo, concMat);
        tier.position.set(0, (t + 1) * 1.2, t * 2.0);
        stand.add(tier);

        // Seating row
        const smat = (t % 2 === 0) ? seatMatRed : seatMatWhite;
        const seatRow = new THREE.Mesh(new THREE.BoxGeometry(length * 0.95, 0.4, 0.6), smat);
        seatRow.position.set(0, (t + 1) * 1.2 + 0.5, t * 2.0);
        stand.add(seatRow);
      }

      // Slanted Overhanging Roof
      const roof = new THREE.Mesh(new THREE.BoxGeometry(length + 4, 0.4, 16), roofMat);
      roof.rotation.x = 0.2;
      roof.position.set(0, tiers * 1.2 + 4.5, 6);
      stand.add(roof);

      return stand;
    };

    // 1. Tribuna Rettifilo (Main grandstand opposite the pits)
    this.environmentGroup.add(createGrandstand(-150, 226, 0, 90));

    // 2. Tribuna Variante Ascari
    this.environmentGroup.add(createGrandstand(-330, -250, 0.8, 65));

    // 3. Tribuna Curva Parabolica
    this.environmentGroup.add(createGrandstand(-445, 120, 1.6, 75));
  }

  buildF1TracksideSignage(trackDef) {
    const boardMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const textMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const drsGreen = new THREE.MeshBasicMaterial({ color: 0x00e676 });

    const createBrakeBoard = (x, z, angle, distText) => {
      const boardGroup = new THREE.Group();
      boardGroup.position.set(x, 0, z);
      boardGroup.rotation.y = angle;

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6), textMat);
      post.position.y = 1.1;
      const plate = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.1), boardMat);
      plate.position.y = 1.8;
      const textStripe = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 0.12), textMat);
      textStripe.position.y = 1.8;

      boardGroup.add(post, plate, textStripe);
      return boardGroup;
    };

    // Braking boards on left approach to Rettifilo Chicane
    this.environmentGroup.add(createBrakeBoard(90, 246, Math.PI / 2, '150'));
    this.environmentGroup.add(createBrakeBoard(140, 246, Math.PI / 2, '100'));
    this.environmentGroup.add(createBrakeBoard(190, 246, Math.PI / 2, '50'));

    // Braking boards before Variante Ascari
    this.environmentGroup.add(createBrakeBoard(-280, -245, 0.8, '100'));
    this.environmentGroup.add(createBrakeBoard(-305, -230, 0.8, '50'));

    // DRS Zone 1 Sign on Rettifilo
    const drsSign1 = new THREE.Group();
    drsSign1.position.set(-60, 0, 275);
    drsSign1.rotation.y = Math.PI / 2;
    const drsPlate = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 0.15), drsGreen);
    drsPlate.position.y = 2.4;
    const postD = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.4, 8), textMat);
    postD.position.y = 1.2;
    drsSign1.add(drsPlate, postD);
    this.environmentGroup.add(drsSign1);
  }

  buildMonzaParklandTrees(trackDef) {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3525, roughness: 0.9 });
    const poplarMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.75 });
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.8 });

    // 120 lush park trees scattered around Parco di Monza, guaranteed clear of tarmac
    for (let i = 0; i < 120; i++) {
      const angle = (i / 120) * Math.PI * 2;
      const rad = 180 + ((i * 37) % 360);
      const tx = Math.cos(angle) * rad;
      const tz = Math.sin(angle) * rad;

      // Ensure 24 meters clearance from the road centerline
      if (this.isNearTrack(tx, tz, trackDef, 24)) continue;

      const tree = new THREE.Group();
      tree.position.set(tx, 0, tz);

      const isPoplar = (i % 2 === 0);
      if (isPoplar) {
        // Tall Italian Cypress / Poplar
        const h = 14 + (i % 8);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, h * 0.3, 8), trunkMat);
        trunk.position.y = (h * 0.3) / 2;
        const foliage = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 2.2, h * 0.75, 8), poplarMat);
        foliage.position.y = h * 0.6;
        tree.add(trunk, foliage);
      } else {
        // Mediterranean Stone Pine
        const h = 10 + (i % 6);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.55, h * 0.6, 8), trunkMat);
        trunk.position.y = (h * 0.6) / 2;
        const crown = new THREE.Mesh(new THREE.SphereGeometry(3.5, 8, 6), pineMat);
        crown.scale.set(1.4, 0.65, 1.4);
        crown.position.y = h * 0.85;
        tree.add(trunk, crown);
      }

      this.environmentGroup.add(tree);
    }
  }

  flashCheckpoint(index) {
    const gate = this.checkpoints3D[index];
    if (!gate) return;
    gate.traverse(child => {
      if (child.isMesh) {
        child.material.color.setHex(0x00f59b);
        setTimeout(() => child.material.color.setHex(0x00f0ff), 650);
      }
    });
  }

  update(dt) {
    for (const anim of this.animatedObjects) {
      anim.update(dt);
    }
  }
}

window.World3D = World3D;
