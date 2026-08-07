/* ==================================================================
   SKIN ENGINE — 100 high-definition procedural player skins.
   Everything is vector + gradient, so it stays crisp at any DPR and
   costs a few hundred bytes instead of a sprite atlas.
   Layer order: AURA -> BODY(shape+surface) -> PATTERN -> FACE -> HAT -> RIM
   ================================================================== */
const SKIN_GRAD_CACHE=new Map();
function gcache(key,make){
  let g=SKIN_GRAD_CACHE.get(key);
  if(!g){g=make();SKIN_GRAD_CACHE.set(key,g);if(SKIN_GRAD_CACHE.size>260)SKIN_GRAD_CACHE.clear();}
  return g;
}
function shade(hex,amt){
  const n=parseInt(hex.slice(1),16);
  let r=(n>>16)&255,g=(n>>8)&255,b=n&255;
  if(amt>0){r+=(255-r)*amt;g+=(255-g)*amt;b+=(255-b)*amt;}
  else{r*=(1+amt);g*=(1+amt);b*=(1+amt);}
  return 'rgb('+(r|0)+','+(g|0)+','+(b|0)+')';
}
function hexA(hex,a){
  const n=parseInt(hex.slice(1),16);
  return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')';
}

/* ---------------- BODY SHAPES (path only, centred at 0,0) ---------------- */
const SHAPES={
  orb(rx,ry){ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,TAU);},
  egg(rx,ry){ctx.beginPath();ctx.ellipse(0,ry*0.08,rx*0.94,ry,0,0,TAU);},
  blob(rx,ry,t){
    ctx.beginPath();
    for(let i=0;i<=28;i++){
      const a=i/28*TAU;
      const w=1+Math.sin(a*3+t*1.6)*0.055+Math.sin(a*5-t*1.1)*0.035;
      const x=Math.cos(a)*rx*w,y=Math.sin(a)*ry*w;
      i?ctx.lineTo(x,y):ctx.moveTo(x,y);
    }
    ctx.closePath();
  },
  gem(rx,ry){
    ctx.beginPath();
    ctx.moveTo(0,-ry);ctx.lineTo(rx*0.92,-ry*0.22);ctx.lineTo(rx*0.58,ry*0.92);
    ctx.lineTo(-rx*0.58,ry*0.92);ctx.lineTo(-rx*0.92,-ry*0.22);ctx.closePath();
  },
  cube(rx,ry){const k=rx*0.9;roundRectPath(-k,-ry*0.9,k*2,ry*1.8,rx*0.22);},
  hex(rx,ry){
    ctx.beginPath();
    for(let i=0;i<6;i++){const a=i/6*TAU-Math.PI/2;
      const x=Math.cos(a)*rx,y=Math.sin(a)*ry;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
    ctx.closePath();
  },
  star(rx,ry){
    ctx.beginPath();
    for(let i=0;i<10;i++){const a=i/10*TAU-Math.PI/2,rr=i%2?0.48:1;
      const x=Math.cos(a)*rx*rr,y=Math.sin(a)*ry*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
    ctx.closePath();
  },
  drop(rx,ry){
    ctx.beginPath();
    ctx.moveTo(0,-ry*1.25);
    ctx.bezierCurveTo(rx*0.85,-ry*0.35,rx,ry*0.35,0,ry);
    ctx.bezierCurveTo(-rx,ry*0.35,-rx*0.85,-ry*0.35,0,-ry*1.25);
    ctx.closePath();
  },
  ghost(rx,ry){
    ctx.beginPath();
    ctx.arc(0,-ry*0.12,rx,Math.PI,0);
    ctx.lineTo(rx,ry*0.62);
    for(let i=0;i<4;i++){
      const x0=rx-(i*2+0)*rx/4,x1=rx-(i*2+1)*rx/4,x2=rx-(i*2+2)*rx/4;
      ctx.quadraticCurveTo(x1,ry*(i%2?0.34:1.02),x2,ry*0.62);
    }
    ctx.lineTo(-rx,-ry*0.12);ctx.closePath();
  },
  crystal(rx,ry){
    ctx.beginPath();
    ctx.moveTo(0,-ry*1.15);ctx.lineTo(rx*0.72,-ry*0.3);ctx.lineTo(rx*0.5,ry*0.98);
    ctx.lineTo(-rx*0.5,ry*0.98);ctx.lineTo(-rx*0.72,-ry*0.3);ctx.closePath();
  },
  flame(rx,ry,t){
    ctx.beginPath();
    ctx.moveTo(0,ry);
    ctx.bezierCurveTo(rx*1.05,ry*0.5,rx*0.62,-ry*0.35,rx*0.2+Math.sin(t*4)*rx*0.08,-ry*1.3);
    ctx.bezierCurveTo(rx*0.1,-ry*0.5,-rx*0.42,-ry*0.5,-rx*0.28,-ry*1.05);
    ctx.bezierCurveTo(-rx*0.95,-ry*0.4,-rx*1.05,ry*0.5,0,ry);
    ctx.closePath();
  },
  cat(rx,ry){
    ctx.beginPath();
    ctx.moveTo(-rx*0.66,-ry*0.5);ctx.lineTo(-rx*0.86,-ry*1.28);ctx.lineTo(-rx*0.16,-ry*0.86);
    ctx.lineTo(rx*0.16,-ry*0.86);ctx.lineTo(rx*0.86,-ry*1.28);ctx.lineTo(rx*0.66,-ry*0.5);
    ctx.quadraticCurveTo(rx*1.06,0,rx*0.72,ry*0.7);
    ctx.quadraticCurveTo(0,ry*1.18,-rx*0.72,ry*0.7);
    ctx.quadraticCurveTo(-rx*1.06,0,-rx*0.66,-ry*0.5);ctx.closePath();
  },
  shard(rx,ry){
    ctx.beginPath();
    ctx.moveTo(-rx*0.2,-ry*1.2);ctx.lineTo(rx*0.95,-ry*0.5);ctx.lineTo(rx*0.45,ry*1.1);
    ctx.lineTo(-rx*0.8,ry*0.6);ctx.lineTo(-rx*0.95,-ry*0.35);ctx.closePath();
  },
  ring(rx,ry){
    ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,TAU);
    ctx.ellipse(0,0,rx*0.42,ry*0.42,0,TAU,0,true);
  },
  crescent(rx,ry){
    ctx.beginPath();ctx.arc(0,0,rx,Math.PI*0.32,Math.PI*1.68);
    ctx.arc(rx*0.42,0,rx*0.86,Math.PI*1.62,Math.PI*0.38,true);ctx.closePath();
  },
  shield(rx,ry){
    ctx.beginPath();
    ctx.moveTo(0,-ry*1.05);ctx.lineTo(rx*0.95,-ry*0.6);
    ctx.quadraticCurveTo(rx*0.95,ry*0.5,0,ry*1.15);
    ctx.quadraticCurveTo(-rx*0.95,ry*0.5,-rx*0.95,-ry*0.6);ctx.closePath();
  },
  pixel(rx,ry){roundRectPath(-rx*0.92,-ry*0.92,rx*1.84,ry*1.84,rx*0.08);}
};
function roundRectPath(x,y,w,h,r){
  r=Math.max(0,Math.min(r,w/2,h/2));
  ctx.beginPath();
  ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
}

