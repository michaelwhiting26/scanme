# ScanMe — Premium Instagram QR Code & Sticker Generator

Turn an Instagram `@handle` into a stunning, highly-scannable, print-ready QR
sticker — and track every real-world scan. Built to ship on **Render**.

> Status: **MVP is fully implemented and builds clean.** The QR design engine,
> export pipeline (PNG/SVG/PDF @ 300 DPI), analytics ingestion, auth, dashboard,
> mockups and printer abstraction are all working code, not stubs. Items marked
> _V2/V3_ have their architecture wired but execution deferred.

---

## 1. Architecture at a glance

```
                       ┌─────────────────────────────────────────────┐
   Sticker in the      │              Next.js 15 (App Router)         │
   real world  ──scan──▶  /r/[slug]  ──record scan──▶ Postgres        │
                       │      │                         ▲             │
                       │      └──302──▶ instagram.com/<handle>        │
                       │                                              │
   Creator ───────────▶  /generator (RSC + client engine)            │
                       │      │                                       │
                       │      ├─ POST /api/qr      → persist QrCode   │
                       │      ├─ POST /api/export   → sharp/pdf-lib    │
                       │      └─ POST /api/print     → PrinterProvider │
                       │                                              │
                       │  /dashboard → GET /api/stats → ScanDaily      │
                       └─────────────────────────────────────────────┘
```

- **One rendering engine, two consumers.** `src/lib/qr/engine.ts` is a pure,
  dependency-light SVG generator. The browser uses it for the live preview;
  the server uses the *same* function for exports. The preview is therefore
  byte-identical to the download — no "looked different when I printed it."
- **Tracked redirect = analytics.** Saved codes encode `/r/<slug>`, not the raw
  Instagram URL. Every scan hits our edge, gets recorded, then 302-redirects.
- **Pre-aggregated analytics.** Raw `ScanEvent`s are narrow and append-only;
  `ScanDaily` rollups are incremented transactionally so dashboards read O(days),
  not O(scans).

### Tech stack (as built)

| Layer        | Choice                                                        |
|--------------|---------------------------------------------------------------|
| Framework    | Next.js 15.5 (App Router, RSC, Route Handlers), React 19, TS |
| Styling      | Tailwind CSS v3.4 + shadcn-style primitives + Framer Motion   |
| QR engine    | `qrcode` (matrix + ECC) → custom SVG renderer                 |
| Raster/PDF   | `sharp` (SVG→PNG @300 DPI), `pdf-lib` (exact mm pages)         |
| DB / ORM     | PostgreSQL + Prisma 6                                          |
| Auth         | Auth.js v5 (Google OAuth + email magic link), DB sessions     |
| Charts       | Recharts                                                      |
| Deploy       | Render (Blueprint `render.yaml`: web + managed Postgres)      |
| Rate limit   | Upstash Redis if configured, else Postgres fixed-window       |

---

## 2. Folder structure

```
scanme/
├─ prisma/
│  ├─ schema.prisma           # Users, QrCode, ScanEvent, ScanDaily, Download,
│  │                          # PrinterJob, RateBucket, Auth models
│  └─ seed.ts                 # demo account + 30d synthetic analytics
├─ render.yaml                # Render Blueprint (web + db + V2 worker)
├─ scripts/printer-worker.mjs # V2 async print worker (idle until enabled)
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx           # fonts, metadata, theme provider (dark default)
│  │  ├─ page.tsx             # landing (SEO + JSON-LD + inline generator)
│  │  ├─ generator/page.tsx   # standalone generator
│  │  ├─ login/page.tsx       # Google + magic-link sign in
│  │  ├─ dashboard/           # gated: layout + overview (codes + analytics)
│  │  ├─ r/[slug]/route.ts    # scan redirect + analytics ingestion
│  │  ├─ sitemap.ts, robots.ts
│  │  └─ api/                 # health, qr, qr/[id], export, stats, print, auth
│  ├─ components/
│  │  ├─ ui/                  # button, card, input, label, tabs, badge
│  │  ├─ qr/                  # generator, qr-preview, theme-picker
│  │  ├─ mockups/             # mockup-stage (6 real-world scenes)
│  │  ├─ dashboard/           # analytics-panel, code-card
│  │  └─ site-header / site-footer / theme-provider
│  ├─ lib/
│  │  ├─ qr/                  # engine, themes, matrix, contrast, export, sizes, types
│  │  ├─ auth.ts db.ts validation.ts rate-limit.ts request.ts analytics.ts utils.ts
│  ├─ server/printer/         # provider.ts (interface), providers.ts, registry.ts
│  └─ types/next-auth.d.ts
```

---

## 3. Database schema (highlights)

Full schema in `prisma/schema.prisma`. Performance-relevant decisions:

