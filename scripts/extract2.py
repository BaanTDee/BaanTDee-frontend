import cv2
import numpy as np

img = cv2.imread(r'C:\Users\capto\Desktop\PROJECT\BaanTDee-frontend\public\thailand-map.png')
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
H, W = img.shape[:2]
VW, VH = 100.0, round(100.0 * H / W, 3)
print(f"Image {W}x{H}, ViewBox 0 0 {VW} {VH}")

def px(x, y):
    return (round(x / W * VW, 2), round(y / H * VH, 2))

regions = [
    ('northern',     [93, 189, 74],   45),
    ('northeastern', [220, 58, 92],   45),
    ('central',      [210, 123, 54],  45),
    ('eastern',      [42, 177, 163],  45),
    ('southern',     [13, 30, 131],   50),
]

# Try to find western region color
print("Sampling for western region...")
western_color = None
for y2 in range(800, 1800, 10):
    for x2 in range(30, 350, 10):
        c = img_rgb[y2, x2]
        r, g, b = int(c[0]), int(c[1]), int(c[2])
        if r < 80 and g > 130 and b < 80 and g > r + 60:
            print(f"  western candidate at ({x2},{y2}): RGB({r},{g},{b})")
            western_color = [r, g, b]
            break
    if western_color:
        break

if western_color:
    regions.append(('western', western_color, 40))

print()
for rid, color_rgb, tol in regions:
    c = np.array(color_rgb, dtype=np.int32)
    diff = np.abs(img_rgb.astype(np.int32) - c)
    mask = (diff.max(axis=2) < tol).astype(np.uint8) * 255
    k = np.ones((7, 7), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, k)
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cnts:
        print(f"{rid}: NOT FOUND")
        continue
    cnt = max(cnts, key=cv2.contourArea)
    # Use very small epsilon for high detail
    eps = 0.0012 * cv2.arcLength(cnt, True)
    simp = cv2.approxPolyDP(cnt, eps, True)
    pts = [px(p[0][0], p[0][1]) for p in simp]
    M = cv2.moments(cnt)
    cx, cy = (M['m10'] / M['m00'], M['m01'] / M['m00']) if M['m00'] > 0 else (W / 2, H / 2)
    lx, ly = px(cx, cy)
    pts_str = " ".join(f"{x},{y}" for x, y in pts)
    print(f"{rid} ({len(pts)} pts) label=({lx},{ly}):")
    print(f'  "{pts_str}"')
    print()
