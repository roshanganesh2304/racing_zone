/**
 * RACING ZONE - Authentic 3D Real-Life Supercar & Sports Car Mesh Builders (Three.js)
 * High-fidelity procedural models featuring authentic silhouettes, functional aerodynamics,
 * generation-correct headlights, signature taillights, detailed cockpits, and multi-spoke wheels.
 */

window.CarModels3D = {
  // Cache of normalized THREE.Group models keyed by car slug
  cachedModels: {},
  // Pending load callbacks keyed by car slug
  loadingCallbacks: {},
  // Tracks loading status: 'idle' | 'loading' | 'loaded' | 'error'
  loadingStatus: {},

  // Original factory colors matching the authentic 3D source files in /Users/roshan/Downloads/3d-models/
  ORIGINAL_CAR_COLORS: {
    'ferrari-sf90-stradale': '#d40000', // Rosso Corsa Ferrari Red
    'porsche-911-gt3-rs': '#ffffff',     // Carrera RS 2.7 Tribute Pure White & Python Green graphics
    'lamborghini-huracan-sto': '#1c7ed6', // Blu Laufey with Arancio Xanto orange accents
    'bugatti-chiron-ss': '#0a0c10',      // Nocturne Carbon Black & World Record Orange stripes
    'mclaren-765lt': '#ff7300',          // Papaya Spark Orange
    'mercedes-190e-evo2': '#1a1c20',     // Blauschwarz Metallic
    'nissan-gtr-nismo': '#f2f2f2',       // Pearl White with Nismo Red trim
    'nissan-skyline-r34': '#1b3f8b',     // Iconic Bayside Blue
    'bmw-m3-competition': '#00334e',     // Tanzanite Blue Metallic (Authentic FBX)
    'bmw-m5-e39': '#253562',             // Le Mans Blue Metallic (Authentic MTL)
    'f1-2022-ferrari': '#d90429',        // Scuderia Ferrari Matte Rosso Corsa
    'f1-2022-redbull': '#0c162c',        // Oracle Red Bull Racing Navy
    'f1-2022-mercedes': '#c4c9cc',       // Mercedes Silver Arrow
    'mclaren-mp45': '#ffffff',           // Marlboro Senna Red & White
    'f1-2025-concept': '#11141c'         // Active Aero Carbon Black & Cyan
  },

  // Config mapping for all real-life 3D car models
  REAL_MODEL_CONFIGS: {
    'bugatti-chiron-ss': {
      format: 'fbx',
      url: '/static/models/cars/bugatti-chiron-ss/model.fbx',
      resourcePath: '/static/models/cars/bugatti-chiron-ss/',
      targetLength: 4.77
    },
    // Formula 1 Grand Prix 3D Models
    'f1-2022-ferrari': {
      format: 'obj',
      objUrl: '/static/models/cars/f1-2022-ferrari/F1-2022-V3.obj',
      mtlUrl: '/static/models/cars/f1-2022-ferrari/F1-2022-V3.mtl',
      resourcePath: '/static/models/cars/f1-2022-ferrari/',
      targetLength: 5.50
    },
    'f1-2022-redbull': {
      format: 'obj',
      objUrl: '/static/models/cars/f1-2022-redbull/F1-2022-V3.obj',
      mtlUrl: '/static/models/cars/f1-2022-redbull/F1-2022-V3.mtl',
      resourcePath: '/static/models/cars/f1-2022-redbull/',
      targetLength: 5.50
    },
    'f1-2022-mercedes': {
      format: 'obj',
      objUrl: '/static/models/cars/f1-2022-mercedes/F1-2022-V3.obj',
      mtlUrl: '/static/models/cars/f1-2022-mercedes/F1-2022-V3.mtl',
      resourcePath: '/static/models/cars/f1-2022-mercedes/',
      targetLength: 5.50
    },
    'f1-2025-concept': {
      format: 'fbx',
      url: '/static/models/cars/f1-2025-concept/model.fbx',
      resourcePath: '/static/models/cars/f1-2025-concept/',
      rotationY: Math.PI,
      targetLength: 5.50
    },
    'mclaren-mp45': {
      format: 'gltf',
      url: '/static/models/cars/mclaren-mp45/model.glb',
      targetLength: 4.85
    },
    'bmw-m3-competition': {
      format: 'fbx',
      url: '/static/models/cars/bmw-m3-competition/model.fbx',
      resourcePath: '/static/models/cars/bmw-m3-competition/',
      targetLength: 4.79
    },
    'bmw-m5-e39': {
      format: 'obj',
      objUrl: '/static/models/cars/bmw-m5-e39/model.obj',
      mtlUrl: '/static/models/cars/bmw-m5-e39/model.mtl',
      resourcePath: '/static/models/cars/bmw-m5-e39/',
      targetLength: 4.78
    },
    'ferrari-sf90-stradale': {
      format: 'gltf',
      url: '/static/models/cars/ferrari-sf90-stradale/model.glb',
      targetLength: 4.71
    },
    'lamborghini-huracan-sto': {
      format: 'fbx',
      url: '/static/models/cars/lamborghini-huracan-sto/model.fbx',
      resourcePath: '/static/models/cars/lamborghini-huracan-sto/',
      targetLength: 4.55
    },
    'mclaren-765lt': {
      format: 'fbx',
      url: '/static/models/cars/mclaren-765lt/model.fbx',
      resourcePath: '/static/models/cars/mclaren-765lt/',
      targetLength: 4.60
    },
    'mercedes-190e-evo2': {
      format: 'gltf',
      url: '/static/models/cars/mercedes-190e-evo2/model.glb',
      targetLength: 4.54
    },
    'nissan-gtr-nismo': {
      format: 'fbx',
      url: '/static/models/cars/nissan-gtr-nismo/model.fbx',
      resourcePath: '/static/models/cars/nissan-gtr-nismo/',
      targetLength: 4.69
    },
    'nissan-skyline-r34': {
      format: 'gltf',
      url: '/static/models/cars/nissan-skyline-r34/model.glb',
      targetLength: 4.60
    },
    'porsche-911-gt3-rs': {
      format: 'fbx',
      url: '/static/models/cars/porsche-911-gt3-rs/model.fbx',
      resourcePath: '/static/models/cars/porsche-911-gt3-rs/',
      targetLength: 4.58
    }
  },

  /**
   * Normalizes an imported raw 3D model:
   * 1. Detects orientation (if length is along X, rotates 90 deg around Y)
   * 2. Scales uniformly to targetLength
   * 3. Centers horizontally (X and Z at 0) and places bottom at ground level (Y = 0)
   * 4. Enables shadows and enhances materials
   */
  normalizeRealModel(rawObj, targetLength = 4.65, slug = '') {
    const wrapper = new THREE.Group();
    wrapper.name = 'normalizedModelRoot';
    wrapper.add(rawObj);
    wrapper.updateMatrixWorld(true);

    // 1. Hide watermarks, 2D UV guides, creator text, and camera/light helpers
    rawObj.traverse(child => {
      const name = (child.name || '').toLowerCase();
      if (
        name.includes('creator') || name.includes('uv_map') ||
        name.includes('plane.001') || name.includes('watermark') ||
        name.includes('helper') || name.includes('camera') ||
        name.includes('light')
      ) {
        child.visible = false;
      }
    });

    // 2. Model-specific rotation offset if configured
    const config = (slug && this.REAL_MODEL_CONFIGS[slug]) ? this.REAL_MODEL_CONFIGS[slug] : {};
    if (config.rotationY) {
      rawObj.rotation.y += config.rotationY;
      rawObj.updateMatrixWorld(true);
    }

    // 3. Measure bounding box based ONLY on visible car geometry
    let box = new THREE.Box3();
    rawObj.traverse(child => {
      if (child.isMesh && child.visible) {
        box.expandByObject(child);
      }
    });
    if (box.isEmpty()) box.setFromObject(wrapper);
    let size = box.getSize(new THREE.Vector3());

    // Orient length along Z (handles CAD models exported standing along Y or sideways along X)
    if (size.y > size.z * 1.2) {
      rawObj.rotation.x -= Math.PI / 2;
      rawObj.updateMatrixWorld(true);
      box.makeEmpty();
      rawObj.traverse(child => {
        if (child.isMesh && child.visible) box.expandByObject(child);
      });
      if (box.isEmpty()) box.setFromObject(wrapper);
      size = box.getSize(new THREE.Vector3());
    }

    if (size.x > size.z * 1.2) {
      rawObj.rotation.y += Math.PI / 2;
      rawObj.updateMatrixWorld(true);
      box.makeEmpty();
      rawObj.traverse(child => {
        if (child.isMesh && child.visible) box.expandByObject(child);
      });
      if (box.isEmpty()) box.setFromObject(wrapper);
      size = box.getSize(new THREE.Vector3());
    }

    // Scale uniformly to authentic car length
    const currentLength = Math.max(0.001, size.z);
    const scale = targetLength / currentLength;
    rawObj.scale.multiplyScalar(scale);
    wrapper.updateMatrixWorld(true);

    // Center on X and Z, align bottom of wheels to ground level Y = 0
    box.makeEmpty();
    rawObj.traverse(child => {
      if (child.isMesh && child.visible) box.expandByObject(child);
    });
    if (box.isEmpty()) box.setFromObject(wrapper);
    const center = box.getCenter(new THREE.Vector3());
    rawObj.position.x -= center.x;
    rawObj.position.z -= center.z;
    rawObj.position.y -= box.min.y;
    wrapper.updateMatrixWorld(true);

    // 4. Enable optimized shadows and upgrade to authentic PBR Standard Materials
    rawObj.traverse(child => {
      if (child.isMesh) {
        child.receiveShadow = true;

        const meshName = (child.name || '').toLowerCase();
        const isGlass = meshName.includes('glass') || meshName.includes('window') || meshName.includes('windshield');
        const isMinorDetail = meshName.includes('interior') || meshName.includes('badge') || meshName.includes('screw') ||
                              meshName.includes('caliper') || meshName.includes('decal') || meshName.includes('seat');
        let isTransparent = false;
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          isTransparent = mats.some(m => m.transparent && m.opacity < 0.92);
        }

        if (isGlass || isTransparent || isMinorDetail) {
          child.castShadow = false;
        } else {
          child.castShadow = true;
        }

        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          const newMats = mats.map(m => {
            const matName = (m.name || '').toLowerCase();
            const isTyre = matName.includes('tyre') || matName.includes('tire') || meshName.includes('wheel') || meshName.includes('tyre') || meshName.includes('tire');
            const isRim = (
              matName.includes('rim') || matName.includes('chrome') || matName.includes('metallic') || matName.includes('brake') ||
              matName.includes('hub') || meshName.includes('hub') || meshName.includes('rim') ||
              matName.includes('spoke') || meshName.includes('spoke') ||
              matName.includes('lip') || meshName.includes('lip') ||
              matName.includes('bolt') || meshName.includes('bolt') ||
              matName.includes('fuelpressure')
            );
            const isDisc = matName.includes('disc') || meshName.includes('disc') || matName.includes('rotor') || meshName.includes('rotor');
            const isCarbon = matName.includes('carbon');
            const isLivery = matName.includes('livery') || matName.includes('paint') || matName.includes('body');

            let roughness = 0.35;
            let metalness = 0.2;
            if (isTyre) {
              roughness = 0.88;
              metalness = 0.05;
            } else if (isRim || isDisc) {
              roughness = 0.22;
              metalness = 0.88;
            } else if (isCarbon) {
              roughness = 0.40;
              metalness = 0.25;
            } else if (isLivery) {
              roughness = 0.18;
              metalness = 0.35;
            }

            let stdMat = m;
            // Upgrade Phong or Basic materials to PBR MeshStandardMaterial
            if (m.isMeshPhongMaterial || m.isMeshBasicMaterial) {
              stdMat = new THREE.MeshStandardMaterial({
                name: m.name,
                color: (m.color && !m.map) ? m.color.clone() : new THREE.Color(0xffffff),
                map: m.map || null,
                roughness: roughness,
                metalness: metalness,
                side: THREE.DoubleSide,
                shadowSide: THREE.BackSide
              });
              if (!isTyre && !isRim && !isDisc && (m.transparent || m.opacity < 0.95)) {
                stdMat.transparent = true;
                stdMat.opacity = m.opacity;
              }
            } else {
              m.side = THREE.DoubleSide;
              m.shadowSide = THREE.BackSide;
              if (m.roughness !== undefined) m.roughness = roughness;
              if (m.metalness !== undefined) m.metalness = metalness;
            }

            // Authentic tyre rubber protection: tyres are always solid opaque matte charcoal
            if (isTyre) {
              stdMat.transparent = false;
              stdMat.opacity = 1.0;
              stdMat.depthWrite = true;
              stdMat.roughness = 0.88;
              stdMat.metalness = 0.05;
              if (!stdMat.map || matName.includes('tire1')) {
                stdMat.map = null;
                stdMat.color = new THREE.Color(0x181818);
              }
            } else if (isRim) {
              stdMat.transparent = false;
              stdMat.opacity = 1.0;
              stdMat.depthWrite = true;
              stdMat.roughness = 0.22;
              stdMat.metalness = 0.88;
              // Rims, spokes, lips, bolts and hubs: preserve authentic texture if present, otherwise solid metallic silver alloy
              if (!stdMat.map || matName.includes('spoke') || matName.includes('lip') || matName.includes('bolt') || matName.includes('fuelpressure')) {
                stdMat.map = null;
                stdMat.color = new THREE.Color(0xd4d8e0);
              }
            } else if (isDisc) {
              stdMat.transparent = false;
              stdMat.opacity = 1.0;
              stdMat.depthWrite = true;
              stdMat.color = new THREE.Color(0x525860);
              stdMat.roughness = 0.35;
              stdMat.metalness = 0.85;
            }

            if (isGlass) {
              stdMat.transparent = true;
              stdMat.opacity = 0.52;
              stdMat.roughness = 0.08;
              stdMat.metalness = 0.88;
              if (stdMat.color && (stdMat.color.r > 0.55 && stdMat.color.g > 0.55 && stdMat.color.b > 0.55)) {
                stdMat.color.setHex(0x18202c);
              }
            }

            return stdMat;
          });

          child.material = Array.isArray(child.material) ? newMats : newMats[0];
        }
      }
    });

    return wrapper;
  },

  /**
   * Generates a soft ambient occlusion ground contact shadow texture.
   */
  createContactShadowTexture() {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, 256, 512);

    // Deep realistic vehicle underfloor ambient occlusion gradient
    const grad = ctx.createRadialGradient(128, 256, 25, 128, 256, 128);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.94)');
    grad.addColorStop(0.35, 'rgba(0, 0, 0, 0.82)');
    grad.addColorStop(0.68, 'rgba(0, 0, 0, 0.45)');
    grad.addColorStop(0.88, 'rgba(0, 0, 0, 0.16)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(128, 256, 112, 235, 0, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  },

  /**
   * Attaches a soft ground contact shadow plane directly underneath the car.
   */
  attachContactShadow(group, width = 2.4, length = 4.8) {
    if (!this.contactShadowTexture) {
      this.contactShadowTexture = this.createContactShadowTexture();
    }
    if (!this.contactShadowTexture) return null;

    const geo = new THREE.PlaneGeometry(width, length);
    const mat = new THREE.MeshBasicMaterial({
      map: this.contactShadowTexture,
      transparent: true,
      opacity: 0.86,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(geo, mat);
    shadowMesh.name = 'contactShadowPlane';
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, 0.002, 0); // Hugs road plane without z-fighting
    shadowMesh.renderOrder = 2;
    group.add(shadowMesh);
    return shadowMesh;
  },

  /**
   * Deep clones a normalized 3D vehicle model for independent instantiation.
   */
  cloneModel(source) {
    if (!source) return null;
    const clone = source.clone(true);
    clone.traverse(child => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material = child.material.map(m => m.clone());
        } else {
          child.material = child.material.clone();
        }
      }
    });
    return clone;
  },

  /**
   * Restores 100% authentic original factory colors, textures, and liveries
   * matching the source files in /Users/roshan/Downloads/3d-models/.
   */
  restoreOriginalModelColors(model, slug = '') {
    if (!model) return;

    model.traverse(child => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        const meshName = (child.name || '').toLowerCase();

        mats.forEach(mat => {
          const matName = (mat.name || '').toLowerCase();

          // 1. Textures & official liveries: keep texture pristine with full-white modulation
          if (mat.map) {
            mat.color.setHex(0xffffff);
            mat.needsUpdate = true;
          }

          // 2. Wheels / Rims: if no texture, gleaming metallic alloy silver
          const isRim = (
            matName.includes('rim') || matName.includes('spoke') || matName.includes('lip') ||
            matName.includes('bolt') || matName.includes('hub') || matName.includes('fuelpressure') ||
            meshName.includes('spoke') || meshName.includes('lip') || meshName.includes('bolt') ||
            meshName.includes('hub') || meshName.includes('rim')
          );
          if (isRim && !mat.map) {
            mat.color.setHex(0xd4d8e0);
            mat.metalness = 0.88;
            mat.roughness = 0.22;
            mat.needsUpdate = true;
          }

          // 3. Tires: solid matte charcoal rubber
          const isTyre = (
            matName.includes('tyre') || matName.includes('tire') ||
            meshName.includes('tyre') || meshName.includes('tire')
          );
          if (isTyre) {
            mat.color.setHex(0x181818);
            mat.roughness = 0.88;
            mat.metalness = 0.05;
            mat.transparent = false;
            mat.opacity = 1.0;
            mat.depthWrite = true;
            mat.needsUpdate = true;
          }

          // 4. Model-specific authentic factory paint restorations
          switch (slug) {
            case 'ferrari-sf90-stradale':
              if (meshName === 'mesh_0') {
                mat.color.setHex(0xd40000); // Rosso Corsa Ferrari Red
                mat.metalness = 0.72;
                mat.roughness = 0.16;
                mat.needsUpdate = true;
              }
              break;

            case 'bmw-m3-competition':
              if (['model_16', 'model_17', 'model_18', 'model_13', 'model_20', 'model_21', 'model_36'].includes(meshName)) {
                mat.color.setHex(0x00334e); // Tanzanite Blue Metallic (Authentic FBX)
                mat.metalness = 0.65;
                mat.roughness = 0.22;
                mat.needsUpdate = true;
              } else if (['model_10', 'model_11'].includes(meshName)) {
                mat.color.setHex(0x0e0e0e); // Shadowline gloss black roof/trim
                mat.metalness = 0.35;
                mat.roughness = 0.40;
                mat.needsUpdate = true;
              } else if (meshName === 'model_14') {
                mat.color.setHex(0xbc2b03); // M Sport red calipers
                mat.needsUpdate = true;
              }
              break;

            case 'bmw-m5-e39':
              if (
                meshName.includes('body002body0111') || matName.includes('body002body0111') ||
                matName.includes('c1mtl') || meshName.includes('ucanpaintthis')
              ) {
                mat.color.setHex(0x253562); // Le Mans Blue Metallic (Authentic MTL)
                mat.metalness = 0.60;
                mat.roughness = 0.24;
                mat.needsUpdate = true;
              } else if (matName.includes('starroof')) {
                mat.color.setHex(0x001a33); // StarRoof deep navy
                mat.needsUpdate = true;
              } else if (matName.includes('trunkbadge00052')) {
                mat.color.setHex(0x0022cc); // M badge blue
                mat.needsUpdate = true;
              } else if (matName.includes('trunkbadge00051')) {
                mat.color.setHex(0xcc0000); // M badge red
                mat.needsUpdate = true;
              } else if (matName.includes('rearbodyandcamera')) {
                mat.color.setHex(0x18202c);
                mat.needsUpdate = true;
              }
              break;

            case 'nissan-skyline-r34':
              if (
                matName.includes('hood1mtl') || matName.includes('door1mtl') || matName.includes('door2mtl') ||
                meshName === 'object_35' || meshName === 'object_36' ||
                meshName === 'object_8' || meshName === 'object_9' ||
                meshName === 'object_21' || meshName === 'object_22'
              ) {
                mat.color.setHex(0x1b3f8b); // Iconic Bayside Blue
                mat.metalness = 0.70;
                mat.roughness = 0.20;
                mat.needsUpdate = true;
              }
              break;

            case 'porsche-911-gt3-rs':
              // Carrera RS 2.7 Tribute Pure White with Python Green graphics
              if (mat.map) {
                mat.color.setHex(0xffffff);
              } else if (matName.includes('paint') || matName.includes('coloured')) {
                mat.color.setHex(0xffffff);
                mat.metalness = 0.40;
                mat.roughness = 0.20;
              }
              mat.needsUpdate = true;
              break;

            case 'bugatti-chiron-ss':
              // World Record Edition: Nocturne Carbon Black & World Record Orange stripes
              if (mat.map) {
                mat.color.setHex(0xffffff);
              } else if (matName.includes('paint')) {
                mat.color.setHex(0x0a0c10); // Nocturne Carbon Black
                mat.metalness = 0.65;
                mat.roughness = 0.22;
              }
              mat.needsUpdate = true;
              break;

            case 'lamborghini-huracan-sto':
              if (mat.map) {
                mat.color.setHex(0xffffff);
              } else if (matName.includes('paint')) {
                mat.color.setHex(0x1c7ed6); // Blu Laufey
                mat.metalness = 0.55;
                mat.roughness = 0.25;
              } else if (matName.includes('coloured')) {
                mat.color.setHex(0xff5400); // Arancio Xanto orange accents
              }
              mat.needsUpdate = true;
              break;

            case 'mclaren-765lt':
              if (mat.map) {
                mat.color.setHex(0xffffff);
              } else if (matName.includes('paint')) {
                mat.color.setHex(0xff7300); // Papaya Spark Orange
                mat.metalness = 0.55;
                mat.roughness = 0.18;
              }
              mat.needsUpdate = true;
              break;

            case 'nissan-gtr-nismo':
              if (mat.map) {
                mat.color.setHex(0xffffff);
              } else if (matName.includes('paint') || matName.includes('coloured')) {
                mat.color.setHex(0xf2f2f2); // Pearl White
              }
              mat.needsUpdate = true;
              break;

            case 'mercedes-190e-evo2':
              if (mat.map) {
                mat.color.setHex(0xffffff);
              } else if (matName.includes('paint') || meshName.includes('_ext')) {
                mat.color.setHex(0x1a1c20); // Blauschwarz Metallic
              }
              mat.needsUpdate = true;
              break;

            case 'f1-2022-ferrari':
            case 'f1-2022-redbull':
            case 'f1-2022-mercedes':
            case 'mclaren-mp45':
            case 'f1-2025-concept':
              if (mat.map) {
                mat.color.setHex(0xffffff);
                mat.needsUpdate = true;
              }
              break;
          }
        });
      }
    });
  },

  /**
   * Applies custom paint color to primary body meshes in the real model.
   * If isCustom is false or colorHex matches factory original, restores authentic 3D file colors.
   */
  applyRealModelColor(model, colorHex, slug = '', isCustom = false) {
    if (!model || !colorHex) return;

    const isF1 = slug.startsWith('f1-') || slug === 'mclaren-mp45';
    const originalHex = this.ORIGINAL_CAR_COLORS[slug] || '';
    const isOriginal = isF1 || !isCustom || (originalHex && colorHex.toLowerCase() === originalHex.toLowerCase());

    // In default / factory state (or for all Formula 1 liveries), restore 100% original model colors from the 3D source files
    if (isOriginal) {
      this.restoreOriginalModelColors(model, slug);
      return;
    }

    const color = new THREE.Color(colorHex);

    model.traverse(child => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        const meshName = (child.name || '').toLowerCase();

        mats.forEach(mat => {
          // NEVER tint textured materials (official liveries, decals, carbon fiber, badges, lights)
          if (mat.map) {
            mat.color.setHex(0xffffff);
            mat.needsUpdate = true;
            return;
          }

          let isBodyPaint = false;
          const matName = (mat.name || '').toLowerCase();
          const isNonPaint = (
            matName.includes('glass') || matName.includes('window') || matName.includes('windshield') ||
            matName.includes('tire') || matName.includes('tyre') || matName.includes('wheel') ||
            matName.includes('rim') || matName.includes('rubber') || matName.includes('carbon') ||
            matName.includes('interior') || matName.includes('seat') || matName.includes('light') ||
            matName.includes('lamp') || matName.includes('lens') || matName.includes('mirror') ||
            matName.includes('chrome') || matName.includes('exhaust') || matName.includes('disc') ||
            matName.includes('caliper') || matName.includes('brake') ||
            meshName.includes('glass') || meshName.includes('window') || meshName.includes('windshield') ||
            meshName.includes('tire') || meshName.includes('tyre') || meshName.includes('wheel') ||
            meshName.includes('rim') || meshName.includes('rubber') || meshName.includes('light') ||
            meshName.includes('lamp') || meshName.includes('caliper') || meshName.includes('disc') ||
            meshName.includes('brake') || meshName.includes('interior') || meshName.includes('seat')
          );

          if (!isNonPaint) {
            if (
              matName.includes('paint') || matName.includes('carpaint') ||
              matName.includes('body_paint') || matName.includes('paint_material') ||
              matName.includes('coloured_material') || matName.includes('coloured_geo') ||
              meshName.includes('paint_geo') || meshName.includes('coloured_geo') ||
              meshName.includes('body_lod') || meshName.includes('kit1_paint')
            ) {
              isBodyPaint = true;
            }
          }

          switch (slug) {
            case 'ferrari-sf90-stradale':
              if (meshName === 'mesh_0') isBodyPaint = true;
              break;

            case 'bmw-m3-competition':
              if (['model_16', 'model_17', 'model_18', 'model_13', 'model_20', 'model_21', 'model_36'].includes(meshName)) {
                isBodyPaint = true;
              }
              break;

            case 'nissan-skyline-r34':
              if (
                matName.includes('hood') || matName.includes('door') ||
                meshName === 'object_35' || meshName === 'object_36' ||
                meshName === 'object_8' || meshName === 'object_9' ||
                meshName === 'object_21' || meshName === 'object_22'
              ) {
                isBodyPaint = true;
              }
              break;

            case 'mercedes-190e-evo2':
              if (
                meshName.includes('_ext') ||
                (meshName.includes('body') && !meshName.includes('lights') && !meshName.includes('badges')) ||
                (meshName.includes('hood') && !meshName.includes('lights') && !meshName.includes('badges')) ||
                (meshName.includes('door') && !meshName.includes('cab') && !meshName.includes('badges'))
              ) {
                isBodyPaint = true;
              }
              break;

            case 'bmw-m5-e39':
              if (
                meshName.includes('body') || meshName.includes('roof') ||
                meshName.includes('ucanpaintthis') || meshName.includes('frontbody') ||
                meshName.includes('rearbody') || matName.includes('body') ||
                matName.includes('starroof') || matName.includes('c1mtl')
              ) {
                isBodyPaint = true;
              }
              break;

            case 'bugatti-chiron-ss':
            case 'lamborghini-huracan-sto':
            case 'mclaren-765lt':
            case 'nissan-gtr-nismo':
            case 'porsche-911-gt3-rs':
              if (matName.includes('paint') || matName.includes('coloured') || meshName.includes('paint')) {
                isBodyPaint = true;
              }
              break;
          }

          if (isBodyPaint && mat.color) {
            mat.color.copy(color);
            mat.needsUpdate = true;
          }
        });
      }
    });
  },

  /**
   * Dynamically updates the color of an existing vehicle group (both real model and procedural fallback).
   */
  updateVehicleColor(vehicleGroup, colorHex, slug = '', isCustom = true) {
    if (!vehicleGroup || !colorHex) return;
    const targetSlug = slug || (vehicleGroup.userData && vehicleGroup.userData.slug) || '';
    const isF1 = targetSlug.startsWith('f1-') || targetSlug === 'mclaren-mp45';
    const effectiveCustom = isF1 ? false : isCustom;

    // Update procedural paint material
    if (vehicleGroup.userData && vehicleGroup.userData.paintMaterial) {
      const displayColor = isF1 ? (this.ORIGINAL_CAR_COLORS[targetSlug] || colorHex) : colorHex;
      vehicleGroup.userData.paintMaterial.color.set(displayColor);
      vehicleGroup.userData.paintMaterial.needsUpdate = true;
    }

    // Update real model container meshes
    const realContainer = vehicleGroup.userData && vehicleGroup.userData.realModelContainer;
    if (realContainer) {
      this.applyRealModelColor(realContainer, colorHex, targetSlug, effectiveCustom);
    } else {
      this.applyRealModelColor(vehicleGroup, colorHex, targetSlug, effectiveCustom);
    }

    if (vehicleGroup.userData) {
      vehicleGroup.userData.bodyColorHex = colorHex;
    }
  },

  /**
   * Asynchronously loads a real 3D model for the given slug.
   * Invokes onLoaded(normalizedGroup) when ready.
   */
  loadRealModel(slug, onLoaded) {
    if (this.cachedModels[slug]) {
      if (onLoaded) onLoaded(this.cachedModels[slug]);
      return;
    }

    if (!this.loadingCallbacks[slug]) {
      this.loadingCallbacks[slug] = [];
    }
    if (onLoaded) {
      this.loadingCallbacks[slug].push(onLoaded);
    }

    if (this.loadingStatus[slug] === 'loading') {
      return;
    }

    const config = this.REAL_MODEL_CONFIGS[slug];
    if (!config) {
      console.warn(`[CarModels3D] No real model configuration for slug: ${slug}`);
      return;
    }

    this.loadingStatus[slug] = 'loading';

    const onModelParsed = (rawObj) => {
      try {
        const normalized = this.normalizeRealModel(rawObj, config.targetLength, slug);
        this.cachedModels[slug] = normalized;
        this.loadingStatus[slug] = 'loaded';

        const callbacks = this.loadingCallbacks[slug] || [];
        this.loadingCallbacks[slug] = [];
        callbacks.forEach(cb => {
          try { cb(normalized); } catch (e) { console.error(e); }
        });
      } catch (err) {
        console.error(`[CarModels3D] Normalization failed for ${slug}:`, err);
        this.loadingStatus[slug] = 'error';
      }
    };

    if (config.format === 'gltf' && typeof THREE.GLTFLoader !== 'undefined') {
      const loader = new THREE.GLTFLoader();
      loader.load(
        config.url,
        (gltf) => {
          onModelParsed(gltf.scene || gltf.scenes[0]);
        },
        undefined,
        (err) => {
          console.warn(`[CarModels3D] Failed to load GLTF model for ${slug}:`, err);
          this.loadingStatus[slug] = 'error';
        }
      );
    } else if (config.format === 'fbx' && typeof THREE.FBXLoader !== 'undefined') {
      const loader = new THREE.FBXLoader();
      if (config.resourcePath) {
        loader.setResourcePath(config.resourcePath);
      }
      loader.load(
        config.url,
        (fbx) => {
          onModelParsed(fbx);
        },
        undefined,
        (err) => {
          console.warn(`[CarModels3D] Failed to load FBX model for ${slug}:`, err);
          this.loadingStatus[slug] = 'error';
        }
      );
    } else if (config.format === 'obj' && typeof THREE.OBJLoader !== 'undefined') {
      if (config.mtlUrl && typeof THREE.MTLLoader !== 'undefined') {
        const mtlLoader = new THREE.MTLLoader();
        if (config.resourcePath) {
          mtlLoader.setResourcePath(config.resourcePath);
        }
        mtlLoader.load(
          config.mtlUrl,
          (materials) => {
            materials.preload();
            const objLoader = new THREE.OBJLoader();
            objLoader.setMaterials(materials);
            if (config.resourcePath) {
              objLoader.setResourcePath(config.resourcePath);
            }
            objLoader.load(
              config.objUrl,
              (obj) => onModelParsed(obj),
              undefined,
              (err) => {
                console.warn(`[CarModels3D] OBJ load error for ${slug}:`, err);
                this.loadingStatus[slug] = 'error';
              }
            );
          },
          undefined,
          (err) => {
            console.warn(`[CarModels3D] MTL failed for ${slug}, trying raw OBJ:`, err);
            const objLoader = new THREE.OBJLoader();
            objLoader.load(
              config.objUrl,
              (obj) => onModelParsed(obj),
              undefined,
              (err) => {
                console.warn(`[CarModels3D] Raw OBJ load error for ${slug}:`, err);
                this.loadingStatus[slug] = 'error';
              }
            );
          }
        );
      } else {
        const objLoader = new THREE.OBJLoader();
        objLoader.load(
          config.objUrl,
          (obj) => onModelParsed(obj),
          undefined,
          (err) => {
            console.warn(`[CarModels3D] OBJ load error for ${slug}:`, err);
            this.loadingStatus[slug] = 'error';
          }
        );
      }
    } else {
      console.warn(`[CarModels3D] Loader for format ${config.format} not found or slug not supported.`);
    }
  },

  /**
   * Preload hook - disabled aggressive synchronous loading of all cars to prevent UI freezing.
   * Models are loaded lazily on demand when inspected or raced.
   */
  preloadAllCars() {
    // Intentionally lazy to keep the main thread fluid at 60 FPS
  },

  /**
   * Builds an authentic 3D vehicle group for any given real-life car model.
   * Uses real 3D models from /static/models/cars/ when loaded, with seamless procedural fallback.
   * @param {string} slug - vehicle model slug
   * @param {string} bodyColorHex - paint color
   * @param {object} options - extra config (isPlayer, isPolice, isTraffic, etc.)
   * @returns {THREE.Group}
   */
  createVehicleMesh(slug, bodyColorHex = '#f2f2f2', options = {}) {
    const group = new THREE.Group();
    group.name = `vehicle_${slug}`;

    const color = new THREE.Color(bodyColorHex);

    // Common realistic automotive PBR materials for procedural fallback
    const paintMat = new THREE.MeshPhysicalMaterial({
      color: color,
      roughness: 0.16,
      metalness: 0.78,
      clearcoat: 0.95,
      clearcoatRoughness: 0.08
    });

    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x141619,
      roughness: 0.35,
      metalness: 0.35
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0c121e,
      roughness: 0.08,
      metalness: 0.9,
      transparent: true,
      opacity: 0.72
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xd8dde6,
      roughness: 0.12,
      metalness: 0.95
    });

    const interiorMat = new THREE.MeshStandardMaterial({
      color: 0x1c1e24,
      roughness: 0.75
    });

    const wheelConfig = {
      wheelbase: 2.7,
      trackwidth: 1.85,
      caliperColor: 0xd90429,
      spokeCount: 6,
      rimColor: 0x22252c
    };

    // Container for procedural fallback body
    const proceduralChassis = new THREE.Group();
    proceduralChassis.name = 'proceduralChassis';
    group.add(proceduralChassis);

    // Container for authentic real-life 3D model
    const realModelContainer = new THREE.Group();
    realModelContainer.name = 'realModelContainer';
    group.add(realModelContainer);

    // Model-specific chassis construction (procedural fallback)
    switch (slug) {
      case 'bmw-m3-competition':
        wheelConfig.wheelbase = 2.85;
        wheelConfig.trackwidth = 1.90;
        wheelConfig.caliperColor = 0x0066ff;
        this.buildBMWM3(proceduralChassis, paintMat, carbonMat, glassMat, chromeMat, interiorMat);
        break;

      case 'bmw-m5-e39':
        wheelConfig.wheelbase = 2.83;
        wheelConfig.trackwidth = 1.82;
        wheelConfig.caliperColor = 0x0055d4;
        wheelConfig.rimColor = 0x8a929e;
        wheelConfig.spokeCount = 5;
        this.buildBMWM5E39(proceduralChassis, paintMat, carbonMat, glassMat, chromeMat, interiorMat);
        break;

      case 'nissan-skyline-r34':
        wheelConfig.wheelbase = 2.66;
        wheelConfig.trackwidth = 1.78;
        wheelConfig.caliperColor = 0xf5a623; // Gold Brembos
        wheelConfig.rimColor = 0x8c7853; // Bronze TE37
        wheelConfig.spokeCount = 6;
        this.buildNissanSkylineR34(proceduralChassis, paintMat, carbonMat, glassMat, chromeMat, interiorMat);
        break;

      case 'mercedes-190e-evo2':
        wheelConfig.wheelbase = 2.67;
        wheelConfig.trackwidth = 1.76;
        wheelConfig.caliperColor = 0x8892b0;
        wheelConfig.rimColor = 0xc0c5ce;
        wheelConfig.spokeCount = 6;
        this.buildMercedes190EEvo2(proceduralChassis, paintMat, carbonMat, glassMat, chromeMat, interiorMat);
        break;

      case 'porsche-911-gt3-rs':
        wheelConfig.wheelbase = 2.45;
        wheelConfig.trackwidth = 1.88;
        wheelConfig.caliperColor = 0xa3e635; // Acid Green
        wheelConfig.rimColor = 0x1a1c22;
        wheelConfig.spokeCount = 7;
        this.buildPorscheGT3RS(proceduralChassis, paintMat, carbonMat, glassMat, chromeMat, interiorMat);
        break;

      case 'ferrari-sf90-stradale':
        wheelConfig.wheelbase = 2.65;
        wheelConfig.trackwidth = 1.97;
        wheelConfig.caliperColor = 0xffcc00; // Modena Yellow
        wheelConfig.rimColor = 0x1f232b;
        wheelConfig.spokeCount = 5;
        this.buildFerrariSF90(proceduralChassis, paintMat, carbonMat, glassMat, chromeMat, interiorMat);
        break;

      case 'lamborghini-huracan-sto':
        wheelConfig.wheelbase = 2.62;
        wheelConfig.trackwidth = 1.95;
        wheelConfig.caliperColor = 0xff5400; // Arancio STO
        wheelConfig.rimColor = 0x15171c;
        wheelConfig.spokeCount = 6;
        this.buildLamborghiniSTO(proceduralChassis, paintMat, carbonMat, glassMat, chromeMat, interiorMat);
        break;

      case 'mclaren-765lt':
        wheelConfig.wheelbase = 2.67;
        wheelConfig.trackwidth = 1.93;
        wheelConfig.caliperColor = 0xff6f00; // McLaren Papaya
        wheelConfig.rimColor = 0x121418;
        wheelConfig.spokeCount = 10;
        this.buildMcLaren765LT(proceduralChassis, paintMat, carbonMat, glassMat, chromeMat, interiorMat);
        break;

      case 'bugatti-chiron-ss':
        wheelConfig.wheelbase = 2.71;
        wheelConfig.trackwidth = 2.03;
        wheelConfig.caliperColor = 0x0055ff; // Bugatti French Blue
        wheelConfig.rimColor = 0x3a4252;
        wheelConfig.spokeCount = 8;
        this.buildBugattiChironSS(proceduralChassis, paintMat, carbonMat, glassMat, chromeMat, interiorMat);
        break;

      case 'f1-2022-ferrari':
      case 'f1-2022-redbull':
      case 'f1-2022-mercedes':
      case 'mclaren-mp45':
      case 'f1-2025-concept':
        wheelConfig.wheelbase = 3.60;
        wheelConfig.trackwidth = 2.05;
        wheelConfig.caliperColor = 0xd90429;
        wheelConfig.rimColor = 0x111111;
        wheelConfig.spokeCount = 10;
        wheelConfig.tireRadius = 0.36;
        wheelConfig.tireWidth = 0.38;
        wheelConfig.isOpenWheel = true;
        this.buildF1Chassis(proceduralChassis, paintMat, carbonMat, glassMat, chromeMat, interiorMat, slug);
        break;

      case 'police-interceptor':
        wheelConfig.wheelbase = 3.05;
        wheelConfig.trackwidth = 1.95;
        wheelConfig.caliperColor = 0x555555;
        wheelConfig.rimColor = 0x111111;
        wheelConfig.spokeCount = 5;
        this.buildPoliceInterceptor(proceduralChassis, paintMat, carbonMat, glassMat, chromeMat, interiorMat);
        break;

      case 'nissan-gtr-nismo':
      default:
        wheelConfig.wheelbase = 2.78;
        wheelConfig.trackwidth = 1.89;
        wheelConfig.caliperColor = 0xd90429;
        wheelConfig.rimColor = 0x181a1f;
        wheelConfig.spokeCount = 9;
        this.buildNissanGTR(proceduralChassis, paintMat, carbonMat, glassMat, chromeMat, interiorMat);
        break;
    }

    // 4 Dynamic Wheels (Steered front, rolling all, detailed spokes & calipers)
    const wheels = this.attachWheels(group, wheelConfig.wheelbase, wheelConfig.trackwidth, wheelConfig);

    group.userData = {
      slug,
      bodyColorHex,
      paintMaterial: paintMat,
      wheels: wheels, // { fl, fr, rl, rr, group }
      proceduralChassis: proceduralChassis,
      realModelContainer: realModelContainer,
      headlights: [],
      brakeLights: [],
      nitroFlames: [],
      isRealModelLoaded: false
    };

    // Lights & Nitro Exhaust Cones
    this.attachLights(group, slug, options);

    // Soft Ambient Occlusion Ground Contact Shadow under vehicle
    this.attachContactShadow(group, 2.3, 4.8);

    // Cast & Receive Shadows on procedural chassis (skip for traffic cars to maximize FPS)
    if (!options.isTraffic) {
      proceduralChassis.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }

    // Swap in authentic real-life 3D model when available (Traffic cars strictly use lightweight procedural models)
    const applyRealModel = (normalized) => {
      if (!group || !realModelContainer || options.isTraffic) return;
      try {
        if (!normalized) return;
        const realClone = this.cloneModel(normalized);
        if (!realClone) return;

        const isF1 = slug.startsWith('f1-') || slug === 'mclaren-mp45';
        const isCustom = !isF1 && !!options.isCustomPaint;
        if (isCustom) {
          this.applyRealModelColor(realClone, bodyColorHex, slug, true);
        } else {
          this.restoreOriginalModelColors(realClone, slug);
        }

        while (realModelContainer.children.length > 0) {
          realModelContainer.remove(realModelContainer.children[0]);
        }
        realModelContainer.add(realClone);

        // Hide procedural chassis fallback only after real model is safely attached
        proceduralChassis.visible = false;

        // Authentic 3D models already have authentic, highly detailed 3D wheels, rims, and branded tires.
        // Hide generic procedural wheels so they never clip through fenders, bodywork, or sidepods!
        if (wheels && wheels.group) {
          wheels.group.visible = false;
        }
        group.userData.isRealModelLoaded = true;
      } catch (err) {
        console.error(`[CarModels3D] Error applying real model for ${slug}:`, err);
        proceduralChassis.visible = true;
        if (wheels && wheels.group) {
          wheels.group.visible = true;
        }
      }
    };

    if (!options.isTraffic) {
      if (this.cachedModels[slug]) {
        applyRealModel(this.cachedModels[slug]);
      } else if (this.REAL_MODEL_CONFIGS[slug]) {
        this.loadRealModel(slug, (normalized) => {
          applyRealModel(normalized);
        });
      }
    }

    return group;
  },

  /* --------------------------------------------------------------------------
     Cockpit Helper (Interior Dashboard, Steering Wheel, and Bucket Seats)
     -------------------------------------------------------------------------- */
  attachCockpit(chassis, interiorMat, length = 1.8, width = 1.4, isRHD = false) {
    const cockpit = new THREE.Group();

    // Dashboard Cowl
    const dash = new THREE.Mesh(new THREE.BoxGeometry(width * 0.95, 0.22, 0.5), interiorMat);
    dash.position.set(0, 0.72, length * 0.22);
    cockpit.add(dash);

    // Center Console
    const consoleBox = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.28, length * 0.7), interiorMat);
    consoleBox.position.set(0, 0.48, -length * 0.05);
    cockpit.add(consoleBox);

    // Sports Steering Wheel
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.5 });
    const steerTorus = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.024, 8, 18), wheelMat);
    steerTorus.rotation.x = Math.PI / 4;
    const steerX = isRHD ? 0.38 : -0.38;
    steerTorus.position.set(steerX, 0.78, length * 0.12);
    cockpit.add(steerTorus);

    // Twin Racing Bucket Seats with Headrests
    const createSeat = (x) => {
      const seatGroup = new THREE.Group();
      // Seat Cushion
      const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.5), interiorMat);
      cushion.position.set(0, 0.42, 0);
      // Seat Back
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.12), interiorMat);
      back.position.set(0, 0.68, -0.22);
      back.rotation.x = -0.15;
      // Headrest
      const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.1), interiorMat);
      headrest.position.set(0, 0.98, -0.27);
      seatGroup.add(cushion, back, headrest);
      seatGroup.position.set(x, 0, -length * 0.1);
      return seatGroup;
    };

    cockpit.add(createSeat(-width * 0.26));
    cockpit.add(createSeat(width * 0.26));

    chassis.add(cockpit);
  },

  /* --------------------------------------------------------------------------
     1. BMW M3 Competition (G80)
     -------------------------------------------------------------------------- */
  buildBMWM3(root, paint, carbon, glass, chrome, interior) {
    const chassis = new THREE.Group();

    // Muscular sports sedan chassis (4.80m length, 1.90m width)
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.90, 0.48, 4.70), paint);
    lowerBody.position.y = 0.42;
    chassis.add(lowerBody);

    // Sculpted Hood with twin M power domes
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.22, 1.55), paint);
    hood.position.set(0, 0.62, 1.15);
    hood.rotation.x = 0.06;
    chassis.add(hood);

    // Iconic Frameless Vertical Kidney Grille (BMW G80 signature)
    const grilleMat = new THREE.MeshStandardMaterial({ color: 0x050608, roughness: 0.85 });
    const grilleLeft = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.08), grilleMat);
    grilleLeft.position.set(-0.21, 0.44, 2.36);
    const grilleRight = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.08), grilleMat);
    grilleRight.position.set(0.21, 0.44, 2.36);
    chassis.add(grilleLeft, grilleRight);

    // Widebody Flared Front and Rear Wheel Arches
    for (let side of [-1, 1]) {
      const flareF = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.32, 0.95), paint);
      flareF.position.set(side * 0.96, 0.44, 1.35);
      const flareR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.34, 1.1), paint);
      flareR.position.set(side * 0.97, 0.46, -1.35);
      chassis.add(flareF, flareR);
    }

    // Carbon Fiber Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.06, 1.75), carbon);
    roof.position.set(0, 1.25, -0.2);
    chassis.add(roof);

    // Cabin Greenhouse & Tinted Windshield
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.54, 2.05), glass);
    cabin.position.set(0, 0.95, -0.2);
    chassis.add(cabin);

    // Front Splitter & Corner Winglets
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.08, 0.42), carbon);
    splitter.position.set(0, 0.20, 2.22);
    chassis.add(splitter);

    // Carbon Rear Lip Spoiler
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.05, 0.22), carbon);
    spoiler.position.set(0, 0.77, -2.28);
    chassis.add(spoiler);

    // M Aerodynamic Wing Mirrors
    for (let side of [-1, 1]) {
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.10, 0.25), carbon);
      mirror.position.set(side * 0.96, 0.86, 0.45);
      chassis.add(mirror);
    }

    // Quad Round M Exhaust Pipes
    for (let x of [-0.46, -0.32, 0.32, 0.46]) {
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.22, 12), chrome);
      tip.rotation.x = Math.PI / 2;
      tip.position.set(x, 0.28, -2.36);
      chassis.add(tip);
    }

    this.attachCockpit(chassis, interior, 2.0, 1.55);
    root.add(chassis);
  },

  /* --------------------------------------------------------------------------
     2. BMW M5 (E39) - Featured in ChatGPT scan reference
     -------------------------------------------------------------------------- */
  buildBMWM5E39(root, paint, carbon, glass, chrome, interior) {
    const chassis = new THREE.Group();

    // Classic executive sports sedan proportions (4.78m x 1.80m x 1.43m)
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.48, 4.75), paint);
    lowerBody.position.y = 0.42;
    chassis.add(lowerBody);

    // Classic E39 Smooth Long Hood with character crease lines
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.70, 0.20, 1.60), paint);
    hood.position.set(0, 0.61, 1.15);
    hood.rotation.x = 0.04;
    chassis.add(hood);

    // Horizontal Chrome-Bordered Classic Twin Kidney Grilles
    const grilleFrameMat = chrome;
    const grilleSlatsMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    for (let side of [-1, 1]) {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.08), grilleFrameMat);
      frame.position.set(side * 0.20, 0.52, 2.38);
      const slats = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.09), grilleSlatsMat);
      slats.position.set(side * 0.20, 0.52, 2.38);
      chassis.add(frame, slats);
    }

    // Front Bumper Mesh Intake & Round Fog Lamps
    const lowerIntake = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.14, 0.10), grilleSlatsMat);
    lowerIntake.position.set(0, 0.28, 2.37);
    chassis.add(lowerIntake);

    const fogMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let side of [-1, 1]) {
      const fog = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 12), fogMat);
      fog.rotation.x = Math.PI / 2;
      fog.position.set(side * 0.68, 0.28, 2.38);
      chassis.add(fog);
    }

    // Classic 4-Door Executive Greenhouse with Hofmeister Kink
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.54, 2.15), glass);
    cabin.position.set(0, 0.95, -0.15);
    chassis.add(cabin);

    // Body-colored Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.05, 1.80), paint);
    roof.position.set(0, 1.22, -0.15);
    chassis.add(roof);

    // E39 M Aerodynamic Oval Mirrors
    for (let side of [-1, 1]) {
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.11, 0.22), paint);
      mirror.position.set(side * 0.92, 0.84, 0.50);
      chassis.add(mirror);
    }

    // Discrete Integrated Trunk Lip Spoiler
    const lip = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.04, 0.16), paint);
    lip.position.set(0, 0.74, -2.32);
    chassis.add(lip);

    // Signature Quad Chrome Exhaust Pipes (Twin on each side)
    for (let x of [-0.48, -0.34, 0.34, 0.48]) {
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.22, 12), chrome);
      tip.rotation.x = Math.PI / 2;
      tip.position.set(x, 0.26, -2.39);
      chassis.add(tip);
    }

    this.attachCockpit(chassis, interior, 2.1, 1.52);
    root.add(chassis);
  },

  /* --------------------------------------------------------------------------
     3. Nissan Skyline GT-R V-Spec II (BNR34)
     -------------------------------------------------------------------------- */
  buildNissanSkylineR34(root, paint, carbon, glass, chrome, interior) {
    const chassis = new THREE.Group();

    // Muscle JDM widebody coupe proportions (4.60m x 1.78m x 1.36m)
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.80, 0.48, 4.60), paint);
    lowerBody.position.y = 0.42;
    chassis.add(lowerBody);

    // Sharp sculpted hood with NACA duct cooling vent
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.18, 1.52), paint);
    hood.position.set(0, 0.60, 1.12);
    hood.rotation.x = 0.05;
    chassis.add(hood);

    const naca = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.28), carbon);
    naca.position.set(-0.28, 0.69, 1.15);
    chassis.add(naca);

    // Front Nismo Intercooler Grille & Twin Side Brake Ducts
    const meshMat = new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.9 });
    const intercooler = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.22, 0.08), chrome);
    intercooler.position.set(0, 0.32, 2.31);
    chassis.add(intercooler);

    const lowerLip = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.06, 0.38), carbon);
    lowerLip.position.set(0, 0.18, 2.25);
    chassis.add(lowerLip);

    // Muscular Boxy Blister Fenders (Front & Rear)
    for (let side of [-1, 1]) {
      const fenderF = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.9), paint);
      fenderF.position.set(side * 0.91, 0.44, 1.25);
      const fenderR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.35, 1.05), paint);
      fenderR.position.set(side * 0.92, 0.45, -1.25);
      chassis.add(fenderF, fenderR);
    }

    // Greenhouse Cockpit & Curved C-Pillars
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.50, 0.52, 1.95), glass);
    cabin.position.set(0, 0.92, -0.15);
    chassis.add(cabin);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.05, 1.45), paint);
    roof.position.set(0, 1.18, -0.15);
    chassis.add(roof);

    // High-Mount GT Rear Wing with Adjustable Carbon Aerofoil Blade
    const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.05, 0.38), carbon);
    wingBlade.position.set(0, 1.15, -2.15);
    wingBlade.rotation.x = -0.06;

    const wingPillarL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.42, 0.18), paint);
    wingPillarL.position.set(-0.62, 0.92, -2.15);
    const wingPillarR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.42, 0.18), paint);
    wingPillarR.position.set(0.62, 0.92, -2.15);
    chassis.add(wingBlade, wingPillarL, wingPillarR);

    // Large-Bore Titanium Cannon Exhaust with Heat-Blued Tip
    const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x2a6f97, metalness: 0.95, roughness: 0.15 });
    const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.28, 16), exhaustMat);
    cannon.rotation.x = Math.PI / 2;
    cannon.rotation.y = 0.08;
    cannon.position.set(-0.55, 0.26, -2.34);
    chassis.add(cannon);

    // Right-Hand Drive (RHD) JDM Cockpit
    this.attachCockpit(chassis, interior, 1.9, 1.45, true);
    root.add(chassis);
  },

  /* --------------------------------------------------------------------------
     4. Mercedes-Benz 190E 2.5-16 Evolution II (W201 DTM)
     -------------------------------------------------------------------------- */
  buildMercedes190EEvo2(root, paint, carbon, glass, chrome, interior) {
    const chassis = new THREE.Group();

    // Boxy 1990 DTM touring homologation silhouette (4.55m x 1.76m x 1.34m)
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.48, 4.55), paint);
    lowerBody.position.y = 0.40;
    chassis.add(lowerBody);

    // Classic Mercedes Horizontal Hood with 3D Star Mount
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.18, 1.50), paint);
    hood.position.set(0, 0.58, 1.10);
    chassis.add(hood);

    // Classic Chrome Radiator Grille
    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.32, 0.08), chrome);
    grille.position.set(0, 0.48, 2.29);
    chassis.add(grille);

    // Hood Star Emblem
    const star = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 12), chrome);
    star.position.set(0, 0.72, 2.22);
    chassis.add(star);

    // Extreme Boxy DTM Blister Wheel Arches
    for (let side of [-1, 1]) {
      const archF = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.36, 1.05), paint);
      archF.position.set(side * 0.90, 0.42, 1.20);
      const archR = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.38, 1.15), paint);
      archR.position.set(side * 0.91, 0.44, -1.20);
      chassis.add(archF, archR);

      // DTM Rocker Side Skirt
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 1.50), paint);
      skirt.position.set(side * 0.90, 0.22, 0);
      chassis.add(skirt);
    }

    // Angular 3-Box Sedan Greenhouse
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.50, 0.52, 2.00), glass);
    cabin.position.set(0, 0.92, -0.15);
    chassis.add(cabin);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.05, 1.60), paint);
    roof.position.set(0, 1.18, -0.15);
    chassis.add(roof);

    // Roof-Mounted Rear Window Spoiler Lip
    const roofSpoiler = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.04, 0.15), carbon);
    roofSpoiler.position.set(0, 1.16, -0.92);
    chassis.add(roofSpoiler);

    // Massive DTM Evolution II Rear Wing with Adjustable Flap
    const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.06, 0.42), paint);
    wingBlade.position.set(0, 1.25, -2.12);
    wingBlade.rotation.x = -0.08;

    const wingStrutL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 0.22), paint);
    wingStrutL.position.set(-0.65, 0.95, -2.12);
    const wingStrutR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 0.22), paint);
    wingStrutR.position.set(0.65, 0.95, -2.12);
    chassis.add(wingBlade, wingStrutL, wingStrutR);

    // Twin Polished Square Exhaust Tips
    for (let x of [-0.42, -0.32]) {
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.22), chrome);
      tip.position.set(x, 0.24, -2.30);
      chassis.add(tip);
    }

    this.attachCockpit(chassis, interior, 1.95, 1.46);
    root.add(chassis);
  },

  /* --------------------------------------------------------------------------
     5. Porsche 911 GT3 RS (992)
     -------------------------------------------------------------------------- */
  buildPorscheGT3RS(root, paint, carbon, glass, chrome, interior) {
    const chassis = new THREE.Group();

    // Sleek rear-engine aerodynamic teardrop fuselage
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.46, 4.52), paint);
    body.position.y = 0.40;
    chassis.add(body);

    // Sloped Front Hood with Dual Air Extraction Nostrils
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.18, 1.60), paint);
    hood.position.set(0, 0.56, 1.15);
    hood.rotation.x = 0.08;
    chassis.add(hood);

    for (let side of [-1, 1]) {
      const nostril = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.45), carbon);
      nostril.position.set(side * 0.35, 0.65, 1.10);
      chassis.add(nostril);

      // Front Fender Louvers (Air Extraction Slashes)
      const louver = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.35), carbon);
      louver.position.set(side * 0.82, 0.66, 1.10);
      chassis.add(louver);
    }

    // Teardrop Cockpit Glass & Double-Bubble Carbon Roof
    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.52, 1.80), glass);
    cockpit.position.set(0, 0.88, -0.30);
    chassis.add(cockpit);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.06, 1.25), carbon);
    roof.position.set(0, 1.15, -0.35);
    chassis.add(roof);

    // Flared Wide Rear Turbo Haunches with Intercooler Intakes
    for (let side of [-1, 1]) {
      const haunch = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.38, 1.40), paint);
      haunch.position.set(side * 0.95, 0.48, -1.10);
      const intake = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.30), carbon);
      intake.position.set(side * 1.04, 0.48, -0.70);
      chassis.add(haunch, intake);
    }

    // Massive GT3 RS Swan-Neck Carbon Wing with DRS Flap
    const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.05, 0.48), carbon);
    wingBlade.position.set(0, 1.36, -2.05);
    wingBlade.rotation.x = -0.05;

    for (let side of [-1, 1]) {
      const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.36, 0.54), paint);
      endplate.position.set(side * 0.96, 1.36, -2.05);
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.56, 0.14), carbon);
      strut.position.set(side * 0.26, 1.05, -1.95);
      chassis.add(endplate, strut);
    }
    chassis.add(wingBlade);

    // Center Twin Titanium Exhaust
    for (let side of [-1, 1]) {
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 12), chrome);
      tip.rotation.x = Math.PI / 2;
      tip.position.set(side * 0.08, 0.28, -2.28);
      chassis.add(tip);
    }

    this.attachCockpit(chassis, interior, 1.75, 1.42);
    root.add(chassis);
  },

  /* --------------------------------------------------------------------------
     6. Nissan GT-R Nismo (R35)
     -------------------------------------------------------------------------- */
  buildNissanGTR(root, paint, carbon, glass, chrome, interior) {
    const chassis = new THREE.Group();

    // Muscular Japanese widebody chassis (4.68m length, 1.90m width)
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.90, 0.50, 4.68), paint);
    body.position.y = 0.44;
    chassis.add(body);

    // Angular Hood with Dual NACA Air Ducts
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.20, 1.55), paint);
    hood.position.set(0, 0.65, 1.15);
    chassis.add(hood);

    for (let side of [-1, 1]) {
      const naca = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.25), carbon);
      naca.position.set(side * 0.32, 0.74, 1.15);
      chassis.add(naca);
    }

    // Nismo Red Accent Splitter & V-Motion Grille
    const redMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.3 });
    const frontLip = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.05, 0.36), redMat);
    frontLip.position.set(0, 0.18, 2.32);
    chassis.add(frontLip);

    // Greenhouse & Carbon Roof
    const greenhouse = new THREE.Mesh(new THREE.BoxGeometry(1.50, 0.52, 1.92), glass);
    greenhouse.position.set(0, 0.94, -0.20);
    chassis.add(greenhouse);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.05, 1.35), carbon);
    roof.position.set(0, 1.20, -0.25);
    chassis.add(roof);

    // Carbon GT Rear Wing
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.04, 0.40), carbon);
    wing.position.set(0, 1.06, -2.16);
    for (let side of [-1, 1]) {
      const wingLeg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.10), carbon);
      wingLeg.position.set(side * 0.60, 0.86, -2.16);
      chassis.add(wingLeg);
    }
    chassis.add(wing);

    // Quad Iconic Round Exhausts
    for (let x of [-0.55, -0.38, 0.38, 0.55]) {
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.20, 12), chrome);
      tip.rotation.x = Math.PI / 2;
      tip.position.set(x, 0.26, -2.36);
      chassis.add(tip);
    }

    this.attachCockpit(chassis, interior, 1.88, 1.48);
    root.add(chassis);
  },

  /* --------------------------------------------------------------------------
     7. Ferrari SF90 Stradale
     -------------------------------------------------------------------------- */
  buildFerrariSF90(root, paint, carbon, glass, chrome, interior) {
    const chassis = new THREE.Group();

    // Low-slung futuristic hammerhead wedge
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.40, 4.70), paint);
    body.position.y = 0.38;
    chassis.add(body);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.92, 1.55, 4), paint);
    nose.rotation.x = Math.PI / 2;
    nose.rotation.y = Math.PI / 4;
    nose.position.set(0, 0.42, 2.12);
    chassis.add(nose);

    // Floating Black Roof Canopy & Tinted Glass
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x080a0e, roughness: 0.15 });
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.40, 0.48, 1.72), canopyMat);
    canopy.position.set(0, 0.82, -0.15);
    chassis.add(canopy);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.44, 0.82), glass);
    windshield.position.set(0, 0.80, 0.45);
    windshield.rotation.x = -0.40;
    chassis.add(windshield);

    // Side Air Intakes feeding Twin-Turbo V8
    for (let side of [-1, 1]) {
      const intake = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.65), carbon);
      intake.position.set(side * 0.96, 0.44, -0.35);
      chassis.add(intake);
    }

    // High Center Dual Exhausts exiting above the diffuser
    for (let side of [-1, 1]) {
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.20, 12), chrome);
      tip.rotation.x = Math.PI / 2;
      tip.position.set(side * 0.10, 0.48, -2.36);
      chassis.add(tip);
    }

    this.attachCockpit(chassis, interior, 1.70, 1.38);
    root.add(chassis);
  },

  /* --------------------------------------------------------------------------
     8. Lamborghini Huracán STO
     -------------------------------------------------------------------------- */
  buildLamborghiniSTO(root, paint, carbon, glass, chrome, interior) {
    const chassis = new THREE.Group();

    // Stealth fighter angular chassis
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.42, 4.55), paint);
    body.position.y = 0.38;
    chassis.add(body);

    // One-piece "Cofango" Hood with Dual Air Ducts
    for (let side of [-1, 1]) {
      const duct = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.48), carbon);
      duct.position.set(side * 0.36, 0.62, 1.15);
      chassis.add(duct);
    }

    // Cockpit
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.40, 0.48, 1.62), glass);
    cabin.position.set(0, 0.82, -0.20);
    chassis.add(cabin);

    // Ram-Air Roof Snorkel Scoop
    const snorkel = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.72), carbon);
    snorkel.position.set(0, 1.15, -0.20);
    chassis.add(snorkel);

    // Longitudinal Shark Fin Spine
    const orangeMat = new THREE.MeshStandardMaterial({ color: 0xff5400, roughness: 0.3 });
    const sharkFin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 1.25), orangeMat);
    sharkFin.position.set(0, 1.10, -1.12);
    chassis.add(sharkFin);

    // STO Racing Carbon Wing with Orange Endplates
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.05, 0.42), carbon);
    wing.position.set(0, 1.16, -2.12);
    for (let side of [-1, 1]) {
      const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.32, 0.46), orangeMat);
      endplate.position.set(side * 0.96, 1.16, -2.12);
      chassis.add(endplate);
    }
    chassis.add(wing);

    this.attachCockpit(chassis, interior, 1.62, 1.38);
    root.add(chassis);
  },

  /* --------------------------------------------------------------------------
     9. McLaren 765LT Spider
     -------------------------------------------------------------------------- */
  buildMcLaren765LT(root, paint, carbon, glass, chrome, interior) {
    const chassis = new THREE.Group();

    // Low hammerhead snout (4.60m x 1.93m x 1.19m)
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.93, 0.38, 4.60), paint);
    body.position.y = 0.36;
    chassis.add(body);

    // Front Eye-Socket Headlight Nacelles & Splitter
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.06, 0.42), carbon);
    splitter.position.set(0, 0.16, 2.22);
    chassis.add(splitter);

    // Front Fender Louvers
    for (let side of [-1, 1]) {
      const louver = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.04, 0.35), carbon);
      louver.position.set(side * 0.82, 0.60, 1.15);
      chassis.add(louver);
    }

    // Teardrop Glass Canopy
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.46, 1.70), glass);
    cabin.position.set(0, 0.80, -0.20);
    chassis.add(cabin);

    // Active Longtail Rear Airbrake Wing
    const ltWing = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.05, 0.45), carbon);
    ltWing.position.set(0, 0.88, -2.25);
    ltWing.rotation.x = -0.12;
    chassis.add(ltWing);

    // Signature QUAD HIGH-EXIT TITANIUM EXHAUST PIPES
    for (let x of [-0.24, -0.08, 0.08, 0.24]) {
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.18, 12), chrome);
      tip.rotation.x = Math.PI / 2;
      tip.position.set(x, 0.52, -2.32);
      chassis.add(tip);
    }

    this.attachCockpit(chassis, interior, 1.68, 1.40);
    root.add(chassis);
  },

  /* --------------------------------------------------------------------------
     10. Bugatti Chiron Super Sport
     -------------------------------------------------------------------------- */
  buildBugattiChironSS(root, paint, carbon, glass, chrome, interior) {
    const chassis = new THREE.Group();

    // 5-meter Longtail aerodynamic hypercar body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.44, 4.95), paint);
    body.position.y = 0.38;
    chassis.add(body);

    // Horseshoe Front Grille
    const hsMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 });
    const horseshoe = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.12, 16), hsMat);
    horseshoe.rotation.x = Math.PI / 2;
    horseshoe.position.set(0, 0.36, 2.48);
    chassis.add(horseshoe);

    // Iconic Bugatti "C-Line" Side Curve
    const cLineMat = new THREE.MeshStandardMaterial({ color: 0x0099ff, roughness: 0.2 });
    for (let side of [-1, 1]) {
      const cLine = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.045, 8, 24, Math.PI), cLineMat);
      cLine.rotation.y = side * (Math.PI / 2);
      cLine.position.set(side * 1.02, 0.65, 0.10);
      chassis.add(cLine);
    }

    // Cockpit
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.50, 0.48, 1.82), glass);
    cabin.position.set(0, 0.84, -0.20);
    chassis.add(cabin);

    // Quad Vertically Stacked Exhaust Pipes (2 Left, 2 Right)
    for (let pos of [
      [-0.20, 0.36], [-0.20, 0.24], [0.20, 0.36], [0.20, 0.24]
    ]) {
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.18, 12), chrome);
      tip.rotation.x = Math.PI / 2;
      tip.position.set(pos[0], pos[1], -2.50);
      chassis.add(tip);
    }

    this.attachCockpit(chassis, interior, 1.80, 1.48);
    root.add(chassis);
  },

  /* --------------------------------------------------------------------------
     11. Police Interceptor Cruiser
     -------------------------------------------------------------------------- */
  buildPoliceInterceptor(root, paint, carbon, glass, chrome, interior) {
    const chassis = new THREE.Group();

    // Heavy duty pursuit sedan
    const policeBody = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.52, 4.82), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.35 }));
    policeBody.position.y = 0.45;
    chassis.add(policeBody);

    // White door panels
    const whiteDoor = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.48, 1.82), new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.3 }));
    whiteDoor.position.set(0, 0.45, 0);
    chassis.add(whiteDoor);

    // Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.60, 0.56, 2.10), glass);
    cabin.position.set(0, 0.98, -0.15);
    chassis.add(cabin);

    // Heavy Steel Bullbar Push Bumper
    const bullBar = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.46, 0.16), carbon);
    bullBar.position.set(0, 0.45, 2.46);
    chassis.add(bullBar);

    // Rooftop Police Strobe Lightbar
    const lightbarBase = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.08, 0.25), chrome);
    lightbarBase.position.set(0, 1.30, -0.15);
    chassis.add(lightbarBase);

    const redStrobe = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.22), new THREE.MeshBasicMaterial({ color: 0xff0033 }));
    redStrobe.position.set(-0.28, 1.35, -0.15);
    const blueStrobe = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.22), new THREE.MeshBasicMaterial({ color: 0x0066ff }));
    blueStrobe.position.set(0.28, 1.35, -0.15);
    chassis.add(redStrobe, blueStrobe);

    this.attachCockpit(chassis, interior, 2.10, 1.58);
    root.add(chassis);
    root.userData.policeLightbar = { red: redStrobe, blue: blueStrobe, timer: 0 };
  },

  /* --------------------------------------------------------------------------
     11. Formula 1 Grand Prix Aerodynamic Chassis (Scuderia Ferrari / Red Bull / Mercedes / McLaren)
     -------------------------------------------------------------------------- */
  buildF1Chassis(root, paint, carbon, glass, chrome, interior, slug = 'f1-2022-ferrari') {
    const chassis = new THREE.Group();

    // Livery accent colors based on F1 team
    let liveryColor = 0xc00000; // Ferrari red
    let secondaryColor = 0x111111; // Carbon black
    let wingAccent = 0xc00000;
    let driverHelmetColor = 0xffdf00;

    if (slug === 'f1-2022-redbull') {
      liveryColor = 0x0c1635; // Navy
      secondaryColor = 0xffd600; // Yellow
      wingAccent = 0xd90429; // Red Bull red
      driverHelmetColor = 0xff8c00;
    } else if (slug === 'f1-2022-mercedes') {
      liveryColor = 0xc4c9cc; // Silver
      secondaryColor = 0x00a19c; // Petronas teal
      wingAccent = 0x00a19c;
      driverHelmetColor = 0x6a0dad;
    } else if (slug === 'mclaren-mp45') {
      liveryColor = 0xffffff; // Classic white
      secondaryColor = 0xff1100; // Marlboro red
      wingAccent = 0xff1100;
      driverHelmetColor = 0xffd700; // Senna yellow helmet
    } else if (slug === 'f1-2025-concept') {
      liveryColor = 0x11141c;
      secondaryColor = 0x00f0ff;
      wingAccent = 0xff0055;
      driverHelmetColor = 0x00f0ff;
    }

    const teamPaint = new THREE.MeshPhysicalMaterial({
      color: liveryColor,
      roughness: 0.18,
      metalness: 0.65,
      clearcoat: 0.95
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      roughness: 0.25,
      metalness: 0.7
    });

    const wingMat = new THREE.MeshStandardMaterial({
      color: wingAccent,
      roughness: 0.3,
      metalness: 0.5
    });

    // 1. Sleek Monocoque Tub (Main central body)
    const tub = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.44, 2.10), teamPaint);
    tub.position.set(0, 0.38, 0.25);
    chassis.add(tub);

    // 2. Tapered Needle Nose Cone
    const noseGeo = new THREE.ConeGeometry(0.35, 1.70, 8);
    const nose = new THREE.Mesh(noseGeo, teamPaint);
    nose.rotation.x = -Math.PI / 2;
    nose.position.set(0, 0.32, 1.95);
    chassis.add(nose);

    // Nose tip camera pods
    const camPodL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.12), carbon);
    camPodL.position.set(-0.24, 0.38, 2.1);
    const camPodR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.12), carbon);
    camPodR.position.set(0.24, 0.38, 2.1);
    chassis.add(camPodL, camPodR);

    // 3. Wide Front Aerodynamic Wing & Endplates (2.0m wide ground-effect assembly)
    const frontWingMain = new THREE.Mesh(new THREE.BoxGeometry(2.00, 0.035, 0.48), carbon);
    frontWingMain.position.set(0, 0.12, 2.45);
    chassis.add(frontWingMain);

    const frontWingFlap = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.025, 0.26), wingMat);
    frontWingFlap.rotation.x = -0.12;
    frontWingFlap.position.set(0, 0.18, 2.38);
    chassis.add(frontWingFlap);

    // Front Wing Endplates with outer curved diveplanes
    const endplateL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.32, 0.65), accentMat);
    endplateL.position.set(-1.00, 0.24, 2.45);
    const endplateR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.32, 0.65), accentMat);
    endplateR.position.set(1.00, 0.24, 2.45);
    chassis.add(endplateL, endplateR);

    // 4. Sculpted Undercut Sidepods (Left & Right air cooling channels)
    const sidepodGeo = new THREE.BoxGeometry(0.48, 0.36, 1.75);
    const sidepodL = new THREE.Mesh(sidepodGeo, teamPaint);
    sidepodL.position.set(-0.66, 0.32, -0.22);
    const sidepodR = new THREE.Mesh(sidepodGeo, teamPaint);
    sidepodR.position.set(0.66, 0.32, -0.22);
    chassis.add(sidepodL, sidepodR);

    // Radiator Intake Inlets
    const intakeGeo = new THREE.BoxGeometry(0.38, 0.26, 0.06);
    const intakeL = new THREE.Mesh(intakeGeo, carbon);
    intakeL.position.set(-0.66, 0.34, 0.66);
    const intakeR = new THREE.Mesh(intakeGeo, carbon);
    intakeR.position.set(0.66, 0.34, 0.66);
    chassis.add(intakeL, intakeR);

    // Aerodynamic Bargeboards / Floor Edge Wings
    const floorL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 1.8), carbon);
    floorL.position.set(-0.95, 0.08, -0.22);
    const floorR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 1.8), carbon);
    floorR.position.set(0.95, 0.08, -0.22);
    chassis.add(floorL, floorR);

    // 5. Overhead Engine Airbox Snorkel & Shark Fin Spine
    const airbox = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, 0.65), teamPaint);
    airbox.position.set(0, 0.82, -0.32);
    chassis.add(airbox);

    const airboxIntake = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.12, 12), carbon);
    airboxIntake.rotation.x = Math.PI / 2;
    airboxIntake.position.set(0, 0.92, 0.0);
    chassis.add(airboxIntake);

    // Shark Fin Engine Spine
    const sharkFin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.46, 1.35), accentMat);
    sharkFin.position.set(0, 0.82, -1.18);
    chassis.add(sharkFin);

    // 6. Halo Cockpit Safety Frame (Titanium curved protective hoop)
    const haloMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.8 });
    const haloHoop = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.032, 8, 16, Math.PI * 1.1), haloMat);
    haloHoop.rotation.x = Math.PI / 2;
    haloHoop.rotation.z = Math.PI;
    haloHoop.position.set(0, 0.72, 0.18);
    chassis.add(haloHoop);

    const haloPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.34, 8), haloMat);
    haloPillar.position.set(0, 0.58, 0.48);
    chassis.add(haloPillar);

    // Driver Helmet with Visor
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), new THREE.MeshStandardMaterial({ color: driverHelmetColor, roughness: 0.2 }));
    helmet.position.set(0, 0.64, 0.08);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.06, 0.08), new THREE.MeshBasicMaterial({ color: 0x111111 }));
    visor.position.set(0, 0.64, 0.18);
    chassis.add(helmet, visor);

    // 7. High-Downforce Rear Wing Assembly (Twin Swan-Neck Pylons, DRS Mainplane, Endplates)
    const pylonL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.62, 0.16), carbon);
    pylonL.position.set(-0.18, 0.72, -2.15);
    const pylonR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.62, 0.16), carbon);
    pylonR.position.set(0.18, 0.72, -2.15);
    chassis.add(pylonL, pylonR);

    // Rear Wing Mainplane
    const rearWingMain = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.045, 0.42), carbon);
    rearWingMain.position.set(0, 0.96, -2.18);
    chassis.add(rearWingMain);

    // Upper DRS Aerodynamic Flap (Rotates open in DRS zones!)
    const drsFlap = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.03, 0.22), wingMat);
    drsFlap.name = 'f1DrsFlap';
    drsFlap.position.set(0, 1.05, -2.10);
    chassis.add(drsFlap);

    // Rear Wing Endplates
    const rearEndplateL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.68, 0.58), accentMat);
    rearEndplateL.position.set(-0.71, 0.88, -2.18);
    const rearEndplateR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.68, 0.58), accentMat);
    rearEndplateR.position.set(0.71, 0.88, -2.18);
    chassis.add(rearEndplateL, rearEndplateR);

    // Lower Beam Wing
    const beamWing = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.025, 0.24), carbon);
    beamWing.position.set(0, 0.48, -2.16);
    chassis.add(beamWing);

    // 8. Rear Venturi Diffuser & FIA LED Rain Safety Light
    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.22, 0.45), carbon);
    diffuser.rotation.x = -0.35;
    diffuser.position.set(0, 0.22, -2.05);
    chassis.add(diffuser);

    // Flashing Rain Light (Red LED diode)
    const rainLightMat = new THREE.MeshBasicMaterial({ color: 0xff0022 });
    const rainLight = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.07, 0.04), rainLightMat);
    rainLight.name = 'f1RainLight';
    rainLight.position.set(0, 0.32, -2.28);
    chassis.add(rainLight);

    root.add(chassis);
  },

  /* --------------------------------------------------------------------------
     Authentic Wheels Builder with Radiating Spokes & Drilled Rotors
     -------------------------------------------------------------------------- */
  attachWheels(root, wheelbase = 2.7, trackwidth = 1.85, config = {}) {
    const tireRadius = config.tireRadius || 0.34;
    const tireWidth = config.tireWidth || 0.28;
    const halfBase = wheelbase / 2;
    const halfTrack = trackwidth / 2;

    const tireMat = new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.92 });
    const rimMat = new THREE.MeshStandardMaterial({ color: config.rimColor || 0x22252c, roughness: 0.25, metalness: 0.88 });
    const rotorMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.3, metalness: 0.9 });
    const caliperMat = new THREE.MeshStandardMaterial({ color: config.caliperColor || 0xd90429, roughness: 0.3, metalness: 0.4 });
    const spokeCount = config.spokeCount || 6;

    const createSingleWheel = (isFront) => {
      const wheelHub = new THREE.Group(); // Steer rotation
      const wheelRoll = new THREE.Group(); // Roll spin
      wheelHub.add(wheelRoll);

      // Rubber Tire Outer Ring
      const tireGeo = new THREE.CylinderGeometry(tireRadius, tireRadius, tireWidth, 24);
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.rotation.z = Math.PI / 2;
      wheelRoll.add(tire);

      // Deep Rim Barrel
      const rimBarrel = new THREE.Mesh(new THREE.CylinderGeometry(tireRadius * 0.74, tireRadius * 0.74, tireWidth * 1.02, 18), rimMat);
      rimBarrel.rotation.z = Math.PI / 2;
      wheelRoll.add(rimBarrel);

      // Central Hub
      const centerHub = new THREE.Mesh(new THREE.CylinderGeometry(tireRadius * 0.22, tireRadius * 0.22, tireWidth * 1.05, 12), rimMat);
      centerHub.rotation.z = Math.PI / 2;
      wheelRoll.add(centerHub);

      // Radial Alloy Spokes
      for (let s = 0; s < spokeCount; s++) {
        const spokeAngle = (s / spokeCount) * Math.PI * 2;
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(tireWidth * 1.03, tireRadius * 0.52, 0.035), rimMat);
        spoke.rotation.x = spokeAngle;
        spoke.position.set(0, Math.sin(spokeAngle) * tireRadius * 0.35, Math.cos(spokeAngle) * tireRadius * 0.35);
        wheelRoll.add(spoke);
      }

      // Brake Rotor Disc
      const rotor = new THREE.Mesh(new THREE.CylinderGeometry(tireRadius * 0.65, tireRadius * 0.65, 0.04, 16), rotorMat);
      rotor.rotation.z = Math.PI / 2;
      rotor.position.x = isFront ? 0.02 : -0.02;
      wheelHub.add(rotor);

      // Painted High-Performance Brake Caliper
      const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.17, 0.13), caliperMat);
      caliper.position.set(0, tireRadius * 0.42, 0);
      wheelHub.add(caliper);

      return { hub: wheelHub, roll: wheelRoll };
    };

    const wheelsGroup = new THREE.Group();
    wheelsGroup.name = 'proceduralWheels';
    root.add(wheelsGroup);

    const fl = createSingleWheel(true);
    fl.hub.position.set(-halfTrack, tireRadius, halfBase);
    wheelsGroup.add(fl.hub);

    const fr = createSingleWheel(true);
    fr.hub.position.set(halfTrack, tireRadius, halfBase);
    wheelsGroup.add(fr.hub);

    const rl = createSingleWheel(false);
    rl.hub.position.set(-halfTrack, tireRadius, -halfBase);
    wheelsGroup.add(rl.hub);

    const rr = createSingleWheel(false);
    rr.hub.position.set(halfTrack, tireRadius, -halfBase);
    wheelsGroup.add(rr.hub);

    return { fl, fr, rl, rr, group: wheelsGroup };
  },

  /* --------------------------------------------------------------------------
     Authentic Real-Life Headlights, Signature Taillights, and Nitro Effects
     -------------------------------------------------------------------------- */
  attachLights(root, slug, options = {}) {
    const xenonMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });

    // Decorative headlight & taillight geometry attached to procedural fallback only
    const decoParent = (root.userData && root.userData.proceduralChassis) || root;

    // 1. Decorative Headlights for Procedural Fallback
    if (slug === 'porsche-911-gt3-rs') {
      for (let side of [-1, 1]) {
        const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 16), xenonMat);
        pod.rotation.x = Math.PI / 2;
        pod.position.set(side * 0.65, 0.62, 2.12);
        decoParent.add(pod);
      }
    } else if (slug === 'bugatti-chiron-ss') {
      for (let side of [-1, 1]) {
        for (let i = 0; i < 4; i++) {
          const eye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.04), xenonMat);
          eye.position.set(side * (0.50 + i * 0.08), 0.52, 2.38);
          decoParent.add(eye);
        }
      }
    } else if (slug === 'bmw-m5-e39') {
      for (let side of [-1, 1]) {
        for (let eye of [-0.08, 0.08]) {
          const halo = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.015, 8, 16), xenonMat);
          halo.position.set(side * 0.62 + eye, 0.52, 2.38);
          decoParent.add(halo);
        }
      }
    } else {
      const headL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.09, 0.05), xenonMat);
      headL.position.set(-0.65, 0.54, 2.31);
      const headR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.09, 0.05), xenonMat);
      headR.position.set(0.65, 0.54, 2.31);
      decoParent.add(headL, headR);
    }

    // 2. High-Performance Front Xenon Projector SpotLights (Cast illumination on track)
    if (options.isPlayer) {
      const spotL = new THREE.SpotLight(0xf2f8ff, 3.8, 85, Math.PI / 4.5, 0.45, 1.4);
      spotL.position.set(-0.65, 0.58, 2.25);
      spotL.target.position.set(-0.65, 0.05, 35);
      root.add(spotL, spotL.target);

      const spotR = new THREE.SpotLight(0xf2f8ff, 3.8, 85, Math.PI / 4.5, 0.45, 1.4);
      spotR.position.set(0.65, 0.58, 2.25);
      spotR.target.position.set(0.65, 0.05, 35);
      root.add(spotR, spotR.target);

      root.userData.headlights = [spotL, spotR];
    }

    // 3. Decorative Taillights for Procedural Fallback
    const brakeMeshes = [];

    if (slug === 'nissan-skyline-r34' || slug === 'nissan-gtr-nismo') {
      for (let side of [-1, 1]) {
        const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 20), tailMat);
        outerRing.position.set(side * 0.66, 0.60, -2.32);
        const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.025, 8, 20), tailMat);
        innerRing.position.set(side * 0.40, 0.60, -2.32);
        decoParent.add(outerRing, innerRing);
        brakeMeshes.push(outerRing, innerRing);
      }
    } else if (slug === 'porsche-911-gt3-rs' || slug === 'bugatti-chiron-ss') {
      const lightbar = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.04, 0.04), tailMat);
      lightbar.position.set(0, 0.68, -2.26);
      decoParent.add(lightbar);
      brakeMeshes.push(lightbar);
    } else if (slug === 'ferrari-sf90-stradale') {
      for (let side of [-1, 1]) {
        const ring1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.04), tailMat);
        ring1.position.set(side * 0.68, 0.64, -2.35);
        const ring2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.04), tailMat);
        ring2.position.set(side * 0.46, 0.64, -2.35);
        decoParent.add(ring1, ring2);
        brakeMeshes.push(ring1, ring2);
      }
    } else {
      const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.04), tailMat);
      tailL.position.set(-0.64, 0.60, -2.32);
      const tailR = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.04), tailMat);
      tailR.position.set(0.64, 0.60, -2.32);
      decoParent.add(tailL, tailR);
      brakeMeshes.push(tailL, tailR);
    }

    // 4. Dynamic Rear Brake Glow (Only player vehicle gets dynamic light; AI and traffic use emissive materials)
    let brakeGlow = null;
    if (options.isPlayer) {
      brakeGlow = new THREE.PointLight(0xff1122, 0.75, 8, 2);
      brakeGlow.position.set(0, 0.62, -2.4);
      root.add(brakeGlow);
    }

    // 5. 3D Nitro Exhaust Flame Cones
    const flameGeo = new THREE.ConeGeometry(0.12, 0.90, 8);
    flameGeo.rotateX(-Math.PI / 2);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.92 });
    const flameL = new THREE.Mesh(flameGeo, flameMat);
    flameL.position.set(-0.45, 0.28, -2.60);
    flameL.visible = false;
    const flameR = new THREE.Mesh(flameGeo, flameMat);
    flameR.position.set(0.45, 0.28, -2.60);
    flameR.visible = false;
    root.add(flameL, flameR);

    root.userData.brakeLights = brakeGlow ? [brakeGlow, ...brakeMeshes] : [...brakeMeshes];
    root.userData.brakeGlow = brakeGlow;
    root.userData.brakeMat = tailMat;
    root.userData.nitroFlames = [flameL, flameR];
  }
};
