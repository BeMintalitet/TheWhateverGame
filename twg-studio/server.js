#!/usr/bin/env node
/* =====================================================================
   TWG STUDIO — one console for shipping THE WHATEVER GAME.

   Zero npm dependencies on purpose: it must still start in two years
   when node_modules has rotted. Run it with:

       node twg-studio\server.js

   ...or just double-click twg-studio\START.bat
   ===================================================================== */
'use strict';
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const STUDIO = __dirname;
const CFG_PATH = path.join(STUDIO, 'config.json');
const PORT = 4747;

/* ------------------------------------------------------------------ */
/* paths                                                               */
/* ------------------------------------------------------------------ */
const P = {
  dev:      path.join(ROOT, 'TheWhateverGame.html'),
  release:  path.join(ROOT, 'TheWhateverGame-release.html'),
  www:      path.join(ROOT, 'android-app', 'www', 'index.html'),
  manifest: path.join(ROOT, 'android-app', 'android', 'app', 'src', 'main', 'AndroidManifest.xml'),
  gradle:   path.join(ROOT, 'android-app', 'android', 'app', 'build.gradle'),
  vars:     path.join(ROOT, 'android-app', 'android', 'variables.gradle'),
  appDir:   path.join(ROOT, 'android-app'),
  androidDir: path.join(ROOT, 'android-app', 'android'),
  keystore: path.join(ROOT, 'android-app', 'android', 'upload-keystore.jks'),
  ksProps:  path.join(ROOT, 'android-app', 'android', 'keystore.properties'),
  harness:  path.join(ROOT, 'build', 'harness', 'run.js'),
  aab:      path.join(ROOT, 'android-app', 'android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab'),
  apk:      path.join(ROOT, 'android-app', 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
  sdk:      path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk'),
  jbr:      'C:\\Program Files\\Android\\Android Studio\\jbr'
};

/* ------------------------------------------------------------------ */
/* PROJECTS — a project file describes one app: its paths, its Play        */
/* Console answers, its AdMob ids. Drop a new .json in projects/ and TWG    */
/* Studio can drive that app too, with no code changes.                    */
/* ------------------------------------------------------------------ */
const PROJ_DIR = path.join(STUDIO, 'projects');
function listProjects() {
  try {
    return fs.readdirSync(PROJ_DIR).filter(f => f.endsWith('.json')).map(f => {
      const j = JSON.parse(fs.readFileSync(path.join(PROJ_DIR, f), 'utf8'));
      j._file = f;
      return j;
    });
  } catch (e) { return []; }
}
function activeProject() {
  const all = listProjects();
  if (!all.length) return null;
  return all.find(p => p.id === (cfg.activeProject || '')) || all[0];
}

const cfg = loadCfg();
function loadCfg() {
  try { return JSON.parse(fs.readFileSync(CFG_PATH, 'utf8')); }
  catch (e) { return { checklist: {}, oauth: {}, admob: {} }; }
}
function saveCfg() { fs.writeFileSync(CFG_PATH, JSON.stringify(cfg, null, 2)); }

/* ------------------------------------------------------------------ */
/* log bus — every action streams to the browser via SSE               */
/* ------------------------------------------------------------------ */
const clients = new Set();
let busy = false;
function emit(type, data) {
  const msg = 'data: ' + JSON.stringify({ type, data }) + '\n\n';
  for (const c of clients) { try { c.write(msg); } catch (e) {} }
}
const log  = s => { process.stdout.write(s + '\n'); emit('log', s); };
const ok   = s => emit('ok', s);
const err  = s => emit('err', s);
const step = s => emit('step', s);

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
function run(cmd, args, opts) {
  return new Promise(resolve => {
    // One command string, no args array: Node warns (DEP0190) about unescaped
    // args when shell:true is combined with an args array, and we need the
    // shell for gradlew.bat / npx on Windows. Call sites already quote paths.
    const line = [cmd].concat(args || []).join(' ');
    log('> ' + line);
    const env = Object.assign({}, process.env, { JAVA_HOME: P.jbr }, (opts && opts.env) || {});
    const ch = spawn(line, { cwd: (opts && opts.cwd) || ROOT, env, shell: true });
    let out = '';
    const onData = b => { const s = b.toString(); out += s; s.split(/\r?\n/).forEach(l => l.trim() && log('  ' + l)); };
    ch.stdout.on('data', onData);
    ch.stderr.on('data', onData);
    ch.on('close', code => resolve({ code, out }));
    ch.on('error', e => { log('  ' + e.message); resolve({ code: -1, out: e.message }); });
  });
}
const exists = p => { try { fs.accessSync(p); return true; } catch (e) { return false; } };
const readf  = p => fs.readFileSync(p, 'utf8');
const writef = (p, s) => fs.writeFileSync(p, s, 'utf8');
const mb = p => { try { return (fs.statSync(p).size / 1048576).toFixed(2) + ' MB'; } catch (e) { return '—'; } };
const mtime = p => { try { return fs.statSync(p).mtime.toISOString().replace('T', ' ').slice(0, 16); } catch (e) { return '—'; } };

/* ------------------------------------------------------------------ */
/* 1. DOCTOR                                                           */
/* ------------------------------------------------------------------ */
async function doctor() {
  const rows = [];
  const add = (name, okv, detail) => rows.push({ name, ok: !!okv, detail: detail || '' });

  const node = await run('node', ['-v']);
  add('Node.js', node.code === 0, node.out.trim());

  add('Android Studio JBR (Java)', exists(path.join(P.jbr, 'bin', 'java.exe')), P.jbr);
  add('Android SDK', exists(P.sdk), P.sdk);

  let plats = [];
  try { plats = fs.readdirSync(path.join(P.sdk, 'platforms')); } catch (e) {}
  add('Platform android-36', plats.some(p => p.startsWith('android-36')), plats.join(', ') || 'none found');

  let bts = [];
  try { bts = fs.readdirSync(path.join(P.sdk, 'build-tools')); } catch (e) {}
  add('Build tools', bts.length > 0, bts.join(', ') || 'none found');

  add('Upload keystore', exists(P.keystore), exists(P.keystore) ? 'present — BACK IT UP' : 'MISSING: the release build cannot be signed');
  add('keystore.properties', exists(P.ksProps), exists(P.ksProps) ? 'present — BACK IT UP' : 'MISSING');
  add('Release HTML', exists(P.release), mtime(P.release));
  add('Regression harness', exists(P.harness), P.harness);
  add('Built AAB', exists(P.aab), exists(P.aab) ? (mb(P.aab) + ' · ' + mtime(P.aab)) : 'not built yet');

  // target sdk
  try {
    const v = readf(P.vars);
    const t = (v.match(/targetSdkVersion\s*=\s*(\d+)/) || [])[1];
    add('targetSdkVersion', Number(t) >= 36, t + (Number(t) >= 36 ? ' (meets the 31 Aug 2026 rule)' : ' — Play requires 36 for new apps'));
  } catch (e) { add('targetSdkVersion', false, 'could not read variables.gradle'); }

  const ids = currentIds();
  const isTest = JSON.stringify(ids).includes('3940256099942544');
  add('AdMob IDs', !isTest && ids.appId, isTest ? 'STILL USING GOOGLE TEST IDS — the app would earn nothing' : 'live ids configured');

  return rows;
}

/* ------------------------------------------------------------------ */
/* 2. ADMOB IDS                                                        */
/* ------------------------------------------------------------------ */
function currentIds() {
  const out = { appId: '', banner: '', interstitial: '', rewarded: '' };
  try {
    const m = readf(P.manifest);
    out.appId = (m.match(/ca-app-pub-\d+~\d+/) || [''])[0];
  } catch (e) {}
  try {
    const h = readf(P.release);
    const grab = k => (h.match(new RegExp(k + ":\\s*'(ca-app-pub-[\\d\\/]+)'")) || ['', ''])[1];
    out.banner = grab('banner');
    out.interstitial = grab('interstitial');
    out.rewarded = grab('rewarded');
  } catch (e) {}
  return out;
}
const RE_APP  = /^ca-app-pub-\d{16}~\d{10}$/;
const RE_UNIT = /^ca-app-pub-\d{16}\/\d{10}$/;

function setIds(ids) {
  const bad = [];
  if (!RE_APP.test(ids.appId)) bad.push('App ID must look like ca-app-pub-0000000000000000~0000000000 (note the ~)');
  for (const k of ['banner', 'interstitial', 'rewarded'])
    if (!RE_UNIT.test(ids[k])) bad.push(k + ' unit must look like ca-app-pub-0000000000000000/0000000000 (note the /)');
  const pubs = new Set([ids.appId.split('~')[0], ids.banner.split('/')[0], ids.interstitial.split('/')[0], ids.rewarded.split('/')[0]]);
  if (pubs.size > 1) bad.push('the app id and the ad units belong to different publisher accounts');
  if (new Set([ids.banner, ids.interstitial, ids.rewarded]).size < 3) bad.push('two ad units are the same id — check you did not paste one twice');
  if (bad.length) return { ok: false, errors: bad };

  let touched = 0;
  for (const f of [P.dev, P.release, P.www]) {
    if (!exists(f)) continue;
    let s = readf(f);
    s = s.replace(/banner:(\s*)'ca-app-pub-[\d\/]+'/,       "banner:$1'" + ids.banner + "'");
    s = s.replace(/interstitial:(\s*)'ca-app-pub-[\d\/]+'/, "interstitial:$1'" + ids.interstitial + "'");
    s = s.replace(/rewarded:(\s*)'ca-app-pub-[\d\/]+'/,     "rewarded:$1'" + ids.rewarded + "'");
    writef(f, s); touched++;
  }
  if (exists(P.manifest)) {
    let s = readf(P.manifest);
    s = s.replace(/ca-app-pub-\d+~\d+/, ids.appId);
    writef(P.manifest, s); touched++;
  }
  return { ok: true, touched, ids: currentIds() };
}

/* ------------------------------------------------------------------ */
/* 3. ADMOB API — fetch the ids straight out of the account            */
/* ------------------------------------------------------------------ */
function httpsJson(opts, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        let j = null;
        try { j = JSON.parse(d); } catch (e) {}
        if (res.statusCode >= 400) reject(new Error('HTTP ' + res.statusCode + ': ' + (j && j.error ? j.error.message : d.slice(0, 300))));
        else resolve(j);
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}
async function oauthExchange(params) {
  const body = new URLSearchParams(params).toString();
  return httpsJson({
    hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }
  }, body);
}
async function admobGet(token, urlPath) {
  return httpsJson({
    hostname: 'admob.googleapis.com', path: urlPath, method: 'GET',
    headers: { Authorization: 'Bearer ' + token }
  });
}
async function accessToken() {
  const o = cfg.oauth || {};
  if (!o.clientId || !o.clientSecret) throw new Error('No OAuth client configured — see the "Connect AdMob" panel.');
  if (o.accessToken && o.expiry && Date.now() < o.expiry - 60000) return o.accessToken;
  if (!o.refreshToken) throw new Error('Not connected yet — click "Connect to AdMob".');
  const t = await oauthExchange({
    client_id: o.clientId, client_secret: o.clientSecret,
    refresh_token: o.refreshToken, grant_type: 'refresh_token'
  });
  o.accessToken = t.access_token;
  o.expiry = Date.now() + (t.expires_in || 3600) * 1000;
  saveCfg();
  return o.accessToken;
}
/* the loopback flow: we already run a local server, so we reuse it */
let pendingAuth = null;
function authUrl() {
  const o = cfg.oauth;
  const state = crypto.randomBytes(12).toString('hex');
  pendingAuth = { state };
  const q = new URLSearchParams({
    client_id: o.clientId,
    redirect_uri: 'http://localhost:' + PORT + '/oauth/callback',
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/admob.readonly',
    access_type: 'offline',
    prompt: 'consent',
    state
  });
  return 'https://accounts.google.com/o/oauth2/v2/auth?' + q.toString();
}
async function admobFetch() {
  const token = await accessToken();
  step('reading your AdMob account…');
  const accs = await admobGet(token, '/v1/accounts');
  const acc = (accs.account || [])[0];
  if (!acc) throw new Error('No AdMob account visible for this Google login.');
  log('  account: ' + acc.name + ' (' + (acc.publisherId || '?') + ')');
  const apps = await admobGet(token, '/v1/' + acc.name + '/apps?pageSize=200');
  const units = await admobGet(token, '/v1/' + acc.name + '/adUnits?pageSize=500');
  return {
    account: acc.name,
    publisherId: acc.publisherId,
    apps: (apps.app || []).map(a => ({
      name: a.name, appId: a.appId, platform: a.platform,
      displayName: (a.manualAppInfo && a.manualAppInfo.displayName) ||
                   (a.linkedAppInfo && a.linkedAppInfo.displayName) || '(unnamed)'
    })),
    units: (units.adUnit || []).map(u => ({
      name: u.name, adUnitId: u.adUnitId, appId: u.appId,
      displayName: u.displayName, format: u.adFormat,
      types: u.rewardSettings ? 'REWARDED' : ''
    }))
  };
}
/* map AdMob's formats onto our three slots */
function autoMap(data, appId) {
  const mine = data.units.filter(u => !appId || u.appId === appId);
  const pick = (...formats) => {
    for (const f of formats) { const u = mine.find(x => (x.format || '').toUpperCase() === f); if (u) return u.adUnitId; }
    return '';
  };
  return {
    appId: appId || '',
    banner:       pick('BANNER'),
    interstitial: pick('INTERSTITIAL'),
    rewarded:     pick('REWARDED', 'REWARDED_INTERSTITIAL')
  };
}

