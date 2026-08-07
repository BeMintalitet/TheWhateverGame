#!/usr/bin/env python3
"""
THE WHATEVER GAME — logo / icon suite generator.

Concept: Bit is mid-morph. The left of the body is still a clean sphere;
the right edge has already broken into geometric shards in the genre
palette and is drifting away. One character that cannot hold a shape —
which is the entire game in one image.

Everything is drawn at 8x and downsampled, so edges are genuinely smooth
rather than PIL-jagged. Outputs every size Play and Android need.
"""
import os, math
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'store', 'icons')
os.makedirs(OUT, exist_ok=True)

SS   = 4          # supersample factor
BG1  = (12, 12, 28)
BG2  = (4, 4, 10)
PAL  = [(77,210,255), (192,132,252), (255,77,109), (255,217,77), (77,255,166), (255,158,77)]

def lerp(a, b, t): return tuple(int(round(a[i] + (b[i]-a[i])*t)) for i in range(len(a)))

def radial_bg(size, c_in, c_out, cx=0.5, cy=0.42, r=0.78):
    """Smooth radial gradient without numpy: draw concentric circles at 1px steps."""
    img = Image.new('RGB', (size, size), c_out)
    d = ImageDraw.Draw(img)
    R = int(size * r)
    for i in range(R, 0, -1):
        t = i / R
        d.ellipse([cx*size - i, cy*size - i, cx*size + i, cy*size + i],
                  fill=lerp(c_in, c_out, t))
    return img

def sphere(size, base, light=(255,255,255)):
    """A shaded ball on transparent background: body gradient + terminator."""
    img = Image.new('RGBA', (size, size), (0,0,0,0))
    d = ImageDraw.Draw(img)
    R = size // 2
    lx, ly = 0.30, 0.34          # light direction, upper-left
    for i in range(R, 0, -1):
        t = 1 - i / R                                   # 0 at rim, 1 at centre
        # keep the terminator shallow: a launcher icon must stay bright and
        # readable, not turn into a grey marble
        col = lerp(lerp(base, (150, 162, 196), 1.0), lerp(base, light, 0.6), t**0.42)
        ox = int((R - i) * lx)
        oy = int((R - i) * ly)
        d.ellipse([R - i - ox, R - i - oy, R + i - ox, R + i - oy], fill=col + (255,))
    # clip back to a true circle so the offset shading cannot bleed past the edge
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size-1, size-1], fill=255)
    out = Image.new('RGBA', (size, size), (0,0,0,0))
    out.paste(img, (0,0), mask)
    return out

def wedge(size, base, a0, a1, tint):
    """A pie slice of the ball, tinted — a piece that has broken off."""
    ball = sphere(size, base)
    m = Image.new('L', (size, size), 0)
    ImageDraw.Draw(m).pieslice([0, 0, size-1, size-1], a0, a1, fill=255)
    out = Image.new('RGBA', (size, size), (0,0,0,0))
    out.paste(ball, (0, 0), m)
    # push the slice toward its genre colour while keeping the sphere shading
    tinted = Image.new('RGBA', (size, size), tint + (150,))
    out = Image.composite(Image.alpha_composite(out, tinted), out,
                          out.split()[3].point(lambda v: 255 if v > 8 else 0))
    return out

def poly(d, cx, cy, r, n, rot=0.0, fill=None):
    pts = [(cx + math.cos(rot + k*2*math.pi/n) * r,
            cy + math.sin(rot + k*2*math.pi/n) * r) for k in range(n)]
    d.polygon(pts, fill=fill)

def star(d, cx, cy, r, fill, spikes=5, inner=0.46, rot=-math.pi/2):
    pts = []
    for k in range(spikes*2):
        rr = r if k % 2 == 0 else r*inner
        a = rot + k*math.pi/spikes
        pts.append((cx + math.cos(a)*rr, cy + math.sin(a)*rr))
    d.polygon(pts, fill=fill)

