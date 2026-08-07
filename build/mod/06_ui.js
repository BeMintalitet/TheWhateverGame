/* ==================================================================
   NEW SCREENS — badges, skins, profile. All scrollable (the picker
   and badge list both outgrew a single page).
   ================================================================== */
const PZ={},AZ={},SZ={},FZ={};
const SCROLL={y:0,max:0,vel:0,drag:false,lastY:0,moved:0,startY:0};
function resetScroll(){SCROLL.y=0;SCROLL.vel=0;SCROLL.max=0;SCROLL.drag=false;SCROLL.moved=0;}
function scrollBegin(){SCROLL.drag=true;SCROLL.lastY=IN.py;SCROLL.startY=IN.py;SCROLL.moved=0;SCROLL.vel=0;}
function scrollUpdate(dt){
  if(SCROLL.drag){
    const d=IN.py-SCROLL.lastY;SCROLL.lastY=IN.py;
    SCROLL.y-=d;SCROLL.moved+=Math.abs(d);
    SCROLL.vel=-d/Math.max(dt,0.001)*0.016;
    if(!IN.down)SCROLL.drag=false;
  } else {
    SCROLL.y+=SCROLL.vel;SCROLL.vel*=Math.pow(0.001,dt);
    if(Math.abs(SCROLL.vel)<0.2)SCROLL.vel=0;
  }
  SCROLL.y=clamp(SCROLL.y,0,Math.max(0,SCROLL.max));
}
/* a tap only counts as a tap if the finger barely moved — otherwise it was a scroll */
function wasTap(){return SCROLL.moved<9;}
addEventListener('wheel',e=>{
  if(state==='badges'||state==='skins'||state==='profile'||state==='pick'){
    SCROLL.y=clamp(SCROLL.y+e.deltaY,0,Math.max(0,SCROLL.max));SCROLL.vel=0;
  }
},{passive:true});

function screenHeader(title,sub,accent){
  const u=UIS();
  ctx.fillStyle='rgba(6,6,14,0.92)';ctx.fillRect(0,0,W,SAFE_TOP()+62);
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font=`900 ${Math.min(W*0.055,26)}px -apple-system,'Segoe UI',system-ui,sans-serif`;
  ctx.fillStyle=accent||'#fff';ctx.fillText(title,W/2,SAFE_TOP()+24);
  if(sub){
    ctx.font=`600 ${11*u}px -apple-system,system-ui,sans-serif`;
    ctx.fillStyle='rgba(255,255,255,0.55)';ctx.fillText(sub,W/2,SAFE_TOP()+46);
  }
  FZ.back={x:10,y:SAFE_TOP()+8,w:56,h:46};
  drawBtn(FZ.back,'‹','rgba(255,255,255,0.6)');
  // bits wallet, always visible on meta screens
  ctx.textAlign='right';
  ctx.font=`800 ${12*u}px -apple-system,system-ui,sans-serif`;
  ctx.fillStyle='#ffd94d';ctx.fillText(ST.bits.toLocaleString()+' ✦',W-14,SAFE_TOP()+30);
  ctx.textAlign='center';
}
function scrollbar(top,viewH){
  if(SCROLL.max<=0)return;
  const h=Math.max(28,viewH*viewH/(viewH+SCROLL.max));
  const y=top+(viewH-h)*(SCROLL.y/SCROLL.max);
  ctx.fillStyle='rgba(255,255,255,0.13)';roundRect(W-6,top,3,viewH,2);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.45)';roundRect(W-6,y,3,h,2);ctx.fill();
}

/* ---------------- BADGES ---------------- */
let achFilter='all';
const ACH_FILTERS=[['all','ALL'],['score','SCORE'],['modes','GENRES'],['mastery','MASTERY'],
  ['skill','SKILL'],['bosses','BOSSES'],['worlds','WORLDS'],['daily','DAILY'],
  ['grind','GRIND'],['collect','META'],['social','SOCIAL'],['secret','SECRET'],['runs','RUNS']];
