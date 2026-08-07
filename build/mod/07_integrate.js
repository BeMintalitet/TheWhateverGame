/* ==================================================================
   INTEGRATION — run tracking, new title screen, ad hooks, wrappers.
   Everything here wraps existing functions rather than editing them,
   so the original game logic stays exactly as audited.
   ================================================================== */

/* ---------- bottom safe-area inset (audit 2-P2: only top was handled) ---------- */
let SAFE_BOT_PX=0;
(function(){
  const p=document.createElement('div');
  p.style.cssText='position:fixed;left:0;bottom:0;width:0;height:env(safe-area-inset-bottom,0px);pointer-events:none;visibility:hidden';
  document.body.appendChild(p);
  const meas=()=>{SAFE_BOT_PX=p.getBoundingClientRect().height||0;};
  meas();addEventListener('resize',meas);addEventListener('orientationchange',meas);
})();
let BANNER_H=0; // reserved for the menu banner ad
function SAFE_BOT(){return SAFE_BOT_PX+BANNER_H;}

/* ---------- seeded first cycle ----------
   The tutorial order (MODES[0..5], world 0, no mutator) is right for a
   brand-new player and wrong for everyone else: it made every Daily
   Challenge open identically regardless of the day's seed. Anyone past
   their third run — and every seeded run — now gets a rolled first cycle.
------------------------------------------- */
function rollFirstCycle(){
  if(!G)return;
  const veteran=(typeof ST==='object'&&ST&&ST.runs>=3);
  if(!(DAILY||(VSM&&VSM.stage>0)||veteran))return;
  const pool=[];
  for(let i=0;i<MODES.length;i++){
    const k=MODES[i].key;
    if(k==='pet'||k==='flux')continue;   // both are special-cased by nextMode
    pool.push(i);
  }
  for(let i=pool.length-1;i>0;i--){const j=randi(0,i);const t=pool[i];pool[i]=pool[j];pool[j]=t;}
  G.order=pool.slice(0,6);
  G.worldIdx=randi(0,WORLDS.length-1);
}

/* ---------- run summary ---------- */
let RUN=null;
function newRun(){
  return {score:0,coins:0,kills:0,morphs:0,bestCombo:0,cycle:0,hitsTaken:0,
    time:0,seen:[],heartsGained:0,heartsLeft:5,lowHeart:5,bossWins:0,
    wasDaily:false,wasSurv:false,wasVS:false,survTime:0,modeSeconds:{},continued:false};
}

/* ---------- wrap startGame: reset the run, hide the banner ---------- */
const _startGame=startGame;
startGame=function(seed){
  RUN=newRun();
  RUN.wasDaily=!!DAILY;RUN.wasSurv=!!SURV;RUN.wasVS=!!(VSM&&VSM.stage>0);
  setPaused(false,'');
  adHideBanner();
  _startGame(seed);
  RUN.heartsLeft=G.hearts;RUN.lowHeart=G.hearts;
};

/* ---------- wrap setMode: per-mode + per-world + affix tracking ---------- */
const _setMode=setMode;
setMode=function(m,fresh){
  _setMode(m,fresh);
  if(!RUN||!cur)return;
  bump(ST.modePlays,cur.key);
  if(RUN.seen.indexOf(cur.key)<0)RUN.seen.push(cur.key);
  const w=WORLD&&WORLD();
  if(w&&w.key)bump(ST.worldVisits,w.key);
  if(G&&G.affix&&G.affix.key){bump(ST.affixSeen,G.affix.key);bump(ST,'affixRuns');}
  saveStats();
};

/* ---------- wrap gainHeart / hurt for run stats ---------- */
const _gainHeart=gainHeart;
gainHeart=function(){
  const before=G?G.hearts:0;
  _gainHeart();
  if(G&&G.hearts>before&&RUN){RUN.heartsGained++;bump(ST,'totalHearts');}
};
const _hurt=hurt;
hurt=function(reason){
  _hurt(reason);
  if(G&&RUN)RUN.lowHeart=Math.min(RUN.lowHeart,G.hearts);
};

