import type { Metadata, Viewport } from "next";
import "./globals.css";

// ─── Viewport (separate export required by Next 15) ──────────────────────────

export const viewport: Viewport = {
  themeColor:           "#09090e",
  width:                "device-width",
  initialScale:         1,
  minimumScale:         1,
  viewportFit:          "cover",    // safe-area support on iPhone notch
};

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  // Core
  title:          "OptionRank Lite",
  description:    "Score, rank, and visualise your option trade setups. Delta · Theta · R:R · P/L.",
  applicationName: "OptionRank Lite",
  generator:      "Next.js",
  keywords:       ["options", "trading", "delta", "theta", "implied volatility", "risk reward"],

  // PWA manifest
  manifest: "/manifest.json",

  // Favicons
  icons: {
    icon:             [
      { url: "/favicon.png",          sizes: "32x32",  type: "image/png" },
      { url: "/icons/icon-96x96.png", sizes: "96x96",  type: "image/png" },
    ],
    apple:            "/icons/apple-touch-icon.png",
    shortcut:         "/favicon.png",
  },

  // Apple PWA
  appleWebApp: {
    capable:        true,
    title:          "OptionRank",
    statusBarStyle: "black-translucent",
  },

  // Open Graph
  openGraph: {
    type:        "website",
    title:       "OptionRank Lite",
    description: "Simple Option Trade Evaluator",
    siteName:    "OptionRank Lite",
  },

  // Robots
  robots: {
    index:  false,   // trading tool — no need to index
    follow: false,
  },
};

// ─── Root layout ──────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* MS Tile (Windows PWA) */}
        <meta name="msapplication-TileColor"   content="#09090e" />
        <meta name="msapplication-TileImage"   content="/icons/icon-144x144.png" />
        <meta name="msapplication-config"       content="none" />

        {/* Standalone display hint for older iOS */}
        <meta name="mobile-web-app-capable"    content="yes" />
      </head>
      <body
        className="min-h-screen antialiased"
        style={{ background: "var(--bg-base)", color: "var(--ink-1)" }}
      >
        <div className="relative z-10 flex min-h-screen flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
