#!/usr/bin/env python3
"""
Build the screenshot rig.

The game is a single canvas, so cropping a browser window would give the wrong
pixel size and a strip of browser chrome. Instead we take the real release build,
append a capture script that forces the canvas to each Play Store resolution,
poses the game, and posts the PNG back to TWG Studio.

Output: twg-studio/shots/shooter.html  (served at http://localhost:4747/shots/)
"""
import io, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC  = os.path.join(ROOT, 'TheWhateverGame-release.html')
OUT  = os.path.join(ROOT, 'twg-studio', 'shots', 'shooter.html')
os.makedirs(os.path.dirname(OUT), exist_ok=True)

RIG = r"""
/* ==================================================================
   SCREENSHOT RIG — appended to a copy of the release build.
   Nothing here ships; it only exists inside twg-studio/shots/.
   ================================================================== */
(function(){
'use strict';

/* Play Store sizes. Portrait, inside Google's 16:9..9:16 window. */
const SIZES = [
  { folder:'phone',      w:1080, h:1920, scale:2.4 },
  { folder:'tablet-7in', w:1200, h:1920, scale:2.0 },
  { folder:'tablet-10in',w:1600, h:2560, scale:2.6 },
  /* Chromebooks run Android apps in a resizable window and the game handles
     landscape properly, so these are real, not letterboxed fakes. Play Games on
     PC and Android XR are deliberately absent: this is a portrait, one-thumb
     game and shipping it to those surfaces would earn bad reviews. */
  { folder:'chromebook', w:1920, h:1080, scale:2.0 }
];

/* Lock the canvas to an exact pixel size. The game normally derives W/H from
   innerWidth/innerHeight; we bypass that so the output is exact regardless of
   the window the browser happens to be in. `scale` keeps the UI legible: a
   1080-wide canvas at DPR 1 would render phone-sized type into a huge image. */
function lockSize(px, py, scale){
  DPR = scale;
  W = Math.round(px / scale);
  H = Math.round(py / scale);
  cv.width = px; cv.height = py;
  cv.style.width = (px/3) + 'px'; cv.style.height = (py/3) + 'px';
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  SAFE_INSET = 0;
  if (typeof NAV_INSET !== 'undefined') NAV_INSET = 0;
  initStars();
  /* Do NOT dispatch a resize event: the game's own resize() handler is
     registered by reference and would immediately overwrite W/H/canvas with
     innerWidth/innerHeight, silently undoing the lock. Modes get their
     relayout from setMode(m,true) in poseMode() instead. */
}

const wait = ms => new Promise(r => setTimeout(r, ms));

/* Give the save a rich, believable profile so the meta screens are not empty.
   These are screenshots of a played-in account, which is what the store should
   show — an empty badge list sells nothing. */
function seedProfile(){
  ST.runs = 214; ST.totalScore = 1893400; ST.bestScore = 68420;
  ST.bestCombo = 63; ST.totalMorphs = 4820; ST.totalCoins = 19840;
  ST.totalKills = 7310; ST.totalTime = 41200; ST.bits = 4820;
  ST.bitsEarned = 26100; ST.xp = 48200; ST.rank = rankFor(ST.xp);
  ST.dailyDone = 26; ST.dailyBestStreak = 11; ST.loginBest = 14; ST.loginDays = 31;
  ST.bossKills = 44; ST.noHitRuns = 9;
  for (const k of MODE_KEYS){
    ST.modePlays[k] = 8 + (k.length * 7) % 40;
    ST.modeBest[k]  = 2000 + (k.length * 1300) % 22000;
    ST.modeXP[k]    = 400 + (k.length * 520) % 5200;
  }
  for (const w of WORLDS) ST.worldVisits[w.key] = 5 + (w.key.length * 3) % 25;
  // unlock a good spread of badges and the showier skins
  let n = 0;
  for (const a of ACH){ if (n++ % 3 === 0) EARNED.add(a.k); }
  for (const s of SKINS){ if (['legendary','mythic','epic'].indexOf(s.rar) >= 0 || Math.random() < 0.5) OWNED.add(s.id); }
  equipSkin('goldking');
  sessionBest = ST.bestScore;
  LB.length = 0;
  [['BIT',68420,'cycle 9'],['NOVA',61180,'⚡ SWING'],['MAX',54900,'📅 AUG 8'],
   ['ZOE',48310,'cycle 7'],['KAI',44120,'VS · cycle 5'],['REX',39880,'⚡ MAZE'],
   ['ADA',35470,'cycle 4'],['LIV',31200,'📅 AUG 7']].forEach(e => LB.push({name:e[0],score:e[1],tag:e[2]}));
}

/* Pose a genre: run it for a while so the screen has real content in it,
   not an empty first frame. */
async function poseMode(key, frames, score, move){
  SURV = null; VSM = null; DAILY = false;
  startGame(20260808);
  const m = MODES.concat(BOSSES).find(x => x.key === key);
  setMode(m, true);
  G.score = score || 12480; G.hearts = 4; G.combo = 12; G.comboT = 4;
  G.cycle = 3; G.morphs = 14; G.coins = 62;
  CAP.text = ''; CAP.shown = 0; CAP.hold = 0;
  await wait(60);
  for (let i = 0; i < (frames || 90); i++){
    if (G) { G.hearts = Math.max(3, G.hearts); }
    CAP.text = ''; CAP.shown = 0; CAP.hold = 0;
    if (move) {                       // steer, so the scene has motion in it
      const a = i * 0.06;
      IN.down = true;
      IN.px = W * (0.5 + Math.cos(a) * 0.26);
      IN.py = H * (0.55 + Math.sin(a * 1.3) * 0.16);
    }
    await wait(16);
  }
  IN.down = false;
  if (G) G.modeT = Math.max(G.modeT, 2.6);   // clears the mode-intro title card
  G.worldBannerT = 0;
}

async function shoot(size, name){
  /* Re-lock immediately before capturing. Chrome fires a window resize when a
     scrollbar appears or disappears, and the game's own resize() handler then
     snaps the canvas back to innerWidth/innerHeight. Re-locking here makes the
     capture immune to that no matter what the page layout did. */
  lockSize(size.w, size.h, size.scale);
  // the running commentary is charming in play and clutter in a store shot,
  // and it was drawing straight over the MENU/pause buttons
  CAP.text = ''; CAP.shown = 0; CAP.hold = 0;
  if (G) { G.worldBannerT = 0; }
  if (typeof modeBannerT !== 'undefined') modeBannerT = 0;
  await wait(260);                       // let a few clean frames land
  const url = cv.toDataURL('image/png');
  if (cv.width !== size.w || cv.height !== size.h)
    console.warn('SIZE DRIFT on ' + name + ': ' + cv.width + 'x' + cv.height);
  await fetch('/api/shot', { method:'POST',
    body: JSON.stringify({ folder: size.folder, name, dataUrl: url,
                           w: cv.width, h: cv.height }) });
  const el = document.getElementById('rigstatus');
  if (el) el.textContent = size.folder + ' / ' + name;
}

const SCENES = [
  ['01-title.png',    async () => { state='title'; titleT=6; await wait(420); }],
  ['02-hop.png',      async () => { await poseMode('hop',    70, 8420); }],
  ['03-blast.png',    async () => { await poseMode('blast',  80, 15330); }],
  ['04-maze.png',     async () => { await poseMode('maze',   80, 21870, true); }],
  ['05-swing.png',    async () => { await poseMode('swing',  75, 26140, true); }],
  ['06-boss-echo.png',async () => { await poseMode('echo',   52, 33990, true); }],
  ['07-badges.png',   async () => { state='title'; await wait(80); openBadges(); SCROLL.y=0; await wait(300); }],
  ['08-skins.png',    async () => { openSkins(); SCROLL.y=0; await wait(300); }]
];

async function runAll(){
  let count = 0;
  seedProfile();
  for (const size of SIZES){
    lockSize(size.w, size.h, size.scale);
    await wait(260);
    for (const [name, pose] of SCENES){
      try { lockSize(size.w, size.h, size.scale); await pose(); await shoot(size, name); count++; }
      catch (e) { console.warn('scene failed', name, e); }
    }
  }
  await fetch('/api/shot/done', { method:'POST', body: JSON.stringify({ count }) });
  const el = document.getElementById('rigstatus');
  if (el) el.textContent = 'DONE — ' + count + ' screenshots written to store/screenshots/';
}

const bar = document.createElement('div');
bar.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:99;background:#0b0b16;' +
  'color:#4dd2ff;font:700 13px system-ui;padding:10px 14px;border-bottom:1px solid #22222e';
bar.innerHTML = '<span id="rigstatus">starting…</span>';
document.body.appendChild(bar);
document.body.style.background = '#05050c';
cv.style.margin = '46px auto 20px';
cv.style.display = 'block';
cv.style.border = '1px solid #22222e';

addEventListener('load', () => setTimeout(runAll, 400));
if (document.readyState === 'complete') setTimeout(runAll, 400);
})();
"""

s = io.open(SRC, encoding='utf-8').read()
# the rig must run after the game has defined everything
s = s.replace('\n</script>\n</body>', '\n' + RIG + '\n</script>\n</body>', 1)
# the game hides overflow; the rig needs to show a big canvas
s = s.replace('overflow:hidden', 'overflow:auto', 1)
io.open(OUT, 'w', encoding='utf-8').write(s)
print('shooter -> %s  (%d bytes)' % (OUT, len(s)))
