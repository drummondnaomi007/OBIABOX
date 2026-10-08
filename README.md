# OBIABOX: Owner Builder in a Box

Compliance, neighbour notifications, asset protection and dilapidation tracking for owner builders. A Tradies Bureau product, spun off from the [Tradies Bureau](https://github.com/drummondnaomi007/TradiesBureau) marketing site.

This repo is the marketing site and clickable mock-ups. Like Tradies Bureau, it's a plain static site with no build step.

## Structure

```
index.html            Home
features.html         The five tools: compliance, neighbours, asset protection, dilapidation, trades/quotes/contracts
neighbours.html       How neighbour notifications work
guides.html           Eight step-by-step owner builder checklists (tick off, saved per device, print one guide)
about.html            About + "not legal or building advice"
contact.html          Waitlist (mailto form)
demo/notice.html      Sample printable letterbox notice (with placeholder QR code)
demo/project.html     Sample neighbour page, which is what the QR code opens (demo opt-in form)
demo/app.html         App mockups: dashboard, notify neighbours, asset protection, dilapidation map, trades register, quote comparison, contract admin, inspection booking, document vault, letterbox drop map, surveyor shared view
css/style.css         Tradies Bureau theme + owner-builder additions (timeline, register, print)
js/main.js            Mobile nav, print button, demo-form handler
js/house.js           Line-drawn house: hero drawing + build tracker that builds across pages (progress kept in localStorage)
js/guides.js          Guides page: ticks saved in localStorage, progress, print a single guide
js/mockups.js         Interactions for demo/app.html (house stage, message chips, photo sketches, street map, award quote, approve variation, inspection booking flow, document vault, letterbox drop map, surveyor view)
assets/               Logo + favicon
tests/                Playwright browser tests (see Testing)
playwright.config.js  Test settings: desktop + phone, local server on port 4173
scripts/serve.js      Local preview server (npm start)
```

## Running locally

You need [Node.js](https://nodejs.org) (the LTS version). On Windows you can also install it with `winget install OpenJS.NodeJS.LTS`.

```bash
npm start
# then open http://localhost:8000  (Ctrl+C to stop)
```

That runs `scripts/serve.js`, a tiny built-in server with nothing to install. It works the same on Windows, Mac and Linux.

No Node? You can also double-click `index.html` to open the site straight in your browser, or use the live site.

## Testing

Browser tests use [Playwright](https://playwright.dev). They start a local server for you, open every page at desktop and phone widths, and click through the house tracker, the guides, the demo pages and every app mockup.

One-time setup (needs Node.js 18 or newer):

```bash
npm install
npx playwright install chromium
```

Run the tests:

```bash
npm test                 # everything, desktop + phone
npm run test:headed      # watch it click through in a real browser window
npx playwright test tests/guides.spec.js   # just one file
npm run test:report      # open the last HTML report (after a CI-style run)
```

| File | What it checks |
|---|---|
| `tests/layout.spec.js` | Every page loads with no errors, fits the screen with no sideways scroll, menu works, no broken internal links (desktop and phone) |
| `tests/house.spec.js` | Hero house, tracker stages, building across pages, handover and Build again, reduced motion |
| `tests/guides.spec.js` | Eight guides, ticks saved after reload, Clear ticks, printing one guide |
| `tests/demo-pages.spec.js` | Letterbox notice print layout, neighbour sign-up demo message |
| `tests/mockups.spec.js` | All 11 app mockups: chips, map, quotes, variations, inspection booking, vault, letterbox drop, surveyor view |

GitHub Actions runs the same tests on every push to `main` and on pull requests (`.github/workflows/tests.yml`). If a run fails, the screenshots and traces are attached to the run as `playwright-report`.

When you change the site, update or add a test next to the feature you touched. Tests find things by the `data-*` attributes in the HTML, so keep those when restyling.

## Deploying

GitHub Pages from `main`, root folder. For now it's served at **https://drummondnaomi007.github.io/OBIABOX/** for testing.

When a domain is ready, add a `CNAME` file containing just the domain (e.g. `obiab.tradiesbureau.com`), add a DNS CNAME record pointing that host at `drummondnaomi007.github.io`, then tick **Enforce HTTPS** under Settings → Pages once the certificate is issued.

## Branding

Same layout and components as Tradies Bureau, different colours so the two are easy to tell apart:

| | Tradies Bureau | Owner Builder in a Box |
|---|---|---|
| Primary (header, buttons) | Teal `#0B6E8F` | Burnt orange `#C2410C` |
| Dark (headings, footer) | Navy `#1A365D` | Charcoal `#1F2933` |
| Tint (backgrounds) | Pale blue `#E8F1F6` | Warm cream `#FFF3EA` |
| Logo | Layered hammers | House in an open box |

Colours live as CSS variables at the top of `css/style.css` (`--brand-*`, `--ink-*`).

## Product outline (for the app build)

The app reuses the Tradies Bureau Compliance Tracker pattern: **an item with dates, a document, and reminders**. Owner Builder in a Box adds one new concept: **people outside the project, the neighbours**.

### Core records

| Record | Key fields | Reminders |
|---|---|---|
| Project | address, council, state, project type, site hours, key dates | — |
| Compliance item | type (Certificate of Consent, White Card, building permit, planning permit, insurance, inspection stage), number, issued, expires, document | before expiry; book inspection before the next stage starts |
| Asset protection permit | council, permit no., bond amount, bond receipt, conditions, before photos, after photos, final inspection date, refund received | take before photos before works start; book final inspection; chase refund |
| Neighbour property | address, relationship (adjoining / opposite / rear), contact (opt-in only) | — |
| Dilapidation report | neighbour property, pre-works report (date, author, PDF), copy given to neighbour, access refused note, post-works report | pre-works report before demolition or excavation; post-works report at handover |
| Activity | date/time window, description, disruption type (noise, trucks, road/footpath closure, crane) | notify subscribers X days before |
| Letterbox drop | area (next door / block / wider), houses in the drop, dropped (per house, timestamped), QR sign-ups | finish a partial drop |
| Notification log | activity, channel (SMS / email / print), sent at, recipient count | — |
| Trade | business, trade type, licence/registration, public liability, WorkCover, ABN, Tradies Bureau link (optional) | before any document lapses; block start if missing |
| Tender package | trade type, plans/scope documents, invited trades, closing date | quotes due |
| Quote | trade, price, inclusions, exclusions, start date, duration, valid until | before quote expires |
| Contract | trade, accepted quote, signed contract, contract sum, payment schedule (each stage optionally waits for an inspection) | payment due when linked inspection passes |
| Variation | contract, description, cost, photos, requested by, approved in writing (date) | approve before work starts |
| Inspection | stage (from the building permit), readiness checklist, documents shared with the surveyor, booked time, who's on site, result (passed / defects), defects list | book before work is covered; hold covering trades; release linked payment on pass |
| Document | file, folder (approvals, insurance, trades & contracts, inspections, end-of-job certificates, neighbours & council, plans), linked trade/stage/neighbour, dates, expiry, version (current / superseded), needed for handover | before expiry; chase missing handover documents |
| Share link | folders shared, recipient (e.g. building surveyor), read-only, expiry | link expiry |
| End-of-job certificate | trade, type (plumbing compliance, electrical safety, waterproofing), document | collect before final payment |

### Neighbour notification flow

1. Owner sets up the project and key dates.
2. App makes a printable letterbox notice with a QR code that's unique to the project.
3. QR code opens a public project page with upcoming activity, contact details and an **opt-in** form (SMS or email).
4. Owner posts an activity, subscribers are notified, and a printable version is made for paper-only neighbours.
5. Every send is logged with a timestamp and recipient count, as evidence of notice if a complaint is made.

Privacy: opt-in only, unsubscribe link in every message, used for this build only, never shared. Check Spam Act and Privacy Act obligations before launch.

### Open questions

- Council-specific asset protection rules: start with an editable checklist, add council templates over time.
- Protection work notices for adjoining property (Vic): track against the neighbour record. Confirm the workflow with a building surveyor.
- Link to Tradies Bureau so trades can share verified licence/insurance status with an owner builder.
- Partners: building surveyors (e.g. owner-builder specialists), owner-builder platforms, course providers.

This content isn't legal or building advice. Requirements vary by state and council.
