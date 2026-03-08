"""
Extract province area polygons from regional map images.
Approach mirrors extract_regions.py: direct color matching + small epsilon contour.
NO border dilation — color match naturally stops at red border lines.
"""
import cv2
import numpy as np
import json
import os

# SVG viewBox dimensions — must match region-province-map.tsx viewBox="0 0 100 177.778"
VW = 100.0
VH = 177.778  # = 100 * (2560 / 1440)

REGION_IMAGE_MAP = {
    "northern":     "public/thailand-map north.png",
    "northeastern": "public/thailand-map north east.png",
    "central":      "public/thailand-map center.png",
    "eastern":      "public/thailand-map east.png",
    "southern":     "public/thailand-map south.png",
}

# Fill color (RGB) and tolerance for single-color region images
REGION_FILL_COLOR = {
    "northern":     ([94,  188,  73], 55),
    "northeastern": ([255, 197,   0], 60),
    "eastern":      ([44,  175, 162], 55),
    "southern":     ([16,   30, 130], 55),
}

# Regions where each province has a DISTINCT color — list all (RGB, tol) pairs.
# Each connected component per color = one province area.
REGION_MULTI_COLORS = {
    # (none currently — central was moved to REGION_BORDER_SEPARATE)
}

# After connected components (sorted by Y then X), merge these index pairs.
# Use when a single province is split into 2 disconnected pieces by a map artifact.
REGION_MERGE = {}

