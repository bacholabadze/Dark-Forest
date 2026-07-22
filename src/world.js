import * as THREE from 'three';
import { PALETTE, WORLD, HQ } from './constants.js';

export const colliders = [];

function addCollider(x, z, w, d, maxY) {
  colliders.push({ x, z, hw: w / 2, hd: d / 2, maxY });
}

/** Push a position out of any building footprint it penetrates. */
export function resolveCollisions(pos, radius = 0.85) {
  for (const c of colliders) {
    if (pos.y > c.maxY) continue;
    const dx = pos.x - c.x, dz = pos.z - c.z;
    const px = c.hw + radius - Math.abs(dx);
    const pz = c.hd + radius - Math.abs(dz);
    if (px > 0 && pz > 0) {
      if (px < pz) pos.x += Math.sign(dx || 1) * px;
      else pos.z += Math.sign(dz || 1) * pz;
    }
  }
}

const rand = (() => { let s = 1337; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

function makeMoonTexture() {
  // 2048×1024 — at ~18° angular diameter the old 1024 canvas went soft.
  const c = document.createElement('canvas');
  c.width = 2048; c.height = 1024;
  const g = c.getContext('2d');

  const grad = g.createLinearGradient(0, 0, 0, 1024);
  grad.addColorStop(0, '#B57BFF');
  grad.addColorStop(1, '#4FF7BB');
  g.fillStyle = grad;
  g.fillRect(0, 0, 2048, 1024);

  // Lit limb — hotter toward the top-left of the face the district sees.
  const limb = g.createRadialGradient(512, 220, 80, 512, 220, 1240);
  limb.addColorStop(0, 'rgba(255,255,255,0.50)');
  limb.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = limb;
  g.fillRect(0, 0, 2048, 1024);

  // Craters — seeded so the moon is deterministic like the city.
  for (let i = 0; i < 70; i++) {
    const x = rand() * 2048;
    const y = 80 + rand() * 864;
    const r = 10 + rand() * 44;
    g.fillStyle = `rgba(10,20,50,${0.10 + rand() * 0.12})`;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.16)';
    g.lineWidth = 2.6;
    g.beginPath();
    g.arc(x, y, r, Math.PI * 0.9, Math.PI * 1.7);
    g.stroke();
  }

  // Solana wordmark — three slanted bars, centred on the +Z face (u = 0.25,
  // i.e. x = 512) so the logo looks at the district.
  g.fillStyle = 'rgba(255,255,255,0.35)';
  const bar = (cx, cy, w, h, skew) => {
    g.beginPath();
    g.moveTo(cx - w / 2 + skew, cy - h / 2);
    g.lineTo(cx + w / 2 + skew, cy - h / 2);
    g.lineTo(cx + w / 2 - skew, cy + h / 2);
    g.lineTo(cx - w / 2 - skew, cy + h / 2);
    g.closePath();
    g.fill();
  };
  bar(512, 400, 380, 68, 44);
  bar(512, 512, 380, 68, -44);
  bar(512, 624, 380, 68, 44);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeHaloTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 20, 128, 128, 128);
  grad.addColorStop(0, 'rgba(170,130,255,0.55)');
  grad.addColorStop(0.45, 'rgba(120,220,190,0.22)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

function addMoon(scene) {
  // On the horizon, rising behind the skyline: ~10.8° elevation, ~18.1°
  // angular diameter from spawn. The city occluding it between towers is
  // the intended shot — it still depth-tests normally.
  const pos = new THREE.Vector3(0, 78, -400);
  const R = 65;

  // fog:false is load-bearing — at this distance FogExp2 would eat the moon.
  // toneMapped:false opts out of ACES compression so the flat bright values
  // stay hot and cross the bloom threshold.
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(R, 48, 32),
    new THREE.MeshBasicMaterial({ map: makeMoonTexture(), fog: false, toneMapped: false })
  );
  mesh.position.copy(pos);
  scene.add(mesh);

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeHaloTexture(),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.9,
    fog: false,
    toneMapped: false,
  }));
  halo.position.copy(pos);
  halo.scale.setScalar(R * 2 * 2.6);
  scene.add(halo);

  // Moonlight — a low raking backlight from -Z that motivates the district's
  // rim lighting. Position derives from the moon, so it follows the disc.
  const light = new THREE.DirectionalLight(
    new THREE.Color(PALETTE.solanaA).lerp(new THREE.Color(PALETTE.solanaB), 0.5), 1.4);
  light.position.copy(pos).normalize().multiplyScalar(120);
  scene.add(light);

  return { mesh, halo, light };
}

function makeHoloTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 256;
  const g = c.getContext('2d');

  const word = 'RAYDIUM';
  g.font = '900 118px "Helvetica Neue", Helvetica, Arial, sans-serif';
  g.textBaseline = 'middle';
  // Manual letter spacing — canvas letterSpacing support is inconsistent.
  const gap = 18;
  let w = 0;
  for (const ch of word) w += g.measureText(ch).width + gap;
  w -= gap;
  const drawWord = (color, dx, dy) => {
    g.fillStyle = color;
    let x = (1024 - w) / 2 + dx;
    for (const ch of word) {
      g.fillText(ch, x, 128 + dy);
      x += g.measureText(ch).width + gap;
    }
  };
  // Chromatic split, then a near-white pass on top.
  drawWord('rgba(0,240,255,0.85)', -3, -2);
  drawWord('rgba(255,46,234,0.85)', 3, 2);
  drawWord('rgba(240,250,255,0.95)', 0, 0);

  // Bake scanlines: punch 1px transparent rows every 4px.
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = 'rgba(0,0,0,1)';
  for (let y = 0; y < 256; y += 4) g.fillRect(0, y, 1024, 1);
  g.globalCompositeOperation = 'source-over';

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function addRaydiumHQ(scene, group) {
  const hq = new THREE.Group();

  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(HQ.W, HQ.H, HQ.D),
    new THREE.MeshStandardMaterial({
      color: 0x1E2A50,
      roughness: 0.30,
      metalness: 0.80,
      emissive: 0x2038A0,
      emissiveIntensity: 0.55,
    })
  );
  slab.position.y = HQ.H / 2;
  slab.castShadow = true;
  hq.add(slab);

  // Edge strips up the four corners, corporate-tower style.
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, HQ.H, 0.22),
      new THREE.MeshBasicMaterial({ color: PALETTE.solanaA })
    );
    strip.position.set(sx * HQ.W / 2, HQ.H / 2, sz * HQ.D / 2);
    hq.add(strip);
  }
  const crown = new THREE.Mesh(
    new THREE.BoxGeometry(HQ.W + 0.4, 0.5, HQ.D + 0.4),
    new THREE.MeshBasicMaterial({ color: PALETTE.solanaB })
  );
  crown.position.y = HQ.H + 0.25;
  hq.add(crown);

  // Holographic sign — one plane per face, all sharing a material so
  // main.js animates the scroll/flicker once.
  const holoMat = new THREE.MeshBasicMaterial({
    map: makeHoloTexture(),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
    opacity: 0.62,
  });
  const holo = new THREE.Group();
  const planeGeo = new THREE.PlaneGeometry(12, 3.5);
  const Y = 56;
  const faces = [
    { pos: [0, Y, HQ.D / 2 + 0.15], rot: 0 },
    { pos: [0, Y, -HQ.D / 2 - 0.15], rot: Math.PI },
    { pos: [HQ.W / 2 + 0.15, Y, 0], rot: Math.PI / 2 },
    { pos: [-HQ.W / 2 - 0.15, Y, 0], rot: -Math.PI / 2 },
  ];
  for (const f of faces) {
    const p = new THREE.Mesh(planeGeo, holoMat);
    p.position.set(...f.pos);
    p.rotation.y = f.rot;
    holo.add(p);
  }
  hq.add(holo);

  hq.position.set(HQ.X, 0, HQ.Z);
  group.add(hq);
  addCollider(HQ.X, HQ.Z, HQ.W, HQ.D, HQ.H);

  return { group: hq, holo, holoMat };
}

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
  scene.background = new THREE.Color(PALETTE.horizon);
  // Density tuned for the aerial establishing shot — 0.009 blacked out the
  // city from 120 units up; the descent must show a glowing skyline.
  scene.fog = new THREE.FogExp2(0x241A52, 0.0038);
  addStarfield(scene);

  const group = new THREE.Group();
  scene.add(group);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD.SIZE * 2, WORLD.SIZE * 2),
    new THREE.MeshStandardMaterial({ color: 0x24365E, roughness: 0.55, metalness: 0.5 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  const grid = new THREE.GridHelper(WORLD.SIZE * 2, 80, PALETTE.cyan, PALETTE.purple);
  grid.material.transparent = true;
  grid.material.opacity = 0.50;
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

  const hq = addRaydiumHQ(scene, group);

  scene.add(new THREE.AmbientLight(0x6688cc, 2.6));
  scene.add(new THREE.HemisphereLight(0x8866FF, 0x1B2E52, 1.7));
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

  // After the city loop so the seeded rand() sequence keeps today's layout.
  const moon = addMoon(scene);

  return { group, tower, beacon, reactor, rim, moon, hq };
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
