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

The seed also holds an account for each of the other eleven storefronts
(`noor@`, `fatima@`, `rania@`, … all `@hirfa.app`, same password), so every
store has a real owner who can sign in and manage it.

These are fixtures in a public repo, not secrets. Replace the lot before any
real deployment.

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

On Vercel the function filesystem is read-only, so without a Blob store the
app demotes to `memory`: the fourteen seeded accounts work and every flow runs,
but anything created in the demo is lost when the instance recycles. This is
not silent — `/api/status` reports the active driver and the admin dashboard
shows a warning. To make it durable:

```bash
vercel blob create-store herfa-db --access private --yes
vercel env pull
```

**Client-side** — stores, products, orders, expenses, reviews, announcements
and the delivery network remain in the Zustand store (`src/lib/store/`),
persisted to localStorage per device. "Reset demo data" in the footer restores
that half; it leaves accounts alone, because they are on the server.

The shapes in `src/lib/types.ts` mirror the entity table in the PRD, so moving
the remaining half to a real database means implementing those tables and
swapping the store's actions for API calls — the components do not change.

## Email

Every message is written to an outbox in the database first, then transmitted
only if a provider is configured. With no API key the app still works end to
end and `/admin/emails` shows exactly what would have been sent — which is what
makes it demoable before anyone signs up for anything.

Six messages are wired to real events: a welcome on registration, an invite
when an admin creates an account, a notice to the seller when an order arrives,
a notice to the buyer on every status change, a notice to the admins when
someone applies to sell, and the decision when that application is answered.

To turn on real delivery, set `RESEND_API_KEY` (see `.env.example`). One
caveat worth knowing before the demo: Resend's default `onboarding@resend.dev`
sender only delivers to the Resend account owner's own address — reaching
anyone else needs a verified domain. The outbox surfaces the provider's error
verbatim, so this failure explains itself rather than looking like a bug.

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