/* ---------- wrap quitToMenu: an abandoned run still banks its stats ---------- */
const _quitToMenu=quitToMenu;
quitToMenu=function(){
  if(state==='play'&&G&&RUN){
    commitRun(false);
    bump(ST,'quits');saveStats();
  }
  setPaused(false,'');
  _quitToMenu();
  resetScroll();
  adShowBanner();
};

/* ---------- commit a run's numbers into lifetime stats ---------- */
function commitRun(counted){
  if(!G||!RUN)return;
  RUN.score=G.score;RUN.coins=G.coins;RUN.kills=G.kills;RUN.morphs=G.morphs;
  RUN.bestCombo=G.bestCombo;RUN.cycle=G.cycle;RUN.hitsTaken=G.hitsTaken||0;
  RUN.time=G.t;RUN.heartsLeft=G.hearts;
  RUN.survTime=SURV?G.modeT:0;
  for(const k of (G.seen?[...G.seen]:[]))if(RUN.seen.indexOf(k)<0)RUN.seen.push(k);

  ST.totalScore+=G.score;ST.totalCoins+=G.coins;ST.totalKills+=G.kills;
  ST.totalMorphs+=G.morphs;ST.totalTime+=Math.round(G.t);
  ST.bestScore=Math.max(ST.bestScore,G.score);
  ST.bestCombo=Math.max(ST.bestCombo,G.bestCombo);
  ST.bestCycle=Math.max(ST.bestCycle,G.cycle);
  if(SURV)ST.bestSurvTime=Math.max(ST.bestSurvTime,Math.round(G.modeT));
  if(cur&&cur.key)ST.modeBest[cur.key]=Math.max(ST.modeBest[cur.key]||0,G.score);
  if(RUN.hitsTaken===0&&G.cycle>=1)bump(ST,'noHitRuns');
  if(counted){
    bump(ST,'runs');bump(ST,'deaths');
    if(RUN.wasDaily){
      const today=todayIdx();
      if(ST.lastDaily!==today){
        ST.dailyStreak=(today-ST.lastDaily===1)?ST.dailyStreak+1:1;
        ST.dailyBestStreak=Math.max(ST.dailyBestStreak,ST.dailyStreak);
        ST.lastDaily=today;bump(ST,'dailyDone');
      }
    }
  }
  // XP + mastery: rewards time spent, not just score
  const xp=Math.round(G.score*0.02+G.morphs*8+G.t*0.6+G.bestCombo*2);
  addXP(xp);
  const perMode=Math.round(xp/Math.max(1,RUN.seen.length));
  for(const k of RUN.seen)if(MODE_BY_KEY[k])addModeXP(k,perMode);
  const bits=Math.round(G.score*0.012+G.coins*0.7+G.morphs*3+RUN.bossWins*40);
  addBits(bits,true);
  RUN.bitsEarned=bits;
  saveStats();flushStats(true);
}

/* ---------- REWARDED CONTINUE ----------
   Offered once per run. Restores hearts, clears the killing hazard,
   and un-freezes a boss fight that already called finish().
------------------------------------------- */
let continueOffer=null;
function canOfferContinue(){
  return !!(G&&RUN&&!RUN.continued&&G.score>=300&&!VSM);
}
function doContinue(){
  if(!G||!RUN)return;
  RUN.continued=true;bump(ST,'continues');saveStats();
  G.hearts=2;G.invuln=3;G.combo=0;G.shield=true;
  state='play';overT=0;
  // a boss that already finished is frozen — re-seed or let it morph out
  if(cur&&BOSSES.includes(cur)&&cur.done){
    if(typeof cur.morphIn==='number'&&cur.morphIn>0){/* countdown already running */}
    else if(morphT<=0)beginMorph();
  } else if(cur&&cur.enter){
    // generic hazard clear: re-seed the mode so nothing is still overlapping you
    try{cur.enter(false);}catch(e){}
  }
  say("second wind. the genres blinked first.",2.6);
  SFX.win();confetti(P.x,P.y);
  adHideBanner();
}

