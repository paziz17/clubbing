"""
Strip the dark background from logo.png so it can be placed
over any dark backdrop without a visible square halo.

Strategy: pixel-by-pixel, treat all near-black + ambient-noise pixels
as transparent. The actual gold logo strokes have R/G channels well
above the threshold so they're preserved.
"""
from PIL import Image
import os

SRC = "public/icons/logo.png"
OUT = "public/icons/logo.png"  # overwrite in place

img = Image.open(SRC).convert("RGBA")
w, h = img.size
px = img.load()

# Threshold: any pixel where max(R,G,B) is below this is considered background.
# Then fade pixels just above the threshold for a soft edge.
BG_HARD = 40    # below = fully transparent
BG_SOFT = 90    # above this = fully opaque; between = ramped alpha

for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        # luminance proxy
        lum = max(r, g, b)
        if lum <= BG_HARD:
            px[x, y] = (0, 0, 0, 0)
        elif lum < BG_SOFT:
            # Linear ramp from 0 to 255 alpha
            ratio = (lum - BG_HARD) / (BG_SOFT - BG_HARD)
            px[x, y] = (r, g, b, int(255 * ratio))
        # else keep as opaque

img.save(OUT, "PNG", optimize=True)
print(f"✓ Wrote {OUT}: {os.path.getsize(OUT)} bytes")