/* ---------------- SURFACES (fill the current path) ---------------- */
const SURFACES={
  gloss(S,r,t){
    const g=gcache('gl'+S.c1+S.c2+(r|0),()=>{
      const gr=ctx.createRadialGradient(-r*0.34,-r*0.42,r*0.06,0,0,r*1.24);
      gr.addColorStop(0,shade(S.c1,0.55));gr.addColorStop(0.42,S.c1);
      gr.addColorStop(1,shade(S.c2,-0.32));return gr;});
    ctx.fillStyle=g;ctx.fill();
  },
  matte(S,r){
    const g=gcache('mt'+S.c1+S.c2+(r|0),()=>{
      const gr=ctx.createLinearGradient(0,-r,0,r);
      gr.addColorStop(0,shade(S.c1,0.16));gr.addColorStop(1,shade(S.c2,-0.2));return gr;});
    ctx.fillStyle=g;ctx.fill();
  },
  metal(S,r){
    const g=gcache('me'+S.c1+S.c2+(r|0),()=>{
      const gr=ctx.createLinearGradient(-r,-r,r,r);
      gr.addColorStop(0,shade(S.c2,-0.4));gr.addColorStop(0.28,shade(S.c1,0.7));
      gr.addColorStop(0.45,S.c1);gr.addColorStop(0.6,shade(S.c2,-0.35));
      gr.addColorStop(0.78,shade(S.c1,0.5));gr.addColorStop(1,shade(S.c2,-0.5));return gr;});
    ctx.fillStyle=g;ctx.fill();
  },
  holo(S,r,t){
    const gr=ctx.createLinearGradient(-r,-r,r,r);
    const h=(t*36)%360;
    for(let i=0;i<=5;i++)gr.addColorStop(i/5,`hsl(${(h+i*62)%360} 92% ${58+Math.sin(i)*8}%)`);
    ctx.fillStyle=gr;ctx.fill();
    ctx.save();ctx.clip();
    ctx.globalAlpha=0.18;ctx.fillStyle='#fff';
    for(let y=-r;y<r;y+=r*0.22)ctx.fillRect(-r,y+((t*24)%(r*0.22)),r*2,r*0.05);
    ctx.restore();ctx.globalAlpha=1;
  },
  glass(S,r,t){
    const g=gcache('gs'+S.c1+(r|0),()=>{
      const gr=ctx.createRadialGradient(-r*0.3,-r*0.36,r*0.05,0,0,r*1.2);
      gr.addColorStop(0,hexA(S.c1,0.85));gr.addColorStop(0.55,hexA(S.c1,0.35));
      gr.addColorStop(1,hexA(S.c2,0.62));return gr;});
    ctx.fillStyle=g;ctx.fill();
    ctx.save();ctx.clip();
    ctx.strokeStyle='rgba(255,255,255,0.75)';ctx.lineWidth=Math.max(1,r*0.07);
    ctx.beginPath();ctx.arc(0,0,r*0.86,Math.PI*0.78,Math.PI*1.32);ctx.stroke();
    ctx.restore();
  },
  galaxy(S,r,t){
    const g=gcache('ga'+S.c1+S.c2+(r|0),()=>{
      const gr=ctx.createRadialGradient(r*0.12,-r*0.1,r*0.04,0,0,r*1.16);
      gr.addColorStop(0,shade(S.c1,0.7));gr.addColorStop(0.34,S.c1);
      gr.addColorStop(0.72,S.c2);gr.addColorStop(1,'#080714');return gr;});
    ctx.fillStyle=g;ctx.fill();
    ctx.save();ctx.clip();
    ctx.fillStyle='#fff';
    for(let i=0;i<16;i++){
      const a=i*2.399+t*0.22,rr=r*(0.16+((i*37)%100)/125);
      const s=0.6+Math.sin(t*3+i)*0.4;
      ctx.globalAlpha=0.35+s*0.5;
      ctx.fillRect(Math.cos(a)*rr,Math.sin(a)*rr,Math.max(0.8,r*0.05),Math.max(0.8,r*0.05));
    }
    ctx.restore();ctx.globalAlpha=1;
  },
  lava(S,r,t){
    const g=gcache('lv'+S.c1+S.c2+(r|0),()=>{
      const gr=ctx.createRadialGradient(-r*0.2,-r*0.3,r*0.05,0,0,r*1.2);
      gr.addColorStop(0,'#2a1008');gr.addColorStop(0.55,shade(S.c2,-0.5));
      gr.addColorStop(1,'#140505');return gr;});
    ctx.fillStyle=g;ctx.fill();
    ctx.save();ctx.clip();
    ctx.lineCap='round';
    for(let i=0;i<5;i++){
      const ph=t*1.4+i*1.7,a=0.55+Math.sin(ph)*0.4;
      ctx.strokeStyle=hexA(S.c1,a);ctx.lineWidth=Math.max(1,r*(0.09+Math.sin(ph)*0.03));
      ctx.beginPath();
      ctx.moveTo(-r,-r+i*r*0.44);
      ctx.bezierCurveTo(-r*0.3,-r*0.9+i*r*0.44,r*0.3,-r*0.2+i*r*0.44,r,-r*0.5+i*r*0.44);
      ctx.stroke();
    }
    ctx.restore();
  },
  ice(S,r,t){
    const g=gcache('ic'+S.c1+(r|0),()=>{
      const gr=ctx.createLinearGradient(-r*0.7,-r,r*0.6,r);
      gr.addColorStop(0,'#ffffff');gr.addColorStop(0.35,shade(S.c1,0.4));
      gr.addColorStop(1,shade(S.c2,-0.22));return gr;});
    ctx.fillStyle=g;ctx.fill();
    ctx.save();ctx.clip();
    ctx.strokeStyle='rgba(255,255,255,0.6)';ctx.lineWidth=Math.max(0.8,r*0.05);
    for(let i=0;i<4;i++){
      const a=i*0.9+0.4;
      ctx.beginPath();ctx.moveTo(-Math.cos(a)*r,-Math.sin(a)*r);ctx.lineTo(Math.cos(a+1.1)*r,Math.sin(a+1.1)*r);ctx.stroke();
    }
    ctx.restore();
  },
  circuit(S,r,t){
    const g=gcache('ci'+S.c2+(r|0),()=>{
      const gr=ctx.createLinearGradient(0,-r,0,r);
      gr.addColorStop(0,shade(S.c2,0.1));gr.addColorStop(1,shade(S.c2,-0.45));return gr;});
    ctx.fillStyle=g;ctx.fill();
    ctx.save();ctx.clip();
    ctx.strokeStyle=hexA(S.c1,0.55+Math.sin(t*4)*0.3);ctx.lineWidth=Math.max(0.9,r*0.055);
    ctx.lineJoin='round';
    for(let i=0;i<3;i++){
      const o=-r*0.6+i*r*0.6;
      ctx.beginPath();ctx.moveTo(-r,o);ctx.lineTo(-r*0.2,o);ctx.lineTo(0,o+r*0.3);ctx.lineTo(r*0.55,o+r*0.3);ctx.lineTo(r,o-r*0.1);ctx.stroke();
    }
    ctx.fillStyle=S.c1;
    for(let i=0;i<3;i++)ctx.fillRect(-r*0.22,-r*0.62+i*r*0.6-r*0.05,r*0.1,r*0.1);
    ctx.restore();
  },
  plasma(S,r,t){
    const gr=ctx.createRadialGradient(Math.sin(t*1.7)*r*0.25,Math.cos(t*1.3)*r*0.25,r*0.04,0,0,r*1.18);
    gr.addColorStop(0,'#ffffff');gr.addColorStop(0.22,shade(S.c1,0.4));
    gr.addColorStop(0.62,S.c1);gr.addColorStop(1,shade(S.c2,-0.28));
    ctx.fillStyle=gr;ctx.fill();
  },
  fur(S,r,t){
    const g=gcache('fu'+S.c1+S.c2+(r|0),()=>{
      const gr=ctx.createRadialGradient(-r*0.3,-r*0.4,r*0.06,0,0,r*1.2);
      gr.addColorStop(0,shade(S.c1,0.4));gr.addColorStop(1,shade(S.c2,-0.28));return gr;});
    ctx.fillStyle=g;ctx.fill();
    ctx.save();ctx.clip();
    ctx.strokeStyle=hexA(S.c1,0.55);ctx.lineWidth=Math.max(0.7,r*0.045);ctx.lineCap='round';
    for(let i=0;i<22;i++){
      const a=i*2.399,rr=r*0.94;
      const x=Math.cos(a)*rr,y=Math.sin(a)*rr;
      ctx.beginPath();ctx.moveTo(x*0.82,y*0.82);ctx.lineTo(x*1.1,y*1.1);ctx.stroke();
    }
    ctx.restore();
  },
  marble(S,r){
    const g=gcache('ma'+S.c1+S.c2+(r|0),()=>{
      const gr=ctx.createLinearGradient(-r,-r,r,r);
      gr.addColorStop(0,shade(S.c1,0.6));gr.addColorStop(0.5,S.c1);gr.addColorStop(1,shade(S.c2,-0.15));return gr;});
    ctx.fillStyle=g;ctx.fill();
    ctx.save();ctx.clip();
    ctx.strokeStyle=hexA(S.c2,0.5);ctx.lineWidth=Math.max(0.8,r*0.05);
    for(let i=0;i<3;i++){
      ctx.beginPath();ctx.moveTo(-r,-r*0.5+i*r*0.5);
      ctx.bezierCurveTo(-r*0.2,-r*0.9+i*r*0.5,r*0.3,r*0.1+i*r*0.5,r,-r*0.3+i*r*0.5);ctx.stroke();
    }
    ctx.restore();
  },
  neon(S,r,t){
    ctx.fillStyle='#0b0b16';ctx.fill();
    ctx.save();
    ctx.strokeStyle=S.c1;ctx.lineWidth=Math.max(1.6,r*0.13);
    ctx.shadowColor=S.c1;ctx.shadowBlur=r*0.9;
    ctx.stroke();ctx.shadowBlur=0;
    ctx.strokeStyle='#fff';ctx.lineWidth=Math.max(0.7,r*0.05);ctx.stroke();
    ctx.restore();
  },
  void_(S,r,t){
    const gr=ctx.createRadialGradient(0,0,r*0.02,0,0,r*1.15);
    gr.addColorStop(0,'#000');gr.addColorStop(0.7,'#0a0618');
    gr.addColorStop(1,hexA(S.c1,0.9));
    ctx.fillStyle=gr;ctx.fill();
    ctx.save();ctx.clip();
    ctx.strokeStyle=hexA(S.c1,0.5);ctx.lineWidth=Math.max(0.8,r*0.04);
    for(let i=1;i<4;i++){ctx.beginPath();ctx.arc(0,0,r*i*0.28,(t*(0.6+i*0.3))%TAU,(t*(0.6+i*0.3))%TAU+2.2);ctx.stroke();}
    ctx.restore();
  }
};

