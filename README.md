# BOT #343 — Electric Ranger One

Interactive film-game for Cursor Georgia @ BTU. Vite + three.js + Helius + Solana devnet.

## Run

```bash
npm install
npm run optimize-models   # remesh Meshy GLBs → public/models/
npm run dev               # http://localhost:8660
npm run drive             # headless full-loop smoke test
```

## Env (optional — copy `.env.example` → `.env`)

| Var | Purpose | Get it | Demo without? |
|-----|---------|--------|---------------|
| `VITE_HELIUS_KEY` | Mainnet **read** — Raydium tx stream | [Helius dashboard](https://dashboard.helius.dev) | Yes — procedural trails |
| `VITE_SOLANA_SECRET` | Devnet **write** — containment memo | `solana-keygen` + `solana airdrop … --url devnet` | Yes — shows SIMULATED |
| `VITE_DEVNET_RPC` | Devnet RPC URL | default OK | Yes |
| `VITE_GEMINI_KEY` | Gemini Flash patrol-log | [Google AI Studio](https://aistudio.google.com/apikey) | Yes — scripted log |
| `VITE_AI_KEY` | Alias for Gemini key | same | Yes |

Never mainnet write. Never user wallet.

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
