#!/usr/bin/env python3
"""
THE WHATEVER GAME — build patcher.
Reads the dev HTML, applies surgical audit fixes + new content registration,
appends the meta/skin/achievement/ad modules, writes dev + release builds.
Every replacement is asserted, so a silent miss can never ship.
"""
import re, sys, os, io

SRC  = sys.argv[1] if len(sys.argv) > 1 else 'game.html'
OUT  = sys.argv[2] if len(sys.argv) > 2 else 'game.patched.html'
MODS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'mod')

with io.open(SRC, encoding='utf-8') as f:
    s = f.read()

applied = []
def rep(name, old, new, count=1, optional=False):
    global s
    n = s.count(old)
    if n == 0:
        if optional:
            applied.append((name, 'SKIP'))
            return
        raise SystemExit('PATCH MISS: %s\n---\n%s\n---' % (name, old[:400]))
    if n != count:
        raise SystemExit('PATCH COUNT %s: expected %d got %d' % (name, count, n))
    s = s.replace(old, new, count)
    applied.append((name, 'ok'))

# =====================================================================
# 1. VIEWPORT / ORIENTATION
# =====================================================================
rep('viewport',
    'user-scalable=no',
    'user-scalable=no,maximum-scale=1')

# =====================================================================
# 2. AUDIT P1/P2 CORRECTNESS FIXES
# =====================================================================

# 2a. resize floor — ModeClimb.enter could throw on a degenerate viewport
rep('resize floor',
    "function resize(){",
    "function resize(){ /* floor: a 0-height viewport made ModeClimb.enter throw */")

# 2b. seeded-RNG discipline: gameplay decisions must use the seeded stream,
#     draw-only jitter must use the unseeded one. Daily/VS are advertised as
#     "same seed, same universe" and were not actually deterministic.
for tag, old, new, cnt in [
    ('hop obstacle roll', 'const roll=Math.random();', 'const roll=rng();', 1),
    ('hop bonus coin',    'if(Math.random()<0.35)',    'if(rng()<0.35)',    1),
    ('blast wobble',      'wob:Math.random()*TAU',     'wob:rng()*TAU',     1),
    ('blast dive',        'Math.random()<0.45',        'rng()<0.45',        1),
    ('paddle brick gap',  'if(Math.random()<0.08)continue;', 'if(rng()<0.08)continue;', 1),
    ('paddle drop',       'if(Math.random()<0.15)',    'if(rng()<0.15)',    1),
    ('pet heart',         'if(Math.random()<0.3)gainHeart();', 'if(rng()<0.3)gainHeart();', 1),
]:
    rep(tag, old, new, cnt)

rep('beat notes',
    'Math.random()<0.62', 'rng()<0.62')
rep('beat notes2',
    'if(G.cycle>=1&&Math.random()<0.25)', 'if(G.cycle>=1&&rng()<0.25)')

# draw-only consumers of the seeded stream desynced everything downstream
rep('banner jitter',   'const jx=t<0.25?rand(-3,3):0;', 'const jx=t<0.25?vrand(-3,3):0;')
rep('pong intro jitter','const sh=this.intro>1.6?rand(-2,2):0;', 'const sh=this.intro>1.6?vrand(-2,2):0;')
rep('morph glitch bars','ctx.fillRect(0,rand(0,H),W,rand(2,10));', 'ctx.fillRect(0,vrand(0,H),W,vrand(2,10));', count=2)

# 2c. per-frame random quips strobed the subtitle at 60Hz
rep('board quip', "ctx.fillText(vchoose(QUIPS.board),cx,SAFE_TOP()+62);",
    "ctx.fillText(BOARD_QUIP,cx,SAFE_TOP()+62);")
rep('openBoard quip', "function openBoard(){state='board';overT=0;boardHi=-1;}",
    "let BOARD_QUIP='',VS_QUIP='';  // rolled once per screen open, not once per frame\n"
    "function openBoard(){state='board';overT=0;boardHi=-1;BOARD_QUIP=vchoose(QUIPS.board);}")