/* ---------------- PATTERN OVERLAYS ---------------- */
const PATTERNS={
  none(){},
  spots(S,r){ctx.save();ctx.clip();ctx.fillStyle=hexA(S.c2,0.5);
    const p=[[-0.42,-0.3,0.2],[0.38,0.16,0.26],[-0.1,0.5,0.16],[0.5,-0.44,0.15]];
    for(const q of p){ctx.beginPath();ctx.arc(q[0]*r,q[1]*r,q[2]*r,0,TAU);ctx.fill();}ctx.restore();},
  stripes(S,r){ctx.save();ctx.clip();ctx.fillStyle=hexA(S.c2,0.42);
    for(let x=-r;x<r;x+=r*0.36)ctx.fillRect(x,-r,r*0.17,r*2);ctx.restore();},
  bands(S,r){ctx.save();ctx.clip();ctx.fillStyle=hexA(S.c2,0.4);
    for(let y=-r;y<r;y+=r*0.42)ctx.fillRect(-r,y,r*2,r*0.18);ctx.restore();},
  checker(S,r){ctx.save();ctx.clip();ctx.fillStyle=hexA(S.c2,0.38);
    const s=r*0.34;
    for(let i=-3;i<3;i++)for(let j=-3;j<3;j++)if((i+j)&1)ctx.fillRect(i*s,j*s,s,s);ctx.restore();},
  scales(S,r){ctx.save();ctx.clip();ctx.strokeStyle=hexA(S.c2,0.5);ctx.lineWidth=Math.max(0.7,r*0.045);
    for(let y=-r;y<r;y+=r*0.3)for(let x=-r;x<r+r*0.3;x+=r*0.34){
      ctx.beginPath();ctx.arc(x+((Math.round(y/(r*0.3))&1)?r*0.17:0),y,r*0.17,Math.PI,0);ctx.stroke();}
    ctx.restore();},
  bolt(S,r){ctx.save();ctx.clip();ctx.fillStyle=hexA(S.c2,0.85);
    ctx.beginPath();ctx.moveTo(r*0.1,-r*0.72);ctx.lineTo(-r*0.3,r*0.06);ctx.lineTo(-r*0.02,r*0.06);
    ctx.lineTo(-r*0.14,r*0.74);ctx.lineTo(r*0.32,-r*0.08);ctx.lineTo(r*0.04,-r*0.08);ctx.closePath();ctx.fill();ctx.restore();},
  heart(S,r){ctx.save();ctx.clip();ctx.fillStyle=hexA(S.c2,0.75);
    ctx.beginPath();ctx.moveTo(0,r*0.5);
    ctx.bezierCurveTo(-r*0.72,-r*0.06,-r*0.34,-r*0.66,0,-r*0.24);
    ctx.bezierCurveTo(r*0.34,-r*0.66,r*0.72,-r*0.06,0,r*0.5);ctx.fill();ctx.restore();},
  swirl(S,r,t){ctx.save();ctx.clip();ctx.strokeStyle=hexA(S.c2,0.55);ctx.lineWidth=Math.max(1,r*0.09);ctx.lineCap='round';
    ctx.beginPath();
    for(let i=0;i<40;i++){const a=i*0.32+t*0.5,rr=r*i/46;
      const x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
    ctx.stroke();ctx.restore();},
  grid(S,r){ctx.save();ctx.clip();ctx.strokeStyle=hexA(S.c2,0.4);ctx.lineWidth=Math.max(0.6,r*0.04);
    for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*r*0.4,-r);ctx.lineTo(i*r*0.4,r);ctx.stroke();
      ctx.beginPath();ctx.moveTo(-r,i*r*0.4);ctx.lineTo(r,i*r*0.4);ctx.stroke();}ctx.restore();},
  star(S,r){ctx.save();ctx.clip();ctx.fillStyle=hexA(S.c2,0.8);
    ctx.beginPath();
    for(let i=0;i<10;i++){const a=i/10*TAU-Math.PI/2,rr=(i%2?0.2:0.48)*r;
      const x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
    ctx.fill();ctx.restore();}
};