/* ------------------------------------------------------------------ */
/* 4. RELEASE STRIP (ported from make_release.py — no Python needed)   */
/* ------------------------------------------------------------------ */
const RELEASE_EDITS = [
  ['let GOD=false; // ∞ TEST MODE', 'const GOD=false; // ∞ TEST MODE removed for the store build', 1],
  ["  if(e.code==='KeyG'){GOD=!GOD;if(state==='play')say(GOD?'∞ TEST MODE on. immortality granted. (temporarily.)':'test mode off. mortality restored.',2.2);}\n", '', 1],
  ["  if(e.code==='KeyN'&&GOD&&state==='play'&&morphT<=0&&G)beginMorph();\n", '', 1],
  ["    if(TZ.god&&inZone(TZ.god)){GOD=!GOD;SFX.heart();return;}\n", '', 1],
  ['  if(GOD){TZ.god={x:bx,y:by-32,w:bw,h:32};by-=32+gap;}else TZ.god=null;', '  TZ.god=null;', 1],
  ["  if(TZ.god)drawBtn(TZ.god,'∞ TEST: '+(GOD?'ON':'off'),'#4dffa6');\n", '', 1],
  ["    // ∞ TEST MODE skip button\n    if(GOD&&!fromKey&&inZone(GZ.skip)&&morphT<=0){beginMorph();return;}\n", '', 1],
  ["    if(inZone(TZ.god)){GOD=!GOD;SFX.heart();return;}\n", '', 1],
  ["  drawBtn(TZ.god,'∞ TEST: '+(GOD?'ON':'off')+'  (G)',GOD?'#4dffa6':'rgba(255,255,255,0.35)');\n", '', 1],
  ['  TZ.god={x:bx,y:y0+(bh+gap)*4,w:bw/2-4,h:32};\n', '', 1]
];
function makeRelease() {
  let s = readf(P.dev);
  const n0 = s.length;
  for (const [oldS, newS] of RELEASE_EDITS) {
    if (!s.includes(oldS)) throw new Error('release strip: pattern not found → ' + oldS.slice(0, 70).replace(/\n/g, '\\n'));
    s = s.split(oldS).join(newS);
  }
  writef(P.release, s);
  const bad = [];
  if (/\blet GOD\b/.test(s)) bad.push('GOD still mutable');
  if (s.includes('GOD=!GOD')) bad.push('a GOD toggle survives');
  if (s.includes('∞ TEST:')) bad.push('test button label survives');
  if (bad.length) throw new Error('RELEASE NOT CLEAN: ' + bad.join('; '));
  log('  release build: ' + n0 + ' -> ' + s.length + ' bytes, verified clean');
  return s.length;
}

