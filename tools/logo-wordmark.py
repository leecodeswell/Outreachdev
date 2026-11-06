# Pari wordmarks drawn as geometric monoline letters, each with a small pear worked in. Run: python tools/logo-wordmark.py
import math, os, pathlib, subprocess
OUT = 'docs/brand/logo-concepts/wordmark'
ORANGE, INK, CREAM = '#C2410C', '#1D140D', '#FBF5EC'
THEMES = {'light': dict(c=ORANGE, a=INK, bg=CREAM), 'dark': dict(c='#EA6A1F', a=CREAM, bg='#1D140D')}

def f(v): return f'{v:.2f}'.rstrip('0').rstrip('.')

def pear(c1, r1, c2, r2):
    """Solid pear: a small top circle and a big bottom circle joined by straight tangents."""
    dx, dy = c2[0] - c1[0], c2[1] - c1[1]
    d, th = math.hypot(dx, dy), math.atan2(dy, dx)
    a = math.acos((r1 - r2) / d)
    pt = lambda c, r, ang: (c[0] + r * math.cos(ang), c[1] + r * math.sin(ang))
    l1, rt1, l2, rt2 = pt(c1, r1, th + a), pt(c1, r1, th - a), pt(c2, r2, th + a), pt(c2, r2, th - a)
    return (f'M{f(l1[0])} {f(l1[1])}A{f(r1)} {f(r1)} 0 0 1 {f(rt1[0])} {f(rt1[1])}L{f(rt2[0])} {f(rt2[1])}'
            f'A{f(r2)} {f(r2)} 0 1 1 {f(l2[0])} {f(l2[1])}Z')

def leaf(x, y, length, angle, width=.42):
    a = math.radians(angle)
    tx, ty = x + length * math.cos(a), y + length * math.sin(a)
    r = length * (1 + width * width) / (4 * width)
    return f'M{f(x)} {f(y)}A{f(r)} {f(r)} 0 0 1 {f(tx)} {f(ty)}A{f(r)} {f(r)} 0 0 1 {f(x)} {f(y)}Z'

def small_pear(x, bottom, h, tilt=0):
    """A solid orange pear of height h (twig and leaf included) whose bottom sits at y=bottom."""
    s = h / 26
    r1, r2 = 3.6 * s, 6 * s
    c2 = (x, bottom - r2)
    c1 = (x, c2[1] - 7.4 * s)
    top = c1[1] - r1
    g = (f'<path d="{pear(c1, r1, c2, r2)}" fill="{{c}}"/>'
         f'<path d="M{f(x + .4 * s)} {f(top + .8 * s)}L{f(x + 1.4 * s)} {f(top - 4 * s)}" stroke="{{c}}" stroke-width="{f(2 * s)}" stroke-linecap="round"/>'
         f'<path d="{leaf(x + 1.2 * s, top - 2.6 * s, 6.6 * s, -18)}" fill="{{a}}"/>')
    return f'<g transform="rotate({tilt} {f(x)} {f(bottom)})">{g}</g>' if tilt else g

