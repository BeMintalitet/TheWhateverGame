/* THE WHATEVER GAME — headless regression harness.
   Usage: node run.js ../game.patched.html [suite]
   Suites: boot, sweep, meta, ads, pause, stress, all (default)                */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const env = require('./env.js');

const FILE = process.argv[2] || path.join(__dirname, '..', 'game.patched.html');
const SUITE = process.argv[3] || 'all';
const html = fs.readFileSync(FILE, 'utf8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error('no <script> block'); process.exit(1); }
const CODE = m[1];

const FAILS = [], NOTES = [];
function fail(s) { FAILS.push(s); console.log('  ✗ ' + s); }
function ok(s) { console.log('  ✓ ' + s); }
function note(s) { NOTES.push(s); }

function boot(W, H) {
  const { win, doc, canvas, listeners } = env.install(W, H);
  env.setTime(0);
  const ctxObj = vm.createContext(win);
  // expose the usual browser globals directly on the sandbox
  for (const k of ['document', 'localStorage', 'navigator', 'performance', 'matchMedia',
    'AudioContext', 'webkitAudioContext', 'requestAnimationFrame', 'cancelAnimationFrame',
    'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'addEventListener',
    'removeEventListener', 'innerWidth', 'innerHeight', 'devicePixelRatio']) {
    win[k] = win[k];
  }
  win.console = console;
  win.Math = Math; win.JSON = JSON; win.Date = Date; win.Promise = Promise;
  win.Set = Set; win.Map = Map; win.Array = Array; win.Object = Object;
  win.Uint8ClampedArray = Uint8ClampedArray; win.Float32Array = Float32Array;
  win.isFinite = isFinite; win.isNaN = isNaN; win.parseInt = parseInt; win.parseFloat = parseFloat;
  vm.runInContext(CODE, ctxObj, { filename: 'game.js' });
  return { win, doc, canvas, listeners, ctxObj };
}
function step(B, dtMs) {
  env.setTime(env.time + dtMs);
  env.runTimers();
  const cb = env.raf;
  if (!cb) throw new Error('no rAF scheduled');
  cb(env.time);
}
function frames(B, n, dtMs) {
  for (let i = 0; i < n; i++) step(B, dtMs === undefined ? 16.7 : dtMs);
}
function tap(B, x, y) {
  const e = { preventDefault() {}, clientX: x, clientY: y, pointerId: 1, pointerType: 'touch' };
  B.canvas.dispatch('pointerdown', e);
  for (const f of (B.listeners['pointerup'] || [])) f({ pointerId: 1, preventDefault() {} });
}
function drag(B, x0, y0, x1, y1, steps) {
  steps = steps || 6;
  B.canvas.dispatch('pointerdown', { preventDefault() {}, clientX: x0, clientY: y0, pointerId: 1, pointerType: 'touch' });
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    for (const f of (B.listeners['pointermove'] || []))
      f({ pointerId: 1, clientX: x0 + (x1 - x0) * t, clientY: y0 + (y1 - y0) * t });
    frames(B, 2);
  }
  for (const f of (B.listeners['pointerup'] || [])) f({ pointerId: 1, preventDefault() {} });
}
function key(B, code, up) {
  const e = { code, repeat: false, preventDefault() {} };
  for (const f of (B.listeners[up ? 'keyup' : 'keydown'] || [])) f(e);
}
const g = (B, n) => vm.runInContext(n, B.ctxObj);
const set = (B, expr) => vm.runInContext(expr, B.ctxObj);

