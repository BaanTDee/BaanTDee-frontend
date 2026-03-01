import cv2
import numpy as np
from PIL import Image

IMG_PATH = r"C:\Users\capto\Desktop\PROJECT\BaanTDee-frontend\public\thailand-map.png"
img = cv2.imread(IMG_PATH)
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
H, W = img.shape[:2]
print(f"Image: {W}x{H}")

# ViewBox target: 100 x (100*H/W)
VW = 100.0
VH = round(100.0 * H / W, 2)
print(f"ViewBox: 0 0 {VW} {VH}")

def px_to_vb(x, y):
    return round(x / W * VW, 2), round(y / H * VH, 2)

# --- Define each region by its dominant color (BGR) and tolerance ---
regions = [
    ("northern",     "ภาคเหนือ",                    [40,160,40],   50),   # green
    ("northeastern", "ภาคตะวันออกเฉียงเหนือ",       [200,30,120],  60),   # pink/magenta
    ("central",      "ภาคกลาง",                      [200,100,20],  60),   # orange
    ("eastern",      "ภาคตะวันออก",                  [0,160,180],   60),   # teal/cyan
    ("western",      "ภาคตะวันตก",                   [100,180,0],   60),   # yellow-green
    ("southern",     "ภาคใต้",                        [20,60,200],   60),   # blue
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
for rid, rname, color_rgb, tol in regions:
    mask = find_region_mask(img_rgb, color_rgb, tol)
    pixel_count = np.count_nonzero(mask)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        print(f"  {rid}: NO CONTOURS FOUND (pixels={pixel_count})")
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
    print(f"  {rid}: {len(pts_vb)} pts, area={area_px:.0f}px², label=({lx},{ly})")

# Print TypeScript output
print("\n\n=== TypeScript REGION_AREAS ===\n")
for rid, rname, color_rgb, _ in regions:
    if rid not in results:
        continue
    r = results[rid]
    hex_color = "#{:02X}{:02X}{:02X}".format(*color_rgb)
    pts_str = " ".join(f"{x},{y}" for x,y in r['pts'])
    lx, ly = r['label']
    print(f"""  {{
    id: "{rid}",
    name: "{rname}",
    points: "{pts_str}",
    color: "{hex_color}",
    labelX: {lx},
    labelY: {ly},
  }},""")
