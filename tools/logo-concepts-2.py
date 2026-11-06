# Round 2 of Pari logo concepts: no pear, just a professional lead gen agency. Run: python tools/logo-concepts-2.py
import os, pathlib, subprocess
OUT = 'docs/brand/logo-concepts/round-2'
ORANGE, INK, CREAM = '#C2410C', '#1D140D', '#FBF5EC'
THEMES = {'light': dict(c=ORANGE, a=INK, bg=CREAM), 'dark': dict(c='#EA6A1F', a=CREAM, bg='#1D140D'),
          'icon': dict(c=INK, a=CREAM, bg=ORANGE)}

def svg(body, vb='0 0 100 100'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">{body}</svg>'

C = {
    'signal': ('Signal', 'A P whose bowl is two arcs, like a signal going out. Reads as reach and finding people.',
               '<rect x="22" y="15" width="9" height="73" fill="{a}"/>'
               '<g fill="none" stroke="{c}" stroke-width="8"><path d="M31 19H40A21 21 0 0 1 40 61H31"/>'
               '<path d="M31 32H40A8 8 0 0 1 40 48H31"/></g>'),
    'path': ('Lead to client', 'One line from a starting point to an end point, drawn as a P. A lead found, a client won.',
             '<path d="M25 82V20H44A17 17 0 0 1 44 54H40" fill="none" stroke="{a}" stroke-width="7" stroke-linejoin="round"/>'
             '<rect x="18" y="79" width="14" height="14" fill="{c}"/><rect x="33" y="47" width="14" height="14" fill="{c}"/>'),
    'funnel': ('Filter', 'Three bars narrowing to one orange point: many businesses in, one verified lead out.',
               '<rect x="16" y="18" width="68" height="11" rx="5.5" fill="{a}"/>'
               '<rect x="27" y="36" width="46" height="11" rx="5.5" fill="{a}"/>'
               '<rect x="38" y="54" width="24" height="11" rx="5.5" fill="{a}"/>'
               '<path d="M50 72L58 80L50 88L42 80Z" fill="{c}"/>'),
    'stencil': ('Stencil P', 'A P cut into two plain pieces with a gap, like a stencil. Simple, sturdy, reads at any size.',
                '<rect x="22" y="14" width="15" height="74" fill="{a}"/>'
                '<path d="M42 14H55A20 20 0 0 1 55 54H42Z" fill="{c}"/>'),
    'check': ('Verified P', 'A solid P with a check mark cut through the bowl. Says "verified" without a word.',
              '<path d="M22 14H54A20 20 0 0 1 54 54H37V88H22Z" fill="{c}"/>'
              '<path d="M42 34L49 41L63 27" fill="none" stroke="{bg}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>'),
    'flag': ('Flag P', 'The bowl of the P is a pennant flag on a pole: a marker planted on the next customer.',
             '<rect x="23" y="12" width="10" height="78" fill="{a}"/>'
             '<path d="M38 13.5L72 31L38 48.5Z" fill="{c}" stroke="{c}" stroke-width="3" stroke-linejoin="round"/>'),
    'frame': ('Viewfinder', 'Four corner marks framing one orange point, like a camera locking on. Targeted, not spray-and-pray.',
              '<path d="M19 35V19H35M65 19H81V35M81 65V81H65M35 81H19V65" fill="none" stroke="{a}" stroke-width="7"/>'
              '<path d="M50 38L62 50L50 62L38 50Z" fill="{c}"/>'),
    'word': ('Wordmark', 'No symbol: "pari" in a plain geometric sans, with a square orange full stop. The icon is "p.".',
             '<text x="13" y="69" font-family="Outfit,sans-serif" font-weight="600" font-size="62" fill="{a}">p</text>'
             '<rect x="57" y="58" width="11" height="11" fill="{c}"/>'),
}

os.makedirs(OUT, exist_ok=True)
cards = ''
for i, (key, (name, note, body)) in enumerate(C.items(), 1):
    for t, col in THEMES.items():
        open(f'{OUT}/{i}-{key}-{t}.svg', 'w').write(svg(body.format(**col)))
    mk = lambda t, cls='': f'<div class="{cls}">' + svg(body.format(**THEMES[t])) + '</div>'
    if key == 'word':
        lock = f'<div class="lock wm"><span>pari</span><i></i></div>'
    else:
        lock = f'<div class="lock">{mk("light", "lm")}<span>Pari</span></div>'
    cards += f'''<article><header><span class="n">{i:02d}</span><h2>{name}</h2><p>{note}</p></header>
<div class="row"><div class="tile">{mk('light')}</div><div class="tile dark">{mk('dark')}</div>
<div class="tile icon"><div class="app">{mk('icon')}</div><div class="sizes">{mk('light', 's48')}{mk('light', 's32')}{mk('light', 's16')}</div></div></div>
<div class="locks">{lock}</div></article>'''
open(f'{OUT}/index.html', 'w').write(f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Pari Logo Round 2</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600&family=IBM+Plex+Mono:wght@500&display=swap">
<style>body{{margin:0;background:#F4EDE2;color:{INK};font:15px/1.5 Outfit,system-ui,sans-serif;padding:40px 48px}}
h1{{font:600 34px Outfit,sans-serif;margin:0 0 4px;letter-spacing:-.01em}} .sub{{margin:0 0 32px;color:#6E5E50;max-width:72ch}}
.grid{{display:grid;grid-template-columns:1fr 1fr;gap:20px}}
article{{background:#FFFDF8;border:1px solid rgba(120,60,20,.14);border-radius:18px;padding:22px 22px}}
header{{display:grid;grid-template-columns:auto 1fr;column-gap:12px;align-items:baseline;margin-bottom:14px}}
.n{{font:500 12px "IBM Plex Mono",monospace;color:{ORANGE};letter-spacing:.1em}} h2{{margin:0;font:600 21px Outfit,sans-serif}}
header p{{grid-column:2;margin:2px 0 0;color:#43352A;font-size:14px;min-height:42px}}
.row{{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}} .tile{{border-radius:12px;background:{CREAM};border:1px solid rgba(120,60,20,.1);aspect-ratio:1;display:grid;place-items:center}}
.tile svg{{height:104px;width:104px}} .dark{{background:#1D140D}} .icon{{grid-template-columns:auto auto;gap:12px;align-content:center;justify-content:center}}
.app{{width:64px;height:64px;border-radius:15px;background:{ORANGE};display:grid;place-items:center}} .app svg{{width:52px;height:52px}}
.sizes{{display:grid;gap:8px;justify-items:center;align-items:center}} .s48 svg{{width:32px;height:32px}} .s32 svg{{width:24px;height:24px}} .s16 svg{{width:16px;height:16px}}
.locks{{display:flex;margin-top:12px}} .lock{{display:flex;align-items:center;gap:8px;padding:12px 18px;border-radius:12px;background:{CREAM};border:1px solid rgba(120,60,20,.1)}}
.lm svg{{width:48px;height:48px;display:block}} .lock span{{font:600 38px/1 Outfit,sans-serif;letter-spacing:-.01em}}
.wm{{gap:3px;align-items:baseline;padding:16px 22px}} .wm span{{font-size:46px}} .wm i{{width:9px;height:9px;background:{ORANGE};display:block}}</style></head><body>
<h1>Pari logo concepts, round 2</h1><p class="sub">Starting fresh: no pear, just a professional lead gen agency. Every mark is flat, two colors, built from straight lines and plain arcs, with a P or an idea from the work itself: reach, filtering, verification, targeting.</p>
<div class="grid">{cards}</div></body></html>''')

src = pathlib.Path(f'{OUT}/index.html').resolve()
subprocess.run([r'C:\Program Files\Google\Chrome\Application\chrome.exe', '--headless=new', '--disable-gpu', '--hide-scrollbars',
                '--window-size=1100,1720', '--virtual-time-budget=4000', f'--screenshot={pathlib.Path(OUT, "sheet.png").resolve()}', src.as_uri()],
               capture_output=True)
print('ok')
