# Renders the orange concept-sketch backgrounds. Run: python tools/sketch.py assets/img/src assets/img
import sys, os, math
import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageFont

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
PAPER = np.array([246, 241, 230], float)
INK   = np.array([176, 62, 10], float)    # deep rich orange
INK2  = np.array([214, 96, 22], float)    # brighter orange for hatching
WASH  = np.array([240, 150, 80], float)   # marker wash
rng = np.random.default_rng(7)

def blur(a, r):
    im = Image.fromarray(np.clip(a*255,0,255).astype(np.uint8))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(r)), float)/255

def hatch(h, w, angle, spacing, width, wobble=1.2, seed=0):
    yy, xx = np.mgrid[0:h, 0:w].astype(float)
    t = math.radians(angle)
    r = rng_noise(h, w, seed) * wobble
    d = (xx*math.cos(t) + yy*math.sin(t) + r) % spacing
    d = np.minimum(d, spacing - d)
    return np.clip(1 - (d - width/2), 0, 1)

def rng_noise(h, w, seed):
    g = np.random.default_rng(seed).standard_normal((h//24+2, w//24+2))
    im = Image.fromarray(((g+3)/6*255).clip(0,255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
    return (np.asarray(im, float)/255 - .5) * 6

def breakup(h, w, seed, scale=60, keep=.35):
    g = np.random.default_rng(seed).random((h//scale+2, w//scale+2))
    im = Image.fromarray((g*255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
    m = np.asarray(im, float)/255
    return np.clip((m - keep) * 4 + .5, 0, 1)

def sketch(path, name, label, work=1600):
    im = Image.open(path).convert('L')
    W, H = im.size
    s = work / max(W, H) if H > W else work / W
    im = im.resize((round(W*s), round(H*s)), Image.LANCZOS)
    L = np.asarray(im, float)/255
    h, w = L.shape
    lo, hi = np.percentile(L, 2), np.percentile(L, 98)
    L = np.clip((L-lo)/(hi-lo+1e-6), 0, 1)
    sm = Image.fromarray((L*255).astype(np.uint8)).filter(ImageFilter.MedianFilter(13)).filter(ImageFilter.GaussianBlur(4.5))
    T = np.asarray(sm, float)/255
    th = [.26, .42, .58, .74]
    lev = np.digitize(T, th)
    e = np.zeros_like(T)
    for dy, dx in ((0,1),(1,0),(1,1),(1,-1)):
        sh = np.roll(np.roll(lev, dy, 0), dx, 1)
        e = np.maximum(e, (sh != lev).astype(float))
    e[:3,:]=0; e[-3:,:]=0; e[:,:3]=0; e[:,-3:]=0
    iso = np.clip(blur(e, .7)*1.6, 0, 1)
    iso *= np.clip(1.15 - T, .35, 1)
    G1, G2 = blur(T, 1.5), blur(T, 4.0)
    sil = blur(np.clip((-(G1 - G2) - .035) * 22, 0, 1), .6)
    b = breakup(h, w, 11, scale=90, keep=.2)
    h1 = hatch(h, w, 38, 11, 1.2, seed=1) * (lev <= 2) * b
    h2 = hatch(h, w, -52, 10, 1.1, seed=2) * (lev <= 1) * breakup(h, w, 12, scale=90, keep=.25)
    h3 = hatch(h, w, 82, 7, 1.0, seed=3) * (lev == 0)
    hat = blur(np.clip(h1*.42 + h2*.5 + h3*.5, 0, 1), .4)
    wash = blur(np.where(lev == 0, .16, np.where(lev == 1, .08, 0.0)), 8)
    lines = iso*.75
    contour = sil
    grain = (np.random.default_rng(5).standard_normal((h, w)) * .025)
    out = PAPER[None,None,:] * np.ones((h, w, 1))
    out = out*(1-wash[...,None]) + WASH*wash[...,None]
    out = out*(1-hat[...,None]*.7) + INK2*(hat[...,None]*.7)
    ink = np.clip(np.maximum(lines*.9, contour), 0, 1)
    out = out*(1-ink[...,None]) + INK*ink[...,None]
    out = np.clip(out + grain[...,None]*255*.3, 0, 255).astype(np.uint8)
    img = Image.fromarray(out, 'RGB')
    # concept-sheet furniture: construction lines, frame, corner marks, label
    d = ImageDraw.Draw(img, 'RGBA')
    ink_a = (176, 62, 10, 120)
    faint = (176, 62, 10, 55)
    m = round(w*.035)
    # loose frame with overshoot
    for (x0,y0,x1,y1) in [(m-18, m, w-m+22, m), (m-14, h-m, w-m+16, h-m), (m, m-20, m, h-m+18), (w-m, m-16, w-m, h-m+24)]:
        d.line([(x0,y0),(x1,y1)], fill=ink_a, width=2)
    # horizon / thirds construction lines
    for f in (1/3, 2/3):
        d.line([(m, h*f), (w-m, h*f + rng.uniform(-6,6))], fill=faint, width=1)
        d.line([(w*f, m), (w*f + rng.uniform(-6,6), h-m)], fill=faint, width=1)
    # vanishing guides from a point
    vx, vy = w*.5, h*.42
    for a in (-1, -.55, .55, 1):
        d.line([(vx, vy), (vx + a*w*.6, h-m)], fill=faint, width=1)
    # registration crosses
    for (cx, cy) in [(m, m), (w-m, m), (m, h-m), (w-m, h-m)]:
        d.line([(cx-12, cy), (cx+12, cy)], fill=ink_a, width=2)
        d.line([(cx, cy-12), (cx, cy+12)], fill=ink_a, width=2)
        d.ellipse([cx-6, cy-6, cx+6, cy+6], outline=ink_a, width=1)
    try:
        f = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', max(14, round(w*.011)))
    except Exception:
        f = ImageFont.load_default()
    d.text((m+14, h-m-14-f.size), label, font=f, fill=(176,62,10,170))
    d.text((w-m-14-f.getlength('SCALE 1:1  ·  REV B'), m+12), 'SCALE 1:1  ·  REV B', font=f, fill=(176,62,10,150))
    sizes = [1600, 1000, 600] if w >= h else [1000, 600]
    for S in sizes:
        r = S / max(w, h)
        img.resize((round(w*r), round(h*r)), Image.LANCZOS).save(f'{OUT}/{name}-sketch-{S}.webp', quality=80, method=6)
    pass

jobs = [('1','peaks','STUDY 01 — RIDGELINE'), ('2','fogpeak','STUDY 02 — SUMMIT IN FOG'),
        ('3','mirror','STUDY 03 — REFLECTION'), ('4','glass','STUDY 04 — GLASS FORMS'), ('5','wall','STUDY 05 — LIMESTONE')]
for src, name, label in jobs:
    sketch(f'{SRC}/{src}.jpg', name, label)
    print('done', name)
