# Variations on logo concept 1, "Pear P, line", with a check mark. Run: python tools/logo-pear-check.py
import math, os, pathlib, subprocess
OUT = 'docs/brand/logo-concepts/pear-check'
ORANGE, INK, CREAM = '#C2410C', '#1D140D', '#FBF5EC'
THEMES = {'light': dict(c=ORANGE, a=INK, bg=CREAM), 'dark': dict(c='#EA6A1F', a=CREAM, bg='#1D140D'),
          'icon': dict(c=CREAM, a=INK, bg=ORANGE)}
SW = 7  # stroke weight

def f(v): return f'{v:.2f}'.rstrip('0').rstrip('.')

def svg(body, vb='0 0 100 100'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">{body}</svg>'

def pear_p(L, top, r1, y1, r2, y2, bottom=93, neck=None):
    """Path for a P whose bowl is a pear sitting flat against the stem at x=L.
    Both circles touch the stem; neck=R joins them with a concave arc, otherwise a straight tangent."""
    c1, c2 = (L + r1, y1), (L + r2, y2)
    dx, dy = c2[0] - c1[0], c2[1] - c1[1]
    d, th = math.hypot(dx, dy), math.atan2(dy, dx)
    start = f'M{L} {bottom}V{top}H{f(c1[0])}'
    if top != y1 - r1:
        raise ValueError('top must sit on the small circle')
    if neck is None:
        a = th - math.acos((r1 - r2) / d)
        p1 = (c1[0] + r1 * math.cos(a), c1[1] + r1 * math.sin(a))
        p2 = (c2[0] + r2 * math.cos(a), c2[1] + r2 * math.sin(a))
        mid = f'A{r1} {r1} 0 0 1 {f(p1[0])} {f(p1[1])}L{f(p2[0])} {f(p2[1])}'
    else:
        R, A, B = neck, neck + r1, neck + r2
        x = (A * A - B * B + d * d) / (2 * d)
        h = math.sqrt(A * A - x * x)
        ux, uy = dx / d, dy / d
        n = max((c1[0] + x * ux - h * uy, c1[1] + x * uy + h * ux), (c1[0] + x * ux + h * uy, c1[1] + x * uy - h * ux))
        on = lambda c, r: (c[0] + r * (n[0] - c[0]) / math.dist(n, c), c[1] + r * (n[1] - c[1]) / math.dist(n, c))
        p1, p2 = on(c1, r1), on(c2, r2)
        mid = f'A{r1} {r1} 0 0 1 {f(p1[0])} {f(p1[1])}A{R} {R} 0 0 0 {f(p2[0])} {f(p2[1])}'
    return start + mid + f'A{r2} {r2} 0 1 1 {L} {f(c2[1])}', c1, c2

def stroke(d, col='{c}', w=SW):
    return f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'

def leaf(x, y, length, angle, width=.42):
    a = math.radians(angle)
    tx, ty = x + length * math.cos(a), y + length * math.sin(a)
    r = length * (1 + width * width) / (4 * width)
    return f'<path d="M{f(x)} {f(y)}A{f(r)} {f(r)} 0 0 1 {f(tx)} {f(ty)}A{f(r)} {f(r)} 0 0 1 {f(x)} {f(y)}Z" fill="{{a}}"/>'

def twig(c1, r1, col='{c}'):
    x, y = c1[0], c1[1] - r1
    return stroke(f'M{f(x + 1)} {f(y - 5.5)}L{f(x + 3)} {f(y - 12)}', col, 4.5) + leaf(x + 3.5, y - 9.5, 14, -22)

def check_twig(c1, r1, col='{a}'):
    """The twig becomes a check mark sitting on top of the pear, its long arm reaching up and right."""
    x, y = c1[0], c1[1] - r1
    return stroke(f'M{f(x - 6)} {f(y - 12)}L{f(x + 1)} {f(y - 6)}L{f(x + 16)} {f(y - 21)}', col, 5.5)

def tick_stem(L, bottom, col='{c}'):
    """A short arm at the foot of the stem, so the stem is the long arm of a check mark."""
    return stroke(f'M{L - 11} {bottom - 10}L{L} {bottom}', col, SW)

def check_in(c2, col='{a}'):
    x, y = c2[0] + 1, c2[1] + 1
    return stroke(f'M{f(x - 7.5)} {f(y)}L{f(x - 2.5)} {f(y + 5)}L{f(x + 7.5)} {f(y - 5.5)}', col, 5)

# Taller, narrower pears with a pinched neck than round 1, so the bowl reads as fruit, not a hanging curve.
NECK = dict(L=31, top=27, r1=8.5, y1=35.5, r2=16, y2=60, neck=18)
SLIM = dict(L=31, top=27, r1=9, y1=36, r2=15.5, y2=60)
neck_d, n1, n2 = pear_p(**NECK, bottom=95)
foot_d, _, _ = pear_p(**NECK, bottom=93)
slim_d, s1, s2 = pear_p(**SLIM, bottom=95)

V = {
    'a-check-twig': ('Check for a stem', 'The twig on top of the pear is a check mark. Pear, P and "verified" in one drawing.',
                     stroke(neck_d) + check_twig(n1, 8.5)),
    'b-check-twig-2c': ('Check for a stem, two colors', 'The same in dark ink, with only the check in orange so the eye lands on "verified".',
                        stroke(neck_d, '{a}') + check_twig(n1, 8.5, '{c}')),
    'c-check-inside': ('Check inside', 'A check sits in the bowl, so the round part reads as a badge.',
                       stroke(neck_d) + check_in(n2) + twig(n1, 8.5)),
    'd-check-inside-2c': ('Check inside, two colors', 'Dark P, orange check and leaf.',
                          stroke(neck_d, '{a}') + check_in(n2, '{c}') + twig(n1, 8.5, '{a}').replace('fill="{a}"', 'fill="{c}"')),
    'e-check-foot': ('Check at the foot', "The P's stem is the long arm of a check mark, with the leaf on top.",
                     stroke(foot_d) + tick_stem(31, 93) + twig(n1, 8.5)),
    'f-slim-inside': ('Slim, check inside', 'Straight sides instead of a neck, slimmer bowl, check inside.',
                      stroke(slim_d) + check_in(s2) + twig(s1, 9)),
}

os.makedirs(OUT, exist_ok=True)
cards = ''
for i, (key, (name, note, body)) in enumerate(V.items()):
    for t, col in THEMES.items():
        open(f'{OUT}/{key}-{t}.svg', 'w').write(svg(body.format(**col)))
    mk = lambda t, cls='': f'<div class="{cls}">' + svg(body.format(**THEMES[t])) + '</div>'
    cards += f'''<article><header><span class="n">1{chr(65 + i)}</span><h2>{name}</h2><p>{note}</p></header>
<div class="row"><div class="tile">{mk('light')}</div><div class="tile dark">{mk('dark')}</div>
<div class="tile icon"><div class="app">{mk('icon')}</div><div class="sizes">{mk('light', 's48')}{mk('light', 's32')}{mk('light', 's16')}</div></div></div>
<div class="locks"><div class="lock">{mk('light', 'lm')}<span>Pari</span></div></div></article>'''
open(f'{OUT}/index.html', 'w').write(f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Pari Pear Check</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600&family=IBM+Plex+Mono:wght@500&display=swap">
<style>body{{margin:0;background:#F4EDE2;color:{INK};font:15px/1.5 Outfit,system-ui,sans-serif;padding:40px 48px}}
h1{{font:600 34px Outfit,sans-serif;margin:0 0 4px;letter-spacing:-.01em}} .sub{{margin:0 0 32px;color:#6E5E50;max-width:72ch}}
.grid{{display:grid;grid-template-columns:1fr 1fr;gap:20px}}
article{{background:#FFFDF8;border:1px solid rgba(120,60,20,.14);border-radius:18px;padding:22px}}
header{{display:grid;grid-template-columns:auto 1fr;column-gap:12px;align-items:baseline;margin-bottom:14px}}
.n{{font:500 12px "IBM Plex Mono",monospace;color:{ORANGE};letter-spacing:.1em}} h2{{margin:0;font:600 21px Outfit,sans-serif}}
header p{{grid-column:2;margin:2px 0 0;color:#43352A;font-size:14px;min-height:42px}}
.row{{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}} .tile{{border-radius:12px;background:{CREAM};border:1px solid rgba(120,60,20,.1);aspect-ratio:1;display:grid;place-items:center}}
.tile svg{{height:120px;width:120px}} .dark{{background:#1D140D}} .icon{{grid-template-columns:auto auto;gap:12px;align-content:center;justify-content:center}}
.app{{width:64px;height:64px;border-radius:15px;background:{ORANGE};display:grid;place-items:center}} .app svg{{width:54px;height:54px}}
.sizes{{display:grid;gap:8px;justify-items:center;align-items:center}} .s48 svg{{width:32px;height:32px}} .s32 svg{{width:24px;height:24px}} .s16 svg{{width:16px;height:16px}}
.locks{{display:flex;margin-top:12px}} .lock{{display:flex;align-items:center;gap:6px;padding:12px 18px;border-radius:12px;background:{CREAM};border:1px solid rgba(120,60,20,.1)}}
.lm svg{{width:52px;height:52px;display:block}} .lock span{{font:600 38px/1 Outfit,sans-serif;letter-spacing:-.01em}}</style></head><body>
<h1>Pear P with a check</h1><p class="sub">Back to the first concept, the pear P drawn in one line. The bowl is smaller and narrower with a pinched neck so it reads as fruit, and each version works in a check mark for "verified".</p>
<div class="grid">{cards}</div></body></html>''')

src = pathlib.Path(f'{OUT}/index.html').resolve()
subprocess.run([r'C:\Program Files\Google\Chrome\Application\chrome.exe', '--headless=new', '--disable-gpu', '--hide-scrollbars',
                '--window-size=1100,1340', '--virtual-time-budget=4000', f'--screenshot={pathlib.Path(OUT, "sheet.png").resolve()}', src.as_uri()],
               capture_output=True)
print('ok')
