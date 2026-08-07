/* ==================================================================
   NEW CONTENT — boss 4, 2 new worlds, 2 new genres
   All boss exits use the dt-driven `morphIn` countdown (ad-pause safe)
   instead of the old wall-clock setTimeout.
   ================================================================== */

/* ---------------- BOSS 4 : THE ECHO ----------------
   Four mirror-bits replay your own path on a delay. You can't hurt
   them directly — you have to steer so two echoes collide.
--------------------------------------------------- */
const ModeEcho={
  key:'echo',name:'THE ECHO',hint:'they replay your path · make two echoes collide',
  col:{bg1:'#0a0d18',bg2:'#161c34',accent:'#8ab4ff'},bpm:132,durMul:1,
  echoes:[],trail:[],hp:4,done:false,timer:0,morphIn:0,warn:0,
  enter(fresh){
    this.trail=[];this.echoes=[];this.hp=4;this.done=false;this.timer=34;this.morphIn=0;this.warn=0;
    P.x=W*0.5;P.y=H*0.6;
    const cols=['#8ab4ff','#c084fc','#4dffa6','#ff6b9d'];
    for(let i=0;i<4;i++)this.echoes.push({delay:0.85+i*0.42,alive:true,x:W*0.5,y:H*0.4,px:W*0.5,py:H*0.4,c:cols[i],grace:1.6});
  },
  sampleAt(age){
    const T=this.trail;
    if(!T.length)return null;
    // trail is oldest-first; find the entry closest to `age` seconds ago
    const target=T[T.length-1].t-age;
    if(target<=T[0].t)return T[0];
    for(let i=T.length-1;i>=0;i--)if(T[i].t<=target)return T[i];
    return T[0];
  },
  finish(won){
    if(this.done)return;
    this.done=true;
    if(won){
      addScore(500,W/2,H/2,'BOSS');gainHeart();confetti(W/2,H*0.45);
      say("THE ECHO collapsed into itself. you out-remembered it.",2.8);SFX.win();
      RUN.bossWins=(RUN.bossWins||0)+1;bump(ST,'bossKills');bump(ST.bossBeats,'echo');saveStats();
    } else {
      say(vchoose(["the echo outlasted you. it always does.","you were the loop all along.","it remembered you longer than you lasted."]),2.4);
      if(G.hearts>0){G.combo=0;if(!GOD)G.hearts--;shake(14,0.5);SFX.hurt();}
    }
    // schedule the exit FIRST so a rewarded-continue can never strand the fight (audit 1-P1)
    this.morphIn=0.9;
    if(!won&&G.hearts<=0){gameOver();return;}
  },
  update(dt){
    if(this.done){
      if(this.morphIn>0){this.morphIn-=dt;if(this.morphIn<=0&&state==='play'&&morphT<=0)beginMorph();}
      return;
    }
    moveFree(dt,455);
    this.timer-=dt;
    if(this.timer<=0){this.finish(false);return;}
    // record path
    this.trail.push({x:P.x,y:P.y,t:G.modeT});
    while(this.trail.length>420)this.trail.shift();
    const live=this.echoes.filter(e=>e.alive);
    for(const e of live){
      const s=this.sampleAt(e.delay);
      if(s){e.px=e.x;e.py=e.y;e.x+=(s.x-e.x)*Math.min(1,7*dt);e.y+=(s.y-e.y)*Math.min(1,7*dt);}
      if(e.grace>0)e.grace-=dt;
      else if(dist2(P.x,P.y,e.x,e.y)<(P.r+13)**2)hurt('echoed');
    }
    // echo-vs-echo collisions destroy both
    for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++){
      const a=live[i],b=live[j];
      if(!a.alive||!b.alive)continue;
      if(a.grace>0||b.grace>0)continue;
      if(dist2(a.x,a.y,b.x,b.y)<22*22){
        a.alive=false;b.alive=false;this.hp-=2;
        burst((a.x+b.x)/2,(a.y+b.y)/2,'#fff',26,340);shake(11,0.35);SFX.pop();
        addScore(220,a.x,a.y,'ECHO');bumpCombo();
        say(vchoose(["two echoes, one memory. gone.","they cancelled each other out. poetic.","destructive interference. nice."]),2);
        if(this.hp<=0){this.finish(true);return;}
      }
    }
    this.warn=this.timer<6?1:0;
  },
  draw(t){
    ctx.save();
    for(const e of this.echoes){
      if(!e.alive)continue;
      ctx.globalAlpha=e.grace>0?0.35:0.9;
      ctx.save();ctx.globalCompositeOperation='lighter';
      ctx.globalAlpha*=0.45;ctx.drawImage(glowSpr,e.x-30,e.y-30,60,60);ctx.restore();
      ctx.globalAlpha=e.grace>0?0.4:1;
      ctx.fillStyle=e.c;
      ctx.beginPath();ctx.arc(e.x,e.y,12,0,TAU);ctx.fill();
      ctx.fillStyle='#0a0a14';
      ctx.beginPath();ctx.arc(e.x-4,e.y-2,2.6,0,TAU);ctx.arc(e.x+4,e.y-2,2.6,0,TAU);ctx.fill();
    }
    ctx.restore();ctx.globalAlpha=1;
    // remaining-echo pips
    const alive=this.echoes.filter(e=>e.alive).length;
    for(let i=0;i<alive;i++)glow(W/2-((alive-1)*12)+i*24,SAFE_TOP()+26,6,'#8ab4ff',0.85);
    if(this.warn){ctx.fillStyle=`rgba(255,80,110,${0.1+0.08*Math.sin(t*7)})`;ctx.fillRect(0,0,W,H);}
    if(G.modeT<2){
      ctx.font=`900 ${Math.min(W*0.07,38)}px -apple-system,system-ui,sans-serif`;
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';
      ctx.fillText('THE ECHO',W/2,H*0.35);
    }
    drawBit(P.x,P.y,P.r,{color:'#eaf1ff'});
  }
};

