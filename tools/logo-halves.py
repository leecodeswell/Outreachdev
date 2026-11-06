# Variations on logo concept 4, "Two halves": a pear cut down the middle, one half and its stem making the p. Run: python tools/logo-halves.py
import math, os, pathlib, subprocess
OUT = 'docs/brand/logo-concepts/halves'
ORANGE, INK, CREAM = '#C2410C', '#1D140D', '#FBF5EC'
THEMES = {'light': dict(c=ORANGE, a=INK, bg=CREAM), 'dark': dict(c='#EA6A1F', a=CREAM, bg='#1D140D'),
          'icon': dict(c=CREAM, a=INK, bg=ORANGE)}

def f(v): return f'{v:.2f}'.rstrip('0').rstrip('.')

def pear(c1, r1, c2, r2, waist=None):
    """Pear outline from a small top circle and a big bottom circle, joined by straight tangents
    or, with waist=R, by concave arcs of radius R (a real pear's neck)."""
    dx, dy = c2[0] - c1[0], c2[1] - c1[1]
    d, th = math.hypot(dx, dy), math.atan2(dy, dx)
    if waist is None:
        a = math.acos((r1 - r2) / d)
        pt = lambda c, r, ang: (c[0] + r * math.cos(ang), c[1] + r * math.sin(ang))
        l1, rt1, l2, rt2 = pt(c1, r1, th + a), pt(c1, r1, th - a), pt(c2, r2, th + a), pt(c2, r2, th - a)
        return (f'M{f(l1[0])} {f(l1[1])}A{r1} {r1} 0 0 1 {f(rt1[0])} {f(rt1[1])}L{f(rt2[0])} {f(rt2[1])}'
                f'A{r2} {r2} 0 1 1 {f(l2[0])} {f(l2[1])}Z')
    # neck circles: R + r1 from c1 and R + r2 from c2, one each side
    R, A, B = waist, waist + r1, waist + r2
    x = (A * A - B * B + d * d) / (2 * d)
    h = math.sqrt(A * A - x * x)
    ux, uy = dx / d, dy / d
    n1 = (c1[0] + x * ux - h * uy, c1[1] + x * uy + h * ux)
    n2 = (c1[0] + x * ux + h * uy, c1[1] + x * uy - h * ux)
    nl, nr = sorted((n1, n2))
    on = lambda c, r, n: (c[0] + r * (n[0] - c[0]) / math.dist(n, c), c[1] + r * (n[1] - c[1]) / math.dist(n, c))
    l1, rt1, l2, rt2 = on(c1, r1, nl), on(c1, r1, nr), on(c2, r2, nl), on(c2, r2, nr)
    return (f'M{f(l1[0])} {f(l1[1])}A{r1} {r1} 0 1 1 {f(rt1[0])} {f(rt1[1])}A{R} {R} 0 0 0 {f(rt2[0])} {f(rt2[1])}'
            f'A{r2} {r2} 0 1 1 {f(l2[0])} {f(l2[1])}A{R} {R} 0 0 0 {f(l1[0])} {f(l1[1])}Z')

def leaf(x, y, length, angle, width=.42):
    a = math.radians(angle)
    tx, ty = x + length * math.cos(a), y + length * math.sin(a)
    r = length * (1 + width * width) / (4 * width)
    return f'M{f(x)} {f(y)}A{f(r)} {f(r)} 0 0 1 {f(tx)} {f(ty)}A{f(r)} {f(r)} 0 0 1 {f(x)} {f(y)}Z'

