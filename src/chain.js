// Devnet write + mainnet read. Never mainnet write, never user wallet.

import {
  Connection, Keypair, Transaction, TransactionInstruction, PublicKey,
} from '@solana/web3.js';

const MEMO_PROGRAM = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
const DEVNET = import.meta.env.VITE_DEVNET_RPC || 'https://api.devnet.solana.com';
const HELIUS_KEY = import.meta.env.VITE_HELIUS_KEY || '';
const SECRET = import.meta.env.VITE_SOLANA_SECRET || '';
const DEX_PROGRAM = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';

let payer = null;
if (SECRET) {
  try { payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(SECRET))); }
  catch (e) { console.warn('[chain] bad VITE_SOLANA_SECRET', e); }
}

export const chainState = {
  streamLive: false,
  mode: HELIUS_KEY ? 'connecting' : 'demo', // 'live' | 'demo' | 'connecting'
  canSend: !!payer,
  payer: payer ? payer.publicKey.toBase58() : null,
  txCount: 0,
  /** Last real mainnet signatures from Helius logsSubscribe (newest first). */
  lastSigs: [],
};

export function solscanUrl(sig) {
  return `https://solscan.io/tx/${sig}`;
}

export function explorerUrl(sig) {
  return `https://explorer.solana.com/tx/${sig}`;
}

function rememberSig(sig) {
  if (!sig || typeof sig !== 'string') return;
  chainState.lastSigs = [sig, ...chainState.lastSigs.filter((s) => s !== sig)].slice(0, 5);
}

export function startTransactionStream(onTx) {
  if (!HELIUS_KEY) {
    console.info('[chain] no Helius key — procedural trails, DEMO badge');
    chainState.mode = 'demo';
    chainState.streamLive = false;
    return startProcedural(onTx);
  }

  let ws, retry = 0, closed = false;
  const connect = () => {
    ws = new WebSocket(`wss://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`);

    ws.onopen = () => {
      retry = 0;
      chainState.streamLive = true;
      chainState.mode = 'live';
      ws.send(JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'logsSubscribe',
        params: [{ mentions: [DEX_PROGRAM] }, { commitment: 'confirmed' }],
      }));
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.method === 'logsNotification') {
          const sig = msg.params?.result?.value?.signature;
          rememberSig(sig);
          chainState.txCount++;
          onTx({ signature: sig, live: true });
        }
      } catch { /* ignore */ }
    };

    ws.onerror = () => {
      chainState.streamLive = false;
      chainState.mode = 'demo';
    };
    ws.onclose = () => {
      chainState.streamLive = false;
      if (closed) return;
      chainState.mode = 'connecting';
      retry = Math.min(retry + 1, 5);
      setTimeout(connect, 400 * retry);
    };
  };
  connect();

  return () => { closed = true; ws?.close(); };
}

function startProcedural(onTx) {
  const id = setInterval(() => {
    const burst = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < burst; i++) setTimeout(() => onTx({ live: false }), Math.random() * 260);
  }, 320);
  return () => clearInterval(id);
}

const FAUCET_URL = 'https://faucet.solana.com/';

function faucetLink(pubkey) {
  return pubkey
    ? `${FAUCET_URL}?walletAddress=${encodeURIComponent(pubkey)}&amount=1&network=devnet`
    : FAUCET_URL;
}

/**
 * Devnet memo write. Never throws for expected failures — returns a status.
 * status: 'ok' | 'simulated' | 'unfunded' | 'error'
 */
export async function recordContainment({ caseId, subject }) {
  const payload = {
    p: 'dark-forest-343', case: caseId, subject, ranger: 343, t: Date.now(),
  };

  if (!payer) {
    await new Promise((r) => setTimeout(r, 600));
    return {
      status: 'simulated',
      simulated: true,
      unfunded: false,
      pubkey: null,
      faucetUrl: null,
      signature: 'SIMULATED — no VITE_SOLANA_SECRET at build time',
      url: null,
      payload,
    };
  }

  const pubkey = payer.publicKey.toBase58();
  const conn = new Connection(DEVNET, 'confirmed');

  try {
    const bal = await conn.getBalance(payer.publicKey);
    if (bal < 5000) {
      return {
        status: 'unfunded',
        simulated: false,
        unfunded: true,
        pubkey,
        faucetUrl: faucetLink(pubkey),
        signature: 'NEEDS AIRDROP — 0 SOL on this pubkey',
        url: null,
        payload,
      };
    }

    const tx = new Transaction().add(new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM,
      data: new TextEncoder().encode(JSON.stringify(payload)),
    }));

    const signature = await conn.sendTransaction(tx, [payer]);
    const res = await conn.confirmTransaction(signature, 'confirmed');
    if (res?.value?.err) {
      return {
        status: 'error',
        simulated: false,
        unfunded: false,
        pubkey,
        faucetUrl: null,
        signature: 'FAILED — confirmed with on-chain error',
        url: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
        payload,
      };
    }

    return {
      status: 'ok',
      simulated: false,
      unfunded: false,
      pubkey,
      faucetUrl: null,
      signature,
      url: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
      payload,
    };
  } catch (e) {
    const msg = String(e?.message || e);
    const unfunded = /simulation failed|insufficient|no record of a prior credit|Attempt to debit/i.test(msg);
    if (unfunded) {
      return {
        status: 'unfunded',
        simulated: false,
        unfunded: true,
        pubkey,
        faucetUrl: faucetLink(pubkey),
        signature: 'NEEDS AIRDROP — simulation failed (no SOL)',
        url: null,
        payload,
      };
    }
    return {
      status: 'error',
      simulated: false,
      unfunded: false,
      pubkey,
      faucetUrl: null,
      signature: `FAILED — ${msg.slice(0, 80)}`,
      url: null,
      payload,
    };
  }
}
