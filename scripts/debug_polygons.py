"""
Debug script: visualize extracted polygons overlaid on the actual image
This helps verify if the extracted regions match the new map images
"""

import cv2
import numpy as np
import os

# Use absolute path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
IMG_PATH = os.path.join(SCRIPT_DIR, "..", "public", "thailand-map.png")

# Load image
img = cv2.imread(IMG_PATH)
if img is None:
    print(f"ERROR: Cannot read image at {IMG_PATH}")
    exit(1)

H, W = img.shape[:2]
VW = 100.0
VH = round(100.0 * H / W, 2)

print(f"Image: {W}x{H}")
print(f"ViewBox: 0 0 {VW} {VH}\n")

def vb_to_px(vb_x, vb_y):
    """Convert viewBox coordinates to pixel coordinates"""
    px_x = int(vb_x * W / VW)
    px_y = int(vb_y * H / VH)
    return px_x, px_y

# Polygon points from TypeScript (the NEW values we just set)
regions = [
    {
        "id": "central",
        "name": "ภาคกลาง",
        "color": (54, 123, 210),  # BGR format
        "points": "48.82,62.5 45.9,64.03 41.39,62.71 38.54,67.08 35.35,63.33 34.38,64.65 30.9,64.38 31.6,66.81 28.75,68.33 26.32,66.88 22.71,67.43 17.78,60.56 18.12,63.54 13.47,65.42 14.58,70.49 22.36,78.2 25.49,84.65 23.68,89.86 25.28,94.31 27.57,95.77 29.51,105.35 24.24,112.99 25.0,113.89 27.78,113.47 27.36,111.6 33.33,100.28 33.61,86.18 40.14,84.31 44.17,85.35 47.15,83.68 53.06,88.33 55.83,86.53 59.03,87.36 65.9,78.06 57.43,77.92 54.58,74.93 47.22,73.89 46.67,70.7 49.58,69.17"
    },
    {
        "id": "southern",
        "name": "ภาคใต้",
        "color": (131, 30, 13),  # BGR format
        "points": "23.61,113.68 19.65,117.57 16.88,130.7 15.0,132.36 15.21,137.57 13.75,137.64 13.54,145.07 15.28,145.97 15.42,144.31 17.64,143.4 19.03,147.36 22.92,148.47 22.15,150.9 24.79,151.74 26.11,154.79 28.61,156.04 28.19,157.57 30.63,158.2 29.24,161.39 34.86,165.49 35.83,163.27 38.19,165.63 42.71,166.18 43.12,168.47 46.6,168.47 46.39,172.85 44.93,174.03 47.01,175.77 51.11,172.36 52.92,174.1 55.28,173.27 57.43,168.96 50.83,161.74 44.17,161.81 35.56,155.35 34.72,150.97 37.57,153.2 35.76,143.4 32.64,142.22 31.6,133.61 27.92,133.47 26.6,134.86 24.17,133.96 23.12,124.03 24.44,122.57 23.19,121.04 27.64,114.72"
    }
]

# Create overlay image
overlay = img.copy()
debug_img = img.copy()

for region in regions:
    # Parse points
    points_str = region["points"]
    coords = [float(x) for x in points_str.replace(",", " ").split()]
    
    # Convert to pixel coordinates
    pts_px = []
    for i in range(0, len(coords), 2):
        px_x, px_y = vb_to_px(coords[i], coords[i+1])
        pts_px.append([px_x, px_y])
    
    pts_array = np.array(pts_px, dtype=np.int32)
    
    # Draw filled polygon on overlay
    cv2.fillPoly(overlay, [pts_array], region["color"])
    
    # Draw outline on debug image
    cv2.polylines(debug_img, [pts_array], True, (0, 255, 0), 3)
    
    # Draw vertices
    for pt in pts_px:
        cv2.circle(debug_img, tuple(pt), 5, (0, 0, 255), -1)
    
    print(f"✓ Drew {region['name']} with {len(pts_px)} points")

# Blend overlay with original
result = cv2.addWeighted(img, 0.6, overlay, 0.4, 0)

# Save debug images in the scripts folder
output_blend = os.path.join(SCRIPT_DIR, "debug_polygon_blend.png")
output_outline = os.path.join(SCRIPT_DIR, "debug_polygon_outline.png")

cv2.imwrite(output_blend, result)
cv2.imwrite(output_outline, debug_img)

print(f"\n{'='*70}")
print("DEBUG IMAGES SAVED:")
print(f"  1. {output_blend}")
print(f"     - Shows polygons blended with the map")
print(f"  2. {output_outline}")
print(f"     - Shows polygon outlines and vertices")
print(f"\n✓ Open these images to verify the extracted regions match your new map!")
print("="*70)
