import type {
  ListingSummary,
  ListingDetailResponse,
  Facility,
  ApiPaginatedResponse,
  ApiResponse,
  ListingsQuery,
} from "./types";

// ==========================================
// Mock Data — BaanTDee Showcase
// ==========================================

export const MOCK_FACILITIES: Facility[] = [
  { id: 1,  slug: "pool",       label: "สระว่ายน้ำ" },
  { id: 2,  slug: "gym",        label: "ฟิตเนส" },
  { id: 3,  slug: "security",   label: "รปภ. 24 ชม." },
  { id: 4,  slug: "cctv",       label: "กล้องวงจรปิด" },
  { id: 5,  slug: "parking",    label: "ที่จอดรถ" },
  { id: 6,  slug: "garden",     label: "สวน" },
  { id: 7,  slug: "playground", label: "สนามเด็กเล่น" },
  { id: 8,  slug: "elevator",   label: "ลิฟต์" },
  { id: 9,  slug: "lobby",      label: "ล็อบบี้" },
  { id: 10, slug: "sauna",      label: "ซาวน่า" },
  { id: 11, slug: "clubhouse",  label: "คลับเฮ้าส์" },
  { id: 12, slug: "shop",       label: "ร้านสะดวกซื้อ" },
];

function img(seed: string, w = 800, h = 600) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

