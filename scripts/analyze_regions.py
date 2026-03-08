"""Analyze all 5 region images - find dimensions and dominant colors per province"""
import cv2
import numpy as np
from pathlib import Path

images = {
    "north": "public/thailand-map north.png",
    "northeast": "public/thailand-map north east.png",
    "central": "public/thailand-map center.png",
    "east": "public/thailand-map east.png",
    "south": "public/thailand-map south.png",
}

for region_id, path in images.items():
    img = cv2.imread(path)
    if img is None:
        print(f"{region_id}: NOT FOUND at {path}")
        continue
    h, w = img.shape[:2]
    print(f"\n=== {region_id} ({path}) ===")
    print(f"  Size: {w}x{h}")

    # Convert to RGB
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # Find unique colors excluding near-white (background) and near-black (borders)
    # Reshape to list of pixels
    pixels = rgb.reshape(-1, 3).astype(np.int32)

    # Exclude near-white (all channels > 220) and near-black (all channels < 30)
    mask = ~(
        ((pixels[:,0] > 220) & (pixels[:,1] > 220) & (pixels[:,2] > 220)) |
        ((pixels[:,0] < 30) & (pixels[:,1] < 30) & (pixels[:,2] < 30))
    )
    filtered = pixels[mask]

    if len(filtered) == 0:
        print("  No colored pixels found")
        continue

    # Quantize colors to find distinct province colors
    # Round to nearest 16 to group similar colors
    quantized = (filtered // 16) * 16
    unique, counts = np.unique(quantized.reshape(-1,3), axis=0, return_counts=True)

    # Sort by count descending, take top 50
    idx = np.argsort(-counts)[:50]
    print(f"  Top colors (R,G,B) → count:")
    for i in idx[:30]:
        r, g, b = unique[i]
        cnt = counts[i]
        if cnt > 1000:  # Only show colors with significant coverage
            print(f"    rgb({r:3d},{g:3d},{b:3d}) → {cnt:7d} pixels")
