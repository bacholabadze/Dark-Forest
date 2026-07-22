// Containment bolt — the CHASE finale's verb. Pooled Solana-tinted
// projectiles fired with F; hits hand back to main.js via onHit(bot, point).
import * as THREE from 'three';
import { PALETTE } from './constants.js';

const SPEED = 42;
const LIFE = 1.6;
const RANGE = 60;
const HIT_RADIUS = 1.7;   // bot models normalise to 2.6–2.8 tall
const ASSIST_ANGLE = Math.cos((22 * Math.PI) / 180);
const ASSIST_RANGE = 40;
const ASSIST_BLEND = 0.65;

const _toTarget = new THREE.Vector3();
const _look = new THREE.Vector3();

function makeBolt() {
  const g = new THREE.Group();

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.26),
    new THREE.MeshBasicMaterial({ color: PALETTE.white })
  );
  g.add(core);

  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.42),
    new THREE.MeshBasicMaterial({
      color: PALETTE.solanaB,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  g.add(shell);

  // Tapered streak trailing behind the head. After rotation.x = π/2 the
  // wide end (0.10) faces +Z — the direction of travel — and it tapers back.
  const streak = new THREE.Mesh(
    new THREE.CylinderGeometry(0.10, 0.02, 2.2, 6),
    new THREE.MeshBasicMaterial({
      color: PALETTE.solanaA,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  streak.rotation.x = Math.PI / 2;
  streak.position.z = -1.3;
  g.add(streak);

  const light = new THREE.PointLight(PALETTE.solanaB, 6, 10, 2);
  g.add(light);

  g.visible = false;
  return g;
}

export function createBolts(scene, max = 12) {
  const pool = [];
  for (let i = 0; i < max; i++) {
    const group = makeBolt();
    scene.add(group);
    pool.push({ group, vel: new THREE.Vector3(), origin: new THREE.Vector3(), life: 0, active: false });
  }

  return {
    /**
     * Fire from origin along dir. If assistTarget (a Vector3) sits inside a
     * ~22° cone within 40 units, bend the shot 65% toward it — demo-safe aim.
     */
    fire(origin, dir, assistTarget = null) {
      const b = pool.find((p) => !p.active);
      if (!b) return false;

      const d = dir.clone().normalize();
      if (assistTarget) {
        _toTarget.subVectors(assistTarget, origin);
        const dist = _toTarget.length();
        if (dist < ASSIST_RANGE) {
          _toTarget.normalize();
          if (_toTarget.dot(d) > ASSIST_ANGLE) d.lerp(_toTarget, ASSIST_BLEND).normalize();
        }
      }

      b.active = true;
      b.life = LIFE;
      b.origin.copy(origin);
      b.vel.copy(d).multiplyScalar(SPEED);
      b.group.position.copy(origin);
      b.group.visible = true;
      _look.copy(origin).add(b.vel);
      b.group.lookAt(_look);
      return true;
    },

    update(dt, bots, onHit) {
      for (const b of pool) {
        if (!b.active) continue;
        b.life -= dt;
        b.group.position.addScaledVector(b.vel, dt);
        _look.copy(b.group.position).add(b.vel);
        b.group.lookAt(_look);

        if (b.life <= 0 || b.group.position.distanceTo(b.origin) > RANGE) {
          b.active = false;
          b.group.visible = false;
          continue;
        }

        for (const bot of bots) {
          if (bot.caged) continue;
          if (b.group.position.distanceTo(bot.root.position) < HIT_RADIUS) {
            b.active = false;
            b.group.visible = false;
            onHit?.(bot, b.group.position.clone());
            break;
          }
        }
      }
    },
  };
}

/** A brief expanding shockwave ring + flash. Self-removes after ~0.45 s. */
export function createImpact(scene, pos, color = PALETTE.cyan) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.08, 8, 32),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  g.add(ring);
  const flash = new THREE.PointLight(color, 8, 8, 2);
  g.add(flash);
  g.position.copy(pos);
  scene.add(g);

  const t0 = performance.now();
  const DUR = 450;
  (function tick() {
    const k = (performance.now() - t0) / DUR;
    if (k >= 1) {
      scene.remove(g);
      ring.geometry.dispose();
      ring.material.dispose();
      return;
    }
    g.scale.setScalar(1 + k * 4);
    ring.material.opacity = 0.9 * (1 - k);
    flash.intensity = 8 * (1 - k);
    requestAnimationFrame(tick);
  })();
}
