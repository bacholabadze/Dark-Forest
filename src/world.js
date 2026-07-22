import * as THREE from 'three';
import { PALETTE, WORLD, RAYDIUM } from './constants.js';

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

function makeSignTexture(title, sub) {
  const c = document.createElement('canvas');
  c.width = 2048; c.height = 512;
  const g = c.getContext('2d');
  // Keep luminance under bloom threshold (~0.35) so text stays sharp
  g.fillStyle = '#060a14';
  g.fillRect(0, 0, 2048, 512);
  g.strokeStyle = '#1a6a72';
  g.lineWidth = 14;
  g.strokeRect(40, 40, 1968, 432);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = 'bold 190px Helvetica, Arial, sans-serif';
  g.fillStyle = '#b8f0f8';
  g.fillText(title, 1024, 200);
  g.font = 'bold 64px Helvetica, Arial, sans-serif';
  g.fillStyle = '#5ec9a0';
  g.fillText(sub, 1024, 365);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Sky landmark — logomark + EN "SOLANA". Glow toned ~30% for readability. */
function makeSkySolanaTexture(logoImg) {
  const W = 2560, H = 512;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.clearRect(0, 0, W, H);

  const text = 'SOLANA';
  g.font = 'bold 300px Helvetica, Arial, sans-serif';
  const tw = g.measureText(text).width;
  const logoH = 268; // ~match text cap height
  const logoW = logoImg ? (logoImg.naturalWidth / logoImg.naturalHeight) * logoH : 0;
  const gap = 56;
  const total = (logoImg ? logoW + gap : 0) + tw;
  let x = (W - total) / 2;

  if (logoImg) {
    g.globalAlpha = 0.72;
    g.drawImage(logoImg, x, (H - logoH) / 2, logoW, logoH);
    g.globalAlpha = 1;
    x += logoW + gap;
  }

  const tx = x + tw / 2;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  // Keep luminance under bloom threshold (~0.35) — readable, not blown-out
  g.shadowColor = 'rgba(153,69,255,0.18)';
  g.shadowBlur = 10;
  g.strokeStyle = 'rgba(20,180,140,0.45)';
  g.lineWidth = 8;
  g.strokeText(text, tx, H / 2);
  g.shadowBlur = 0;
  g.fillStyle = '#7eb0a8';
  g.fillText(text, tx, H / 2);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function addSkySolana(group) {
  const mat = new THREE.MeshBasicMaterial({
    map: makeSkySolanaTexture(null),
    transparent: true,
    opacity: 0.82,
    toneMapped: false,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  // Wider plane to fit mark + word
  const board = new THREE.Mesh(new THREE.PlaneGeometry(112, 22), mat);
  board.position.set(8, 72, -58);
  board.rotation.y = Math.PI * 0.08;
  group.add(board);

  const img = new Image();
  img.decoding = 'async';
  img.onload = () => {
    const old = mat.map;
    mat.map = makeSkySolanaTexture(img);
    mat.needsUpdate = true;
    old?.dispose();
  };
  img.src = '/solana-logo.svg';
  return board;
}

function buildRaydium(group) {
  const [x, , z] = RAYDIUM.pos;
  const [w, h, d] = RAYDIUM.size;
  const g = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({
      color: 0x1a2848,
      roughness: 0.35,
      metalness: 0.75,
      emissive: 0x142848,
      emissiveIntensity: 0.8,
    })
  );
  body.position.y = h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  // Neon edge bands
  for (const y of [4, 10, 16]) {
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.3, 0.35, d + 0.3),
      new THREE.MeshBasicMaterial({ color: y === 10 ? PALETTE.solanaB : PALETTE.cyan })
    );
    band.position.y = y;
    g.add(band);
  }

  const signMat = new THREE.MeshBasicMaterial({
    map: makeSignTexture('RAYDIUM DEX', 'SOLANA · AMM'),
    toneMapped: false,
  });
  const plateMat = new THREE.MeshBasicMaterial({ color: 0x060a14, toneMapped: false });

  function addSign(w, h, y, zLocal) {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.35), plateMat);
    plate.position.set(0, y, zLocal);
    g.add(plate);
    const face2 = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.96, h * 0.9), signMat);
    face2.position.set(0, y, zLocal + Math.sign(zLocal || 1) * 0.22);
    g.add(face2);
    const face3 = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.96, h * 0.9), signMat);
    face3.position.set(0, y, zLocal - Math.sign(zLocal || 1) * 0.22);
    face3.rotation.y = Math.PI;
    g.add(face3);
  }

  addSign(18, 5, 15, d / 2 + 0.4);
  addSign(18, 5, 15, -(d / 2 + 0.4));

  // Dim roof lamp so bloom doesn't erase the sign text
  const lamp = new THREE.PointLight(PALETTE.solanaB, 6, 24, 2);
  lamp.position.set(0, h + 4, 0);
  g.add(lamp);
  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.4),
    new THREE.MeshBasicMaterial({ color: PALETTE.solanaB })
  );
  gem.position.y = h + 1.2;
  g.add(gem);

  // Freestanding approach pylon — readable from SCAN spawn
  const pylon = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 11, 0.7),
    new THREE.MeshBasicMaterial({ color: 0x0a1528, toneMapped: false })
  );
  pole.position.y = 5.5;
  pylon.add(pole);
  const board = new THREE.Mesh(new THREE.BoxGeometry(12, 3.6, 0.4), plateMat);
  board.position.set(0, 10, 0);
  pylon.add(board);
  const faceA = new THREE.Mesh(new THREE.PlaneGeometry(11.4, 3.2), signMat);
  faceA.position.set(0, 10, 0.25);
  pylon.add(faceA);
  const faceB = new THREE.Mesh(new THREE.PlaneGeometry(11.4, 3.2), signMat);
  faceB.position.set(0, 10, -0.25);
  faceB.rotation.y = Math.PI;
  pylon.add(faceB);
  pylon.position.set(0, 0, d / 2 + 7);
  g.add(pylon);

  g.position.set(x, 0, z);
  group.add(g);
  addCollider(x, z, w, d, h);
  return g;
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
    // Keep a clear plaza around Raydium DEX
    if (Math.hypot(x - RAYDIUM.pos[0], z - RAYDIUM.pos[2]) < 22) continue;
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

  const raydium = buildRaydium(group);
  const skySolana = addSkySolana(group);

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

  return { group, tower, beacon, reactor, rim, raydium, skySolana };
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
