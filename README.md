# BaanTDee — Frontend

> A real estate listing platform for buying and renting properties in Thailand — clean, fast, and easy to use.

**Backend API:** [BaanTDee-backend →](https://github.com/BaanTDee/BaanTDee-backend)

---

## 📌 Overview

**BaanTDee** (Thai: บ้านที่ดี — *"Good Home"*) is a full-stack real estate platform that allows users to post and browse property listings for sale or rent. The frontend is built with **Next.js 14** and **TypeScript**, providing a fast, SEO-friendly experience for buyers, renters, and sellers alike.

---

## ✨ Features

- **Browse Listings** — View all available properties for sale or rent in a clean, card-based layout
- **Property Detail Page** — See full details of each listing including description, price, location, and contact information
- **Post a Listing** — Simple form for sellers and landlords to submit new property listings
- **Search & Filter** — Filter properties by type (sale/rent), location, and price range to find the right match quickly

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| HTTP Client | Axios / Fetch API |
| Font | Geist (Vercel) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm, yarn, pnpm, or bun

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/BaanTDee/BaanTDee-frontend.git
cd BaanTDee-frontend

# 2. Copy environment file
cp .env.example .env.local

# 3. Set your backend API URL in .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000

# 4. Install dependencies
npm install

# 5. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 📁 Project Structure

```
├── app/
│   ├── page.tsx                  # Home — listing browse page
│   ├── listings/
│   │   ├── page.tsx              # All listings
│   │   └── [id]/
│   │       └── page.tsx          # Property detail page
│   ├── post/
│   │   └── page.tsx              # Post a new listing form
│   └── layout.tsx                # Root layout
├── components/
│   ├── ListingCard.tsx           # Property card component
│   ├── ListingForm.tsx           # Post listing form
│   └── SearchFilter.tsx          # Search & filter bar
├── lib/
│   └── api.ts                    # API client (calls BaanTDee backend)
└── public/
```

---

## 🌐 Full-Stack Architecture

```
┌──────────────────────┐         ┌──────────────────┐        ┌────────────┐
│  Next.js Frontend    │ ──────► │  NestJS API (BE) │ ─────► │ PostgreSQL │
│  (Browse/Post/Search)│  HTTP   │  BaanTDee-backend│  ORM   │            │
└──────────────────────┘         └──────────────────┘        └────────────┘
```

---

## 🗺 Roadmap

- [x] Browse all listings
- [x] Property detail page
- [x] Post a new listing form
- [x] Search & filter by type, location, price
- [ ] User authentication
- [ ] Image upload for listings
- [ ] Saved / Favourited listings
- [ ] Mobile-responsive design improvements
- [ ] Map view integration

---

## 👥 Team

**BaanTDee** is a team project.

**Krittapas Polmanee** — Frontend Engineer
[GitHub](https://github.com/krittapastrycode) · [LinkedIn](https://www.linkedin.com/in/กฤตภาส-พลมณี-b387b6294/)

---

## 📄 License

This project is licensed under the MIT License.
