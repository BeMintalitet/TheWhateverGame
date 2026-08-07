/* ==================================================================
   META LAYER — save v2, persistent stats, currency, unlocks
   ================================================================== */
const SAVE_VER=2;

/* ---- typed, validated loader (audit: loadSave did no type checks) ---- */
function loadTyped(key,fallback,kind){
  const v=loadSave(key,undefined);
  if(v===undefined||v===null)return fallback;
  if(kind==='array')return Array.isArray(v)?v:fallback;
  if(kind==='object')return (v&&typeof v==='object'&&!Array.isArray(v))?v:fallback;
  if(kind==='number')return (typeof v==='number'&&isFinite(v))?v:fallback;
  if(kind==='string')return typeof v==='string'?v:fallback;
  return v;
}

/* ---- persistent stats: the substrate every achievement reads ---- */
const STAT_DEFAULTS={
  runs:0, totalScore:0, totalCoins:0, totalMorphs:0, totalKills:0, totalHearts:0,
  totalTime:0, deaths:0, bestScore:0, bestCombo:0, bestCycle:0, bestSurvTime:0,
  dailyDone:0, dailyStreak:0, dailyBestStreak:0, lastDaily:0,
  loginStreak:0, loginBest:0, lastLogin:0, loginDays:0,
  vsMatches:0, hallEntries:0, hallFirsts:0,
  bits:0, bitsEarned:0, xp:0, rank:1,
  adsWatched:0, continues:0, contractsDone:0,
  noHitRuns:0, bossKills:0, affixRuns:0, giftsOpened:0, ghostsCaught:0,
  modePlays:{}, modeBest:{}, modeXP:{}, modeTime:{},
  worldVisits:{}, affixSeen:{}, bossBeats:{}
};
let ST=Object.assign({},STAT_DEFAULTS,loadTyped('stats',{},'object'));
for(const k in STAT_DEFAULTS){
  const d=STAT_DEFAULTS[k];
  if(d&&typeof d==='object'){ if(!ST[k]||typeof ST[k]!=='object'||Array.isArray(ST[k]))ST[k]={}; }
  else if(typeof ST[k]!=='number'||!isFinite(ST[k]))ST[k]=d;
}
let statsDirty=false;
function saveStats(){statsDirty=true;}
function flushStats(force){
  if(!statsDirty&&!force)return;
  statsDirty=false;
  writeSave('stats',ST);
  writeSave('ver',SAVE_VER);
}
function bump(obj,key,by){obj[key]=(obj[key]||0)+(by===undefined?1:by);}

/* ---- migration from v1 ---- */
(function migrate(){
  const ver=loadTyped('ver',0,'number');
  if(ver>=SAVE_VER)return;
  ST.bestScore=Math.max(ST.bestScore,sessionBest||0);
  writeSave('ver',SAVE_VER);
  flushStats(true);
})();

/* ---- currency ---- */
function addBits(n,silent){
  n=Math.max(0,Math.round(n));if(!n)return;
  ST.bits+=n;ST.bitsEarned+=n;saveStats();
  if(!silent&&typeof floaters!=='undefined')floaters.push({x:W/2,y:H*0.42,t:0,txt:'+'+n+' ✦',c:'#ffd94d'});
}
function spendBits(n){if(ST.bits<n)return false;ST.bits-=n;saveStats();flushStats(true);return true;}

/* ---- prestige rank off lifetime XP ---- */
function rankFor(xp){return Math.max(1,Math.floor(Math.pow(Math.max(0,xp)/450,0.62))+1);}
function rankXpFloor(r){return Math.ceil(Math.pow(Math.max(0,r-1),1/0.62)*450);}
function addXP(n){
  if(!(n>0))return;
  const before=ST.rank;
  ST.xp+=Math.round(n);
  ST.rank=rankFor(ST.xp);
  if(ST.rank>before){
    addBits(40*(ST.rank-before),true);
    pushToast('RANK '+ST.rank,'+'+(40*(ST.rank-before))+' ✦','#c084fc');
  }
  saveStats();
}

/* ---- per-mode mastery: XP -> level 0..10 ---- */
const MASTERY_MAX=10;
function masteryLevel(key){
  const xp=ST.modeXP[key]||0;
  if(xp<=0)return 0;
  return Math.max(1,Math.min(MASTERY_MAX,Math.floor(Math.pow(xp/300,0.55))+1));
}
function masteryNeed(lvl){return Math.ceil(Math.pow(Math.max(0,lvl-1),1/0.55)*300);}
function addModeXP(key,n){
  if(!key||!(n>0))return;
  const before=masteryLevel(key);
  bump(ST.modeXP,key,Math.round(n));
  const after=masteryLevel(key);
  if(after>before){
    addBits(25*(after-before),true);
    pushToast('MASTERY '+after,(MODE_BY_KEY[key]?MODE_BY_KEY[key].name:key),'#4dffa6');
  }
}

/* ---- daily login streak ---- */
function todayIdx(){const d=new Date();return Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000);}
let loginReward=null;
(function checkLogin(){
  const today=todayIdx(),lastDay=ST.lastLogin||0;
  if(lastDay===today)return;
  ST.loginStreak=(today-lastDay===1)?ST.loginStreak+1:1;
  ST.loginBest=Math.max(ST.loginBest,ST.loginStreak);
  ST.lastLogin=today;ST.loginDays++;
  const reward=[0,15,25,40,60,85,120,180][Math.min(7,ST.loginStreak)];
  ST.bits+=reward;ST.bitsEarned+=reward;
  loginReward={day:ST.loginStreak,bits:reward};
  saveStats();flushStats(true);
})();

