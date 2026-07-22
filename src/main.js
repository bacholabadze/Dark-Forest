// ── DARK FOREST · BOT #343 · ELECTRIC ───────────────────────────────────────
// Interactive film-game. SCAN → RECONSTRUCT → CONTAIN.

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';

import { PALETTE, MOVE, CASE, STATE } from './constants.js';
import { buildWorld, createTrails } from './world.js';
import { createPlayer, updatePlayer, loadPlayerModel } from './player.js';
import { createCameraRig, updateCamera } from './camera.js';
import { createBots, loadBotModels, updateBots, nearestBot, createCage } from './bots.js';
import { startTransactionStream, recordContainment, chainState } from './chain.js';
import { narrateCase } from './ai.js';
import { descent, ascent, punchIn, reveal } from './cinematic.js';
import { createLightning } from './lightning.js';
import { runTimeline } from './director.js';
import * as ui from './ui.js';

// ── renderer ────────────────────────────────────────────────────────────────
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.info.autoReset = false;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(MOVE.FOV, innerWidth / innerHeight, 0.1, 500);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
// Electric Forest bloom — hotter, lower threshold for lightning glow
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1.2, 0.55, 0.35);
composer.addPass(bloom);
composer.addPass(new SMAAPass());

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

// ── world ───────────────────────────────────────────────────────────────────
const world = buildWorld(scene);
const trails = createTrails(scene);
const lightning = createLightning(scene);
const player = createPlayer(scene);
const rig = createCameraRig(camera);
let bots = createBots(scene);
let cage = null;

// ── input ───────────────────────────────────────────────────────────────────
const keys = new Set();
const input = { x: 0, z: 0, sprint: false, jump: false };
let interactPressed = false, containPressed = false;

addEventListener('keydown', (e) => {
  const k = e.code;
  if (!keys.has(k)) {
    if (k === 'KeyE') interactPressed = true;
    if (k === 'Space') containPressed = true;
  }
  keys.add(k);
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) e.preventDefault();
});
addEventListener('keyup', (e) => keys.delete(e.code));

function readInput() {
  input.x = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
  input.z = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
  input.sprint = keys.has('ShiftLeft') || keys.has('ShiftRight');
  input.jump = keys.has('Space');
}

let dragging = false, lastX = 0, lastY = 0;
canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
addEventListener('pointerup', () => { dragging = false; });
addEventListener('pointermove', (e) => {
  if (!dragging) return;
  rig.yaw -= (e.clientX - lastX) * 0.005;
  rig.pitch = Math.max(-0.15, Math.min(1.05, rig.pitch + (e.clientY - lastY) * 0.004));
  lastX = e.clientX; lastY = e.clientY;
});
canvas.addEventListener('wheel', (e) => {
  rig.dist = Math.max(5, Math.min(16, rig.dist + e.deltaY * 0.01));
}, { passive: true });

// ── game state ──────────────────────────────────────────────────────────────
const ctx = { player, _state: STATE.INTRO };
Object.defineProperty(ctx, 'state', {
  get() { return this._state; },
  set(v) { this._state = v; },
});
let scanned = 0;
const guilty = () => bots.find((b) => b.def.guilty);

function refreshLang() {
  ui.hud.keys();
  ui.hud.scanned(scanned);
  ui.hud.live(chainState.streamLive);
  ui.hud.txCount?.(chainState.txCount);
  if (ctx.state === STATE.SCAN) ui.hud.objective(ui.t('objScan'));
  if (ctx.state === STATE.PUZZLE) ui.hud.objective(ui.t('objPuzzle'));
  if (ctx.state === STATE.CHASE) ui.hud.objective(ui.t('objChase'));
  if (ctx.state === STATE.DONE) ui.hud.objective(ui.t('objDone'));
}
ui.initLang(refreshLang);

async function onScan(bot) {
  if (bot.scanned) return;
  bot.scanned = true;
  scanned++;
  ui.showStrip(bot.def);
  ui.hud.scanned(scanned);
  setTimeout(ui.hideStrip, 4200);

  if (scanned >= 3) {
    ctx.state = STATE.PUZZLE;
    refreshLang();
    setTimeout(async () => {
      player.frozen = true;
      await ui.openPuzzle();
      player.frozen = false;
      const g = guilty();
      await punchIn(rig, g.root.position);
      g.fleeing = true;
      lightning.setActive(true);
      ctx.state = STATE.CHASE;
      refreshLang();
    }, 1400);
  }
}

async function onContain(bot) {
  if (ctx.state !== STATE.CHASE || !bot.def.guilty) return;
  ctx.state = STATE.DONE;
  bot.fleeing = false;
  bot.caged = true;
  cage = createCage(scene, bot.root.position.clone());
  player.frozen = true;
  refreshLang();
  lightning.sandwichFlash();

  ui.sendingRecord();
  // Narration runs concurrently with the devnet write — no added wait.
  const narration = narrateCase({
    caseId: CASE.id, subject: bot.def.short, slot: CASE.slot,
    token: CASE.victimToken, expected: CASE.expected, received: CASE.received,
  });
  let result;
  try {
    result = await recordContainment({ caseId: CASE.id, subject: bot.def.short });
  } catch (e) {
    result = { simulated: true, signature: `FAILED — ${String(e.message).slice(0, 60)}`, url: null };
  }
  narration.then(({ text, live }) => ui.showJournal(text, live));
  await ui.showRecord(result, bot.def);

  await ascent(rig, player.pos);
  ui.scene7(() => location.reload());
}

