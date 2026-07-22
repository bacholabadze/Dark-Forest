import { CASE, TXS, BOTS } from './constants.js';
import { skipActive, clearSkip } from './film/shots.js';

const $ = (id) => document.getElementById(id);

const DICT = {
  en: {
    brand: 'DARK FOREST BOTS · ELECTRIC',
    loaderSub: 'ELECTRIC · SEASON 2 · SOLANA',
    load1: 'BUILDING ELECTRIC DISTRICT',
    load2: 'OPENING TRANSACTION STREAM',
    load3: 'LOADING RANGER ONE',
    load4: 'GENERATING SUSPECTS',
    load5: 'READY',
    begin: 'BEGIN',
    hbFacts: (slot) => `SLOT ${slot} · 3 TX · 1 VICTIM`,
    tcName: 'DARK FOREST · <em>BOT #343</em>',
    tc12h: '12 HOURS EARLIER',
    capP1: 'A real sandwich case — three trades, one victim.',
    capP2: 'A bot races through the district.',
    capP3: 'Ranger One drops into the chase.',
    capP4: 'You close the gap.',
    capFreeze: 'One leap from containment.',
    skipHint: 'SKIP SCENE',
    skipHintKey: 'ENTER',
    // ACT1 academy 3-beat
    capVictim: 'You are buying a token.',
    capBracket: 'A bot bought before you and sold after — that is a sandwich.',
    termHd: 'SOLANA · SWAP',
    youPay: 'YOU PAY',
    youReceive: 'YOU RECEIVE',
    confirm: 'CONFIRM',
    sandwichAlert: '⚠ SANDWICH DETECTED',
    sandwichExplain: 'You received less because the bot moved the price against you.',
    rowYou: 'you',
    rowBot: 'bot 0x2222…',
    // Story: sandwich victims on Solana — never "other bots that failed"
    l1: '~5,000 WALLETS SANDWICHED · EVERY DAY',
    l2: 'MOST NEVER NOTICE THE LOSS.',
    l3: 'BOT #343 — <em>RANGER ONE</em>',
    activate: 'ACTIVATE',
    cap2021: '2021 · THE FIRST HARVESTERS',
    cap2023: '2025 · ~160,000 VICTIM WALLETS / 30 DAYS',
    cap2026: '2026 · SOLANA — <em>TODAY</em>',
    capReveal: 'BOT #343 — <em>RANGER ONE</em>',
    capOrbit: 'SOLANA · <em>DEX CITY</em> · EVERY LIGHT IS A TRANSACTION',
    capDive: 'DESCENDING INTO <em>THE DARK FOREST</em>',
    objScan: 'Scan 3 suspects near RAYDIUM DEX. Walk close → press E.',
    objPuzzle: 'Order the cards: who bought first, who was the victim, who sold after.',
    objChase: 'Catch the red bot → press SPACE to contain (lock it in a cage).',
    objDone: 'Subject contained. Case sealed.',
    tipScan: 'Tip: WASD moves · camera follows your face · drag mouse to look around',
    scanned: (n) => `SCANNED <b>${n}</b> / 3`,
    pressE: 'PRESS  E  ·  SCAN',
    pressSpace: 'PRESS  SPACE  ·  CONTAIN',
    keys: 'WASD move (camera follows) · SHIFT sprint · SPACE jump<br>DRAG mouse look · E interact',
    live: 'LIVE · MAINNET',
    offline: 'STREAM OFFLINE',
    txcount: (n) => `TX <b>${n.toLocaleString()}</b>`,
    stripDone: 'SCAN COMPLETE',
    stripAddr: 'ADDRESS',
    stripAtk: 'ATTACKS',
    stripTot: 'TOTAL',
    stripSeen: 'FIRST SEEN',
    stripFt: 'DARK FOREST BOTS · 2021 REGISTRY',
    puzzleTitle: 'RECONSTRUCT THE ATTACK',
    puzzleHint: `Case #${CASE.id}. Why this order? The same bot buys first and sells last — that is the sandwich.`,
    slotFront: 'FRONT-RUN',
    slotVictim: 'VICTIM',
    slotBack: 'BACK-RUN',
    wrong: 'INCORRECT SEQUENCE — that is not how the value was extracted.',
    right: 'SEQUENCE CONFIRMED — attacker identified.',
    auto: 'SOLVED FOR YOU — the attacker brackets the victim on both sides.',
    choiceApproach: 'RANGER, CHOOSE THE APPROACH',
    optStakeout: 'STAKEOUT<span>watch it strike — gather proof</span>',
    optPursuit: 'PURSUIT<span>strike now — no warning</span>',
    choiceVerdict: 'PASS THE VERDICT',
    optTribunal: 'TRIBUNAL<span>contain it forever</span>',
    optRehab: 'REHABILITATE<span>recruit a second defender</span>',
    autopick: (n) => `AUTO-DECIDES IN ${n}s`,
    capStakeout: 'Stakeout — watch the next strike without alerting it.',
    capCaught: 'Caught in the act — proof of the sandwich.',
    capLoop: 'This is where you came in.',
    capTribunal: 'Tribunal — case sealed.',
    archSealed: '<em>CASE SEALED</em>',
    capRehab: 'BOT #344 — <em>SECOND DEFENDER</em>',
    recordTitle: 'CONTAINMENT RECORD',
    recCase: 'CASE',
    recSubject: 'SUBJECT',
    recRanger: 'RANGER',
    recNetwork: 'NETWORK',
    recSig: 'SIGNATURE',
    explorer: 'VIEW ON SOLANA EXPLORER',
    patrolLog: 'PATROL LOG',
    sending: 'Writing containment record to Solana devnet…',
    simulated: 'SIMULATED — no funded devnet keypair configured.',
    real: 'Written to Solana devnet. Open the link and verify it yourself.',
    continue: 'CONTINUE',
    m1: 'THE DARK FOREST EXTENDS BEYOND SOLANA.',
    m2: 'RANGER ONE MUST GO TO <em>THE MOON</em>.',
    scanToPlay: 'SCAN TO PLAY',
    replay: 'REPLAY',
  },
  ka: {
    brand: 'ბნელი ტყის ბოტები · ELECTRIC',
    loaderSub: 'ELECTRIC · სეზონი 2 · SOLANA',
    load1: 'ელექტრონული უბნის აშენება',
    load2: 'ტრანზაქციების ნაკადის გახსნა',
    load3: 'რეინჯერ ერთის ჩატვირთვა',
    load4: 'ეჭვმიტანილების გენერირება',
    load5: 'მზადაა',
    begin: 'დაწყება',
    hbFacts: (slot) => `სლოტი ${slot} · 3 ტრანზაქცია · 1 მსხვერპლი`,
    tcName: 'ბნელი ტყე · <em>ბოტი #343</em>',
    tc12h: '12 საათით ადრე',
    capP1: 'რეალური სენდვიჩის საქმე — სამი გარიგება, ერთი მსხვერპლი.',
    capP2: 'ბოტი უბანში გარბის.',
    capP3: 'რეინჯერი ერთი დევნაში იშვება.',
    capP4: 'უფრო ახლოს ხართ.',
    capFreeze: 'ერთი ნაბიჯი იზოლაციამდე.',
    skipHint: 'სცენის გამოტოვება',
    skipHintKey: 'ENTER',
    capVictim: 'თქვენ ყიდულობთ ტოკენს.',
    capBracket: 'ბოტმა თქვენამდე იყიდა და თქვენს შემდეგ გაყიდა — ეს არის სენდვიჩი.',
    termHd: 'SOLANA · გაცვლა',
    youPay: 'თქვენ იხდით',
    youReceive: 'თქვენ იღებთ',
    confirm: 'დადასტურება',
    sandwichAlert: '⚠ დაფიქსირდა სენდვიჩ შეტევა',
    sandwichExplain: 'ნაკლები მიიღეთ, რადგან ბოტმა ფასი თქვენს საწინააღმდეგოდ გადააადგილა.',
    rowYou: 'თქვენ',
    rowBot: 'ბოტი 0x2222…',
    l1: 'ყოველდღე ~5,000 საფულე სენდვიჩდება',
    l2: 'უმეტესობა არც კი ამჩნევს დანაკარგს.',
    l3: 'ბოტი #343 — <em>რეინჯერი ერთი</em>',
    activate: 'გააქტიურება',
    cap2021: '2021 · პირველი შემგროვებლები',
    cap2023: '2025 · ~160,000 დაზარალებული საფულე / 30 დღე',
    cap2026: '2026 · SOLANA — <em>დღეს</em>',
    capReveal: 'ბოტი #343 — <em>რეინჯერი ერთი</em>',
    capOrbit: 'SOLANA · <em>DEX ქალაქი</em> · ყოველი ნათება ტრანზაქციაა',
    capDive: 'დაშვება <em>ბნელ ტყეში</em>',
    objScan: 'დაასკანირე 3 საეჭვო RAYDIUM DEX-თან. მიუახლოვდი → დააჭირე E-ს.',
    objPuzzle: 'დაალაგე ბარათები: ვინ იყიდა პირველი, ვინ იყო მსხვერპლი, ვინ გაყიდა ბოლოს.',
    objChase: 'დაეწიე წითელ ბოტს → დააჭირე SPACE-ს იზოლაციისთვის (გალიაში ჩაკეტვა).',
    objDone: 'ობიექტი იზოლირებულია. საქმე დახურულია.',
    tipScan: 'რჩევა: WASD მოძრაობა · კამერა მიჰყვება სახეს · გადაათრიე მაუსი მიმოხედვისთვის',
    scanned: (n) => `დასკანირებულია <b>${n}</b> / 3`,
    pressE: 'დააჭირეთ E-ს · სკანირება',
    pressSpace: 'დააჭირეთ SPACE-ს · იზოლირება',
    keys: 'WASD მოძრაობა (კამერა მიჰყვება) · SHIFT სირბილი · SPACE ნახტომი<br>DRAG მიმოხედვა · E მოქმედება',
    live: 'ლაივი · MAINNET',
    offline: 'ნაკადი გათიშულია',
    txcount: (n) => `ტრანზაქცია <b>${n.toLocaleString()}</b>`,
    stripDone: 'სკანირება დასრულებულია',
    stripAddr: 'მისამართი',
    stripAtk: 'შეტევები',
    stripTot: 'ჯამი',
    stripSeen: 'პირველად გამოჩნდა',
    stripFt: 'ბნელი ტყის ბოტები · 2021 წლის რეესტრი',
    puzzleTitle: 'აღადგინეთ შეტევა',
    puzzleHint: `საქმე #${CASE.id}. რატომ ეს მიმდევრობა? იგივე ბოტი ყიდულობს პირველი და ყიდის ბოლოს — ეს არის სენდვიჩი.`,
    slotFront: 'წინსწრება',
    slotVictim: 'მსხვერპლი',
    slotBack: 'კუდში მიყოლა',
    wrong: 'არასწორი მიმდევრობა — ღირებულება ასე არ მოუპარავთ.',
    right: 'მიმდევრობა დადასტურებულია — თავდამსხმელი იდენტიფიცირებულია.',
    auto: 'ავტომატურად ამოხსნილია — თავდამსხმელი მსხვერპლს ორივე მხრიდან ბლოკავს.',
    choiceApproach: 'რეინჯერო, აირჩიე მიდგომა',
    optStakeout: 'ჩასაფრება<span>დააკვირდით შეტევას — შეაგროვეთ მტკიცებულებები</span>',
    optPursuit: 'დევნა<span>დაესხით თავს ახლავე — გაფრთხილების გარეშე</span>',
    choiceVerdict: 'გამოიტანეთ განაჩენი',
    optTribunal: 'ტრიბუნალი<span>სამუდამო იზოლირება</span>',
    optRehab: 'რეაბილიტაცია<span>მეორე დამცველის გადაბირება</span>',
    autopick: (n) => `ავტომატური არჩევანი ${n} წამში`,
    capStakeout: 'ჩასაფრება — უყურე შემდეგ შეტევას გაფრთხილების გარეშე.',
    capCaught: 'ფაქტზე დაჭერილია — სენდვიჩის მტკიცებულება.',
    capLoop: 'აქედან დაიწყეთ თქვენ.',
    capTribunal: 'ტრიბუნალი — საქმე დახურულია.',
    archSealed: '<em>საქმე დახურულია</em>',
    capRehab: 'ბოტი #344 — <em>მეორე დამცველი</em>',
    recordTitle: 'იზოლაციის ჩანაწერი',
    recCase: 'საქმე',
    recSubject: 'ობიექტი',
    recRanger: 'რეინჯერი',
    recNetwork: 'ქსელი',
    recSig: 'ხელმოწერა',
    explorer: 'ნახვა SOLANA EXPLORER-ზე',
    patrolLog: 'პატრულის ჟურნალი',
    sending: 'იზოლაციის ჩანაწერი ინახება Solana devnet-ზე…',
    simulated: 'სიმულირებულია — დაფინანსებული devnet გასაღები არ არის მითითებული.',
    real: 'ჩაწერილია Solana devnet-ზე. გახსენით ბმული და თავად გადაამოწმეთ.',
    continue: 'გაგრძელება',
    m1: 'ბნელი ტყე SOLANA-ს ფარგლებს სცდება.',
    m2: 'რეინჯერი ერთი უნდა წავიდეს <em>მთვარეზე</em>.',
    scanToPlay: 'დაასკანირეთ სათამაშოდ',
    replay: 'თავიდან თამაში',
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
    applyLabels();
    onLangChange();
  };
  applyLabels();
}

