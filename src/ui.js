import { CASE, TXS, BOTS } from './constants.js';

const $ = (id) => document.getElementById(id);

const DICT = {
  en: {
    objScan: 'Scan the three suspect bots. Walk close and press E.',
    objPuzzle: 'Return to the console. Reconstruct the attack.',
    objChase: 'The attacker is fleeing. Chase it down and press SPACE to contain.',
    objDone: 'Subject contained.',
    scanned: (n) => `SCANNED <b>${n}</b> / 3`,
    pressE: 'PRESS  E  ·  SCAN',
    pressSpace: 'PRESS  SPACE  ·  CONTAIN',
    keys: 'WASD move · SHIFT sprint · SPACE jump<br>DRAG look · E interact',
    live: 'LIVE · MAINNET',
    offline: 'STREAM OFFLINE',
    puzzleHint: `Case #${CASE.id}. Three transactions landed in slot ${CASE.slot}. Put them in the order they executed.`,
    wrong: 'INCORRECT SEQUENCE — that is not how the value was extracted.',
    right: 'SEQUENCE CONFIRMED — attacker identified.',
    auto: 'SOLVED FOR YOU — the attacker brackets the victim on both sides.',
    l1: '342 BOTS DOCUMENTED.',
    l2: 'NONE DEFENDED US.',
    l3: 'BOT #343 — <em>RANGER ONE</em>',
    m1: 'THE DARK FOREST EXTENDS BEYOND SOLANA.',
    m2: 'RANGER ONE MUST GO TO <em>THE MOON</em>.',
    sending: 'Writing containment record to Solana devnet…',
    simulated: 'SIMULATED — no funded devnet keypair configured. Set VITE_SOLANA_SECRET to make it live.',
    real: 'Written to Solana devnet. Open the link and verify it yourself.',
    begin: 'BEGIN',
    capReveal: 'BOT #343 — <em>RANGER ONE</em> · FIRST OF THE DEFENDERS',
    capOrbit: 'SOLANA · <em>DEX CITY</em> · EVERY LIGHT IS A TRANSACTION',
    capDive: 'DESCENDING INTO <em>THE DARK FOREST</em>',
  },
  ka: {
    objScan: 'დაასკანერე სამივე საეჭვო ბოტი. მიუახლოვდი და დააჭირე E.',
    objPuzzle: 'დაბრუნდი კონსოლთან. აღადგინე თავდასხმის თანმიმდევრობა.',
    objChase: 'თავდამსხმელი გარბის. დაეწიე და დააჭირე SPACE.',
    objDone: 'ობიექტი იზოლირებულია.',
    scanned: (n) => `დასკანერებული <b>${n}</b> / 3`,
    pressE: 'დააჭირე  E  ·  სკანირება',
    pressSpace: 'დააჭირე  SPACE  ·  იზოლაცია',
    keys: 'WASD მოძრაობა · SHIFT სირბილი · SPACE ხტომა<br>გადაათრიე — კამერა · E ინტერაქცია',
    live: 'პირდაპირი · MAINNET',
    offline: 'ნაკადი გათიშულია',
    puzzleHint: `საქმე #${CASE.id}. სამი ტრანზაქცია ერთსა და იმავე სლოტში. დაალაგე შესრულების მიხედვით.`,
    wrong: 'არასწორი თანმიმდევრობა — ღირებულება ასე არ ამოღებულა.',
    right: 'თანმიმდევრობა დადასტურდა — თავდამსხმელი იდენტიფიცირებულია.',
    auto: 'ავტომატურად ამოხსნილია — თავდამსხმელი მსხვერპლს ორივე მხრიდან ახვევს.',
    l1: 'დაფიქსირდა 342 ბოტი.',
    l2: 'ვერცერთმა დაგვიცვა.',
    l3: 'ბოტი #343 — <em>RANGER ONE</em>',
    m1: 'ბნელი ტყე სოლანას მიღმაც ვრცელდება.',
    m2: 'RANGER ONE უნდა გაფრინდეს <em>მთვარეზე</em>.',
    sending: 'ჩანაწერი იწერება Solana devnet-ზე…',
    simulated: 'სიმულაცია — devnet გასაღები არ არის კონფიგურირებული.',
    real: 'ჩაწერილია Solana devnet-ზე. გახსენი ბმული და თავად გადაამოწმე.',
    begin: 'დაწყება',
    capReveal: 'ბოტი #343 — <em>RANGER ONE</em> · პირველი დამცველი',
    capOrbit: 'SOLANA · <em>DEX CITY</em> · ყოველი შუქი — ტრანზაქციაა',
    capDive: 'ვეშვებით <em>ბნელ ტყეში</em>',
  },
};

let lang = localStorage.getItem('df343.lang') || 'ka';
export const t = (k, ...a) => {
  const v = DICT[lang][k] ?? DICT.en[k] ?? k;
  return typeof v === 'function' ? v(...a) : v;
};

