/* Regression test for the "player wedged and cannot move" bug class.
   PLINKO trapped the ball between two pegs; MAZE corridors were narrower than a
   GIANT BIT. Both looked like a frozen game. This drives every mode with the
   widest possible player and fails if the player stops responding to input.

   Usage: node stuck.js ../../TheWhateverGame-release.html                     */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const env = require('./env.js');

const FILE = process.argv[2] || path.join(__dirname, '..', '..', 'TheWhateverGame-release.html');
const CODE = fs.readFileSync(FILE, 'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const FAILS = [];

function boot(W, H) {
  const o = env.install(W, H);
  env.setTime(0);
  const ctx = vm.createContext(o.win);
  o.win.console = console;
  vm.runInContext(CODE, ctx, { filename: 'game.js' });
  return { ctx, listeners: o.listeners, canvas: o.canvas, win: o.win };
}
const g = (B, e) => vm.runInContext(e, B.ctx);
const set = (B, e) => vm.runInContext(e, B.ctx);
function frame(B) { env.setTime(env.time + 16.7); env.runTimers(); env.raf(env.time); }
function down(B, x, y) {
  B.canvas.dispatch('pointerdown', { preventDefault() {}, clientX: x, clientY: y, pointerId: 1, pointerType: 'touch' });
}
function move(B, x, y) { for (const f of (B.listeners['pointermove'] || [])) f({ pointerId: 1, clientX: x, clientY: y }); }
function up(B) { for (const f of (B.listeners['pointerup'] || [])) f({ pointerId: 1, preventDefault() {} }); }

const W = 412, H = 915;

console.log('stuck-check: ' + path.basename(FILE));

for (const giant of [false, true]) {
  const B = boot(W, H);
  for (let i = 0; i < 10; i++) frame(B);
  const keys = g(B, 'MODES.map(m=>m.key)');
  let bad = 0;

  for (const k of keys) {
    try {
      set(B, `SURV=null;VSM=null;DAILY=false;startGame(4242);`);
      set(B, `setMode(MODES.find(m=>m.key==='${k}'),true);`);
      if (giant) set(B, 'P.r=19;');            // GIANT BIT
      set(B, 'G.shield=true;');                // shielded, as reported
      for (let i = 0; i < 30; i++) frame(B);

      // drag hard left, then hard right, and require the player to have moved
      const startX = g(B, 'P.x'), startY = g(B, 'P.y');
      down(B, W * 0.5, H * 0.5);
      for (let i = 0; i < 60; i++) { move(B, W * 0.08, H * 0.35); set(B, 'if(G&&G.hearts<3)G.hearts=5;'); frame(B); }
      const leftX = g(B, 'P.x'), leftY = g(B, 'P.y');
      for (let i = 0; i < 60; i++) { move(B, W * 0.92, H * 0.75); set(B, 'if(G&&G.hearts<3)G.hearts=5;'); frame(B); }
      up(B);
      for (let i = 0; i < 30; i++) { set(B, 'if(G&&G.hearts<3)G.hearts=5;'); frame(B); }
      const endX = g(B, 'P.x'), endY = g(B, 'P.y');

      const moved = Math.hypot(endX - startX, endY - startY) +
                    Math.hypot(leftX - startX, leftY - startY) +
                    Math.hypot(endX - leftX, endY - leftY);
      if (!isFinite(moved)) { FAILS.push(k + (giant ? ' [giant]' : '') + ': NaN position'); bad++; continue; }

      // modes where the player is deliberately fixed in place are exempt
      // modes where the player is pinned by design: STACK follows the tower top,
      // DEFEND sits in its corner, PARRY is locked to the arena centre.
      const anchored = ['pet','beat','whack','sumo','plinko','sort','copy','flux','fish',
                        'stack','defend','parry'];
      if (moved < 6 && anchored.indexOf(k) < 0) {
        FAILS.push(k + (giant ? ' [giant]' : '') + ': player never moved (' + moved.toFixed(1) + 'px)');
        bad++;
      }

      // a wedged ball also shows up as "stopped descending forever"
      if (k === 'plinko') {
        // drop 8 balls and require each to reach the buckets. Only measure while
        // the ball is actually falling — a racked ball is pinned at the top by design.
        let drops = 0, wedged = false;
        for (let d = 0; d < 8 && !wedged; d++) {
          set(B, 'P.x=W*' + (0.15 + d * 0.09).toFixed(2) + ';');
          set(B, 'ModePlinko.release();');
          let lastY = g(B, 'P.y'), frozen = 0;
          for (let i = 0; i < 900; i++) {
            // hold the mode open: after ~16s the game morphs to the next genre and
            // PLINKO stops updating, which is not the ball being stuck.
            set(B, 'if(G&&G.hearts<3)G.hearts=5; G.modeT=0;');
            frame(B);
            // a skull bucket can end the run: that still means the ball ARRIVED,
            // which is what this test is measuring. Re-arm and carry on.
            if (g(B, "state") !== 'play') {
              drops++;
              set(B, "startGame(4242);setMode(ModePlinko,true);" + (giant ? 'P.r=19;' : ''));
              for (let w = 0; w < 5; w++) frame(B);
              break;
            }
            if (g(B, 'ModePlinko.heldB')) { drops++; break; }   // reached a bucket
            const y = g(B, 'P.y');
            if (Math.abs(y - lastY) < 0.35) frozen++; else frozen = 0;
            lastY = y;
            if (frozen > 100) {
              FAILS.push('plinko' + (giant ? ' [giant]' : '') + ': ball wedged 1.7s at y=' + y.toFixed(0));
              bad++; wedged = true; break;
            }
          }
        }
        if (!wedged && drops < 8) {
          FAILS.push('plinko' + (giant ? ' [giant]' : '') + ': only ' + drops + '/8 balls reached a bucket');
          bad++;
        }
      }
    } catch (e) {
      FAILS.push(k + (giant ? ' [giant]' : '') + ': threw ' + e.message);
      bad++;
    }
  }
  console.log('  ' + (bad ? '✗ ' + bad + ' issue(s)' : '✓ all ' + keys.length + ' modes respond') +
              (giant ? '  [GIANT BIT + shield]' : '  [normal size]'));
}

console.log(FAILS.length ? '\n================ FAIL ================' : '\n============ NO STUCK MODES ============');
for (const f of FAILS) console.log('  ✗ ' + f);
process.exit(FAILS.length ? 1 : 0);