export const hud = {
  show() { $('hud').classList.remove('hidden'); },
  objective(txt) { $('objective').textContent = txt; },
  tip(txt) {
    const el = $('gametip');
    if (!el) return;
    if (!txt) { el.classList.add('hidden'); return; }
    el.textContent = txt;
    el.classList.remove('hidden');
  },
  scanned(n) { $('scancount').innerHTML = t('scanned', n); },
  keys() { $('keys').innerHTML = t('keys'); },
  txCount(n) { $('txcount').innerHTML = t('txcount', n); },
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

/** Refresh every static UI label from the active language. */
export function applyLabels() {
  const set = (id, key, html = false) => {
    const el = $(id);
    if (!el) return;
    if (html) el.innerHTML = t(key);
    else el.textContent = t(key);
  };
  set('brand-hud', 'brand');
  set('brand-load', 'brand');
  set('load-sub', 'loaderSub');
  set('term-hd', 'termHd');
  set('term-pay', 'youPay');
  set('term-recv', 'youReceive');
  set('sc1-confirm', 'confirm');
  set('sc1-alert', 'sandwichAlert');
  set('sandwich-explain', 'sandwichExplain');
  set('puzzle-title', 'puzzleTitle');
  set('slot-front', 'slotFront');
  set('slot-victim', 'slotVictim');
  set('slot-back', 'slotBack');
  set('record-title', 'recordTitle');
  set('lab-case', 'recCase');
  set('lab-subj', 'recSubject');
  set('lab-ranger', 'recRanger');
  set('lab-net', 'recNetwork');
  set('lab-sig', 'recSig');
  set('r-link', 'explorer');
  set('r-journal-lab', 'patrolLog');
  set('r-close', 'continue');
  set('qr-label', 'scanToPlay');
  set('sc7-again', 'replay');
  set('strip-done', 'stripDone');
  set('lab-addr', 'stripAddr');
  set('lab-atk', 'stripAtk');
  set('lab-tot', 'stripTot');
  set('lab-seen', 'stripSeen');
  set('strip-ft', 'stripFt');
  const skip = $('skipbtn');
  if (skip) skip.innerHTML = `<b>${t('skipHintKey')}</b> · ${t('skipHint')}`;
}

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
  /** Scene code badge for rehearsal (P2, ACT1, CHASE…). Always on during film. */
  code(code) {
    const el = $('scenecode');
    if (!el) return;
    if (!code) { el.classList.add('hidden'); return; }
    el.textContent = code;
    el.classList.remove('hidden');
    window.__beat = code;
  },
  skipHint(on) {
    const el = $('skipbtn');
    if (!el) return;
    el.innerHTML = `<b>${t('skipHintKey')}</b> · ${t('skipHint')}`;
    el.classList.toggle('hidden', !on);
  },
};

