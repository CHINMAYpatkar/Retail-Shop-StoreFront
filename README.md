# Retail Shop — Customer Storefront

The customer-facing storefront for a home-made spices (masala) business. Next.js 15 App Router, React 18, TypeScript, Tailwind.

Part of a three-repo project:

| Repo | Role | Port |
|---|---|---|
| `Retail-Shop-Backend` | NestJS API + PostgreSQL | `4000` |
| `Retail-Shop-Admin-Frontend` | Back-office admin | `3000` |
| **`Retail-Shop-StoreFront`** | **This repo — customer storefront** | **`3001`** |

## The one rule that shapes everything here

**No static content.** Every word a customer reads comes from the API and is editable in the admin UI without a deploy — product copy, page content, section headings, the announcement bar, the footer, even the shop name and logo.

The practical consequence: **with the backend down, or with an empty database, this site renders an almost blank page.** That is correct behaviour, not a bug. Each section returns nothing when its content is absent, so an unconfigured shop gets a spare but valid page rather than a wall of placeholders.

The only strings in the code are interface chrome — navigation destinations, "View all", "Out of stock". Those are facts about what this application implements, not the shop's words.

## Prerequisites

| | Version | Notes |
|---|---|---|
| **Node.js** | 18.18+ | 20 LTS or newer recommended. Check with `node -v` |
| **npm** | 9+ | Ships with Node |
| **PostgreSQL** | 14+ | Not used directly by this repo — the backend needs it |
| **The backend** | running on `:4000` | This repo has **no database of its own** |

This is a pure API client. It holds no schema, runs no migrations, and connects to nothing but the backend's HTTP API.

## Setup

**1. Install dependencies**

```bash
npm install
```

**2. Create your environment file**

`.env.local` is git-ignored, so a fresh clone has none. Copy the template:

```bash
cp .env.example .env.local
```

The defaults assume the backend is on `localhost:4000`. Edit only if yours is elsewhere.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | API base, including the `/api/v1` prefix |
| `NEXT_PUBLIC_MEDIA_URL` | Origin serving uploaded media. Separate from the API base because media sits *outside* the API prefix — those are files, not API resources |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin, used for absolute URLs in metadata |

**3. Start the backend** (separate terminal, from the backend repo)

```bash
npm run start:dev
```

**4. Make sure there is content to render**

Without this the page is nearly empty. From the **backend** repo:

```bash
npm run seed:demo
```

Safe to run against real data: it fills gaps only and never overwrites content you have already written. `npm run seed:demo:clear` removes it again.

**5. Start the storefront**

```bash
npm run dev
```

Open <http://localhost:3001>.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on `:3001` with hot reload |
| `npm run build` | Production build |
| `npm start` | Serve the production build on `:3001` |
| `npm run lint` | ESLint |
| `npm test` | Vitest, once |
| `npm run test:watch` | Vitest, watching |
| `npm run test:cov` | Tests with coverage |

## Project layout

```
src/
  app/                    App Router routes
    layout.tsx            Shell: fonts, metadata, header, footer
    page.tsx              Home
    providers.tsx         React Query, motion, toasts
    globals.css           Tailwind base + reduced-motion block
  components/
    layout/               Header, footer, announcement bar, mobile nav, brand mark
    content/              Hero, section headings, USP strip
    product/              Product card and grid
    motion/               Reveal, Stagger, Parallax, motion provider
    ui/                   Media
  lib/
    config.ts             Env + revalidation windows
    server-api.ts         Server-side fetch, marked server-only
    content.ts            Every API read the site makes, in one file
    utils.ts              Price formatting, media URLs
    sections.ts           Home section lookup by key
  types/api.ts            API response types
```

### Where data comes from

`lib/content.ts` is the single place this site reads the API. If you want to know what the storefront depends on, read that one file.

It uses `fetch`, not axios, on purpose: only `fetch` participates in Next's caching and revalidation, which is how the catalogue is served. An axios call from a server component would be uncacheable and run on every request.

