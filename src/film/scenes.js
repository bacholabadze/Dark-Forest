import * as THREE from 'three';
import { PALETTE, CASE } from '../constants.js';
import {
  dolly, dollyTrack, crane, track, freeze, smashCut, titleCard, heartbeat, tween, hold,
} from './shots.js';
import { createActor, moveAlong, placeActor } from './actors.js';
import { setAnimState } from '../assets.js';
import * as ui from '../ui.js';

function makeTrail(color) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 0.26, 0.26),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 })
  );
  m.position.y = 1.2;
  return m;
}

const code = (c) => ui.film.code(c);

export function createFilmScenes({ scene, rig, player, bots, lightning }) {
  const guiltyBot = () => bots.find((b) => b.def.guilty);
  const hero = createActor(player.root, () => player.anim, (p) => player.pos.set(p.x, 0, p.z));

  async function prologue() {
    const g = guiltyBot();
    const villain = createActor(g.root, () => g.anim);
    ui.film.letterbox(true);

    code('P1');
    placeActor(hero, -40, -60, 0);
    ui.film.caption('capP1');
    await heartbeat([ui.t('hbFacts', CASE.slot)]);
    ui.film.caption(null);

    code('P2');
    placeActor(villain, -13, 0, Math.PI / 2);
    ui.film.caption('capP2');
    await Promise.all([
      moveAlong(villain, [[13, 0, 0]], 6.5, 'run'),
      dollyTrack(rig, [-4, 1.3, 7], [4, 1.3, 7], villain.root, 4.0, 56, 62),
    ]);
    ui.film.caption(null);
    await smashCut();

    code('P3');
    placeActor(hero, -10, -6, Math.PI / 2);
    ui.film.caption('capP3');
    await Promise.all([
      moveAlong(hero, [[8, 0, -9]], 5.2, 'run'),
      crane(rig, [2, 44, -26], [5, 5, -15], [0, 1, -8], 3.8, 0.14),
    ]);
    ui.film.caption(null);
    await smashCut();

    code('P4');
    placeActor(hero, -8, -2, 0);
    ui.film.caption('capP4');
    await Promise.all([
      moveAlong(hero, [[-3, 0, 2], [1, 0, 4], [5, 0, 5]], 6.0, 'run'),
      track(rig, player.root, [0, 2.2, -5], 4.2, 80),
    ]);
    ui.film.caption(null);

    // P5 — idle FIRST so freeze is a tableau, not mid-run "running in place"
    code('P5');
    placeActor(villain, 7, 7, Math.atan2(-2, -2));
    placeActor(hero, 2.5, 4.5, Math.atan2(4.5, 4.5));
    if (player.anim) setAnimState(player.anim, 'idle');
    if (g.anim) setAnimState(g.anim, 'idle');
    rig.manual = true;
    rig.camera.position.set(0, 1.7, 9.5);
    rig.camera.lookAt(6.2, 1.5, 6.2);
    rig.camera.fov = 44;
    rig.camera.updateProjectionMatrix();
    ui.film.caption('capFreeze');
    await freeze(2.0);
    ui.film.caption(null);
    await smashCut(0.2);

    code('P6');
    await titleCard([ui.t('tcName'), ui.t('tc12h')], 2600);

    placeActor(villain, g.home.x, g.home.z, 0);
    placeActor(hero, 0, 8, Math.PI);
    ui.film.letterbox(false);
    code(null);
  }

  async function sandwich() {
    code('ACT1');
    ui.film.letterbox(true);
    // Beat 1 — swap starts: you are buying a token
    ui.film.caption('capVictim');
    const green = makeTrail(PALETTE.solanaB);
    const redF = makeTrail(PALETTE.villain);
    const redB = makeTrail(PALETTE.villain);
    const Z = 10;
    scene.add(green, redF, redB);
    rig.manual = true;
    let bracketShown = false;

    await tween(6.5, (k) => {
      const gx = -46 + k * 52;
      green.position.set(gx, 1.2, Z);
      const closeK = Math.min(1, Math.max(0, (k - 0.35) / 0.55));
      redF.position.set(gx + 3.4 + (1 - closeK) * 46, 1.2, Z);
      redB.position.set(gx - 3.4 - (1 - closeK) * 38, 1.2, Z);
      // Beat 2 — red trails close = sandwich
      if (closeK > 0.12 && !bracketShown) {
        bracketShown = true;
        ui.film.caption('capBracket');
      }
      const cam = rig.camera;
      cam.position.set(gx - 9, 5.2, Z + 13);
      cam.lookAt(gx + 3, 1.2, Z);
      cam.fov = 58;
      cam.updateProjectionMatrix();
    });

    lightning.sandwichFlash();
    await tween(1.3, (k) => {
      green.material.opacity = 0.95 - k * 0.68;
      green.scale.x = 1 - k * 0.45;
    });
    await hold(0.7);
    scene.remove(green, redF, redB);
    ui.film.caption(null);
    ui.film.letterbox(false);
    code(null);
  }

  async function montage() {
    code('ACT2');
    const cuts = [
      { from: [24, 2.2, 30], to: [19, 2.0, 25], look: [0, 2, 0], cap: 'cap2021' },
      { from: [-14, 2.6, -8], to: [-19, 3.2, -13], look: [-28, 1, -22], cap: 'cap2023' },
      { from: [15, 9, -2], to: [11, 15, -8], look: [0, 34, -34], cap: 'cap2026' },
    ];
    ui.film.letterbox(true);
    for (const c of cuts) {
      await smashCut(0.12);
      ui.film.caption(c.cap);
      await dolly(rig, c.from, c.to, c.look, c.look, 1.5, 52, 48);
    }
    ui.film.caption(null);
    await smashCut(0.14);
    code(null);
  }

  async function stakeout() {
    code('STAKE');
    const g = guiltyBot();
    const villain = createActor(g.root, () => g.anim);
    ui.film.letterbox(true);
    ui.film.caption('capStakeout');

    const tx = g.home.x + 7, tz = g.home.z + 7;
    const victim = makeTrail(PALETTE.solanaB);
    victim.position.set(tx, 1.0, tz);
    scene.add(victim);

    rig.manual = true;
    const cam = rig.camera;
    cam.position.set(g.home.x - 9, 1.2, g.home.z + 16);
    cam.lookAt(tx, 1.2, tz);
    cam.fov = 44;
    cam.updateProjectionMatrix();

    await hold(1.2);
    await moveAlong(villain, [[tx - 2.4, 0, tz - 2.4]], 3.4, 'walk');

    const rF = makeTrail(PALETTE.villain);
    const rB = makeTrail(PALETTE.villain);
    rF.position.set(tx + 2.8, 1.0, tz);
    rB.position.set(tx - 2.8, 1.0, tz);
    scene.add(rF, rB);
    lightning.sandwichFlash();
    ui.film.caption('capCaught');
    code('CAUGHT');
    if (g.anim) setAnimState(g.anim, 'idle');
    await freeze(1.5);

    await moveAlong(villain, [[g.home.x, 0, g.home.z]], 9.5, 'run');
    scene.remove(victim, rF, rB);
    ui.film.caption(null);
    ui.film.letterbox(false);
    code(null);
  }

  async function captureEcho(cagePos) {
    code('ECHO');
    ui.film.letterbox(true);
    ui.film.caption('capLoop');
    rig.manual = true;
    await dolly(
      rig,
      [cagePos.x + 10, 1.6, cagePos.z - 7],
      [cagePos.x + 6, 2.2, cagePos.z - 3.5],
      [cagePos.x, 1.4, cagePos.z],
      [cagePos.x, 1.4, cagePos.z],
      2.8, 46, 46
    );
    await freeze(1.6);
    ui.film.caption(null);
    await smashCut(0.18);
    ui.film.letterbox(false);
    code(null);
  }

  async function tribunal(cage) {
    code('TRIB');
    const g = guiltyBot();
    ui.film.letterbox(true);
    ui.film.caption('capTribunal');
    rig.manual = true;
    const p = cage.position;
    if (g.root.userData.column) g.root.userData.column.visible = false;
    await Promise.all([
      tween(4.2, (k) => {
        const drop = k * 5.6;
        cage.position.y = 1.2 - drop;
        g.root.position.y = -drop;
      }),
      dolly(rig, [p.x + 16, 7, p.z + 16], [p.x + 12, 15, p.z + 12], [p.x, 1, p.z], [p.x, -4.5, p.z], 4.2, 50, 44),
    ]);
    ui.film.caption(null);
    await ui.endingArchive();
    ui.film.letterbox(false);
    code(null);
  }

  async function rehabilitate(cage) {
    code('REHAB');
    const g = guiltyBot();
    ui.film.letterbox(true);
    rig.manual = true;
    const p = g.root.position;

    await tween(1.8, (k) => cage.scale.setScalar(Math.max(0.01, 1 - k)));
    scene.remove(cage);

    (g.model || g.placeholder).traverse((n) => {
      if (!n.isMesh || !n.material) return;
      const mats = Array.isArray(n.material) ? n.material : [n.material];
      for (const m of mats) {
        if (m.emissive) { m.emissive.set(PALETTE.cyan); m.emissiveIntensity = 0.45; }
        else if (m.color) m.color.set(PALETTE.cyan);
      }
    });
    if (g.root.userData.column) g.root.userData.column.material.color.set(PALETTE.cyan);

    ui.film.caption('capRehab');
    await tween(4.5, (k) => {
      const a = Math.PI * 0.2 + k * Math.PI * 1.2;
      rig.camera.position.set(p.x + Math.cos(a) * 7, 2.4, p.z + Math.sin(a) * 7);
      rig.camera.lookAt(p.x, 1.5, p.z);
      rig.camera.fov = 48;
      rig.camera.updateProjectionMatrix();
    });
    ui.film.caption(null);
    ui.film.letterbox(false);
    code(null);
  }

  return { prologue, sandwich, montage, stakeout, captureEcho, tribunal, rehabilitate };
}