/** Act I mini terminal — the swap watches from a corner while the 3D city
 *  plays the real drama, then zooms fullscreen for the CONFIRM click. */
export function terminalMini(on) {
  const el = $('sc1');
  if (on) {
    applyLabels();
    $('sc1-recv').textContent = `${CASE.expected.toLocaleString()} ${CASE.victimToken}`;
    $('sc1-recv').classList.remove('bad');
    $('sc1-alert').classList.add('hidden');
    $('sandwich-explain')?.classList.add('hidden');
    $('sc1-rows').innerHTML = '';
    $('sc1-confirm').disabled = true;
    el.classList.add('mini');
    el.classList.remove('hidden');
  } else {
    el.classList.remove('mini');
  }
}

/** Choice point — two buttons, countdown auto-picks the recommended option. */
export function askChoice(titleKey, options, recommended = 0, seconds = 8) {
  return new Promise((resolve) => {
    const el = $('choice');
    el.classList.remove('hidden');
    $('choice-title').textContent = t(titleKey);
    const btns = [$('choice-a'), $('choice-b')];
    let timer = null, ticker = null;

    const pick = (id) => {
      clearTimeout(timer);
      clearInterval(ticker);
      el.classList.add('hidden');
      resolve(id);
    };

    options.forEach((o, i) => {
      btns[i].innerHTML = t(o.label);
      btns[i].classList.toggle('rec', i === recommended);
      btns[i].onclick = () => pick(o.id);
    });

    let left = seconds;
    const cd = $('choice-count');
    cd.textContent = t('autopick', left);
    ticker = setInterval(() => {
      left = Math.max(0, left - 1);
      cd.textContent = t('autopick', left);
    }, 1000);
    timer = setTimeout(() => pick(options[recommended].id), seconds * 1000);
  });
}

