/**
 * RACING ZONE - GTA-Style Third-Person Character & Vehicle Interaction (Three.js)
 */

class Character3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'player_character';

    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.yaw = 0; // heading angle
    this.speed = 0;
    this.walkSpeed = 4.5;
    this.runSpeed = 9.0;
    this.isGrounded = true;
    this.velocityY = 0;
    this.gravity = -22;

    this.isInVehicle = true; // starts driving
    this.currentVehicle = null;

    // Limb animation nodes
    this.limbs = {};
    this.animTime = 0;

    this.buildCharacterMesh();
    this.scene.add(this.group);
  }

  buildCharacterMesh() {
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69, roughness: 0.6 });
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0x1a233a, roughness: 0.4 }); // Dark racing bomber jacket
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x111622, roughness: 0.7 });  // Black tactical pants
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });   // White sneakers
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1d1e22, roughness: 0.8 });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.32), jacketMat);
    torso.position.y = 1.25;
    this.group.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.3), skinMat);
    head.position.y = 1.82;
    this.group.add(head);

    // Hair / Cap
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.32), hairMat);
    hair.position.set(0, 1.95, 0);
    this.group.add(hair);

    // Left Arm
    const armL = new THREE.Group();
    armL.position.set(-0.38, 1.55, 0);
    const armLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.18), jacketMat);
    armLMesh.position.y = -0.3;
    armL.add(armLMesh);
    this.group.add(armL);
    this.limbs.armL = armL;

    // Right Arm
    const armR = new THREE.Group();
    armR.position.set(0.38, 1.55, 0);
    const armRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.18), jacketMat);
    armRMesh.position.y = -0.3;
    armR.add(armRMesh);
    this.group.add(armR);
    this.limbs.armR = armR;

    // Left Leg
    const legL = new THREE.Group();
    legL.position.set(-0.16, 0.9, 0);
    const legLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.85, 0.22), pantsMat);
    legLMesh.position.y = -0.42;
    legL.add(legLMesh);
    // Shoe
    const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.32), shoeMat);
    shoeL.position.set(0, -0.85, 0.05);
    legL.add(shoeL);
    this.group.add(legL);
    this.limbs.legL = legL;

    // Right Leg
    const legR = new THREE.Group();
    legR.position.set(0.16, 0.9, 0);
    const legRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.85, 0.22), pantsMat);
    legRMesh.position.y = -0.42;
    legR.add(legRMesh);
    // Shoe
    const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.32), shoeMat);
    shoeR.position.set(0, -0.85, 0.05);
    legR.add(shoeR);
    this.group.add(legR);
    this.limbs.legR = legR;

    // Cast shadows
    this.group.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Start hidden inside car
    this.group.visible = false;
  }

  update(dt, input, cameraAngle) {
    if (this.isInVehicle) {
      this.group.visible = false;
      return;
    }

    this.group.visible = true;

    // 1. Movement Direction relative to camera view
    let moveX = 0;
    let moveZ = 0;

    if (input.up) moveZ -= 1;
    if (input.down) moveZ += 1;
    if (input.left) moveX -= 1;
    if (input.right) moveX += 1;

    const isMoving = (moveX !== 0 || moveZ !== 0);

    if (isMoving) {
      // Rotate movement input by camera horizontal yaw
      const len = Math.hypot(moveX, moveZ);
      const normX = moveX / len;
      const normZ = moveZ / len;

      const cos = Math.cos(cameraAngle);
      const sin = Math.sin(cameraAngle);

      const worldX = normX * cos - normZ * sin;
      const worldZ = normX * sin + normZ * cos;

      const targetYaw = Math.atan2(worldX, worldZ);
      this.yaw = targetYaw;

      const currentSpeed = input.nitro ? this.runSpeed : this.walkSpeed;
      this.speed = currentSpeed;

      this.x += worldX * currentSpeed * dt;
      this.z += worldZ * currentSpeed * dt;

      // Limb swing animation
      this.animTime += dt * (input.nitro ? 14 : 9);
      const swing = Math.sin(this.animTime) * 0.75;

      this.limbs.armL.rotation.x = -swing;
      this.limbs.armR.rotation.x = swing;
      this.limbs.legL.rotation.x = swing;
      this.limbs.legR.rotation.x = -swing;
    } else {
      this.speed = 0;
      // Idle pose
      this.limbs.armL.rotation.x *= 0.85;
      this.limbs.armR.rotation.x *= 0.85;
      this.limbs.legL.rotation.x *= 0.85;
      this.limbs.legR.rotation.x *= 0.85;
    }

    // 2. Jumping & Gravity
    if (input.handbrake && this.isGrounded) { // Spacebar jumps on foot
      this.velocityY = 7.5;
      this.isGrounded = false;
    }

    if (!this.isGrounded) {
      this.velocityY += this.gravity * dt;
      this.y += this.velocityY * dt;
      if (this.y <= 0) {
        this.y = 0;
        this.velocityY = 0;
        this.isGrounded = true;
      }
    }

    // Update 3D group position and rotation
    this.group.position.set(this.x, this.y, this.z);
    this.group.rotation.y = this.yaw + Math.PI;
  }

  exitVehicle(vehicle) {
    this.isInVehicle = false;
    this.currentVehicle = null;

    // Spawn 1.8 meters to the left of driver door
    const exitAngle = vehicle.angle - Math.PI / 2;
    this.x = vehicle.x + Math.cos(exitAngle) * 2.2;
    this.y = 0;
    this.z = vehicle.z + Math.sin(exitAngle) * 2.2;
    this.yaw = vehicle.angle;

    this.group.position.set(this.x, this.y, this.z);
    this.group.rotation.y = this.yaw;
    this.group.visible = true;
  }

  enterVehicle(vehicle) {
    this.isInVehicle = true;
    this.currentVehicle = vehicle;
    this.group.visible = false;
  }
}

window.Character3D = Character3D;
