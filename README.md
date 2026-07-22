# BOT #343 — Electric Ranger One

Interactive film-game for Cursor Georgia @ BTU. Vite + three.js + Helius + Solana devnet.

## Run

```bash
npm install
npm run optimize-models   # remesh Meshy GLBs from assets-src/ → public/models/
npm run dev               # http://localhost:8660
npm run drive             # headless full-loop smoke test
```

`optimize-models` reads from `assets-src/` in the repo root (gitignored) —
drop your Meshy character folders there (e.g. `assets-src/Meshy_AI_Hexagon_Sentinel_biped/…`).
The script exits non-zero if a source is missing. The optimised GLBs are
already committed in `public/models/`, so this step is only needed to rebuild.

## Env (optional)

```bash
# .env.local
VITE_HELIUS_KEY=your-helius-key
VITE_SOLANA_SECRET=[1,2,3,...]   # funded devnet burner JSON array
```

Without keys: procedural trails + honest `SIMULATED` containment record.

## Controls

`WASD` move · `SHIFT` sprint · `SPACE` jump · `E` scan · `F` fire bolt · drag look · wheel zoom

## Stack

- Vite + three.js (bloom, SMAA)
- Helius `logsSubscribe` → live mainnet light trails
- Solana Memo program on **devnet** at capture
- Meshy rigged walkers (AnimationMixer)

## Deploy

Live: **https://bot343-electric.vercel.app**

```bash
npx vercel --prod
```

See `SHIP-BRIEF-KA.md` for the Georgian pitch.