/** Tribunal epilogue — case sealed card (no bot-count archive). */
export function endingArchive() {
  return new Promise((resolve) => {
    const el = $('sc2');
    el.classList.remove('hidden');
    const grid = $('sc2-grid');
    grid.innerHTML = '';
    $('sc2-lines').innerHTML = t('archSealed');
    $('sc2-go').classList.add('hidden');
    setTimeout(() => { el.classList.add('hidden'); resolve(); }, 2400);
  });
}

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
    el.classList.remove('hidden', 'mini');
    applyLabels();
    $('sc1-confirm').disabled = false;
    $('sc1-recv').textContent = `${CASE.expected.toLocaleString()} ${CASE.victimToken}`;
    $('sc1-recv').classList.remove('bad');
    $('sc1-alert').classList.add('hidden');
    $('sandwich-explain')?.classList.add('hidden');
    $('sc1-rows').innerHTML = '';

    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      el.classList.add('hidden');
      resolve();
    };

    const watch = setInterval(() => {
      if (!skipActive()) return;
      clearInterval(watch);
      clearSkip();
      onFlash?.();
      done();
    }, 120);

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
      clearInterval(watch);
      onFlash?.();
      $('sc1-alert').classList.remove('hidden');
      $('sandwich-explain')?.classList.remove('hidden');
      const rows = [
        ['bot', t('rowBot'), `BUY  ${Math.round(CASE.expected * 8).toLocaleString()} ${CASE.victimToken}`],
        ['you', t('rowYou'), `BUY  ${CASE.expected.toLocaleString()} ${CASE.victimToken}`],
        ['bot', t('rowBot'), `SELL ${Math.round(CASE.expected * 1.34).toLocaleString()} ${CASE.victimToken}`],
      ];
      rows.forEach(([cls, who, what], i) => {
        const d = document.createElement('div');
        d.className = cls;
        d.style.animationDelay = `${0.25 + i * 0.28}s`;
        d.innerHTML = `<span>${who}</span><span>${what}</span><span>slot ${CASE.slot}</span>`;
        $('sc1-rows').appendChild(d);
      });
      setTimeout(done, 3400);
    }
  });
}

