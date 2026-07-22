# BOT #343 — Electric Ranger One

Interactive film-game for Cursor Georgia @ BTU. Vite + three.js + Helius + Solana devnet.

## Run

```bash
npm install
npm run optimize-models   # remesh Meshy GLBs → public/models/
npm run dev               # http://localhost:8660
npm run drive             # headless full-loop smoke test
```

## Env (optional)

```bash
# .env.local
VITE_HELIUS_KEY=your-helius-key
VITE_SOLANA_SECRET=[1,2,3,...]   # funded devnet burner JSON array
```

Without keys: procedural trails + honest `SIMULATED` containment record.

## Controls

`WASD` move · `SHIFT` sprint · `SPACE` jump/contain · `E` scan · drag look · wheel zoom

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
