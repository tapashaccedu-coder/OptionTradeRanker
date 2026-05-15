# PWA Setup — OptionRank Lite

## Stack

| Part | Package |
|------|---------|
| PWA wrapper | `@ducanh2912/next-pwa` (maintained Next-PWA fork) |
| Service worker | Workbox (via next-pwa) |
| Caching strategy | Network-first for navigation, cache-first for static assets |
| Offline page | `/public/offline.html` |

---

## Getting started

```bash
npm install
npm run build   # generates sw.js + workbox-*.js in /public
npm start
```

> **Note:** The service worker is **disabled in development** (`NODE_ENV=development`).  
> To test PWA behaviour locally, run `npm run build && npm start`.

---

## Vercel deployment

1. Push to GitHub
2. Connect repo to Vercel — zero additional config needed
3. `vercel.json` handles the correct `Cache-Control` and `Service-Worker-Allowed` headers

```bash
vercel --prod
```

---

## Icon sizes

All icons are in `/public/icons/`:

| File | Size | Usage |
|------|------|-------|
| `icon-72x72.png`   | 72×72   | Android legacy |
| `icon-96x96.png`   | 96×96   | Android |
| `icon-128x128.png` | 128×128 | Chrome Web Store |
| `icon-144x144.png` | 144×144 | Windows tile, iOS |
| `icon-152x152.png` | 152×152 | iOS legacy |
| `icon-192x192.png` | 192×192 | Android home screen (maskable) |
| `icon-384x384.png` | 384×384 | Android splash |
| `icon-512x512.png` | 512×512 | Maskable, splash (maskable) |
| `icon.svg`         | any     | Modern browsers |
| `apple-touch-icon.png` | 180×180 | iOS "Add to Home Screen" |

To replace with custom icons, swap the PNGs keeping the same filenames.

---

## Caching behaviour

| Resource | Strategy |
|----------|----------|
| HTML pages | Network-first with offline fallback → `offline.html` |
| JS/CSS chunks | Cache-first, long-lived |
| Images/icons | Cache-first, long-lived |
| Fonts | Cache-first |
| `localStorage` data | Always available (browser storage, no SW needed) |

---

## Install prompt

Browsers show an "Add to Home Screen" / install prompt automatically when:
- Served over HTTPS (Vercel does this)
- `manifest.json` is linked
- Service worker is registered
- At least a 192×192 and 512×512 icon are present ✓

All four conditions are met after a Vercel deploy.
