import { CAM, MOVE } from './constants.js';
import { colliders } from './world.js';
import * as THREE from 'three';

export function createCameraRig(camera) {
  return {
    camera,
    yaw: Math.PI,
    pitch: 0.30,
    dist: CAM.DIST,
    target: new THREE.Vector3(),
    manual: false,
    /** While > 0, mouse free-look wins over WASD follow. */
    lookHold: 0,
  };
}

function clampAgainstBuildings(origin, dir, maxDist) {
  let best = maxDist;
  for (const c of colliders) {
    const minX = c.x - c.hw, maxX = c.x + c.hw;
    const minZ = c.z - c.hd, maxZ = c.z + c.hd;
    let t0 = 0, t1 = maxDist;

    for (const [o, d, lo, hi] of [[origin.x, dir.x, minX, maxX], [origin.z, dir.z, minZ, maxZ]]) {
      if (Math.abs(d) < 1e-6) { if (o < lo || o > hi) { t0 = t1 + 1; break; } continue; }
      let a = (lo - o) / d, b = (hi - o) / d;
      if (a > b) [a, b] = [b, a];
      t0 = Math.max(t0, a); t1 = Math.min(t1, b);
      if (t0 > t1) break;
    }
    if (t0 <= t1 && t0 > 0.2) {
      const hitY = origin.y + dir.y * t0;
      if (hitY < c.maxY) best = Math.min(best, t0 - 0.35);
    }
  }
  return Math.max(CAM.MIN, best);
}

function shortestDelta(from, to) {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * PlayStation-style 3rd person:
 * - WASD moves relative to camera (unchanged in player.js)
 * - While moving (and not mouse-looking), camera yaw follows behind the face
 * - Mouse drag = temporary free look; after LOOK_HOLD, follow resumes on move
 */
export function updateCamera(rig, dt, playerPos, sprinting, heading = 0, moving = false) {
  if (rig.manual) return;

  if (rig.lookHold > 0) rig.lookHold = Math.max(0, rig.lookHold - dt);

  if (moving && rig.lookHold <= 0) {
    // Sit behind the character: yaw = heading + π
    const want = heading + Math.PI;
    rig.yaw += shortestDelta(rig.yaw, want) * Math.min(1, CAM.FOLLOW * dt);
    // Soft-reset pitch toward default while following
    rig.pitch += (0.30 - rig.pitch) * Math.min(1, 3 * dt);
  }

  rig.target.lerp(
    new THREE.Vector3(playerPos.x, playerPos.y + CAM.HEIGHT, playerPos.z),
    Math.min(1, CAM.LERP * dt)
  );

  const dir = new THREE.Vector3(
    Math.sin(rig.yaw) * Math.cos(rig.pitch),
    Math.sin(rig.pitch),
    Math.cos(rig.yaw) * Math.cos(rig.pitch)
  );

  const dist = clampAgainstBuildings(rig.target, dir, rig.dist);
  rig.camera.position.copy(rig.target).addScaledVector(dir, dist);
  rig.camera.lookAt(rig.target);

  const want = sprinting ? MOVE.FOV_SPRINT : MOVE.FOV;
  rig.camera.fov += (want - rig.camera.fov) * Math.min(1, 4 * dt);
  rig.camera.updateProjectionMatrix();
}
