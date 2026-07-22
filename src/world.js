import * as THREE from 'three';
import { PALETTE, WORLD } from './constants.js';

export const colliders = [];

function addCollider(x, z, w, d, maxY) {
  colliders.push({ x, z, hw: w / 2, hd: d / 2, maxY });
}

const rand = (() => { let s = 1337; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

function addStarfield(scene) {
  const n = 1200;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 400;
    pos[i * 3 + 1] = 20 + Math.random() * 180;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 400;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xaaccff,
    size: 0.35,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });
  scene.add(new THREE.Points(geo, mat));
}

export function buildWorld(scene) {
  scene.background = new THREE.Color(PALETTE.void);
  // Density tuned for the aerial establishing shot — 0.009 blacked out the
  // city from 120 units up; the descent must show a glowing skyline.
  scene.fog = new THREE.FogExp2(PALETTE.sky, 0.0045);
  addStarfield(scene);

  const group = new THREE.Group();
  scene.add(group);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD.SIZE * 2, WORLD.SIZE * 2),
    new THREE.MeshStandardMaterial({ color: 0x1a2848, roughness: 0.55, metalness: 0.5 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  const grid = new THREE.GridHelper(WORLD.SIZE * 2, 80, PALETTE.cyan, PALETTE.purple);
  grid.material.transparent = true;
  grid.material.opacity = 0.42;
  grid.position.y = 0.02;
  group.add(grid);

  const shell = new THREE.MeshStandardMaterial({
    color: 0x2A3F6B,
    roughness: 0.45,
    metalness: 0.65,
    emissive: 0x1E4A8C,
    emissiveIntensity: 1.2,
  });
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const stripGeo = new THREE.BoxGeometry(1, 1, 1);

  const shells = new THREE.InstancedMesh(boxGeo, shell, WORLD.BLOCKS);
  const stripMatA = new THREE.MeshBasicMaterial({ color: PALETTE.cyan });
  const stripMatB = new THREE.MeshBasicMaterial({ color: PALETTE.magenta });
  const stripsA = new THREE.InstancedMesh(stripGeo, stripMatA, WORLD.BLOCKS * 6);
  const stripsB = new THREE.InstancedMesh(stripGeo, stripMatB, WORLD.BLOCKS * 6);

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1);
  let ai = 0, bi = 0;

  for (let i = 0; i < WORLD.BLOCKS; i++) {
    const ring = 22 + Math.floor(i / 8) * 17;
    const ang = (i / 8) * Math.PI * 2 + (i % 3) * 0.28;
    const x = Math.cos(ang) * ring + (rand() - 0.5) * 10;
    const z = Math.sin(ang) * ring + (rand() - 0.5) * 10;
    const w = 5 + rand() * 7, d = 5 + rand() * 7, h = 10 + rand() * 30;

    m.compose(new THREE.Vector3(x, h / 2, z), q, new THREE.Vector3(w, h, d));
    shells.setMatrixAt(i, m);
    addCollider(x, z, w, d, h);

    const bands = 3 + Math.floor(rand() * 4);
    for (let b = 0; b < bands; b++) {
      const y = (h / (bands + 1)) * (b + 1);
      const useA = rand() > 0.42;
      const target = useA ? stripsA : stripsB;
      const idx = useA ? ai++ : bi++;
      if (idx >= WORLD.BLOCKS * 6) continue;
      m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(w + 0.12, 0.18, d + 0.12));
      target.setMatrixAt(idx, m);
    }
  }
  shells.instanceMatrix.needsUpdate = true;
  stripsA.count = ai;
  stripsB.count = bi;
  stripsA.instanceMatrix.needsUpdate = true;
  stripsB.instanceMatrix.needsUpdate = true;
  group.add(shells, stripsA, stripsB);

  const tower = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(3.2, 4.6, 46, 8),
    new THREE.MeshStandardMaterial({
      color: 0x1a3058,
      roughness: 0.35,
      metalness: 0.85,
      emissive: PALETTE.purple,
      emissiveIntensity: 0.4,
    })
  );
  core.position.y = 23;
  tower.add(core);
  for (let i = 0; i < 9; i++) {
    const r = new THREE.Mesh(
      new THREE.TorusGeometry(3.6 + i * 0.06, 0.09, 6, 32),
      new THREE.MeshBasicMaterial({ color: i % 2 ? PALETTE.magenta : PALETTE.cyan })
    );
    r.rotation.x = Math.PI / 2;
    r.position.y = 5 + i * 4.7;
    tower.add(r);
  }
  const beacon = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.8),
    new THREE.MeshBasicMaterial({ color: PALETTE.cyan })
  );
  beacon.position.y = 48;
  tower.add(beacon);
  tower.position.set(0, 0, -34);
  group.add(tower);
  addCollider(0, -34, 9, 9, 46);

  const reactor = new THREE.Group();
  const well = new THREE.Mesh(
    new THREE.CylinderGeometry(7, 7, 0.5, 40),
    new THREE.MeshBasicMaterial({ color: PALETTE.solanaA, transparent: true, opacity: 0.55 })
  );
  well.position.y = 0.12;
  reactor.add(well);
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(7.2, 0.22, 8, 48),
    new THREE.MeshBasicMaterial({ color: PALETTE.solanaB })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.35;
  reactor.add(rim);
  reactor.position.set(-28, 0, -22);
  group.add(reactor);

  scene.add(new THREE.AmbientLight(0x6688cc, 2.0));
  scene.add(new THREE.HemisphereLight(0x8866FF, 0x0a2040, 1.4));
  const key = new THREE.DirectionalLight(0xbfe4ff, 1.8);
  key.position.set(24, 40, 16);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -50;
  key.shadow.camera.right = 50;
  key.shadow.camera.top = 50;
  key.shadow.camera.bottom = -50;
  scene.add(key);
  const rim2 = new THREE.DirectionalLight(PALETTE.magenta, 1.0);
  rim2.position.set(-20, 14, -26);
  scene.add(rim2);
  const fill = new THREE.DirectionalLight(PALETTE.cyan, 0.65);
  fill.position.set(10, 8, 30);
  scene.add(fill);

  return { group, tower, beacon, reactor, rim };
}

