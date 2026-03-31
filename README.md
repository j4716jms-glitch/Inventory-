# 📦 Inventory Dashboard

A production-ready Next.js inventory management dashboard deployable to Vercel in minutes.

## Features

- 🔍 **Live Search** — instant filtering across product name, SKU, ID, supplier, category
- 🗂 **Category Filter** — filter by Electronics, Apparel, Sports, and more
- ↕️ **Column Sorting** — click any column header to sort ascending/descending
- 📊 **Stats Overview** — total products, in-stock, low-stock, out-of-stock, inventory value
- 📥 **Export Excel** — download filtered data as `.xlsx`
- 📥 **Export CSV** — download filtered data as `.csv`
- 🌑 **Dark industrial UI** — polished dark theme, responsive layout

## Project Structure

```
inventory-dashboard/
├── data/
│   └── products.js       # Sample product data (swap with your API/DB)
├── pages/
│   ├── _app.js
│   └── index.js          # Main dashboard page
├── styles/
│   └── globals.css
├── next.config.js
├── vercel.json
└── package.json
```

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Run locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 3. Deploy to Vercel

**Option A — Vercel CLI**
```bash
npm install -g vercel
vercel
```

**Option B — GitHub + Vercel Dashboard**
1. Push this folder to a GitHub repo
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repo → Vercel auto-detects Next.js
4. Click **Deploy** — done!

## Connecting Real Data

Replace `data/products.js` with a real data source:

```js
// pages/index.js — use getServerSideProps or getStaticProps
export async function getServerSideProps() {
  const res = await fetch('https://your-api.com/products');
  const products = await res.json();
  return { props: { products } };
}
```

Or connect to a database (Supabase, PlanetScale, MongoDB) via API routes in `pages/api/`.

## Customizing Categories

Edit the `CATEGORIES` array in `data/products.js`:
```js
export const CATEGORIES = ['All', 'Electronics', 'Your Category', ...];
```

## Tech Stack

- **Next.js 14** (Pages Router)
- **SheetJS (xlsx)** — Excel export
- **Google Fonts** — Syne + DM Mono + Manrope
- Zero UI library dependencies