/* ---------------- HEADGEAR / ACCESSORIES ---------------- */
const HATS={
  none(){},
  crown(S,r,t){
    ctx.fillStyle=S.a||'#ffd94d';
    ctx.beginPath();
    ctx.moveTo(-r*0.62,-r*0.86);ctx.lineTo(-r*0.62,-r*1.42);ctx.lineTo(-r*0.3,-r*1.1);
    ctx.lineTo(0,-r*1.56);ctx.lineTo(r*0.3,-r*1.1);ctx.lineTo(r*0.62,-r*1.42);
    ctx.lineTo(r*0.62,-r*0.86);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.55)';ctx.fillRect(-r*0.62,-r*1.0,r*1.24,r*0.08);
  },
  halo(S,r,t){
    ctx.save();
    ctx.strokeStyle='#ffe98a';ctx.lineWidth=Math.max(1.4,r*0.11);
    ctx.shadowColor='#ffe98a';ctx.shadowBlur=r*0.7;
    ctx.beginPath();ctx.ellipse(0,-r*1.42,r*0.68,r*0.2,0,0,TAU);ctx.stroke();
    ctx.restore();
  },
  horns(S,r){
    ctx.fillStyle=S.a||'#e8e2d0';
    for(const s of[-1,1]){
      ctx.beginPath();
      ctx.moveTo(s*r*0.5,-r*0.72);
      ctx.quadraticCurveTo(s*r*1.12,-r*1.16,s*r*0.86,-r*1.62);
      ctx.quadraticCurveTo(s*r*0.62,-r*1.14,s*r*0.24,-r*0.86);
      ctx.closePath();ctx.fill();
    }
  },
  ears(S,r){
    ctx.fillStyle=S.c1;
    for(const s of[-1,1]){
      ctx.beginPath();
      ctx.moveTo(s*r*0.28,-r*0.8);ctx.lineTo(s*r*0.68,-r*1.5);ctx.lineTo(s*r*0.82,-r*0.62);ctx.closePath();ctx.fill();
      ctx.fillStyle=hexA(S.c2,0.85);
      ctx.beginPath();
      ctx.moveTo(s*r*0.42,-r*0.82);ctx.lineTo(s*r*0.63,-r*1.24);ctx.lineTo(s*r*0.7,-r*0.72);ctx.closePath();ctx.fill();
      ctx.fillStyle=S.c1;
    }
  },
  bunny(S,r){
    ctx.fillStyle=shade(S.c1,0.3);
    for(const s of[-1,1]){
      ctx.save();ctx.rotate(s*0.2);
      ctx.beginPath();ctx.ellipse(s*r*0.34,-r*1.32,r*0.19,r*0.6,0,0,TAU);ctx.fill();
      ctx.fillStyle=hexA('#ff9ec4',0.8);
      ctx.beginPath();ctx.ellipse(s*r*0.34,-r*1.32,r*0.09,r*0.42,0,0,TAU);ctx.fill();
      ctx.fillStyle=shade(S.c1,0.3);ctx.restore();
    }
  },
  antenna(S,r,t){
    ctx.strokeStyle=shade(S.c2,-0.1);ctx.lineWidth=Math.max(1,r*0.08);ctx.lineCap='round';
    const sw=Math.sin(t*3)*r*0.12;
    ctx.beginPath();ctx.moveTo(0,-r*0.82);ctx.quadraticCurveTo(sw,-r*1.2,sw*1.6,-r*1.48);ctx.stroke();
    ctx.fillStyle=S.a||'#4dffa6';
    ctx.save();ctx.shadowColor=S.a||'#4dffa6';ctx.shadowBlur=r*0.6;
    ctx.beginPath();ctx.arc(sw*1.6,-r*1.5,r*0.16,0,TAU);ctx.fill();ctx.restore();
  },
  visor(S,r,t){
    ctx.save();
    ctx.fillStyle=hexA(S.a||'#4dd2ff',0.55);
    roundRectPath(-r*0.92,-r*0.34,r*1.84,r*0.44,r*0.2);ctx.fill();
    ctx.strokeStyle=S.a||'#4dd2ff';ctx.lineWidth=Math.max(1,r*0.06);ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,0.6)';
    ctx.fillRect(-r*0.78,-r*0.28,r*0.5,r*0.07);
    ctx.restore();
  },
  cap(S,r){
    ctx.fillStyle=S.a||'#ff4d6d';
    ctx.beginPath();ctx.arc(0,-r*0.72,r*0.86,Math.PI,0);ctx.closePath();ctx.fill();
    ctx.fillStyle=shade(S.a||'#ff4d6d',-0.3);
    roundRectPath(-r*0.1,-r*0.82,r*1.5,r*0.2,r*0.09);ctx.fill();
  },
  tophat(S,r){
    ctx.fillStyle='#14141f';
    roundRectPath(-r*1.02,-r*0.98,r*2.04,r*0.16,r*0.06);ctx.fill();
    roundRectPath(-r*0.6,-r*1.74,r*1.2,r*0.82,r*0.06);ctx.fill();
    ctx.fillStyle=S.a||'#ff4d6d';ctx.fillRect(-r*0.6,-r*1.16,r*1.2,r*0.16);
  },
  headphones(S,r){
    ctx.strokeStyle='#2b2b3d';ctx.lineWidth=Math.max(1.4,r*0.12);
    ctx.beginPath();ctx.arc(0,-r*0.16,r*1.0,Math.PI*1.12,Math.PI*1.88);ctx.stroke();
    ctx.fillStyle=S.a||'#c084fc';
    for(const s of[-1,1]){roundRectPath(s*r*0.98-r*0.2,-r*0.36,r*0.4,r*0.62,r*0.16);ctx.fill();}
  },
  wings(S,r,t){
    const f=Math.sin(t*7)*0.22;
    ctx.fillStyle=hexA(S.a||'#ffffff',0.82);
    for(const s of[-1,1]){
      ctx.save();ctx.rotate(s*(0.3+f));
      ctx.beginPath();
      ctx.moveTo(s*r*0.7,-r*0.1);
      ctx.quadraticCurveTo(s*r*1.9,-r*0.9,s*r*1.62,r*0.36);
      ctx.quadraticCurveTo(s*r*1.24,r*0.1,s*r*0.7,-r*0.1);
      ctx.fill();ctx.restore();
    }
  },
  flametop(S,r,t){
    for(let i=0;i<3;i++){
      const w=1-i*0.28,ph=t*6+i*1.3;
      ctx.fillStyle=hexA(i?(i>1?'#ffe98a':'#ff9e4d'):'#ff4d3d',0.9);
      ctx.beginPath();
      ctx.moveTo(-r*0.42*w,-r*0.8);
      ctx.quadraticCurveTo(-r*0.2*w,-r*(1.3+Math.sin(ph)*0.12)*w-r*0.2,0,-r*(1.72+Math.sin(ph)*0.14)*w);
      ctx.quadraticCurveTo(r*0.2*w,-r*(1.3+Math.cos(ph)*0.12)*w-r*0.2,r*0.42*w,-r*0.8);
      ctx.closePath();ctx.fill();
    }
  },
  moons(S,r,t){
    ctx.save();
    for(let i=0;i<3;i++){
      const a=t*1.3+i*TAU/3;
      const x=Math.cos(a)*r*1.5,y=Math.sin(a)*r*0.52-r*0.1;
      ctx.fillStyle=S.a||'#6ee7ff';
      ctx.globalAlpha=0.55+0.45*Math.sin(a);
      ctx.beginPath();ctx.arc(x,y,r*0.17,0,TAU);ctx.fill();
    }
    ctx.restore();ctx.globalAlpha=1;
  },
  thirdeye(S,r,t){
    ctx.fillStyle='#fff';
    ctx.beginPath();ctx.ellipse(0,-r*0.56,r*0.24,r*0.17,0,0,TAU);ctx.fill();
    ctx.fillStyle=S.a||'#c084fc';
    ctx.beginPath();ctx.arc(Math.sin(t)*r*0.06,-r*0.56,r*0.1,0,TAU);ctx.fill();
  },
  leaf(S,r,t){
    ctx.strokeStyle='#4d9e3a';ctx.lineWidth=Math.max(1,r*0.07);
    ctx.beginPath();ctx.moveTo(0,-r*0.86);ctx.quadraticCurveTo(r*0.1,-r*1.16,r*0.06,-r*1.32);ctx.stroke();
    ctx.fillStyle='#6ddc4a';
    ctx.save();ctx.translate(r*0.06,-r*1.32);ctx.rotate(Math.sin(t*2)*0.16);
    ctx.beginPath();ctx.ellipse(r*0.28,-r*0.08,r*0.3,r*0.15,-0.5,0,TAU);ctx.fill();ctx.restore();
  },
  sparkles(S,r,t){
    ctx.fillStyle=S.a||'#ffe98a';
    for(let i=0;i<4;i++){
      const a=t*1.6+i*TAU/4,rr=r*(1.28+Math.sin(t*3+i)*0.14);
      const x=Math.cos(a)*rr,y=Math.sin(a)*rr*0.72;
      const s=r*0.13*(0.6+0.4*Math.sin(t*5+i));
      ctx.beginPath();
      ctx.moveTo(x,y-s);ctx.lineTo(x+s*0.32,y);ctx.lineTo(x,y+s);ctx.lineTo(x-s*0.32,y);ctx.closePath();ctx.fill();
    }
  },
  bow(S,r){
    ctx.fillStyle=S.a||'#ff6b9d';
    for(const s of[-1,1]){
      ctx.beginPath();ctx.ellipse(s*r*0.5,-r*0.98,r*0.3,r*0.2,s*0.5,0,TAU);ctx.fill();
    }
    ctx.fillStyle=shade(S.a||'#ff6b9d',-0.25);
    ctx.beginPath();ctx.arc(0,-r*0.98,r*0.13,0,TAU);ctx.fill();
  },
  bolt(S,r,t){
    ctx.fillStyle=S.a||'#ffd94d';
    ctx.save();ctx.shadowColor=S.a||'#ffd94d';ctx.shadowBlur=r*(0.5+Math.sin(t*8)*0.25);
    ctx.beginPath();
    ctx.moveTo(r*0.12,-r*1.62);ctx.lineTo(-r*0.28,-r*0.88);ctx.lineTo(0,-r*0.88);
    ctx.lineTo(-r*0.1,-r*0.5);ctx.lineTo(r*0.34,-r*1.2);ctx.lineTo(r*0.06,-r*1.2);ctx.closePath();ctx.fill();
    ctx.restore();
  }
};

