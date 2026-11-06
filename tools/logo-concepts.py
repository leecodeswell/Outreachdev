# Draws the Pari logo concepts (P + pear + pair) from circles and tangent lines. Run: python tools/logo-concepts.py
import math, os
OUT = 'docs/brand/logo-concepts'
ORANGE, INK, CREAM = '#C2410C', '#1D140D', '#FBF5EC'

def f(v): return f'{v:.2f}'.rstrip('0').rstrip('.')

def tangents(c1, r1, c2, r2):
    """Outer tangent points between a small top circle and a big bottom circle: (left1, right1, left2, right2)."""
    dx, dy = c2[0] - c1[0], c2[1] - c1[1]
    d, th = math.hypot(dx, dy), math.atan2(dy, dx)
    a = math.acos((r1 - r2) / d)
    pts = {}
    for side, ang in (('r', th - a), ('l', th + a)):
        n = (math.cos(ang), math.sin(ang))
        pts[side] = ((c1[0] + r1 * n[0], c1[1] + r1 * n[1]), (c2[0] + r2 * n[0], c2[1] + r2 * n[1]))
    return pts['l'][0], pts['r'][0], pts['l'][1], pts['r'][1]

def pear(c1, r1, c2, r2):
    l1, r1p, l2, r2p = tangents(c1, r1, c2, r2)
    return (f'M{f(l1[0])} {f(l1[1])}A{f(r1)} {f(r1)} 0 0 1 {f(r1p[0])} {f(r1p[1])}'
            f'L{f(r2p[0])} {f(r2p[1])}A{f(r2)} {f(r2)} 0 1 1 {f(l2[0])} {f(l2[1])}Z')

def leaf(x, y, length, angle, width=.42):
    """A leaf made of two equal arcs from (x, y), pointing at angle degrees (0 = right, -90 = up)."""
    a = math.radians(angle)
    tx, ty = x + length * math.cos(a), y + length * math.sin(a)
    r = length * (1 + width * width) / (4 * width) * 1.0
    return f'M{f(x)} {f(y)}A{f(r)} {f(r)} 0 0 1 {f(tx)} {f(ty)}A{f(r)} {f(r)} 0 0 1 {f(x)} {f(y)}Z'

def svg(body, vb='0 0 100 100', bg=None):
    rect = f'<rect x="-50" y="-50" width="300" height="300" fill="{bg}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">{rect}{body}</svg>'

concepts = {}
TWIG = 'stroke="{c}" stroke-width="4.5" stroke-linecap="round"'

# 1. Pear P, line: one stroke weight. The P's stem is the pear's flat side carried down; the top corner stays square so it reads as P.
L, a1, a2 = 28, 11, 19
c1, c2 = (L + a1, 29), (L + a2, 54)
_, rt1, _, rt2 = tangents(c1, a1, c2, a2)
body = (f'<g fill="none" stroke="{{c}}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">'
        f'<path d="M{L} 93V{c1[1] - a1}H{c1[0]}A{a1} {a1} 0 0 1 {f(rt1[0])} {f(rt1[1])}L{f(rt2[0])} {f(rt2[1])}A{a2} {a2} 0 1 1 {L} {c2[1]}"/></g>'
        f'<path d="M{c1[0] + 1} {c1[1] - a1 - 4}L{c1[0] + 3} {c1[1] - a1 - 11}" {TWIG}/>'
        f'<path d="{leaf(c1[0] + 3.5, c1[1] - a1 - 8.5, 14, -22)}" fill="{{a}}"/>')
concepts['1-pear-p-line'] = ('Pear P, line', "The P's stem is the flat side of the pear, carried down. One stroke weight, square top corner so it reads as a P.", body)

