import { CASE, TXS, BOTS } from './constants.js';

const $ = (id) => document.getElementById(id);

const DICT = {
  en: {
    objScan: 'Scan the three suspect bots. Walk close and press E.',
    objPuzzle: 'Return to the console. Reconstruct the attack.',
    objChase: 'The attacker is fleeing. Chase it down and press F to fire the containment bolt.',
    objDone: 'Subject contained.',
    scanned: (n) => `SCANNED <b>${n}</b> / 3`,
    pressE: 'PRESS  E  ·  SCAN',
    pressF: 'PRESS  F  ·  FIRE BOLT',
    noMatch: 'NO MATCH — signature clean.',
    keys: 'WASD move · SHIFT sprint · SPACE jump<br>DRAG look · E interact · F fire',
    live: 'LIVE · MAINNET',
    offline: 'STREAM OFFLINE',
    puzzleHint: `Case #${CASE.id}. Three transactions landed in slot ${CASE.slot}. Put them in the order they executed.`,
    wrong: 'INCORRECT SEQUENCE — that is not how the value was extracted.',
    right: 'SEQUENCE CONFIRMED — attacker identified.',
    auto: 'SOLVED FOR YOU — the attacker brackets the victim on both sides.',
    l1: 'THERE\'S A WAR FOR YOUR TRADES ON THE DEX.',
    l2: 'YOU ARE UNDER RISK OF SANDWICH ATTACKS.',
    l3: 'BOT #343 — <em>RANGER ONE</em>',
    censusLabel: 'DOCUMENTED',
    m1: 'THE DARK FOREST EXTENDS BEYOND SOLANA.',
    m2: 'RANGER ONE MUST GO TO <em>THE MOON</em>.',
    sending: 'Writing containment record to Solana devnet…',
    simulated: 'SIMULATED — no funded devnet keypair configured. Set VITE_SOLANA_SECRET to make it live.',
    real: 'Written to Solana devnet. Open the link and verify it yourself.',
    begin: 'BEGIN',
    capReveal: 'BOT #343 — <em>RANGER ONE</em> · FIRST OF THE DEFENDERS',
    capOrbit: 'SOLANA · <em>DEX CITY</em> · EVERY LIGHT IS A TRANSACTION',
    capDive: 'DESCENDING INTO <em>THE DARK FOREST</em>',
    // static chrome (index.html)
    title: 'DARK FOREST · BOT #343 · ELECTRIC',
    brand: 'DARK FOREST <b>BOTS</b> · ELECTRIC',
    brandBig: 'DARK FOREST <b>BOTS</b>',
    sub: 'ELECTRIC · SEASON 2 · SOLANA',
    initialising: 'INITIALISING',
    scanComplete: 'SCAN COMPLETE',
    stripAddr: 'ADDRESS',
    stripAtk: 'ATTACKS',
    stripTot: 'TOTAL',
    stripSeen: 'FIRST SEEN',
    stripFt: 'DARK FOREST BOTS · 2021 REGISTRY',
    swapHd: 'SOLANA · SWAP',
    youPay: 'YOU PAY',
    youRecv: 'YOU RECEIVE',
    confirm: 'CONFIRM',
    sandwich: '⚠ SANDWICH DETECTED',
    activate: 'ACTIVATE',
    puzzleTitle: 'RECONSTRUCT THE ATTACK',
    slotFront: 'FRONT-RUN',
    slotVictim: 'VICTIM',
    slotBack: 'BACK-RUN',
    recTitle: 'CONTAINMENT RECORD',
    recCase: 'CASE',
    recSubj: 'SUBJECT',
    recRanger: 'RANGER',
    recNet: 'NETWORK',
    recSig: 'SIGNATURE',
    viewExplorer: 'VIEW ON SOLANA EXPLORER',
    patrolLog: 'PATROL LOG',
    scripted: 'SCRIPTED',
    continueBtn: 'CONTINUE',
    endTitle: 'DARK FOREST · <b>BOT #343</b>',
    scanToPlay: 'SCAN TO PLAY',
    replay: 'REPLAY',
    // loader progress (main.js)
    load1: 'BUILDING ELECTRIC DISTRICT',
    load2: 'OPENING TRANSACTION STREAM',
    load3: 'LOADING RANGER ONE',
    load4: 'GENERATING SUSPECTS',
    load5: 'READY',
  },
  ka: {
    objScan: 'დაასკანერე სამივე საეჭვო ბოტი. მიუახლოვდი და დააჭირე E.',
    objPuzzle: 'დაბრუნდი კონსოლთან. აღადგინე თავდასხმის თანმიმდევრობა.',
    objChase: 'თავდამსხმელი გარბის. დაეწიე და დააჭირე F — გაუშვი შემაკავებელი ჭავლი.',
    objDone: 'ობიექტი იზოლირებულია.',
    scanned: (n) => `დასკანერებული <b>${n}</b> / 3`,
    pressE: 'დააჭირე  E  ·  სკანირება',
    pressF: 'დააჭირე  F  ·  ჭავლის გაშვება',
    noMatch: 'არ ემთხვევა — ხელწერა სუფთაა.',
    keys: 'WASD მოძრაობა · SHIFT სირბილი · SPACE ხტომა<br>გადაათრიე — კამერა · E ინტერაქცია · F სროლა',
    live: 'პირდაპირი · MAINNET',
    offline: 'ნაკადი გათიშულია',
    puzzleHint: `საქმე #${CASE.id}. სამი ტრანზაქცია ერთსა და იმავე სლოტში. დაალაგე შესრულების მიხედვით.`,
    wrong: 'არასწორი თანმიმდევრობა — ღირებულება ასე არ ამოღებულა.',
    right: 'თანმიმდევრობა დადასტურდა — თავდამსხმელი იდენტიფიცირებულია.',
    auto: 'ავტომატურად ამოხსნილია — თავდამსხმელი მსხვერპლს ორივე მხრიდან ახვევს.',
    l1: 'DEX-ზე შენი ტრანზაქციებისთვის ომი მიმდინარეობს.',
    l2: 'სენდვიჩ-შეტევების რისკის ქვეშ ხარ.',
    l3: 'ბოტი #343 — <em>RANGER ONE</em>',
    censusLabel: 'დაფიქსირებულია',
    m1: 'ბნელი ტყე სოლანას მიღმაც ვრცელდება.',
    m2: 'RANGER ONE უნდა გაფრინდეს <em>მთვარეზე</em>.',
    sending: 'ჩანაწერი იწერება Solana devnet-ზე…',
    simulated: 'სიმულაცია — devnet გასაღები არ არის კონფიგურირებული.',
    real: 'ჩაწერილია Solana devnet-ზე. გახსენი ბმული და თავად გადაამოწმე.',
    begin: 'დაწყება',
    capReveal: 'ბოტი #343 — <em>RANGER ONE</em> · პირველი დამცველი',
    capOrbit: 'SOLANA · <em>DEX CITY</em> · ყოველი შუქი — ტრანზაქციაა',
    capDive: 'ვეშვებით <em>ბნელ ტყეში</em>',
    // static chrome (index.html)
    title: 'ბნელი ტყე · ბოტი #343 · ELECTRIC',
    brand: 'ბნელი ტყის <b>ბოტები</b> · ELECTRIC',
    brandBig: 'ბნელი ტყის <b>ბოტები</b>',
    sub: 'ELECTRIC · სეზონი 2 · SOLANA',
    initialising: 'ინიციალიზაცია',
    scanComplete: 'სკანირება დასრულდა',
    stripAddr: 'მისამართი',
    stripAtk: 'თავდასხმები',
    stripTot: 'ჯამი',
    stripSeen: 'პირველად შენიშნეს',
    stripFt: 'ბნელი ტყის ბოტები · 2021 წლის რეესტრი',
    swapHd: 'SOLANA · გაცვლა',
    youPay: 'იხდი',
    youRecv: 'იღებ',
    confirm: 'დადასტურება',
    sandwich: '⚠ აღმოჩენილია სენდვიჩ-შეტევა',
    activate: 'აქტივაცია',
    puzzleTitle: 'აღადგინე თავდასხმა',
    slotFront: 'ფრონტ-რანი',
    slotVictim: 'მსხვერპლი',
    slotBack: 'ბექ-რანი',
    recTitle: 'იზოლაციის ჩანაწერი',
    recCase: 'საქმე',
    recSubj: 'ობიექტი',
    recRanger: 'რეინჯერი',
    recNet: 'ქსელი',
    recSig: 'ხელმოწერა',
    viewExplorer: 'ნახე SOLANA EXPLORER-ზე',
    patrolLog: 'პატრულის ჟურნალი',
    scripted: 'სცენარით',
    continueBtn: 'გაგრძელება',
    endTitle: 'ბნელი ტყე · <b>ბოტი #343</b>',
    scanToPlay: 'დაასკანერე და ითამაშე',
    replay: 'თავიდან',
    // loader progress (main.js)
    load1: 'შენდება ელექტრო უბანი',
    load2: 'იხსნება ტრანზაქციების ნაკადი',
    load3: 'იტვირთება RANGER ONE',
    load4: 'იქმნებიან ეჭვმიტანილები',
    load5: 'მზადაა',
  },
};

