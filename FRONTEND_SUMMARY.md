# BaanTDee Frontend — สรุป Project

## Tech Stack

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS**
- **Font:** Noto Sans Thai (Google Fonts)
- **Icons:** Lucide React
- **UI Primitives:** shadcn/ui (Button, Card, Dialog, Input, Badge, Tabs, ScrollArea)

---

## โครงสร้างหน้าแรก (`src/app/page.tsx`)

ลำดับ section จากบนลงล่าง:

1. `HeroSection` — Hero banner พร้อม search bar + quick filter tags
2. `CategoryIcons` — แถบไอคอนหมวดหมู่ 8 ประเภท
3. `HomeMapSection` — แผนที่ interactive เลือกภาค → จังหวัด
4. `LatestListings` — ประกาศล่าสุด (**mock data** รอเชื่อม API)
5. `FeaturedListings` — แนะนำสำหรับคุณ (**mock data** รอเชื่อม API)
6. `GetStartedSection` — CTA ผู้ซื้อ / ผู้ขาย / พรีเมียม

---

## Components

| File | หน้าที่ |
|---|---|
| `navbar.tsx` | Navbar — search bar, เข้าสู่ระบบ, ลงประกาศ |
| `footer.tsx` | Footer — links, หมวดหมู่, เกี่ยวกับเรา |
| `hero-section.tsx` | Hero + search bar + filter tags |
| `category-icons.tsx` | ไอคอน 8 ประเภทอสังหาฯ |
| `listing-card.tsx` | Card แสดงประกาศ (HOT/PREMIUM badge, ราคา, ตำแหน่ง) |
| `latest-listings.tsx` | Section ประกาศล่าสุด + tab กรองประเภท |
| `featured-listings.tsx` | Section แนะนำสำหรับคุณ |
| `get-started-section.tsx` | CTA 3 กลุ่มผู้ใช้ |
| `thailand-region-map.tsx` | แผนที่ SVG ระดับภาค (5 ภาค, click/hover) |
| `region-province-map.tsx` | แผนที่ SVG ระดับจังหวัด (polygon overlay บน PNG) |
| `home-map-section.tsx` | Section แผนที่บนหน้าแรก (drill-down ภาค → จังหวัด) |
| `location-filter-modal.tsx` | Modal เลือกทำเล (ใน hero search bar) |

---

## Data Files

### `src/data/thailand-locations.ts`

ข้อมูลสถิตย์ **ภาค → จังหวัด → อำเภอ** ครบทั้งประเทศ (ไม่ต้องเชื่อม API)

```ts
interface District {
  name: string;
}

interface Province {
  name: string;
  districts: District[];
}

interface Region {
  id: string;        // "northern" | "northeastern" | "central" | "eastern" | "southern"
  name: string;      // ชื่อภาษาไทย
  nameEn: string;    // ชื่อภาษาอังกฤษ
  color: string;     // gradient start color (hex)
  colorEnd: string;  // gradient end color (hex)
  hoverColor: string;
  provinces: Province[];
}

// Helper functions
getAllProvinces(): string[]
findProvince(name: string): Province | undefined
findRegionByProvince(name: string): Region | undefined
```

---

### `src/data/province-polygons.ts` *(auto-generated โดย OpenCV script)*

Polygon coordinates สำหรับ render แผนที่จังหวัด — SVG viewBox `0 0 100 177.778`

```ts
interface ProvincePolygon {
  id: string;       // slug ภาษาอังกฤษ เช่น "chiangmai", "bangkok"
  name: string;     // ชื่อภาษาไทย เช่น "เชียงใหม่"
  nameEn: string;   // ชื่อภาษาอังกฤษ เช่น "Chiang Mai"
  points: string;   // SVG polygon points string
  labelX: number;   // centroid X (ใช้วาง label บนแผนที่)
  labelY: number;   // centroid Y
}

interface RegionProvinceData {
  imageFile: string;          // path ของรูป map PNG
  provinces: ProvincePolygon[];
}

const REGION_PROVINCE_MAP: Record<string, RegionProvinceData>
```

**จังหวัดที่มีข้อมูล polygon (76 จังหวัด):**

