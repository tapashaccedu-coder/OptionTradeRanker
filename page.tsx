@tailwind base;
@tailwind components;
@tailwind utilities;

@import url("https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap");

/* ─── CSS custom properties ─────────────────────────────────────────────────── */
:root {
  --font-mono: "Space Mono", monospace;
  --font-sans: "Inter", system-ui, sans-serif;

  /* Surface scale */
  --bg-base:    #09090e;
  --bg-raised:  #0f0f17;
  --bg-card:    #0d0d14;
  --bg-inset:   #080810;
  --bg-border:  #1c1c2a;
  --bg-border2: #242436;

  /* Accent */
  --accent:      #00d4ff;
  --accent-dim:  rgba(0, 212, 255, 0.08);
  --accent-glow: rgba(0, 212, 255, 0.18);

  /* Ink scale */
  --ink-1: #eeeef5;   /* headings */
  --ink-2: #a0a0bc;   /* body */
  --ink-3: #64647e;   /* muted */
  --ink-4: #36364a;   /* faint */

  /* Signal */
  --green:  #00e87a;
  --amber:  #f5a623;
  --red:    #ff3d6b;

  /* Motion */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --dur-fast: 120ms;
  --dur-base: 180ms;
}

/* ─── Reset ─────────────────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }
html { color-scheme: dark; scroll-behavior: smooth; }

/* ─── Base ──────────────────────────────────────────────────────────────────── */
body {
  background-color: var(--bg-base);
  color: var(--ink-1);
  font-family: var(--font-mono);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.6;
}

/* ─── Background chrome ─────────────────────────────────────────────────────── */

/* Fine grid */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(0,212,255,0.018) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,212,255,0.018) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
  z-index: 0;
}

/* Top-center radial glow */
body::after {
  content: "";
  position: fixed;
  top: -30%;
  left: 50%;
  transform: translateX(-50%);
  width: 800px;
  height: 500px;
  background: radial-gradient(ellipse at center,
    rgba(0,212,255,0.055) 0%,
    rgba(0,212,255,0.01) 50%,
    transparent 70%);
  pointer-events: none;
  z-index: 0;
}

/* ─── Scrollbar ─────────────────────────────────────────────────────────────── */
::-webkit-scrollbar       { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: var(--bg-base); }
::-webkit-scrollbar-thumb { background: var(--bg-border2); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: var(--accent); }

/* ─── Component utilities ───────────────────────────────────────────────────── */
@layer components {

  /* Section wrapper: consistent vertical padding + separator */
  .page-section {
    @apply relative;
  }

  /* Page section divider */
  .section-divider {
    height: 1px;
    background: linear-gradient(to right, transparent, var(--bg-border2) 20%, var(--bg-border2) 80%, transparent);
    margin: 0;
  }

  /* Card base */
  .card {
    @apply rounded-2xl border bg-[#0d0d14] overflow-hidden;
    border-color: var(--bg-border);
    box-shadow: 0 2px 16px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.02) inset;
    transition: border-color var(--dur-base) var(--ease-out),
                box-shadow var(--dur-base) var(--ease-out);
  }
  .card:hover {
    border-color: var(--bg-border2);
    box-shadow: 0 4px 24px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.02) inset;
  }

  /* Card top accent line (colored) */
  .card-accent-top {
    height: 1px;
    background: linear-gradient(to right, transparent, var(--accent) 40%, var(--accent) 60%, transparent);
    opacity: 0.25;
  }

  /* Input base */
  .field-input {
    @apply w-full bg-transparent px-3 py-2.5 text-sm font-mono;
    color: var(--ink-1);
    transition: none;
  }
  .field-input::placeholder { color: var(--ink-4); }
  .field-input:focus { outline: none; }
  /* hide number spinners */
  .field-input[type="number"] {
    -moz-appearance: textfield;
  }
  .field-input[type="number"]::-webkit-outer-spin-button,
  .field-input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }

  /* Field wrapper */
  .field-wrap {
    @apply flex items-center rounded-lg border;
    background: var(--bg-inset);
    border-color: var(--bg-border);
    transition: border-color var(--dur-fast) var(--ease-out),
                box-shadow var(--dur-fast) var(--ease-out);
  }
  .field-wrap:hover { border-color: var(--bg-border2); }
  .field-wrap:focus-within {
    border-color: rgba(0,212,255,0.45);
    box-shadow: 0 0 0 3px rgba(0,212,255,0.07);
  }

  /* Primary button */
  .btn-primary {
    @apply inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5;
    @apply font-mono text-sm font-bold tracking-widest uppercase;
    background: var(--accent);
    color: #080810;
    transition: background var(--dur-fast), box-shadow var(--dur-fast), transform var(--dur-fast);
  }
  .btn-primary:hover:not(:disabled) {
    background: #33ddff;
    box-shadow: 0 0 24px rgba(0,212,255,0.28);
  }
  .btn-primary:active:not(:disabled) { transform: scale(0.97); }
  .btn-primary:disabled {
    background: var(--bg-border);
    color: var(--ink-4);
    cursor: not-allowed;
  }

  /* Ghost button */
  .btn-ghost {
    @apply inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5;
    @apply font-mono text-sm;
    color: var(--ink-3);
    border: 1px solid var(--bg-border);
    background: transparent;
    transition: border-color var(--dur-fast), color var(--dur-fast), background var(--dur-fast);
  }
  .btn-ghost:hover {
    border-color: var(--bg-border2);
    color: var(--ink-2);
    background: rgba(255,255,255,0.02);
  }
  .btn-ghost:active { transform: scale(0.98); }

  /* Danger ghost */
  .btn-danger {
    @apply btn-ghost;
  }
  .btn-danger:hover {
    border-color: rgba(255,61,107,0.3);
    color: rgba(255,61,107,0.7);
    background: rgba(255,61,107,0.04);
  }

  /* Section nav pill */
  .nav-pill {
    @apply inline-flex items-center gap-2 rounded-full px-3 py-1;
    @apply font-mono text-xs tracking-widest uppercase;
    color: var(--ink-3);
    border: 1px solid var(--bg-border);
    background: transparent;
    transition: all var(--dur-fast);
    cursor: pointer;
  }
  .nav-pill:hover {
    color: var(--ink-2);
    border-color: var(--bg-border2);
    background: rgba(255,255,255,0.02);
  }
  .nav-pill.active {
    color: var(--accent);
    border-color: rgba(0,212,255,0.25);
    background: rgba(0,212,255,0.06);
  }

  /* Section heading row */
  .section-heading {
    @apply flex items-center gap-3 mb-6;
  }
  .section-heading .num {
    @apply font-mono text-xs tracking-widest;
    color: var(--accent);
    opacity: 0.7;
  }
  .section-heading .title {
    @apply font-mono text-xs tracking-widest uppercase;
    color: var(--ink-3);
    letter-spacing: 0.15em;
  }
  .section-heading .line {
    @apply flex-1 h-px;
    background: var(--bg-border);
  }

  /* Collapse toggle button */
  .collapse-toggle {
    @apply flex items-center gap-2 rounded-lg px-3 py-1.5;
    @apply font-mono text-xs;
    color: var(--ink-3);
    transition: color var(--dur-fast), background var(--dur-fast);
  }
  .collapse-toggle:hover { color: var(--ink-2); background: rgba(255,255,255,0.03); }
}