/* ---------- wrap gameOver ---------- */
const _gameOver2=gameOver;
gameOver=function(){
  const wasVSHand=!!(VSM&&VSM.stage===1);
  commitRun(true);
  _gameOver2();  // the original wrapper: quips, stats line, legacy achievement pass, VS routing
  if(!GOD&&RUN){
    checkContracts(RUN);
    evalAchievements(RUN);
    if(RUN.wasVS)bump(ST,'vsMatches');
    flushStats(true);
  }
  continueOffer=canOfferContinue()?{t:0}:null;
  if(state==='over'||state==='vsresult'){
    adShowBanner();
    if(!wasVSHand)adMaybeInterstitial();
  }
};

/* ---------- legacy ACHIEVEMENTS array is replaced by ACH ---------- */
function unlockAchievement(key){ // old call sites (hall, duelist) still work
  const map={hall:'h_hall',duelist:'h_duel'};
  const k=map[key]||key;
  if(ACH_BY_KEY[k])unlockAch(k);
  if(key==='hall'){bump(ST,'hallFirsts');bump(ST,'hallEntries');saveStats();}
}

/* ---------- DAILY BONUS HEART (rewarded, opt-in) ---------- */
let bonusHeartDay=loadTyped('bonusday',-1,'number');
function bonusHeartAvailable(){return bonusHeartDay!==todayIdx();}
function claimBonusHeart(){
  adShowRewarded(earned=>{
    if(!earned)return;
    bonusHeartDay=todayIdx();writeSave('bonusday',bonusHeartDay);
    addBits(75,true);
    pushToast('DAILY BONUS','+75 ✦ and a shield on your next run','#ff4d6d');
    BONUS_SHIELD=true;
    SFX.win();
  });
}
let BONUS_SHIELD=false;