// v2 bumps the key so the old Georgian default isn't sticky for returning players.
let lang = localStorage.getItem('df343.lang.v2') || 'en';
export const t = (k, ...a) => {
  const v = DICT[lang][k] ?? DICT.en[k] ?? k;
  return typeof v === 'function' ? v(...a) : v;
};
export const getLang = () => lang;

/**
 * Retranslate every statically tagged node. Imperatively built content
 * (puzzle cards, sc2 line sequence, scan strip, record fields) keeps its
 * language until re-opened — toggling mid-screen is not a demo path. The
 * puzzle hint/message are cheap, so those two are re-rendered here.
 */
export function applyLang() {
  document.documentElement.dataset.lang = lang;
  document.documentElement.lang = lang;
  document.title = t('title');
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  if (!$('puzzle').classList.contains('hidden')) {
    $('puzzle-hint').textContent = t('puzzleHint');
  }
}

let onLangChange = () => {};
export function initLang(cb) {
  onLangChange = cb || (() => {});
  applyLang();
  $('lang').onclick = () => {
    lang = lang === 'en' ? 'ka' : 'en';
    localStorage.setItem('df343.lang.v2', lang);
    applyLang();
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
  notice(txt, ms = 2200) {
    const el = $('notice');
    el.textContent = txt;
    el.classList.remove('hidden');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.add('hidden'), ms);
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
      // Time-based so every case drains in ~1.6 s wall-clock, even when the
      // main thread is starved (headless smoke test on software GL).
      const DUR = 1600;
      const t0 = performance.now();
      const step = setInterval(() => {
        const k = Math.min(1, (performance.now() - t0) / DUR);
        const v = CASE.expected - (CASE.expected - CASE.received) * k;
        $('sc1-recv').textContent = `${Math.round(v).toLocaleString()} ${CASE.victimToken}`;
        if (k >= 1) { clearInterval(step); reveal(); }
      }, 26);
      $('sc1-recv').classList.add('bad');
    };

    function reveal() {
      onFlash?.();
      $('sc1-alert').classList.remove('hidden');
      const rows = [...TXS]
        .sort((a, b) => a.correct - b.correct)
        .map((tx) => [tx.who === 'YOU' ? 'you' : 'bot', tx.who.toLowerCase(), `${tx.kind}  ${tx.amount}`]);
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

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Scene 2 — the threat census. 342 hostiles flood a dense red block on an
 * ease-in cadence (countable at first, a flood by the end), a counter ticks
 * on the same curve, the wall crushes to near-black, and #343 ignites green,
 * alone on row 19 (342 = 18 × 19 exactly).
 */
export function scene2() {
  return new Promise((resolve) => {
    const el = $('sc2');
    el.classList.remove('hidden');
    const grid = $('sc2-grid');
    grid.innerHTML = '';
    grid.classList.remove('dim');

    const N = 342;
    const TOTAL = 2200;   // ms until the last hostile ignites
    const EASE = 0.65;    // ease-in exponent — flood, not linear fade

    const hot = new Set();
    while (hot.size < 12) hot.add(Math.floor(Math.random() * N));

    for (let i = 0; i < N; i++) {
      const s = document.createElement('i');
      const d = Math.round(TOTAL * Math.pow(i / N, EASE));
      if (hot.has(i)) {
        s.className = 'hot';
        // Second delay staggers the pulse loop so hot cells don't sync.
        s.style.animationDelay = `${d}ms, ${d + Math.round(Math.random() * 2400)}ms`;
      } else {
        s.style.animationDelay = `${d}ms`;
      }
      grid.appendChild(s);
    }

    // Counter locked to the ignition: count(t) is the inverse of delay(i),
    // so the number and the wall land on 342 in the same frame.
    const count = $('sc2-count');
    const c0 = performance.now();
    (function tick() {
      const k = Math.min(1, (performance.now() - c0) / TOTAL);
      const n = Math.max(1, Math.round(N * Math.pow(k, 1 / EASE)));
      count.innerHTML = `${t('censusLabel')} · <b>${String(n).padStart(3, '0')}</b>`;
      if (k < 1) requestAnimationFrame(tick);
    })();

    const linesEl = $('sc2-lines');
    linesEl.innerHTML = '';
    $('sc2-go').classList.add('hidden');

    const caret = document.createElement('span');
    caret.className = 'caret';

    // Typewriter that survives markup: set the line's innerHTML once, blank
    // its text nodes, then refill them character by character — the <em>
    // stays a real element, so RANGER ONE still arrives magenta. The reveal
    // is scheduled against the wall clock, so a starved main thread catches
    // up in bursts instead of stretching the scene.
    function typeLine(html) {
      return new Promise((done) => {
        const line = document.createElement('div');
        line.innerHTML = html;
        const nodes = [];
        (function walk(n) {
          for (const ch of n.childNodes) {
            if (ch.nodeType === Node.TEXT_NODE) { nodes.push({ node: ch, full: ch.nodeValue }); ch.nodeValue = ''; }
            else walk(ch);
          }
        })(line);
        linesEl.appendChild(line);
        line.appendChild(caret);   // everything after the type head is empty

        // Cumulative reveal times: 28ms/char, longer beats on . and —
        const times = [];
        let at = 0;
        for (const n of nodes) {
          for (const chr of n.full) {
            at += chr === '.' || chr === '—' ? 140 : 24;
            times.push(at);
          }
        }

        let shown = 0;
        const t0 = performance.now();
        (function step() {
          const elapsed = performance.now() - t0;
          let target = shown;
          while (target < times.length && times[target] <= elapsed) target++;
          if (target !== shown) {
            shown = target;
            let rest = shown;
            for (const n of nodes) {
              const take = Math.min(rest, n.full.length);
              n.node.nodeValue = n.full.slice(0, take);
              rest -= take;
            }
          }
          if (shown >= times.length) done();
          else setTimeout(step, 28);
        })();
      });
    }

    (async () => {
      await wait(1400);                 // type over the tail of the flood
      await typeLine(t('l1'));
      await wait(350);
      await typeLine(t('l2'));
      await wait(350);

      // The beat: crush the wall to near-black, hold, then #343 alone.
      grid.classList.add('dim');
      count.style.opacity = '0.25';
      await wait(650);
      const hero = document.createElement('i');
      hero.className = 'hero';
      grid.appendChild(hero);

      await typeLine(t('l3'));
      caret.remove();
      const go = $('sc2-go');
      go.textContent = t('activate');
      go.classList.remove('hidden');
      go.onclick = () => { el.classList.add('hidden'); resolve(); };
    })();
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
  $('r-journal-src').textContent = live ? 'CLAUDE' : t('scripted');
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