/* ---------------- AURAS (behind body) ---------------- */
const AURAS={
  none(){},
  glow(S,r,t){
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=0.34+Math.sin(t*2.4)*0.09;
    const g=ctx.createRadialGradient(0,0,r*0.3,0,0,r*2.5);
    g.addColorStop(0,hexA(S.a||S.c1,0.85));g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r*2.5,0,TAU);ctx.fill();ctx.restore();
  },
  ring(S,r,t){
    ctx.save();ctx.rotate(t*0.9);
    ctx.strokeStyle=hexA(S.a||S.c1,0.6);ctx.lineWidth=Math.max(1.2,r*0.09);
    ctx.setLineDash([r*0.5,r*0.34]);
    ctx.beginPath();ctx.ellipse(0,0,r*1.7,r*0.62,0.36,0,TAU);ctx.stroke();
    ctx.setLineDash([]);ctx.restore();
  },
  orbit(S,r,t){
    ctx.save();
    ctx.strokeStyle=hexA(S.a||S.c1,0.32);ctx.lineWidth=Math.max(0.8,r*0.05);
    ctx.beginPath();ctx.ellipse(0,0,r*1.78,r*0.6,0.4,0,TAU);ctx.stroke();
    const a=t*2.1;
    ctx.fillStyle=S.a||S.c1;
    ctx.beginPath();ctx.arc(Math.cos(a)*r*1.78*Math.cos(0.4)-Math.sin(a)*r*0.6*Math.sin(0.4),
      Math.cos(a)*r*1.78*Math.sin(0.4)+Math.sin(a)*r*0.6*Math.cos(0.4),r*0.14,0,TAU);ctx.fill();
    ctx.restore();
  },
  spark(S,r,t){
    ctx.save();ctx.globalCompositeOperation='lighter';
    ctx.strokeStyle=hexA(S.a||'#6ee7ff',0.75);ctx.lineWidth=Math.max(0.9,r*0.055);ctx.lineCap='round';
    for(let i=0;i<4;i++){
      const a=t*3+i*TAU/4;
      const r0=r*1.15,r1=r*(1.45+Math.sin(t*11+i)*0.2);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a)*r0,Math.sin(a)*r0);
      ctx.lineTo(Math.cos(a+0.16)*r1,Math.sin(a+0.16)*r1);
      ctx.stroke();
    }
    ctx.restore();
  },
  petals(S,r,t){
    ctx.save();
    for(let i=0;i<6;i++){
      const a=t*0.8+i*TAU/6,rr=r*(1.5+Math.sin(t*2+i)*0.12);
      ctx.globalAlpha=0.45+0.3*Math.sin(t*2+i);
      ctx.fillStyle=S.a||'#ff9ec4';
      ctx.save();ctx.translate(Math.cos(a)*rr,Math.sin(a)*rr*0.75);ctx.rotate(a);
      ctx.beginPath();ctx.ellipse(0,0,r*0.2,r*0.09,0,0,TAU);ctx.fill();ctx.restore();
    }
    ctx.restore();ctx.globalAlpha=1;
  },
  shadowflame(S,r,t){
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(let i=0;i<5;i++){
      const ph=t*3+i*1.26;
      ctx.globalAlpha=0.16+0.1*Math.sin(ph);
      ctx.fillStyle=S.a||'#7c3aed';
      ctx.beginPath();
      ctx.ellipse(Math.sin(ph)*r*0.35,-r*(0.6+i*0.32),r*(0.5-i*0.07),r*(0.62-i*0.08),0,0,TAU);
      ctx.fill();
    }
    ctx.restore();ctx.globalAlpha=1;
  }
};

/* ---------------- FACE ---------------- */
function drawSkinFace(S,r,o){
  const lx=clamp(o.look,-1,1)*r*0.28, ly=clamp(o.lookY,-1,1)*r*0.22;
  const eyeC=S.eye||'#0a0a14';
  const ex=r*0.28, ey=-r*0.08;
  if(S.face==='visorface'){
    ctx.fillStyle=eyeC;
    roundRectPath(-r*0.62+lx,ey-r*0.14,r*1.24,r*0.28,r*0.13);ctx.fill();
    ctx.fillStyle=S.a||'#4dffa6';
    roundRectPath(-r*0.52+lx,ey-r*0.07,r*0.34,r*0.14,r*0.06);ctx.fill();
    roundRectPath(r*0.18+lx,ey-r*0.07,r*0.34,r*0.14,r*0.06);ctx.fill();
    return;
  }
  if(S.face==='cyclops'){
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(lx,ey,r*0.34,0,TAU);ctx.fill();
    if(!o.blink){ctx.fillStyle=eyeC;ctx.beginPath();ctx.arc(lx+lx*0.2,ey+ly,r*0.17,0,TAU);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.9)';ctx.beginPath();ctx.arc(lx+lx*0.2-r*0.06,ey+ly-r*0.06,r*0.05,0,TAU);ctx.fill();}
    else{ctx.fillStyle=eyeC;ctx.fillRect(lx-r*0.3,ey-r*0.03,r*0.6,r*0.07);}
    return;
  }
  if(o.blink){
    ctx.fillStyle=eyeC;ctx.lineCap='round';
    ctx.fillRect(-ex-r*0.17+lx,ey-r*0.03,r*0.34,r*0.075);
    ctx.fillRect( ex-r*0.17+lx,ey-r*0.03,r*0.34,r*0.075);
    return;
  }
  // HD eye: sclera + iris + pupil + catchlight
  if(S.face==='bigeyes'||S.face===undefined||S.face==='dot'){
    const R=S.face==='bigeyes'?0.24:0.155;
    if(S.face==='bigeyes'){
      ctx.fillStyle='#fff';
      ctx.beginPath();ctx.arc(-ex+lx,ey,r*R*1.3,0,TAU);ctx.arc(ex+lx,ey,r*R*1.3,0,TAU);ctx.fill();
      ctx.fillStyle=S.iris||'#2b6cff';
      ctx.beginPath();ctx.arc(-ex+lx*1.2,ey+ly,r*R*0.8,0,TAU);ctx.arc(ex+lx*1.2,ey+ly,r*R*0.8,0,TAU);ctx.fill();
    }
    ctx.fillStyle=eyeC;
    ctx.beginPath();ctx.arc(-ex+lx*1.2,ey+ly,r*R*(S.face==='bigeyes'?0.45:1),0,TAU);
    ctx.arc(ex+lx*1.2,ey+ly,r*R*(S.face==='bigeyes'?0.45:1),0,TAU);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.92)';
    ctx.beginPath();ctx.arc(-ex+lx*1.2-r*0.05,ey+ly-r*0.05,r*0.045,0,TAU);
    ctx.arc(ex+lx*1.2-r*0.05,ey+ly-r*0.05,r*0.045,0,TAU);ctx.fill();
    return;
  }
  if(S.face==='angry'){
    ctx.fillStyle=eyeC;
    ctx.beginPath();ctx.arc(-ex+lx,ey+r*0.04,r*0.15,0,TAU);ctx.arc(ex+lx,ey+r*0.04,r*0.15,0,TAU);ctx.fill();
    ctx.strokeStyle=eyeC;ctx.lineWidth=Math.max(1.4,r*0.08);ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-ex-r*0.2+lx,ey-r*0.26);ctx.lineTo(-ex+r*0.16+lx,ey-r*0.12);
    ctx.moveTo(ex+r*0.2+lx,ey-r*0.26);ctx.lineTo(ex-r*0.16+lx,ey-r*0.12);ctx.stroke();
    return;
  }
  if(S.face==='glow'){
    ctx.save();ctx.shadowColor=S.a||'#4dffa6';ctx.shadowBlur=r*0.7;
    ctx.fillStyle=S.a||'#4dffa6';
    ctx.beginPath();ctx.arc(-ex+lx,ey+ly,r*0.14,0,TAU);ctx.arc(ex+lx,ey+ly,r*0.14,0,TAU);ctx.fill();
    ctx.restore();return;
  }
  if(S.face==='sleepy'){
    ctx.strokeStyle=eyeC;ctx.lineWidth=Math.max(1.4,r*0.08);ctx.lineCap='round';
    ctx.beginPath();ctx.arc(-ex+lx,ey+r*0.06,r*0.17,Math.PI*1.1,Math.PI*1.9);
    ctx.arc(ex+lx,ey+r*0.06,r*0.17,Math.PI*1.1,Math.PI*1.9);ctx.stroke();return;
  }
  if(S.face==='x'){
    ctx.strokeStyle=eyeC;ctx.lineWidth=Math.max(1.5,r*0.085);ctx.lineCap='round';
    for(const s of[-1,1]){
      ctx.beginPath();
      ctx.moveTo(s*ex-r*0.12+lx,ey-r*0.12);ctx.lineTo(s*ex+r*0.12+lx,ey+r*0.12);
      ctx.moveTo(s*ex+r*0.12+lx,ey-r*0.12);ctx.lineTo(s*ex-r*0.12+lx,ey+r*0.12);ctx.stroke();
    }
    return;
  }
  // fallback
  ctx.fillStyle=eyeC;
  ctx.beginPath();ctx.arc(-ex+lx,ey+ly,r*0.15,0,TAU);ctx.arc(ex+lx,ey+ly,r*0.15,0,TAU);ctx.fill();
}
function drawSkinMouth(S,r,o){
  if(S.face==='visorface'||S.face==='cyclops')return;
  const lx=clamp(o.look,-1,1)*r*0.28, ly=clamp(o.lookY,-1,1)*r*0.22;
  ctx.strokeStyle=S.eye||'#0a0a14';
  ctx.lineWidth=Math.max(1.5,r*0.09);ctx.lineCap='round';
  ctx.beginPath();
  if(o.mood==='hurt'){ctx.moveTo(-r*0.18+lx,r*0.34+ly);ctx.lineTo(r*0.18+lx,r*0.28+ly);}
  else if(o.mood==='hype'){ctx.arc(lx,r*0.2+ly,r*0.26,0.15*Math.PI,0.85*Math.PI);}
  else{ctx.arc(lx,r*0.22+ly,r*0.18,0.2*Math.PI,0.8*Math.PI);}
  ctx.stroke();
  if(S.fangs){
    ctx.fillStyle='#fff';
    for(const s of[-1,1]){
      ctx.beginPath();
      ctx.moveTo(s*r*0.16+lx,r*0.24+ly);ctx.lineTo(s*r*0.25+lx,r*0.24+ly);ctx.lineTo(s*r*0.2+lx,r*0.42+ly);
      ctx.closePath();ctx.fill();
    }
  }
}