/* ---------- NEW TITLE SCREEN ----------
   Laid out from the BOTTOM up so nothing can fall off a short phone
   (audit 2-P2), and it leaves room for the banner ad.
------------------------------------------- */
drawTitle=function(t){
  drawBG(t);
  const u=UIS(),cx=W/2;
  ctx.textAlign='center';ctx.textBaseline='middle';
  const bw=Math.min(W*0.78,320),bx=cx-bw/2;
  const bh=Math.max(44,Math.min(48,H*0.062)), gap=Math.max(6,Math.min(9,H*0.011));
  const smallH=Math.max(38,bh*0.78);
  // bottom-up stack
  let by=H-SAFE_BOT()-12;
  const footY=by-14; by-=30;
  TZ.profile={x:bx,y:by-smallH,w:bw/3-4,h:smallH};
  TZ.badges ={x:bx+bw/3+2,y:by-smallH,w:bw/3-4,h:smallH};
  TZ.skins  ={x:bx+bw*2/3+4,y:by-smallH,w:bw/3-4,h:smallH};
  by-=smallH+gap;
  TZ.daily={x:bx,y:by-smallH,w:(bonusHeartAvailable()?bw/2-4:bw),h:smallH};
  if(bonusHeartAvailable())TZ.bonus={x:bx+bw/2+4,y:by-smallH,w:bw/2-4,h:smallH};
  else TZ.bonus=null;
  by-=smallH+gap;
  TZ.ranks={x:bx,y:by-bh,w:bw,h:bh}; by-=bh+gap;
  TZ.vs   ={x:bx,y:by-bh,w:bw,h:bh}; by-=bh+gap;
  TZ.single={x:bx,y:by-bh,w:bw,h:bh};by-=bh+gap;
  TZ.solo ={x:bx,y:by-bh,w:bw,h:bh}; by-=bh+gap;
  if(GOD){TZ.god={x:bx,y:by-32,w:bw,h:32};by-=32+gap;}else TZ.god=null;

  const a=0.5+0.5*Math.sin(t*4);
  drawBtn(TZ.solo,'▶  IDENTITY CRISIS','#fff',0.4+a*0.6);
  drawBtn(TZ.single,'🕹  SINGLE GAME · SURVIVAL','#4dd2ff');
  drawBtn(TZ.vs,'⚔  VS — pass & play','#ff4d6d');
  drawBtn(TZ.ranks,'★  HALL OF WHATEVER','#ffd94d');
  drawBtn(TZ.daily,'📅 DAILY'+(CONTRACTS.some(c=>!c.done)?'':' ✓'),'#4dd2ff');
  if(TZ.bonus)drawBtn(TZ.bonus,'🎁 FREE BONUS','#4dffa6',0.55+a*0.45);
  drawBtn(TZ.profile,'👤 '+ST.rank,'#c084fc');
  drawBtn(TZ.badges,'🏅 '+EARNED.size,'#ffd94d');
  drawBtn(TZ.skins,'🎨 '+OWNED.size,'#ff6bd6');
  if(TZ.god)drawBtn(TZ.god,'∞ TEST: '+(GOD?'ON':'off'),'#4dffa6');

  // footer
  ctx.font=`600 ${11*u}px -apple-system,system-ui,sans-serif`;
  ctx.fillStyle='rgba(255,255,255,0.42)';
  ctx.fillText('best '+Math.max(sessionBest,ST.bestScore).toLocaleString()+'  ·  '+ST.bits.toLocaleString()+' ✦  ·  rank '+ST.rank,cx,footY);

  // ---- everything above the buttons scales into whatever space is left ----
  const topRoom=by-SAFE_TOP()-8;
  const size=clamp(Math.min(W*0.145,topRoom*0.19),18,80);
  const cy=SAFE_TOP()+topRoom*0.30;
  const cols=['#4dd2ff','#c084fc','#ff4d6d','#ffd94d','#4dffa6','#ff9e4d'];
  const gi=Math.floor(t*1.5)%cols.length;
  const jitter=REDUCE_FX?false:Math.sin(t*30)>0.92;
  ctx.fillStyle='rgba(255,255,255,0.14)';ctx.font=`900 italic ${size}px -apple-system,'Segoe UI',system-ui,sans-serif`;
  ctx.fillText('THE',cx,cy-size*0.95);
  ctx.fillStyle=cols[gi];
  ctx.fillText('WHATEVER',cx+(jitter?vrand(-4,4):0),cy+(jitter?vrand(-2,2):0));
  ctx.fillStyle='rgba(255,255,255,0.14)';
  ctx.fillText('GAME',cx,cy+size*0.95);
  if(topRoom>190){
    ctx.font=`600 ${Math.min(W*0.032,16)}px -apple-system,system-ui,sans-serif`;
    ctx.fillStyle='rgba(255,255,255,0.7)';
    ctx.fillText(titleSub,cx,cy+size*1.6);
    ctx.font=`700 ${Math.min(W*0.027,13)}px -apple-system,system-ui,sans-serif`;
    ctx.fillStyle=cols[(gi+2)%cols.length];
    ctx.fillText(MODES.length+' GENRES · '+BOSSES.length+' BOSSES · '+WORLDS.length+' WORLDS · 1 CAT · 1 ∅',cx,cy+size*1.6+22);
  }
  // the bit, wearing whatever you equipped
  P.x=cx;P.y=Math.min(by-56,cy+size*1.6+(topRoom>190?58:26));
  P.y+=Math.sin(t*3)*7;P.look=Math.sin(t*1.3);P.lookY=0.2;
  drawSkinAt(P.x,P.y,Math.min(19,topRoom*0.06+11),curSkin(),
    {t,look:P.look,lookY:P.lookY,squish:0,mood:'hype',blink:(t%3.4)<0.11});
  // first-open reward
  if(loginReward&&loginReward.bits>0&&titleT<7){
    const al=clamp(Math.min(titleT*2,(7-titleT)*2),0,1);
    ctx.globalAlpha=al;
    ctx.font=`800 ${12*u}px -apple-system,system-ui,sans-serif`;
    ctx.fillStyle='#4dffa6';
    ctx.fillText('welcome back — day '+loginReward.day+' streak · +'+loginReward.bits+' ✦',cx,SAFE_TOP()+22);
    ctx.globalAlpha=1;
  }
};