# 2. Pear P, solid: a flat-sided pear sitting on a straight stem, with a round counter.
def pear_p_solid(dx=0, dy=0, counter=True):
    L, b1, b2 = 22 + dx, 13, 22
    k1, k2 = (L + b1, 30 + dy), (L + b2, 56 + dy)
    out = (f'<rect x="{L}" y="{k1[1] - b1}" width="10" height="{94 + dy - (k1[1] - b1)}" fill="{{c}}"/>'
           f'<path d="{pear(k1, b1, k2, b2)}" fill="{{c}}"/>')
    if counter:
        out += f'<circle cx="{k2[0] + 1}" cy="{k2[1]}" r="8.5" fill="{{bg}}"/>'
    out += (f'<path d="M{k1[0] + 1} {k1[1] - b1 - 3}L{k1[0] + 3} {k1[1] - b1 - 11}" {TWIG}/>'
            f'<path d="{leaf(k1[0] + 3.5, k1[1] - b1 - 8.5, 14, -22)}" fill="{{a}}"/>')
    return out, k1, b1, k2, b2
body = pear_p_solid()[0]
concepts['2-pear-p-solid'] = ('Pear P, solid', 'The same idea filled in, with a round counter so it still reads as a P at favicon size.', body)

# 3. The pair: the solid Pear P with a partner pear beside it, separated by a thin cut.
pp, k1, b1, k2, b2 = pear_p_solid(-8, 0)
q1, q2, s1, s2 = (74, 46), (74, 66), 10, 17
partner = pear(q1, s1, q2, s2)
body = (pp.replace(f'<path d="{leaf(k1[0] + 3.5, k1[1] - b1 - 8.5, 14, -22)}" fill="{{a}}"/>', '') +
        f'<path d="{partner}" fill="{{bg}}" stroke="{{bg}}" stroke-width="7"/>'
        f'<path d="{partner}" fill="{{a}}"/>'
        f'<path d="M{q1[0]} {q1[1] - s1 - 1}L{q1[0] + 2} {q1[1] - s1 - 9}" stroke="{{a}}" stroke-width="4.5" stroke-linecap="round"/>'
        f'<path d="{leaf(k1[0] + 3.5, k1[1] - b1 - 8.5, 14, -22)}" fill="{{a}}"/>')
concepts['3-the-pair'] = ('The pair', 'The pear P with a partner pear tucked in beside it. A P, a pear and a pair in one mark.', body)

# 4. Two halves: a pear cut down the middle. The orange half and the stem below the cut make a lowercase p; the dark half is its match.
k1, k2, b1, b2 = (50, 31), (50, 53), 12, 20
whole = pear(k1, b1, k2, b2)
body = (f'<defs><clipPath id="L{{id}}"><rect x="0" y="0" width="47.5" height="100"/></clipPath>'
        f'<clipPath id="R{{id}}"><rect x="52.5" y="0" width="48" height="100"/></clipPath></defs>'
        f'<path d="{whole}" fill="{{a}}" clip-path="url(#L{{id}})"/>'
        f'<path d="{whole}" fill="{{c}}" clip-path="url(#R{{id}})"/>'
        f'<rect x="52.5" y="60" width="9" height="36" fill="{{c}}"/>'
        f'<path d="M50 16.5V6" stroke="{{a}}" stroke-width="4.5" stroke-linecap="round"/>'
        f'<path d="{leaf(51, 10, 14, -22)}" fill="{{c}}"/>')
concepts['4-two-halves'] = ('Two halves', 'A pear cut down the middle. The orange half and the stem make the p; the dark half is its match.', body)

# 5. Two circles: a pear is a pair of circles. The overlap is cut out as a lens; the stem makes the P.
m1, m2, d1, d2 = (45, 29), (53, 55), 12, 20
body = (f'<rect x="23" y="17" width="10" height="77" rx="5" fill="{{c}}"/>'
        f'<circle cx="{m1[0]}" cy="{m1[1]}" r="{d1}" fill="{{a}}"/>'
        f'<circle cx="{m2[0]}" cy="{m2[1]}" r="{d2}" fill="{{c}}"/>'
        f'<clipPath id="o{{id}}"><circle cx="{m1[0]}" cy="{m1[1]}" r="{d1}"/></clipPath>'
        f'<circle cx="{m2[0]}" cy="{m2[1]}" r="{d2}" fill="{{bg}}" clip-path="url(#o{{id}})"/>'
        f'<path d="M{m1[0] + 1} {m1[1] - d1 - 1}L{m1[0] + 3} {m1[1] - d1 - 9}" {TWIG}/>'
        f'<path d="{leaf(m1[0] + 3.5, m1[1] - d1 - 6.5, 13, -22)}" fill="{{a}}"/>')
