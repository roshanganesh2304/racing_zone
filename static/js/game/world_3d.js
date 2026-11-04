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
    if (biome === 'vice_city' || trackDef.slug === 'vice-city') {
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

    if (biome === 'vice_city') {
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

  buildRoadNetwork(trackDef, biome) {
    const wps = trackDef.waypoints;
    const roadW = trackDef.roadWidth || 36; // 36m wide authentic multi-lane highway

    const points = wps.map(p => new THREE.Vector3(p.x, 0.05, (p.z !== undefined ? p.z : p.y)));
    const curve = this.trackCurve || new THREE.CatmullRomCurve3(points, true);
    this.trackCurve = curve;

    // 1. High-Grade Interstate Asphalt
    const roadMat = new THREE.MeshStandardMaterial({
      color: trackDef.surfaceColor || 0x181c24,
      roughness: 0.82,
      metalness: 0.18
    });

    const roadGeo = new THREE.TubeGeometry(curve, 260, roadW / 2, 8, true);
    const pos = roadGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, 0.035);
    }
    roadGeo.computeVertexNormals();

    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    this.environmentGroup.add(roadMesh);

    // 2. Concrete Shoulder Curbs / Outer Barriers
    const curbGeo = new THREE.TubeGeometry(curve, 260, roadW / 2 + 1.2, 8, true);
    const cpos = curbGeo.attributes.position;
    for (let i = 0; i < cpos.count; i++) {
      cpos.setY(i, 0.025);
    }
    curbGeo.computeVertexNormals();

    const curbMat = new THREE.MeshStandardMaterial({
      color: 0x4a505c, // Concrete grey shoulder
      roughness: 0.9
    });
    const curbMesh = new THREE.Mesh(curbGeo, curbMat);
    this.environmentGroup.add(curbMesh);

    // 3. Multi-Lane Striping: Dashed White Lane Lines & Solid Yellow Shoulders
    this.buildHighwayLaneStripes(curve, roadW);

    // 4. Overhead Interstate Highway Gantry Signs (Spanning the Road)
    this.buildOverheadHighwayGantries(trackDef, points, curve, roadW);

    // 5. Elevated Concrete Highway Overpass Bridges
    this.buildHighwayOverpassBridges(points, curve, roadW);

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

      const bridgeLen = roadW + 36;
      const bridgeHeight = 9.2;

      // Concrete Deck Slab
      const deck = new THREE.Mesh(new THREE.BoxGeometry(bridgeLen, 1.8, 16), bridgeMat);
      deck.position.y = bridgeHeight;
      deck.castShadow = true;
      deck.receiveShadow = true;
      bridgeGroup.add(deck);

      // Support Piers outside Shoulders (7m clearance from road edge)
      const pier1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, bridgeHeight - 0.9, 4.0), bridgeMat);
      pier1.position.set(-roadW / 2 - 7.0, (bridgeHeight - 0.9) / 2, 0);
      bridgeGroup.add(pier1);

      const pier2 = new THREE.Mesh(new THREE.BoxGeometry(2.4, bridgeHeight - 0.9, 4.0), bridgeMat);
      pier2.position.set(roadW / 2 + 7.0, (bridgeHeight - 0.9) / 2, 0);
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

      // Skip areas reserved for landmarks
      if (Math.hypot(bx - 160, bz - (-180)) < 70) continue;
      if (Math.hypot(bx - (-290), bz - (-360)) < 90) continue;
      if (Math.hypot(bx - 485, bz - 30) < 100) continue;
      if (this.isNearTrack(bx, bz, trackDef, 75)) continue;

      const bw = 28 + Math.random() * 32;
      const bd = 28 + Math.random() * 32;
      const bh = 55 + Math.random() * 125;

      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), i % 2 === 0 ? towerMatDark : towerMatGlass);
      bMesh.position.set(bx, bh / 2, bz);
      bMesh.castShadow = (i < 8);
      bMesh.receiveShadow = true;
      this.environmentGroup.add(bMesh);

      // Register building collider for collision pushback (strictly outside track buffer)
      this.buildingColliders.push({ x: bx, z: bz, radius: Math.max(bw, bd) * 0.5 });

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
     -------------------------------------------------------------------------- */
  buildViceCityScenery(trackDef, timeOfDay) {
    const isNight = (timeOfDay === 'night');
    const isSunset = (timeOfDay === 'sunset');

    // 1. Ocean Drive Pastel Art Deco Hotel Row
    const hotelPastels = [0xffcbf2, 0xa0c4ff, 0xfde2e4, 0xcaffbf, 0xffd6a5];
    const neonPink = new THREE.MeshBasicMaterial({ color: 0xff007f });
    const neonCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const neonGold = new THREE.MeshBasicMaterial({ color: 0xffd600 });

    const hotelNames = ['OCEAN DRIVE', 'MALIBU CLUB', 'CORAL PALACE', 'VICE POINT', 'COLONY HOTEL', 'TROPICANA'];

    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2;
      const rad = 230 + (i % 3) * 80;
      const hx = Math.cos(angle) * rad;
      const hz = Math.sin(angle) * rad;
      if (this.isNearTrack(hx, hz, trackDef, 70)) continue;

      const hotel = new THREE.Group();
      hotel.position.set(hx, 0, hz);
      hotel.rotation.y = -angle + Math.PI / 2;

      const hw = 26 + Math.random() * 12;
      const hh = 22 + Math.random() * 26;
      const hd = 22 + Math.random() * 10;
      const pColor = hotelPastels[i % hotelPastels.length];

      // Pastel Facade
      const bodyMat = new THREE.MeshStandardMaterial({ color: pColor, roughness: 0.5 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(hw, hh, hd), bodyMat);
      body.position.y = hh / 2;
      hotel.add(body);

      this.buildingColliders.push({ x: hx, z: hz, radius: Math.max(hw, hd) * 0.5 });

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

        // Glowing Neon Hotel Signboard
        const sign = new THREE.Mesh(new THREE.BoxGeometry(hw * 0.65, 3.8, 0.6), (i % 2 === 0 ? neonCyan : neonPink));
        sign.position.set(0, hh + 2.2, 0);
        hotel.add(sign);
      }

      this.environmentGroup.add(hotel);
    }

    // 2. Marina Docked Speedboats & Luxury Yachts
    const boatHullMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const boatGlassMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, roughness: 0.1 });
    for (let b = 0; b < 10; b++) {
      const boat = new THREE.Group();
      boat.position.set(-320 + b * 75, 0, 340 + (b % 2) * 45);

      const hull = new THREE.Mesh(new THREE.BoxGeometry(9, 3.5, 24), boatHullMat);
      hull.position.y = 1.0;
      boat.add(hull);

      const flybridge = new THREE.Mesh(new THREE.BoxGeometry(6.5, 3.2, 11), boatGlassMat);
      flybridge.position.set(0, 3.8, -2);
      boat.add(flybridge);

      this.environmentGroup.add(boat);
    }

    // 3. Miami Royal Palm Trees with Pink/Cyan Uplights
    this.placePalmTrees(trackDef, 90, true);

    // 4. Streetlights
    this.placeStreetlightsAlongCircuit(trackDef, 0xff007f, true);
  }

  /* --------------------------------------------------------------------------
     GTA CITY 3: LIBERTY CITY (New York)
     Landmarks: Star Junction (Times Square) Giant Billboards, Rotterdam Spire
     -------------------------------------------------------------------------- */
  buildLibertyCityScenery(trackDef, timeOfDay) {
    const isNight = (timeOfDay === 'night');
    const brickMat = new THREE.MeshStandardMaterial({ color: 0x4a2820, roughness: 0.85 });
    const limestoneMat = new THREE.MeshStandardMaterial({ color: 0x9e9a93, roughness: 0.4 });
    const darkGlass = new THREE.MeshStandardMaterial({ color: 0x111622, roughness: 0.2, metalness: 0.8 });

    // 1. Rotterdam Tower (Empire State Spire)
    this.buildRotterdamTower(-140, 0, -180);

    // 2. Broker Bridge Overhead Suspension Towers
    this.buildSuspensionBridgeArch(0, 0, 250, trackDef.roadWidth || 28);

    // 3. Star Junction Giant Video Billboards & Manhattan Towers
    const billboardColors = [0xff0055, 0x00f0ff, 0xffd600, 0x00f59b, 0xff7b00];
    for (let i = 0; i < 44; i++) {
      const angle = (i / 44) * Math.PI * 2;
      const rad = 240 + (i % 4) * 85;
      const bx = Math.cos(angle) * rad;
      const bz = Math.sin(angle) * rad;

      if (Math.hypot(bx - (-140), bz - (-180)) < 70) continue;
      if (this.isNearTrack(bx, bz, trackDef, 75)) continue;

      const bw = 28 + Math.random() * 28;
      const bd = 28 + Math.random() * 28;
      const bh = 65 + Math.random() * 135;

      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), i % 3 === 0 ? brickMat : (i % 3 === 1 ? limestoneMat : darkGlass));
      bMesh.position.set(bx, bh / 2, bz);
      bMesh.castShadow = (i < 8);
      bMesh.receiveShadow = true;
      this.environmentGroup.add(bMesh);
      this.buildingColliders.push({ x: bx, z: bz, radius: Math.max(bw, bd) * 0.5 });

      // Towering Times Square Billboards
      if (bh > 70) {
        const numBoards = Math.min(3, Math.floor(bh / 35));
        for (let b = 1; b <= numBoards; b++) {
          const bColor = billboardColors[(i + b) % billboardColors.length];
          const ad = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.8, 14, 0.7), new THREE.MeshBasicMaterial({ color: bColor }));
          ad.position.set(bx, b * 26, bz + bd / 2 + 0.45);
          this.environmentGroup.add(ad);
        }
      }
    }

    // Streetlights
    this.placeStreetlightsAlongCircuit(trackDef, 0xffd166, isNight);
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

    // Twin Gothic Arch Towers placed outside the road shoulders (road runs along X, span is along Z)
    const towerH = 52;
    const clearWidth = roadW + 14; // 14m wider than roadway
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
     Landmarks: The Camelot Obsidian Pyramid & Sky Beam, Casino Marquees, Dice
     -------------------------------------------------------------------------- */
  buildLasVenturasScenery(trackDef, timeOfDay) {
    const isNight = (timeOfDay === 'night');

    // 1. The Camelot / Luxor Giant Obsidian Pyramid (85m wide) & Blinding Sky Beam!
    this.buildCasinoPyramid(-160, 0, -100);

    // 2. The Strip Casino Towers & Glowing Marquees
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.2, metalness: 0.85 });
    const mirrorGlass = new THREE.MeshStandardMaterial({ color: 0x1f1f2e, roughness: 0.1, metalness: 0.95 });
    const casinoNeonCols = [0xffd600, 0x9d4edd, 0xff0055, 0x00f0ff];

    const casinoNames = ["CALIGULA'S PALACE", "THE VISAGE", "FOUR DRAGONS", "CASINO ROYALE", "PIRATES COVE"];

    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const rad = 240 + (i % 4) * 85;
      const bx = Math.cos(angle) * rad;
      const bz = Math.sin(angle) * rad;

      if (Math.hypot(bx - (-160), bz - (-100)) < 85) continue;
      if (this.isNearTrack(bx, bz, trackDef, 75)) continue;

      const bw = 32 + Math.random() * 26;
      const bd = 32 + Math.random() * 26;
      const bh = 60 + Math.random() * 110;

      const tower = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), i % 2 === 0 ? goldMat : mirrorGlass);
      tower.position.set(bx, bh / 2, bz);
      tower.castShadow = (i < 8);
      tower.receiveShadow = true;
      this.environmentGroup.add(tower);
      this.buildingColliders.push({ x: bx, z: bz, radius: Math.max(bw, bd) * 0.5 });

      // Huge Neon Casino Marquee Signs
      if (isNight) {
        const nCol = casinoNeonCols[i % casinoNeonCols.length];
        const marquee = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.8, 9, 0.8), new THREE.MeshBasicMaterial({ color: nCol }));
        marquee.position.set(bx, 28, bz + bd / 2 + 0.5);
        this.environmentGroup.add(marquee);
      }
    }

    // 3. Giant 3D Rolling Dice Sculptures at Casino Entrances
    this.buildGiantCasinoDice(60, 0, 200);

    // 4. Palm trees lining the Strip
    this.placePalmTrees(trackDef, 75);

    // 5. Golden Casino Streetlights
    this.placeStreetlightsAlongCircuit(trackDef, 0xffd600, true);
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
     -------------------------------------------------------------------------- */
  buildBlaineCountyScenery(trackDef, timeOfDay) {
    const isNight = (timeOfDay === 'night');

    // 1. Colossal Mount Chiliad Mountain Massif
    this.buildMountChiliad(360, 0, -320);

    // 2. Route 68 Desert Gas Station & Motel
    this.buildRoute68GasStation(-120, 0, 210);

    // 3. Spinning Wind Turbine Farm (6 wind towers)
    this.buildWindTurbineFarm();

    // 4. Red Rock Canyon Buttes & Saguaro Cacti
    this.buildDesertMesasAndCacti(trackDef);

    // Guardrails & Desert Highway Lighting
    this.placeGuardrails(trackDef, 0xb55428);
    this.placeStreetlightsAlongCircuit(trackDef, 0xffd166, isNight);
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
      const wx = 120 + w * 45;
      const wz = -290 - (w % 2) * 50;

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

    // Tiered Mesas
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const rad = 260 + (i % 3) * 90;
      const rx = Math.cos(angle) * rad;
      const rz = Math.sin(angle) * rad;

      const rw = 45 + Math.random() * 55;
      const rh = 35 + Math.random() * 70;

      const mesa = new THREE.Mesh(new THREE.CylinderGeometry(rw * 0.7, rw, rh, 7), rockMat);
      mesa.position.set(rx, rh / 2, rz);
      this.environmentGroup.add(mesa);
    }

    // 3D Saguaro Cacti
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 140 + Math.random() * 280;
      const cx = Math.cos(angle) * dist;
      const cz = Math.sin(angle) * dist;

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
