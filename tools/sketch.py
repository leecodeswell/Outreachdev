# Renders the orange concept-sketch backgrounds.
# Run: python tools/sketch.py assets/img/src assets/img
import sys, os, math
import numpy as np
from PIL import Image, ImageFilter, ImageOps

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
PAPER = np.array([246, 241, 230], float)
INK   = np.array([168, 58, 9], float)     # deep rich orange for line work
INK2  = np.array([208, 92, 22], float)    # brighter orange for hatching
WASH  = np.array([240, 150, 80], float)   # marker wash

def to_img(a):
    return Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8))

def blur(a, r):
    return np.asarray(to_img(a).filter(ImageFilter.GaussianBlur(r)), float) / 255

def field(h, w, seed, cell=24, amp=6):
    g = np.random.default_rng(seed).standard_normal((h // cell + 2, w // cell + 2))
    im = to_img((g + 3) / 6).resize((w, h), Image.BICUBIC)
    return (np.asarray(im, float) / 255 - .5) * amp

def hatch(h, w, angle, spacing, width, seed):
    yy, xx = np.mgrid[0:h, 0:w].astype(float)
    t = math.radians(angle)
    d = (xx * math.cos(t) + yy * math.sin(t) + field(h, w, seed) * 1.3) % spacing
    d = np.minimum(d, spacing - d)
    return np.clip(1 - (d - width / 2), 0, 1)

def breakup(h, w, seed, scale=70, keep=.25):
    m = np.asarray(to_img(np.random.default_rng(seed).random((h // scale + 2, w // scale + 2))).resize((w, h), Image.BICUBIC), float) / 255
    return np.clip((m - keep) * 4 + .5, 0, 1)

def sketch(path, name, fq=.90, bq=.94, sm=(5, 1.6), work=1600):
    im = Image.open(path).convert('L')
    W, H = im.size
    s = work / max(W, H)
    im = im.resize((round(W * s), round(H * s)), Image.LANCZOS)
    # lift local contrast so low-contrast photos (fog, haze) still read
    eq = ImageOps.equalize(im)
    L = (np.asarray(im, float) * .45 + np.asarray(eq, float) * .55) / 255
    h, w = L.shape

    # tone map: lightly smoothed, split into seven bands by quantile
    T = np.asarray(to_img(L).filter(ImageFilter.MedianFilter(sm[0])).filter(ImageFilter.GaussianBlur(sm[1])), float) / 255
    th = np.quantile(T, [.10, .22, .35, .48, .62, .76])
    lev = np.digitize(T, th)               # 0 = darkest ... 6 = lightest

    # texture mask: where the photo has real structure (not smooth sky, fog or haze)
    tex = blur(np.abs(L - blur(L, 2.0)), 7)
    tex = np.clip((tex - np.quantile(tex, .30)) / (np.quantile(tex, .80) - np.quantile(tex, .30) + 1e-6), 0, 1)
    tex = blur(tex, 10)

    # contour lines between tone bands
    e = np.zeros_like(T)
    for dy, dx in ((0, 1), (1, 0)):
        e = np.maximum(e, (np.roll(np.roll(lev, dy, 0), dx, 1) != lev).astype(float))
    e[:3, :] = e[-3:, :] = 0; e[:, :3] = e[:, -3:] = 0
    iso = np.clip(blur(e, .55) * 1.5, 0, 1) * np.clip(1.1 - T, .3, .9) * tex

    # fine pen detail: thin dark-line response at two scales
    g1, g2 = blur(L, .8), blur(L, 1.8)
    d = g2 - g1
    fine = np.clip((d - np.quantile(d, fq)) / (np.quantile(d, .995) - np.quantile(d, fq) + 1e-6), 0, 1)
    G1, G2 = blur(L, 1.6), blur(L, 4.0)
    D = G2 - G1
    bold = np.clip((D - np.quantile(D, bq)) / (np.quantile(D, .997) - np.quantile(D, bq) + 1e-6), 0, 1)
    pen = np.clip(fine * .75 + bold * .9, 0, 1)
    pen = blur(pen, .35) * (.35 + .65 * tex)

    # hatching by tone band
    h1 = hatch(h, w, 38, 8, 1.1, 1) * (lev <= 3) * breakup(h, w, 11, keep=.18)
    h2 = hatch(h, w, -52, 7, 1.0, 2) * (lev <= 2) * breakup(h, w, 12, keep=.22)
    h3 = hatch(h, w, 82, 6, 1.0, 3) * (lev <= 1)
    h4 = hatch(h, w, 8, 5, .9, 4) * (lev == 0)
    hat = blur(np.clip(h1 * .38 + h2 * .45 + h3 * .5 + h4 * .5, 0, 1), .35) * (.15 + .85 * tex)
    wash = blur(np.select([lev == 0, lev == 1, lev == 2], [.18, .11, .05], 0.0), 6) * (.3 + .7 * tex)

    grain = np.random.default_rng(5).standard_normal((h, w)) * .02
    out = PAPER[None, None, :] * np.ones((h, w, 1))
    out = out * (1 - wash[..., None]) + WASH * wash[..., None]
    out = out * (1 - hat[..., None] * .7) + INK2 * (hat[..., None] * .7)
    ink = np.clip(np.maximum(iso * .7, pen), 0, 1)
    out = out * (1 - ink[..., None]) + INK * ink[..., None]
    out = np.clip(out + grain[..., None] * 255 * .3, 0, 255).astype(np.uint8)
    img = Image.fromarray(out, 'RGB')

    sizes = [1600, 1000, 600] if w >= h else [1000, 600]
    for S in sizes:
        r = S / max(w, h)
        img.resize((round(w * r), round(h * r)), Image.LANCZOS).save(f'{OUT}/{name}-sketch-{S}.webp', quality=82, method=6)

# fq/bq: how selective the fine and bold pen lines are (higher = fewer lines)
for src, name, fq, bq in [('1', 'peaks', .90, .94), ('2', 'fogpeak', .90, .94), ('3', 'mirror', .90, .94),
                          ('4', 'glass', .90, .94), ('5', 'wall', .955, .965)]:
    sketch(f'{SRC}/{src}.jpg', name, fq, bq, (11, 3.5) if name == 'wall' else (5, 1.6))
    print('done', name)