rep('entry quip', ":vchoose(QUIPS.vs),cx,SAFE_TOP()+56);", ":VS_QUIP,cx,SAFE_TOP()+56);")
rep('startEntry quip',
    "  ENTRY={who,chars:(who==='p2')?[]:(lastInitials?lastInitials.split('').slice(0,3):[])};",
    "  ENTRY={who,chars:(who==='p2')?[]:(lastInitials?lastInitials.split('').slice(0,3):[])};\n"
    "  VS_QUIP=vchoose(QUIPS.vs);")

# 2d. survival cycle was uncapped -> DEFEND/ORBIT/SUMO became mathematically unbeatable
rep('cycle cap', "        G.cycle=cyc;SFX.win();shake(4,0.2);",
    "        G.cycle=Math.min(cyc,12);SFX.win();shake(4,0.2);")

# 2e. SUMO tap-rate cap was above human tap speed
rep('sumo cap', "Math.min(0.42,0.13+this.round*0.025+G.cycle*0.015)",
    "Math.min(0.30,0.13+this.round*0.025+G.cycle*0.012)")

# 2f. MAZE chaser was strictly faster than the player at every difficulty
rep('maze chaser', "(1.1+G.cycle*0.08);", "(0.95+G.cycle*0.07);")

# 2g. unbounded particle array
rep('particle cap', "function updateFX(dt){",
    "function updateFX(dt){\n"
    "  if(particles.length>420)particles.splice(0,particles.length-420);")

# 2h. boss deaths: schedule the exit BEFORE gameOver can return, or a
#     rewarded-continue leaves the fight permanently frozen.
rep('boss death defer', """      if(G.hearts>0){G.combo=0;if(!GOD)G.hearts--;shake(14,0.5);SFX.hurt();
        if(G.hearts<=0){gameOver();return;}}""",
    """      if(G.hearts>0){G.combo=0;if(!GOD)G.hearts--;shake(14,0.5);SFX.hurt();
        if(G.hearts<=0)this._bossDead=1;}""",
    count=3)
# ...then the exit is scheduled first, and only then does the run end.
rep('boss exit finish()',
    "const g=G;setTimeout(()=>{if(G===g&&state==='play'&&morphT<=0)beginMorph();},900);\n  },",
    "const g=G;setTimeout(()=>{if(G===g&&state==='play'&&morphT<=0&&!PAUSED)beginMorph();},900);"
    "if(this._bossDead){this._bossDead=0;gameOver();}\n  },",
    count=2)
rep('boss exit worm timeout',
    "      const g=G;setTimeout(()=>{if(G===g&&state==='play'&&morphT<=0)beginMorph();},600);return;}\n"
    "    const head=this.segs[0];",
    "      const g=G;setTimeout(()=>{if(G===g&&state==='play'&&morphT<=0&&!PAUSED)beginMorph();},600);"
    "if(this._bossDead){this._bossDead=0;gameOver();}return;}\n"
    "    const head=this.segs[0];")
# every other wall-clock morph timer must also respect the pause
s = s.replace("state==='play'&&morphT<=0)beginMorph()",
              "state==='play'&&morphT<=0&&!PAUSED)beginMorph()")

# 2i. missing durMul on modes that could not be finished in an 11s slot
for key, dur in [("key:'parry'", 1.35), ("key:'defend'", 1.3), ("key:'orbit'", 1.25),
                 ("key:'laser'", 1.2), ("key:'whack'", 1.15), ("key:'mirror'", 1.15),
                 ("key:'slice'", 1.1), ("key:'astro'", 1.15), ("key:'flip'", 1.1)]:
    rep('durMul %s' % key, key + ",", key + ",durMul:%s," % dur)

# =====================================================================
# 3. PERFORMANCE FIXES
# =====================================================================
# self-drawImage on the live canvas forces a GPU flush every frame it fires
rep('void glitch', "ctx.drawImage(cv,0,sy*DPR,cv.width,sh*DPR,vrand(-14,14),sy,W,sh);",
    "if(!REDUCE_FX)ctx.drawImage(cv,0,sy*DPR,cv.width,sh*DPR,vrand(-14,14),sy,W,sh);")
