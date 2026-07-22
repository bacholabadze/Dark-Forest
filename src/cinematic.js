import * as THREE from 'three';
import { skipActive } from './film/shots.js';

const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function tween(duration, step) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const tick = () => {
      if (skipActive()) { step(1); return resolve(); }
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
  const orbitC = new THREE.Vector3(10, 0, -20);
  await tween(durationA, (k) => {
    const e = ease(k);
    const ang = -Math.PI * 0.15 + e * Math.PI * 0.55;
    const r = 150 - e * 40;
    cam.position.set(
      orbitC.x + Math.cos(ang) * r,
      120 - e * 30,
      orbitC.z + Math.sin(ang) * r
    );
    // Look across sky SOLANA billboard → Raydium plaza
    cam.lookAt(new THREE.Vector3(12, 48 - e * 20, -40));
    cam.fov = 66 + 8 * Math.sin(e * Math.PI);
    cam.updateProjectionMatrix();
  });

  onStage?.(1);
  const from = cam.position.clone();
  const to = new THREE.Vector3(22, 5.2, 22);
  const lookFrom = new THREE.Vector3(10, 40, -40);
  const lookTo = new THREE.Vector3(22, 8, -4);
  await tween(durationB, (k) => {
    const e = ease(k);
    cam.position.lerpVectors(from, to, e);
    const swing = Math.sin(e * Math.PI) * 24 * (1 - e);
    cam.position.x += swing;
    cam.position.y += Math.sin(e * Math.PI * 2) * 4 * (1 - e);
    cam.lookAt(new THREE.Vector3().lerpVectors(lookFrom, lookTo, e));
    cam.fov = 80 - 18 * e;
    cam.updateProjectionMatrix();
  });

  rig.manual = false;
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
  rig.manual = false;
}
