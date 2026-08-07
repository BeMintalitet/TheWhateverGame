/* ==================================================================
   ACHIEVEMENT ENGINE — 1000+ badges, generated from families.
   Each entry: {k:key, n:name, d:desc, c:category, t:tier(0-4),
                f:check(run,ST), b:bits, s:skinId?}
   `run` is the run summary built at game over; ST is lifetime stats.
   ================================================================== */
const MODE_BY_KEY={};
const ALL_MODES=MODES.concat(BOSSES);
for(const m of ALL_MODES)MODE_BY_KEY[m.key]=m;
const MODE_KEYS=ALL_MODES.map(m=>m.key);
const WORLD_KEYS=WORLDS.map(w=>w.key);
const AFFIX_KEYS=AFFIXES.map(a=>a.key);
const BOSS_KEYS=BOSSES.map(b=>b.key);

const ACH=[];
const ACH_CATS=['score','runs','modes','mastery','worlds','bosses','daily','social','collect','skill','grind','secret'];
function A(k,n,d,c,t,f,b,s){ACH.push({k,n,d,c,t,f,b:b||(10+t*20),s});}
function nfmt(n){return n>=1000?n.toLocaleString():''+n;}
const TIERW=['','II','III','IV','V','VI','VII','VIII','IX','X'];

/* ---------- 1. SCORE (single run) ---------- */
const SCORE_TIERS=[500,1500,3000,5000,8000,12000,18000,25000,35000,50000,70000,95000,130000,175000,250000];
SCORE_TIERS.forEach((v,i)=>A('sc'+i,'SCORE '+nfmt(v),'score '+nfmt(v)+' in a single run','score',Math.min(4,(i/3)|0),
  r=>r.score>=v,15+i*14, i===7?'hoarder':(i===12?'combobit':null)));
/* lifetime score */
const TSCORE=[10000,50000,150000,400000,1000000,2500000,6000000,15000000,40000000,100000000];
TSCORE.forEach((v,i)=>A('ts'+i,'LIFETIME '+nfmt(v),'score '+nfmt(v)+' points in total','score',Math.min(4,(i/2)|0),
  (r,S)=>S.totalScore>=v,40+i*30, i===6?'goldking':null));

/* ---------- 2. RUNS PLAYED ---------- */
const RUNT=[1,3,5,10,20,35,50,75,100,150,220,300,420,600,800,1000,1500,2000,3000,5000];
RUNT.forEach((v,i)=>A('rn'+i,'RUN '+nfmt(v),'finish '+nfmt(v)+' run'+(v>1?'s':''),'runs',Math.min(4,(i/4)|0),
  (r,S)=>S.runs>=v,12+i*11, i===8?'survivor':(i===15?'centurion':null)));

/* ---------- 3. COINS / KILLS / HEARTS / MORPHS (lifetime grind) ---------- */
function grind(prefix,label,stat,tiers,cat,skinAt,skinId){
  tiers.forEach((v,i)=>A(prefix+i,label.toUpperCase()+' '+nfmt(v),label+': '+nfmt(v)+' total','grind',Math.min(4,(i/3)|0),
    (r,S)=>(S[stat]||0)>=v,18+i*16, i===skinAt?skinId:null));
}
grind('cn','coins collected','totalCoins',[50,200,600,1500,3500,7000,14000,28000,55000,110000,220000,450000],'grind',7,'hoarder');
grind('kl','things zapped','totalKills',[25,100,300,800,2000,4500,9000,18000,36000,75000],'grind',7,'bosskiller');
grind('ht','hearts earned','totalHearts',[10,40,120,300,700,1500,3000,6500,13000],'grind',6,null);
grind('mo','genres morphed','totalMorphs',[20,75,200,500,1200,2600,5500,11000,24000],'grind',6,'speedster');
grind('tm','seconds played','totalTime',[600,1800,5400,14400,36000,90000,200000,450000],'grind',5,null);

