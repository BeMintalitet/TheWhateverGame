/* ==================================================================
   AD BRIDGE — AdMob via @capacitor-community/admob, with a graceful
   no-op fallback so the exact same file still runs in a browser.

   Policy rules baked in (Google Play / AdMob):
   • never during play — only on menus / after a run
   • interstitial is rate-limited (min 3 runs AND 90s apart)
   • rewarded is always opt-in and always pays out
   • the sim is PAUSED for the whole time any ad is on screen
   • UMP consent is requested before the first ad request
   ================================================================== */
const ADS={
  ready:false, native:false, banner:false, wantBanner:false,
  lastInter:0, runsSinceInter:0, consent:'unknown', removed:false,
  pendingReward:null, testMode:false
};
/* LIVE AdMob unit IDs for THE WHATEVER GAME.
   These are real and they earn money — which is exactly why you must never
   tap your own ads on an unregistered device. Add your phone to
   AD_TEST_DEVICES below before you test, or AdMob may flag the traffic as
   invalid and suspend the account. */
/* How to find your device id: install the app, open logcat and filter for
   "Use RequestConfiguration.Builder.setTestDeviceIds" — the SDK prints the
   exact hash to paste here on the first ad request. */
const AD_TEST_DEVICES=[
  // 'ABCDEF0123456789ABCDEF0123456789'
];
const AD_UNITS={
  banner:       'ca-app-pub-5434609640567182/1401674556',
  interstitial: 'ca-app-pub-5434609640567182/6462429546',
  rewarded:     'ca-app-pub-5434609640567182/3039289938'
};
/* ---- diagnostics: every ad failure is recorded, never swallowed ---- */
ADS.log=[];
function adLog(msg,isErr){
  const line=(isErr?'! ':'  ')+msg;
  ADS.log.push(line); if(ADS.log.length>24)ADS.log.shift();
  try{console[isErr?'warn':'log']('[ads] '+msg);}catch(e){}
}
/* The Capacitor runtime is injected natively, but `Capacitor.Plugins.AdMob`
   only exists if something called registerPlugin('AdMob') — which normally
   happens inside the plugin's own JS module. This game is a single HTML file
   with no bundler, so nothing ever imported it and every ad call silently
   no-opped. Register it ourselves. */
function adPlugin(){
  if(ADS._plugin!==undefined)return ADS._plugin;
  const C=window.Capacitor;
  let p=null;
  if(!C){adLog('no Capacitor runtime (browser build)');ADS._plugin=null;return null;}
  const native=!!(C.isNativePlatform&&C.isNativePlatform());
  if(!native){adLog('Capacitor present but not a native platform');ADS._plugin=null;return null;}
  try{
    if(C.Plugins&&C.Plugins.AdMob){p=C.Plugins.AdMob;adLog('plugin via Capacitor.Plugins');}
    else if(typeof C.registerPlugin==='function'){p=C.registerPlugin('AdMob');adLog('plugin via registerPlugin');}
    else if(window.AdMob){p=window.AdMob;adLog('plugin via window.AdMob');}
  }catch(e){adLog('registerPlugin threw: '+e.message,true);p=null;}
  if(!p)adLog('AdMob plugin could not be resolved',true);
  ADS._plugin=p;
  return p;
}
async function adsInit(){
  const AdMob=adPlugin();
  if(!AdMob){ADS.ready=true;ADS.native=false;adLog('ads disabled: no plugin');return;}
  ADS.native=true;
  adLog('units b='+AD_UNITS.banner.slice(-10)+' i='+AD_UNITS.interstitial.slice(-10)+' r='+AD_UNITS.rewarded.slice(-10));
  try{
    await AdMob.initialize({initializeForTesting:ADS.testMode||AD_TEST_DEVICES.length>0,testingDevices:AD_TEST_DEVICES,tagForChildDirectedTreatment:false});
    // UMP / GDPR consent — required in the EEA & UK before any personalised request
    try{
      const info=await AdMob.requestConsentInfo({debugGeography:0});
      if(info&&info.isConsentFormAvailable&&info.status==='REQUIRED'){
        await AdMob.showConsentForm();
      }
      ADS.consent=(info&&info.status)||'unknown';
    }catch(e){ADS.consent='error';adLog('consent flow failed: '+(e&&e.message||e),true);}
    ADS.ready=true;adLog('initialized, consent='+ADS.consent);
    // pause the game for the full lifetime of any fullscreen ad
    const on=(ev,fn)=>{try{AdMob.addListener(ev,fn);}catch(e){}};
    on('interstitialAdOpened',()=>setPaused(true,'ad'));
    on('interstitialAdClosed',()=>{setPaused(false,'ad');adPreloadInter();});
    on('rewardedVideoAdOpened',()=>setPaused(true,'ad'));
    on('rewardedVideoAdClosed',()=>{setPaused(false,'ad');adFinishReward(false);adPreloadReward();});
    on('onRewardedVideoAdReward',()=>{ADS.rewardEarned=true;});
    on('rewardedVideoAdReward',()=>{ADS.rewardEarned=true;});
    adPreloadInter();adPreloadReward();
  }catch(e){adLog('initialize failed: '+(e&&e.message||e),true);ADS.ready=true;ADS.native=false;}
}
async function adPreloadInter(){
  const AdMob=adPlugin();if(!AdMob||ADS.removed)return;
  try{await AdMob.prepareInterstitial({adId:AD_UNITS.interstitial,isTesting:ADS.testMode});adLog('interstitial preloaded');}
  catch(e){adLog('interstitial preload: '+(e&&e.message||e),true);}
}
async function adPreloadReward(){
  const AdMob=adPlugin();if(!AdMob)return;
  try{await AdMob.prepareRewardVideoAd({adId:AD_UNITS.rewarded,isTesting:ADS.testMode});adLog('rewarded preloaded');}
  catch(e){adLog('rewarded preload: '+(e&&e.message||e),true);}
}
/* ---- banner: menus only, never over gameplay ---- */
async function adShowBanner(){
  const AdMob=adPlugin();
  ADS.wantBanner=true;
  if(!AdMob||ADS.banner||ADS.removed)return;
  try{
    await AdMob.showBanner({adId:AD_UNITS.banner,adSize:'ADAPTIVE_BANNER',
      position:'BOTTOM_CENTER',margin:0,isTesting:ADS.testMode});
    ADS.banner=true;adLog('banner shown');
  }catch(e){adLog('banner failed: '+(e&&e.message||e),true);}
}
async function adHideBanner(){
  const AdMob=adPlugin();
  ADS.wantBanner=false;
  if(!AdMob||!ADS.banner)return;
  try{await AdMob.hideBanner();ADS.banner=false;}catch(e){adLog('hideBanner: '+(e&&e.message||e),true);}
}
/* ---- interstitial: after a run, rate-limited ---- */
function adInterAllowed(){
  if(ADS.removed||!ADS.native)return false;
  const now=Date.now();
  return ADS.runsSinceInter>=3 && (now-ADS.lastInter)>90000;
}
async function adMaybeInterstitial(){
  ADS.runsSinceInter++;
  if(!adInterAllowed())return false;
  const AdMob=adPlugin();if(!AdMob)return false;
  try{
    ADS.lastInter=Date.now();ADS.runsSinceInter=0;
    await AdMob.showInterstitial();
    bump(ST,'adsWatched');saveStats();
    return true;
  }catch(e){adLog('interstitial show failed: '+(e&&e.message||e),true);adPreloadInter();return false;}
}
/* ---- rewarded: opt-in, always pays ---- */
function adFinishReward(force){
  const cb=ADS.pendingReward;
  if(!cb)return;
  ADS.pendingReward=null;
  const earned=!!ADS.rewardEarned||!!force;
  ADS.rewardEarned=false;
  try{cb(earned);}catch(e){}
}
async function adShowRewarded(cb){
  const AdMob=adPlugin();
  ADS.rewardEarned=false;
  if(!AdMob||!ADS.native){
    // no ad network available (browser / desktop build): grant it anyway
    // rather than dangling a button the player can never use
    cb(true);return;
  }
  ADS.pendingReward=cb;
  try{
    await AdMob.showRewardVideoAd();
    bump(ST,'adsWatched');saveStats();
  }catch(e){
    adLog('rewarded show failed: '+(e&&e.message||e),true);
    adPreloadReward();
    adFinishReward(true);
  }
}