def word(W=9, g=10, dot='pear', cap_p=False, pear_h=None):
    """Lowercase 'pari' on a 40-unit x-height (y 30 to 70), stroke W. Returns (svg body, width)."""
    R = (40 - W) / 2
    st = lambda x, y0, y1: f'M{f(x)} {f(y0)}V{f(y1)}'
    paths, extra = [], ''
    x = W / 2 + 2
    if cap_p:  # capital P whose bowl is a pear with a neck, cap height y 8 to 70
        L, t = x, 8 + W / 2
        r1, r2 = 8.5, 13
        c1, c2 = (L + r1, t + r1), (L + r2, t + 2 * r1 + r2 - 5)
        dx, dy = c2[0] - c1[0], c2[1] - c1[1]
        d = math.hypot(dx, dy)
        Rn, A, B = 14, 14 + r1, 14 + r2
        xx = (A * A - B * B + d * d) / (2 * d)
        h = math.sqrt(A * A - xx * xx)
        ux, uy = dx / d, dy / d
        n = max((c1[0] + xx * ux - h * uy, c1[1] + xx * uy + h * ux), (c1[0] + xx * ux + h * uy, c1[1] + xx * uy - h * ux))
        on = lambda c, r: (c[0] + r * (n[0] - c[0]) / math.dist(n, c), c[1] + r * (n[1] - c[1]) / math.dist(n, c))
        p1, p2 = on(c1, r1), on(c2, r2)
        extra += (f'<path d="M{f(L)} 70V{f(t)}H{f(c1[0])}A{r1} {r1} 0 0 1 {f(p1[0])} {f(p1[1])}A{Rn} {Rn} 0 0 0 {f(p2[0])} {f(p2[1])}'
                  f'A{r2} {r2} 0 1 1 {f(L)} {f(c2[1])}" fill="none" stroke="{{c}}" stroke-width="{W}" stroke-linejoin="round"/>'
                  f'<path d="M{f(c1[0] + 1)} {f(t - W / 2 - 1)}L{f(c1[0] + 3)} {f(t - W / 2 - 8)}" stroke="{{c}}" stroke-width="3.6" stroke-linecap="round"/>'
                  f'<path d="{leaf(c1[0] + 3, t - W / 2 - 5.5, 11, -20)}" fill="{{a}}"/>')
        right = c2[0] + r2 + W / 2
    else:  # lowercase p: stem plus a round bowl
        paths.append(st(x, 30, 90))
        cx = x + R
        paths.append(f'M{f(cx)} {f(50 - R)}A{f(R)} {f(R)} 0 1 1 {f(cx)} {f(50 + R)}A{f(R)} {f(R)} 0 1 1 {f(cx)} {f(50 - R)}Z')
        right = cx + R + W / 2
    # a: round bowl plus a stem on the right
    cx = right + g + W / 2 + R
    paths.append(f'M{f(cx)} {f(50 - R)}A{f(R)} {f(R)} 0 1 1 {f(cx)} {f(50 + R)}A{f(R)} {f(R)} 0 1 1 {f(cx)} {f(50 - R)}Z')
    paths.append(st(cx + R, 30, 70))
    right = cx + R + W / 2
    # r: stem plus a quarter arc to the top
    x = right + g + W / 2
    paths.append(st(x, 30, 70))
    paths.append(f'M{f(x)} {f(50 + W / 4)}A{f(R)} {f(R)} 0 0 1 {f(x + R)} {f(30 + W / 2)}')
    right = x + R
    # i
    x = right + g * .9 + W / 2
    paths.append(st(x, 30, 70))
    if dot == 'pear':
        extra += small_pear(x, 30 - W * .62, pear_h or W * 2.6)
    elif dot == 'tilt':
        extra += small_pear(x, 30 - W * .62, pear_h or W * 2.6, tilt=14)
    else:
        extra += f'<circle cx="{f(x)}" cy="{f(30 - W * .62 - W * .6)}" r="{f(W * .6)}" fill="{{a}}"/>'
    right = x + W / 2
    if dot == 'stop':
        right += g * .8
        extra += small_pear(right + 6.5, 70, 26)
        right += 13
    body = f'<path d="{"".join(paths)}" fill="none" stroke="{{a}}" stroke-width="{W}"/>' + extra
    return body, right + 2

V = {
    'a-pear-dot': ('Pear for the dot', 'The dot on the i is a small orange pear. The rest is plain geometric letters drawn on one grid.',
                   word()),
    'b-bold': ('Bold', 'The same, heavier, for signs, the van and anywhere it is seen from a distance.',
               word(W=11.5, g=9)),
    'c-light': ('Light and open', 'Thinner lines and wider spacing. Quieter and more premium.',
                word(W=6.5, g=13, pear_h=19)),
    'd-tilt': ('Tilted pear', 'The pear dot leans a little, which gives the word a bit of life.',
               word(dot='tilt')),
    'e-stop': ('Pear full stop', 'A plain dot on the i, and the pear sits on the line at the end like a full stop: "pari."',
               word(dot='stop')),
    'f-pear-p': ('Pear P', 'The capital P from your first pick, the pear drawn as a line, followed by "ari" in the same style.',
                 word(cap_p=True, dot='round')),
}