def svg(body, vb='0 0 100 100'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">{body}</svg>'

G = 2.5  # half the width of the cut
CLIPS = (f'<defs><clipPath id="L{{id}}"><rect x="0" y="0" width="{50 - G}" height="100"/></clipPath>'
         f'<clipPath id="R{{id}}"><rect x="{50 + G}" y="0" width="50" height="100"/></clipPath></defs>')

def halves(shape, stem_top, stem_bot=97, stem_w=8.5, drop=0, left='fill', full_stem=False):
    out = CLIPS
    if left == 'fill':
        out += f'<path d="{shape}" fill="{{a}}" clip-path="url(#L{{id}})"/>'
    else:  # outline only, left open along the cut
        out += f'<path d="{shape}" fill="none" stroke="{{a}}" stroke-width="5" clip-path="url(#L{{id}})"/>'
    out += f'<g transform="translate(0 {drop})"><path d="{shape}" fill="{{c}}" clip-path="url(#R{{id}})"/>'
    if full_stem:
        out += f'<rect x="{50 + G}" y="6" width="{stem_w}" height="{stem_bot - 6}" fill="{{c}}"/>'
        return out + f'<path d="{leaf(50 + G + stem_w - 1, 10, 14, -22)}" fill="{{a}}"/></g>'
    out += f'<rect x="{50 + G}" y="{stem_top}" width="{stem_w}" height="{stem_bot - stem_top}" fill="{{c}}"/></g>'
    out += f'<path d="M50 17V6" stroke="{{a}}" stroke-width="4.5" stroke-linecap="round"/>'
    return out + f'<path d="{leaf(51, 10, 14, -22)}" fill="{{c}}"/>'

plain = pear((50, 29), 10.5, (50, 53), 19.5)
neck = pear((50, 27), 9.5, (50, 56), 18.5, waist=24)
V = {
    'a-refined': ('Refined', 'The original with a longer stem, so the orange half reads as a p, not a pear on a stick.',
                  halves(plain, 58)),
    'b-offset': ('Offset', 'The orange half drops a step, like two pieces sliding together.',
                 halves(plain, 58, drop=5)),
    'c-outline': ('Outline and solid', 'The match is drawn as an open outline; the p is solid.',
                  halves(plain, 58, left='line')),
    'd-full-stem': ('Full stem', 'One orange bar runs top to bottom through the cut, and the leaf grows from it. The strongest p.',
                    halves(plain, 0, full_stem=True)),
    'e-neck': ('With a neck', 'The sides curve in at the neck like a real pear, so it reads less like a teardrop.',
               halves(neck, 60)),
    'f-neck-full': ('Neck and full stem', 'The curved neck combined with the full-height stem.',
                    halves(neck, 0, full_stem=True)),
}

os.makedirs(OUT, exist_ok=True)
cards = ''
for i, (key, (name, note, body)) in enumerate(V.items()):
    for t, col in THEMES.items():
        open(f'{OUT}/{key}-{t}.svg', 'w').write(svg(body.format(id=f'{key[0]}{t}', **col)))
    mk = lambda t, cls='': f'<div class="{cls}">' + svg(body.format(id=f'{key[0]}{t}{cls}', **THEMES[t])) + '</div>'
    cards += f'''<article><header><span class="n">4{chr(65 + i)}</span><h2>{name}</h2><p>{note}</p></header>
<div class="row"><div class="tile">{mk('light')}</div><div class="tile dark">{mk('dark')}</div>
<div class="tile icon"><div class="app">{mk('icon')}</div><div class="sizes">{mk('light', 's48')}{mk('light', 's32')}{mk('light', 's16')}</div></div></div>
<div class="locks"><div class="lock">{mk('light', 'lm')}<span>Pari</span></div><div class="lock word">{mk('light', 'lp')}<span>ari</span></div></div></article>'''
open(f'{OUT}/index.html', 'w').write(f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Pari Two Halves</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600&family=IBM+Plex+Mono:wght@500&display=swap">
<style>body{{margin:0;background:#F4EDE2;color:{INK};font:15px/1.5 Outfit,system-ui,sans-serif;padding:40px 48px}}
h1{{font:600 34px Outfit,sans-serif;margin:0 0 4px;letter-spacing:-.01em}} .sub{{margin:0 0 32px;color:#6E5E50;max-width:72ch}}
article{{background:#FFFDF8;border:1px solid rgba(120,60,20,.14);border-radius:18px;padding:24px 26px;margin-bottom:22px}}
header{{display:grid;grid-template-columns:auto 1fr;column-gap:12px;align-items:baseline;margin-bottom:16px}}
.n{{font:500 12px "IBM Plex Mono",monospace;color:{ORANGE};letter-spacing:.1em}} h2{{margin:0;font:600 22px Outfit,sans-serif}}
header p{{grid-column:2;margin:2px 0 0;color:#43352A}}
.row{{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}} .tile{{border-radius:12px;background:{CREAM};border:1px solid rgba(120,60,20,.1);aspect-ratio:1.25;display:grid;place-items:center}}
.tile svg{{height:170px;width:170px}} .dark{{background:#1D140D}} .icon{{grid-template-columns:auto auto;gap:22px;align-content:center;justify-content:center}}
.app{{width:112px;height:112px;border-radius:26px;background:{ORANGE};display:grid;place-items:center}} .app svg{{width:92px;height:92px}}
.sizes{{display:grid;gap:12px;justify-items:center;align-items:center}} .s48 svg{{width:48px;height:48px}} .s32 svg{{width:32px;height:32px}} .s16 svg{{width:16px;height:16px}}
.locks{{display:flex;gap:14px;margin-top:16px}} .lock{{display:flex;align-items:center;gap:6px;padding:14px 18px;border-radius:12px;background:{CREAM};border:1px solid rgba(120,60,20,.1)}}
.lm svg{{width:58px;height:58px;display:block}} .lock span{{font:600 40px/1 Outfit,sans-serif;letter-spacing:-.01em}}
.word{{gap:0;align-items:flex-start;padding-bottom:4px}} .word span{{font-size:58px;margin-top:22px}} .lp svg{{width:90px;height:90px;display:block;margin:0 -24px 0 -22px}}</style></head><body>
<h1>Two halves, six ways</h1><p class="sub">A pear cut down the middle: the orange half and its stem make the p, the dark half is its match. Each one in light, dark, as an app icon, at favicon sizes, and in two lockups, including one where the mark is the p in "pari".</p>
{cards}</body></html>''')

src = pathlib.Path(f'{OUT}/index.html').resolve()
subprocess.run([r'C:\Program Files\Google\Chrome\Application\chrome.exe', '--headless=new', '--disable-gpu', '--hide-scrollbars',
                '--window-size=1000,3080', '--virtual-time-budget=4000', f'--screenshot={pathlib.Path(OUT, "sheet.png").resolve()}', src.as_uri()],
               capture_output=True)
print('ok')