/* ---------------- NEW WORLDS ---------------- */
const WORLD_AURORA={
  key:'aurora',name:'AURORA FIELDS',quip:"the sky is showing off and it knows it",spd:0.98,
  _g:null,_h:0,
  pre(t){
    if(!this._g||this._h!==H){
      this._h=H;
      const g=ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,'#04121f');g.addColorStop(0.55,'#07203a');g.addColorStop(1,'#020a14');
      this._g=g;
    }
    ctx.fillStyle=this._g;ctx.fillRect(0,0,W,H);
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(let i=0;i<4;i++){
      const ph=t*0.35+i*1.4;
      ctx.globalAlpha=0.1+0.06*Math.sin(ph*1.7);
      ctx.fillStyle=i%2?'#4dffa6':'#67e8f9';
      ctx.beginPath();
      ctx.moveTo(0,H*0.1+i*22);
      for(let x=0;x<=W;x+=W/8)ctx.lineTo(x,H*0.1+i*22+Math.sin(x*0.006+ph)*26);
      ctx.lineTo(W,0);ctx.lineTo(0,0);ctx.closePath();ctx.fill();
    }
    ctx.restore();ctx.globalAlpha=1;
  },
  post(t){}
};
const WORLD_CLOCK={
  key:'clock',name:'CLOCKWORK',quip:"everything ticks. including you. sorry.",spd:1.04,
  pre(t){
    ctx.fillStyle='#1a1508';ctx.fillRect(0,0,W,H);
    ctx.save();ctx.globalAlpha=0.16;ctx.strokeStyle='#d9a441';ctx.lineWidth=2;
    const cx=W*0.5,cy=H*0.42;
    for(let i=0;i<3;i++){
      const r=Math.min(W,H)*(0.22+i*0.16),dir=i%2?-1:1,a0=t*(0.22+i*0.1)*dir;
      ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.stroke();
      for(let k=0;k<14;k++){
        const a=a0+k/14*TAU;
        ctx.beginPath();
        ctx.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);
        ctx.lineTo(cx+Math.cos(a)*(r+9),cy+Math.sin(a)*(r+9));ctx.stroke();
      }
    }
    ctx.restore();ctx.globalAlpha=1;
  },
  post(t){
    ctx.save();ctx.globalAlpha=0.05+0.03*Math.sin(t*Math.PI*2);
    ctx.fillStyle='#ffd08a';ctx.fillRect(0,0,W,H);ctx.restore();ctx.globalAlpha=1;
  }
};