function achList(){
  const l=achFilter==='all'?ACH.slice():ACH.filter(a=>a.c===achFilter);
  // earned last so there's always something to chase at the top
  l.sort((a,b)=>(EARNED.has(a.k)?1:0)-(EARNED.has(b.k)?1:0)||a.t-b.t);
  return l;
}
function openBadges(){state='badges';overT=0;resetScroll();}
function drawBadges(t){
  drawBG(t*0.2);
  const u=UIS(),top=SAFE_TOP()+108,viewH=H-top-SAFE_BOT()-8;
  const list=achList();
  const rowH=54,pad=8;
  SCROLL.max=Math.max(0,list.length*(rowH+pad)+8-viewH);
  ctx.save();
  ctx.beginPath();ctx.rect(0,top,W,viewH);ctx.clip();
  const first=Math.max(0,Math.floor(SCROLL.y/(rowH+pad))-1);
  const lastI=Math.min(list.length,first+Math.ceil(viewH/(rowH+pad))+2);
  AZ.rows=[];
  for(let i=first;i<lastI;i++){
    const a=list[i],y=top+i*(rowH+pad)-SCROLL.y;
    const got=EARNED.has(a.k);
    const col=a.s?RARITY_COL[SKIN_BY_ID[a.s].rar]:'#ffd94d';
    ctx.globalAlpha=got?1:0.5;
    ctx.fillStyle=got?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.03)';
    roundRect(10,y,W-24,rowH,9);ctx.fill();
    ctx.strokeStyle=got?col:'rgba(255,255,255,0.14)';ctx.lineWidth=got?2:1;
    roundRect(10,y,W-24,rowH,9);ctx.stroke();
    // medal
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font=`${20*u}px sans-serif`;
    ctx.fillText(got?'🏅':'🔒',36,y+rowH/2);
    ctx.textAlign='left';
    ctx.font=`800 ${12*u}px -apple-system,system-ui,sans-serif`;
    ctx.fillStyle=got?col:'rgba(255,255,255,0.75)';
    ctx.fillText(a.n.length>26?a.n.slice(0,25)+'…':a.n,60,y+18);
    ctx.font=`600 ${10.5*u}px -apple-system,system-ui,sans-serif`;
    ctx.fillStyle='rgba(255,255,255,0.55)';
    ctx.fillText(a.d.length>40?a.d.slice(0,39)+'…':a.d,60,y+35);
    ctx.textAlign='right';
    ctx.font=`700 ${10*u}px -apple-system,system-ui,sans-serif`;
    ctx.fillStyle='#ffd94d';ctx.fillText('+'+a.b+' ✦',W-22,y+18);
    if(a.s){
      ctx.fillStyle=RARITY_COL[SKIN_BY_ID[a.s].rar];
      ctx.font=`700 ${9.5*u}px -apple-system,system-ui,sans-serif`;
      ctx.fillText('SKIN',W-22,y+35);
    }
    ctx.globalAlpha=1;
  }
  ctx.restore();
  scrollbar(top,viewH);
  screenHeader('BADGES',EARNED.size+' / '+ACH.length+' earned · '+Math.round(EARNED.size/ACH.length*100)+'%','#ffd94d');
  // filter strip
  const fy=SAFE_TOP()+66;
  ctx.fillStyle='rgba(6,6,14,0.92)';ctx.fillRect(0,fy-4,W,40);
  AZ.filters=[];
  let fx=10;
  ctx.textBaseline='middle';
  for(const [k,label] of ACH_FILTERS){
    ctx.font=`800 ${10*u}px -apple-system,system-ui,sans-serif`;
    const w=ctx.measureText(label).width+18;
    if(fx-SCROLL.fx>-w&&fx<W+40){
      const on=achFilter===k;
      ctx.fillStyle=on?'rgba(255,217,77,0.22)':'rgba(255,255,255,0.06)';
      roundRect(fx,fy,w,30,8);ctx.fill();
      ctx.strokeStyle=on?'#ffd94d':'rgba(255,255,255,0.2)';ctx.lineWidth=1.5;
      roundRect(fx,fy,w,30,8);ctx.stroke();
      ctx.fillStyle=on?'#ffd94d':'rgba(255,255,255,0.6)';
      ctx.textAlign='center';ctx.fillText(label,fx+w/2,fy+16);
    }
    AZ.filters.push({x:fx,y:fy,w,h:30,key:k});
    fx+=w+6;
  }
  // the strip is wider than the screen — it pans with the list for reachability
  AZ.stripW=fx;
}
function badgesPress(){
  if(inZone(FZ.back)){state='title';resetScroll();SFX.whiff();return;}
  if(!wasTap())return;
  for(const f of (AZ.filters||[]))if(inZone(f)){achFilter=f.key;resetScroll();SFX.good();return;}
}

