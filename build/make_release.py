#!/usr/bin/env python3
"""Produce the store build: ∞ TEST MODE permanently removed, ads armed."""
import io, re, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else '../TheWhateverGame.html'
OUT = sys.argv[2] if len(sys.argv) > 2 else '../TheWhateverGame-release.html'
s = io.open(SRC, encoding='utf-8').read()
n0 = len(s)

def must(old, new, count=None):
    global s
    c = s.count(old)
    if c == 0:
        raise SystemExit('release patch miss: ' + old[:120])
    if count is not None and c != count:
        raise SystemExit('release patch count %d!=%d for %s' % (c, count, old[:80]))
    s = s.replace(old, new)

# 1. GOD becomes an immovable constant
must("let GOD=false; // ∞ TEST MODE", "const GOD=false; // ∞ TEST MODE removed for the store build", 1)

# 2. keyboard toggles gone
must("  if(e.code==='KeyG'){GOD=!GOD;if(state==='play')say(GOD?'∞ TEST MODE on. immortality granted. (temporarily.)':'test mode off. mortality restored.',2.2);}\n", "")
must("  if(e.code==='KeyN'&&GOD&&state==='play'&&morphT<=0&&G)beginMorph();\n", "")

# 3. title-screen toggle gone
must("    if(TZ.god&&inZone(TZ.god)){GOD=!GOD;SFX.heart();return;}\n", "")
must("  if(GOD){TZ.god={x:bx,y:by-32,w:bw,h:32};by-=32+gap;}else TZ.god=null;",
     "  TZ.god=null;")
must("  if(TZ.god)drawBtn(TZ.god,'∞ TEST: '+(GOD?'ON':'off'),'#4dffa6');\n", "")

# 4. in-run skip button gone
must("    // ∞ TEST MODE skip button\n    if(GOD&&!fromKey&&inZone(GZ.skip)&&morphT<=0){beginMorph();return;}\n", "")

# 4b. the ORIGINAL (now-overridden) title screen still carried the toggle —
#     unreachable, but it must not exist at all in a store build
must("    if(inZone(TZ.god)){GOD=!GOD;SFX.heart();return;}\n", "")
must("  drawBtn(TZ.god,'∞ TEST: '+(GOD?'ON':'off')+'  (G)',GOD?'#4dffa6':'rgba(255,255,255,0.35)');\n", "")
must("  TZ.god={x:bx,y:y0+(bh+gap)*4,w:bw/2-4,h:32};\n", "")

# 5. ad test flag must be off in the store build
must("testMode:false", "testMode:false", 1)

io.open(OUT, 'w', encoding='utf-8').write(s)

# 6. verify nothing testy survived
bad = []
if re.search(r"\blet GOD\b", s): bad.append('GOD still mutable')
if "KeyG'){GOD" in s: bad.append('G key still toggles')
if "GOD=!GOD" in s: bad.append('a GOD toggle survives')
if "∞ TEST:" in s: bad.append('test button label survives')
print('release -> %s  (%d -> %d bytes)' % (OUT, n0, len(s)))
if bad:
    raise SystemExit('RELEASE NOT CLEAN: ' + '; '.join(bad))
print('release build verified clean: no test mode, no god toggles')