/* ---------------- NEW GENRE : TETHER ----------------
   two bits joined by an elastic rope; swing the far one into targets
--------------------------------------------------- */
const ModeTether={
  key:'tether',name:'TETHER',hint:'drag to move · the ball on the rope smashes targets',
  col:{bg1:'#0b1418',bg2:'#12242c',accent:'#4dd2ff'},bpm:124,durMul:1.3,
  bx:0,by:0,bvx:0,bvy:0,targets:[],len:0,
  enter(fresh){
    this.len=Math.min(W,H)*0.19;
    P.x=W*0.5;P.y=H*0.55;
    this.bx=P.x+this.len;this.by=P.y;this.bvx=0;this.bvy=0;
    this.targets=[];
    for(let i=0;i<5;i++)this.spawn();
  },
  spawn(){
    this.targets.push({x:rand(40,W-40),y:rand(SAFE_TOP()+70,H-90),r:rand(13,20),
      vx:rand(-45,45),vy:rand(-35,35),hp:1});
  },
  update(dt){
    moveFree(dt,430);
    // spring-damped rope
    const dx=this.bx-P.x,dy=this.by-P.y;
    const d=Math.max(1,Math.hypot(dx,dy));
    const stretch=d-this.len;
    const k=26,damp=0.985;
    this.bvx-=(dx/d)*stretch*k*dt;
    this.bvy-=(dy/d)*stretch*k*dt;
    this.bvy+=430*dt;
    this.bvx*=damp;this.bvy*=damp;
    this.bx+=this.bvx*dt;this.by+=this.bvy*dt;
    // arena bounds
    if(this.bx<10){this.bx=10;this.bvx=Math.abs(this.bvx)*0.7;}
    if(this.bx>W-10){this.bx=W-10;this.bvx=-Math.abs(this.bvx)*0.7;}
    if(this.by<SAFE_TOP()+10){this.by=SAFE_TOP()+10;this.bvy=Math.abs(this.bvy)*0.7;}
    if(this.by>H-10){this.by=H-10;this.bvy=-Math.abs(this.bvy)*0.7;}
    const spd=Math.hypot(this.bvx,this.bvy);
    for(let i=this.targets.length-1;i>=0;i--){
      const o=this.targets[i];
      o.x+=o.vx*dt*G.speedMul;o.y+=o.vy*dt*G.speedMul;
      if(o.x<o.r||o.x>W-o.r)o.vx*=-1;
      if(o.y<SAFE_TOP()+o.r||o.y>H-o.r)o.vy*=-1;
      o.x=clamp(o.x,o.r,W-o.r);o.y=clamp(o.y,SAFE_TOP()+o.r,H-o.r);
      if(dist2(this.bx,this.by,o.x,o.y)<(o.r+9)**2){
        if(spd>210){
          this.targets.splice(i,1);
          burst(o.x,o.y,this.col.accent,16,260);SFX.pop();
          addScore(90,o.x,o.y);bumpCombo();G.kills++;
          this.spawn();
          if(rng()<0.1)gainHeart();
        } else {
          // too slow: bounce off harmlessly, no punishment
          this.bvx=-this.bvx*0.6;this.bvy=-this.bvy*0.6;
        }
        continue;
      }
      if(dist2(P.x,P.y,o.x,o.y)<(P.r+o.r-2)**2){this.targets.splice(i,1);hurt('bonked');this.spawn();}
    }
    while(this.targets.length<5)this.spawn();
  },
  draw(t){
    // rope
    ctx.strokeStyle='rgba(255,255,255,0.4)';ctx.lineWidth=2.5;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(P.x,P.y);
    const mx=(P.x+this.bx)/2,my=(P.y+this.by)/2+10;
    ctx.quadraticCurveTo(mx,my,this.bx,this.by);ctx.stroke();
    for(const o of this.targets){
      glow(o.x,o.y,o.r,this.col.accent,0.85);
      ctx.fillStyle='rgba(255,255,255,0.85)';
      ctx.beginPath();ctx.arc(o.x-o.r*0.3,o.y-o.r*0.3,o.r*0.22,0,TAU);ctx.fill();
    }
    const spd=Math.hypot(this.bvx,this.bvy);
    glow(this.bx,this.by,9,spd>210?'#ffd94d':'#eaeaff',1);
    drawBit(P.x,P.y,P.r,{color:'#eafaff'});
  }
};