/* ------------------------------------------------------------------ */
/* 5. VERSION                                                          */
/* ------------------------------------------------------------------ */
function getVersion() {
  try {
    const g = readf(P.gradle);
    return {
      code: Number((g.match(/versionCode\s+(\d+)/) || [])[1] || 0),
      name: (g.match(/versionName\s+"([^"]+)"/) || [])[1] || '?'
    };
  } catch (e) { return { code: 0, name: '?' }; }
}
function setVersion(code, name) {
  let g = readf(P.gradle);
  g = g.replace(/versionCode\s+\d+/, 'versionCode ' + code);
  if (name) g = g.replace(/versionName\s+"[^"]+"/, 'versionName "' + name + '"');
  writef(P.gradle, g);
  return getVersion();
}

/* ------------------------------------------------------------------ */
/* 6. PIPELINE                                                         */
/* ------------------------------------------------------------------ */
async function verify(deep) {
  step('checking the shipped ids');
  const ids = currentIds();
  if (JSON.stringify(ids).includes('3940256099942544')) {
    err('Google TEST ad ids are still in the build — it would earn nothing.');
    return false;
  }
  ok('live ad ids: ' + ids.appId);

  step('running the regression harness on the release build');
  const r = await run('node', [JSON.stringify(P.harness), JSON.stringify(P.release), deep ? 'all' : 'boot'],
    { cwd: path.dirname(P.harness) });
  if (r.code !== 0) { err('harness FAILED — do not ship this build'); return false; }
  ok('harness green');
  return true;
}
async function build(opts) {
  if (busy) { err('already busy'); return; }
  busy = true;
  try {
    step('1/5  regenerating the release build (stripping ∞ TEST MODE)');
    makeRelease();
    ok('release build clean');

    step('2/5  copying into the Capacitor web dir');
    fs.copyFileSync(P.release, P.www);
    ok('www/index.html updated');

    step('3/5  capacitor sync');
    let r = await run('npx', ['cap', 'sync', 'android'], { cwd: P.appDir });
    if (r.code !== 0) { err('cap sync failed'); return; }
    ok('sync done');

    step('4/5  gradle bundleRelease + assembleRelease  (this takes a couple of minutes)');
    const gw = path.join(P.androidDir, 'gradlew.bat');
    r = await run(JSON.stringify(gw), ['bundleRelease', 'assembleRelease', '--no-daemon'], { cwd: P.androidDir });
    if (r.code !== 0 || /BUILD FAILED/.test(r.out)) { err('gradle build FAILED — read the log above'); return; }
    ok('gradle BUILD SUCCESSFUL');

    step('5/5  verifying');
    const good = await verify(!!(opts && opts.deep));
    if (!good) return;

    ok('AAB  ' + mb(P.aab) + '   ' + P.aab);
    ok('APK  ' + mb(P.apk) + '   ' + P.apk);
    emit('done', { aab: P.aab, apk: P.apk });
  } catch (e) {
    err(e.message);
  } finally { busy = false; }
}
async function installToPhone() {
  const adb = path.join(P.sdk, 'platform-tools', 'adb.exe');
  if (!exists(adb)) { err('adb not found at ' + adb); return; }
  step('looking for a connected phone');
  let r = await run(JSON.stringify(adb), ['devices']);
  const lines = r.out.split(/\r?\n/).filter(l => /\tdevice$/.test(l));
  if (!lines.length) {
    err('No phone detected. Enable Developer options → USB debugging, plug it in, and accept the prompt on the phone.');
    return;
  }
  ok('found ' + lines.length + ' device(s)');
  step('installing the release APK');
  r = await run(JSON.stringify(adb), ['install', '-r', JSON.stringify(P.apk)]);
  if (/Success/.test(r.out)) ok('installed — open THE WHATEVER GAME on your phone');
  else err('install failed, see the log');
}