def build(size, bg=True, pad=0.0):
    """Draw the whole mark at `size`px. pad shrinks the art (for adaptive icons)."""
    S = size * SS
    img = radial_bg(S, BG1, BG2) if bg else Image.new('RGBA', (S, S), (0,0,0,0))
    img = img.convert('RGBA')

    # a faint aura so the mark separates from a dark launcher wallpaper
    if bg:
        aura = Image.new('RGBA', (S, S), (0,0,0,0))
        ImageDraw.Draw(aura).ellipse(
            [S*0.16, S*0.13, S*0.84, S*0.81], fill=(90, 60, 190, 70))
        aura = aura.filter(ImageFilter.GaussianBlur(S*0.10))
        img = Image.alpha_composite(img, aura)

    scale = 1.0 - pad
    cx, cy = S*0.400, S*0.50
    R = int(S * 0.268 * scale)
    BODY = (250, 252, 255)
    D = R*2

    # ---- the body, assembled on its OWN transparent layer ----
    # (the wedges are cut out of the ball, not out of the background — doing
    #  this on the composited image punched a hole straight through the icon)
    layer = Image.new('RGBA', (S, S), (0,0,0,0))
    ball = sphere(D, BODY)

    # three slices break away to the right, in genre colours
    slices = [
        # (a0,  a1,   colour, push_x, push_y)
        (-72, -18,  PAL[3], 0.40, -0.28),   # amber, upper right
        (-18,  26,  PAL[2], 0.54,  0.02),   # red,   right
        ( 26,  72,  PAL[0], 0.40,  0.28),   # cyan,  lower right
    ]
    cut = Image.new('L', (D, D), 0)
    dc = ImageDraw.Draw(cut)
    for a0, a1, col, px, py in slices:
        dc.pieslice([0, 0, D-1, D-1], a0, a1, fill=255)
    # remove the slices from the intact ball
    core = ball.copy()
    core.paste((0, 0, 0, 0), (0, 0), cut)
    layer.alpha_composite(core, (int(cx-R), int(cy-R)))
    # and place each one further out
    for a0, a1, col, px, py in slices:
        w = wedge(D, BODY, a0, a1, col)
        layer.alpha_composite(w, (int(cx-R + R*px*scale), int(cy-R + R*py*scale)))

    # ---- small shards drifting away past the slices ----
    ds = ImageDraw.Draw(layer)
    for kind, dx, dy, rr, ci, rot, alpha in [
        ('sq',   1.44, -0.62, 0.17, 1, 0.30, 245),
        ('star', 1.62,  0.10, 0.13, 4, 0.0,  225),
        ('tri',  1.38,  0.80, 0.12, 5, 0.45, 205),
    ]:
        x, y, r = cx + R*dx*scale, cy + R*dy*scale, R*rr*scale
        col = PAL[ci] + (alpha,)
        if kind == 'sq':    poly(ds, x, y, r, 4, rot, col)
        elif kind == 'tri': poly(ds, x, y, r, 3, rot - math.pi/2, col)
        else:               star(ds, x, y, r, col)

    # coloured bloom behind everything, so the mark glows on a dark launcher
    bloom = layer.filter(ImageFilter.GaussianBlur(S*0.030))
    img = Image.alpha_composite(img, bloom)
    img = Image.alpha_composite(img, layer)

    d = ImageDraw.Draw(img)

    # ---- rim light along the lower-left, the classic "HD" tell ----
    rim = Image.new('RGBA', (S, S), (0,0,0,0))
    dr = ImageDraw.Draw(rim)
    dr.arc([cx-R, cy-R, cx+R, cy+R], 100, 250,
           fill=(150, 205, 255, 220), width=int(R*0.085))
    rim = rim.filter(ImageFilter.GaussianBlur(S*0.004))
    img = Image.alpha_composite(img, rim)

    d = ImageDraw.Draw(img)

    # ---- face: big enough to survive a 48px launcher ----
    ex, ey = R*0.300, -R*0.125
    er = R*0.215
    for sx, off in ((-1, -R*0.16), (1, -R*0.16)):
        d.ellipse([cx + off + sx*ex - er, cy + ey - er, cx + off + sx*ex + er, cy + ey + er],
                  fill=(255,255,255,255))
        pr = er*0.60
        px = cx + off + sx*ex + er*0.10
        py = cy + ey + er*0.06
        d.ellipse([px-pr, py-pr, px+pr, py+pr], fill=(10, 10, 22, 255))
        cr = pr*0.34
        d.ellipse([px-pr*0.42-cr, py-pr*0.46-cr, px-pr*0.42+cr, py-pr*0.46+cr],
                  fill=(255,255,255,235))
    # smile
    d.arc([cx - R*0.44, cy + R*0.04, cx + R*0.10, cy + R*0.50],
          15, 165, fill=(10, 10, 22, 255), width=int(R*0.10))

    # ---- specular highlight ----
    spec = Image.new('RGBA', (S, S), (0,0,0,0))
    dp = ImageDraw.Draw(spec)
    dp.ellipse([cx - R*0.62, cy - R*0.74, cx - R*0.18, cy - R*0.44],
               fill=(255,255,255,190))
    dp.ellipse([cx - R*0.30, cy - R*0.84, cx - R*0.16, cy - R*0.72],
               fill=(255,255,255,120))
    spec = spec.filter(ImageFilter.GaussianBlur(S*0.006))
    img = Image.alpha_composite(img, spec)

    return img.resize((size, size), Image.LANCZOS)

