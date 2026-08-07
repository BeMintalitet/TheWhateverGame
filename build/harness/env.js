/* Headless DOM/canvas/audio stub so the game can be driven in plain Node.
   Every 2D-context method is recorded as a no-op, but arguments are checked
   for NaN — that is how we catch broken geometry without a real renderer. */
'use strict';
const NANS = [];
function chk(name, args) {
  for (let i = 0; i < args.length; i++) {
    const v = args[i];
    if (typeof v === 'number' && !isFinite(v)) {
      NANS.push(name + ' arg' + i + '=' + v);
      if (NANS.length > 400) throw new Error('too many NaN draw calls');
    }
  }
}
const CTX_METHODS = ['save','restore','translate','rotate','scale','beginPath','closePath','moveTo',
  'lineTo','bezierCurveTo','quadraticCurveTo','arc','arcTo','ellipse','rect','fill','stroke','clip',
  'fillRect','strokeRect','clearRect','fillText','strokeText','drawImage','setLineDash','setTransform',
  'resetTransform','transform','putImageData'];
function makeGradient() {
  return { addColorStop() {} };
}
function makeCtx(canvas) {
  const c = { canvas };
  for (const m of CTX_METHODS) c[m] = function () { chk(m, arguments); };
  c.measureText = t => ({ width: String(t == null ? '' : t).length * 6 });
  c.createLinearGradient = function () { chk('createLinearGradient', arguments); return makeGradient(); };
  c.createRadialGradient = function () { chk('createRadialGradient', arguments); return makeGradient(); };
  c.createPattern = () => ({});
  c.getImageData = (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, (w | 0) * (h | 0) * 4)), width: w | 0, height: h | 0 });
  c.createImageData = (w, h) => ({ data: new Uint8ClampedArray(Math.max(1, (w | 0) * (h | 0) * 4)), width: w | 0, height: h | 0 });
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#000'; c.strokeStyle = '#000'; c.lineWidth = 1;
  c.font = '10px sans-serif'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.lineCap = 'butt'; c.lineJoin = 'miter'; c.shadowBlur = 0; c.shadowColor = '#000';
  c.imageSmoothingEnabled = true; c.filter = 'none';
  return c;
}
function makeCanvas(w, h) {
  const el = {
    tagName: 'CANVAS', width: w || 300, height: h || 150,
    style: {}, _listeners: {},
    getContext() { if (!el._ctx) el._ctx = makeCtx(el); return el._ctx; },
    addEventListener(t, f) { (el._listeners[t] = el._listeners[t] || []).push(f); },
    removeEventListener() {},
    dispatch(t, e) { for (const f of (el._listeners[t] || [])) f(e); },
    getBoundingClientRect() { return { x:0, y:0, left:0, top:0, right:el.width, bottom:el.height, width: el.width, height: el.height }; },
    setPointerCapture() {}, releasePointerCapture() {},
    toDataURL() { return 'data:,'; },
    appendChild() {}, removeChild() {}
  };
  return el;
}
function install(W, H) {
  const listeners = {};
  const store = {};
  const canvas = makeCanvas(W, H);
  const doc = {
    _byId: { c: canvas, game: canvas },
    documentElement: { style: {}, clientWidth: W, clientHeight: H },
    body: { style: {}, appendChild() {}, removeChild() {}, addEventListener() {} },
    hidden: false,
    getElementById(id) { return doc._byId[id] || null; },
    querySelector() { return null; },
    createElement(tag) {
      if (String(tag).toLowerCase() === 'canvas') return makeCanvas(1, 1);
      return { style: {}, tagName: String(tag).toUpperCase(), appendChild() {}, removeChild() {},
        addEventListener() {}, getBoundingClientRect() { return { width: 0, height: 0, top:0, left:0, bottom:0, right:0 }; },
        setAttribute() {}, remove() {} };
    },
    addEventListener(t, f) { (listeners[t] = listeners[t] || []).push(f); },
    removeEventListener() {}
  };
  const audioNode = () => ({
    connect() { return audioNode(); }, disconnect() {},
    gain: { value: 0.5, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {} },
    frequency: { value: 440, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {} },
    detune: { value: 0, setValueAtTime() {} },
    Q: { value: 1, setValueAtTime() {} },
    type: 'sine', buffer: null, loop: false,
    start() {}, stop() {}, setPeriodicWave() {}
  });
  function AudioCtx() {
    this.state = 'running'; this.currentTime = 0; this.sampleRate = 44100;
    this.destination = audioNode();
    this.createGain = audioNode; this.createOscillator = audioNode;
    this.createBiquadFilter = audioNode; this.createBufferSource = audioNode;
    this.createWaveShaper = audioNode; this.createDelay = audioNode;
    this.createDynamicsCompressor = audioNode; this.createStereoPanner = audioNode;
    this.createConvolver = audioNode;
    this.createBuffer = (ch, len) => ({ getChannelData: () => new Float32Array(len), length: len, numberOfChannels: ch });
    this.createPeriodicWave = () => ({});
    this.resume = () => { this.state = 'running'; return Promise.resolve(); };
    this.suspend = () => { this.state = 'suspended'; return Promise.resolve(); };
    this.close = () => Promise.resolve();
  }
  const win = {
    innerWidth: W, innerHeight: H, devicePixelRatio: 2,
    document: doc, localStorage: {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; },
      clear: () => { for (const k in store) delete store[k]; }
    },
    navigator: { userAgent: 'node-harness', share: undefined, clipboard: undefined, maxTouchPoints: 5 },
    performance: { now: () => TIME },
    matchMedia: () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {} }),
    AudioContext: AudioCtx, webkitAudioContext: AudioCtx,
    addEventListener(t, f) { (listeners[t] = listeners[t] || []).push(f); },
    removeEventListener() {},
    requestAnimationFrame(cb) { RAF = cb; return 1; },
    cancelAnimationFrame() {},
    setTimeout(f, ms) { TIMERS.push({ f, at: TIME + (ms || 0) }); return TIMERS.length; },
    clearTimeout() {},
    setInterval(f, ms) { INTERVALS.push({ f, ms: Math.max(16, ms || 1000), next: TIME + (ms || 1000) }); return INTERVALS.length; },
    clearInterval() {},
    Capacitor: undefined, __TWG_DEBUG: false
  };
  win.window = win; win.self = win; win.globalThis = win;
  return { win, doc, canvas, listeners, store, NANS };
}
let TIME = 0, RAF = null;
const TIMERS = [], INTERVALS = [];
module.exports = {
  install, makeCanvas, NANS,
  get time() { return TIME; },
  setTime(t) { TIME = t; },
  get raf() { return RAF; },
  runTimers() {
    for (let i = TIMERS.length - 1; i >= 0; i--) {
      if (TIMERS[i].at <= TIME) { const t = TIMERS.splice(i, 1)[0]; try { t.f(); } catch (e) { throw e; } }
    }
    for (const iv of INTERVALS) { if (iv.next <= TIME) { iv.next = TIME + iv.ms; try { iv.f(); } catch (e) { throw e; } } }
  },
  timerCount() { return TIMERS.length; }
};
