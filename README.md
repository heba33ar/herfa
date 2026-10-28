# حِرفة · Hirfa

A marketplace for women's home-based businesses in the Negev — built from the
Hirfa Product Requirements Document and project deck.

The platform brings scattered WhatsApp/Instagram selling into one organised
market: buyers discover and order from local projects, sellers get a storefront,
an order pipeline and simple finance tracking, and the Hirfa team gets an admin
console for onboarding, moderation and reporting.

**Interface language:** Arabic (RTL) by default, with Hebrew and English
built in and switchable from the header.

---

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) · React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 with a custom token layer |
| State | Zustand + `persist` (localStorage) |
| Icons | lucide-react |
| Type | `IBM Plex Sans Arabic` via `next/font` |

## Running it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npx eslint .    # lint
```

## Demo accounts

Pick one from the buttons on `/login`, or sign in with the password `hirfa2026`:

| Account | Email | Reaches |
|---|---|---|
| Buyer | `buyer@hirfa.app` | `/account` — orders, favourites, reviews |
| Seller | `seller@hirfa.app` | `/seller` — store, orders, finances |
| Admin | `admin@hirfa.app` | `/admin` — applications, stores, reports, outbox |

One account can hold several roles at once, as the PRD requires — the seller
account is also a buyer, and the admin is too.

One account per portal, which is all the prototype needs. The other eleven
storefronts are catalogue content — they display and can be ordered from, but
nobody signs in as them.

These are fixtures in a public repo, not secrets. Replace them before any real
deployment.

## What is implemented

**Buyer** — browsing without an account, search with category/town/price/
delivery filters and sorting, store pages with reviews and working hours,
product pages with options and three pricing modes, a single-store cart,
checkout, order tracking with a status timeline, favourites, reviews on
completed orders only, issue reporting, profile with separable marketing
consent, and account deletion.

**Seller** — application form with a documented review pipeline, dashboard,
order board (accept / reject with a required reason / advance status / record
payment / internal notes), product and service management with availability and
visibility toggles, store settings (identity, imagery, delivery methods,
working hours, pause orders, shareable link), finances (recorded sales vs money
actually collected, manual expenses, monthly filter, CSV export), community
board, shared delivery network with consent-gated contact details, and business
development guides and workshops.

**Admin** — overview with reach and sales metrics shown separately, application
queue with mandatory decision notes, store management (feature, verify, suspend
with a reason), order register with CSV export, users and the roles matrix,
reports queue for tickets and reported reviews, and an audit log.

## Decisions worth knowing

A few rules from the PRD are enforced in code rather than left to the UI:

- **An order is a sale only when the seller confirms completion.** Nothing
  advances to `completed` on its own, and a WhatsApp-originated order is marked
  as a referral until the seller records the outcome.
- **Recorded sales ≠ money collected.** Both figures are shown side by side,
  and payment state is set per order by the seller.
- **Registered buyers ≠ active buyers**, and a WhatsApp click is not a sale.
  The admin dashboard shows these as separate metrics by design.
- **One cart holds one store.** Mixing stores creates separate orders, because
  preparation and delivery differ per seller.
- **Store data is isolated.** A seller only ever reads her own store, orders,
  customers and revenue.
- **Prices are never invented.** A product priced on request renders as such,
  with a quote button instead of an order button; an unrated store shows "no
  rating yet" rather than an empty star row.
- **Reviews require a completed order**, and admins can hide a review that
  breaches the terms — not one that is merely negative.
- **Every decision is documented.** Rejections, suspensions and application
  outcomes all require a reason, written to the audit log.

## Data layer

The app is **half server-backed**, and the split is deliberate.

**Server-side** — accounts, sessions and the email outbox live in a single JSON
document behind `src/lib/server/`. Passwords are scrypt hashes, sessions are
httpOnly cookies, and every API route under `src/app/api/` reads and writes
through one small `writeDb()` transaction helper.

Where that JSON document lives is chosen at runtime:

| Driver | When | Writes survive |
|---|---|---|
| `file` | locally — `data/db.json`, seeded from the committed `data/db.seed.json` | yes |
| `blob` | when `BLOB_READ_WRITE_TOKEN` is set — the same document in Vercel Blob | yes |
| `memory` | last resort, when neither can be written | **no** |

A Blob store (`herfa-db`) is provisioned and connected, so the deployed demo
keeps what people create. `BLOB_READ_WRITE_TOKEN` is set for production,
preview and development; `vercel env pull` brings it into `.env.local`.

The document is namespaced by environment — `herfa/db.json` in production,
`herfa/db.local.json` when you run it locally — because every environment
shares one store, and without that your local runs would be editing the live
demo's data.

If the token is ever missing, the app falls back to a local file and then to
memory. That fallback is not silent: `/api/status` performs a real write probe
and the admin dashboard shows a warning when storage is not durable.

**Resetting the demo accounts** (the footer button only resets the client-side
catalogue):

```bash
vercel blob put data/db.seed.json --pathname herfa/db.json --access private --force --content-type application/json
```

It takes effect within a couple of seconds — instances hold the document for
no longer than that.

**Client-side** — stores, products, orders, expenses, reviews, announcements
and the delivery network remain in the Zustand store (`src/lib/store/`),
persisted to localStorage per device. "Reset demo data" in the footer restores
that half; it leaves accounts alone, because they are on the server.

The shapes in `src/lib/types.ts` mirror the entity table in the PRD, so moving
the remaining half to a real database means implementing those tables and
swapping the store's actions for API calls — the components do not change.

## Email

Every message is written to an outbox in the database and shown at
`/admin/emails`. Nothing is transmitted — the prototype runs in outbox mode on
purpose, so the whole flow is demonstrable without anyone signing up for a mail
provider or verifying a domain.

Six messages are wired to real events: a welcome on registration, an invite
when an admin creates an account, a notice to the seller when an order arrives,
a notice to the buyer on every status change, a notice to the admins when
someone applies to sell, and the decision when that application is answered.

Turning on real delivery later is one environment variable and no code change:
set `RESEND_API_KEY` and `EMAIL_FROM` (see `.env.example`). Be aware that every
provider requires either a verified domain or a verified sender address before
it will deliver to arbitrary recipients — that is a decision for whoever owns
the project's domain, not something this prototype assumes.

Temporary passwords are masked in the stored copy, so the outbox never becomes
a readable password list.

## Not built yet

Real file uploads for seller photos, WhatsApp notifications, a payment
integration, and the AI shopping assistant from the PRD's "advanced stage".
Security work explicitly deferred for this POC: CSRF tokens, rate limiting,
session rotation, and the password-less `/api/auth/demo` route that signs in
the three demo accounts for the client walkthrough.

## Layout

```
src/
  app/                 routes — public, /account, /seller, /admin
  components/
    ui/                buttons, fields, cards, modal, toasts, tabs
    layout/            shell, header, footer, guards, logo
    commerce/          product card, store card, status badges, timeline
    seller/            console shell
  lib/
    types.ts           domain model
    data/              seed content, towns, categories
    store/             zustand store, selectors, hooks
    i18n/              ar / he / en dictionary
    format.ts          prices, dates, weekdays per locale
public/img/            generated placeholder imagery
```

## Design

Brand colours are taken from the project deck: plum `#7A3350`, terracotta
`#C2784F`, gold `#E0A458`, over a warm sand paper. The interface is deliberately
editorial — hairline rules, tight radii, numbered sections and a Negev diamond
motif — rather than the soft-shadow card template the prototype used.

Imagery in `public/img` is generated SVG, on-brand and obviously placeholder;
it is there so layouts read correctly until real product photography exists.