const MOCK_LISTINGS: ListingSummary[] = [
  // ── Bangkok / กรุงเทพฯ ────────────────────────────────────────────────
  {
    id: 1, user_id: 1,
    slug: "ban-diao-2-chan-phrakanong-bkk-001",
    title: "บ้านเดี่ยว 2 ชั้น โครงการหมู่บ้านสัมมากร พระโขนง",
    type: "house", offer: "sale", status: "active",
    price: 5_800_000, price_rent: null,
    area: 220, land_area: 54,
    bedrooms: 4, bathrooms: 3,
    province: "กรุงเทพมหานคร", district: "พระโขนง",
    is_featured: true, view_count: 312,
    cover_url: img("btd-house-bkk1"),
    created_at: "2026-04-10T09:00:00Z", updated_at: "2026-04-10T09:00:00Z",
  },
  {
    id: 2, user_id: 1,
    slug: "condo-high-rise-asok-bkk-002",
    title: "คอนโด High Rise ชั้น 18 ใกล้ BTS อโศก เพียง 300 ม.",
    type: "condo", offer: "sale", status: "active",
    price: 4_200_000, price_rent: 22_000,
    area: 48, land_area: null,
    bedrooms: 1, bathrooms: 1,
    province: "กรุงเทพมหานคร", district: "วัฒนา",
    is_featured: true, view_count: 489,
    cover_url: img("btd-condo-asok"),
    created_at: "2026-04-15T10:30:00Z", updated_at: "2026-04-15T10:30:00Z",
  },
  {
    id: 3, user_id: 2,
    slug: "townhouse-3-chan-ladphrao-bkk-003",
    title: "ทาวน์เฮาส์ 3 ชั้น ซอยลาดพร้าว 71 ใกล้ MRT ลาดพร้าว",
    type: "townhouse", offer: "rent", status: "active",
    price: 18_000, price_rent: 18_000,
    area: 180, land_area: 22,
    bedrooms: 3, bathrooms: 3,
    province: "กรุงเทพมหานคร", district: "ลาดพร้าว",
    is_featured: false, view_count: 210,
    cover_url: img("btd-town-lprao"),
    created_at: "2026-05-01T08:00:00Z", updated_at: "2026-05-01T08:00:00Z",
  },
  {
    id: 4, user_id: 2,
    slug: "condo-studio-silom-bkk-004",
    title: "คอนโด Studio ใจกลางสีลม วิวเมือง ชั้น 22",
    type: "condo", offer: "rent", status: "active",
    price: 15_000, price_rent: 15_000,
    area: 30, land_area: null,
    bedrooms: 1, bathrooms: 1,
    province: "กรุงเทพมหานคร", district: "บางรัก",
    is_featured: false, view_count: 178,
    cover_url: img("btd-condo-silom"),
    created_at: "2026-05-05T11:00:00Z", updated_at: "2026-05-05T11:00:00Z",
  },
  {
    id: 5, user_id: 3,
    slug: "ban-diao-resort-style-bangna-bkk-005",
    title: "บ้านเดี่ยวสไตล์รีสอร์ท 3 ชั้น บางนา-ตราด กม.7",
    type: "house", offer: "sale", status: "active",
    price: 12_500_000, price_rent: null,
    area: 450, land_area: 100,
    bedrooms: 5, bathrooms: 4,
    province: "กรุงเทพมหานคร", district: "บางนา",
    is_featured: true, view_count: 527,
    cover_url: img("btd-house-bangna"),
    created_at: "2026-03-20T07:00:00Z", updated_at: "2026-03-20T07:00:00Z",
  },
  {
    id: 6, user_id: 3,
    slug: "condo-2bed-ratchada-bkk-006",
    title: "คอนโด 2 ห้องนอน ติด MRT รัชดาภิเษก พร้อมเฟอร์นิเจอร์",
    type: "condo", offer: "sale_rent", status: "active",
    price: 3_900_000, price_rent: 20_000,
    area: 65, land_area: null,
    bedrooms: 2, bathrooms: 2,
    province: "กรุงเทพมหานคร", district: "ห้วยขวาง",
    is_featured: false, view_count: 341,
    cover_url: img("btd-condo-ratchada"),
    created_at: "2026-04-22T09:30:00Z", updated_at: "2026-04-22T09:30:00Z",
  },
  {
    id: 7, user_id: 4,
    slug: "land-bangkae-bkk-007",
    title: "ที่ดินเปล่า ย่านบางแค ทำเลดีใกล้ห้างเซ็นทรัล",
    type: "land", offer: "sale", status: "active",
    price: 8_000_000, price_rent: null,
    area: null, land_area: 100,
    bedrooms: null, bathrooms: null,
    province: "กรุงเทพมหานคร", district: "บางแค",
    is_featured: false, view_count: 95,
    cover_url: img("btd-land-bkk"),
    created_at: "2026-04-05T06:00:00Z", updated_at: "2026-04-05T06:00:00Z",
  },
  {
    id: 8, user_id: 4,
    slug: "commercial-chatuchak-bkk-008",
    title: "อาคารพาณิชย์ 4 ชั้น ติดถนนพหลโยธิน จตุจักร",
    type: "commercial", offer: "sale_rent", status: "active",
    price: 18_000_000, price_rent: 65_000,
    area: 350, land_area: 40,
    bedrooms: null, bathrooms: 4,
    province: "กรุงเทพมหานคร", district: "จตุจักร",
    is_featured: true, view_count: 214,
    cover_url: img("btd-commercial-jj"),
    created_at: "2026-03-15T08:00:00Z", updated_at: "2026-03-15T08:00:00Z",
  },
  // ── Chiang Mai / เชียงใหม่ ────────────────────────────────────────────
  {
    id: 9, user_id: 5,
    slug: "ban-resort-style-hangdong-cm-001",
    title: "บ้านเดี่ยวสไตล์ Lanna ล้อมรั้ว พร้อมสระว่ายน้ำ หางดง",
    type: "house", offer: "sale", status: "active",
    price: 7_500_000, price_rent: null,
    area: 320, land_area: 120,
    bedrooms: 4, bathrooms: 3,
    province: "เชียงใหม่", district: "หางดง",
    is_featured: true, view_count: 403,
    cover_url: img("btd-house-cm1"),
    created_at: "2026-04-08T07:30:00Z", updated_at: "2026-04-08T07:30:00Z",
  },
  {
    id: 10, user_id: 5,
    slug: "condo-nimman-cm-002",
    title: "คอนโด Loft Style นิมมานเหมินท์ เดิน 5 นาทีถึงมายา",
    type: "condo", offer: "rent", status: "active",
    price: 12_000, price_rent: 12_000,
    area: 38, land_area: null,
    bedrooms: 1, bathrooms: 1,
    province: "เชียงใหม่", district: "สุเทพ",
    is_featured: false, view_count: 296,
    cover_url: img("btd-condo-nimman"),
    created_at: "2026-05-03T10:00:00Z", updated_at: "2026-05-03T10:00:00Z",
  },
  {
    id: 11, user_id: 6,
    slug: "townhouse-muang-cm-003",
    title: "ทาวน์เฮาส์ 2 ชั้น ใจกลางเมืองเชียงใหม่ ใกล้ตลาดวโรรส",
    type: "townhouse", offer: "sale", status: "active",
    price: 2_800_000, price_rent: null,
    area: 120, land_area: 18,
    bedrooms: 3, bathrooms: 2,
    province: "เชียงใหม่", district: "เมืองเชียงใหม่",
    is_featured: false, view_count: 187,
    cover_url: img("btd-town-cm"),
    created_at: "2026-04-25T09:00:00Z", updated_at: "2026-04-25T09:00:00Z",
  },
  {
    id: 12, user_id: 6,
    slug: "land-sanpatong-cm-004",
    title: "ที่ดินสวน สันป่าตอง วิวภูเขา บรรยากาศดีมาก",
    type: "land", offer: "sale", status: "active",
    price: 3_200_000, price_rent: null,
    area: null, land_area: 200,
    bedrooms: null, bathrooms: null,
    province: "เชียงใหม่", district: "สันป่าตอง",
    is_featured: false, view_count: 112,
    cover_url: img("btd-land-cm"),
    created_at: "2026-04-18T06:30:00Z", updated_at: "2026-04-18T06:30:00Z",
  },
  // ── Phuket / ภูเก็ต ──────────────────────────────────────────────────
  {
    id: 13, user_id: 7,
    slug: "villa-seaview-patong-pkt-001",
    title: "Pool Villa วิวทะเล 4 ห้องนอน ป่าตอง ภูเก็ต",
    type: "house", offer: "sale", status: "active",
    price: 28_000_000, price_rent: null,
    area: 480, land_area: 400,
    bedrooms: 4, bathrooms: 4,
    province: "ภูเก็ต", district: "กะทู้",
    is_featured: true, view_count: 712,
    cover_url: img("btd-villa-phuket"),
    created_at: "2026-03-10T08:00:00Z", updated_at: "2026-03-10T08:00:00Z",
  },
  {
    id: 14, user_id: 7,
    slug: "condo-beachfront-rawai-pkt-002",
    title: "คอนโด Beachfront ราไวย์ ชั้น 5 วิวทะเลอันดามัน",
    type: "condo", offer: "sale_rent", status: "active",
    price: 6_900_000, price_rent: 35_000,
    area: 75, land_area: null,
    bedrooms: 2, bathrooms: 2,
    province: "ภูเก็ต", district: "เมืองภูเก็ต",
    is_featured: true, view_count: 558,
    cover_url: img("btd-condo-phuket"),
    created_at: "2026-03-25T10:00:00Z", updated_at: "2026-03-25T10:00:00Z",
  },
  {
    id: 15, user_id: 8,
    slug: "condo-thalang-pkt-003",
    title: "คอนโด 1 ห้องนอน ถลาง ใกล้สนามบินภูเก็ต เพียง 10 นาที",
    type: "condo", offer: "rent", status: "active",
    price: 18_000, price_rent: 18_000,
    area: 42, land_area: null,
    bedrooms: 1, bathrooms: 1,
    province: "ภูเก็ต", district: "ถลาง",
    is_featured: false, view_count: 234,
    cover_url: img("btd-condo-thalang"),
    created_at: "2026-05-07T09:00:00Z", updated_at: "2026-05-07T09:00:00Z",
  },
  {
    id: 16, user_id: 8,
    slug: "land-cherngtalay-pkt-004",
    title: "ที่ดินเชิงพาณิชย์ เชิงทะเล ทำเลโปรเจกต์หรู",
    type: "land", offer: "sale", status: "active",
    price: 22_000_000, price_rent: null,
    area: null, land_area: 480,
    bedrooms: null, bathrooms: null,
    province: "ภูเก็ต", district: "ถลาง",
    is_featured: false, view_count: 143,
    cover_url: img("btd-land-phuket"),
    created_at: "2026-04-12T07:00:00Z", updated_at: "2026-04-12T07:00:00Z",
  },
  // ── Chonburi / ชลบุรี ────────────────────────────────────────────────
  {
    id: 17, user_id: 9,
    slug: "ban-diao-pattaya-cbl-001",
    title: "บ้านเดี่ยว พัทยาเหนือ ใกล้ซีนาร่า รีสอร์ท",
    type: "house", offer: "sale", status: "active",
    price: 6_200_000, price_rent: null,
    area: 250, land_area: 70,
    bedrooms: 3, bathrooms: 3,
    province: "ชลบุรี", district: "เมืองพัทยา",
    is_featured: false, view_count: 289,
    cover_url: img("btd-house-pattaya"),
    created_at: "2026-04-20T08:00:00Z", updated_at: "2026-04-20T08:00:00Z",
  },
  {
    id: 18, user_id: 9,
    slug: "condo-sriracha-cbl-002",
    title: "คอนโด ศรีราชา ใกล้นิคมอมตะซิตี้ เหมาะนักธุรกิจ",
    type: "condo", offer: "rent", status: "active",
    price: 10_000, price_rent: 10_000,
    area: 35, land_area: null,
    bedrooms: 1, bathrooms: 1,
    province: "ชลบุรี", district: "ศรีราชา",
    is_featured: false, view_count: 196,
    cover_url: img("btd-condo-sriracha"),
    created_at: "2026-05-02T10:00:00Z", updated_at: "2026-05-02T10:00:00Z",
  },
  {
    id: 19, user_id: 10,
    slug: "townhouse-banglamung-cbl-003",
    title: "ทาวน์เฮาส์ 2 ชั้น บางละมุง ทำเลดีเดินทางสะดวก",
    type: "townhouse", offer: "sale", status: "active",
    price: 1_950_000, price_rent: null,
    area: 100, land_area: 16,
    bedrooms: 2, bathrooms: 2,
    province: "ชลบุรี", district: "บางละมุง",
    is_featured: false, view_count: 154,
    cover_url: img("btd-town-cbl"),
    created_at: "2026-04-30T07:00:00Z", updated_at: "2026-04-30T07:00:00Z",
  },
  // ── Nonthaburi / นนทบุรี ─────────────────────────────────────────────
  {
    id: 20, user_id: 11,
    slug: "ban-diao-pakkret-ntb-001",
    title: "บ้านเดี่ยว หมู่บ้านเมืองทอง ปากเกร็ด บรรยากาศดี",
    type: "house", offer: "sale", status: "active",
    price: 4_800_000, price_rent: null,
    area: 200, land_area: 56,
    bedrooms: 3, bathrooms: 3,
    province: "นนทบุรี", district: "ปากเกร็ด",
    is_featured: false, view_count: 231,
    cover_url: img("btd-house-ntb"),
    created_at: "2026-04-14T08:30:00Z", updated_at: "2026-04-14T08:30:00Z",
  },
  {
    id: 21, user_id: 11,
    slug: "condo-muang-ntb-002",
    title: "คอนโด ติด MRT กระทรวงสาธารณสุข นนทบุรี ชั้น 8",
    type: "condo", offer: "sale", status: "active",
    price: 2_650_000, price_rent: null,
    area: 32, land_area: null,
    bedrooms: 1, bathrooms: 1,
    province: "นนทบุรี", district: "เมืองนนทบุรี",
    is_featured: false, view_count: 173,
    cover_url: img("btd-condo-ntb"),
    created_at: "2026-05-06T09:00:00Z", updated_at: "2026-05-06T09:00:00Z",
  },
  // ── Pathum Thani / ปทุมธานี ──────────────────────────────────────────
  {
    id: 22, user_id: 12,
    slug: "ban-diao-thanyaburi-ptt-001",
    title: "บ้านเดี่ยว 2 ชั้น โครงการธัญบุรีพาร์ค หมู่บ้านสะอาด",
    type: "house", offer: "sale", status: "active",
    price: 3_900_000, price_rent: null,
    area: 175, land_area: 48,
    bedrooms: 3, bathrooms: 2,
    province: "ปทุมธานี", district: "ธัญบุรี",
    is_featured: false, view_count: 167,
    cover_url: img("btd-house-ptt"),
    created_at: "2026-04-28T08:00:00Z", updated_at: "2026-04-28T08:00:00Z",
  },
  {
    id: 23, user_id: 12,
    slug: "townhouse-klongluang-ptt-002",
    title: "ทาวน์เฮาส์ คลองหลวง ใกล้มหาวิทยาลัยธรรมศาสตร์ รังสิต",
    type: "townhouse", offer: "rent", status: "active",
    price: 9_000, price_rent: 9_000,
    area: 110, land_area: 20,
    bedrooms: 2, bathrooms: 2,
    province: "ปทุมธานี", district: "คลองหลวง",
    is_featured: false, view_count: 142,
    cover_url: img("btd-town-ptt"),
    created_at: "2026-05-10T10:00:00Z", updated_at: "2026-05-10T10:00:00Z",
  },
  // ── Khon Kaen / ขอนแก่น ──────────────────────────────────────────────
  {
    id: 24, user_id: 13,
    slug: "ban-diao-muang-kkn-001",
    title: "บ้านเดี่ยว ใจกลางเมืองขอนแก่น ใกล้โรงพยาบาลศรีนครินทร์",
    type: "house", offer: "sale", status: "active",
    price: 3_500_000, price_rent: null,
    area: 160, land_area: 52,
    bedrooms: 3, bathrooms: 2,
    province: "ขอนแก่น", district: "เมืองขอนแก่น",
    is_featured: false, view_count: 198,
    cover_url: img("btd-house-kkn"),
    created_at: "2026-04-16T08:00:00Z", updated_at: "2026-04-16T08:00:00Z",
  },
  {
    id: 25, user_id: 13,
    slug: "condo-muang-kkn-002",
    title: "คอนโด ขอนแก่น ใกล้ ม.ขอนแก่น พร้อมอยู่",
    type: "condo", offer: "rent", status: "active",
    price: 7_000, price_rent: 7_000,
    area: 30, land_area: null,
    bedrooms: 1, bathrooms: 1,
    province: "ขอนแก่น", district: "เมืองขอนแก่น",
    is_featured: false, view_count: 119,
    cover_url: img("btd-condo-kkn"),
    created_at: "2026-05-09T09:00:00Z", updated_at: "2026-05-09T09:00:00Z",
  },
  // ── Samut Prakan / สมุทรปราการ ────────────────────────────────────────
  {
    id: 26, user_id: 14,
    slug: "ban-diao-bangplee-spk-001",
    title: "บ้านเดี่ยว บางพลี หมู่บ้านสินทรัพย์ ใกล้สนามบินสุวรรณภูมิ",
    type: "house", offer: "sale", status: "active",
    price: 4_500_000, price_rent: null,
    area: 190, land_area: 58,
    bedrooms: 3, bathrooms: 3,
    province: "สมุทรปราการ", district: "บางพลี",
    is_featured: false, view_count: 245,
    cover_url: img("btd-house-spk"),
    created_at: "2026-04-24T08:30:00Z", updated_at: "2026-04-24T08:30:00Z",
  },
  {
    id: 27, user_id: 14,
    slug: "condo-muang-spk-002",
    title: "คอนโด BTS สำโรง สมุทรปราการ ติดสถานีรถไฟฟ้า",
    type: "condo", offer: "sale_rent", status: "active",
    price: 1_890_000, price_rent: 8_500,
    area: 28, land_area: null,
    bedrooms: 1, bathrooms: 1,
    province: "สมุทรปราการ", district: "เมืองสมุทรปราการ",
    is_featured: false, view_count: 321,
    cover_url: img("btd-condo-spk"),
    created_at: "2026-04-07T10:00:00Z", updated_at: "2026-04-07T10:00:00Z",
  },
  // ── Rayong / ระยอง ────────────────────────────────────────────────────
  {
    id: 28, user_id: 15,
    slug: "ban-diao-muang-ryg-001",
    title: "บ้านเดี่ยว EEC Zone ระยอง เหมาะนักธุรกิจนิคมอุตสาหกรรม",
    type: "house", offer: "sale", status: "active",
    price: 5_100_000, price_rent: null,
    area: 210, land_area: 65,
    bedrooms: 3, bathrooms: 3,
    province: "ระยอง", district: "เมืองระยอง",
    is_featured: false, view_count: 187,
    cover_url: img("btd-house-ryg"),
    created_at: "2026-04-19T08:00:00Z", updated_at: "2026-04-19T08:00:00Z",
  },
  {
    id: 29, user_id: 15,
    slug: "commercial-mapyangphon-ryg-002",
    title: "อาคารพาณิชย์ 3 ชั้น มาบตาพุด ระยอง ทำเลทอง",
    type: "commercial", offer: "rent", status: "active",
    price: 45_000, price_rent: 45_000,
    area: 280, land_area: 32,
    bedrooms: null, bathrooms: 3,
    province: "ระยอง", district: "มาบตาพุด",
    is_featured: false, view_count: 98,
    cover_url: img("btd-commercial-ryg"),
    created_at: "2026-04-11T07:30:00Z", updated_at: "2026-04-11T07:30:00Z",
  },
  // ── Surat Thani / สุราษฎร์ธานี ────────────────────────────────────────
  {
    id: 30, user_id: 16,
    slug: "ban-diao-kohsamui-srt-001",
    title: "บ้านพักตากอากาศ เกาะสมุย วิวทะเล หาดเฉวง",
    type: "house", offer: "sale_rent", status: "active",
    price: 15_000_000, price_rent: 80_000,
    area: 350, land_area: 200,
    bedrooms: 4, bathrooms: 3,
    province: "สุราษฎร์ธานี", district: "เกาะสมุย",
    is_featured: true, view_count: 634,
    cover_url: img("btd-villa-samui"),
    created_at: "2026-03-28T09:00:00Z", updated_at: "2026-03-28T09:00:00Z",
  },
];