/* ---------- 4. COMBOS ---------- */
const COMBOT=[5,10,15,20,25,30,40,50,65,80,100,125,150,200];
COMBOT.forEach((v,i)=>A('cb'+i,'COMBO '+v,'land a '+v+'-hit combo','skill',Math.min(4,(i/3)|0),
  r=>r.bestCombo>=v,18+i*16, i===9?'combobit':null));

/* ---------- 5. PER-MODE: plays, best score, mastery ---------- */
const PLAYT=[1,5,15,40,100];
const MBEST=[500,2000,6000,15000,40000];
MODE_KEYS.forEach(k=>{
  const m=MODE_BY_KEY[k],nm=m.name;
  PLAYT.forEach((v,i)=>A('mp_'+k+'_'+i,nm+' ×'+v,'play '+nm+' '+v+' time'+(v>1?'s':''),'modes',i,
    (r,S)=>(S.modePlays[k]||0)>=v,14+i*18));
  MBEST.forEach((v,i)=>A('mb_'+k+'_'+i,nm+' '+nfmt(v),'score '+nfmt(v)+' in '+nm,'modes',i,
    (r,S)=>(S.modeBest[k]||0)>=v,20+i*26));
  for(let L=1;L<=MASTERY_MAX;L++)
    A('mx_'+k+'_'+L,nm+' MASTERY '+(TIERW[L-1]||L),'reach mastery '+L+' in '+nm,'mastery',Math.min(4,((L-1)/2)|0),
      (r,S)=>masteryLevel(k)>=L,25+L*18);
});

/* ---------- 6. WORLDS ---------- */
const WVT=[1,5,20,60,150];
WORLD_KEYS.forEach(k=>{
  const w=WORLDS.find(x=>x.key===k);
  WVT.forEach((v,i)=>A('wv_'+k+'_'+i,w.name+' ×'+v,'visit '+w.name+' '+v+' time'+(v>1?'s':''),'worlds',i,
    (r,S)=>(S.worldVisits[k]||0)>=v,16+i*20));
});
A('w_all','WORLD TOURIST','visit every world at least once','worlds',3,
  (r,S)=>WORLD_KEYS.every(k=>(S.worldVisits[k]||0)>0),200,'astronaut');
A('w_all2','WORLD RESIDENT','visit every world 25 times','worlds',4,
  (r,S)=>WORLD_KEYS.every(k=>(S.worldVisits[k]||0)>=25),450,'nebula');

/* ---------- 7. AFFIXES ---------- */
const AVT=[1,5,20,60];
AFFIX_KEYS.forEach(k=>{
  const a=AFFIXES.find(x=>x.key===k);
  AVT.forEach((v,i)=>A('af_'+k+'_'+i,a.name+' ×'+v,'play '+v+' run'+(v>1?'s':'')+' with '+a.name,'skill',i+1,
    (r,S)=>(S.affixSeen[k]||0)>=v,22+i*24));
});
A('af_all','MUTATOR','see every mutator at least once','skill',3,
  (r,S)=>AFFIX_KEYS.every(k=>(S.affixSeen[k]||0)>0),260,'glitchy');

/* ---------- 8. BOSSES ---------- */
const BVT=[1,3,10,25,60];
BOSS_KEYS.forEach(k=>{
  const b=MODE_BY_KEY[k];
  BVT.forEach((v,i)=>A('bs_'+k+'_'+i,b.name+' ×'+v,'beat '+b.name+' '+v+' time'+(v>1?'s':''),'bosses',i,
    (r,S)=>(S.bossBeats[k]||0)>=v,35+i*40));
});
A('bs_all','BOSS SWEEP','beat every boss at least once','bosses',3,
  (r,S)=>BOSS_KEYS.every(k=>(S.bossBeats[k]||0)>0),400,'bosskiller');
const BKT=[1,5,15,40,100,250];
BKT.forEach((v,i)=>A('bk'+i,'BOSS SLAYER '+nfmt(v),'beat '+nfmt(v)+' boss fight'+(v>1?'s':''),'bosses',Math.min(4,i),
  (r,S)=>(S.bossKills||0)>=v,40+i*50));