export function scene2() {
  return new Promise((resolve) => {
    const el = $('sc2');
    el.classList.remove('hidden');
    const grid = $('sc2-grid');
    grid.innerHTML = '';
    for (let i = 0; i < 280; i++) {
      const s = document.createElement('i');
      s.style.animationDelay = `${i * 0.003}s`;
      grid.appendChild(s);
    }
    $('sc2-lines').innerHTML = '';
    $('sc2-go').classList.add('hidden');

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      el.classList.add('hidden');
      resolve();
    };

    const seq = [t('l1'), t('l2'), t('l3')];
    let i = 0;
    const next = () => {
      if (finished) return;
      if (skipActive()) {
        clearSkip();
        $('sc2-lines').innerHTML = seq.join('<br>');
        const hero = document.createElement('i');
        hero.className = 'hero';
        grid.appendChild(hero);
        return finish();
      }
      if (i >= seq.length) {
        const hero = document.createElement('i');
        hero.className = 'hero';
        grid.appendChild(hero);
        const go = $('sc2-go');
        go.textContent = t('activate');
        go.classList.remove('hidden');
        go.onclick = finish;
        return;
      }
      $('sc2-lines').innerHTML = seq.slice(0, i + 1).join('<br>');
      i++;
      setTimeout(next, 1150);
    };
    setTimeout(next, 800);

    const watch = setInterval(() => {
      if (finished) return clearInterval(watch);
      if (skipActive()) { clearSkip(); clearInterval(watch); finish(); }
    }, 120);
  });
}

export function openPuzzle() {
  return new Promise((resolve) => {
    const el = $('puzzle');
    el.classList.remove('hidden');
    applyLabels();
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
    applyLabels();
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
  $('r-journal-src').textContent = live ? 'GEMINI' : 'SCRIPTED';
  $('r-journal').classList.remove('hidden');
}

export function sendingRecord() {
  const el = $('record');
  el.classList.remove('hidden');
  applyLabels();
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
  applyLabels();
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
  progress(p, key) {
    $('bar').style.width = `${Math.round(p * 100)}%`;
    if (key) $('loadtxt').textContent = t(key);
  },
  ready(onBegin) {
    applyLabels();
    const b = $('begin');
    b.textContent = t('begin');
    b.classList.remove('hidden');
    b.onclick = () => { $('loader').classList.add('hidden'); onBegin(); };
  },
};