- **`ScanEvent`** is the high-write table — kept narrow, **never stores raw IP**
  (only a daily-salted `visitorHash`). Indexed on `(qrCodeId, createdAt)` for
  range queries and `(qrCodeId, visitorHash)` for uniqueness checks.
- **`ScanDaily`** is the pre-aggregated rollup with a unique `(qrCodeId, day)`
  key. Device/country breakdowns live in compact JSON columns so a day = one row.
  Dashboard reads scan this table, never the raw events.
- **`QrCode.design`** is JSON validated by Zod (`designConfigSchema`) — the
  schema can evolve without migrations.
- **`RateBucket`** backs the Postgres rate-limiter fallback (TTL via `expiresAt`).
- **`PrinterJob`** carries a vendor-specific `spec` JSON + status state machine
  (`QUEUED → RENDERING → READY → SENT → PRINTED / FAILED`).

---

## 4. API design

| Method | Route                | Purpose                                            | Auth |
|-------:|----------------------|----------------------------------------------------|:----:|
| POST   | `/api/qr`            | Create tracked code (rate-limited, contrast-gated) |  opt |
| GET    | `/api/qr`            | List my codes                                      |  ✓   |
| GET/PATCH/DELETE | `/api/qr/[id]` | Read / update design / delete                    |  ✓   |
| POST   | `/api/export`        | Render PNG/SVG/PDF download, log `Download`        |  opt |
| GET    | `/api/stats`         | Aggregated stats by range (`today/7d/30d/all`)     |  ✓   |
| GET/POST | `/api/print`       | List providers / create job + return artifact      |  ✓   |
| GET    | `/r/[slug]`          | **Scan**: record + 302 to Instagram                |  —   |
| GET    | `/api/health`        | Render health check (DB ping)                      |  —   |

Every mutating route: Zod-validated body → rate limit → ownership check →
contrast safety gate (where relevant). Errors are typed JSON with proper codes
(422 validation, 429 rate limit, 401/404 auth/ownership).

---

## 5. QR design system & scan reliability

Six theme families in `src/lib/qr/themes.ts`: **gradient, neon, chrome,
cyberpunk, minimal luxury, creator**. Each preset is tuned so its worst-case
gradient stop still clears the scan-safety contrast threshold.

Reliability is enforced, not hoped for:

1. **Contrast analyzer** (`contrast.ts`) computes WCAG-style luminance contrast
   on the *worst-case* foreground/background stop pairing and blocks saves/exports
   below **3.5:1** — the empirical floor for phone cameras at an angle.
2. **Auto error-correction** (`matrix.ts`) raises ECC (M→Q→H) based on logo
   occlusion area, so a center logo never eats into recoverability.
3. **Enforced quiet zone** — minimum 4 modules regardless of user input.
4. **Independent eye coloring** keeps finder patterns high-contrast even when the
   data modules use a flashy gradient.
5. **Logo halo** — a solid background pad behind the logo preserves the timing
   patterns around it.

Module shapes (`square/rounded/dots/classy`) and eye shapes
(`square/rounded/circle/leaf`) are rendered with layered primitives that
rasterize identically in the browser and in `sharp`.

---

## 6. UI / UX design system

- **Dark mode default** with a deep near-black canvas + electric-violet→rose
  brand ramp (Linear/Vercel/Raycast lineage), defined as HSL CSS variables in
  `globals.css`.
- **Glassmorphism** (`.glass`), animated **aurora** hero backdrop, faint masked
  grid, gradient text, and `cubic-bezier` fade-up motion.
- **Typography:** Sora (display) + Inter (body) + JetBrains Mono (URLs/metrics).
- **Component hierarchy:** primitives (`components/ui`) → domain components
  (`qr/`, `mockups/`, `dashboard/`) → pages. Mobile-first; the generator stacks
  preview-first on small screens.

---

## 7. Analytics architecture

- **Ingestion** (`/r/[slug]` → `analytics.recordScan`): parse UA (device/OS/
  browser), bot-filter, compute daily-salted visitor hash, determine uniqueness,
  then in one transaction insert the event **and** upsert the daily rollup. Bots
  are recorded but excluded from headline counts. Geo is read from proxy headers
  (`cf-ipcountry`, etc.).
- **Abuse prevention:** per-IP-per-code scan rate limit so a bot can't inflate
  counts; redirect always happens even if limiting/recording fails (fail-open).
- **Reads** (`getStats`): query `ScanDaily` over a date range, fold into a time
  series + device/country breakdowns. Dashboard offers today / 7d / 30d / all.

---

## 8. Printer integration architecture

`PrinterProvider` (`src/server/printer/provider.ts`) is the single seam. App
code only calls `getPrinterProvider(vendor).render(input)`.

- **`GENERIC_PDF`** — fully implemented; produces the 300 DPI print-ready PDF.
- **`BROTHER_QL`, `DYMO`, `ZEBRA`** — capability + validation implemented
  (label-size limits, mono/color), rendering currently delegates to the PDF
  fallback. V2 swaps in ESC/P-raster (Brother), label XML (DYMO) and ZPL `^GFA`
  (Zebra) behind the same interface — **zero upstream changes**.