/* ==================================================================
   PAUSE — required for ads, and a Play-review expectation anyway
   ================================================================== */
let PAUSED=false, pauseReason='';
function setPaused(on,reason){
  if(on===PAUSED&&reason===pauseReason)return;
  PAUSED=!!on;pauseReason=on?(reason||'user'):'';
  if(on){
    // a finger held down through the pause must not keep steering (audit 2-P1)
    IN.down=false;IN.pointerActive=false;IN.keys={};IN.pid=null;
    try{if(AC&&AC.state==='running')AC.suspend();}catch(e){}
    flushStats(true);
  } else {
    try{if(AC&&AC.state==='suspended')AC.resume();}catch(e){}
    last=performance.now(); // no dt spike on resume
  }
}
function togglePause(){
  if(state!=='play')return;
  if(PAUSED&&pauseReason!=='user')return; // never let a tap dismiss an ad pause
  setPaused(!PAUSED,'user');
  SFX.whiff();
}
function drawPauseOverlay(){
  const u=UIS();
  ctx.fillStyle='rgba(4,4,10,0.82)';ctx.fillRect(0,0,W,H);
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font=`900 italic ${Math.min(W*0.13,70)}px -apple-system,'Segoe UI',system-ui,sans-serif`;
  ctx.fillStyle='#fff';ctx.fillText('PAUSED',W/2,H*0.34);
  if(pauseReason==='ad'){
    ctx.font=`600 ${14*u}px -apple-system,system-ui,sans-serif`;
    ctx.fillStyle='rgba(255,255,255,0.6)';
    ctx.fillText('ad break — your run is safe',W/2,H*0.34+52);
    return;
  }
  ctx.font=`600 ${14*u}px -apple-system,system-ui,sans-serif`;
  ctx.fillStyle='rgba(255,255,255,0.6)';
  ctx.fillText('the genres will wait. they have nowhere to be.',W/2,H*0.34+52);
  const bw=Math.min(W*0.7,290),bx=W/2-bw/2;
  PZ.resume={x:bx,y:H*0.52,w:bw,h:52};
  PZ.mute  ={x:bx,y:H*0.52+62,w:bw/2-5,h:46};
  PZ.quit  ={x:bx+bw/2+5,y:H*0.52+62,w:bw/2-5,h:46};
  drawBtn(PZ.resume,'▶  RESUME','#4dffa6');
  drawBtn(PZ.mute,(musicG&&musicG.gain.value<=0)?'🔇 SOUND OFF':'🔊 SOUND ON','#4dd2ff');
  drawBtn(PZ.quit,'✕  QUIT RUN','#ff4d6d');
}
