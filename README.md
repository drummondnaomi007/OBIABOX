# OBIABOX: Owner Builder in a Box

Compliance, neighbour notifications, asset protection and dilapidation tracking for owner builders. A Tradies Bureau product, spun off from the [Tradies Bureau](https://github.com/drummondnaomi007/TradiesBureau) marketing site.

This repo is the marketing site and clickable mock-ups. Like Tradies Bureau, it's a plain static site with no build step.

## Structure

```
index.html            Home
features.html         The four tools: compliance, neighbours, asset protection, dilapidation
neighbours.html       How neighbour notifications work
about.html            About + "not legal or building advice"
contact.html          Waitlist (mailto form)
demo/notice.html      Sample printable letterbox notice (with placeholder QR code)
demo/project.html     Sample neighbour page, which is what the QR code opens (demo opt-in form)
css/style.css         Tradies Bureau theme + owner-builder additions (timeline, register, print)
js/main.js            Mobile nav, print button, demo-form handler
assets/               Logo + favicon
```

## Running locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

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
| Notification log | activity, channel (SMS / email / print), sent at, recipient count | — |

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