/* ---------- 9. DAILY + STREAKS ---------- */
const DT=[1,3,7,14,30,60,120,250,500];
DT.forEach((v,i)=>A('dl'+i,'DAILY ×'+v,'finish '+v+' daily challenge'+(v>1?'s':''),'daily',Math.min(4,(i/2)|0),
  (r,S)=>(S.dailyDone||0)>=v,30+i*36, i===4?'dailybit':null));
const DST=[2,3,5,7,14,30,60,100];
DST.forEach((v,i)=>A('ds'+i,'DAILY STREAK '+v,'finish the daily '+v+' days in a row','daily',Math.min(4,(i/2)|0),
  (r,S)=>(S.dailyBestStreak||0)>=v,40+i*44));
const LST=[2,3,5,7,14,30,60,100,200,365];
LST.forEach((v,i)=>A('ls'+i,'LOYAL '+v,'open the game '+v+' days in a row','daily',Math.min(4,(i/2)|0),
  (r,S)=>(S.loginBest||0)>=v,30+i*38, i===7?'ritualbit_x':null));
const LDT=[1,7,30,90,180,365];
LDT.forEach((v,i)=>A('ld'+i,'DAYS PLAYED '+v,'play on '+v+' different day'+(v>1?'s':''),'daily',Math.min(4,i),
  (r,S)=>(S.loginDays||0)>=v,25+i*45));

/* ---------- 10. HALL / VS / SOCIAL ---------- */
[1,5,15,40,100].forEach((v,i)=>A('he'+i,'HALL ENTRY ×'+v,'sign the Hall of Whatever '+v+' time'+(v>1?'s':''),'social',i,
  (r,S)=>(S.hallEntries||0)>=v,25+i*35));
[1,5,20,50].forEach((v,i)=>A('hf'+i,'HALL #1 ×'+v,'take the #1 Hall spot '+v+' time'+(v>1?'s':''),'social',i+1,
  (r,S)=>(S.hallFirsts||0)>=v,60+i*60, i===2?'goldking':null));
[1,5,15,40,100].forEach((v,i)=>A('vs'+i,'DUELIST ×'+v,'finish '+v+' VS match'+(v>1?'es':''),'social',i,
  (r,S)=>(S.vsMatches||0)>=v,30+i*38));

/* ---------- 11. COLLECTION ---------- */
[5,10,20,30,45,60,75,90,100].forEach((v,i)=>A('sk'+i,'COLLECTOR '+v,'own '+v+' skins','collect',Math.min(4,(i/2)|0),
  ()=>OWNED.size>=v,50+i*70, i===7?'completionist':null));
[10,25,50,100,200,350,500,750,1000].forEach((v,i)=>A('ab'+i,'BADGES '+v,'earn '+v+' badges','collect',Math.min(4,(i/2)|0),
  ()=>EARNED.size>=v,40+i*80, i===8?'mythicbit':null));
[100,500,2000,8000,25000,80000,250000].forEach((v,i)=>A('bt'+i,'RICH '+nfmt(v),'earn '+nfmt(v)+' bits in total','collect',Math.min(4,(i/2)|0),
  (r,S)=>(S.bitsEarned||0)>=v,30+i*55));

/* ---------- 12. RANK ---------- */
[2,3,5,8,12,17,23,30,40,52,65,80,100].forEach((v,i)=>A('rk'+i,'RANK '+v,'reach player rank '+v,'collect',Math.min(4,(i/3)|0),
  (r,S)=>(S.rank||1)>=v,45+i*55, i===9?'platinum':(i===12?'mythicbit':null)));

/* ---------- 13. SKILL / PURITY ---------- */
[1,3,10,25,60,150].forEach((v,i)=>A('nh'+i,'UNTOUCHED ×'+v,'clear a cycle hitless '+v+' time'+(v>1?'s':''),'skill',Math.min(4,i),
  (r,S)=>(S.noHitRuns||0)>=v,60+i*65, i===3?'ghostbit':null));
[3,6,10,15,22,30,42,55].forEach((v,i)=>A('cy'+i,'CYCLE '+v,'reach cycle '+v+' in one run','skill',Math.min(4,(i/2)|0),
  r=>r.cycle>=v,45+i*50, i===5?'survivor':null));
