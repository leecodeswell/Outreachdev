# Regenerates favicons and the Open Graph image. Run: python tools/brand-assets.py
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
F = 'C:/Windows/Fonts/'
def grad(w, h, stops):
    ys = np.linspace(0, 1, h)[:, None]
    out = np.zeros((h, w, 3))
    for (p0, c0), (p1, c1) in zip(stops, stops[1:]):
        m = ((ys >= p0) & (ys <= p1)).astype(float)
        t = np.clip((ys - p0) / (p1 - p0 + 1e-9), 0, 1)
        out += m[..., None] * (np.array(c0) * (1 - t[..., None]) + np.array(c1) * t[..., None]) * np.ones((1, w, 1))
    return Image.fromarray(out.clip(0, 255).astype(np.uint8))
def mark(S):
    s = S * 4
    g = grad(s, s, [(0, (234, 106, 31)), (.55, (194, 65, 12)), (1, (154, 52, 9))]).convert('RGBA')
    mask = Image.new('L', (s, s), 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * .26), fill=255)
    hi = Image.new('L', (s, s), 0); ImageDraw.Draw(hi).ellipse([-s * .3, -s * .75, s * 1.3, s * .42], fill=70)
    g = Image.composite(Image.new('RGBA', (s, s), (255, 255, 255, 255)), g, hi)
    d = ImageDraw.Draw(g)
    f = ImageFont.truetype(F + 'georgiab.ttf', int(s * .66))
    bb = d.textbbox((0, 0), 'P', font=f)
    d.text(((s - (bb[2] - bb[0])) / 2 - bb[0], (s - (bb[3] - bb[1])) / 2 - bb[1]), 'P', font=f, fill=(255, 247, 238))
    out = Image.new('RGBA', (s, s), (0, 0, 0, 0)); out.paste(g, (0, 0), mask)
    return out.resize((S, S), Image.LANCZOS)
for S in (16, 32, 48, 180, 192, 512):
    mark(S).save(f'assets/icons/icon-{S}.png')
mark(256).save('favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
# OG image
bg = Image.open('assets/img/peaks-sketch-1600.webp').convert('RGB')
bg = bg.resize((1200, int(1200 * bg.height / bg.width)), Image.LANCZOS).crop((0, 60, 1200, 690))
og = bg.convert('RGBA')
panel = Image.new('RGBA', og.size, (0, 0, 0, 0))
pd = ImageDraw.Draw(panel)
box = [70, 120, 1130, 520]
blurred = og.filter(ImageFilter.GaussianBlur(10))
m = Image.new('L', og.size, 0); ImageDraw.Draw(m).rounded_rectangle(box, radius=36, fill=255)
og = Image.composite(blurred, og, m)
pd.rounded_rectangle(box, radius=36, fill=(255, 255, 255, 150), outline=(255, 255, 255, 235), width=2)
pd.rounded_rectangle([box[0] + 2, box[1] + 2, box[2] - 2, box[1] + 120], radius=34, fill=(255, 255, 255, 60))
og = Image.alpha_composite(og, panel)
d = ImageDraw.Draw(og)
mono = ImageFont.truetype(F + 'consola.ttf', 22)
serif = ImageFont.truetype(F + 'georgia.ttf', 58)
body = ImageFont.truetype(F + 'segoeui.ttf', 28)
d.text((120, 168), 'LEAD GENERATION & MARKETING', font=mono, fill=(178, 60, 10))
d.text((120, 212), 'Verified leads and', font=serif, fill=(29, 20, 13))
d.text((120, 282), 'marketing for businesses', font=serif, fill=(29, 20, 13))
d.text((120, 352), 'ready to grow.', font=serif, fill=(29, 20, 13))
d.text((120, 448), 'Pari  ·  parileads.com  ·  641-596-0111', font=body, fill=(67, 53, 42))
og.paste(mark(56), (1034, 152), mark(56))
og.convert('RGB').save('assets/og-image.jpg', quality=88)
print('ok')