/* ---------------- SKINS ---------------- */
let skinPreviewT=0;
function openSkins(){state='skins';overT=0;resetScroll();}
function drawSkins(t){
  drawBG(t*0.2);
  const u=UIS(),top=SAFE_TOP()+112,viewH=H-top-SAFE_BOT()-8;
  const cols=W>520?5:(W>380?4:3);
  const cw=(W-20)/cols, ch=cw*1.22;
  const rows=Math.ceil(SKINS.length/cols);
  SCROLL.max=Math.max(0,rows*ch+10-viewH);
  ctx.save();ctx.beginPath();ctx.rect(0,top,W,viewH);ctx.clip();
  SZ.tiles=[];
  const firstRow=Math.max(0,Math.floor(SCROLL.y/ch)-1);
  const lastRow=Math.min(rows,firstRow+Math.ceil(viewH/ch)+2);
  for(let ri=firstRow;ri<lastRow;ri++)for(let ci=0;ci<cols;ci++){
    const i=ri*cols+ci;if(i>=SKINS.length)break;
    const S=SKINS[i];
    const x=10+ci*cw, y=top+ri*ch-SCROLL.y;
    const owned=OWNED.has(S.id), eq=EQUIPPED===S.id;
    const rc=RARITY_COL[S.rar];
    ctx.fillStyle=eq?'rgba(255,255,255,0.12)':'rgba(255,255,255,0.045)';
    roundRect(x+3,y+3,cw-6,ch-8,10);ctx.fill();
    ctx.strokeStyle=eq?'#4dffa6':(owned?rc:'rgba(255,255,255,0.13)');
    ctx.lineWidth=eq?2.5:1.4;
    roundRect(x+3,y+3,cw-6,ch-8,10);ctx.stroke();
    const r=Math.min(cw,ch)*0.24;
    if(owned){
      drawSkinAt(x+cw/2,y+ch*0.4,r,S,{t:t+i*0.7,look:Math.sin(t*1.1+i),lookY:0.1,squish:0,mood:'idle'});
    } else {
      ctx.save();ctx.globalAlpha=0.2;
      drawSkinAt(x+cw/2,y+ch*0.4,r,S,{t:0,look:0,lookY:0,squish:0,mood:'idle'});
      ctx.restore();
      ctx.font=`${r*0.9}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillStyle='rgba(255,255,255,0.75)';ctx.fillText('🔒',x+cw/2,y+ch*0.4);
    }
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font=`800 ${Math.min(9.5,cw*0.098)*u}px -apple-system,system-ui,sans-serif`;
    ctx.fillStyle=owned?rc:'rgba(255,255,255,0.45)';
    const nm=S.name.length>13?S.name.slice(0,12)+'…':S.name;
    ctx.fillText(nm,x+cw/2,y+ch*0.72);
    ctx.font=`700 ${Math.min(8.5,cw*0.088)*u}px -apple-system,system-ui,sans-serif`;
    if(eq){ctx.fillStyle='#4dffa6';ctx.fillText('EQUIPPED',x+cw/2,y+ch*0.86);}
    else if(owned){ctx.fillStyle='rgba(255,255,255,0.4)';ctx.fillText('tap to wear',x+cw/2,y+ch*0.86);}
    else{
      const cost=skinCost(S);
      ctx.fillStyle=ST.bits>=cost?'#ffd94d':'rgba(255,255,255,0.35)';
      ctx.fillText(cost+' ✦',x+cw/2,y+ch*0.86);
    }
    SZ.tiles.push({x,y,w:cw,h:ch,id:S.id});
  }
  ctx.restore();
  scrollbar(top,viewH);
  screenHeader('SKINS',OWNED.size+' / '+SKINS.length+' owned · tap to wear or buy','#c084fc');
  // equipped preview strip
  const py=SAFE_TOP()+70;
  ctx.fillStyle='rgba(6,6,14,0.92)';ctx.fillRect(0,py-4,W,44);
  const S=curSkin();
  drawSkinAt(30,py+18,14,S,{t:t,look:Math.sin(t),lookY:0.15,squish:0,mood:'hype'});
  ctx.textAlign='left';ctx.textBaseline='middle';
  ctx.font=`800 ${11*u}px -apple-system,system-ui,sans-serif`;
  ctx.fillStyle=RARITY_COL[S.rar];ctx.fillText(S.name,52,py+12);
  ctx.font=`600 ${10*u}px -apple-system,system-ui,sans-serif`;
  ctx.fillStyle='rgba(255,255,255,0.45)';ctx.fillText(S.rar.toUpperCase()+' · currently worn',52,py+27);
  ctx.textAlign='center';
}
function skinsPress(){
  if(inZone(FZ.back)){state='title';resetScroll();SFX.whiff();return;}
  if(!wasTap())return;
  for(const tl of (SZ.tiles||[]))if(inZone(tl)){
    const S=SKIN_BY_ID[tl.id];if(!S)return;
    if(OWNED.has(S.id)){
      if(EQUIPPED===S.id)return;
      equipSkin(S.id);SFX.win();pushToast('NOW WEARING',S.name,RARITY_COL[S.rar]);
    } else {
      const cost=skinCost(S);
      if(spendBits(cost)){ownSkin(S.id,true);equipSkin(S.id);SFX.win();
        pushToast('PURCHASED',S.name+' · -'+cost+' ✦',RARITY_COL[S.rar]);}
      else{SFX.whiff();pushToast('NOT ENOUGH BITS','need '+(cost-ST.bits)+' more ✦','#ff4d6d');}
    }
    return;
  }
}

/* ---------------- PROFILE ---------------- */
function openProfile(){state='profile';overT=0;resetScroll();}
function drawProfile(t){
  drawBG(t*0.2);
  const u=UIS(),top=SAFE_TOP()+72,viewH=H-top-SAFE_BOT()-8;
  ctx.save();ctx.beginPath();ctx.rect(0,top,W,viewH);ctx.clip();
  let y=top+10-SCROLL.y;
  const L=(label,val,col)=>{
    ctx.textAlign='left';ctx.font=`600 ${11.5*u}px -apple-system,system-ui,sans-serif`;
    ctx.fillStyle='rgba(255,255,255,0.5)';ctx.fillText(label,20,y);
    ctx.textAlign='right';ctx.font=`800 ${11.5*u}px -apple-system,system-ui,sans-serif`;
    ctx.fillStyle=col||'#fff';ctx.fillText(val,W-20,y);
    y+=24;
  };
  const HEAD=txt=>{
    y+=10;ctx.textAlign='left';ctx.font=`800 ${11*u}px -apple-system,system-ui,sans-serif`;
    ctx.fillStyle='#4dd2ff';ctx.fillText(txt,20,y);y+=8;
    ctx.fillStyle='rgba(255,255,255,0.12)';ctx.fillRect(20,y-2,W-40,1);y+=14;
  };
  ctx.textBaseline='middle';
  // rank card
  ctx.fillStyle='rgba(255,255,255,0.05)';roundRect(14,y-6,W-28,74,12);ctx.fill();
  ctx.strokeStyle='#c084fc';ctx.lineWidth=2;roundRect(14,y-6,W-28,74,12);ctx.stroke();
  drawSkinAt(50,y+31,20,curSkin(),{t,look:Math.sin(t*1.2),lookY:0.1,squish:0,mood:'hype'});
  ctx.textAlign='left';
  ctx.font=`900 ${17*u}px -apple-system,system-ui,sans-serif`;
  ctx.fillStyle='#fff';ctx.fillText('RANK '+ST.rank,84,y+16);
  const floor=rankXpFloor(ST.rank),next=rankXpFloor(ST.rank+1);
  const p=clamp((ST.xp-floor)/Math.max(1,next-floor),0,1);
  ctx.fillStyle='rgba(255,255,255,0.12)';roundRect(84,y+32,W-140,7,4);ctx.fill();
  ctx.fillStyle='#c084fc';roundRect(84,y+32,(W-140)*p,7,4);ctx.fill();
  ctx.font=`600 ${9.5*u}px -apple-system,system-ui,sans-serif`;
  ctx.fillStyle='rgba(255,255,255,0.5)';
  ctx.fillText((ST.xp-floor).toLocaleString()+' / '+(next-floor).toLocaleString()+' XP to rank '+(ST.rank+1),84,y+50);
  ctx.textAlign='right';
  ctx.font=`800 ${13*u}px -apple-system,system-ui,sans-serif`;
  ctx.fillStyle='#ffd94d';ctx.fillText(ST.bits.toLocaleString()+' ✦',W-26,y+16);
  y+=86;

  HEAD("TODAY'S CONTRACTS");
  for(const c of CONTRACTS){
    ctx.textAlign='left';ctx.font=`600 ${11*u}px -apple-system,system-ui,sans-serif`;
    ctx.fillStyle=c.done?'#4dffa6':'rgba(255,255,255,0.72)';
    ctx.fillText((c.done?'✓ ':'○ ')+contractText(c),22,y);
    ctx.textAlign='right';ctx.font=`700 ${10*u}px -apple-system,system-ui,sans-serif`;
    ctx.fillStyle=c.done?'rgba(255,255,255,0.3)':'#ffd94d';
    ctx.fillText('+'+c.bits+' ✦',W-20,y);
    y+=24;
  }
  y+=6;
  ctx.textAlign='left';ctx.font=`600 ${10*u}px -apple-system,system-ui,sans-serif`;
  ctx.fillStyle='rgba(255,255,255,0.4)';
  ctx.fillText('new contracts every day · login streak: '+ST.loginStreak+' day'+(ST.loginStreak===1?'':'s'),22,y);
  y+=20;

  HEAD('LIFETIME');
  L('runs finished',ST.runs.toLocaleString());
  L('best score',Math.max(ST.bestScore,sessionBest).toLocaleString(),'#ffd94d');
  L('total score',ST.totalScore.toLocaleString());
  L('best combo',ST.bestCombo.toLocaleString());
  L('genres morphed',ST.totalMorphs.toLocaleString());
  L('coins collected',ST.totalCoins.toLocaleString());
  L('things zapped',ST.totalKills.toLocaleString());
  L('bosses beaten',(ST.bossKills||0).toLocaleString());
  L('hitless cycles',(ST.noHitRuns||0).toLocaleString());
  L('time played',Math.floor(ST.totalTime/3600)+'h '+Math.floor(ST.totalTime/60)%60+'m');
  L('dailies finished',ST.dailyDone.toLocaleString()+(ST.dailyBestStreak?(' · best streak '+ST.dailyBestStreak):''));
  L('days played',ST.loginDays.toLocaleString()+' · longest login streak '+ST.loginBest);
  L('badges',EARNED.size+' / '+ACH.length,'#ffd94d');
  L('skins',OWNED.size+' / '+SKINS.length,'#c084fc');

  HEAD('GENRE MASTERY');
  const ms=MODE_KEYS.map(k=>({k,l:masteryLevel(k),xp:ST.modeXP[k]||0}))
    .sort((a,b)=>b.l-a.l||b.xp-a.xp);
  for(const m of ms){
    const mo=MODE_BY_KEY[m.k];
    ctx.textAlign='left';ctx.font=`600 ${11*u}px -apple-system,system-ui,sans-serif`;
    ctx.fillStyle=m.l?'rgba(255,255,255,0.8)':'rgba(255,255,255,0.32)';
    ctx.fillText(mo.name,22,y);
    // 10 pips
    for(let i=0;i<MASTERY_MAX;i++){
      ctx.fillStyle=i<m.l?'#4dffa6':'rgba(255,255,255,0.12)';
      ctx.fillRect(W-20-(MASTERY_MAX-i)*11,y-4,8,8);
    }
    y+=22;
  }
  y+=14;
  ctx.textAlign='center';ctx.font=`600 ${10*u}px -apple-system,system-ui,sans-serif`;
  ctx.fillStyle='rgba(255,255,255,0.3)';
  ctx.fillText('all progress is stored on this device only',W/2,y);y+=30;

  ctx.restore();
  SCROLL.max=Math.max(0,(y+SCROLL.y)-top-viewH+20);
  scrollbar(top,viewH);
  screenHeader('PROFILE','rank '+ST.rank+' · '+ST.runs+' runs','#4dd2ff');
}
function profilePress(){
  if(inZone(FZ.back)){state='title';resetScroll();SFX.whiff();return;}
}