/* ---- rotating daily contracts (3/day, seeded off the date) ---- */
const CONTRACT_POOL=[
  {id:'c_score',  txt:c=>'score '+c.n.toLocaleString()+' in one run', n:[4000,8000,15000], test:(c,r)=>r.score>=c.n, bits:60},
  {id:'c_combo',  txt:c=>'land a '+c.n+'-hit combo',                  n:[15,25,40],        test:(c,r)=>r.bestCombo>=c.n, bits:55},
  {id:'c_morph',  txt:c=>'morph through '+c.n+' genres',              n:[8,14,22],         test:(c,r)=>r.morphs>=c.n, bits:50},
  {id:'c_coins',  txt:c=>'collect '+c.n+' coins in one run',          n:[40,80,140],       test:(c,r)=>r.coins>=c.n, bits:50},
  {id:'c_nohit',  txt:c=>'clear a cycle without being hit',           n:[1,1,1],           test:(c,r)=>r.cycle>=1&&r.hitsTaken===0, bits:90},
  {id:'c_boss',   txt:c=>'beat '+c.n+' boss'+(c.n>1?'es':''),         n:[1,2,3],           test:(c,r)=>(r.bossWins||0)>=c.n, bits:80},
  {id:'c_kills',  txt:c=>'zap '+c.n+' things',                        n:[20,40,70],        test:(c,r)=>r.kills>=c.n, bits:45},
  {id:'c_hearts', txt:c=>'earn '+c.n+' hearts in one run',            n:[3,5,8],           test:(c,r)=>(r.heartsGained||0)>=c.n, bits:55},
  {id:'c_surv',   txt:c=>'survive '+c.n+'s in SURVIVAL',              n:[60,120,200],      test:(c,r)=>(r.survTime||0)>=c.n, bits:70},
  {id:'c_daily',  txt:c=>'finish today’s DAILY CHALLENGE',       n:[1,1,1],           test:(c,r)=>!!r.wasDaily, bits:65}
];
let CONTRACTS=[];
(function rollContracts(){
  const today=todayIdx();
  const saved=loadTyped('contracts',null,'object');
  if(saved&&saved.day===today&&Array.isArray(saved.list)){CONTRACTS=saved.list;return;}
  let s=(today*2654435761)%2147483647;
  const rnd=()=>{s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff;};
  const pool=CONTRACT_POOL.slice();
  CONTRACTS=[];
  for(let i=0;i<3&&pool.length;i++){
    const def=pool.splice(Math.floor(rnd()*pool.length),1)[0];
    const tier=Math.floor(rnd()*3);
    CONTRACTS.push({id:def.id,tier,n:def.n[tier],done:false,bits:Math.round(def.bits*(1+tier*0.6))});
  }
  writeSave('contracts',{day:today,list:CONTRACTS});
})();
function contractDef(id){return CONTRACT_POOL.find(c=>c.id===id);}
function contractText(c){const d=contractDef(c.id);return d?d.txt(c):'???';}
function saveContracts(){writeSave('contracts',{day:todayIdx(),list:CONTRACTS});}
function checkContracts(r){
  let any=false;
  for(const c of CONTRACTS){
    if(c.done)continue;
    const def=contractDef(c.id);if(!def)continue;
    if(def.test(c,r)){
      c.done=true;addBits(c.bits,true);bump(ST,'contractsDone');
      pushToast('CONTRACT DONE','+'+c.bits+' ✦','#ffd94d');any=true;
    }
  }
  if(any)saveContracts();
}

/* ---- toast queue ---- */
let TOASTS=[];
function pushToast(title,sub,col){
  TOASTS.push({title,sub:sub||'',col:col||'#fff',t:0,life:2.8});
  if(TOASTS.length>4)TOASTS.splice(0,TOASTS.length-4);
}
function updateToasts(dt){
  for(let i=TOASTS.length-1;i>=0;i--){TOASTS[i].t+=dt;if(TOASTS[i].t>TOASTS[i].life)TOASTS.splice(i,1);}
}
function roundRect(x,y,w,h,r){
  r=Math.max(0,Math.min(r,w/2,h/2));
  ctx.beginPath();
  ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
}
function drawToasts(){
  if(!TOASTS.length)return;
  const u=UIS();
  ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
  for(let i=0;i<TOASTS.length;i++){
    const T=TOASTS[i],p=T.t/T.life;
    let a=1;
    if(p<0.09)a=p/0.09; else if(p>0.82)a=(1-p)/0.18;
    const w=Math.min(W*0.8,300),h=T.sub?54:38;
    const x=W/2-w/2,y=SAFE_TOP()+70+i*(h+8)-(1-Math.min(1,T.t/0.22))*14;
    ctx.globalAlpha=Math.max(0,a);
    ctx.fillStyle='rgba(8,8,18,0.9)';roundRect(x,y,w,h,10);ctx.fill();
    ctx.strokeStyle=T.col;ctx.lineWidth=2;roundRect(x,y,w,h,10);ctx.stroke();
    ctx.fillStyle=T.col;ctx.font=`800 ${12*u}px -apple-system,system-ui,sans-serif`;
    ctx.fillText(T.title,W/2,y+(T.sub?17:h/2+1));
    if(T.sub){ctx.fillStyle='rgba(255,255,255,0.8)';ctx.font=`600 ${11*u}px -apple-system,system-ui,sans-serif`;
      ctx.fillText(T.sub.length>38?T.sub.slice(0,37)+'…':T.sub,W/2,y+36);}
  }
  ctx.restore();ctx.globalAlpha=1;
}
