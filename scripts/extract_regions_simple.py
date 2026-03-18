"""
Simple region polygon extractor - run this after updating map images
Extracts polygon points for central and southern regions
"""

try:
    import cv2
    import numpy as np
    from PIL import Image
except ImportError:
    print("=" * 70)
    print("ERROR: Required packages not installed")
    print("=" * 70)
    print("\nPlease install the required packages:\n")
    print("  py -m pip install opencv-python numpy pillow")
    print("\nOr if using conda:")
    print("  conda install opencv numpy pillow")
    print("=" * 70)
    exit(1)

# Use relative path from scripts folder
IMG_PATH = r"..\public\thailand-map.png"

try:
    img = cv2.imread(IMG_PATH)
    if img is None:
        print(f"ERROR: Cannot read image at {IMG_PATH}")
        print("Please make sure the thailand-map.png file exists in the public folder")
        exit(1)
except Exception as e:
    print(f"ERROR reading image: {e}")
    exit(1)

img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
H, W = img.shape[:2]
print(f"Image: {W}x{H}")

# ViewBox target: 100 x (100*H/W)
VW = 100.0
VH = round(100.0 * H / W, 2)
print(f"ViewBox: 0 0 {VW} {VH}")

def px_to_vb(x, y):
    return round(x / W * VW, 2), round(y / H * VH, 2)

# --- Define only central and southern regions ---
# Colors extracted from actual image analysis
regions = [
    ("central",      "ภาคกลาง",                      [210,123,54],  60),   # orange
    ("southern",     "ภาคใต้",                        [13,30,131],   60),   # blue
]

def find_region_mask(img_rgb, color_rgb, tol):
    color = np.array(color_rgb, dtype=np.int32)
    diff = np.abs(img_rgb.astype(np.int32) - color)
    mask = (diff.max(axis=2) < tol).astype(np.uint8) * 255
    # morphology to fill gaps
    kernel = np.ones((5,5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    return mask

def simplify_contour(contour, epsilon_frac=0.003):
    epsilon = epsilon_frac * cv2.arcLength(contour, True)
    return cv2.approxPolyDP(contour, epsilon, True)

results = {}
print("\n" + "="*70)
print("EXTRACTING POLYGON POINTS")
print("="*70)

for rid, rname, color_rgb, tol in regions:
    print(f"\nProcessing: {rname} ({rid})...")
    mask = find_region_mask(img_rgb, color_rgb, tol)
    pixel_count = np.count_nonzero(mask)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        print(f"  ❌ NO CONTOURS FOUND (pixels={pixel_count})")
        print(f"  Try adjusting the color values or tolerance")
        continue
    
    # pick largest contour
    cnt = max(contours, key=cv2.contourArea)
    area_px = cv2.contourArea(cnt)
    simplified = simplify_contour(cnt, epsilon_frac=0.004)
    pts_vb = [px_to_vb(p[0][0], p[0][1]) for p in simplified]
    
    # centroid for label
    M = cv2.moments(cnt)
    if M["m00"] > 0:
        cx = M["m10"] / M["m00"]
        cy = M["m01"] / M["m00"]
        lx, ly = px_to_vb(cx, cy)
    else:
        lx, ly = px_to_vb(W/2, H/2)

    results[rid] = {"name": rname, "pts": pts_vb, "label": (lx, ly), "area": area_px, "n": len(pts_vb)}
    print(f"  ✓ {len(pts_vb)} points extracted")
    print(f"  ✓ Area: {area_px:.0f}px²")
    print(f"  ✓ Label position: ({lx}, {ly})")

# Print TypeScript output
print("\n" + "="*70)
print("COPY THIS TO thailand-region-map.tsx")
print("Replace the 'central' and 'southern' objects in REGION_AREAS")
print("="*70 + "\n")

for rid, rname, color_rgb, _ in regions:
    if rid not in results:
        continue
    r = results[rid]
    hex_color = "#{:02X}{:02X}{:02X}".format(*color_rgb)
    
    # Format points string with proper line breaks for readability
    pts = r['pts']
    pts_chunks = []
    for i in range(0, len(pts), 10):  # 10 points per line
        chunk = " ".join(f"{x},{y}" for x,y in pts[i:i+10])
        pts_chunks.append(chunk)
    
    # Create multi-line points string with proper indentation
    if len(pts_chunks) > 1:
        pts_str = ' +\n      "'.join([f'"{chunk}"' for chunk in pts_chunks])
        pts_str = pts_str[1:]  # Remove first quote since it's added in template
    else:
        pts_str = f'"{pts_chunks[0]}"' if pts_chunks else '""'
    
    lx, ly = r['label']
    
    print(f"""  {{
    id: "{rid}",
    name: "{rname}",
    color: "{hex_color}",
    labelX: {lx},
    labelY: {ly},
    points:
      {pts_str},
  }},""")

print("\n" + "="*70)
print("DONE! Copy the output above to your TypeScript file")
print("="*70)
