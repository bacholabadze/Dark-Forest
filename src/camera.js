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
    lookHold: 0,   // seconds of manual-drag priority before follow resumes
  };
}

function wrapAngle(d) {
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
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

export function updateCamera(rig, dt, player, input) {
  if (rig.manual) return;

  if (rig.lookHold > 0) rig.lookHold -= dt;

  // Auto-follow: swing behind the player at constant angular velocity.
  // Gated on forward dominance — the heading feeds back into movement via
  // camYaw, and pure-lateral input has no stable equilibrium (it would spin
  // the player in a circle forever). Equilibrium is yaw = heading − π.
  if (player.moving && rig.lookHold <= 0) {
    const fwdWeight = input.z > 0 ? input.z / (Math.abs(input.x) + input.z) : 0;
    if (fwdWeight > 0) {
      const step = CAM.FOLLOW * fwdWeight * dt;
      const d = wrapAngle((player.heading - Math.PI) - rig.yaw);
      if (Math.abs(d) > CAM.FOLLOW_DEADZONE) {
        rig.yaw += Math.sign(d) * Math.min(Math.abs(d), step);
      }
    }
  }

  rig.target.lerp(
    new THREE.Vector3(player.pos.x, player.pos.y + CAM.HEIGHT, player.pos.z),
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

  const want = player.sprinting ? MOVE.FOV_SPRINT : MOVE.FOV;
  rig.camera.fov += (want - rig.camera.fov) * Math.min(1, 4 * dt);
  rig.camera.updateProjectionMatrix();
}