# Province names per area index (sorted by centroid Y then X, same order the script emits).
# Each entry: (province_id, thai_name, english_name)
# ⚠  Verify against debug_*.png images — correct any wrong assignments here.
REGION_PROVINCE_NAMES = {
    "northern": [
        ("chiangrai",       "เชียงราย",              "Chiang Rai"),
        ("phayao",          "พะเยา",                 "Phayao"),
        ("nan",             "น่าน",                  "Nan"),
        ("maehongson",      "แม่ฮ่องสอน",             "Mae Hong Son"),
        ("chiangmai",       "เชียงใหม่",              "Chiang Mai"),
        ("lampang",         "ลำปาง",                 "Lampang"),
        ("phrae",           "แพร่",                  "Phrae"),
        ("lamphun",         "ลำพูน",                 "Lamphun"),
        ("uttaradit",       "อุตรดิตถ์",              "Uttaradit"),
        ("sukhothai",       "สุโขทัย",                "Sukhothai"),
        ("phitsanulok",     "พิษณุโลก",               "Phitsanulok"),
        ("tak",             "ตาก",                   "Tak"),
        ("kamphaengphet",   "กำแพงเพชร",              "Kamphaeng Phet"),
        ("phichit",         "พิจิตร",                 "Phichit"),
        ("phetchabun",      "เพชรบูรณ์",               "Phetchabun"),
        ("nakhonsawan",     "นครสวรรค์",               "Nakhon Sawan"),
        ("uthaithani",      "อุทัยธานี",               "Uthai Thani"),
    ],
    "northeastern": [
        ("buengkan",            "บึงกาฬ",              "Bueng Kan"),
        ("nongkhai",            "หนองคาย",             "Nong Khai"),
        ("udonthani",           "อุดรธานี",             "Udon Thani"),
        ("loei",                "เลย",                "Loei"),
        ("sakonnakhon",         "สกลนคร",              "Sakon Nakhon"),
        ("nakhonphanom",        "นครพนม",              "Nakhon Phanom"),
        ("nongbualamphu",       "หนองบัวลำภู",           "Nong Bua Lam Phu"),
        ("kalasin",             "กาฬสินธุ์",            "Kalasin"),
        ("mukdahan",            "มุกดาหาร",             "Mukdahan"),
        ("khonkaen",            "ขอนแก่น",             "Khon Kaen"),
        ("chaiyaphum",          "ชัยภูมิ",              "Chaiyaphum"),
        ("mahasarakham",        "มหาสารคาม",            "Maha Sarakham"),
        ("roiet",               "ร้อยเอ็ด",             "Roi Et"),
        ("yasothon",            "ยโสธร",               "Yasothon"),
        ("amnatcharoen",        "อำนาจเจริญ",            "Amnat Charoen"),
        ("ubonratchathani",     "อุบลราชธานี",           "Ubon Ratchathani"),
        ("nakhonratchasima",    "นครราชสีมา",            "Nakhon Ratchasima"),
        ("surin",               "สุรินทร์",              "Surin"),
        ("sisaket",             "ศรีสะเกษ",             "Si Sa Ket"),
        ("buriram",             "บุรีรัมย์",             "Buriram"),
    ],
    "central": [
        ("chainat",             "ชัยนาท",              "Chainat"),
        ("lopburi",             "ลพบุรี",               "Lopburi"),
        ("singburi",            "สิงห์บุรี",             "Singburi"),
        ("angthong",            "อ่างทอง",              "Ang Thong"),
        ("saraburi",            "สระบุรี",               "Saraburi"),
        ("suphanburi",          "สุพรรณบุรี",            "Suphanburi"),
        ("kanchanaburi",        "กาญจนบุรี",             "Kanchanaburi"),
        ("ayutthaya",           "พระนครศรีอยุธยา",       "Ayutthaya"),
        ("nakhonnayok",         "นครนายก",              "Nakhon Nayok"),
        ("chachoengsao",        "ฉะเชิงเทรา",            "Chachoengsao"),
        ("pathumthani",         "ปทุมธานี",              "Pathum Thani"),
        ("nakhonpathom",        "นครปฐม",               "Nakhon Pathom"),
        ("nonthaburi",          "นนทบุรี",               "Nonthaburi"),
        ("bangkok",             "กรุงเทพมหานคร",          "Bangkok"),
        ("prachinburi",         "ปราจีนบุรี",             "Prachin Buri"),
        ("sakaeo",              "สระแก้ว",               "Sa Kaeo"),
        ("samutprakan",         "สมุทรปราการ",            "Samut Prakan"),
        ("ratchaburi",          "ราชบุรี",               "Ratchaburi"),
        ("samutsakhon",         "สมุทรสาคร",             "Samut Sakhon"),
        ("phetchaburi",         "เพชรบุรี",               "Phetchaburi"),
        ("prachuapkhirikhan",   "ประจวบคีรีขันธ์",         "Prachuap Khiri Khan"),
    ],
    "eastern": [
        ("chonburi",        "ชลบุรี",                 "Chon Buri"),
        ("chanthaburi",     "จันทบุรี",                "Chanthaburi"),
        ("rayong",          "ระยอง",                  "Rayong"),
        ("trat",            "ตราด",                   "Trat"),
    ],
    "southern": [
        ("chumphon",            "ชุมพร",               "Chumphon"),
        ("ranong",              "ระนอง",               "Ranong"),
        ("suratthani",          "สุราษฎร์ธานี",          "Surat Thani"),
        ("phangnga",            "พังงา",               "Phang Nga"),
        ("nakhonsithammarat",   "นครศรีธรรมราช",         "Nakhon Si Thammarat"),
        ("phuket",              "ภูเก็ต",               "Phuket"),
        ("phatthalung",         "พัทลุง",               "Phatthalung"),
        ("krabi",               "กระบี่",               "Krabi"),
        ("trang",               "ตรัง",                "Trang"),
        ("satun",               "สตูล",                "Satun"),
        ("songkhla",            "สงขลา",               "Songkhla"),
        ("pattani",             "ปัตตานี",              "Pattani"),
        ("yala",                "ยะลา",                "Yala"),
        ("narathiwat",          "นราธิวาส",             "Narathiwat"),
    ],
}

# Regions where all provinces share the same fill color but are separated by
# visible border lines (e.g. red lines).  The border pixels are detected,
# dilated to form solid barriers, and SUBTRACTED from the fill mask so that
# connected-components can find individual provinces.
# Value: (fill_color_rgb, fill_tol, dilate_kernel, dilate_iters)
REGION_BORDER_SEPARATE = {
    "central": ([200, 100, 50], 40, 5, 2),
    "eastern": ([44,  175, 162], 60, 5, 2),
}


