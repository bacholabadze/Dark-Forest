import * as THREE from 'three';
import { MOVE, PALETTE, MODELS } from './constants.js';
import { resolveCollisions } from './world.js';
import { loadGLB, cloneScene, normalise, stylise, bindAnimations, setAnimState } from './assets.js';

export function createPlayer(scene) {
  const root = new THREE.Group();

  const ph = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.52, 0.95, 6, 14),
    new THREE.MeshStandardMaterial({
      color: 0x3a6faa,
      roughness: 0.28,
      metalness: 0.75,
      emissive: PALETTE.cyan,
      emissiveIntensity: 1.0,
    })
  );
  body.position.y = 1.05;
  body.castShadow = true;
  ph.add(body);

  const visor = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: PALETTE.cyan })
  );
  visor.position.set(0, 1.62, 0.16);
  visor.rotation.x = 0.5;
  ph.add(visor);

  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 1.1, 0.1),
    new THREE.MeshBasicMaterial({ color: PALETTE.solanaB })
  );
  stripe.position.set(0, 1.05, -0.44);
  ph.add(stripe);

  root.add(ph);

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.7, 1.0, 28),
    new THREE.MeshBasicMaterial({ color: PALETTE.cyan, transparent: true, opacity: 0.28, side: THREE.DoubleSide })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.05;
  root.add(halo);

  const lamp = new THREE.PointLight(PALETTE.cyan, 4, 9, 2);
  lamp.position.set(0, 2.0, 1.2);
  root.add(lamp);
  const fillLamp = new THREE.PointLight(0xffffff, 3.5, 8, 2);
  fillLamp.position.set(-1.4, 2.4, -1.2);
  root.add(fillLamp);

  scene.add(root);

  const state = {
    root,
    placeholder: ph,
    model: null,
    anim: null,
    halo,
    pos: new THREE.Vector3(0, 0, 8),
    vel: new THREE.Vector3(),
    heading: Math.PI,
    grounded: true,
    coyote: 0,
    buffer: 0,
    sprinting: false,
    frozen: false,
    moving: false,
    idleT: 0,
  };

  root.position.copy(state.pos);
  return state;
}

export function setPlayerModel(p, obj, animations) {
  if (p.model) p.root.remove(p.model);
  p.placeholder.visible = false;
  p.model = obj;
  p.root.add(obj);
  p.anim = bindAnimations(obj, animations, 'walk');
  if (p.anim) setAnimState(p.anim, 'idle');
}

export async function loadPlayerModel(player, onInfo) {
  try {
    const gltf = await loadGLB(MODELS.ranger);
    const obj = cloneScene(gltf.scene);
    normalise(obj, 1.8);
    stylise(obj, PALETTE.cyan, 0.18);

    // The Running clip ships in a second GLB on the SAME rig — merge clips.
    let clips = [...gltf.animations];
    try {
      const run = await loadGLB(MODELS.rangerRun);
      clips = clips.concat(run.animations.map((c) => {
        const r = c.clone();
        if (!/run/i.test(r.name)) r.name = `Running_${r.name}`;
        return r;
      }));
    } catch { /* run clip optional — walk covers it */ }

    setPlayerModel(player, obj, clips);
    onInfo?.({ url: MODELS.ranger, clips: clips.map((c) => c.name) });
    return true;
  } catch (e) {
    console.warn('[player] model load failed', e);
    return false;
  }
}

// Barely-perceptible sway so a parked pose isn't a mannequin.
function breathe(model, t) {
  model.position.y = (model.userData.baseY || 0) + Math.sin(t * 1.6) * 0.02;
  model.rotation.z = Math.sin(t * 0.9) * 0.006;
}

export function updatePlayer(p, dt, input, camYaw) {
  if (p.frozen) {
    p.root.position.copy(p.pos);
    if (p.anim?.mixer) {
      p.anim.mixer.update(dt);
      setAnimState(p.anim, 'idle');
    }
    if (p.model) { p.idleT += dt; breathe(p.model, p.idleT); }
    p.moving = false;
    return false;
  }

  const fwd = new THREE.Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw));
  const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();

  const wish = new THREE.Vector3()
    .addScaledVector(fwd, input.z)
    .addScaledVector(right, input.x);

  const moving = wish.lengthSq() > 0.0001;
  if (moving) wish.normalize();

  p.sprinting = input.sprint && moving;
  const speed = p.sprinting ? MOVE.SPRINT : MOVE.WALK;

  p.vel.x = wish.x * speed;
  p.vel.z = wish.z * speed;

  p.coyote = p.grounded ? MOVE.COYOTE : Math.max(0, p.coyote - dt);
  p.buffer = input.jump ? MOVE.BUFFER : Math.max(0, p.buffer - dt);
  if (p.buffer > 0 && p.coyote > 0) {
    p.vel.y = MOVE.JUMP_V;
    p.grounded = false;
    p.coyote = 0;
    p.buffer = 0;
  }

  p.vel.y -= MOVE.GRAVITY * dt;
  p.pos.addScaledVector(p.vel, dt);

  if (p.pos.y <= 0) { p.pos.y = 0; p.vel.y = 0; p.grounded = true; }
  resolveCollisions(p.pos);

  if (moving) {
    const target = Math.atan2(wish.x, wish.z);
    let d = target - p.heading;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    p.heading += d * Math.min(1, MOVE.HEADING_LERP * dt);
  }

  p.root.position.copy(p.pos);
  p.root.rotation.y = p.heading;
  p.halo.position.y = 0.05 - p.pos.y;
  p.halo.material.opacity = 0.5 - Math.min(0.45, p.pos.y * 0.06);

  if (p.anim?.mixer) {
    p.anim.mixer.update(dt);
    if (moving) setAnimState(p.anim, p.sprinting ? 'run' : 'walk');
    else setAnimState(p.anim, 'idle');
  }

  if (p.model) {
    if (moving) {
      p.idleT = 0;
      p.model.position.y = p.model.userData.baseY || 0;
      p.model.rotation.z = 0;
    } else {
      p.idleT += dt;
      breathe(p.model, p.idleT);
    }
  }

  p.moving = moving;
  return moving;
}