/* ---------- title press: new buttons ---------- */
titlePress=function(fromKey){
  if(!fromKey){
    if(inZone(TZ.single)){openPick();return;}
    if(inZone(TZ.vs)){startVS();return;}
    if(inZone(TZ.ranks)){openBoard();return;}
    if(inZone(TZ.daily)){startDaily();return;}
    if(TZ.bonus&&inZone(TZ.bonus)){claimBonusHeart();return;}
    if(inZone(TZ.profile)){openProfile();return;}
    if(inZone(TZ.badges)){openBadges();return;}
    if(inZone(TZ.skins)){openSkins();return;}
    if(TZ.god&&inZone(TZ.god)){GOD=!GOD;SFX.heart();return;}
    if(inZone(TZ.solo)){VSM=null;SURV=null;DAILY=false;startGame();return;}
    return; // taps on empty space no longer start a run by accident
  }
  VSM=null;SURV=null;DAILY=false;startGame();
};

/* ---------- press dispatch for the new states ---------- */
const _doPress=doPress;
doPress=function(fromKey){
  if(state==='badges'){ensureAudio();if(!fromKey)badgesPress();else{state='title';resetScroll();}return;}
  if(state==='skins'){ensureAudio();if(!fromKey)skinsPress();else{state='title';resetScroll();}return;}
  if(state==='profile'){ensureAudio();if(!fromKey)profilePress();else{state='title';resetScroll();}return;}
  if(state==='play'&&PAUSED){
    ensureAudio();
    if(pauseReason==='ad')return;
    if(!fromKey){
      if(inZone(PZ.resume)){setPaused(false,'');return;}
      if(inZone(PZ.mute)){toggleMute();return;}
      if(inZone(PZ.quit)){setPaused(false,'');quitToMenu();return;}
      return;
    }
    setPaused(false,'');return;
  }
  if(state==='play'&&!fromKey&&inZone(MZ.pause)){togglePause();return;}
  if(state==='over'&&continueOffer&&continueOffer.t>0.4&&!fromKey&&inZone(OZ.cont)){doContinue();return;}
  _doPress(fromKey);
};

/* ---------- drag-scroll on the scrolling screens ---------- */
cv.addEventListener('pointerdown',()=>{
  if(state==='badges'||state==='skins'||state==='profile')scrollBegin();
},true);

/* ---------- Android hardware back button (audit 2-P2) ---------- */
(function backButton(){
  const C=window.Capacitor,App=C&&C.Plugins&&C.Plugins.App;
  if(!App||!App.addListener)return;
  App.addListener('backButton',()=>{
    if(state==='play'){
      if(PAUSED&&pauseReason==='user')setPaused(false,'');
      else if(!PAUSED)togglePause();
      return;
    }
    if(state==='title'){
      if(titleBackArm>0){try{App.exitApp();}catch(e){}}
      else{titleBackArm=1.8;say('press back again to exit.',1.8);}
      return;
    }
    if(state==='entry'){cancelEntry();return;}
    if(state==='over'){state='title';titleSub=vchoose(TITLE_SUBS);adShowBanner();return;}
    state='title';titleSub=vchoose(TITLE_SUBS);resetScroll();
  });
  // pause on app background; AdMob overlays do NOT always fire visibilitychange
  App.addListener('appStateChange',s=>{
    if(!s.isActive){if(state==='play'&&!PAUSED)setPaused(true,'user');flushStats(true);}
  });
})();
let titleBackArm=0;

/* ---------- reduce-flashing accessibility toggle (audit 6-P2) ---------- */
let REDUCE_FX=loadTyped('reducefx',
  (window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)?1:0,'number')?true:false;
function toggleReduceFX(){REDUCE_FX=!REDUCE_FX;writeSave('reducefx',REDUCE_FX?1:0);}

/* ---------- keyboard shortcuts for the new screens ---------- */
addEventListener('keydown',e=>{
  if(state==='title'){
    if(e.code==='KeyB'){e.preventDefault();openBadges();}
    else if(e.code==='KeyK'){e.preventDefault();openSkins();}
    else if(e.code==='KeyP'){e.preventDefault();openProfile();}
  }
  else if(e.code==='KeyP'&&state==='play'){e.preventDefault();togglePause();}
  else if(e.code==='Escape'&&(state==='badges'||state==='skins'||state==='profile')){
    e.preventDefault();state='title';resetScroll();
  }
});

/* ---------- boot the ad layer ---------- */
adsInit().then(()=>{if(state!=='play')adShowBanner();});
addEventListener('pagehide',()=>flushStats(true));
addEventListener('beforeunload',()=>flushStats(true));