// ──────────────────────────────────────────────────────────────────────────
// Detail builder
// ──────────────────────────────────────────────────────────────────────────

const DESCRIPTIONS: Record<number, string> = {
  1:  "บ้านเดี่ยว 2 ชั้น โครงการหมู่บ้านสัมมากร พระโขนง สภาพดีมาก ตกแต่งพร้อมอยู่ ทาสีใหม่ทั้งหลัง มีสวนหน้าบ้าน ที่จอดรถ 2 คัน อยู่ในซอยเงียบสงบ ใกล้ BTS อ่อนนุช เพียง 800 ม. สะดวกเดินทางเข้าเมือง",
  2:  "คอนโด High Rise ชั้น 18 วิวเมืองสวยงาม ตกแต่งครบครัน เฟอร์นิเจอร์ Built-in ทุกชิ้น ใกล้ BTS อโศกและ MRT สุขุมวิท ห้างสรรพสินค้าครบ ทำเลศักยภาพสูง เหมาะอยู่อาศัยและลงทุน",
  3:  "ทาวน์เฮาส์ 3 ชั้น ซอยลาดพร้าว 71 ใกล้ MRT ลาดพร้าว พื้นที่ใช้สอยกว้างขวาง 3 ห้องนอน 3 ห้องน้ำ ห้องครัวแยก ชั้นล่างสามารถทำเป็นออฟฟิศได้ มีที่จอดรถ 1 คัน",
  4:  "คอนโด Studio ใจกลางสีลม ชั้น 22 วิวเมืองกรุงเทพตอนกลางคืนสวยมาก ห้องใหม่ เฟอร์นิเจอร์ครบ แอร์ 2 เครื่อง ใกล้ BTS ช่องนนทรี สะดวกมากสำหรับคนทำงาน",
  5:  "บ้านเดี่ยวสไตล์รีสอร์ท 3 ชั้น บางนา-ตราด กม.7 พื้นที่ใช้สอยกว้างขวาง 5 ห้องนอน 4 ห้องน้ำ สระว่ายน้ำส่วนตัว สวนขนาดใหญ่ ที่จอดรถ 4 คัน ระบบ Smart Home ใกล้ห้างเมกาบางนา",
  9:  "บ้านเดี่ยวสไตล์ Lanna ล้อมรั้ว พร้อมสระว่ายน้ำ หางดง เชียงใหม่ ออกแบบสวยงามผสมผสานสถาปัตยกรรมล้านนา บรรยากาศร่มรื่น ใกล้ถนนสายเชียงใหม่-หางดง สะดวกเดินทางเข้าเมือง",
  13: "Pool Villa วิวทะเล 4 ห้องนอน ป่าตอง ภูเก็ต สระว่ายน้ำ Infinity Pool วิวทะเลอันดามันพาโนรามา ตกแต่งหรูหรา เฟอร์นิเจอร์นำเข้า ระบบ Smart Home ใกล้ชายหาดป่าตอง 5 นาที เหมาะลงทุน AIRBNB",
  14: "คอนโด Beachfront ราไวย์ ชั้น 5 วิวทะเลอันดามันแบบ Full Sea View ห้องกว้าง 75 ตร.ม. 2 ห้องนอน 2 ห้องน้ำ ระเบียงขนาดใหญ่ ตกแต่งสวย โครงการมีสระว่ายน้ำ ฟิตเนส รปภ. 24 ชม.",
  30: "บ้านพักตากอากาศ เกาะสมุย วิวทะเล หาดเฉวง 4 ห้องนอน 3 ห้องน้ำ สระว่ายน้ำส่วนตัว สวนเขตร้อน เหมาะพักผ่อนและลงทุน ให้เช่านักท่องเที่ยว รายได้ดีมาก อัตราการเข้าพักสูง",
};