os.makedirs(OUT, exist_ok=True)
cards = ''
for i, (key, (name, note, (body, w))) in enumerate(V.items()):
    vb = f'0 -4 {f(w)} 98'
    for t, col in THEMES.items():
        open(f'{OUT}/{key}-{t}.svg', 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">{body.format(**col)}</svg>')
    mk = lambda t, cls: f'<div class="{cls}"><svg viewBox="{vb}">{body.format(**THEMES[t])}</svg></div>'
    cards += f'''<article><header><span class="n">{i + 1:02d}</span><h2>{name}</h2><p>{note}</p></header>
<div class="row"><div class="tile">{mk('light', 'big')}</div><div class="tile dark">{mk('dark', 'big')}</div></div>
<div class="nav"><div class="bar">{mk('light', 'navmark')}<span>Lead generation</span><span>Marketing</span><span>About</span><b>Get leads</b></div></div></article>'''
open(f'{OUT}/index.html', 'w').write(f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Pari Wordmark</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600&family=IBM+Plex+Mono:wght@500&display=swap">
<style>body{{margin:0;background:#F4EDE2;color:{INK};font:15px/1.5 Outfit,system-ui,sans-serif;padding:40px 48px}}
h1{{font:600 34px Outfit,sans-serif;margin:0 0 4px;letter-spacing:-.01em}} .sub{{margin:0 0 32px;color:#6E5E50;max-width:74ch}}
.grid{{display:grid;grid-template-columns:1fr 1fr;gap:20px}}
article{{background:#FFFDF8;border:1px solid rgba(120,60,20,.14);border-radius:18px;padding:22px}}
header{{display:grid;grid-template-columns:auto 1fr;column-gap:12px;align-items:baseline;margin-bottom:14px}}
.n{{font:500 12px "IBM Plex Mono",monospace;color:{ORANGE};letter-spacing:.1em}} h2{{margin:0;font:600 21px Outfit,sans-serif}}
header p{{grid-column:2;margin:2px 0 0;color:#43352A;font-size:14px;min-height:42px}}
.row{{display:grid;grid-template-columns:1fr 1fr;gap:10px}} .tile{{border-radius:12px;background:{CREAM};border:1px solid rgba(120,60,20,.1);height:150px;display:grid;place-items:center}}
.dark{{background:#1D140D}} .big svg{{height:86px;max-width:200px;display:block}}
.nav{{margin-top:10px}} .bar{{display:flex;align-items:center;gap:18px;padding:12px 16px;border-radius:12px;background:{CREAM};border:1px solid rgba(120,60,20,.1);font-size:13px;color:#43352A}}
.navmark svg{{height:30px;display:block}} .bar span:first-of-type{{margin-left:auto}} .bar b{{background:{ORANGE};color:#fff;padding:6px 12px;border-radius:99px;font-weight:600}}</style></head><body>
<h1>Pari wordmark</h1><p class="sub">The name drawn as geometric letters on one grid, the same stroke throughout, with a small pear worked in. Each one is shown large on light and dark, and at the size it would sit in the site header.</p>
<div class="grid">{cards}</div></body></html>''')

src = pathlib.Path(f'{OUT}/index.html').resolve()
subprocess.run([r'C:\Program Files\Google\Chrome\Application\chrome.exe', '--headless=new', '--disable-gpu', '--hide-scrollbars',
                '--window-size=1100,1300', '--virtual-time-budget=4000', f'--screenshot={pathlib.Path(OUT, "sheet.png").resolve()}', src.as_uri()],
               capture_output=True)
print('ok')
