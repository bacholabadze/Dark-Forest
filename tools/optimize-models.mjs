#!/usr/bin/env node
/** Copy + simplify Meshy GLBs for web deploy. Falls back to raw copy if CLI missing. */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// Drop your Meshy character folders into assets-src/ (gitignored) — see README.
const meshyRoot = join(root, 'assets-src');
const outDir = join(root, 'public', 'models');

// Ranger uses the Hex Grid rig because that character ships BOTH Walking and
// Running clips on the same skeleton — the two files merge into one mixer.
const MAP = [
  ['Meshy_AI_Hex_Grid_Sentinel_biped/Meshy_AI_Hex_Grid_Sentinel_biped_Animation_Walking_withSkin.glb', 'ranger-one.glb'],
  ['Meshy_AI_Hex_Grid_Sentinel_biped/Meshy_AI_Hex_Grid_Sentinel_biped_Animation_Running_withSkin.glb', 'ranger-run.glb'],
  ['Meshy_AI_Hexagon_Sentinel_biped/Meshy_AI_Hexagon_Sentinel_biped_Animation_Walking_withSkin.glb', 'bot-guilty.glb'],
  ['Meshy_AI_Hex_Grid_Sentinel_biped 2/Meshy_AI_Hex_Grid_Sentinel_biped_Animation_Walking_withSkin.glb', 'bot-a.glb'],
  ['Meshy_AI_Cybernetic_Sentinel_biped/Meshy_AI_Cybernetic_Sentinel_biped_Animation_Walking_withSkin.glb', 'bot-b.glb'],
];

if (!existsSync(meshyRoot)) {
  console.error(`ERROR: source folder not found: ${meshyRoot}`);
  console.error('Create assets-src/ in the repo root and drop your Meshy character folders there.');
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

function mb(path) {
  return (statSync(path).size / (1024 * 1024)).toFixed(1);
}

let missing = 0;

for (const [srcRel, destName] of MAP) {
  const src = join(meshyRoot, srcRel);
  const dest = join(outDir, destName);
  if (!existsSync(src)) {
    console.error(`ERROR: missing source: ${srcRel}`);
    missing++;
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

if (missing > 0) {
  console.error(`FAILED — ${missing} source model(s) missing from assets-src/. Nothing was silently skipped.`);
  process.exit(1);
}
console.log('done — models in public/models/');