Two revalidation windows, in `lib/config.ts`: **catalogue 300s**, **content 60s**. Content the admin edits and expects to see immediately gets the shorter window — someone who changes the footer and sees nothing for an hour will reasonably conclude the feature is broken.

> **Money arrives as strings.** The API sends Postgres `Decimal` values as strings so they never round-trip through a JavaScript float. `formatPrice` in `lib/utils.ts` is the single place that becomes a number, at the point of display. Do not parse prices earlier.

## Design and motion

The visual direction and animation budget were decided deliberately — see `ADR 0014` in the project vault. Warm and artisanal: deep spice tones on warm paper, editorial serif headings, photography-led. The `ink` / `paper` / `gold` scales are shared with the admin app so the two surfaces read as one business.

Animation is intentionally rich — parallax hero, scroll-driven reveals, staggered lists. That choice comes with obligations, all handled at the root so no component can forget them:

- **`prefers-reduced-motion` is honoured**, three ways over: Framer's `MotionConfig`, a global CSS block, and `useReducedMotionSafe` for hand-rolled scroll effects Framer cannot see. Parallax and the hero video are disabled outright.
- **Use `m.div`, never `motion.div`.** `LazyMotion` loads animation features as a separate chunk; importing `motion` anywhere pulls the full bundle back in and silently undoes it.
- **Transform and opacity only** in scroll handlers. Animating layout properties drops frames visibly on a mid-range Android phone, which is what most customers use.
- **The hero video is not rendered at all** under reduced motion or below 768px, and its bytes are never requested in those cases.

### Scroll reveals must not fail invisible

Reveal animations start content at `opacity: 0` and rely on JavaScript to show it. If the bundle fails, JavaScript is disabled, or `IntersectionObserver` never fires, that content would be **permanently invisible** — to customers and to crawlers. Three mitigations:

1. `useVisibleOnMount` measures the element on mount and shows it immediately if already on screen. Fixes the harmful case and improves LCP — above the fold there was never a reason to wait for an observer callback.
2. A `noscript` stylesheet forces `[data-reveal]` visible.
3. Markup is server-rendered regardless, so the text is in the HTML either way.

If you add a new reveal-style component, keep the `data-reveal` attribute — it is what mitigation 2 targets.

## Images

`next/image` only works for hosts declared in `next.config.mjs` under `images.remotePatterns`, and renders **nothing** for an unknown host, with only a build-time warning.

Admins can paste an external image URL, which the backend supports as a first-class case. So the `Media` component optimises our own media host and falls back to a plain `img` for anything else. A slightly heavier image beats an invisible one.

`Media` is a client component so it can catch `onError`: an absent URL and a URL that 404s are different states, and only the second is detectable in the browser. Both fall back to a warm placeholder rather than a broken-image icon.

## What is built so far

**Done:** home page, header with announcement bar and mobile drawer, footer, hero with parallax and optional video, USP strip, product cards and grid, the full server data layer, and the design system.

**Not yet built:** `/shop`, `/shop/[slug]`, `/cart`, checkout, `/account` and OTP login, `/recipes`, `/ingredients`, `/journal`, the CMS-backed pages, `/search`, and support.

## Troubleshooting

**The page is blank or nearly empty.** Expected when there is no content. Check the backend is up:

```bash
curl http://localhost:4000/api/v1/settings/public
```

Then run `npm run seed:demo` in the backend repo.

**Images are missing.** Only our own media host is optimised. Check `NEXT_PUBLIC_MEDIA_URL` matches where the backend serves `/uploads`. A warm placeholder block means the URL is absent or returned a 404.

**Build fails with `Unsupported node type "MemberExpression"`.** A route's `export const revalidate` must be a literal — Next analyses it statically and cannot follow `REVALIDATE.catalogue`.

**Animations never finish.** They depend on `requestAnimationFrame` and `IntersectionObserver`. Both are throttled in hidden tabs and in some embedded browser panes; test in a real, foregrounded browser window.

**Port 3001 already in use.** The dev script pins the port so it never collides with the admin app on 3000. Change it in `package.json` if something else owns 3001.
