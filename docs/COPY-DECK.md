# COPY DECK — every English string on screen

Fill the **KA** column; I will wire them in. `<em>…</em>` = highlighted word (keep the tags around the equivalent Georgian word). `{n}`, `{slot}` = numbers inserted by code.

## Scene codes (for referencing scenes in feedback)

| Code | Scene |
|------|-------|
| P1–P6 | Prologue: heartbeat → bot runs past → crane drop → chase cam → freeze → title card |
| ACT1 | Sandwich dramatization + swap terminal |
| ACT2 | Archive + year montage + hero reveal + descent |
| SCAN | Free play: scan 3 bots |
| PUZZLE | Reconstruct the attack |
| CH1 | Choice: stakeout / pursuit |
| STAKE / PURSUIT | The chosen approach scene |
| CHASE | Free play: chase + contain |
| ECHO | Capture echo (prologue repeats) |
| RECORD | Containment record (devnet write) |
| CH2 | Choice: tribunal / rehabilitate |
| TRIB / REHAB | The chosen ending |
| MOON | End card + QR |

## Loader / start

| Key | Scene | EN | KA |
|-----|-------|----|----|
| brand | always | DARK FOREST BOTS · ELECTRIC | |
| loaderSub | loader | ELECTRIC · SEASON 2 · SOLANA | |
| load1 | loader | BUILDING ELECTRIC DISTRICT | |
| load2 | loader | OPENING TRANSACTION STREAM | |
| load3 | loader | LOADING RANGER ONE | |
| load4 | loader | GENERATING SUSPECTS | |
| load5 | loader | READY | |
| begin | loader | BEGIN | |

## Prologue (P1–P6)

| Key | Scene | EN | KA |
|-----|-------|----|----|
| hbFacts | P1 | SLOT {slot} · 3 TX · 1 VICTIM | |
| tcName | P6 | DARK FOREST · <em>BOT #343</em> | |
| tc12h | P6 | 12 HOURS EARLIER | |
| capFreeze | P5 | ONE LEAP FROM <em>CONTAINMENT</em> | |
| skipHint | all films | ENTER · SKIP SCENE | |

## Act I — the victim (ACT1)

| Key | Scene | EN | KA |
|-----|-------|----|----|
| capVictim | ACT1 | A CIVILIAN SWAP ENTERS <em>THE FOREST</em> | |
| capBracket | ACT1 | THE SANDWICH <em>CLOSES</em> | |
| termHd | ACT1 | SOLANA · SWAP | |
| youPay | ACT1 | YOU PAY | |
| youReceive | ACT1 | YOU RECEIVE | |
| confirm | ACT1 | CONFIRM | |
| sandwichAlert | ACT1 | ⚠ SANDWICH DETECTED | |
| rowYou | ACT1 | you | |
| rowBot | ACT1 | bot 0x2222… | |

## Act II — archive + reveal (ACT2) — ⚠ story being reworked (see chat)

| Key | Scene | EN (current) | KA |
|-----|-------|--------------|----|
| l1 | ACT2 | 342 BOTS DOCUMENTED. | |
| l2 | ACT2 | NONE DEFENDED US. | |
| l3 | ACT2 | BOT #343 — <em>RANGER ONE</em> | |
| activate | ACT2 | ACTIVATE | |
| cap2021 | ACT2 | 2021 · THE FIRST HARVESTERS | |
| cap2023 | ACT2 | 2023 · 342 BOTS DOCUMENTED | |
| cap2026 | ACT2 | 2026 · SOLANA — <em>TODAY</em> | |
| capReveal | ACT2 | BOT #343 — <em>RANGER ONE</em> · FIRST OF THE DEFENDERS | |
| capOrbit | ACT2 | SOLANA · <em>DEX CITY</em> · EVERY LIGHT IS A TRANSACTION | |
| capDive | ACT2 | DESCENDING INTO <em>THE DARK FOREST</em> | |

## HUD / free play (SCAN, CHASE)

