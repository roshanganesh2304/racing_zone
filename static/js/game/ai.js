/**
 * RACING ZONE - Intelligent Real-Life Supercar AI Opponents
 */

class AIRacerController {
  constructor(vehicle, trackData, difficulty = 'normal', laneOffset = 0) {
    this.vehicle = vehicle;
    this.waypoints = trackData.waypoints;
    this.currentWaypointIndex = 1;
    this.difficulty = difficulty;
    this.laneOffset = laneOffset; // Offset perpendicular to track line (-40 to +40)
    this.reactionSpeed = difficulty === 'hard' ? 0.95 : 0.85;
    this.lookAheadDistance = 240;
  }

  update(dt, allVehicles) {
    if (this.vehicle.raceFinished) {
      return { throttle: false, brake: true, left: false, right: false, nitro: false };
    }

    // 1. Find target waypoint
    const currentWp = this.waypoints[this.currentWaypointIndex];
    const nextWp = this.waypoints[(this.currentWaypointIndex + 1) % this.waypoints.length];

    // Compute track tangent & normal vector for lane offset
    const dxTrack = nextWp.x - currentWp.x;
    const dyTrack = nextWp.y - currentWp.y;
    const trackLen = Math.hypot(dxTrack, dyTrack) || 1;
    const normX = -dyTrack / trackLen;
    const normY = dxTrack / trackLen;

    // Target point with lane offset
    const targetX = currentWp.x + normX * this.laneOffset;
    const targetY = currentWp.y + normY * this.laneOffset;

    const toTargetX = targetX - this.vehicle.x;
    const toTargetY = targetY - this.vehicle.y;
    const distToTarget = Math.hypot(toTargetX, toTargetY);

    // If close enough to waypoint, advance to next
    if (distToTarget < this.lookAheadDistance) {
      this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
    }

    // 2. Steer towards target
    const targetAngle = Math.atan2(toTargetY, toTargetX);
    let angleDiff = targetAngle - this.vehicle.angle;

    // Normalize angle difference to [-PI, PI]
    angleDiff = Math.atan2(Math.sin(targetAngle - this.vehicle.angle), Math.cos(targetAngle - this.vehicle.angle));
    if (!Number.isFinite(angleDiff)) angleDiff = 0;

    let left = false;
    let right = false;
    if (angleDiff < -0.06) left = true;
    if (angleDiff > 0.06) right = true;

    // 3. Cornering Speed & Braking Control
    // Next corner curvature estimation
    const wpAfterNext = this.waypoints[(this.currentWaypointIndex + 2) % this.waypoints.length];
    const turnAngle = Math.abs(Math.atan2(wpAfterNext.y - nextWp.y, wpAfterNext.x - nextWp.x) - targetAngle);

    let maxCornerSpeed = this.vehicle.maxSpeed;
    if (turnAngle > 0.8) {
      // Sharp hairpin turn
      maxCornerSpeed = this.vehicle.maxSpeed * 0.42;
    } else if (turnAngle > 0.4) {
      // Moderate bend
      maxCornerSpeed = this.vehicle.maxSpeed * 0.65;
    }

    let throttle = true;
    let brake = false;
    let nitro = false;

    if (this.vehicle.speed > maxCornerSpeed && distToTarget < 320) {
      throttle = false;
      brake = true;
    } else {
      throttle = true;
      brake = false;
    }

    // 4. Nitro on straightaways
    if (turnAngle < 0.25 && distToTarget > 400 && this.vehicle.speed > 250 && Math.random() < 0.08) {
      nitro = true;
    }

    // 5. Collision Avoidance (gentle steer away from nearby cars)
    for (const other of allVehicles) {
      if (other === this.vehicle) continue;
      const ox = other.x - this.vehicle.x;
      const oy = other.y - this.vehicle.y;
      const odist = Math.hypot(ox, oy);
      if (odist < 90) {
        // Car is directly ahead or beside: steer around
        const cross = Math.cos(this.vehicle.angle) * oy - Math.sin(this.vehicle.angle) * ox;
        if (cross > 0) {
          left = true;
          right = false;
        } else {
          right = true;
          left = false;
        }
      }
    }

    return { throttle, brake, left, right, nitro, handbrake: false };
  }
}
