"""Check for internal white lines (province borders) within the red region."""
import cv2
import numpy as np
import os

files = [
    "public/thailand-map north.png",
    "public/thailand-map north east.png",
]

for f in files:
    img = cv2.imread(f)
    h, w = img.shape[:2]
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    r, g, b = rgb[:,:,0], rgb[:,:,1], rgb[:,:,2]
    
    # Red pixels
    red_mask = ((r > 200) & (g < 80) & (b < 80)) | ((r > 200) & (g < 80) & (b < 80))
    
    # White pixels
    white_mask = (r > 240) & (g > 240) & (b > 240)
    
    print(f"--- {os.path.basename(f)} ---")
    print(f"  Red pixels: {red_mask.sum()}")
    print(f"  White pixels: {white_mask.sum()}")
    print(f"  Other pixels: {h*w - red_mask.sum() - white_mask.sum()}")
    
    # Find the bounding box of the red region
    red_ys, red_xs = np.where(red_mask)
    if len(red_ys) == 0:
        print("  No red pixels found")
        continue
    
    bbox_y1, bbox_y2 = red_ys.min(), red_ys.max()
    bbox_x1, bbox_x2 = red_xs.min(), red_xs.max()
    print(f"  Red bounding box: ({bbox_x1},{bbox_y1}) to ({bbox_x2},{bbox_y2})")
    
    # Look at white pixels within the red bounding box (these are potential borders)
    roi_white = white_mask[bbox_y1:bbox_y2, bbox_x1:bbox_x2]
    roi_red = red_mask[bbox_y1:bbox_y2, bbox_x1:bbox_x2]
    
    print(f"  White pixels inside red bbox: {roi_white.sum()}")
    
    # Check if white pixels inside bbox form lines (province borders)
    # Sample rows and columns within the bbox  
    interior_y = range(bbox_y1 + 10, bbox_y2 - 10, (bbox_y2 - bbox_y1) // 20)
    for sy in list(interior_y)[:5]:
        row_colors = []
        for sx in range(bbox_x1, min(bbox_x1+200, bbox_x2), 10):
            if white_mask[sy, sx]:
                row_colors.append("W")
            elif red_mask[sy, sx]:
                row_colors.append("R")
            else:
                row_colors.append("?")
        print(f"  Row {sy}: {''.join(row_colors)}")
    
    # Sample pixel colors at finer grid
    print("  Fine pixel scan (50 pixels in a row):")
    mid_y = (bbox_y1 + bbox_y2) // 2
    mid_x_start = (bbox_x1 + bbox_x2) // 2 - 25
    for sx in range(mid_x_start, mid_x_start + 50):
        px_r, px_g, px_b = rgb[mid_y, max(0,sx)]
        if not (px_r > 240 and px_g > 240 and px_b > 240) and not (px_r > 200 and px_g < 80):
            print(f"    DIFFERENT at ({sx},{mid_y}): rgb({px_r},{px_g},{px_b})")
    print()
