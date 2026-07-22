// Waypoint mover — drives any rigged character along a path during film mode.
// It only writes root position/heading and switches anim clips; the main loop
// keeps ticking every mixer while filmState.active, so there is exactly one
// mixer.update per frame and no fight with player.js / bots.js.
// Placeholder-safe: capsules and octahedrons run waypoints the same as rigs.

import * as THREE from 'three';
import { setAnimState } from '../assets.js';
import { filmState, skipActive } from './shots.js';

/**
 * Wrap a character for cinematic driving.
 * root: the Object3D in the scene. anim: {mixer, action, clips} or null.
 * syncPos: optional callback so gameplay state (player.pos) follows the actor.
 */
export function createActor(root, anim = null, syncPos = null) {
  return { root, anim: () => (typeof anim === 'function' ? anim() : anim), syncPos };
}

function setClip(actor, prefer) {
  const anim = actor.anim();
  if (!anim) return;
  setAnimState(anim, prefer);
  // Player rigs boot with timeScale 0.001 — wake only for locomotion clips.
  if (prefer !== 'idle' && anim.action && !anim.frozenIdle && anim.action.timeScale < 0.01) {
    anim.action.timeScale = prefer === 'run' ? 1.35 : 1;
  }
}

/**
 * Move an actor through waypoints at a constant speed, facing travel
 * direction, playing the given clip. Resolves at the last point. If the
 * scene is skipped the actor teleports to the final waypoint so the next
 * shot still finds it where the script expects.
 */
export function moveAlong(actor, points, speed = 7, clip = 'walk') {
  return new Promise((resolve) => {
    if (!points.length) return resolve();
    setClip(actor, clip);

    const y = actor.root.position.y;
    const path = points.map((p) => new THREE.Vector3(p[0] ?? p.x, y, p[2] ?? p.z));
    let seg = 0;
    let last = performance.now();

    const finish = () => {
      setClip(actor, 'idle');
      actor.syncPos?.(actor.root.position);
      resolve();
    };

    function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (skipActive()) {
        const end = path[path.length - 1];
        actor.root.position.x = end.x;
        actor.root.position.z = end.z;
        return finish();
      }
      // World freeze (P5 / CAUGHT): hold pose — never keep a run loop going
      // while the root is parked, or it reads as "running in place".
      if (filmState.paused) {
        setClip(actor, 'idle');
        return requestAnimationFrame(tick);
      }

      const target = path[seg];
      const pos = actor.root.position;
      const to = new THREE.Vector3().subVectors(target, pos);
      to.y = 0;
      const dist = to.length();
      const step = speed * dt;

      if (dist <= step) {
        pos.x = target.x; pos.z = target.z;
        seg++;
        if (seg >= path.length) return finish();
        setClip(actor, clip); // resume locomotion after a brief waypoint snap
      } else {
        setClip(actor, clip);
        to.normalize();
        pos.addScaledVector(to, step);
        const heading = Math.atan2(to.x, to.z);
        let d = heading - actor.root.rotation.y;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        actor.root.rotation.y += d * Math.min(1, 12 * dt);
      }
      actor.syncPos?.(pos);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

/** Teleport an actor into position facing a heading — set-dressing between cuts. */
export function placeActor(actor, x, z, headingRad = 0) {
  actor.root.position.x = x;
  actor.root.position.z = z;
  actor.root.rotation.y = headingRad;
  actor.syncPos?.(actor.root.position);
}
