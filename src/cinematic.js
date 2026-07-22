import * as THREE from 'three';

const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function tween(duration, step) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const tick = () => {
      const k = Math.min(1, (performance.now() - t0) / (duration * 1000));
      step(k);
      if (k < 1) requestAnimationFrame(tick);
      else resolve();
    };
    tick();
  });
}

/**
 * Scene 2.5 — the reveal. Slow turntable around Ranger One, low angle,
 * rising to eye level. The first proper look at the hero.
 */
export async function reveal(rig, target, duration = 7.5) {
  rig.manual = true;
  const cam = rig.camera;
  const center = target.clone().setY(target.y + 1.1);

  await tween(duration, (k) => {
    const e = easeOut(k);
    const ang = Math.PI * 0.25 + e * Math.PI * 1.35;
    const r = 6.5 - e * 2.6;
    const h = 0.5 + e * 1.6;
    cam.position.set(
      center.x + Math.cos(ang) * r,
      center.y + h,
      center.z + Math.sin(ang) * r
    );
    cam.lookAt(center);
    cam.fov = 50 - 8 * e;
    cam.updateProjectionMatrix();
  });
  // Same handoff as descent/punchIn — without this, the one frame between
  // reveal and descent rebuilds from the stale yaw and cuts ~90°.
  seedYaw(rig);
  rig.manual = false;
}

/**
 * Scene 3 — the descent, two stages:
 * stage A: high orbital drift over the whole city (establishing shot)
 * stage B: spiral dive into the district, pulling up behind the player
 */
export async function descent(rig, onStage, durationA = 6.0, durationB = 6.0) {
  rig.manual = true;
  const cam = rig.camera;

  onStage?.(0);
  const orbitC = new THREE.Vector3(0, 0, -10);
  await tween(durationA, (k) => {
    const e = ease(k);
    const ang = -Math.PI * 0.15 + e * Math.PI * 0.55;
    const r = 150 - e * 40;
    cam.position.set(
      orbitC.x + Math.cos(ang) * r,
      120 - e * 30,
      orbitC.z + Math.sin(ang) * r
    );
    cam.lookAt(new THREE.Vector3(0, 18 - e * 8, -14));
    cam.fov = 66 + 8 * Math.sin(e * Math.PI);
    cam.updateProjectionMatrix();
  });

  onStage?.(1);
  const from = cam.position.clone();
  const to = new THREE.Vector3(6, 4.6, 22);
  const lookFrom = new THREE.Vector3(0, 30, -16);
  const lookTo = new THREE.Vector3(0, 1.4, 8);
  await tween(durationB, (k) => {
    const e = ease(k);
    cam.position.lerpVectors(from, to, e);
    const swing = Math.sin(e * Math.PI) * 30 * (1 - e);
    cam.position.x += swing;
    cam.position.y += Math.sin(e * Math.PI * 2) * 4 * (1 - e);
    cam.lookAt(new THREE.Vector3().lerpVectors(lookFrom, lookTo, e));
    cam.fov = 80 - 18 * e;
    cam.updateProjectionMatrix();
  });

  seedYaw(rig);
  rig.manual = false;
}

/**
 * Seed rig.yaw from where the cinematic actually left the camera, so the
 * first gameplay frame resumes from that framing instead of teleporting
 * back to the stale pre-cinematic yaw (a ~158° cut after the descent).
 */
function seedYaw(rig) {
  const off = rig.camera.position.clone().sub(rig.target);
  rig.yaw = Math.atan2(off.x, off.z);
}

/** Scene 7 — pull up and away so the moon can rise over the city. */
export async function ascent(rig, playerPos, duration = 5.0) {
  rig.manual = true;
  const cam = rig.camera;
  const from = cam.position.clone();
  const to = new THREE.Vector3(playerPos.x + 4, 52, playerPos.z + 44);
  const lookFrom = playerPos.clone().setY(playerPos.y + 1.4);
  const lookTo = new THREE.Vector3(playerPos.x, 28, playerPos.z - 10);

  await tween(duration, (k) => {
    const e = ease(k);
    cam.position.lerpVectors(from, to, e);
    cam.lookAt(new THREE.Vector3().lerpVectors(lookFrom, lookTo, e));
  });
}

/** A quick shove toward a target — used when the guilty bot is exposed. */
export async function punchIn(rig, target, duration = 1.5) {
  rig.manual = true;
  const cam = rig.camera;
  const from = cam.position.clone();
  const fromLook = target.clone();
  const dir = new THREE.Vector3().subVectors(from, target).setY(0).normalize();
  const to = target.clone().addScaledVector(dir, 6).setY(target.y + 2.2);

  await tween(duration, (k) => {
    cam.position.lerpVectors(from, to, ease(k));
    cam.lookAt(fromLook);
  });
  seedYaw(rig);
  rig.manual = false;
}
