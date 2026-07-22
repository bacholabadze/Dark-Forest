#!/usr/bin/env node
/** Copy + simplify Meshy GLBs for web deploy. Falls back to raw copy if CLI missing. */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const meshyRoot = join(root, '..', 'Meshy Assets', 'wetransfer_meshy_ai_cybernetic_sentinel_biped_2026-07-22_1214');
const outDir = join(root, 'public', 'models');

// Ranger uses the Hex Grid rig because that character ships BOTH Walking and
// Running clips on the same skeleton — the two files merge into one mixer.
const MAP = [
  ['Meshy_AI_Hex_Grid_Sentinel_biped/Meshy_AI_Hex_Grid_Sentinel_biped_Animation_Walking_withSkin.glb', 'ranger-one.glb'],
  ['Meshy_AI_Hex_Grid_Sentinel_biped/Meshy_AI_Hex_Grid_Sentinel_biped_Animation_Running_withSkin.glb', 'ranger-run.glb'],
  ['Meshy_AI_Cybernetic_Sentinel_biped/Meshy_AI_Cybernetic_Sentinel_biped_Animation_Walking_withSkin.glb', 'bot-guilty.glb'],
  ['Meshy_AI_Hex_Grid_Sentinel_biped 2/Meshy_AI_Hex_Grid_Sentinel_biped_Animation_Walking_withSkin.glb', 'bot-a.glb'],
  ['Meshy_AI_Hexagon_Sentinel_biped/Meshy_AI_Hexagon_Sentinel_biped_Animation_Walking_withSkin.glb', 'bot-b.glb'],
];

mkdirSync(outDir, { recursive: true });

function mb(path) {
  return (statSync(path).size / (1024 * 1024)).toFixed(1);
}

for (const [srcRel, destName] of MAP) {
  const src = join(meshyRoot, srcRel);
  const dest = join(outDir, destName);
  if (!existsSync(src)) {
    console.warn(`skip missing: ${srcRel}`);
    continue;
  }
  try {
    execSync(
      `npx gltf-transform optimize "${src}" "${dest}" --compress draco --simplify-ratio 0.05 --simplify-error 1 --texture-size 512 --texture-compress webp`,
      { stdio: 'inherit', cwd: root }
    );
    console.log(`optimized ${destName} → ${mb(dest)} MB`);
  } catch {
    cpSync(src, dest);
    console.warn(`fallback copy ${destName} → ${mb(dest)} MB (run npm install first for optimize)`);
  }
}

console.log('done — models in public/models/');