let onLangChange = () => {};
export function initLang(cb) {
  onLangChange = cb || (() => {});
  $('lang').onclick = () => {
    lang = lang === 'en' ? 'ka' : 'en';
    localStorage.setItem('df343.lang', lang);
    onLangChange();
  };
}

export const hud = {
  show() { $('hud').classList.remove('hidden'); },
  objective(txt) { $('objective').textContent = txt; },
  scanned(n) { $('scancount').innerHTML = t('scanned', n); },
  keys() { $('keys').innerHTML = t('keys'); },
  txCount(n) { $('txcount').innerHTML = `TX <b>${n.toLocaleString()}</b>`; },
  prompt(txt) {
    const el = $('prompt');
    if (!txt) { el.classList.add('hidden'); return; }
    el.textContent = txt; el.classList.remove('hidden');
  },
  live(on) {
    const el = $('live');
    el.classList.toggle('on', on);
    el.classList.toggle('off', !on);
    el.querySelector('span').textContent = on ? t('live') : t('offline');
  },
  dbg(txt) { $('dbg').textContent = txt; },
};

// ── film layer ──────────────────────────────────────────────────────────────
export const film = {
  letterbox(on) { $('letterbox').classList.remove('hidden'); $('letterbox').classList.toggle('on', on); },
  caption(key) {
    const el = $('caption');
    if (!key) { el.classList.remove('show'); return; }
    el.innerHTML = t(key);
    el.classList.remove('hidden');
    el.classList.add('show');
  },
};

export function showStrip(def) {
  $('strip-name').textContent = def.name;
  $('s-addr').textContent = def.short;
  $('s-atk').textContent = def.attacks.toLocaleString();
  $('s-tot').textContent = '$' + def.total.toLocaleString(undefined, { minimumFractionDigits: 2 });
  $('s-seen').textContent = def.firstSeen;
  $('strip').classList.remove('hidden');
}
export const hideStrip = () => $('strip').classList.add('hidden');

export function scene1(onFlash) {
  return new Promise((resolve) => {
    const el = $('sc1');
    el.classList.remove('hidden');
    $('sc1-confirm').disabled = false;
    $('sc1-recv').textContent = `${CASE.expected.toLocaleString()} ${CASE.victimToken}`;
    $('sc1-recv').classList.remove('bad');
    $('sc1-alert').classList.add('hidden');
    $('sc1-rows').innerHTML = '';

    $('sc1-confirm').onclick = () => {
      $('sc1-confirm').disabled = true;
      let v = CASE.expected;
      const step = setInterval(() => {
        v -= 24;
        if (v <= CASE.received) { v = CASE.received; clearInterval(step); reveal(); }
        $('sc1-recv').textContent = `${Math.round(v).toLocaleString()} ${CASE.victimToken}`;
      }, 26);
      $('sc1-recv').classList.add('bad');
    };

    function reveal() {
      onFlash?.();
      $('sc1-alert').classList.remove('hidden');
      const rows = [
        ['bot', 'bot 0x2222…', 'BUY  8,000 MOON'],
        ['you', 'you', 'BUY  1,000 MOON'],
        ['bot', 'bot 0x2222…', 'SELL 1,340 MOON'],
      ];
      rows.forEach(([cls, who, what], i) => {
        const d = document.createElement('div');
        d.className = cls;
        d.style.animationDelay = `${0.25 + i * 0.28}s`;
        d.innerHTML = `<span>${who}</span><span>${what}</span><span>slot ${CASE.slot}</span>`;
        $('sc1-rows').appendChild(d);
      });
      setTimeout(() => { el.classList.add('hidden'); resolve(); }, 2900);
    }
  });
}

export function scene2() {
  return new Promise((resolve) => {
    const el = $('sc2');
    el.classList.remove('hidden');
    const grid = $('sc2-grid');
    grid.innerHTML = '';
    for (let i = 0; i < 342; i++) {
      const s = document.createElement('i');
      s.style.animationDelay = `${i * 0.0035}s`;
      grid.appendChild(s);
    }
    $('sc2-lines').innerHTML = '';
    $('sc2-go').classList.add('hidden');

    const seq = [t('l1'), t('l2'), t('l3')];
    let i = 0;
    const next = () => {
      if (i >= seq.length) {
        const hero = document.createElement('i');
        hero.className = 'hero';
        grid.appendChild(hero);
        const go = $('sc2-go');
        go.textContent = 'ACTIVATE';
        go.classList.remove('hidden');
        go.onclick = () => { el.classList.add('hidden'); resolve(); };
        return;
      }
      $('sc2-lines').innerHTML = seq.slice(0, i + 1).join('<br>');
      i++;
      setTimeout(next, 1150);
    };
    setTimeout(next, 1500);
  });
}

