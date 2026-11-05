# Builds the profile picture and Facebook cover for the social accounts. Run: python tools/social-assets.py
# Output goes to docs/social/, which is kept off the website.
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
F = 'C:/Windows/Fonts/'
OUT = 'docs/social'
os.makedirs(OUT, exist_ok=True)

def grad(w, h, stops):
    ys = np.linspace(0, 1, h)[:, None]
    out = np.zeros((h, w, 3))
    for (p0, c0), (p1, c1) in zip(stops, stops[1:]):
        m = ((ys >= p0) & (ys <= p1)).astype(float)
        t = np.clip((ys - p0) / (p1 - p0 + 1e-9), 0, 1)
        out += m[..., None] * (np.array(c0) * (1 - t[..., None]) + np.array(c1) * t[..., None]) * np.ones((1, w, 1))
    return Image.fromarray(out.clip(0, 255).astype(np.uint8))

# Profile picture: full-bleed orange square with the P centred, so the circular crop keeps it whole
S = 1080
p = grad(S, S, [(0, (234, 106, 31)), (.55, (194, 65, 12)), (1, (154, 52, 9))]).convert('RGBA')
hi = Image.new('L', (S, S), 0); ImageDraw.Draw(hi).ellipse([-S * .3, -S * .75, S * 1.3, S * .42], fill=45)
hi = hi.filter(ImageFilter.GaussianBlur(S * .08))
p = Image.composite(Image.new('RGBA', (S, S), (255, 255, 255, 255)), p, hi)
d = ImageDraw.Draw(p)
f = ImageFont.truetype(F + 'georgiab.ttf', int(S * .56))
bb = d.textbbox((0, 0), 'P', font=f)
d.text(((S - (bb[2] - bb[0])) / 2 - bb[0], (S - (bb[3] - bb[1])) / 2 - bb[1]), 'P', font=f, fill=(255, 247, 238))
p.convert('RGB').save(f'{OUT}/profile-1080.png')

# Facebook cover: 1640x624, text kept in the centre 820px that phones show
W, H = 1640, 624
bg = Image.open('assets/img/peaks-sketch-1600.webp').convert('RGB')
bg = bg.resize((W, int(W * bg.height / bg.width)), Image.LANCZOS)
top = (bg.height - H) // 2
cv = bg.crop((0, top, W, top + H)).convert('RGBA')
box = [410, 150, 1230, 474]
m = Image.new('L', cv.size, 0); ImageDraw.Draw(m).rounded_rectangle(box, radius=36, fill=255)
cv = Image.composite(cv.filter(ImageFilter.GaussianBlur(10)), cv, m)
panel = Image.new('RGBA', cv.size, (0, 0, 0, 0))
pd = ImageDraw.Draw(panel)
pd.rounded_rectangle(box, radius=36, fill=(255, 255, 255, 150), outline=(255, 255, 255, 235), width=2)
cv = Image.alpha_composite(cv, panel)
d = ImageDraw.Draw(cv)
mono = ImageFont.truetype(F + 'consola.ttf', 22)
serif = ImageFont.truetype(F + 'georgia.ttf', 46)
body = ImageFont.truetype(F + 'segoeui.ttf', 26)
def centre(y, text, font, fill):
    b = d.textbbox((0, 0), text, font=font)
    d.text(((W - (b[2] - b[0])) / 2 - b[0], y), text, font=font, fill=fill)
centre(190, 'LEAD GENERATION & MARKETING', mono, (178, 60, 10))
centre(232, 'Verified leads and marketing', serif, (29, 20, 13))
centre(290, 'for businesses ready to grow.', serif, (29, 20, 13))
centre(380, "Don't pay until you get verified clients.", body, (67, 53, 42))
cv.convert('RGB').save(f'{OUT}/facebook-cover-1640x624.jpg', quality=90)
print('ok')
