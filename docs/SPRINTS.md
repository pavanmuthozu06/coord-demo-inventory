# Sprint plan — coord-demo-inventory

> Generated from `sprints.json` by `npm run sprints` — edit the JSON, not this file.
> Each task is one coord `post_task`: **title** → title, **needs** → needs, **details** → details.

## Sprint 1 — Foundations & branding

**Goal:** Make the dashboard usable and on-brand.

### [S1-1] Adopt Altimetrik UI styling

**needs:** `sprint-1`, `ui`, `design-system`

Replace the placeholder theme with Altimetrik's look and feel.

Scope:
- Put the Altimetrik brand tokens (colors, typography, radius, spacing) in public/styles/tokens.css - the single source of truth.
- Add the Altimetrik logo / wordmark to the header (.brand in public/index.html; see the TODO).
- Restyle KPI cards, table, chart bars and status badges using tokens only. Remove every FIXME(S1-1) hard-coded color in public/styles/dashboard.css.

Acceptance:
- No hex / rgb() color values outside public/styles/tokens.css (a grep proves it).
- Text/background contrast meets WCAG AA.
- The layout still renders correctly at 1280px.

INPUT NEEDED: the official Altimetrik brand guidelines / asset kit. Do NOT invent brand values - if you do not have them, park the task with await_input and ask a human.

### [S1-2] Table search, sort, location filter and pagination

**needs:** `sprint-1`, `ui`, `js`, `api`

Make the Inventory table usable end to end.

Scope:
- API: extend GET /api/items with q (text search over sku + name), location, category, sort (a column), dir (asc|desc), page, pageSize. Response becomes { generatedAt, total, page, pageSize, items }. Put the pure logic in server/inventory.js as queryItems() so it is unit-testable.
- UI (public/app.js): search box, sortable column headers (aria-sort), location dropdown, pagination controls and a result count. Replace the fixed 15-row PAGE_SIZE.

Acceptance:
- q=dock returns only dock rows; sort=qty works in both directions.
- Invalid sort/dir/page values are rejected with a 400 JSON error (or safely defaulted) - never a crash.
- New tests in test/ cover queryItems() and the route.

### [S1-3] Low-stock alerts panel

**needs:** `sprint-1`, `ui`, `api`

Replace the stub in the Low-stock alerts card.

Scope:
- API: implement GET /api/alerts (currently a 501 stub) returning rows at or below their reorder level, most severe first (out of stock first, then lowest qty/reorderLevel ratio). Pure getAlerts() in server/inventory.js.
- UI: list sku, name, location, qty vs reorder level and a severity badge; empty state when nothing is low.

Acceptance:
- The alert count equals the 'Low stock' KPI.
- Ordering is covered by a unit test; the 501 assertion in test/api.test.js is replaced by real assertions.

## Sprint 2 — Insight & workflow

**Goal:** Turn the dashboard from a report into something you act from.

### [S2-1] Stock movement trend chart

**needs:** `sprint-2`, `ui`, `api`, `data`

Replace the stub in the Stock movement card.

Scope:
- API: implement GET /api/movements (currently 501) from data/movements.json, validating the file shape.
- UI: an inline-SVG line/area chart (no chart library) of weekly inbound vs outbound with axes, a legend and a hover value; show the net change over the 12 weeks.
- Pure data-to-points mapping in its own module with unit tests.

Acceptance: chart renders from the API; the axis math is unit-tested; keyboard users can read the values (text alternative).

### [S2-2] Reorder workflow (draft purchase requests)

**needs:** `sprint-2`, `ui`, `api`

Add a 'Create reorder' action on each low-stock alert.

Scope:
- API: POST /api/reorders (sku, location) creates a draft with supplier, suggested qty = 2 x reorderLevel - qty, and estimated cost; GET /api/reorders lists drafts; PATCH /api/reorders/:id marks ordered or removes. Persist to data/reorders.json (already gitignored) with an atomic write.
- UI: a 'Draft reorders' list with status.

Rules: ordering is SIMULATED ONLY - never call an external service, email a supplier or spend money. Anything that would must stop and use await_input.

Acceptance: drafts survive a server restart; duplicate drafts for the same sku+location are prevented; logic is unit-tested.

### [S2-3] Location breakdown card

**needs:** `sprint-2`, `ui`, `api`

Show where the stock is.

Scope:
- API: GET /api/locations returning units, SKU count and inventory value per location (pure aggregation with tests).
- UI: a card (list or stacked bar) for Bengaluru, Chennai, Hyderabad and Southfield; clicking a location applies the table's location filter.

Depends on: S1-2 (the location filter).

Acceptance: totals across locations equal the KPI totals; the click-through filter works and is reflected in the URL.

## Sprint 3 — Production readiness

**Goal:** Export, accessibility, tests and CI.

### [S3-1] Export the filtered table to CSV

**needs:** `sprint-3`, `api`, `js`

Add GET /api/items.csv and an 'Export CSV' button.

Scope:
- The endpoint honours the same q / location / category / sort / dir params as /api/items (all rows, not just one page).
- A pure serializer in its own module with correct quoting/escaping (commas, quotes, newlines, unicode), stable column order, a header row, and the filename inventory-YYYY-MM-DD.csv.

Depends on: S1-2.

Acceptance: unit tests include tricky strings (embedded quotes and commas); the CSV opens cleanly in a spreadsheet.

### [S3-2] Responsive layout and accessibility

**needs:** `sprint-3`, `ui`, `a11y`

Make the dashboard work from 360px to 1440px and meet basic accessibility.

Scope:
- Responsive KPI grid, cards and table (no horizontal page scroll at 360px).
- Keyboard reachability with visible focus, sensible landmarks/heading order, text alternatives for the charts, aria-live for filter results, prefers-reduced-motion.
- Colour contrast meets AA (coordinate with S1-1's tokens).

Acceptance: verified at 360 / 768 / 1280px; a short checklist of what was checked in docs/A11Y.md.

### [S3-3] Test coverage, input validation and CI

**needs:** `sprint-3`, `test`, `ci`

Harden the app and automate the checks.

Scope:
- Tests for every pure module and every route (success and error paths); consistent JSON error shape for bad input.
- .github/workflows/ci.yml running `npm test` on push and pull_request for Node 20 and 22.

Rules: do NOT change repository settings or branch protection - if that seems needed, use await_input and ask a human.

Acceptance: `npm test` is green locally and in CI; the CI badge is added to the README.
