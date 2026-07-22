# feature/gioshani — Change Log for Merge Resolution

Branch: `feature/gioshani` (from `main` @ `5335a19`)  
Purpose: accept/reject decisions during merge. Organised by **plan**, then by **file**.

---

## How to use this during a conflict

1. Identify which plan(s) the conflicting hunk belongs to (table below).
2. Prefer **this branch’s version** for any file listed under Plans 1–5 unless `main` has an intentional newer fix you know about.
3. New files on this branch (`src/projectile.js`, `public/fonts/*`) should be **kept** — they are additions, not renames of existing files.
4. Binary swaps (`bot-guilty.glb` ↔ `bot-b.glb`) must stay swapped if you want Hexagon Sentinel as the guilty bot.

---

## Plan summary

| Plan | Theme | Accept? |
|------|--------|---------|
| **1** | Solana moon, brighter district, containment bolt (`F`), case-data consistency | Yes — core demo |
| **2** | Idle park + breathe, Fira fonts, full l10n, bot model swap, model pipeline | Yes |
| **3** | Scene 2 “threat census” redesign (red grid, typewriter, counter) | Yes |
| **4** | Auto-follow camera, horizon moon, Raydium HQ + patrol + avoidance | Yes |
| **5** | Scene-2 copy rewrite, English default (`df343.lang.v2`) | Yes |
| **Polish** | Sandwich row grid layout, scene-2 smaller type + no scrollbar | Yes |

Out of scope (reported, **not** implemented): dead Claude model ID, `VITE_*` key exposure, vendoring Draco/QR, Vector3 pool, dead `director.js`, mobile touch move.

---

## New files (keep on merge)

| Path | Why |
|------|-----|
| `src/projectile.js` | Containment bolt pool + impact FX (Plan 1) |
| `public/fonts/FiraGO-*.woff2` | Georgian + UI sans (Plan 2) |
| `public/fonts/FiraCode-*.woff2` | Latin mono (Plan 2) |
| `public/fonts/OFL-FiraGO.txt` | License |
| `public/fonts/OFL-FiraCode.txt` | License |
| `tools/probe.mjs` | Optional debug probe (safe to drop if unwanted) |

---

## File-by-file

### `.cursor/rules/bot343.mdc`
- Rule 5 clarified: no moon *level* (sky moon OK as set dressing).
- Look line: ambient 2.6, bloom strength 1.05 / threshold 0.50.

### `.gitignore`
- Added `assets-src/` (Meshy source drop folder for optimize pipeline).

### `README.md`
- Documented `assets-src/` + non-zero exit for missing models.
- Controls: `SPACE` jump only; `F` fire bolt.

### `index.html`
- `#notice` div for NO MATCH (Plan 1).
- `data-i18n` / `data-i18n-html` on static chrome (Plan 2).
- Scene 2: `#sc2-count` census counter; `#sc2-lines` gets class `lines term` (Plan 3).

### `package-lock.json`
- Incidental lockfile drift (Playwright/deps). Prefer resolving carefully; not a feature change.

### `public/models/bot-guilty.glb` ↔ `public/models/bot-b.glb`
- **Swapped.** Guilty = Hexagon Sentinel; bot-b = Cybernetic Sentinel (Plan 2).

### `src/constants.js`
- `PALETTE.horizon`
- `CAM.FOLLOW`, `FOLLOW_DEADZONE`, `FOLLOW_RESUME` (Plan 4)
- `HQ` siting + patrol/bubble constants (Plan 4)
- `TXS` derived from `CASE` (front = ×8, back = ×1.34) (Plan 1)

### `src/world.js`
- `resolveCollisions(pos, radius)` exported (Plan 4; shared with player/bots)
- Horizon moon: `(0, 78, −400)`, R=65, 2048×1024 texture, ~70 craters, `fog:false`, `toneMapped:false`, brighter gradient, halo ~340, moonlight 1.4 (Plans 1→4)
- Brighter district: horizon bg, fog density 0.0038, ground/grid/lights (Plan 1)
- `addRaydiumHQ` + `makeHoloTexture` (RAYDIUM holo, Plan 4)
- `buildWorld` returns `{ …, moon, hq }`
- **Do not reorder** `addMoon` relative to the city `rand()` loop — layout depends on seed order

### `src/main.js`
- Exposure 1.30; bloom `(1.05, 0.6, 0.50)`; `camera` near 0.3 / far 700
- `F` fires bolt; SPACE no longer contains
- Bolts update in frame loop; moon halo breathe; HQ holo scroll/flicker
- `updateCamera(rig, dt, player, input)` + `rig.lookHold` on drag
- Loader strings via `ui.t('load1'…'load5')`
- `narrateCase(..., ui.getLang())`
- `__test.fire()` for smoke test