| Key | Scene | EN | KA |
|-----|-------|----|----|
| objScan | SCAN | Scan the three suspect bots. Walk close and press E. | |
| objPuzzle | PUZZLE | Return to the console. Reconstruct the attack. | |
| objChase | CHASE | The attacker is fleeing. Chase it down and press SPACE to contain. | |
| objDone | ECHO | Subject contained. | |
| scanned | SCAN | SCANNED {n} / 3 | |
| pressE | SCAN | PRESS E · SCAN | |
| pressSpace | CHASE | PRESS SPACE · CONTAIN | |
| keys | HUD | WASD move · SHIFT sprint · SPACE jump / DRAG look · E interact | |
| live | HUD | LIVE · MAINNET | |
| offline | HUD | STREAM OFFLINE | |
| txcount | HUD | TX {n} | |
| stripDone | scan card | SCAN COMPLETE | |
| stripAddr | scan card | ADDRESS | |
| stripAtk | scan card | ATTACKS | |
| stripTot | scan card | TOTAL | |
| stripSeen | scan card | FIRST SEEN | |
| stripFt | scan card | DARK FOREST BOTS · 2021 REGISTRY | |

## Puzzle (PUZZLE)

| Key | Scene | EN | KA |
|-----|-------|----|----|
| puzzleTitle | PUZZLE | RECONSTRUCT THE ATTACK | |
| puzzleHint | PUZZLE | Case #{n}. Three transactions landed in slot {slot}. Put them in the order they executed. | |
| slotFront | PUZZLE | FRONT-RUN | |
| slotVictim | PUZZLE | VICTIM | |
| slotBack | PUZZLE | BACK-RUN | |
| wrong | PUZZLE | INCORRECT SEQUENCE — that is not how the value was extracted. | |
| right | PUZZLE | SEQUENCE CONFIRMED — attacker identified. | |
| auto | PUZZLE | SOLVED FOR YOU — the attacker brackets the victim on both sides. | |

## Choices (CH1, CH2)

| Key | Scene | EN | KA |
|-----|-------|----|----|
| choiceApproach | CH1 | RANGER, CHOOSE THE APPROACH | |
| optStakeout | CH1 | STAKEOUT / watch it strike — gather proof | |
| optPursuit | CH1 | PURSUIT / strike now — no warning | |
| choiceVerdict | CH2 | PASS THE VERDICT | |
| optTribunal | CH2 | TRIBUNAL / contain it forever | |
| optRehab | CH2 | REHABILITATE / recruit a second defender | |
| autopick | CH1/CH2 | AUTO-DECIDES IN {n}s | |

## Approach + endings (STAKE, ECHO, TRIB, REHAB)

| Key | Scene | EN | KA |
|-----|-------|----|----|
| capStakeout | STAKE | STAKEOUT · IT DOES NOT KNOW WE ARE WATCHING | |
| capCaught | STAKE | CAUGHT IN THE ACT | |
| capLoop | ECHO | THIS IS WHERE YOU CAME IN | |
| capTribunal | TRIB | TRIBUNAL · THE VAULT ACCEPTS ITS <em>343rd</em> | |
| archSealed | TRIB | CASE SEALED · <em>THE ARCHIVE GROWS</em> | |
| capRehab | REHAB | BOT #344 — <em>SECOND DEFENDER</em> | |

## Record + end card (RECORD, MOON)

| Key | Scene | EN | KA |
|-----|-------|----|----|
| recordTitle | RECORD | CONTAINMENT RECORD | |
| recCase | RECORD | CASE | |
| recSubject | RECORD | SUBJECT | |
| recRanger | RECORD | RANGER | |
| recNetwork | RECORD | NETWORK | |
| recSig | RECORD | SIGNATURE | |
| explorer | RECORD | VIEW ON SOLANA EXPLORER | |
| patrolLog | RECORD | PATROL LOG | |
| sending | RECORD | Writing containment record to Solana devnet… | |
| simulated | RECORD | SIMULATED — no funded devnet keypair configured. | |
| real | RECORD | Written to Solana devnet. Open the link and verify it yourself. | |
| continue | RECORD | CONTINUE | |
| m1 | MOON | THE DARK FOREST EXTENDS BEYOND SOLANA. | |
| m2 | MOON | RANGER ONE MUST GO TO <em>THE MOON</em>. | |
| scanToPlay | MOON | SCAN TO PLAY | |
| replay | MOON | REPLAY | |

## Bot names (scan cards)

AZURE SENTINEL · PALE HARVESTER · IRON VESPER — tell me if you want these localized or kept as codenames.

Note: the AI "patrol log" narration (Gemini Flash + scripted fallback) is English-only right now — flag if you want a Georgian scripted fallback.
