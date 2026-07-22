import * as THREE from 'three';
import { PALETTE } from './constants.js';

/** Procedural lightning arcs between spires + screen flash on sandwich detect. */
export function createLightning(scene, count = 8) {
  const group = new THREE.Group();
  scene.add(group);

  const spires = [];
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2;
    const r = 28 + (i % 3) * 12;
    spires.push(new THREE.Vector3(Math.cos(ang) * r, 18 + (i % 4) * 6, Math.sin(ang) * r));
  }

  const arcs = [];
  const mat = new THREE.LineBasicMaterial({
    color: PALETTE.cyan,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
  });

  let active = false;
  let flash = 0;

  function spawnArc() {
    if (!active || arcs.length > 6) return;
    const a = spires[Math.floor(Math.random() * spires.length)];
    const b = spires[Math.floor(Math.random() * spires.length)];
    if (a === b) return;

    const pts = [a.clone()];
    const segs = 4 + Math.floor(Math.random() * 3);
    for (let i = 1; i < segs; i++) {
      const t = i / segs;
      pts.push(new THREE.Vector3(
        THREE.MathUtils.lerp(a.x, b.x, t) + (Math.random() - 0.5) * 8,
        THREE.MathUtils.lerp(a.y, b.y, t) + (Math.random() - 0.5) * 6,
        THREE.MathUtils.lerp(a.z, b.z, t) + (Math.random() - 0.5) * 8,
      ));
    }
    pts.push(b.clone());

    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, mat.clone());
    line.material.color.setHex(Math.random() > 0.5 ? PALETTE.cyan : PALETTE.magenta);
    group.add(line);
    arcs.push({ line, life: 0.12 + Math.random() * 0.18 });
  }

  const flashEl = document.createElement('div');
  flashEl.id = 'lightning-flash';
  flashEl.style.cssText = 'position:fixed;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:99;transition:opacity .08s';
  document.body.appendChild(flashEl);

  return {
    setActive(on) { active = on; },
    sandwichFlash() {
      flash = 0.35;
      flashEl.style.opacity = '0.55';
      setTimeout(() => { flashEl.style.opacity = '0'; }, 80);
    },
    update(dt) {
      if (active && Math.random() < 0.35) spawnArc();
      for (let i = arcs.length - 1; i >= 0; i--) {
        const a = arcs[i];
        a.life -= dt;
        a.line.material.opacity = Math.max(0, a.life * 4);
        if (a.life <= 0) {
          group.remove(a.line);
          a.line.geometry.dispose();
          a.line.material.dispose();
          arcs.splice(i, 1);
        }
      }
      if (flash > 0) flash = Math.max(0, flash - dt);
    },
  };
}