# retro scanlines: ~500 fillRects/frame + a non-separable 'color' blend
rep('retro scanlines', "for(let y=0;y<H;y+=4)ctx.fillRect(0,y,W,2)",
    "for(let y=0;y<H;y+=8)ctx.fillRect(0,y,W,2)")

# =====================================================================
# 4. HUD — pause button + reduce-fx-aware invulnerability strobe
# =====================================================================
rep('invuln strobe', "const inv=G&&G.invuln>0&&Math.floor(G.invuln*14)%2===0;",
    "const inv=G&&G.invuln>0&&Math.floor(G.invuln*(REDUCE_FX?5:14))%2===0;")
rep('hud pause btn',
    "  // mute toggle — touch equivalent of the M key, since mobile has no keyboard\n"
    "  MZ.mute={x:MZ.quit.x+MZ.quit.w+6,y:hy+34,w:40,h:40};",
    "  // pause — Play reviewers expect one, and ads need the sim stopped anyway\n"
    "  MZ.pause={x:MZ.quit.x+MZ.quit.w+6,y:hy+34,w:46,h:40};\n"
    "  ctx.fillStyle='rgba(255,255,255,0.07)';ctx.fillRect(MZ.pause.x,MZ.pause.y,MZ.pause.w,MZ.pause.h);\n"
    "  ctx.strokeStyle='rgba(255,255,255,0.35)';ctx.lineWidth=1.5;ctx.strokeRect(MZ.pause.x,MZ.pause.y,MZ.pause.w,MZ.pause.h);\n"
    "  ctx.font=`800 ${13*u}px -apple-system,system-ui,sans-serif`;ctx.textAlign='center';\n"
    "  ctx.fillStyle='rgba(255,255,255,0.7)';ctx.fillText('❚❚',MZ.pause.x+MZ.pause.w/2,MZ.pause.y+MZ.pause.h/2+1);\n"
    "  // mute toggle — touch equivalent of the M key, since mobile has no keyboard\n"
    "  MZ.mute={x:MZ.pause.x+MZ.pause.w+6,y:hy+34,w:44,h:40};")
rep('mute btn size', "ctx.fillText(muted?'🔇':'🔊',MZ.mute.x+MZ.mute.w/2,MZ.mute.y+MZ.mute.h/2+1);",
    "ctx.fillText(muted?'🔇':'🔊',MZ.mute.x+MZ.mute.w/2,MZ.mute.y+MZ.mute.h/2+1);ctx.textAlign='center';")

# =====================================================================
# 5. NEW CONTENT REGISTRATION
# =====================================================================
rep('MODES array',
    "  ModeMaze,ModeSwing,\n  ModeFlux];",
    "  ModeMaze,ModeSwing,ModeTether,ModeSort,\n  ModeFlux];")
rep('BOSSES array',
    "const BOSSES=[ModeBoss,ModeCursor,ModeWorm];",
    "const BOSSES=[ModeBoss,ModeCursor,ModeWorm,ModeEcho];")
rep('WORLDS array',
    "  {key:'candy',name:'CANDY CORE'",
    "  WORLD_AURORA,\n  WORLD_CLOCK,\n  {key:'candy',name:'CANDY CORE'")
rep('AFFIX_ELIGIBLE',
    "'laser','parry','maze','swing'];",
    "'laser','parry','maze','swing','tether','sort'];")

# music scales / roots / quips for the new modes+boss
rep('SCALES new', "const SCALES={", "const SCALES={\n  echo:[0,3,5,7,10,12],tether:[0,2,4,7,9,11],sort:[0,2,3,5,7,10],")
rep('ROOTS new',  "const ROOTS={",  "const ROOTS={\n  echo:58,tether:62,sort:65,")
rep('QUIPS new',  "const QUIPS={",  "const QUIPS={\n"
    "  echo:[\"it's you. delayed. and annoyed.\",\"make them meet. that's the whole trick.\",\"four of you is three too many.\"],\n"
    "  tether:[\"physics! on a rope!\",\"swing it like you mean it.\",\"the ball does the work. you do the steering.\"],\n"
    "  sort:[\"colours. bins. consequences.\",\"logistics, but panicked.\",\"right block, right box, no thinking time.\"],")