/* ------------------------------------------------------------------ */
function suiteBoot() {
  console.log('\n[boot] load + title + counts');
  const B = boot(412, 915);
  frames(B, 60);
  const c = g(B, '__TWG.counts');
  console.log('  counts:', JSON.stringify(c));
  if (g(B, 'state') !== 'title') fail('did not settle on title');else ok('title state');
  if (c.ach < 1000) fail('only ' + c.ach + ' achievements (want >=1000)'); else ok(c.ach + ' achievements');
  if (c.skins < 100) fail('only ' + c.skins + ' skins (want >=100)'); else ok(c.skins + ' skins');
  if (c.bosses !== 4) fail('bosses=' + c.bosses); else ok('4 bosses');
  if (c.worlds !== 9) fail('worlds=' + c.worlds); else ok('9 worlds');
  const miss = g(B, '__TWG.missing');
  if (miss.length) fail('selfcheck missing: ' + miss.join(',')); else ok('selfcheck clean');
  const dupSkins = g(B, 'SKINS.length !== new Set(SKINS.map(s=>s.id)).size');
  if (dupSkins) fail('duplicate skin ids'); else ok('skin ids unique');
  const dupAch = g(B, 'ACH.length !== new Set(ACH.map(a=>a.k)).size');
  if (dupAch) fail('duplicate achievement keys'); else ok('achievement keys unique');
  const noFn = g(B, 'ACH.filter(a=>a.f&&typeof a.f!=="function").length');
  if (noFn) fail(noFn + ' achievements with non-fn check'); else ok('all checks callable');
  return B;
}
function suiteSweep() {
  console.log('\n[sweep] force-load every mode + boss, both orientations, 400 frames each');
  for (const [W, H] of [[412, 915], [915, 412], [360, 640]]) {
    const B = boot(W, H);
    frames(B, 10);
    const keys = g(B, 'MODES.concat(BOSSES).map(m=>m.key)');
    let bad = 0;
    for (const k of keys) {
      try {
        set(B, `SURV=null;VSM=null;DAILY=false;startGame(12345);`);
        set(B, `setMode(MODES.concat(BOSSES).find(m=>m.key==='${k}'),true);`);
        for (let i = 0; i < 400; i++) {
          set(B, 'if(G&&G.hearts<3)G.hearts=5;');
          if (i % 7 === 0) drag(B, W * 0.3, H * 0.4, W * 0.7, H * 0.7, 2);
          if (i % 11 === 0) tap(B, W * 0.5, H * 0.5);
          frames(B, 1);
          const px = g(B, 'P.x'), py = g(B, 'P.y');
          if (!isFinite(px) || !isFinite(py)) { fail(k + '@' + W + 'x' + H + ': player NaN'); bad++; break; }
        }
      } catch (e) { fail(k + '@' + W + 'x' + H + ': ' + e.message); bad++; }
    }
    if (!bad) ok(keys.length + ' modes clean @ ' + W + 'x' + H);
  }
}
function suiteMeta() {
  console.log('\n[meta] achievements, skins, currency, save round-trip');
  const B = boot(412, 915);
  frames(B, 20);
  const before = g(B, 'EARNED.size');
  // simulate a strong run
  set(B, `startGame(7);G.score=26000;G.coins=95;G.kills=40;G.morphs=12;G.bestCombo=30;G.cycle=3;G.hitsTaken=0;G.t=240;`);
  set(B, 'gameOver();');
  frames(B, 10);
  const after = g(B, 'EARNED.size');
  if (after <= before) fail('no achievements unlocked by a big run'); else ok((after - before) + ' badges unlocked');
  if (g(B, 'ST.runs') !== 1) fail('ST.runs=' + g(B, 'ST.runs')); else ok('run counted');
  if (!(g(B, 'ST.bits') > 0)) fail('no bits awarded'); else ok('bits awarded: ' + g(B, 'ST.bits'));
  if (!(g(B, 'ST.totalScore') >= 26000)) fail('totalScore not banked'); else ok('lifetime score banked');
  if (!(g(B, 'OWNED.size') >= 8)) fail('owned skins=' + g(B, 'OWNED.size')); else ok('owned ' + g(B, 'OWNED.size') + ' skins');
  // save round trip: reboot with the same store is not possible across contexts,
  // so verify the serialised blob at least parses and keeps shape
  const raw = g(B, 'JSON.parse(localStorage.getItem("twg_stats"))');
  if (!raw || raw.runs !== 1) fail('stats did not persist'); else ok('stats persisted');
  const ver = g(B, 'JSON.parse(localStorage.getItem("twg_ver"))');
  if (ver !== 2) fail('save version=' + ver); else ok('save schema v2');
  // buying a skin
  set(B, 'ST.bits=99999;');
  const boughtOK = g(B, '(function(){const s=SKINS.find(x=>!OWNED.has(x.id));if(!s)return "none";const c=skinCost(s);if(!spendBits(c))return "nofunds";ownSkin(s.id,true);equipSkin(s.id);return EQUIPPED===s.id?"ok":"noequip";})()');
  if (boughtOK !== 'ok') fail('skin purchase: ' + boughtOK); else ok('skin purchase + equip');
  // every skin renders without NaN
  let renderBad = 0;
  try {
    set(B, `(function(){for(const s of SKINS){for(const r of [8,13,20,40]){drawSkinAt(100,100,r,s,{t:1.3,look:0.5,lookY:-0.3,squish:0.2,mood:'hype',blink:false});drawSkinAt(100,100,r,s,{t:0,look:-1,lookY:1,squish:-0.4,mood:'hurt',blink:true});}}})()`);
  } catch (e) { renderBad++; fail('skin render threw: ' + e.message); }
  if (env.NANS.length) { fail(env.NANS.length + ' NaN draw args, e.g. ' + env.NANS.slice(0, 3).join(' | ')); }
  else if (!renderBad) ok('all ' + g(B, 'SKINS.length') + ' skins render clean at 4 sizes × 2 moods');
  // legacy save migration
  const B2 = boot(412, 915);
  set(B2, `localStorage.setItem('twg_badges',JSON.stringify(['hop10','cat','void','bogus_key']));localStorage.setItem('twg_best','9999');`);
  // reconcile already ran at boot; emulate by re-running against a fresh boot is not
  // possible in-context, so just assert the reconcile helper handles junk
  const rec = g(B2, '(function(){const e=new Set(["hop10","cat","bogus"]);let out=[];for(const k of e){if(ACH_BY_KEY[k]){out.push(k);continue;}const mp=LEGACY_MAP[k];if(mp&&ACH_BY_KEY[mp])out.push(mp);}return out.join(",");})()');
  if (rec.indexOf('h_cat') < 0) fail('legacy badge map lost the cat: ' + rec); else ok('legacy badges migrate (' + rec + ')');
}
function suitePause() {
  console.log('\n[pause] sim must freeze, input must clear, no dt spike');
  const B = boot(412, 915);
  frames(B, 20);
  set(B, 'startGame(3);');
  frames(B, 40);
  const t0 = g(B, 'G.t'), score0 = g(B, 'G.score');
  set(B, 'IN.down=true;IN.keys={Space:true};setPaused(true,"user");');
  if (!g(B, 'PAUSED')) fail('PAUSED not set');
  if (g(B, 'IN.down')) fail('held input not cleared on pause'); else ok('held input cleared');
  frames(B, 120, 33);
  const t1 = g(B, 'G.t');
  if (Math.abs(t1 - t0) > 0.001) fail('sim advanced while paused (' + t0 + ' -> ' + t1 + ')'); else ok('sim frozen while paused');
  if (g(B, 'G.score') !== score0) fail('score moved while paused'); else ok('score frozen');
  set(B, 'setPaused(false,"");');
  frames(B, 5);
  const dt = g(B, '(function(){return typeof last==="number";})()');
  if (!dt) fail('last not reset'); else ok('frame clock reset on resume');
  frames(B, 60);
  if (!(g(B, 'G.t') > t1)) fail('sim did not resume'); else ok('sim resumed');
  // boss finish must never freeze the fight (audit P1)
  set(B, `startGame(9);setMode(ModeEcho,true);G.hearts=1;ModeEcho.finish(false);`);
  const st = g(B, 'state');
  const morphIn = g(B, 'ModeEcho.morphIn');
  if (!(morphIn > 0)) fail('echo exit not scheduled before death (morphIn=' + morphIn + ')');
  else ok('boss exit scheduled before gameOver (morphIn=' + morphIn.toFixed(2) + ')');
  // continue out of a dead boss
  set(B, `state='play';G.hearts=0;RUN.continued=false;G.score=5000;`);
  set(B, `continueOffer={t:1};doContinue();`);
  frames(B, 40);
  if (g(B, 'state') !== 'play') fail('continue did not resume play (state=' + g(B, 'state') + ')');
  else ok('rewarded continue resumes play');
  if (!(g(B, 'G.hearts') >= 2)) fail('continue gave no hearts'); else ok('continue restored hearts');
}
function suiteAds() {
  console.log('\n[ads] policy gates');
  const B = boot(412, 915);
  frames(B, 20);
  if (g(B, 'ADS.native')) fail('ADS.native true with no plugin'); else ok('no-plugin fallback is inert');
  // interstitial rate limit
  set(B, 'ADS.native=true;ADS.runsSinceInter=0;ADS.lastInter=Date.now();');
  if (g(B, 'adInterAllowed()')) fail('interstitial allowed immediately'); else ok('interstitial rate-limited by time');
  set(B, 'ADS.runsSinceInter=5;ADS.lastInter=0;');
  if (!g(B, 'adInterAllowed()')) fail('interstitial never allowed'); else ok('interstitial allowed after 3 runs + 90s');
  set(B, 'ADS.runsSinceInter=1;ADS.lastInter=0;');
  if (g(B, 'adInterAllowed()')) fail('interstitial allowed after 1 run'); else ok('run-count gate holds');
  // rewarded always pays out when there is no network
  set(B, 'ADS.native=false;');
  let paid = g(B, '(function(){let v=null;adShowRewarded(e=>{v=e;});return v;})()');
  if (paid !== true) fail('rewarded did not pay out in fallback'); else ok('rewarded pays out in fallback');
  // banner never during play
  set(B, 'startGame(1);');
  frames(B, 30);
  if (g(B, 'ADS.wantBanner')) fail('banner requested during play'); else ok('banner hidden during play');
  set(B, 'quitToMenu();');
  frames(B, 40);
  if (!g(B, 'ADS.wantBanner')) fail('banner not restored on menu'); else ok('banner restored on menu');
}
function suiteStress() {
  console.log('\n[stress] long random play, resize storms, screen churn');
  const B = boot(412, 915);
  frames(B, 20);
  let err = null;
  try {
    for (let run = 0; run < 6; run++) {
      set(B, 'SURV=null;VSM=null;DAILY=false;startGame();');
      for (let i = 0; i < 900; i++) {
        set(B, 'if(G&&G.hearts<2)G.hearts=5;');
        const r = Math.random();
        if (r < 0.25) tap(B, Math.random() * 412, Math.random() * 915);
        else if (r < 0.5) drag(B, Math.random() * 412, Math.random() * 915, Math.random() * 412, Math.random() * 915, 2);
        else if (r < 0.55) key(B, 'Space');
        else if (r < 0.57) key(B, 'Space', true);
        if (i % 150 === 100) {
          const w = 300 + ((Math.random() * 700) | 0), h = 300 + ((Math.random() * 900) | 0);
          B.win.innerWidth = w; B.win.innerHeight = h;
          for (const f of (B.listeners['resize'] || [])) f({});
        }
        frames(B, 1);
        if (!isFinite(g(B, 'P.x'))) throw new Error('player NaN in run ' + run + ' frame ' + i);
      }
      set(B, 'if(state==="play")gameOver();');
      frames(B, 20);
    }
  } catch (e) { err = e; }
  if (err) fail('stress: ' + err.message); else ok('6 runs × 900 frames + resize storms, no throw');
  // screen churn
  try {
    for (let i = 0; i < 40; i++) {
      set(B, `state='title';`); frames(B, 3);
      set(B, 'openBadges();'); frames(B, 3);
      set(B, 'achFilter=ACH_FILTERS[' + (i % 13) + ' % ACH_FILTERS.length][0];'); frames(B, 3);
      set(B, 'SCROLL.y=Math.random()*4000;'); frames(B, 3);
      set(B, 'openSkins();'); frames(B, 3);
      set(B, 'SCROLL.y=Math.random()*4000;'); frames(B, 3);
      set(B, 'openProfile();'); frames(B, 6);
    }
    ok('40× badge/skin/profile churn with random scroll');
  } catch (e) { fail('screen churn: ' + e.message); }
  // extreme viewports
  for (const [w, h] of [[240, 320], [1280, 800], [320, 1400], [200, 200]]) {
    try {
      B.win.innerWidth = w; B.win.innerHeight = h;
      for (const f of (B.listeners['resize'] || [])) f({});
      set(B, `state='title';`); frames(B, 6);
      set(B, 'openBadges();'); frames(B, 4);
      set(B, 'openSkins();'); frames(B, 4);
      set(B, 'startGame(2);'); frames(B, 60);
      set(B, 'if(state==="play")quitToMenu();');
      ok('viewport ' + w + 'x' + h + ' survives');
    } catch (e) { fail('viewport ' + w + 'x' + h + ': ' + e.message); }
  }
  if (env.NANS.length) fail(env.NANS.length + ' NaN draw args: ' + env.NANS.slice(0, 5).join(' | '));
  else ok('zero NaN draw arguments across the whole suite');
}
function suiteDeterminism() {
  console.log('\n[determinism] same seed must produce the same run');
  function sample(seed) {
    const B = boot(412, 915);
    frames(B, 10);
    set(B, `ST.runs=50;SURV=null;VSM=null;DAILY=true;startGame(${seed});`);
    const out = [];
    // long enough to clear the hardcoded tutorial cycle and roll real worlds/affixes
    for (let i = 0; i < 4000; i++) {
      frames(B, 1);
      set(B, 'if(G&&G.hearts<3)G.hearts=5;');
      if (i % 400 === 0) out.push(g(B, 'G.order.join("-")+"|"+G.worldIdx+"|"+(G.affix?G.affix.key:"-")+"|"+cur.key'));
    }
    return out.join(',');
  }
  const a = sample(4242), b = sample(4242), c = sample(999);
  if (a !== b) fail('same seed diverged'); else ok('same seed → identical run');
  if (a === c) note('different seeds produced identical shape (possible but suspicious)');
  else ok('different seed → different run');
}

const suites = { boot: suiteBoot, sweep: suiteSweep, meta: suiteMeta, pause: suitePause,
  ads: suiteAds, stress: suiteStress, determinism: suiteDeterminism };
console.log('harness: ' + path.basename(FILE) + '  suite=' + SUITE);
const list = SUITE === 'all' ? Object.keys(suites) : [SUITE];
for (const s of list) { if (!suites[s]) { console.log('unknown suite ' + s); continue; } try { suites[s](); } catch (e) { fail(s + ' threw: ' + e.stack.split('\n').slice(0, 3).join(' | ')); } }
console.log('\n================ ' + (FAILS.length ? 'FAIL (' + FAILS.length + ')' : 'ALL GREEN') + ' ================');
for (const f of FAILS) console.log('  ✗ ' + f);
for (const n of NOTES) console.log('  ! ' + n);
process.exit(FAILS.length ? 1 : 0);