async function runIntro() {
  lightning.setActive(true);
  await ui.scene1(() => lightning.sandwichFlash());
  await ui.scene2();

  // Scene 2.5 — hero reveal: slow turntable around Ranger One
  ui.film.letterbox(true);
  ui.film.caption('capReveal');
  await reveal(rig, player.pos.clone());
  ui.film.caption(null);

  // Scene 3 — two-stage descent with captions
  await descent(rig, (stage) => {
    ui.film.caption(stage === 0 ? 'capOrbit' : 'capDive');
  });
  ui.film.caption(null);
  ui.film.letterbox(false);

  ui.hud.show();
  refreshLang();
  lightning.setActive(false);
  ctx.state = STATE.SCAN;
  player.frozen = false;
  refreshLang();
}

// ── loop ────────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();
let acc = 0, frames = 0, fps = 0;

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, clock.getDelta());
  const t = clock.elapsedTime;

  readInput();
  updatePlayer(player, dt, input, rig.yaw);
  updateCamera(rig, dt, player.pos, player.sprinting);
  updateBots(bots, dt, t, player.pos);
  trails.update(dt);
  lightning.update(dt);

  world.beacon.rotation.y += dt * 0.8;
  world.beacon.position.y = 48 + Math.sin(t * 0.9) * 0.6;
  if (cage) {
    cage.scale.lerp(new THREE.Vector3(1, 1, 1), Math.min(1, 6 * dt));
    for (let i = 0; i < 3; i++) cage.userData[`r${i}`].rotation.z += dt * (0.6 + i * 0.4);
  }

  if (ctx.state === STATE.SCAN) {
    const near = nearestBot(bots, player.pos);
    ui.hud.prompt(near && !near.scanned ? ui.t('pressE') : null);
    if (interactPressed && near) onScan(near);
  } else if (ctx.state === STATE.CHASE) {
    const g = guilty();
    const d = g.root.position.distanceTo(player.pos);
    ui.hud.prompt(d < 5.2 ? ui.t('pressSpace') : null);
    if (containPressed && d < 5.2) onContain(g);
  } else {
    ui.hud.prompt(null);
  }
  interactPressed = false;
  containPressed = false;

  acc += dt; frames++;
  if (acc >= 0.5) {
    fps = Math.round(frames / acc); acc = 0; frames = 0;
    ui.hud.dbg(`${fps} fps · ${renderer.info.render.triangles.toLocaleString()} tris · ${renderer.info.render.calls} calls`);
    ui.hud.txCount?.(chainState.txCount);
    ui.hud.live(chainState.streamLive);
    renderer.info.reset();
  }

  composer.render();
}

// ── test hooks ──────────────────────────────────────────────────────────────
window.__test = {
  state: () => Object.keys(STATE).find((k) => STATE[k] === ctx.state) || '?',
  press(code) {
    if (code === 'KeyE') interactPressed = true;
    if (code === 'Space') containPressed = true;
  },
  gotoBot(i) {
    const b = bots[i];
    player.pos.set(b.root.position.x + 2.2, 0, b.root.position.z + 2.2);
    player.root.position.copy(player.pos);
  },
  gotoGuilty() {
    const g = guilty();
    player.pos.set(g.root.position.x + 2.0, 0, g.root.position.z + 2.0);
    player.root.position.copy(player.pos);
  },
  solvePuzzle() {
    const slots = [...document.querySelectorAll('.slot')];
    const cards = [...document.querySelectorAll('.card')]
      .sort((a, b) => a.dataset.correct - b.dataset.correct);
    if (!slots.length || cards.length < 3) return 'no puzzle open';
    slots.forEach((s, i) => s.appendChild(cards[i]));
    cards[2].dispatchEvent(new Event('dragend'));
    const ok = slots.every((s, i) => Number(s.querySelector('.card').dataset.correct) === i);
    slots.forEach((s) => { s.className = 'slot ok'; });
    document.getElementById('puzzle-msg').textContent = ui.t('right');
    document.getElementById('puzzle-msg').className = 'msg ok';
    setTimeout(() => window.__puzzleResolve?.(), 1400);
    return ok ? 'solved' : 'order wrong';
  },
};

// ── boot ────────────────────────────────────────────────────────────────────
(async function boot() {
  ui.loader.progress(0.15, 'BUILDING ELECTRIC DISTRICT');
  frame();

  ui.loader.progress(0.4, 'OPENING TRANSACTION STREAM');
  startTransactionStream(() => trails.spawn());
  setInterval(() => {
    ui.hud.live(chainState.streamLive);
    ui.hud.txCount?.(chainState.txCount);
  }, 1000);

  ui.loader.progress(0.55, 'LOADING RANGER ONE');
  await loadPlayerModel(player);

  ui.loader.progress(0.75, 'GENERATING SUSPECTS');
  loadBotModels(bots, ({ tris, id }) => {
    console.info(`[bots] ${id} — ${tris.toLocaleString()} triangles`);
    if (tris > 60000) console.warn('[bots] OVER BUDGET — remesh before demo');
  }).then((ok) => console.info(ok ? '[bots] models swapped in' : '[bots] running on placeholders'));

  ui.loader.progress(1, 'READY');
  ui.loader.ready(() => runIntro());
})();

void runTimeline;
void PALETTE;