concepts['5-two-circles'] = ('Two circles', 'A pear is literally a pair of circles. Where they overlap is cut out, the way a lead and a client match.', body)

THEMES = {'light': dict(c=ORANGE, a=INK, bg=CREAM), 'dark': dict(c='#EA6A1F', a=CREAM, bg='#1D140D'),
          'mono': dict(c=INK, a=INK, bg=CREAM), 'icon': dict(c=CREAM, a=INK, bg=ORANGE)}
os.makedirs(OUT, exist_ok=True)
for key, (name, note, body) in concepts.items():
    for t, col in THEMES.items():
        s = body.format(id=f'{key[0]}{t}', **col)
        open(f'{OUT}/{key}-{t}.svg', 'w').write(svg(s, bg=None if t != 'dark' else None))

# Concept sheet: each mark large on light and dark, as an app icon, at favicon sizes and with the wordmark.
cards = ''
for i, (key, (name, note, body)) in enumerate(concepts.items(), 1):
    mk = lambda t, cls='': f'<div class="{cls}">' + svg(body.format(id=f'{key[0]}{t}{cls}', **THEMES[t])) + '</div>'
    cards += f'''<article><header><span class="n">0{i}</span><h2>{name}</h2><p>{note}</p></header>
<div class="row"><div class="tile">{mk('light')}</div><div class="tile dark">{mk('dark')}</div>
<div class="tile icon"><div class="app">{mk('icon')}</div><div class="sizes">{mk('light', 's48')}{mk('light', 's32')}{mk('light', 's16')}</div></div></div>
<div class="lock">{mk('light', 'lm')}<span>Pari</span></div></article>'''
open(f'{OUT}/index.html', 'w').write(f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Pari Logo Concepts</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600&family=IBM+Plex+Mono:wght@500&display=swap">
<style>body{{margin:0;background:#F4EDE2;color:{INK};font:15px/1.5 Outfit,system-ui,sans-serif;padding:40px 48px}}
h1{{font:600 34px Outfit,sans-serif;margin:0 0 4px;letter-spacing:-.01em}} .sub{{margin:0 0 32px;color:#6E5E50;max-width:70ch}}
article{{background:#FFFDF8;border:1px solid rgba(120,60,20,.14);border-radius:18px;padding:24px 26px;margin-bottom:22px}}
header{{display:grid;grid-template-columns:auto 1fr;column-gap:12px;align-items:baseline;margin-bottom:16px}}
.n{{font:500 12px "IBM Plex Mono",monospace;color:{ORANGE};letter-spacing:.1em}} h2{{margin:0;font:600 22px Outfit,sans-serif}}
header p{{grid-column:2;margin:2px 0 0;color:#43352A}}
.row{{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}} .tile{{border-radius:12px;background:{CREAM};border:1px solid rgba(120,60,20,.1);aspect-ratio:1.25;display:grid;place-items:center}}
.tile svg{{height:170px;width:170px}} .dark{{background:#1D140D}} .icon{{grid-template-columns:auto auto;gap:22px;align-content:center;justify-content:center}}
.app{{width:112px;height:112px;border-radius:26px;background:{ORANGE};display:grid;place-items:center}} .app svg{{width:92px;height:92px}}
.sizes{{display:grid;gap:12px;justify-items:center;align-items:center}} .s48 svg{{width:48px;height:48px}} .s32 svg{{width:32px;height:32px}} .s16 svg{{width:16px;height:16px}}
.lock{{display:flex;align-items:center;gap:6px;margin-top:16px;padding:14px 18px;border-radius:12px;background:{CREAM};border:1px solid rgba(120,60,20,.1);width:max-content}}
.lm svg{{width:58px;height:58px}} .lock span{{font:600 40px/1 Outfit,sans-serif;letter-spacing:-.01em}}</style></head><body>
<h1>Pari logo concepts</h1><p class="sub">P + pear + pair. Drawn only from circles, straight lines and one leaf shape, two colors, no gradients or gloss. The wordmark is set in Outfit, a plain geometric sans.</p>
{cards}</body></html>''')
print('ok')