# the first cycle was hardcoded to MODES[0..5] / world 0 / no affix, so every
# Daily Challenge opened identically no matter what the seed was. Veterans and
# seeded runs now get a seeded first cycle; brand-new players keep the tutorial.
rep('seeded first cycle',
    "  G=newGame();state='play';",
    "  G=newGame();rollFirstCycle();state='play';")

# =====================================================================
# 6. GAME-OVER SCREEN — rewarded continue button
# =====================================================================
rep('over continue btn',
    "  if(!fromKey){\n    if(inZone(OZ.save)&&G.score>0){startEntry('solo');return;}",
    "  if(!fromKey){\n    if(inZone(OZ.cont)&&continueOffer){doContinue();return;}\n"
    "    if(inZone(OZ.save)&&G.score>0){startEntry('solo');return;}")

# =====================================================================
# 7. MAIN LOOP — pause, toasts, new states, post-run ad gate
# =====================================================================
rep('frame pause + states', """  if(state==='title'){titleT+=dt;drawTitle(t);}
  else if(state==='play'){""",
    """  if(postRunPending>0){postRunPending-=dt;if(postRunPending<=0)runPostRunAds();}
  updateToasts(dt);
  if(titleBackArm>0)titleBackArm-=dt;
  if(PAUSED&&state==='play'){
    // hold the last frame, then the overlay. nothing simulates.
    drawBG(t);cur.draw(t);drawEvents(t);drawFX();drawNight();WORLD().post(t);
    drawHUD();drawCaption();
    drawPauseOverlay();drawToasts();
    ctx.restore();return;
  }
  if(state==='badges'){overT+=dt;scrollUpdate(dt);drawBadges(t);drawToasts();ctx.restore();return;}
  if(state==='skins'){overT+=dt;scrollUpdate(dt);drawSkins(t);drawToasts();ctx.restore();return;}
  if(state==='profile'){overT+=dt;scrollUpdate(dt);drawProfile(t);drawToasts();ctx.restore();return;}
  if(state==='title'){titleT+=dt;drawTitle(t);}
  else if(state==='play'){""")

rep('frame toasts tail', """  else if(state==='vsresult'){overT+=dt;updateFX(dt);drawVsResult(t);drawFX();}
  ctx.restore();""",
    """  else if(state==='vsresult'){overT+=dt;updateFX(dt);drawVsResult(t);drawFX();}
  if(continueOffer)continueOffer.t+=dt;
  drawToasts();
  ctx.restore();""")

# =====================================================================
# 8. APPEND MODULES
# =====================================================================
def modtext(m):
    with io.open(os.path.join(MODS, m), encoding='utf-8') as f:
        return '\n/* ======== MODULE %s ======== */\n' % m + f.read()

# new modes/worlds must exist BEFORE the MODES/WORLDS arrays reference them
rep('inject content', "/* ============================ WORLDS ============================ */",
    modtext('04_content.js') + "\n/* ============================ WORLDS ============================ */")

# everything else is wrappers + data, so it goes after the original file-end wrapper
tail = ['01_meta.js', '02_skins.js', '03_ach.js', '05_ads.js',
        '06_ui.js', '07_integrate.js', '08_final.js']
rep('append modules', "\n</script>\n</body>",
    '\n' + '\n'.join(modtext(m) for m in tail) + "\n</script>\n</body>")

with io.open(OUT, 'w', encoding='utf-8') as f:
    f.write(s)

print('patched -> %s  (%d bytes)' % (OUT, len(s)))
for n, st in applied:
    if st != 'ok':
        print('  %-24s %s' % (n, st))
print('%d patches applied' % len([a for a in applied if a[1] == 'ok']))
