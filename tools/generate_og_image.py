#!/usr/bin/env python3
"""Generate the static branded og-image.png (1200x630). Run: python3 tools/generate_og_image.py"""
import math, os
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
BG, ORANGE, CREAM, MUTED = (26, 22, 18), (247, 147, 26), (234, 220, 200), (107, 93, 78)

def font(size, bold=True):
    for p in ("/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

# subtle bottom gradient band (brand accent)
for y in range(H - 8, H):
    t = (y - (H - 8)) / 8.0
    d.line([(0, y), (W, y)], fill=tuple(int(BG[i] + (ORANGE[i] - BG[i]) * t * 0.35) for i in range(3)))

# hexagon logo (flat-top orientation), two nested outlines
cx, cy, r = 600, 185, 96
pts = lambda rr: [(cx + rr * math.cos(math.radians(60 * i - 90)), cy + rr * math.sin(math.radians(60 * i - 90))) for i in range(6)]
d.polygon(pts(r), outline=ORANGE, width=10)
d.polygon(pts(r - 26), outline=(212, 147, 58), width=4)

d.text((600, 340), "Bitcoin block space,", font=font(52), fill=CREAM, anchor="mm")
d.text((600, 400), "live.", font=font(76, bold=True), fill=ORANGE, anchor="mm")
d.text((600, 480), "bitcoinsahi.com", font=font(34), fill=MUTED, anchor="mm")

out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "og-image.png")
img.save(out)
print("wrote", out)
