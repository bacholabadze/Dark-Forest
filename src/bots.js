import * as THREE from 'three';
import { PALETTE, BOTS, MODELS, HQ } from './constants.js';
import { resolveCollisions } from './world.js';
import { loadGLB, cloneScene, normalise, stylise, countTriangles, bindAnimations, setAnimState } from './assets.js';

function placeholderBot(guilty) {
  const g = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.95, 0),
    new THREE.MeshStandardMaterial({
      color: 0x2a4060,
      roughness: 0.3,
      metalness: 0.85,
      emissive: guilty ? PALETTE.villain : PALETTE.cyan,
      emissiveIntensity: 0.75,
    })
  );
  core.castShadow = true;
  g.add(core);

  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 12, 10),
    new THREE.MeshBasicMaterial({ color: guilty ? PALETTE.villain : PALETTE.cyan })
  );
  eye.position.set(0, 1.2, 0.55);
  g.add(eye);
  return g;
}

export function createBots(scene) {
  return BOTS.map((def, i) => {
    const root = new THREE.Group();
    // Spawn on the Raydium patrol ring, 120° apart so they never converge.
    const patrolAngle = i * (Math.PI * 2 / 3);
    root.position.set(
      HQ.X + Math.cos(patrolAngle) * HQ.PATROL_RADIUS,
      0,
      HQ.Z + Math.sin(patrolAngle) * HQ.PATROL_RADIUS
    );

    const ph = placeholderBot(def.guilty);
    root.add(ph);

    const beacon = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 0.7, 4),
      new THREE.MeshBasicMaterial({ color: PALETTE.cyan })
    );
    beacon.position.y = 2.8;
    root.add(beacon);

    const column = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 60, 8, 1, true),
      new THREE.MeshBasicMaterial({
        color: def.guilty ? PALETTE.villain : PALETTE.cyan,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    column.position.y = 28;
    root.add(column);
    root.userData.column = column;

    const lamp = new THREE.PointLight(def.guilty ? PALETTE.villain : PALETTE.cyan, 10, 14, 2);
    lamp.position.set(0, 2.2, 1.0);
    root.add(lamp);
    const keyLamp = new THREE.PointLight(0xd0e8ff, 6, 12, 2);
    keyLamp.position.set(1.4, 2.6, 1.8);
    root.add(keyLamp);

    scene.add(root);
    return {
      def,
      root,
      placeholder: ph,
      model: null,
      anim: null,
      beacon,
      scanned: false,
      fleeing: false,
      caged: false,
      phase: i * 1.7,
      patrolAngle,
      offset: new THREE.Vector3(),   // avoidance-bubble displacement
      heading: Math.atan2(-Math.sin(patrolAngle), Math.cos(patrolAngle)),
    };
  });
}

const MODEL_URL = {
  guilty: MODELS.guilty,
  botA: MODELS.botA,
  botB: MODELS.botB,
};

export async function loadBotModels(bots, onInfo) {
  let ok = 0;
  for (const b of bots) {
    const url = MODEL_URL[b.def.modelKey];
    if (!url) continue;
    try {
      const gltf = await loadGLB(url);
      const tris = countTriangles(gltf.scene);
      onInfo?.({ tris, url, id: b.def.id });

      const obj = cloneScene(gltf.scene);
      normalise(obj, b.def.guilty ? 2.8 : 2.6);
      stylise(obj, b.def.guilty ? PALETTE.villain : PALETTE.cyan, b.def.guilty ? 0.5 : 0.35);

      b.placeholder.visible = false;
      b.model = obj;
      b.root.add(obj);

      const prefer = b.def.guilty ? 'idle' : 'walk';
      b.anim = bindAnimations(obj, gltf.animations, prefer);
      if (b.anim) setAnimState(b.anim, 'idle');
      ok++;
    } catch (e) {
      console.warn(`[bots] ${b.def.id} load failed`, e);
    }
  }
  return ok > 0;
}

// Barely-perceptible sway for parked (idle) rigs.
function breathe(model, t) {
  model.position.y = (model.userData.baseY || 0) + Math.sin(t * 1.6) * 0.02;
  model.rotation.z = Math.sin(t * 0.9) * 0.006;
}

const _pos = new THREE.Vector3();
const _away = new THREE.Vector3();