export function openPuzzle() {
  return new Promise((resolve) => {
    const el = $('puzzle');
    el.classList.remove('hidden');
    $('puzzle-hint').textContent = t('puzzleHint');
    const msg = $('puzzle-msg');
    msg.textContent = ''; msg.className = 'msg';

    const tray = $('tray');
    tray.innerHTML = '';
    const slots = [...document.querySelectorAll('.slot')];
    slots.forEach((s) => { s.className = 'slot'; [...s.querySelectorAll('.card')].forEach((c) => c.remove()); });

    let attempts = 0;

    TXS.forEach((tx) => {
      const c = document.createElement('div');
      c.className = 'card';
      c.draggable = true;
      c.dataset.id = tx.id;
      c.dataset.correct = tx.correct;
      c.innerHTML = `<b>${tx.kind} ${tx.amount}</b>
        <span class="who">${tx.who}</span><br>
        <span class="slotnum">slot ${tx.slot}</span>`;
      c.addEventListener('dragstart', (e) => {
        c.classList.add('dragging');
        e.dataTransfer.setData('text/plain', tx.id);
      });
      c.addEventListener('dragend', () => c.classList.remove('dragging'));
      tray.appendChild(c);
    });

    const dropTargets = [...slots, tray];
    dropTargets.forEach((zone) => {
      zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('over'); });
      zone.addEventListener('dragleave', () => zone.classList.remove('over'));
      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('over');
        const id = e.dataTransfer.getData('text/plain');
        const card = document.querySelector(`.card[data-id="${id}"]`);
        if (!card) return;
        if (zone.classList.contains('slot') && zone.querySelector('.card')) return;
        zone.appendChild(card);
        check();
      });
    });

    function check() {
      const filled = slots.every((s) => s.querySelector('.card'));
      if (!filled) return;
      const order = slots.map((s) => Number(s.querySelector('.card').dataset.correct));
      const ok = order.every((v, i) => v === i);
      if (ok) return win(t('right'));
      attempts++;
      slots.forEach((s, i) => s.classList.toggle('no', order[i] !== i));
      msg.textContent = t('wrong');
      msg.className = 'msg err';
      if (attempts >= 2) setTimeout(() => autoSolve(), 900);
    }

    function autoSolve() {
      const cards = [...document.querySelectorAll('.card')]
        .sort((a, b) => a.dataset.correct - b.dataset.correct);
      slots.forEach((s, i) => { s.className = 'slot'; s.appendChild(cards[i]); });
      win(t('auto'));
    }

    function win(text) {
      slots.forEach((s) => { s.className = 'slot ok'; });
      [...document.querySelectorAll('.card')].forEach((c) => { c.draggable = false; });
      msg.textContent = text;
      msg.className = 'msg ok';
      setTimeout(() => { el.classList.add('hidden'); resolve(); }, 1900);
    }

    window.__puzzleResolve = () => { el.classList.add('hidden'); resolve(); };
  });
}

export function showRecord(result, guiltyDef) {
  return new Promise((resolve) => {
    const el = $('record');
    el.classList.remove('hidden');
    $('r-close').style.display = '';
    $('r-case').textContent = `#${CASE.id}`;
    $('r-subj').textContent = guiltyDef.short;
    $('r-net').textContent = result.simulated ? 'devnet (not sent)' : 'solana devnet';
    $('r-sig').textContent = result.signature;

    const link = $('r-link');
    const note = $('r-note');
    if (result.url) {
      link.href = result.url;
      link.classList.remove('hidden');
      note.textContent = t('real');
      note.className = 'note';
    } else {
      link.classList.add('hidden');
      note.textContent = t('simulated');
      note.className = 'note warn';
    }

    $('r-close').onclick = () => { el.classList.add('hidden'); resolve(); };
  });
}

export function showJournal(text, live) {
  $('r-journal-txt').textContent = text;
  $('r-journal-src').textContent = live ? 'CLAUDE' : 'SCRIPTED';
  $('r-journal').classList.remove('hidden');
}

export function sendingRecord() {
  const el = $('record');
  el.classList.remove('hidden');
  $('r-case').textContent = `#${CASE.id}`;
  $('r-subj').textContent = BOTS.find((b) => b.guilty).short;
  $('r-net').textContent = 'solana devnet';
  $('r-sig').textContent = '…';
  $('r-link').classList.add('hidden');
  $('r-note').textContent = t('sending');
  $('r-note').className = 'note';
  $('r-close').style.display = 'none';
}

export function scene7(onReplay) {
  const el = $('sc7');
  el.classList.remove('hidden');
  const lines = $('sc7-lines');
  lines.innerHTML = '';
  const seq = [t('m1'), t('m2')];
  let i = 0;
  const next = () => {
    if (i >= seq.length) return;
    lines.innerHTML = seq.slice(0, i + 1).join('<br>');
    i++;
    setTimeout(next, 1500);
  };
  setTimeout(next, 900);

  const url = encodeURIComponent(location.href);
  $('qr').src = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${url}`;
  $('sc7-again').onclick = onReplay;
}

export const loader = {
  progress(p, txt) {
    $('bar').style.width = `${Math.round(p * 100)}%`;
    if (txt) $('loadtxt').textContent = txt;
  },
  ready(onBegin) {
    const b = $('begin');
    b.textContent = t('begin');
    b.classList.remove('hidden');
    b.onclick = () => { $('loader').classList.add('hidden'); onBegin(); };
  },
};
