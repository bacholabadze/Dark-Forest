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

export function updateCamera(rig, dt, playerPos, sprinting) {
  if (rig.manual) return;

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
