"""
Extract province areas from regional map images using border-based segmentation.
Each image: single fill color + red border lines between provinces.
Outputs: numbered area_1, area_2, ... + debug PNG with area numbers.
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")
import cv2, numpy as np, json, os

REGION_IMAGE_MAP = {
    "northern":     "public/thailand-map north.png",
    "northeastern": "public/thailand-map north east.png",
    "central":      "public/thailand-map center.png",
    "eastern":      "public/thailand-map east.png",
    "southern":     "public/thailand-map south.png",
}


def extract_province_areas(region_id, image_path):
    print(f"\n{'='*60}")
    print(f"Region: {region_id}  file: {image_path}")

    img = cv2.imread(image_path)
    if img is None:
        print(f"  ERROR: Cannot read {image_path}")
        return [], None

    h, w = img.shape[:2]
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB).astype(np.int32)
    R, G, B = rgb[:,:,0], rgb[:,:,1], rgb[:,:,2]

    # Masks
    white_mask  = (R > 230) & (G > 230) & (B > 230)
    border_mask = (R > 200) & (G < 80)   # red lines between provinces

    # Dilate borders to close tiny gaps
    kern = np.ones((3, 3), np.uint8)
    border_dil = cv2.dilate(border_mask.astype(np.uint8), kern, iterations=1)

    # Fill = not white, not border
    fill = (~white_mask).astype(np.uint8) & ~border_dil

    # Remove noise via morphological open
    fill = cv2.morphologyEx(fill, cv2.MORPH_OPEN, kern)

    # Connected components
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(fill, connectivity=8)

    # Keep areas > 0.05% of image (catches small provinces)
    min_area = w * h * 0.0005
    valid = [
        {
            "idx":    i,
            "area":   int(stats[i, cv2.CC_STAT_AREA]),
            "cx_pct": round(float(centroids[i][0]) / w * 100, 3),
            "cy_pct": round(float(centroids[i][1]) / h * 100, 3),
        }
        for i in range(1, num_labels)
        if stats[i, cv2.CC_STAT_AREA] > min_area
    ]

    # Sort top-to-bottom then left-to-right
    valid.sort(key=lambda a: (round(a["cy_pct"] / 5) * 5, a["cx_pct"]))
    print(f"  Found {len(valid)} areas  (image {w}x{h}, min_area={min_area:.0f})")

    areas = []
    debug_bgr = img.copy()

    for seq, a in enumerate(valid):
        num = seq + 1
        label_idx = a["idx"]

        # Extract polygon
        comp_mask = (labels == label_idx).astype(np.uint8)
        comp_mask = cv2.morphologyEx(comp_mask, cv2.MORPH_CLOSE, np.ones((5,5), np.uint8))
        contours, _ = cv2.findContours(comp_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            continue
        contour = max(contours, key=cv2.contourArea)
        arc_len = cv2.arcLength(contour, True)
        if arc_len == 0:
            continue
        approx = cv2.approxPolyDP(contour, 0.005 * arc_len, True)
        pts = " ".join(f"{round(pt[0]/w*100,3)},{round(pt[1]/h*100,3)}" for pt in approx.reshape(-1,2))

        areas.append({
            "id":     f"area_{num}",
            "name":   f"area_{num}",
            "points": pts,
            "labelX": a["cx_pct"],
            "labelY": a["cy_pct"],
        })

        # Draw number on debug image
        cx_px = int(a["cx_pct"] / 100 * w)
        cy_px = int(a["cy_pct"] / 100 * h)
        cv2.circle(debug_bgr, (cx_px, cy_px), 42, (0,0,0), -1)
        cv2.circle(debug_bgr, (cx_px, cy_px), 38, (255,255,255), -1)
        text = str(num)
        fs = 1.3
        th = 3
        (tw, tht), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, fs, th)
        cv2.putText(debug_bgr, text, (cx_px - tw//2, cy_px + tht//2),
                    cv2.FONT_HERSHEY_SIMPLEX, fs, (20,20,20), th, cv2.LINE_AA)
        print(f"  area_{num:02d}  centroid=({a['cx_pct']:.1f}%, {a['cy_pct']:.1f}%)  px={a['area']}")

    return areas, debug_bgr


def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(base_dir)

    all_results = {}
    for region_id, image_path in REGION_IMAGE_MAP.items():
        areas, debug_img = extract_province_areas(region_id, image_path)
        all_results[region_id] = {
            "imageFile": f"/{image_path.replace('public/', '')}",
            "provinces": areas,
        }
        if debug_img is not None:
            out = f"scripts/debug_{region_id}.png"
            cv2.imwrite(out, debug_img)
            print(f"  Saved: {out}")

    with open("scripts/province_polygons.json", "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    print("\nSaved scripts/province_polygons.json")
    generate_typescript(all_results)


def generate_typescript(data):
    lines = [
        "// Auto-generated province polygon data",
        "// Area IDs are placeholders (area_1, area_2, ...) -- province names to be assigned by user",
        "",
        "export interface ProvincePolygon {",
        "  id: string;",
        "  name: string;",
        "  points: string;",
        "  labelX: number;",
        "  labelY: number;",
        "}",
        "",
        "export interface RegionProvinceData {",
        "  imageFile: string;",
        "  provinces: ProvincePolygon[];",
        "}",
        "",
        "export const REGION_PROVINCE_MAP: Record<string, RegionProvinceData> = {",
    ]
    for rid, rd in data.items():
        lines += [
            f"  {rid}: {{",
            f'    imageFile: "{rd["imageFile"]}",',
            f"    provinces: [",
        ]
        for p in rd["provinces"]:
            lines += [
                f"      {{",
                f'        id: "{p["id"]}",',
                f'        name: "{p["name"]}",',
                f'        points: "{p["points"]}",',
                f"        labelX: {p['labelX']},",
                f"        labelY: {p['labelY']},",
                f"      }},",
            ]
        lines += ["    ],", "  }},"]
    lines += ["};", ""]

    with open("src/data/province-polygons.ts", "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print("Saved src/data/province-polygons.ts")

    print("\n--- Summary ---")
    for rid, rd in data.items():
        print(f"  {rid}: {len(rd['provinces'])} areas")


if __name__ == "__main__":
    main()
