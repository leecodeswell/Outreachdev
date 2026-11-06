# Draws the Pari wordmark ("pari" with a pear for the i's dot) and the "p." icon (the full stop is the pear),
# then renders the PNG masters and social profile pictures with headless Chrome.
# Run: python tools/brand-logo.py, then python tools/brand-assets.py for favicons and the OG image.
import math, os, pathlib, subprocess, tempfile
INK, ORANGE, CREAM = '#1D140D', '#C2410C', '#FBF5EC'
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
W, G = 9, 10            # stroke weight and letter gap, on a 40-unit x-height from y=30 to y=70
R = (40 - W) / 2        # centre-line radius of the round letters

def f(v): return f'{v:.2f}'.rstrip('0').rstrip('.')

def pear_path(c1, r1, c2, r2):
    dx, dy = c2[0] - c1[0], c2[1] - c1[1]
    th, a = math.atan2(dy, dx), math.acos((r1 - r2) / math.hypot(dx, dy))
    pt = lambda c, r, ang: (c[0] + r * math.cos(ang), c[1] + r * math.sin(ang))
    l1, rt1, l2, rt2 = pt(c1, r1, th + a), pt(c1, r1, th - a), pt(c2, r2, th + a), pt(c2, r2, th - a)
    return (f'M{f(l1[0])} {f(l1[1])}A{f(r1)} {f(r1)} 0 0 1 {f(rt1[0])} {f(rt1[1])}L{f(rt2[0])} {f(rt2[1])}'
            f'A{f(r2)} {f(r2)} 0 1 1 {f(l2[0])} {f(l2[1])}Z')

def leaf_path(x, y, length, angle, width=.42):
    a = math.radians(angle)
    tx, ty = x + length * math.cos(a), y + length * math.sin(a)
    r = length * (1 + width * width) / (4 * width)
    return f'M{f(x)} {f(y)}A{f(r)} {f(r)} 0 0 1 {f(tx)} {f(ty)}A{f(r)} {f(r)} 0 0 1 {f(x)} {f(y)}Z'

def pear(x, bottom, h, fruit, leaf):
    """Solid pear h units tall (twig and leaf included), bottom at y=bottom."""
    s = h / 26
    r1, r2 = 3.6 * s, 6 * s
    c2 = (x, bottom - r2)
    c1 = (x, c2[1] - 7.4 * s)
    top = c1[1] - r1
    return (f'<path d="{pear_path(c1, r1, c2, r2)}" fill="{fruit}"/>'
            f'<path d="M{f(x + .4 * s)} {f(top + .8 * s)}L{f(x + 1.4 * s)} {f(top - 4 * s)}" stroke="{fruit}" stroke-width="{f(2 * s)}" stroke-linecap="round"/>'
            f'<path d="{leaf_path(x + 1.2 * s, top - 2.6 * s, 6.6 * s, -18)}" fill="{leaf}"/>')

def ring(cx):
    return f'M{f(cx)} {f(50 - R)}A{f(R)} {f(R)} 0 1 1 {f(cx)} {f(50 + R)}A{f(R)} {f(R)} 0 1 1 {f(cx)} {f(50 - R)}Z'

def letter_p(x):
    """Lowercase p with its stem centred on x. Returns (path, right edge)."""
    return f'M{f(x)} 30V90' + ring(x + R), x + 2 * R + W / 2

def wordmark(ink, fruit, leaf):
    """'pari' with a pear dot. Returns (svg body, viewBox)."""
    d, right = letter_p(W / 2 + 2)
    cx = right + G + W / 2 + R                                   # a
    d += ring(cx) + f'M{f(cx + R)} 30V70'
    x = cx + R + W / 2 + G + W / 2                               # r
    d += f'M{f(x)} 30V70M{f(x)} {f(50 + W / 4)}A{f(R)} {f(R)} 0 0 1 {f(x + R)} {f(30 + W / 2)}'
    x = x + R + G * .9 + W / 2                                   # i
    d += f'M{f(x)} 30V70'
    body = f'<path d="{d}" fill="none" stroke="{ink}" stroke-width="{W}"/>' + pear(x, 30 - W * .62, W * 2.6, fruit, leaf)
    return body, f'0 -4 {f(x + W / 2 + 8)} 98'

def icon(ink, fruit, leaf, fill=.56):
    """'p.' where the full stop is the pear. fill is how much of the square the drawing spans."""
    d, right = letter_p(W / 2 + 2)
    px = right + 6 + 6
    body = f'<path d="{d}" fill="none" stroke="{ink}" stroke-width="{W}"/>' + pear(px, 70, 26, fruit, leaf)
    x0, x1, y0, y1 = 2, px + 8, 30, 90
    size = max(x1 - x0, y1 - y0) / fill
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    return body, f'{f(cx - size / 2)} {f(cy - size / 2)} {f(size)} {f(size)}'

def svg(body, vb, bg=None, extra=''):
    rect = f'<rect x="-999" y="-999" width="2999" height="2999" fill="{bg}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}"{extra}>{rect}{body}</svg>'

def render(svg_text, out, px):
    with tempfile.TemporaryDirectory(dir='.') as tmp:
        page = pathlib.Path(tmp, 'r.html')
        page.write_text(f'<style>html,body{{margin:0}}svg{{display:block;width:{px}px;height:{px}px}}</style>{svg_text}')
        subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', f'--window-size={px},{px}',
                        f'--screenshot={pathlib.Path(out).resolve()}', page.resolve().as_uri()], check=True, capture_output=True)
    print(out)

os.makedirs('assets/brand', exist_ok=True)
os.makedirs('docs/brand/social', exist_ok=True)
body, vb = wordmark(INK, ORANGE, INK)
open('assets/brand/pari-wordmark.svg', 'w').write(svg(body, vb))
body, vb = wordmark(CREAM, '#EA6A1F', CREAM)
open('assets/brand/pari-wordmark-on-dark.svg', 'w').write(svg(body, vb))
body, vb = icon(INK, ORANGE, INK, fill=.7)
open('assets/brand/pari-icon.svg', 'w').write(svg(body, vb, CREAM))
render(svg(body, vb, CREAM), 'assets/brand/pari-icon-1024.png', 1024)
# Profile pictures: TikTok and Facebook crop to a circle, so the drawing stays inside the middle.
body, vb = icon(INK, ORANGE, INK)
render(svg(body, vb, CREAM), 'docs/brand/social/pari-pfp-cream.png', 1080)
body, vb = icon(CREAM, '#EA6A1F', CREAM)
render(svg(body, vb, INK), 'docs/brand/social/pari-pfp-dark.png', 1080)
body, vb = icon(CREAM, INK, CREAM)
render(svg(body, vb, ORANGE), 'docs/brand/social/pari-pfp-orange.png', 1080)
# Inline header/footer wordmark: letters follow the text colour, the pear stays orange.
body, vb = wordmark('currentColor', 'var(--orange)', 'currentColor')
open('src/wordmark-inline.svg', 'w').write(svg(body, vb, extra=' class="wordmark" aria-hidden="true" focusable="false"').replace(' xmlns="http://www.w3.org/2000/svg"', ''))