/* ---------------- MAIN SKIN RENDERER ---------------- */
function drawSkinAt(x,y,r,S,o){
  o=o||{};
  const t=o.t||0;
  const sq=clamp(o.squish||0,-0.4,0.4);
  const rx=r*(1+sq),ry=r*(1-sq);
  ctx.save();ctx.translate(x,y);
  if(S.rot)ctx.rotate(Math.sin(t*1.4)*S.rot);
  // AURA
  (AURAS[S.aura]||AURAS.none)(S,r,t);
  // BODY
  (SHAPES[S.shape]||SHAPES.orb)(rx,ry,t);
  ctx.save();
  (SURFACES[S.surf]||SURFACES.gloss)(S,r,t);
  ctx.restore();
  // PATTERN (re-path so the clip is correct)
  if(S.pat&&S.pat!=='none'){
    (SHAPES[S.shape]||SHAPES.orb)(rx,ry,t);
    (PATTERNS[S.pat]||PATTERNS.none)(S,r,t);
  }
  // RIM LIGHT — the single biggest "HD" tell
  (SHAPES[S.shape]||SHAPES.orb)(rx,ry,t);
  ctx.save();ctx.clip();
  ctx.strokeStyle='rgba(255,255,255,0.5)';
  ctx.lineWidth=Math.max(1,r*0.1);
  (SHAPES[S.shape]||SHAPES.orb)(rx*0.99,ry*0.99,t);
  ctx.stroke();
  ctx.strokeStyle=hexA(S.c2,0.65);ctx.lineWidth=Math.max(1,r*0.16);
  ctx.save();ctx.translate(r*0.1,r*0.14);
  (SHAPES[S.shape]||SHAPES.orb)(rx*0.98,ry*0.98,t);ctx.stroke();ctx.restore();
  ctx.restore();
  // SPECULAR
  if(S.surf!=='neon'&&S.surf!=='void_'){
    ctx.save();
    (SHAPES[S.shape]||SHAPES.orb)(rx,ry,t);ctx.clip();
    ctx.globalAlpha=0.55;ctx.fillStyle='#fff';
    ctx.beginPath();ctx.ellipse(-r*0.34,-r*0.44,r*0.2,r*0.12,-0.6,0,TAU);ctx.fill();
    ctx.globalAlpha=0.28;
    ctx.beginPath();ctx.ellipse(-r*0.16,-r*0.56,r*0.08,r*0.05,-0.6,0,TAU);ctx.fill();
    ctx.restore();ctx.globalAlpha=1;
  }
  // FACE
  drawSkinFace(S,r,o);
  drawSkinMouth(S,r,o);
  // HAT
  (HATS[S.hat]||HATS.none)(S,r,t);
  ctx.restore();
}