const DEFAULT_DESC = "ทรัพย์สินสภาพดี ทำเลดีเยี่ยม สะดวกเดินทาง ใกล้สิ่งอำนวยความสะดวก ห้างสรรพสินค้า โรงพยาบาล โรงเรียนชั้นนำ เหมาะสำหรับครอบครัวและการลงทุน ราคาต่อรองได้";

const FACILITY_SETS: Record<string, number[]> = {
  house:      [3, 4, 5, 6, 7],
  condo:      [1, 2, 3, 4, 5, 8, 9],
  townhouse:  [3, 4, 5],
  land:       [],
  commercial: [3, 4, 5],
};

const OWNERS = [
  { name: "สมชาย วงศ์สุวรรณ",  phone: "081-234-5678", avatar: null },
  { name: "วิภา ทองดี",        phone: "089-876-5432", avatar: null },
  { name: "ประยุทธ์ แสงทอง",   phone: "062-345-6789", avatar: null },
  { name: "นภา รุ่งเรือง",     phone: "095-111-2233", avatar: null },
  { name: "ชาติ สุขสมบูรณ์",   phone: "083-555-7890", avatar: null },
  { name: "มาลี ใจดี",         phone: "097-222-3344", avatar: null },
  { name: "เจษฎา พูลสวัสดิ์",  phone: "064-888-9900", avatar: null },
  { name: "รัชนี เกษมสุข",     phone: "086-777-1122", avatar: null },
];

