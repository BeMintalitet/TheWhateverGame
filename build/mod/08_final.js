/* ==================================================================
   FINAL GLUE — runs after the original file-end gameOver wrapper, so
   this is the outermost layer and sees the settled state.
   ================================================================== */

/* ---------- the player now wears the equipped skin ---------- */
drawBit=function(x,y,r,opts){
  const S=curSkin();
  const inv=G&&G.invuln>0&&Math.floor(G.invuln*(REDUCE_FX?5:14))%2===0;
  if(inv)ctx.globalAlpha=0.35;
  drawSkinAt(x,y,r,S,{
    t:performance.now()/1000,
    look:P.look,lookY:P.lookY,squish:P.squish,
    blink:P.blink>0&&P.blink<0.12,
    mood:(G&&G.invuln>1.2)?'hurt':((G&&G.combo>=10)?'hype':'idle')
  });
  ctx.globalAlpha=1;
  if(G&&G.shield&&state==='play'){
    ctx.save();ctx.translate(x,y);
    ctx.strokeStyle='rgba(110,231,255,0.7)';ctx.lineWidth=2.5;
    ctx.beginPath();ctx.arc(0,0,r*1.6,0,TAU);ctx.stroke();
    ctx.restore();
  }
};

/* ---------- post-run ad gate: deferred a frame so VS routing has settled ---------- */
let postRunPending=0;
function runPostRunAds(){
  if(state==='over'||state==='vsresult'||state==='board'){
    adShowBanner();
    if(state!=='vshand')adMaybeInterstitial();
  }
}

/* ---------- outermost gameOver: schedule the ad gate ---------- */
const _goFinal=gameOver;
gameOver=function(){
  _goFinal();
  postRunPending=0.08;
};

/* ---------- the shield promised by the daily bonus ---------- */
const _sgFinal=startGame;
startGame=function(seed){
  _sgFinal(seed);
  if(BONUS_SHIELD&&G){G.shield=true;BONUS_SHIELD=false;
    say("daily bonus: one free hit. use it badly.",2.6);}
};

/* ---------- game-over screen: continue offer + run rewards ---------- */
const _drawOver=drawOver;
drawOver=function(t){
  _drawOver(t);
  const u=UIS();
  ctx.textAlign='center';ctx.textBaseline='middle';
  // what the run paid out
  if(RUN&&RUN.bitsEarned){
    ctx.font=`700 ${11*u}px -apple-system,system-ui,sans-serif`;
    ctx.fillStyle='#ffd94d';
    ctx.fillText('+'+RUN.bitsEarned+' ✦   ·   rank '+ST.rank,W/2,H*0.46+18);
  }
  if(continueOffer&&overT>0.4){
    const bw=Math.min(W*0.72,300),bx=W/2-bw/2;
    const y=H*0.53;
    OZ.cont={x:bx,y,w:bw,h:52};
    const a=0.55+0.45*Math.sin(t*5);
    ctx.fillStyle='rgba(77,255,166,0.12)';roundRect(bx,y,bw,52,10);ctx.fill();
    ctx.strokeStyle='#4dffa6';ctx.lineWidth=2.5;ctx.globalAlpha=a;
    roundRect(bx,y,bw,52,10);ctx.stroke();ctx.globalAlpha=1;
    ctx.font=`800 ${13*u}px -apple-system,system-ui,sans-serif`;
    ctx.fillStyle='#4dffa6';ctx.fillText('▶  WATCH AD — KEEP GOING',W/2,y+20);
    ctx.font=`600 ${10*u}px -apple-system,system-ui,sans-serif`;
    ctx.fillStyle='rgba(255,255,255,0.5)';
    ctx.fillText('2 hearts + a shield · once per run',W/2,y+38);
  } else OZ.cont=null;
};

/* ---------- the continue itself goes through a rewarded ad ---------- */
const _doContinueRaw=doContinue;
doContinue=function(){
  const offer=continueOffer;
  if(!offer)return;
  continueOffer=null;
  adShowRewarded(earned=>{
    if(earned)_doContinueRaw();
    else{continueOffer=offer;pushToast('NO AD AVAILABLE','try again in a moment','#ff4d6d');}
  });
};

/* ---------- banner visibility follows the state machine ---------- */
let _lastAdState=null;
(function watchState(){
  const tick=()=>{
    if(state!==_lastAdState){
      _lastAdState=state;
      if(state==='play')adHideBanner();
      else adShowBanner();
    }
    setTimeout(tick,400);
  };
  tick();
})();

/* ---------- gift / ghost counters for the secret badges ---------- */
if(typeof EV==='object'&&EV){
  const _upd=updateEvents;
  updateEvents=function(dt,t){
    const hadGift=!!(EV.gift&&!EV.gift.opened);
    const hadGhost=!!EV.ghost;
    _upd(dt,t);
    if(hadGift&&(!EV.gift||EV.gift.opened)){bump(ST,'giftsOpened');saveStats();}
    if(hadGhost&&!EV.ghost){bump(ST,'ghostsCaught');saveStats();}
  };
}

/* ---------- boss-win bookkeeping for the three original bosses ---------- */
for(const B of [ModeBoss,ModeCursor,ModeWorm]){
  if(!B||typeof B.finish!=='function')continue;
  const _f=B.finish.bind(B);
  B.finish=function(won){
    const first=!this.done;
    _f(won);
    if(won&&first){
      if(RUN)RUN.bossWins=(RUN.bossWins||0)+1;
      bump(ST,'bossKills');bump(ST.bossBeats,B.key);saveStats();
    }
  };
}

/* ---------- hall-of-fame bookkeeping ---------- */
const _addToBoard=addToBoard;
addToBoard=function(name,score,tag){
  const i=_addToBoard(name,score,tag);
  bump(ST,'hallEntries');
  if(i===0)bump(ST,'hallFirsts');
  saveStats();
  return i;
};

/* ---------- flush periodically so a hard kill never loses progress ---------- */
setInterval(()=>flushStats(false),20000);

/* ---------- sanity: everything the modules promised actually exists ---------- */
(function selfCheck(){
  const missing=[];
  for(const k of MODE_KEYS)if(!SCALES[k])missing.push('SCALES.'+k);
  for(const k of MODE_KEYS)if(ROOTS[k]===undefined)missing.push('ROOTS.'+k);
  for(const k of MODE_KEYS)if(!QUIPS[k])missing.push('QUIPS.'+k);
  for(const a of ACH)if(a.s&&!SKIN_BY_ID[a.s])missing.push('skin:'+a.s);
  if(missing.length&&typeof console!=='undefined'&&window.__TWG_DEBUG)
    console.warn('TWG selfcheck',missing);
  window.__TWG={ACH,SKINS,ST,MODE_KEYS,missing,
    counts:{ach:ACH.length,skins:SKINS.length,modes:MODES.length,bosses:BOSSES.length,worlds:WORLDS.length}};
})();