[60,120,240,420,600,900,1200,1800].forEach((v,i)=>A('sv'+i,'SURVIVOR '+v+'s','survive '+v+' seconds in SURVIVAL','skill',Math.min(4,(i/2)|0),
  (r,S)=>(S.bestSurvTime||0)>=v,45+i*52, i===5?'survivor':null));
[5,10,20,35,55,80].forEach((v,i)=>A('mr'+i,'MORPH RUN '+v,'morph '+v+' times in one run','skill',Math.min(4,i),
  r=>r.morphs>=v,35+i*45, i===4?'speedster':null));
[20,50,90,150,240].forEach((v,i)=>A('cr'+i,'COIN RUN '+v,'collect '+v+' coins in one run','skill',Math.min(4,i),
  r=>r.coins>=v,30+i*42));
[10,25,50,90,150].forEach((v,i)=>A('kr'+i,'ZAP RUN '+v,'zap '+v+' things in one run','skill',Math.min(4,i),
  r=>r.kills>=v,30+i*42));

/* ---------- 14. CONTRACTS ---------- */
[1,5,15,40,100,250,500].forEach((v,i)=>A('ct'+i,'CONTRACTOR '+v,'complete '+v+' daily contract'+(v>1?'s':''),'daily',Math.min(4,(i/2)|0),
  (r,S)=>(S.contractsDone||0)>=v,35+i*55));

/* ---------- 15. HANDCRAFTED / SECRET ---------- */
A('h_cat','CAT PERSON','find the cat','secret',1,r=>r.seen.indexOf('pet')>=0,80,'kitty');
A('h_void','VOID WALKER','survive the identity crisis (∅ VOID)','secret',2,r=>r.seen.indexOf('flux')>=0,120,'voidbit');
A('h_allboss','TRIPLE THREAT','face three bosses in one run','secret',3,
  r=>BOSS_KEYS.filter(k=>r.seen.indexOf(k)>=0).length>=3,220,'bosskiller');
A('h_first','FIRST STEPS','finish your very first run','secret',0,(r,S)=>S.runs>=1,25,'sky');
A('h_marathon','MARATHON','reach LVL 10 in survival','secret',3,r=>r.wasSurv&&r.cycle>=9,180);
A('h_perfect','FLAWLESS','finish a run without taking a single hit','secret',3,
  r=>r.hitsTaken===0&&r.morphs>=4,250,'ghostbit');
A('h_pacifist','PACIFIST','score 8,000 without zapping anything','secret',3,
  r=>r.score>=8000&&r.kills===0,200);
A('h_broke','ZERO SUM','finish a run with exactly 0 coins','secret',1,r=>r.coins===0&&r.morphs>=3,60);
A('h_lucky','LUCKY SEVEN','finish a run with a score ending in 777','secret',2,r=>r.score%1000===777,150);
A('h_gift','UNWRAPPED','open 25 gifts','secret',2,(r,S)=>(S.giftsOpened||0)>=25,120);
A('h_gift2','GIFT GOBLIN','open 150 gifts','secret',3,(r,S)=>(S.giftsOpened||0)>=150,260);
A('h_ghost','GHOSTBUSTER','catch 50 ghosts','secret',2,(r,S)=>(S.ghostsCaught||0)>=50,140,'spooky');
A('h_night','NIGHT OWL','play a run between midnight and 4am','secret',1,
  r=>{const h=new Date().getHours();return h>=0&&h<4;},90,'nightsky');
A('h_early','DAWN PATROL','play a run between 5am and 7am','secret',1,
  r=>{const h=new Date().getHours();return h>=5&&h<7;},90,'dawnbit');
A('h_allmode','GENRE COMPLETIONIST','play every single genre at least once','secret',4,
  (r,S)=>MODE_KEYS.every(k=>(S.modePlays[k]||0)>0),600,'completionist');
A('h_allmode5','GENRE VETERAN','play every genre 5 times','secret',4,
  (r,S)=>MODE_KEYS.every(k=>(S.modePlays[k]||0)>=5),900,'mythicbit');
