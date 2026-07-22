// Shot vocabulary — promise-based camera moves that compose into scenes.
// Every shot respects the global skip flag: once ENTER is pressed, every
// remaining tween in the current film step resolves instantly at its end
// pose, so a skipped scene still lands coherently. The director clears the
// flag between film steps.

import * as THREE from 'three';

const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// Shared film runtime state — main.js gates its update loop on this.
export const filmState = { active: false, paused: false };

let skipRequested = false;
export const requestSkip = () => { skipRequested = true; };
export const clearSkip = () => { skipRequested = false; };
export const skipActive = () => skipRequested;

export function tween(duration, step) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const tick = () => {
      if (skipRequested) { step(1); return resolve(); }
      const k = Math.min(1, (performance.now() - t0) / (duration * 1000));
      step(k);
      if (k < 1) requestAnimationFrame(tick);
      else resolve();
    };
    tick();
  });
}

/** Skippable wait — use instead of setTimeout inside film scenes. */
export const hold = (sec) => tween(sec, () => {});

const v3 = (p) => (p.isVector3 ? p.clone() : new THREE.Vector3(p[0], p[1], p[2]));

/** Straight camera glide with an interpolated look target. */
export function dolly(rig, from, to, lookFrom, lookTo, dur = 4, fovFrom = 55, fovTo = 55) {
  rig.manual = true;
  const cam = rig.camera;
  const a = v3(from), b = v3(to);
  const la = v3(lookFrom), lb = v3(lookTo ?? lookFrom);
  return tween(dur, (k) => {
    const e = ease(k);
    cam.position.lerpVectors(a, b, e);
    cam.lookAt(new THREE.Vector3().lerpVectors(la, lb, e));
    cam.fov = fovFrom + (fovTo - fovFrom) * e;
    cam.updateProjectionMatrix();
  });
}

/** Vertical crane drop with a dutch tilt that settles as the camera lands. */
export function crane(rig, top, bottom, look, dur = 4, dutch = 0.14) {
  rig.manual = true;
  const cam = rig.camera;
  const a = v3(top), b = v3(bottom);
  const l = v3(look);
  return tween(dur, (k) => {
    const e = ease(k);
    cam.position.lerpVectors(a, b, e);
    cam.lookAt(l);
    cam.rotateZ(dutch * (1 - e * 0.6));
    cam.fov = 70 - 12 * e;
    cam.updateProjectionMatrix();
  });
}

/** Camera glides on a fixed rail but keeps the actor framed — occlusion-proof
 *  version of dolly for shots where the subject must never leave the lens. */
export function dollyTrack(rig, from, to, actorRoot, dur = 4, fovFrom = 55, fovTo = 55) {
  rig.manual = true;
  const cam = rig.camera;
  const a = v3(from), b = v3(to);
  return tween(dur, (k) => {
    const e = ease(k);
    cam.position.lerpVectors(a, b, e);
    cam.lookAt(actorRoot.position.x, actorRoot.position.y + 1.3, actorRoot.position.z);
    cam.fov = fovFrom + (fovTo - fovFrom) * e;
    cam.updateProjectionMatrix();
  });
}

/** Chase cam — follows a moving actor from a shoulder offset, wide FOV. */
export function track(rig, actorRoot, offset = [0, 2.2, -4.8], dur = 5, fov = 84) {
  rig.manual = true;
  const cam = rig.camera;
  const off = v3(offset);
  return tween(dur, () => {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, actorRoot.rotation.y, 0));
    const p = off.clone().applyQuaternion(q).add(actorRoot.position);
    cam.position.lerp(p, 0.16);
    cam.lookAt(actorRoot.position.x, actorRoot.position.y + 1.5, actorRoot.position.z);
    cam.fov += (fov - cam.fov) * 0.08;
    cam.updateProjectionMatrix();
  });
}

/** Freeze frame — stops the world clock (render-only), holds, releases. */
export async function freeze(dur = 2.2) {
  filmState.paused = true;
  await hold(dur);
  filmState.paused = false;
}

/** Two-frame hard black — the smash cut. */
export async function smashCut(dur = 0.14) {
  const el = document.getElementById('smash');
  el.classList.add('on');
  await hold(dur);
  el.classList.remove('on');
}

/** Typewriter title card over black. lines: array of strings (HTML ok). */
export async function titleCard(lines, holdMs = 2400) {
  const el = document.getElementById('titlecard');
  el.classList.remove('hidden');
  const box = el.querySelector('.tc-lines');
  box.innerHTML = '';
  for (let i = 0; i < lines.length; i++) {
    if (skipRequested) break;
    box.innerHTML = lines.slice(0, i + 1).join('<br>');
    await hold(0.9);
  }
  box.innerHTML = lines.join('<br>');
  await hold(skipRequested ? 0.12 : holdMs / 1000);
  el.classList.add('hidden');
}

/** Heartbeat ticker — slow fact drip over black (the P1 cold open). */
export async function heartbeat(facts, stepMs = 1100) {
  const el = document.getElementById('titlecard');
  el.classList.remove('hidden');
  const box = el.querySelector('.tc-lines');
  box.innerHTML = '';
  for (let i = 0; i < facts.length; i++) {
    if (skipRequested) break;
    box.innerHTML = `<span class="hb">${facts.slice(0, i + 1).join('&ensp;·&ensp;')}</span>`;
    await hold(stepMs / 1000);
  }
  await hold(skipRequested ? 0.1 : 0.7);
  el.classList.add('hidden');
}