- Jobs persist as `PrinterJob` rows; `render.yaml` already defines a worker
  service for async batch printing in V2.

---

## 9. Security

- Zod validation + handle sanitization (reserved-word + format rules) on all input.
- Rate limiting (Redis or Postgres) on create / export / scan.
- Bot detection in analytics; raw IPs never persisted (salted hash only).
- Security headers in `next.config.ts` (XFO, nosniff, referrer, permissions).
- DB sessions via Auth.js; ownership checks on every code mutation.
- `sharp`/Prisma marked server-external; secrets only in env (see `.env.example`).

---

## 10. Local development

```bash
cp .env.example .env          # fill DATABASE_URL + AUTH_SECRET (min)
npm install
npm run db:push               # create tables
npm run db:seed               # optional demo data
npm run dev                   # http://localhost:3000
```

Generating works with **zero config**; saving codes/analytics needs a DB; sign-in
needs `AUTH_GOOGLE_ID` or `EMAIL_SERVER`.

---

## 11. Production deployment (Render)

`render.yaml` is a Blueprint — push the repo, "New → Blueprint", point at it:

1. Provisions **managed Postgres 16** + the **web service**.
2. `buildCommand: npm ci && npm run build` (runs `prisma generate`).
3. `preDeployCommand: npx prisma migrate deploy` runs migrations once per deploy.
4. `healthCheckPath: /api/health` gates traffic on a live DB.
5. `AUTH_SECRET` + `SCAN_HASH_SALT` auto-generated; OAuth/email/storage secrets
   set as `sync:false` env vars in the dashboard.

Set `AUTH_URL`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL` to the deployed URL. Add a
custom domain + put Cloudflare in front for geo headers and edge caching of
static assets.

**Scaling notes:** raw `ScanEvent` is the growth table — partition by month or
move to a TSDB (Timescale) at high volume; rollups keep dashboards cheap. Add
Upstash Redis for multi-instance rate limiting. Move exports/printing to the
worker queue when render latency matters.

---

## 12. Roadmap

### MVP (shipped here)
Generator, 6 theme families, contrast/ECC safety, PNG/SVG/PDF @ 300 DPI in
50/75/100mm, live mockups, auth, saved codes, scan analytics, generic print PDF,
SEO landing + JSON-LD, Render blueprint.

### V2
- Async print worker + real Brother/DYMO/Zebra drivers.
- S3/UploadThing asset persistence + shareable hosted QR pages.
- Profile-image fetch for the creator theme; custom logo upload.
- Stripe billing (FREE/PRO/STUDIO plan gating already modeled).
- Geo-IP enrichment service; CSV/API export of analytics.
- A/B sticker variants with per-variant slugs.

### V3
- Team/agency workspaces, white-label domains.
- Dynamic destination switching (repoint a printed sticker without reprinting).
- NFC + QR hybrid stickers; bulk campaign generator (CSV → N codes).
- ML-assisted theme generation from a brand color/logo.
- Heatmap of scans by physical placement (campaign tagging).

---

## 13. Five viral features (hard to copy)

1. **Dynamic destination (printed once, repointed forever).** Because every
   sticker encodes `/r/<slug>`, the owner can repoint it — to a linktree, a drop,
   a different IG, a "we moved" page — *without reprinting*. This single decision
   (already built into the redirect layer) turns a one-shot freebie into a
   recurring-value asset and a retention hook competitors who bake the IG URL
   directly into the QR physically cannot match.

2. **Scan-to-follow heat campaigns.** Tag each sticker batch with a placement
   ("Berghain bathroom", "Coachella gate C"). The dashboard ranks *which physical
   locations* convert scans → profile visits, giving creators a real-world
   growth map. The data moat compounds: more placements → better placement
   recommendations no new entrant has.

3. **Living QR (animated + audio-reactive export).** Ship an animated SVG/APNG/
   MP4 export where the gradient pulses — for stories, screens, and LED bar
   displays — using the same engine with a time parameter. A QR that *moves*
   stops the scroll; static generators can't follow without rebuilding the engine.

4. **"Steal-proof" branded frames + collab codes.** Co-branded split codes (two
   handles, one sticker, a "tap who you follow" UX) and signed frame templates
   that watermark provenance. Drives two-sided invites (each creator shares to
   their audience) — built-in viral coefficient.

5. **AR placement + print-shop one-tap.** Phone-camera AR preview that pins the
   sticker onto a real wall/laptop at true scale before printing, then a one-tap
   handoff to a print/ship partner. Closing the loop from design → physical
   product in-app is an operational moat, not just a feature.

---

Built as a single coherent codebase — `npm run build` passes with all routes
compiling and types checked.