/* ---------------- NEW GENRE : SORT ----------------
   colour-matching under time pressure; catch falling blocks in the
   matching bin by dragging the bin row
--------------------------------------------------- */
const ModeSort={
  key:'sort',name:'SORT',hint:'drag the bins · catch each block in its colour',
  col:{bg1:'#12101c',bg2:'#221c33',accent:'#c084fc'},bpm:130,durMul:1.25,
  cols:['#ff4d6d','#4dd2ff','#4dffa6','#ffd94d'],
  blocks:[],off:0,next:0,binY:0,
  enter(fresh){
    this.blocks=[];this.off=0;this.next=0.7;
    this.binY=H-70;
  },
  binW(){return W/4;},
  update(dt){
    this.binY=H-70;
    if(IN.down)this.off=clamp(IN.px-W/2,-W/2,W/2);
    else this.off*=Math.pow(0.02,dt);
    this.next-=dt;
    if(this.next<=0){
      this.next=Math.max(0.34,0.85-G.cycle*0.05)/G.speedMul;
      this.blocks.push({x:rand(30,W-30),y:SAFE_TOP()-20,c:randi(0,3),v:rand(120,180)*G.speedMul});
    }
    const bw=this.binW();
    for(let i=this.blocks.length-1;i>=0;i--){
      const b=this.blocks[i];
      b.y+=b.v*dt*G.speedMul;
      if(b.y>this.binY){
        this.blocks.splice(i,1);
        // which bin is under it, given the drag offset?
        const idx=clamp(Math.floor((b.x-this.off*0.5+bw*2-W/2)/bw),0,3);
        if(idx===b.c){addScore(70,b.x,this.binY,'SORT');bumpCombo();SFX.good();
          burst(b.x,this.binY,this.cols[b.c],10,180);
          if(rng()<0.07)gainHeart();}
        else{hurt('missorted');}
      }
    }
    if(this.blocks.length>28)this.blocks.splice(0,this.blocks.length-28);
  },
  draw(t){
    const bw=this.binW();
    for(let i=0;i<4;i++){
      const x=W/2-bw*2+i*bw+this.off*0.5;
      ctx.fillStyle=this.cols[i];ctx.globalAlpha=0.28;
      ctx.fillRect(x,this.binY,bw-3,H-this.binY);ctx.globalAlpha=1;
      ctx.strokeStyle=this.cols[i];ctx.lineWidth=2.5;
      ctx.strokeRect(x,this.binY,bw-3,H-this.binY-2);
    }
    for(const b of this.blocks){
      ctx.fillStyle=this.cols[b.c];
      roundRect(b.x-11,b.y-11,22,22,5);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.4)';ctx.fillRect(b.x-8,b.y-8,16,3);
    }
    P.x=W/2+this.off*0.5;P.y=this.binY-28;
    drawBit(P.x,P.y,P.r,{color:'#f3eaff'});
  }
};