def find_fill_mask(img_rgb, color_rgb, tol, use_morph=True):
    color = np.array(color_rgb, dtype=np.int32)
    diff = np.abs(img_rgb.astype(np.int32) - color)
    mask = (diff.max(axis=2) < tol).astype(np.uint8) * 255
    if use_morph:
        # MORPH_OPEN: removes tiny noise/specks without bridging narrow borders.
        # Skipped for multi-color mode where provinces can be very small.
        kernel = np.ones((3, 3), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    return mask


def extract_areas(region_id, image_path):
    print(f"\n{'='*60}")
    print(f"Processing: {region_id} ({image_path})")

    img = cv2.imread(image_path)
    if img is None:
        print(f"  ERROR: Cannot read {image_path}")
        return []

    h, w = img.shape[:2]
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    min_area = (w * h) * 0.0003

    print(f"  Image size: {w}x{h}")

    # --- Multi-color mode: each province has a distinct color ---
    if region_id in REGION_MULTI_COLORS:
        all_components = []  # list of (area_px, centroid, component_mask)
        for color_rgb, tol in REGION_MULTI_COLORS[region_id]:
            mask = find_fill_mask(img_rgb, color_rgb, tol, use_morph=False)
            _, binary = cv2.threshold(mask, 127, 1, cv2.THRESH_BINARY)
            num, lbl, sts, cen = cv2.connectedComponentsWithStats(binary.astype(np.uint8), connectivity=8)
            for i in range(1, num):
                if sts[i, cv2.CC_STAT_AREA] < min_area:
                    continue
                cmask = (lbl == i).astype(np.uint8)
                all_components.append((sts[i, cv2.CC_STAT_AREA], cen[i], cmask))

        print(f"  Found {len(all_components)} components across {len(REGION_MULTI_COLORS[region_id])} colors")

        # Sort all components by centroid Y then X
        all_components.sort(key=lambda x: (x[1][1], x[1][0]))

        areas = []
        name_map = REGION_PROVINCE_NAMES.get(region_id, [])
        for out_idx, (area_px, centroid, component_mask) in enumerate(all_components):
            k_close = np.ones((5, 5), np.uint8)
            component_mask = cv2.morphologyEx(component_mask, cv2.MORPH_CLOSE, k_close)
            contours, _ = cv2.findContours(component_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            if not contours:
                continue
            contour = max(contours, key=cv2.contourArea)
            epsilon = 0.003 * cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, epsilon, True)
            cx_pct = (centroid[0] / w) * VW
            cy_pct = (centroid[1] / h) * VH
            points_pct = [f"{round(pt[0]/w*VW, 3)},{round(pt[1]/h*VH, 3)}" for pt in approx.reshape(-1, 2)]
            if out_idx < len(name_map):
                area_id, thai_name, en_name = name_map[out_idx]
                display = f"{en_name} ({thai_name})"
            else:
                area_id = f"area_{out_idx}"
                thai_name = area_id
                en_name = area_id
                display = area_id
            print(f"  [{out_idx}] {area_id} | area={area_px:,}px | centroid=({cx_pct:.1f}%, {cy_pct:.1f}%) | pts={len(approx)} | {display}")
            areas.append({
                "id": area_id,
                "name": thai_name,
                "nameEn": en_name,
                "points": " ".join(points_pct),
                "labelX": round(cx_pct, 2),
                "labelY": round(cy_pct, 2),
            })
        return areas

    # --- Border-separation mode (provinces share fill color, divided by red border lines) ---
    if region_id in REGION_BORDER_SEPARATE:
        color_rgb, fill_tol, dil_k, dil_iters = REGION_BORDER_SEPARATE[region_id]
        color = np.array(color_rgb, dtype=np.int32)
        diff = np.abs(img_rgb.astype(np.int32) - color)
        fill_mask = (diff.max(axis=2) < fill_tol).astype(np.uint8)

        # Detect red-ish border pixels: high R, low G, low B
        red_mask = (
            (img_rgb[:, :, 0].astype(int) > 150) &
            (img_rgb[:, :, 1].astype(int) < 100) &
            (img_rgb[:, :, 2].astype(int) < 100)
        ).astype(np.uint8)
        k_border = np.ones((dil_k, dil_k), np.uint8)
        red_dilated = cv2.dilate(red_mask, k_border, iterations=dil_iters)

        # Province mask = fill minus border barriers
        province_mask = (fill_mask & (1 - red_dilated)).astype(np.uint8)
        print(f"  Fill pixels: {fill_mask.sum()}  |  After border subtraction: {province_mask.sum()}")

        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(
            province_mask, connectivity=8
        )

    # --- Single-color mode ---
    else:
        color_rgb, tol = REGION_FILL_COLOR[region_id]
        fill_mask = find_fill_mask(img_rgb, color_rgb, tol)
        print(f"  Fill pixels: {np.count_nonzero(fill_mask)}")
        _, fill_binary = cv2.threshold(fill_mask, 127, 1, cv2.THRESH_BINARY)
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(
            fill_binary.astype(np.uint8), connectivity=8
        )

    valid = [
        (i, stats[i, cv2.CC_STAT_AREA], centroids[i])
        for i in range(1, num_labels)
        if stats[i, cv2.CC_STAT_AREA] > min_area
    ]

    valid_by_area = sorted(valid, key=lambda x: -x[1])
    print(f"  Found {len(valid)} components (min_area={min_area:.0f} px)")
    print(f"  Top 5: {[(round(c[0]/w*100,1), round(c[1]/h*100,1), a) for _,a,c in valid_by_area[:5]]}")

    # Sort by centroid Y then X
    valid.sort(key=lambda x: (x[2][1], x[2][0]))

    # Apply manual merges
    merge_pairs = REGION_MERGE.get(region_id, [])
    merge_targets = set()
    merged_into = {}  # consumed_idx -> primary_idx

    for pair in merge_pairs:
        i, j = sorted(pair)
        if i < len(valid) and j < len(valid):
            merge_targets.add(j)
            merged_into[j] = i
            print(f"  Will merge area_{i} + area_{j}")

    areas = []
    out_idx = 0

    for idx in range(len(valid)):
        if idx in merge_targets:
            continue  # consumed by merge

        label_idx, area, centroid = valid[idx]

        # Build component mask — combine with merged partner if any
        merged_partners = [j for j, pi in merged_into.items() if pi == idx]
        if merged_partners:
            j = merged_partners[0]
            lj = valid[j][0]
            component_mask = ((labels == label_idx) | (labels == lj)).astype(np.uint8)
            k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
            component_mask = cv2.dilate(component_mask, k, iterations=2)
            total = area + valid[j][1]
            cx = (centroid[0] * area + valid[j][2][0] * valid[j][1]) / total
            cy = (centroid[1] * area + valid[j][2][1] * valid[j][1]) / total
            centroid = np.array([cx, cy])
        else:
            component_mask = (labels == label_idx).astype(np.uint8)

        k_close = np.ones((5, 5), np.uint8)
        component_mask = cv2.morphologyEx(component_mask, cv2.MORPH_CLOSE, k_close)

        contours, _ = cv2.findContours(component_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            continue
        contour = max(contours, key=cv2.contourArea)

        epsilon = 0.003 * cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, epsilon, True)

        cx_pct = (centroid[0] / w) * VW
        cy_pct = (centroid[1] / h) * VH

        points_pct = []
        for pt in approx.reshape(-1, 2):
            px = round((pt[0] / w) * VW, 3)
            py = round((pt[1] / h) * VH, 3)
            points_pct.append(f"{px},{py}")

        points_str = " ".join(points_pct)
        name_map = REGION_PROVINCE_NAMES.get(region_id, [])
        if out_idx < len(name_map):
            area_id, thai_name, en_name = name_map[out_idx]
            display = f"{en_name} ({thai_name})"
        else:
            area_id = f"area_{out_idx}"
            thai_name = area_id
            en_name = area_id
            display = area_id
        print(f"  [{out_idx}] {area_id} | area={area:,}px | centroid=({cx_pct:.1f}%, {cy_pct:.1f}%) | pts={len(approx)} | {display}")

        areas.append({
            "id": area_id,
            "name": thai_name,
            "nameEn": en_name,
            "points": points_str,
            "labelX": round(cx_pct, 2),
            "labelY": round(cy_pct, 2),
        })
        out_idx += 1

    return areas


def main():
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    all_results = {}
    for region_id, image_path in REGION_IMAGE_MAP.items():
        areas = extract_areas(region_id, image_path)
        all_results[region_id] = {
            "imageFile": f"/{image_path.replace('public/', '')}",
            "provinces": areas,
        }

    with open("scripts/province_polygons.json", "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    print("\nSaved scripts/province_polygons.json")

    generate_typescript(all_results)

    print("\nSummary:")
    for region_id, region_data in all_results.items():
        print(f"  {region_id}: {len(region_data['provinces'])} areas")

    generate_debug_images(all_results)


def generate_typescript(data):
    lines = [
        "// Auto-generated province polygon data",
        "// Points are in SVG viewBox coordinates (viewBox: 0 0 100 177.778)",
        "",
        "export interface ProvincePolygon {",
        "  id: string;",
        "  name: string;      // Thai name",
        "  nameEn: string;    // English name",
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
    for region_id, region_data in data.items():
        lines.append(f"  {region_id}: {{")
        lines.append(f'    imageFile: "{region_data["imageFile"]}",')
        lines.append(f"    provinces: [")
        for prov in region_data["provinces"]:
            name_en = prov.get("nameEn", prov["id"])
            lines.append(f"      {{")
            lines.append(f'        id: "{prov["id"]}",')
            lines.append(f'        name: "{prov["name"]}",')
            lines.append(f'        nameEn: "{name_en}",')
            lines.append(f'        points: "{prov["points"]}",')
            lines.append(f"        labelX: {prov['labelX']},")
            lines.append(f"        labelY: {prov['labelY']},")
            lines.append(f"      }},")
        lines.append(f"    ],")
        lines.append(f"  }},")
    lines.append("};")
    lines.append("")
    with open("src/data/province-polygons.ts", "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print("Saved src/data/province-polygons.ts")


def generate_debug_images(data):
    COLORS = [
        (255,80,80),(80,255,80),(80,80,255),(255,220,0),(255,80,220),
        (80,220,255),(200,140,60),(140,200,60),(60,140,200),(200,60,140),
        (160,255,160),(255,160,160),(160,160,255),(220,200,80),(80,200,220),
        (200,80,200),(120,200,120),(200,120,80),(80,120,200),(200,200,120),
    ]
    print("\nGenerating debug images...")
    for region_id, region_data in data.items():
        img_path = "public" + region_data["imageFile"]
        img = cv2.imread(img_path)
        if img is None:
            continue
        h, w = img.shape[:2]
        scale = 4
        dw, dh = w // scale, h // scale
        debug = cv2.resize(img, (dw, dh))
        for i, prov in enumerate(region_data["provinces"]):
            lx = int(prov["labelX"] / 100 * dw)
            ly = int(prov["labelY"] / VH * dh)
            color = COLORS[i % len(COLORS)]
            cv2.circle(debug, (lx, ly), 8, color, -1)
            label = prov.get("nameEn", prov["id"])[:10]  # trim long names
            cv2.putText(debug, label, (lx - 8, ly - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 0, 0), 2)
            cv2.putText(debug, label, (lx - 8, ly - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 255, 255), 1)
            idx_str = str(i)
            cv2.putText(debug, idx_str, (lx - 4, ly + 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 3)
            cv2.putText(debug, idx_str, (lx - 4, ly + 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)
        out = f"scripts/debug_{region_id}.png"
        cv2.imwrite(out, debug)
        print(f"  {out}")


if __name__ == "__main__":
    main()