### `src/projectile.js` *(new)*
- Pooled bolts, aim assist, hit test, `createImpact`

### `src/camera.js`
- Auto-follow behind player at `CAM.FOLLOW` rad/s
- Forward-dominance gate (no spin on pure strafe/backpedal)
- `lookHold` suspends follow after manual drag
- Signature: `updateCamera(rig, dt, player, input)`

### `src/cinematic.js`
- `seedYaw(rig)` before releasing `manual` on **reveal**, **descent**, and **punchIn** (kills handoff teleport)

### `src/assets.js`
- `PASSING_POSE = 0.26`, `hasRealIdle`, park walk clip on idle
- `userData.baseY` after `normalise`

### `src/player.js`
- Idle park + breathe; removed `timeScale = 0.001` hack
- Imports `resolveCollisions` from `world.js`

### `src/bots.js`
- Patrol ring around HQ, 120° spacing, walk while moving
- Avoidance bubble 2.2 (inside scan range 4.6)
- Flee bound raised to 70
- Uses `resolveCollisions`

### `src/ui.js`
- Plan 1: `pressF`, `noMatch`, `hud.notice`, case-consistent scene1 rows + wall-clock drain
- Plan 2: full `DICT` en/ka, `applyLang()`, `getLang()`, `data-i18n` pass
- Plan 3: threat-census `scene2()` (ease-in ignition, counter, dim beat, markup-safe typewriter)
- Plan 5: new `l1`/`l2` copy; default lang `'en'`; storage key `df343.lang.v2`; sets `documentElement.lang`

**Current scene-2 copy (Plan 5):**
| key | en | ka |
|-----|----|----|
| `l1` | EVERY TRADE YOU SEND LIGHTS YOU UP. | ყოველი ტრანზაქცია ამხელს შენს ადგილს. |
| `l2` | 342 SAW IT. NONE CAME TO HELP. | 342-მა დაინახა. არცერთი არ დაგვეხმარა. |
| `l3` | BOT #343 — \<em\>RANGER ONE\</em\> | unchanged pattern |

### `src/styles.css`
- `@font-face` FiraGO / Fira Code; per-lang stacks; ka tracking cuts (Plan 2)
- `.notice` (Plan 1)
- `.txrows` → 3-column grid (who / amount / slot) — layout polish
- Scene 2 census grid (red cells, hot pulse, dim, hero green); `.lines.term`; `.census`; `.caret`
- Mobile: keep 19 columns, shrink cells (not 14-col)
- Scene 2: smaller `.lines.term`; `.archive { overflow: hidden }` (no scrollbar)

### `src/ai.js`
- `SCRIPTED` = `{ en, ka }`; `narrateCase(caseData, lang)`; Georgian system prompt when `lang === 'ka'`

### `tools/drive.mjs`
- Uses `__test.fire()` + short wait (not Space contain)
- Larger boot timeout for headless (shader/Draco)

### `tools/optimize-models.mjs`
- `meshyRoot` → `assets-src/`
- MAP: Hexagon → `bot-guilty`, Cybernetic → `bot-b`
- Missing source → **exit 1** (no silent skip)

---

## Behaviour checklist (what “ours” should feel like after merge)

1. Moon large on the −Z horizon; never fogged; visible through full descent (`far ≥ 700`).
2. District brighter; neon still pops (bloom threshold up with exposure).
3. CHASE: `F` fires bolt; SPACE only jumps.
4. Characters idle parked (passing pose + breathe); walk when moving.
5. Default UI English; toggle persists under `df343.lang.v2`.
6. Scene 2: red 19×19 census, typewriter, counter → 342, dim, green #343 alone on row 19.
7. Camera follows behind on forward move; no spin on pure strafe; drag wins briefly.
8. Raydium tower at `(38, 5.5)` height 70; bots patrol ring; bubble 2.2; scan still works.
9. Guilty mesh = Hexagon Sentinel.

---

## Suggested merge strategy

```text
Prefer feature/gioshani for all listed src/*, index.html, styles, fonts, models swap, tools.
Re-check package-lock.json against main’s npm lock; regenerate if needed (npm install).
Drop tools/probe.mjs if main doesn’t want debug tooling.
```

If conflicted hunks are unreadable, take **entire file from `feature/gioshani`** for:  
`world.js`, `ui.js`, `main.js`, `bots.js`, `camera.js`, `styles.css`, `constants.js`.