export function updateBots(bots, dt, t, playerPos) {
  for (const b of bots) {
    if (b.anim?.mixer) b.anim.mixer.update(dt);

    if (b.caged) {
      if (b.anim) setAnimState(b.anim, 'idle');
      if (b.model) breathe(b.model, t + b.phase);
      b.root.rotation.y += dt * 0.35;
      continue;
    }

    if (b.fleeing) {
      if (b.anim) setAnimState(b.anim, 'run');
      if (b.model) {
        b.model.position.y = b.model.userData.baseY || 0;
        b.model.rotation.z = 0;
      }
      const away = new THREE.Vector3().subVectors(b.root.position, playerPos).setY(0);
      if (away.lengthSq() < 0.001) away.set(1, 0, 0);
      away.normalize();
      const next = b.root.position.clone().addScaledVector(away, 9.2 * dt);
      // 70, not 46: the patrol ring around the HQ reaches ~49 from origin,
      // and the old bound snapped fleeing bots sideways the instant they ran.
      if (next.length() > 70) {
        const tangent = new THREE.Vector3(-next.z, 0, next.x).normalize();
        next.copy(b.root.position).addScaledVector(tangent, 9.2 * dt);
      }
      b.root.position.x = next.x;
      b.root.position.z = next.z;
      b.root.lookAt(playerPos.x, b.root.position.y, playerPos.z);
    } else {
      // Patrol the Raydium perimeter ring.
      b.patrolAngle += (HQ.PATROL_SPEED / HQ.PATROL_RADIUS) * dt;
      const rx = HQ.X + Math.cos(b.patrolAngle) * HQ.PATROL_RADIUS;
      const rz = HQ.Z + Math.sin(b.patrolAngle) * HQ.PATROL_RADIUS;

      // Avoidance bubble: push along (bot − player) by penetration depth,
      // decay back toward the ring — a slide-aside, not a retreat. 2.2 stays
      // well inside the 4.6 scan range so bots never become unscannable.
      _pos.set(rx + b.offset.x, 0, rz + b.offset.z);
      _away.subVectors(_pos, playerPos).setY(0);
      const pd = _away.length();
      if (pd < HQ.BUBBLE && pd > 0.001) {
        b.offset.addScaledVector(_away.normalize(), HQ.BUBBLE - pd);
      }
      b.offset.multiplyScalar(1 - Math.min(1, 2 * dt));

      _pos.set(rx + b.offset.x, 0, rz + b.offset.z);
      resolveCollisions(_pos);

      const moved = Math.hypot(_pos.x - b.root.position.x, _pos.z - b.root.position.z) > 0.4 * dt;
      b.root.position.x = _pos.x;
      b.root.position.z = _pos.z;

      // Face the ring tangent with the shortest-angle lerp — smooth turns.
      const target = Math.atan2(-Math.sin(b.patrolAngle), Math.cos(b.patrolAngle));
      let dh = target - b.heading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      b.heading += dh * Math.min(1, 10 * dt);
      b.root.rotation.y = b.heading;

      if (moved) {
        if (b.anim) setAnimState(b.anim, 'walk');
        // breathe() is only for parked rigs — it fights the walk cycle.
        if (b.model) {
          b.model.position.y = b.model.userData.baseY || 0;
          b.model.rotation.z = 0;
        }
      } else {
        if (b.anim) setAnimState(b.anim, 'idle');
        // Phase offset so the three suspects don't breathe in lockstep.
        if (b.model) breathe(b.model, t + b.phase);
      }
    }

    b.beacon.visible = !b.scanned;
    b.beacon.position.y = 2.8 + Math.sin(t * 3 + b.phase) * 0.12;
    b.beacon.rotation.y += dt * 2;
    if (b.root.userData.column) {
      b.root.userData.column.visible = !b.scanned || b.fleeing;
      b.root.userData.column.material.opacity = b.fleeing ? 0.45 : 0.22;
    }
  }
}

export function nearestBot(bots, pos, range = 4.6) {
  let best = null, bd = range;
  for (const b of bots) {
    if (b.caged) continue;
    const d = b.root.position.distanceTo(pos);
    if (d < bd) { bd = d; best = b; }
  }
  return best;
}

export function createCage(scene, pos) {
  const g = new THREE.Group();
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 3.4, 3.4),
    new THREE.MeshBasicMaterial({
      color: PALETTE.solanaB,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  g.add(box);
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(3.4, 3.4, 3.4)),
    new THREE.LineBasicMaterial({ color: PALETTE.cyan })
  );
  g.add(edges);
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.05, 6, 40),
      new THREE.MeshBasicMaterial({ color: PALETTE.magenta, transparent: true, opacity: 0.75 })
    );
    r.rotation.x = Math.PI / 2;
    r.position.y = -1.2 + i * 1.2;
    g.add(r);
    g.userData[`r${i}`] = r;
  }
  g.position.copy(pos);
  g.position.y = 1.2;
  g.scale.setScalar(0.01);
  scene.add(g);
  return g;
}