function buildDetail(s: ListingSummary): ListingDetailResponse {
  const owner = OWNERS[(s.id - 1) % OWNERS.length];
  const facilityIds = FACILITY_SETS[s.type] || [];
  const facilities = MOCK_FACILITIES.filter((f) => facilityIds.includes(f.id));

  const images = [
    { id: s.id * 10 + 1, listing_id: s.id, url: img(`${s.slug}-1`, 1200, 800), key: `${s.slug}-1`, is_cover: true,  sort_order: 0, created_at: s.created_at },
    { id: s.id * 10 + 2, listing_id: s.id, url: img(`${s.slug}-2`, 1200, 800), key: `${s.slug}-2`, is_cover: false, sort_order: 1, created_at: s.created_at },
    { id: s.id * 10 + 3, listing_id: s.id, url: img(`${s.slug}-3`, 1200, 800), key: `${s.slug}-3`, is_cover: false, sort_order: 2, created_at: s.created_at },
    { id: s.id * 10 + 4, listing_id: s.id, url: img(`${s.slug}-4`, 1200, 800), key: `${s.slug}-4`, is_cover: false, sort_order: 3, created_at: s.created_at },
  ];

  return {
    listing: {
      ...s,
      description: DESCRIPTIONS[s.id] ?? DEFAULT_DESC,
      floors: s.type === "condo" ? null : s.type === "land" ? null : 2,
      parking: s.bedrooms ? Math.max(1, Math.floor(s.bedrooms / 2)) : null,
      year_built: 2020 + (s.id % 5),
      address: `${s.district}, ${s.province}`,
      subdistrict: null,
      postal_code: null,
      map_url: null,
      longitude: null,
      latitude: null,
      user_name: owner.name,
      user_phone: owner.phone,
      user_avatar: owner.avatar,
    },
    images,
    facilities,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Public mock API functions
// ──────────────────────────────────────────────────────────────────────────

export function mockGetListings(
  params: ListingsQuery = {}
): ApiPaginatedResponse<ListingSummary> {
  let results = [...MOCK_LISTINGS];

  if (params.province)   results = results.filter((l) => l.province === params.province);
  if (params.type)       results = results.filter((l) => l.type === params.type);
  if (params.offer)      results = results.filter((l) => l.offer === params.offer);
  if (params.min_price)  results = results.filter((l) => l.price >= Number(params.min_price));
  if (params.max_price)  results = results.filter((l) => l.price <= Number(params.max_price));
  if (params.user_id)    results = results.filter((l) => l.user_id === Number(params.user_id));
  if (params.q) {
    const q = String(params.q).toLowerCase();
    results = results.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.province.toLowerCase().includes(q) ||
        l.district.toLowerCase().includes(q)
    );
  }

  if (params.sort === "view_count") {
    results.sort((a, b) => b.view_count - a.view_count);
  } else {
    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Exclude viewed slugs if provided (not a real param but keeps TS happy)
  const page    = Number(params.page)  || 1;
  const perPage = Number(params.limit) || 12;
  const total   = results.length;
  const pages   = Math.max(1, Math.ceil(total / perPage));
  const slice   = results.slice((page - 1) * perPage, page * perPage);

  return {
    success: true,
    data: slice,
    meta: { total, page, per_page: perPage, pages },
  };
}

export function mockGetListingBySlug(
  slug: string
): ApiResponse<ListingDetailResponse> {
  const found = MOCK_LISTINGS.find((l) => l.slug === slug);
  if (!found) {
    return { success: false, error: { code: "NOT_FOUND", message: "ไม่พบรายการ" } };
  }
  return { success: true, data: buildDetail(found) };
}

export function mockGetFacilities(): ApiResponse<Facility[]> {
  return { success: true, data: MOCK_FACILITIES };
}