export function createTrails(scene, max = 90) {
  const geo = new THREE.BoxGeometry(0.16, 0.16, 3.4);
  const mat = new THREE.MeshBasicMaterial({
    color: PALETTE.cyan,
    transparent: true,
    opacity: 0.92,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, max);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.count = 0;
  mesh.frustumCulled = false;
  scene.add(mesh);

  const pool = [];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3(1, 1, 1);
  const e = new THREE.Euler();

  return {
    mesh,
    spawn() {
      if (pool.length >= max) return;
      const lane = Math.floor(Math.random() * 4);
      const axis = lane % 2 === 0;
      const off = (Math.random() - 0.5) * 90;
      pool.push({
        t: 0,
        life: 3.2 + Math.random() * 1.4,
        axis,
        off,
        dir: lane < 2 ? 1 : -1,
        y: 0.6 + Math.random() * 2.4,
        speed: 34 + Math.random() * 22,
      });
    },
    update(dt) {
      for (let i = pool.length - 1; i >= 0; i--) {
        const p = pool[i];
        p.t += dt;
        if (p.t > p.life) pool.splice(i, 1);
      }
      for (let i = 0; i < pool.length; i++) {
        const p = pool[i];
        const travel = -70 * p.dir + p.dir * p.speed * p.t;
        const pos = p.axis
          ? new THREE.Vector3(travel, p.y, p.off)
          : new THREE.Vector3(p.off, p.y, travel);
        e.set(0, p.axis ? Math.PI / 2 : 0, 0);
        q.setFromEuler(e);
        m.compose(pos, q, s);
        mesh.setMatrixAt(i, m);
      }
      mesh.count = pool.length;
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}