/* ------------------------------------------------------------------ */
/* 7. CHECKLIST                                                        */
/* ------------------------------------------------------------------ */
const CHECKLIST = [
  ['admob_app',    'AdMob', 'App created in AdMob and App ID pasted into TWG Studio'],
  ['admob_units',  'AdMob', 'Three ad units created (banner / interstitial / rewarded)'],
  ['admob_rating', 'AdMob', 'Ad content rating set to T (Blocking controls → Ad content rating). NOT G — that halves revenue for no benefit at 13+'],
  ['admob_gdpr',   'AdMob', 'GDPR privacy message created AND published'],
  ['admob_usst',   'AdMob', 'US states privacy message created AND published'],
  ['policy_host',  'Legal', 'privacy-policy.html hosted on a public URL that loads in incognito'],
  ['play_create',  'Play',  'App created in Play Console (name, Free, Game)'],
  ['play_access',  'Play',  'App access → all functionality available without special access'],
  ['play_ads',     'Play',  'Ads → Yes, contains ads'],
  ['play_rating',  'Play',  'Content rating questionnaire submitted (flashing imagery = Yes)'],
  ['play_audience','Play',  'Target audience = 13+ (do NOT tick under-13)'],
  ['play_safety',  'Play',  'Data safety filled in (Device IDs, Approx location, App interactions, Diagnostics)'],
  ['play_policy',  'Play',  'Privacy policy URL pasted'],
  ['play_listing', 'Play',  'Store listing text + icon + feature graphic uploaded'],
  ['play_shots',   'Play',  'Fresh screenshots taken (badges / skins / profile screens exist now)'],
  ['test_phone',   'Test',  'Release APK sideloaded and played through on a real phone'],
  ['test_closed',  'Test',  'Closed test released with 12+ testers'],
  ['test_14days',  'Test',  '14 consecutive days of closed testing completed'],
  ['prod_apply',   'Ship',  'Applied for production access'],
  ['prod_rollout', 'Ship',  'Production release created, staged rollout started at 20%']
];

