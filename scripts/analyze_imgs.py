import cv2
import numpy as np
import os

files = [
    "public/thailand-map north.png",
    "public/thailand-map north east.png",
    "public/thailand-map center.png",
    "public/thailand-map east.png",
    "public/thailand-map south.png",
]

for f in files:
    img = cv2.imread(f)
    if img is None:
        print(f"Cannot read: {f}")
        continue
    h, w = img.shape[:2]
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    nw = gray[gray < 240]
    unique_vals, counts = np.unique(nw, return_counts=True)
    
    print(f"--- {os.path.basename(f)} ({w}x{h}) ---")
    print("  Non-white gray values (top15):")
    pairs = sorted(zip(unique_vals.tolist(), counts.tolist()), key=lambda x: -x[1])[:15]
    for v, c in pairs:
        print(f"    gray={v}: {c} px")
    
    # Sample interior pixels
    print("  Interior pixel samples (r,g,b):")
    for py in [int(h*0.3), int(h*0.5), int(h*0.7)]:
        row = []
        for px in [int(w*0.2), int(w*0.35), int(w*0.5), int(w*0.65), int(w*0.8)]:
            r_, g_, b_ = rgb[py, px]
            row.append(f"({r_},{g_},{b_})")
        print("    y=%d: %s" % (py, "  ".join(row)))
    print()