| ภาค | จำนวน | Province IDs |
|---|---|---|
| northern | 17 | chiangrai, phayao, nan, maehongson, chiangmai, lampang, phrae, lamphun, uttaradit, sukhothai, phitsanulok, tak, kamphaengphet, phichit, phetchabun, nakhonsawan, uthaithani |
| northeastern | 20 | buengkan, nongkhai, udonthani, loei, sakonnakhon, nakhonphanom, nongbualamphu, kalasin, mukdahan, khonkaen, chaiyaphum, mahasarakham, roiet, yasothon, amnatcharoen, ubonratchathani, nakhonratchasima, surin, sisaket, buriram |
| central | 21 | chainat, lopburi, singburi, angthong, saraburi, suphanburi, kanchanaburi, ayutthaya, nakhonnayok, chachoengsao, pathumthani, nakhonpathom, nonthaburi, bangkok, prachinburi, sakaeo, samutprakan, ratchaburi, samutsakhon, phetchaburi, prachuapkhirikhan |
| eastern | 4 | chonburi, chanthaburi, rayong, trat |
| southern | 14 | chumphon, ranong, suratthani, phangnga, nakhonsithammarat, phuket, phatthalung, krabi, trang, satun, songkhla, pattani, yala, narathiwat |

> **หมายเหตุ:** สมุทรสงคราม (samutsongkhram) ไม่มีข้อมูล polygon เนื่องจากพื้นที่เล็กเกินไปในรูปภาพ

---

## Mock Data ที่ต้องเชื่อม Backend

### Listing Card Schema

`ListingCard` component รับ props ดังนี้:

```ts
interface ListingCardProps {
  id: string
  title: string
  location: string       // เช่น "หนองหญ้าไซ สุพรรณบุรี"
  price: string          // formatted เช่น "1,550,000"
  image: string          // URL รูปภาพ
  tag?: "HOT" | "PREMIUM" | null
  ownerType?: string     // เช่น "เจ้าของขายเอง" | "นายหน้า"
  type?: string          // "house" | "condo" | "land" | "townhouse" | "commercial" | "warehouse"
}
```

### API Endpoints ที่ Frontend คาดหวัง

| Component | Endpoint (ตัวอย่าง) | หมายเหตุ |
|---|---|---|
| `LatestListings` | `GET /api/listings?sort=latest&limit=6` | แสดงประกาศล่าสุด, filter ตาม `type` |
| `FeaturedListings` | `GET /api/listings?featured=true&limit=6` | ประกาศแนะนำ |
| Listing detail | `GET /api/listings/:id` | หน้ารายละเอียด (ยังไม่ได้สร้าง) |
| Search | `GET /api/listings?type=&region=&province=&priceMin=&priceMax=` | หน้า search (ยังไม่ได้สร้าง) |

---

## URL / Query Parameter ที่ใช้ในระบบ

| URL | ความหมาย |
|---|---|
| `/search?type=house` | ค้นหาบ้านเดี่ยว |
| `/search?type=condo` | ค้นหาคอนโด |
| `/search?type=land` | ค้นหาที่ดิน |
| `/search?type=townhouse` | ค้นหาทาวน์เฮาส์ |
| `/search?type=commercial` | ค้นหาอาคารพาณิชย์ |
| `/search?type=warehouse` | ค้นหาโกดัง/โรงงาน |
| `/search?region=northern` | กรองตามภาค |
| `/search?province=เชียงใหม่` | กรองตามจังหวัด |

---

## สิ่งที่ยังต้องทำ (Frontend)

- [ ] หน้า `/search` — ค้นหาพร้อม filter ราคา, ประเภท, ทำเล
- [ ] หน้า `/listings/[id]` — รายละเอียดประกาศ
- [ ] ระบบ Auth — เข้าสู่ระบบ / สมัครสมาชิก
- [ ] หน้า ลงประกาศ — form + upload รูป
- [ ] เชื่อม Province map selection กับ `/search?province=xxx` (ตอนนี้แค่ `console.log`)
- [ ] ระบบ Favorites (หัวใจบน listing card)
- [ ] เชื่อม `LatestListings` / `FeaturedListings` กับ API จริง (แทน mock data)
