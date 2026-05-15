# OptionRank Lite

> A simple, fast, installable option trade evaluator. Score your setups, visualise P/L and theta decay, and keep a personal trade journal — all in the browser, no account required.

**Live demo:** _deploy to Vercel and add your URL here_

---

## Features

| Feature | Details |
|---------|---------|
| **Scoring engine** | 5-criterion score (0–10): Delta, DTE, IV, Theta, R:R |
| **Result card** | Verdict (Good / Neutral / Risky), score ring, breakdown |
| **P/L chart** | Delta-approximation sweep across ±50% stock move |
| **Theta decay chart** | Exponential decay model with half-life marker |
| **Trade journal** | Save, browse, and delete trades — persisted in localStorage |
| **Session restore** | Form + last result survive page reload |
| **PWA** | Installable on iOS, Android, and desktop Chrome/Edge |
| **Offline support** | Cached pages + localStorage data work without internet |

---

## Tech stack

| Layer | Package |
|-------|---------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + CSS custom properties |
| Charts | Recharts |
| PWA | @ducanh2912/next-pwa (Workbox) |
| Storage | localStorage (no backend) |
| Deploy | Vercel |

---

## Project structure

```
optionrank-lite/
├── app/
│   ├── globals.css          # Design tokens, base styles, component utilities
│   ├── layout.tsx           # Root layout, PWA metadata, viewport
│   └── page.tsx             # Homepage (hero + TradeEvaluator)
│
├── components/
│   ├── Header.tsx           # Sticky navbar
│   ├── TradeEvaluator.tsx   # Main orchestrator: form + results + journal
│   ├── ScorePanel.tsx       # Score result card with ring gauge
│   ├── PLChart.tsx          # P/L simulation chart (Recharts)
│   ├── ThetaChart.tsx       # Theta decay chart (Recharts)
│   └── TradeJournal.tsx     # Saved trades list
│
├── lib/
│   ├── scoring.ts           # Trade scoring engine (pure function)
│   ├── plChart.ts           # P/L data simulation
│   ├── thetaChart.ts        # Theta decay simulation
│   ├── usePersistedTrade.ts # localStorage hook (form + last result)
│   ├── useTradeJournal.ts   # localStorage hook (journal array)
│   └── utils.ts             # formatDollar, formatPercent, etc.
│
├── types/
│   ├── trade.ts             # TradeFormState, Trade, TradeScore
│   └── journal.ts           # JournalEntry
│
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── offline.html         # Offline fallback page
│   ├── favicon.png          # 32×32 favicon
│   └── icons/               # PWA icons (72 → 512px)
│
├── vercel.json              # Cache-Control + SW headers
├── next.config.ts           # Next.js + PWA config
├── tailwind.config.ts       # Design tokens as Tailwind colors
└── PWA_SETUP.md             # PWA details and icon reference
```

---

## Local development

### Prerequisites

- Node.js **18.17+** (Next.js 15 minimum)
- npm 9+ (comes with Node)
- Git

### 1. Unzip and install

```bash
unzip optionrank-lite.zip
cd optionrank-lite
npm install
```

### 2. Copy env file

```bash
cp .env.example .env.local
# No values required — app uses localStorage only
```

### 3. Start dev server

```bash
npm run dev
```

Open **http://localhost:3000**

> **Note:** The PWA service worker is disabled in development.  
> To test PWA / offline behaviour:
> ```bash
> npm run build
> npm start
> ```
> Then open http://localhost:3000 and use Chrome DevTools → Application → Service Workers.

---

## Build

```bash
npm run build    # production build (also generates sw.js + workbox files)
npm start        # serve the production build locally
```

Expected output:
```
Route (app)                     Size     First Load JS
┌ ○ /                           111 kB          213 kB
└ ○ /_not-found                 901 B           103 kB
○  (Static) prerendered as static content
```

---

## Deploy to Vercel

### Option A — Vercel CLI (fastest)

```bash
npm i -g vercel
vercel login
vercel --prod
```

Vercel auto-detects Next.js. No extra config needed — `vercel.json` handles all headers.

### Option B — GitHub + Vercel dashboard

See the full GitHub → Vercel guide at the bottom of this README.

---

## Environment variables

No environment variables are required — the app runs entirely client-side with localStorage.

If you add server-side features (API keys, analytics, etc.) in the future:

```bash
cp .env.example .env.local
# add your values, never commit .env.local
```

---

## Scoring rules reference

| Criterion | Rule | Points |
|-----------|------|--------|
| Delta | `abs(delta)` between 0.50 – 0.65 | +2 |
| DTE | 30 ≤ DTE ≤ 60 | +2 |
| IV | Implied volatility < 50% | +2 |
| Theta | `theta ≥ –0.05` per day | +2 |
| Risk/Reward | `targetProfit% / stopLoss% ≥ 2` | +2 |

**Verdict thresholds:** Good ≥ 8 · Neutral ≥ 5 · Risky < 5

---

## Disclaimer

OptionRank Lite is a personal tool for organising your own thinking about option setups. It is **not financial advice** and does not use real market data, Black-Scholes pricing, or live IV feeds. All calculations are simplified approximations.
