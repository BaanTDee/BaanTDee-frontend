"""
Find dominant colors in the Thailand map image
Helps identify the correct color values for region extraction
"""

import cv2
import numpy as np
from collections import Counter

IMG_PATH = r"..\public\thailand-map.png"

img = cv2.imread(IMG_PATH)
if img is None:
    print(f"ERROR: Cannot read image at {IMG_PATH}")
    exit(1)

img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
H, W = img.shape[:2]

print(f"Image size: {W}x{H}\n")
print("="*70)
print("ANALYZING COLORS IN IMAGE")
print("="*70)

# Sample different regions of the image
regions_to_check = {
    "Top (Northern)": (H//6, H//3),
    "Middle-Upper (Central/NE)": (H//3, H//2),
    "Middle (Central)": (2*H//5, 3*H//5),
    "Lower-Middle (South Upper)": (3*H//5, 4*H//5),
    "Bottom (South Lower)": (4*H//5, H-1),
}

def get_dominant_colors(region_img, n_colors=5):
    """Find dominant colors in a region"""
    pixels = region_img.reshape(-1, 3)
    
    # Filter out white/near-white (background) and black/near-black (borders)
    mask = (pixels.sum(axis=1) < 700) & (pixels.sum(axis=1) > 50)
    filtered = pixels[mask]
    
    if len(filtered) == 0:
        return []
    
    # Count unique colors
    unique, counts = np.unique(filtered, axis=0, return_counts=True)
    
    # Sort by frequency
    sorted_indices = np.argsort(-counts)
    
    # Return top N colors with their counts
    results = []
    for i in sorted_indices[:n_colors]:
        color = unique[i]
        count = counts[i]
        percent = (count / len(filtered)) * 100
        results.append((color, count, percent))
    
    return results

for region_name, (y_start, y_end) in regions_to_check.items():
    region_img = img_rgb[y_start:y_end, :, :]
    dominant = get_dominant_colors(region_img, n_colors=3)
    
    print(f"\n{region_name} (rows {y_start}-{y_end}):")
    print("-" * 70)
    
    for i, (color, count, percent) in enumerate(dominant, 1):
        r, g, b = color
        hex_color = f"#{r:02X}{g:02X}{b:02X}"
        print(f"  {i}. RGB({r:3d}, {g:3d}, {b:3d})  {hex_color}  - {percent:.1f}% ({count:,} pixels)")

print("\n" + "="*70)
print("RECOMMENDED COLOR VALUES FOR extract_regions_simple.py")
print("="*70)

# Analyze the bottom portion specifically for southern region
south_region = img_rgb[4*H//5:H-1, :, :]
south_colors = get_dominant_colors(south_region, n_colors=3)

if south_colors:
    color, count, percent = south_colors[0]
    r, g, b = color
    print(f"\nFor SOUTHERN region, try:")
    print(f'  ("southern", "ภาคใต้", [{r},{g},{b}], 60),')
    print(f"  Color: #{r:02X}{g:02X}{b:02X} - {percent:.1f}% coverage")

# Analyze central region
central_region = img_rgb[2*H//5:3*H//5, :, :]
central_colors = get_dominant_colors(central_region, n_colors=3)

if central_colors:
    color, count, percent = central_colors[0]
    r, g, b = color
    print(f"\nFor CENTRAL region (verify):")
    print(f'  ("central", "ภาคกลาง", [{r},{g},{b}], 60),')
    print(f"  Color: #{r:02X}{g:02X}{b:02B} - {percent:.1f}% coverage")

print("\n" + "="*70)
