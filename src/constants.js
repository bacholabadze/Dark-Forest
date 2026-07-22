// Electric Forest palette — brighter sci-fi, readable on projector
export const PALETTE = {
  void:     0x0B1026,
  horizon:  0x1B1440,
  sky:      0x1A0A3E,
  panel:    0x152040,
  deepBlue: 0x30348B,
  blue:     0x007EFF,
  purple:   0x7450FF,
  cyan:     0x00F0FF,
  magenta:  0xFF2EEA,
  white:    0xFFFFFF,
  villain:  0xC8372D,
  solanaA:  0x9945FF,
  solanaB:  0x14F195,
};

export const MOVE = {
  WALK: 7.0,
  SPRINT: 13.0,
  JUMP_V: 9.0,
  GRAVITY: 26.0,
  HEADING_LERP: 14,
  COYOTE: 0.10,
  BUFFER: 0.12,
  FOV: 62,
  FOV_SPRINT: 68,
};

export const CAM = {
  DIST: 9.5,
  MIN: 4.2,
  MAX: 16,
  HEIGHT: 2.6,
  LERP: 9,
  FOLLOW: 2.5,            // rad/s, constant angular velocity behind the player
  FOLLOW_DEADZONE: 0.06,  // rad — stops micro-jitter at rest
  FOLLOW_RESUME: 0.9,     // s to suspend follow after a manual drag
};

export const WORLD = {
  SIZE: 150,
  BLOCKS: 26,
};

// Raydium HQ — site derived by replaying the seeded generator: clears every
// block footprint, the comms tower, and never overlaps the moon from spawn,
// the descent hand-off, or the ascent start.
export const HQ = {
  X: 38,
  Z: 5.5,
  W: 14,
  D: 14,
  H: 70,
  PATROL_RADIUS: 11,   // bot ring around the tower
  PATROL_SPEED: 2.2,   // u/s along the ring
  BUBBLE: 2.2,         // player-avoidance radius — must stay < scan range 4.6
};

export const MODELS = {
  ranger: '/models/ranger-one.glb',
  rangerRun: '/models/ranger-run.glb',
  guilty: '/models/bot-guilty.glb',
  botA: '/models/bot-a.glb',
  botB: '/models/bot-b.glb',
};

// Three real attack cases from the 2021 registry — one is drawn per run, so
// every playthrough tells a different story (the "variations" beat).
export const CASES = [
  { id: 1804, victimToken: 'MOON', expected: 1000, received: 640, slot: 4891 },
  { id: 2117, victimToken: 'RAY',  expected: 5200, received: 3410, slot: 7723 },
  { id: 951,  victimToken: 'ORCA', expected: 880,  received: 597,  slot: 3308 },
];
export const CASE = CASES[Math.floor(Math.random() * CASES.length)];

export const BOTS = [
  {
    id: 'guilty',
    address: '0x22220605b14bcfe0034430282ae084f43a2222',
    short: '0x2222…3a2222',
    name: 'AZURE SENTINEL',
    attacks: 1804,
    total: 933011.67,
    firstSeen: 2021,
    guilty: true,
    modelKey: 'guilty',
    pos: [16, 0, -12],
  },
  {
    id: 'bot-a',
    address: '0x91b4e0c7a2d18f3e5c60a9d4b7e2f8103c5d91a0',
    short: '0x91b4…5d91a0',
    name: 'PALE HARVESTER',
    attacks: 412,
    total: 118440.20,
    firstSeen: 2021,
    guilty: false,
    modelKey: 'botA',
    pos: [-19, 0, 6],
  },
  {
    id: 'bot-b',
    address: '0x7ac3f81d0be25947a1c8e63b04df2915e8b7c440',
    short: '0x7ac3…b7c440',
    name: 'IRON VESPER',
    attacks: 77,
    total: 20915.05,
    firstSeen: 2022,
    guilty: false,
    modelKey: 'botB',
    pos: [2, 0, 22],
  },
];

// Amounts derive from the drawn case. The 8× front-run and 1.34× back-run
// ratios reproduce the original MOON numbers (8,000 / 1,340 vs 1,000) exactly.
const amt = (n) => `${Math.round(n).toLocaleString('en-US')} ${CASE.victimToken}`;
export const TXS = [
  { id: 'back',  kind: 'SELL', amount: amt(CASE.expected * 1.34), who: 'bot 0x2222…', slot: CASE.slot, correct: 2 },
  { id: 'vict',  kind: 'BUY',  amount: amt(CASE.expected),        who: 'YOU',         slot: CASE.slot, correct: 1 },
  { id: 'front', kind: 'BUY',  amount: amt(CASE.expected * 8),    who: 'bot 0x2222…', slot: CASE.slot, correct: 0 },
];

export const STATE = {
  INTRO: 0,
  SCAN: 1,
  PUZZLE: 2,
  CHASE: 3,
  DONE: 4,
};