def mono(size):
    """Monochrome layer for Android 13+ themed icons: silhouette only."""
    S = size * SS
    img = Image.new('RGBA', (S, S), (0,0,0,0))
    d = ImageDraw.Draw(img)
    cx, cy, R = S*0.455, S*0.50, int(S*0.215)
    d.ellipse([cx-R, cy-R, cx+R, cy+R], fill=(255,255,255,255))
    for kind, dx, dy, rr in [('sq',0.86,-0.62,0.47), ('tri',1.02,0.06,0.42), ('hex',0.80,0.72,0.36)]:
        x, y, r = cx + R*dx, cy + R*dy, R*rr
        if kind == 'sq':  poly(d, x, y, r, 4, 0.30, (255,255,255,255))
        elif kind=='tri': poly(d, x, y, r, 3, -0.20-math.pi/2, (255,255,255,255))
        else:             poly(d, x, y, r, 6, 0.42, (255,255,255,255))
    bite = Image.new('L', (S, S), 0)
    ImageDraw.Draw(bite).polygon(
        [(cx + R*0.30, cy - R*1.05), (cx + R*1.10, cy - R*0.70), (cx + R*0.62, cy + R*0.10),
         (cx + R*1.05, cy + R*0.80), (cx + R*0.24, cy + R*1.06)], fill=255)
    img.paste((0,0,0,0), (0,0), bite)
    return img.resize((size, size), Image.LANCZOS)

def feature(w=1024, h=500):
    S = 4
    W, H = w*S, h*S
    img = radial_bg(max(W,H), BG1, BG2).convert('RGBA').crop((0, 0, W, H))
    d = ImageDraw.Draw(img)
    # colour wash
    wash = Image.new('RGBA', (W, H), (0,0,0,0))
    dw = ImageDraw.Draw(wash)
    for i, c in enumerate(PAL):
        dw.ellipse([W*(0.05+i*0.17)-W*0.13, -H*0.35, W*(0.05+i*0.17)+W*0.13, H*0.45],
                   fill=c + (34,))
    img = Image.alpha_composite(img, wash.filter(ImageFilter.GaussianBlur(W*0.05)))
    mark = build(int(H*0.78), bg=False)
    img.alpha_composite(mark, (int(W*0.055), int(H*0.10)))
    try:
        from PIL import ImageFont
        def font(px):
            for n in ('segoeuib.ttf', 'seguisb.ttf', 'arialbd.ttf', 'DejaVuSans-Bold.ttf'):
                for p in (r'C:\Windows\Fonts', '/usr/share/fonts/truetype/dejavu'):
                    fp = os.path.join(p, n)
                    if os.path.exists(fp):
                        return ImageFont.truetype(fp, px)
            return ImageFont.load_default()
        d = ImageDraw.Draw(img)
        x = int(W*0.36)
        d.text((x, int(H*0.22)), 'THE',      font=font(int(H*0.13)), fill=(255,255,255,58))
        d.text((x, int(H*0.36)), 'WHATEVER', font=font(int(H*0.20)), fill=(255,255,255,255))
        d.text((x, int(H*0.585)), 'GAME',    font=font(int(H*0.13)), fill=(255,255,255,58))
        d.text((x, int(H*0.755)), '31 GENRES  ·  4 BOSSES  ·  9 WORLDS',
               font=font(int(H*0.052)), fill=(140, 215, 255, 255))
    except Exception as e:
        print('  (no font, text skipped:', e, ')')
    return img.convert('RGB').resize((w, h), Image.LANCZOS)

# ------------------------------------------------------------------ #
print('building the mark...')
master = build(1024)
master.save(os.path.join(OUT, 'icon-1024.png'))
master.resize((512, 512), Image.LANCZOS).save(os.path.join(OUT, 'icon-512.png'))
master.resize((192, 192), Image.LANCZOS).save(os.path.join(OUT, 'icon-192.png'))
build(1024, bg=False).save(os.path.join(OUT, 'icon-transparent-1024.png'))
mono(432).save(os.path.join(OUT, 'icon-monochrome-432.png'))
feature().save(os.path.join(OUT, 'feature-graphic-1024x500.png'))
print('wrote:', ', '.join(sorted(os.listdir(OUT))))
