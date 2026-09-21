"""Bake Siraj's rim light into the warm-up drawing (public/img/siraj-wave-rim.webp).

A cel-shaded band along the top-left edges of the silhouette, blended onto
the artwork with the overlay blend mode. Baked instead of drawn live: an SVG
filter or a CSS blend over an image that never stops moving is re-run on
every frame, and budget phones cannot afford that.

Needs numpy and pillow. Run from app/: python3 scripts/bake-rim.py
"""
import numpy as np
from PIL import Image

SRC = 'public/img/siraj-wave.webp'
OUT = 'public/img/siraj-wave-rim.webp'
SHOWN = 150            # CSS width of Siraj in the warm-up (Lesson.tsx)
NUDGE = (2.5, 3.5)     # how far the light reaches in, in CSS px, from the top left
LIGHT = (0xFF, 0xF8, 0xE4)
STRENGTH = 0.92

im = Image.open(SRC).convert('RGBA')
px = np.asarray(im).astype(np.float32) / 255
alpha = px[..., 3]
k = im.size[0] / SHOWN
dx, dy = NUDGE[0] * k, NUDGE[1] * k

# the silhouette pushed down and right; what it no longer covers is the lit edge
shifted = Image.fromarray((alpha * 255).astype(np.uint8)).transform(
    im.size, Image.AFFINE, (1, 0, -dx, 0, 1, -dy), resample=Image.BILINEAR)
rim = alpha * (1 - np.asarray(shifted).astype(np.float32) / 255) * STRENGTH

base = px[..., :3]
light = np.array(LIGHT, np.float32) / 255
overlay = np.where(base < 0.5, 2 * base * light, 1 - 2 * (1 - base) * (1 - light))
rgb = base * (1 - rim[..., None]) + overlay * rim[..., None]

out = np.dstack([rgb, alpha])
Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGBA').save(OUT, quality=90, method=6)
print(OUT)
