import * as THREE from 'three';
import { PALETTE, BOTS, MODELS } from './constants.js';
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
    root.position.set(def.pos[0], 0, def.pos[2]);

    const ph = placeholderBot(def.guilty);
    root.add(ph);

    const beacon = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 0.7, 4),
      new THREE.MeshBasicMaterial({ color: PALETTE.cyan })
    );
    beacon.position.y = 2.8;
    root.add(beacon);

    const column = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 8, 8, 1, true),
      new THREE.MeshBasicMaterial({
        color: def.guilty ? PALETTE.villain : PALETTE.cyan,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    column.position.y = 5;
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
      home: new THREE.Vector3(def.pos[0], 0, def.pos[2]),
      // Hand-authored plaza loop — continuous circuit, never hard-stop
      patrol: {
        waypoints: (def.waypoints || [[def.pos[0], def.pos[2]]]).map(
          ([x, z]) => new THREE.Vector3(x, 0, z)
        ),
        wi: 1,
        target: new THREE.Vector3(
          (def.waypoints?.[1]?.[0] ?? def.pos[0]),
          0,
          (def.waypoints?.[1]?.[1] ?? def.pos[2])
        ),
        speed: 2.4 + (i % 3) * 0.35,
      },
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

      const prefer = 'walk';
      b.anim = bindAnimations(obj, gltf.animations, prefer);
      if (b.anim) b.anim.action.timeScale = 1;
      ok++;
    } catch (e) {
      console.warn(`[bots] ${b.def.id} load failed`, e);
    }
  }
  return ok > 0;
}

function nextWaypoint(p) {
  p.wi = (p.wi + 1) % p.waypoints.length;
  p.target.copy(p.waypoints[p.wi]);
}

export function updateBots(bots, dt, t, playerPos) {
  for (const b of bots) {
    if (b.anim?.mixer) b.anim.mixer.update(dt);

    if (b.caged) {
      if (b.anim) setAnimState(b.anim, 'idle');
      b.root.rotation.y += dt * 0.35;
      continue;
    }

    if (b.fleeing) {
      if (b.anim) setAnimState(b.anim, 'run');
      const away = new THREE.Vector3().subVectors(b.root.position, playerPos).setY(0);
      if (away.lengthSq() < 0.001) away.set(1, 0, 0);
      away.normalize();
      const next = b.root.position.clone().addScaledVector(away, 9.2 * dt);
      // Keep flee inside open plaza ring — no building penetration
      if (next.length() > 46 || Math.hypot(next.x - 22, next.z + 6) > 18) {
        const tangent = new THREE.Vector3(-away.z, 0, away.x);
        next.copy(b.root.position).addScaledVector(tangent, 9.2 * dt);
      }
      b.root.position.x = next.x;
      b.root.position.z = next.z;
      b.root.lookAt(playerPos.x, b.root.position.y, playerPos.z);
    } else {
      // Continuous closed-loop patrol — never hard-stop mid-path
      const p = b.patrol;
      const to = new THREE.Vector3().subVectors(p.target, b.root.position);
      to.y = 0;
      const dist = to.length();
      if (dist < 0.55) {
        nextWaypoint(p);
      } else {
        to.normalize();
        // Gentle speed variation so the pack doesn't look mechanical
        const spd = p.speed * (0.92 + 0.08 * Math.sin(t * 0.7 + b.phase));
        b.root.position.addScaledVector(to, spd * dt);
        const heading = Math.atan2(to.x, to.z);
        let d = heading - b.root.rotation.y;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        b.root.rotation.y += d * Math.min(1, 10 * dt);
        if (b.anim) setAnimState(b.anim, 'walk');
      }
    }

    b.beacon.visible = !b.scanned;
    b.beacon.position.y = 2.8 + Math.sin(t * 3 + b.phase) * 0.12;
    b.beacon.rotation.y += dt * 2;
    // No sky-beams — they made the plaza feel like a wall of statues
    if (b.root.userData.column) b.root.userData.column.visible = false;
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