A('h_allmastery','TRUE MASTER','reach mastery 5 in every genre','secret',4,
  (r,S)=>MODE_KEYS.every(k=>masteryLevel(k)>=5),1500,'prismbit');
A('h_continue','SECOND WIND','use a continue','secret',1,(r,S)=>(S.continues||0)>=1,40);
A('h_continue10','NINE LIVES','use 10 continues','secret',2,(r,S)=>(S.continues||0)>=10,120);
A('h_hall','HALL LEGEND','take the #1 spot on the Hall of Whatever','secret',3,null,200,'goldking');
A('h_duel','DUELIST','finish a VS match','secret',1,null,80);
A('h_deep','DEDICATION','play for 10 hours total','secret',4,(r,S)=>(S.totalTime||0)>=36000,500,'centurion');
A('h_quit','COMMITMENT ISSUES','abandon 50 runs early','secret',1,(r,S)=>(S.quits||0)>=50,70);
A('h_speed','SPEEDRUN','score 5,000 in under 90 seconds','secret',3,
  r=>r.score>=5000&&r.time<=90,220,'speedster');
A('h_slow','SLOW BURN','make a single run last 10 minutes','secret',3,r=>r.time>=600,220);
A('h_five','FULL HEART','finish a run with all 5 hearts intact','secret',2,
  r=>r.heartsLeft>=5&&r.morphs>=5,160);
A('h_one','ON A PRAYER','score 15,000 in a run where you were down to 1 heart','secret',3,
  r=>r.score>=15000&&r.lowHeart<=1,240);

/* ---------- dedupe + finalise ---------- */
(function(){
  const seen=new Set(),out=[];
  for(const a of ACH){if(seen.has(a.k))continue;seen.add(a.k);out.push(a);}
  ACH.length=0;Array.prototype.push.apply(ACH,out);
  // any skin reference that doesn't resolve is dropped rather than silently dead
  for(const a of ACH)if(a.s&&!SKIN_BY_ID[a.s])a.s=null;
})();
const ACH_BY_KEY={};for(const a of ACH)ACH_BY_KEY[a.k]=a;

/* legacy v1 badge keys map onto the new set so old saves keep their progress */
const LEGACY_MAP={hop10:'mr0',hop25:'mr2',score20k:'sc7',combo25:'cb4',untouch:'nh0',
  coin150:'cr3',cat:'h_cat',void:'h_void',triple:'h_allboss',marathon:'h_marathon',
  duelist:'h_duel',hall:'h_hall'};
(function reconcile(){
  for(const old of [...EARNED]){
    if(ACH_BY_KEY[old])continue;
    const mapped=LEGACY_MAP[old];
    EARNED.delete(old);
    if(mapped&&ACH_BY_KEY[mapped])EARNED.add(mapped);
  }
  writeSave('badges',[...EARNED]);
})();

function achProgress(){return EARNED.size+'/'+ACH.length;}
function unlockAch(key,quiet){
  if(EARNED.has(key))return false;
  const a=ACH_BY_KEY[key];if(!a)return false;
  EARNED.add(key);writeSave('badges',[...EARNED]);
  addBits(a.b,true);
  addXP(Math.round(a.b*0.8));
  if(a.s)ownSkin(a.s,true);
  if(!quiet)pushToast('🏅 '+a.n,a.d+(a.s?' · SKIN: '+SKIN_BY_ID[a.s].name:'')+' · +'+a.b+' ✦',
    a.s?RARITY_COL[SKIN_BY_ID[a.s].rar]:'#ffd94d');
  SFX.win();
  return true;
}
/* evaluated once per run end — 1000 cheap predicates, ~0.3ms */
function evalAchievements(run){
  let n=0;
  for(const a of ACH){
    if(!a.f||EARNED.has(a.k))continue;
    let ok=false;
    try{ok=!!a.f(run,ST);}catch(e){ok=false;}
    if(ok){unlockAch(a.k,n>=3);n++;}
  }
  if(n>3)pushToast('+'+(n-3)+' MORE BADGES','open BADGES to see them','#ffd94d');
  return n;
}