/* ------------------------------------------------------------------ */
/* 8. HTTP                                                             */
/* ------------------------------------------------------------------ */
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost:' + PORT);
  const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
  const body = () => new Promise(r => { let d = ''; req.on('data', c => d += c); req.on('end', () => { try { r(JSON.parse(d || '{}')); } catch (e) { r({}); } }); });

  try {
    if (u.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(readf(path.join(STUDIO, 'index.html')));
    }
    if (u.pathname === '/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      res.write('\n'); clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    if (u.pathname === '/api/state') {
      return send(200, {
        ids: currentIds(), version: getVersion(),
        aab: { exists: exists(P.aab), size: mb(P.aab), time: mtime(P.aab) },
        apk: { exists: exists(P.apk), size: mb(P.apk), time: mtime(P.apk) },
        checklist: CHECKLIST.map(c => ({ key: c[0], group: c[1], text: c[2], done: !!cfg.checklist[c[0]] })),
        oauth: { configured: !!(cfg.oauth && cfg.oauth.clientId), connected: !!(cfg.oauth && cfg.oauth.refreshToken) },
        root: ROOT, busy
      });
    }
    if (u.pathname === '/api/projects') return send(200, { list: listProjects(), active: (activeProject() || {}).id || null });
    if (u.pathname === '/api/project/select') {
      const b = await body(); cfg.activeProject = b.id; saveCfg();
      return send(200, { ok: true, active: b.id });
    }
    if (u.pathname === '/api/project/save') {
      // Edit a project straight from the UI. Written back to its own .json so the
      // next session — and any other machine with the repo — sees the same answers.
      const b = await body();
      const all = listProjects();
      const proj = all.find(x => x.id === b.id);
      if (!proj) return send(200, { ok: false, error: 'unknown project' });
      const file = path.join(PROJ_DIR, proj._file);
      const disk = JSON.parse(fs.readFileSync(file, 'utf8'));
      for (const [sect, fields] of Object.entries(b.values || {})) {
        disk[sect] = Object.assign(disk[sect] || {}, fields);
      }
      fs.writeFileSync(file, JSON.stringify(disk, null, 2));
      ok('saved ' + proj._file);
      return send(200, { ok: true });
    }
    /* ---- screenshot rig ----------------------------------------------
       The game is a canvas app, so a cropped window screenshot would be the
       wrong pixel size and full of browser chrome. Instead we serve a page
       that renders the game at exact Play Store dimensions and posts each
       frame back here as a PNG. Served from this origin so there is no CORS. */
    if (u.pathname === '/shots/') {
      const f = path.join(STUDIO, 'shots', 'shooter.html');
      if (!exists(f)) { res.writeHead(404); return res.end('run the shot builder first'); }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(readf(f));
    }
    if (u.pathname === '/api/shot') {
      const b = await body();
      const dir = path.join(ROOT, 'store', 'screenshots', b.folder || 'phone');
      fs.mkdirSync(dir, { recursive: true });
      const png = Buffer.from(String(b.dataUrl).split(',')[1], 'base64');
      const file = path.join(dir, b.name);
      fs.writeFileSync(file, png);
      log('  shot ' + (b.folder || 'phone') + '/' + b.name + '  ' + (png.length / 1024).toFixed(0) + ' KB');
      return send(200, { ok: true, bytes: png.length });
    }
    if (u.pathname === '/api/shot/done') {
      const b = await body();
      ok('captured ' + b.count + ' screenshots into store/screenshots/');
      return send(200, { ok: true });
    }
    if (u.pathname === '/api/doctor')  return send(200, await doctor());
    if (u.pathname === '/api/setids')  return send(200, setIds(await body()));
    if (u.pathname === '/api/version') { const b = await body(); return send(200, setVersion(b.code, b.name)); }
    if (u.pathname === '/api/check')   { const b = await body(); cfg.checklist[b.key] = b.done; saveCfg(); return send(200, { ok: true }); }
    if (u.pathname === '/api/build')   { const b = await body(); build(b); return send(200, { started: true }); }
    if (u.pathname === '/api/verify')  { verify(true); return send(200, { started: true }); }
    if (u.pathname === '/api/install') { installToPhone(); return send(200, { started: true }); }
    if (u.pathname === '/api/oauth/save') {
      const b = await body();
      cfg.oauth = Object.assign(cfg.oauth || {}, { clientId: b.clientId.trim(), clientSecret: b.clientSecret.trim() });
      saveCfg(); return send(200, { ok: true, url: authUrl() });
    }
    if (u.pathname === '/oauth/callback') {
      const code = u.searchParams.get('code');
      const state = u.searchParams.get('state');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      if (!code || !pendingAuth || state !== pendingAuth.state) {
        res.end('<h2>Authorisation failed</h2><p>Close this tab and try again in TWG Studio.</p>');
        err('OAuth callback rejected (state mismatch or user declined)');
        return;
      }
      try {
        const t = await oauthExchange({
          code, client_id: cfg.oauth.clientId, client_secret: cfg.oauth.clientSecret,
          redirect_uri: 'http://localhost:' + PORT + '/oauth/callback', grant_type: 'authorization_code'
        });
        cfg.oauth.refreshToken = t.refresh_token || cfg.oauth.refreshToken;
        cfg.oauth.accessToken = t.access_token;
        cfg.oauth.expiry = Date.now() + (t.expires_in || 3600) * 1000;
        saveCfg();
        ok('connected to AdMob');
        res.end('<h2 style="font:600 18px system-ui">Connected.</h2><p style="font:400 14px system-ui">You can close this tab and go back to TWG Studio.</p>');
      } catch (e) {
        err('token exchange failed: ' + e.message);
        res.end('<h2>Token exchange failed</h2><pre>' + e.message + '</pre>');
      }
      return;
    }
    if (u.pathname === '/api/admob/fetch') {
      try { const d = await admobFetch(); return send(200, { ok: true, data: d }); }
      catch (e) { err(e.message); return send(200, { ok: false, error: e.message }); }
    }
    if (u.pathname === '/api/admob/apply') {
      const b = await body();
      try {
        const d = await admobFetch();
        const mapped = autoMap(d, b.appId);
        const r = setIds(mapped);
        if (r.ok) ok('applied ids from AdMob: ' + JSON.stringify(mapped));
        else err(r.errors.join(' · '));
        return send(200, r);
      } catch (e) { err(e.message); return send(200, { ok: false, errors: [e.message] }); }
    }
    if (u.pathname === '/api/open') {
      const b = await body();
      const target = { root: ROOT, store: path.join(ROOT, 'store'), out: path.dirname(P.aab) }[b.what] || ROOT;
      spawn('explorer', [target], { detached: true, shell: true });
      return send(200, { ok: true });
    }
    res.writeHead(404); res.end('not found');
  } catch (e) {
    send(500, { error: e.message });
  }
});
const URL_SELF = 'http://localhost:' + PORT;
function openBrowser() {
  spawn('cmd', ['/c', 'start', '""', URL_SELF], { detached: true, shell: false });
}

/* If the port is taken, work out WHY before shouting about it. Nine times out of
   ten it is a copy of TWG Studio the user forgot they left running, and the right
   answer is to quietly open the browser rather than dump a stack trace. */
server.on('error', e => {
  if (e.code !== 'EADDRINUSE') {
    console.error('\n  TWG Studio could not start: ' + e.message + '\n');
    process.exit(1);
  }
  http.get(URL_SELF + '/api/state', res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      let mine = false;
      try { mine = !!JSON.parse(d).version; } catch (x) {}
      if (mine) {
        console.log('\n  TWG Studio is already running - opening it.\n  ' + URL_SELF + '\n');
        openBrowser();
        setTimeout(() => process.exit(0), 800);
      } else {
        portBusy();
      }
    });
  }).on('error', portBusy);
});
function portBusy() {
  console.error(
    '\n  Port ' + PORT + ' is in use by something that is not TWG Studio.\n' +
    '\n  Find it with:    netstat -ano | findstr :' + PORT +
    '\n  Then stop it, or change PORT at the top of server.js.\n');
  process.exit(1);
}

server.listen(PORT, () => {
  console.log('\n  TWG STUDIO running at ' + URL_SELF + '\n  project: ' + ROOT + '\n');
  openBrowser();
});