/* ---------------- THE 100 SKINS ----------------
   free:true  -> available from first launch
   Everything else unlocks from an achievement or costs bits.
------------------------------------------------- */
function SK(id,name,rar,d){return Object.assign({id,name,rar},d);}
const SKINS=[
  /* ---- STARTERS (8 free) ---- */
  SK('bit','BIT','common',{shape:'orb',surf:'gloss',c1:'#ffffff',c2:'#c9d4e0',free:true}),
  SK('sky','SKYBIT','common',{shape:'orb',surf:'gloss',c1:'#4dd2ff',c2:'#1e6f9e',free:true}),
  SK('rose','ROSEBIT','common',{shape:'orb',surf:'gloss',c1:'#ff6b9d',c2:'#a8365f',free:true}),
  SK('mint','MINTBIT','common',{shape:'orb',surf:'gloss',c1:'#4dffa6',c2:'#1d8a58',free:true}),
  SK('amber','AMBERBIT','common',{shape:'orb',surf:'gloss',c1:'#ffd94d',c2:'#a37c12',free:true}),
  SK('violet','VIOLETBIT','common',{shape:'orb',surf:'gloss',c1:'#c084fc',c2:'#6b34a8',free:true}),
  SK('coal','COALBIT','common',{shape:'orb',surf:'gloss',c1:'#6b7280',c2:'#2a2f3a',eye:'#e8ecf2',free:true}),
  SK('cube','CUBIT','common',{shape:'cube',surf:'matte',c1:'#f1f5f9',c2:'#94a3b8',free:true}),

  /* ---- COMMON SHAPES ---- */
  SK('egg','EGGBIT','common',{shape:'egg',surf:'gloss',c1:'#fff7e6',c2:'#d8c39a'}),
  SK('hexbit','HEXBIT','common',{shape:'hex',surf:'matte',c1:'#7dd3fc',c2:'#0369a1'}),
  SK('drip','DRIPBIT','common',{shape:'drop',surf:'gloss',c1:'#60a5fa',c2:'#1e40af'}),
  SK('blobby','BLOBBY','common',{shape:'blob',surf:'gloss',c1:'#a3e635',c2:'#4d7c0f'}),
  SK('pix','PIXBIT','common',{shape:'pixel',surf:'matte',c1:'#e2e8f0',c2:'#64748b',pat:'grid'}),
  SK('starlet','STARLET','common',{shape:'star',surf:'gloss',c1:'#ffe98a',c2:'#c99a19'}),
  SK('boo','BOOBIT','common',{shape:'ghost',surf:'gloss',c1:'#f8fafc',c2:'#a5b4c8',face:'sleepy'}),
  SK('shieldy','BULWARK','common',{shape:'shield',surf:'metal',c1:'#cbd5e1',c2:'#475569'}),
  SK('shardy','SHARDBIT','common',{shape:'shard',surf:'gloss',c1:'#a78bfa',c2:'#5b21b6'}),
  SK('donut','DONUTBIT','common',{shape:'ring',surf:'gloss',c1:'#fbbf24',c2:'#b45309',face:'dot'}),
  SK('lunar','LUNARBIT','common',{shape:'crescent',surf:'matte',c1:'#e5e7eb',c2:'#9ca3af'}),
  SK('gemmy','GEMBIT','common',{shape:'gem',surf:'gloss',c1:'#67e8f9',c2:'#0e7490'}),

  /* ---- PATTERNED ---- */
  SK('ladybug','LADYBIT','common',{shape:'orb',surf:'gloss',c1:'#ef4444',c2:'#7f1d1d',pat:'spots'}),
  SK('tiger','TIGERBIT','common',{shape:'orb',surf:'fur',c1:'#fb923c',c2:'#1c1917',pat:'stripes'}),
  SK('bee','BEEBIT','common',{shape:'egg',surf:'gloss',c1:'#facc15',c2:'#1c1917',pat:'bands',hat:'antenna',a:'#facc15'}),
  SK('racer','RACERBIT','common',{shape:'orb',surf:'gloss',c1:'#f8fafc',c2:'#0f172a',pat:'checker'}),
  SK('lizard','SCALEBIT','common',{shape:'egg',surf:'matte',c1:'#22c55e',c2:'#14532d',pat:'scales'}),
  SK('sweetheart','SWEETBIT','common',{shape:'orb',surf:'gloss',c1:'#fda4af',c2:'#e11d48',pat:'heart'}),
  SK('candy','CANDYBIT','common',{shape:'orb',surf:'gloss',c1:'#f9a8d4',c2:'#a21caf',pat:'swirl'}),
  SK('nightsky','NIGHTBIT','common',{shape:'orb',surf:'matte',c1:'#1e1b4b',c2:'#0b0a1f',pat:'star',eye:'#e0e7ff'}),
  SK('volt','VOLTBIT','common',{shape:'orb',surf:'gloss',c1:'#fde047',c2:'#a16207',pat:'bolt'}),

  /* ---- CREATURES ---- */
  SK('kitty','KITTYBIT','rare',{shape:'orb',surf:'fur',c1:'#fbbf24',c2:'#92400e',hat:'ears',face:'bigeyes',iris:'#3ba55d'}),
  SK('voidcat','VOID CAT','epic',{shape:'cat',surf:'void_',c1:'#7c3aed',c2:'#1e1b4b',eye:'#a78bfa',face:'glow',a:'#a78bfa',aura:'shadowflame'}),
  SK('bunbun','BUNBIT','rare',{shape:'egg',surf:'fur',c1:'#fce7f3',c2:'#d8b4c8',hat:'bunny',face:'bigeyes',iris:'#e11d48'}),
  SK('foxy','FOXBIT','rare',{shape:'orb',surf:'fur',c1:'#f97316',c2:'#7c2d12',hat:'ears',fangs:true}),
  SK('pandy','PANDABIT','rare',{shape:'orb',surf:'fur',c1:'#f8fafc',c2:'#1c1917',hat:'ears',pat:'spots'}),
  SK('dragon','DRAKEBIT','epic',{shape:'egg',surf:'metal',c1:'#22c55e',c2:'#14532d',hat:'horns',fangs:true,pat:'scales',a:'#fde047'}),
  SK('imp','IMPBIT','rare',{shape:'orb',surf:'gloss',c1:'#ef4444',c2:'#7f1d1d',hat:'horns',face:'angry',fangs:true,a:'#1c1917'}),
  SK('angel','SERAPHBIT','epic',{shape:'orb',surf:'gloss',c1:'#fef9c3',c2:'#d9c98a',hat:'halo',aura:'glow',a:'#ffe98a'}),
  SK('slime','SLIMEBIT','rare',{shape:'blob',surf:'glass',c1:'#4ade80',c2:'#166534',face:'bigeyes',iris:'#052e16'}),
  SK('jelly','JELLYBIT','rare',{shape:'blob',surf:'glass',c1:'#c4b5fd',c2:'#6d28d9',aura:'glow',a:'#c4b5fd'}),
  SK('spooky','SPECTREBIT','epic',{shape:'ghost',surf:'glass',c1:'#e0f2fe',c2:'#7dd3fc',face:'x',aura:'glow',a:'#7dd3fc'}),
  SK('birb','BIRBIT','rare',{shape:'egg',surf:'matte',c1:'#38bdf8',c2:'#0c4a6e',hat:'wings',face:'bigeyes',iris:'#f59e0b',a:'#bae6fd'}),

  /* ---- ELEMENTS ---- */
  SK('ember','EMBERBIT','rare',{shape:'orb',surf:'lava',c1:'#ff6b35',c2:'#7c2d12',hat:'flametop',eye:'#fff7ed',aura:'glow',a:'#ff6b35'}),
  SK('magma','MAGMABIT','epic',{shape:'gem',surf:'lava',c1:'#f97316',c2:'#450a0a',eye:'#fff',aura:'shadowflame',a:'#f97316'}),
  SK('frost','FROSTBIT','rare',{shape:'gem',surf:'ice',c1:'#bae6fd',c2:'#0284c7',aura:'spark',a:'#e0f2fe'}),
  SK('glacier','GLACIERBIT','epic',{shape:'crystal',surf:'ice',c1:'#e0f2fe',c2:'#0369a1',aura:'glow',a:'#7dd3fc'}),
  SK('tide','TIDEBIT','rare',{shape:'drop',surf:'glass',c1:'#22d3ee',c2:'#0e7490',aura:'ring',a:'#67e8f9'}),
  SK('gale','GALEBIT','rare',{shape:'blob',surf:'glass',c1:'#e2e8f0',c2:'#94a3b8',aura:'orbit',a:'#cbd5e1'}),
  SK('terra','TERRABIT','rare',{shape:'hex',surf:'marble',c1:'#a8a29e',c2:'#44403c',hat:'leaf'}),
  SK('bloom','BLOOMBIT','rare',{shape:'orb',surf:'gloss',c1:'#f9a8d4',c2:'#be185d',aura:'petals',hat:'leaf',a:'#fbcfe8'}),
  SK('thunder','THUNDERBIT','epic',{shape:'orb',surf:'plasma',c1:'#fde047',c2:'#713f12',hat:'bolt',aura:'spark',a:'#fde047',face:'glow'}),
  SK('toxic','TOXICBIT','rare',{shape:'blob',surf:'plasma',c1:'#a3e635',c2:'#3f6212',face:'x',aura:'glow',a:'#a3e635'}),

  /* ---- TECH ---- */
  SK('robo','ROBOBIT','rare',{shape:'cube',surf:'metal',c1:'#cbd5e1',c2:'#334155',face:'visorface',a:'#ef4444',hat:'antenna'}),
  SK('circuitry','CIRCUITBIT','rare',{shape:'cube',surf:'circuit',c1:'#4ade80',c2:'#052e16',face:'glow',a:'#4ade80'}),
  SK('neonbit','NEONBIT','epic',{shape:'orb',surf:'neon',c1:'#f0abfc',c2:'#701a75',face:'glow',a:'#f0abfc'}),
  SK('vapor','VAPORBIT','epic',{shape:'orb',surf:'holo',c1:'#f0abfc',c2:'#22d3ee',face:'visorface',a:'#22d3ee'}),
  SK('glitchy','GLITCHBIT','epic',{shape:'pixel',surf:'holo',c1:'#22d3ee',c2:'#f43f5e',face:'x',rot:0.06}),
  SK('dj','DJBIT','rare',{shape:'orb',surf:'gloss',c1:'#818cf8',c2:'#3730a3',hat:'headphones',a:'#f472b6'}),
  SK('visorbit','SCANBIT','rare',{shape:'egg',surf:'metal',c1:'#94a3b8',c2:'#1e293b',hat:'visor',a:'#4dd2ff',face:'glow'}),
  SK('drone','DRONEBIT','rare',{shape:'hex',surf:'metal',c1:'#a1a1aa',c2:'#27272a',face:'cyclops',aura:'orbit',a:'#ef4444'}),
  SK('ai','ORACLEBIT','legendary',{shape:'orb',surf:'circuit',c1:'#22d3ee',c2:'#0f172a',hat:'thirdeye',aura:'ring',a:'#22d3ee',face:'glow'}),

  /* ---- COSMIC ---- */
  SK('nebula','NEBULABIT','epic',{shape:'orb',surf:'galaxy',c1:'#a855f7',c2:'#1e1b4b',aura:'glow',a:'#a855f7'}),
  SK('quasar','QUASARBIT','legendary',{shape:'orb',surf:'galaxy',c1:'#22d3ee',c2:'#0c0a1f',aura:'orbit',hat:'moons',a:'#67e8f9',face:'glow'}),
  SK('comet','COMETBIT','epic',{shape:'drop',surf:'plasma',c1:'#bae6fd',c2:'#1d4ed8',aura:'spark',a:'#bae6fd',rot:0.1}),
  SK('eclipse','ECLIPSEBIT','legendary',{shape:'crescent',surf:'void_',c1:'#fbbf24',c2:'#0a0a14',aura:'glow',a:'#fbbf24',eye:'#fbbf24',face:'glow'}),
  SK('supernova','NOVABIT','legendary',{shape:'star',surf:'plasma',c1:'#fff7ed',c2:'#f97316',aura:'glow',a:'#fed7aa',face:'glow'}),
  SK('blackhole','SINGULARITY','mythic',{shape:'orb',surf:'void_',c1:'#7c3aed',c2:'#000000',aura:'orbit',a:'#a78bfa',face:'glow',rot:0.14}),
  SK('astronaut','ASTROBIT','epic',{shape:'orb',surf:'glass',c1:'#e0f2fe',c2:'#64748b',hat:'visor',a:'#fbbf24',face:'bigeyes',iris:'#0ea5e9'}),
  SK('starlord','STARSEEKER','legendary',{shape:'star',surf:'holo',c1:'#fde047',c2:'#a855f7',aura:'spark',hat:'sparkles',a:'#fde047'}),

  /* ---- ROYALTY & PRESTIGE ---- */
  SK('royal','ROYALBIT','epic',{shape:'orb',surf:'gloss',c1:'#a855f7',c2:'#4c1d95',hat:'crown',a:'#ffd94d'}),
  SK('goldking','GOLD MONARCH','legendary',{shape:'orb',surf:'metal',c1:'#fcd34d',c2:'#78350f',hat:'crown',aura:'glow',a:'#fde68a'}),
  SK('platinum','PLATINUMBIT','legendary',{shape:'gem',surf:'metal',c1:'#f1f5f9',c2:'#64748b',hat:'crown',aura:'ring',a:'#e2e8f0'}),
  SK('obsidian','OBSIDIANBIT','legendary',{shape:'crystal',surf:'metal',c1:'#475569',c2:'#020617',eye:'#f43f5e',aura:'shadowflame',a:'#f43f5e'}),
  SK('diamond','DIAMONDBIT','mythic',{shape:'gem',surf:'ice',c1:'#ffffff',c2:'#7dd3fc',aura:'spark',hat:'sparkles',a:'#e0f2fe'}),
  SK('rubybit','RUBYBIT','epic',{shape:'gem',surf:'glass',c1:'#f43f5e',c2:'#881337',aura:'glow',a:'#fb7185'}),
  SK('emeraldbit','EMERALDBIT','epic',{shape:'gem',surf:'glass',c1:'#34d399',c2:'#065f46',aura:'glow',a:'#6ee7b7'}),
  SK('sapphirebit','SAPPHIREBIT','epic',{shape:'gem',surf:'glass',c1:'#60a5fa',c2:'#1e3a8a',aura:'glow',a:'#93c5fd'}),
  SK('prismbit','PRISMBIT','mythic',{shape:'crystal',surf:'holo',c1:'#f0abfc',c2:'#22d3ee',aura:'spark',hat:'sparkles'}),

  /* ---- STYLE / COSTUME ---- */
  SK('dapper','DAPPERBIT','rare',{shape:'orb',surf:'gloss',c1:'#f8fafc',c2:'#475569',hat:'tophat',a:'#ef4444'}),
  SK('capbit','CAPBIT','common',{shape:'orb',surf:'matte',c1:'#60a5fa',c2:'#1e40af',hat:'cap',a:'#ef4444'}),
  SK('bowbit','BOWBIT','common',{shape:'orb',surf:'gloss',c1:'#fbcfe8',c2:'#db2777',hat:'bow',a:'#f472b6',face:'bigeyes',iris:'#db2777'}),
  SK('ninja','NINJABIT','rare',{shape:'orb',surf:'matte',c1:'#1f2937',c2:'#030712',face:'glow',a:'#ef4444',eye:'#ef4444'}),
  SK('pirate','CORSAIRBIT','rare',{shape:'orb',surf:'matte',c1:'#78350f',c2:'#292524',hat:'cap',a:'#1c1917',fangs:true}),
  SK('chef','CHEFBIT','rare',{shape:'egg',surf:'matte',c1:'#fafafa',c2:'#d4d4d8',hat:'tophat',a:'#f59e0b'}),
  SK('wizard','WIZARDBIT','epic',{shape:'orb',surf:'gloss',c1:'#6366f1',c2:'#312e81',hat:'thirdeye',aura:'orbit',a:'#c7d2fe'}),
  SK('knight','KNIGHTBIT','epic',{shape:'shield',surf:'metal',c1:'#e2e8f0',c2:'#334155',face:'visorface',a:'#4dd2ff',hat:'horns'}),
  SK('vampire','NOSFERABIT','epic',{shape:'orb',surf:'matte',c1:'#e5e7eb',c2:'#7f1d1d',fangs:true,face:'angry',eye:'#b91c1c',aura:'shadowflame',a:'#7f1d1d'}),
  SK('mummy','MUMMYBIT','rare',{shape:'egg',surf:'matte',c1:'#e7e5e4',c2:'#a8a29e',pat:'bands',face:'glow',a:'#fbbf24'}),

  /* ---- WORLD-THEMED ---- */
  SK('spacebit','DEEP SPACEBIT','rare',{shape:'orb',surf:'galaxy',c1:'#6366f1',c2:'#020617',face:'dot'}),
  SK('oceanbit','ABYSSBIT','rare',{shape:'drop',surf:'glass',c1:'#0891b2',c2:'#083344',aura:'glow',a:'#22d3ee',face:'bigeyes',iris:'#06b6d4'}),
  SK('lavabit','CINDERBIT','rare',{shape:'orb',surf:'lava',c1:'#dc2626',c2:'#450a0a',eye:'#fed7aa'}),
  SK('retrobit','CRTBIT','rare',{shape:'pixel',surf:'circuit',c1:'#4ade80',c2:'#052e16',face:'visorface',a:'#4ade80'}),
  SK('candybit','SUGARBIT','rare',{shape:'orb',surf:'gloss',c1:'#fbcfe8',c2:'#f472b6',pat:'swirl',hat:'bow',a:'#f9a8d4'}),
  SK('voidbit','NULLBIT','legendary',{shape:'orb',surf:'void_',c1:'#a78bfa',c2:'#000000',face:'x',aura:'shadowflame',a:'#a78bfa',rot:0.09}),
  SK('dawnbit','DAWNBIT','rare',{shape:'orb',surf:'gloss',c1:'#fdba74',c2:'#be185d',aura:'glow',a:'#fdba74'}),

  /* ---- ACHIEVEMENT TROPHIES ---- */
  SK('speedster','SPEEDBIT','epic',{shape:'drop',surf:'metal',c1:'#38bdf8',c2:'#075985',aura:'spark',a:'#7dd3fc',rot:0.12}),
  SK('survivor','SURVIVORBIT','epic',{shape:'shield',surf:'metal',c1:'#f59e0b',c2:'#78350f',aura:'glow',a:'#fbbf24',face:'angry'}),
  SK('combobit','COMBOBIT','epic',{shape:'star',surf:'metal',c1:'#f472b6',c2:'#831843',aura:'spark',a:'#f9a8d4'}),
  SK('hoarder','HOARDBIT','epic',{shape:'orb',surf:'metal',c1:'#fcd34d',c2:'#92400e',pat:'star',aura:'glow',a:'#fde68a'}),
  SK('bosskiller','SLAYERBIT','legendary',{shape:'shard',surf:'metal',c1:'#ef4444',c2:'#450a0a',hat:'horns',aura:'shadowflame',a:'#ef4444',face:'angry',fangs:true}),
  SK('completionist','ARCHIVISTBIT','mythic',{shape:'crystal',surf:'holo',c1:'#fde047',c2:'#a855f7',hat:'crown',aura:'orbit',a:'#fde047'}),
  SK('dailybit','RITUALBIT','legendary',{shape:'hex',surf:'holo',c1:'#22d3ee',c2:'#7c3aed',hat:'halo',aura:'ring',a:'#67e8f9'}),
  SK('centurion','CENTURIONBIT','legendary',{shape:'shield',surf:'metal',c1:'#fbbf24',c2:'#451a03',hat:'crown',aura:'glow',a:'#fde68a',face:'angry'}),
  SK('ghostbit','PHANTOMBIT','legendary',{shape:'ghost',surf:'void_',c1:'#a78bfa',c2:'#0a0a14',face:'glow',aura:'shadowflame',a:'#a78bfa'}),
  SK('mythicbit','THE WHATEVER','mythic',{shape:'blob',surf:'holo',c1:'#ffffff',c2:'#f0abfc',hat:'crown',aura:'orbit',a:'#ffffff',face:'bigeyes',iris:'#a855f7'})
];
const SKIN_BY_ID={};for(const s of SKINS)SKIN_BY_ID[s.id]=s;
const RARITY_COL={common:'#94a3b8',rare:'#4dd2ff',epic:'#c084fc',legendary:'#ffd94d',mythic:'#ff6bd6'};
const RARITY_COST={common:120,rare:320,epic:750,legendary:1600,mythic:3200};

/* ---- ownership ---- */
let OWNED=new Set(loadTyped('skins',[],'array').filter(x=>typeof x==='string'&&SKIN_BY_ID[x]));
for(const s of SKINS)if(s.free)OWNED.add(s.id);
let EQUIPPED=loadTyped('skin','bit','string');
if(!SKIN_BY_ID[EQUIPPED]||!OWNED.has(EQUIPPED))EQUIPPED='bit';
function saveSkins(){writeSave('skins',[...OWNED]);writeSave('skin',EQUIPPED);}
function ownSkin(id,quiet){
  if(!SKIN_BY_ID[id]||OWNED.has(id))return false;
  OWNED.add(id);saveSkins();
  if(!quiet)pushToast('SKIN UNLOCKED',SKIN_BY_ID[id].name,RARITY_COL[SKIN_BY_ID[id].rar]);
  return true;
}
function equipSkin(id){if(OWNED.has(id)){EQUIPPED=id;saveSkins();return true;}return false;}
function curSkin(){return SKIN_BY_ID[EQUIPPED]||SKINS[0];}
function skinCost(s){return Math.round(RARITY_COST[s.rar]||200);}
saveSkins();
