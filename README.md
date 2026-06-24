# ELD Trip Planner — Frontend

Plan a truck trip from three locations and a cycle-hours value, then see the
route mapped and the **FMCSA daily log sheets drawn on the real 24-hour grid** —
one per day, print-ready as PDF.

- 🗺️ Interactive route map (Leaflet + OpenStreetMap) with Start / Pickup / Dropoff
  + rest/fuel markers
- 📋 Hand-drawn SVG ELD log sheets — header block, duty grid, right-edge totals,
  under-grid city/state remarks
- 🔎 Location autocomplete, live HOS-cycle validation, timezone-aware times
- 🖨️ One-sheet-per-page print / PDF export
- 🔗 Shareable `?trip=<id>` links that restore the full plan (map, sheets, and form)

---

## Table of contents

- [What this is](#what-this-is)
- [Stack](#stack)
- [Quick start](#quick-start)
- [Environment & configuration](#environment--configuration)
- [npm scripts](#npm-scripts)
- [Project structure](#project-structure)
- [How it works (architecture & data flow)](#how-it-works-architecture--data-flow)
- [The API this app expects](#the-api-this-app-expects)
- [Key design decisions & logic](#key-design-decisions--logic)
- [The map: Leaflet vs CARTO vs OpenStreetMap](#the-map-leaflet-vs-carto-vs-openstreetmap)
- [Printing / PDF export](#printing--pdf-export)
- [Deploy (Vercel)](#deploy-vercel)

---

## What this is

The **React frontend** for the ELD Trip Planner. A separate Django + DRF backend
does all the domain work — geocoding, truck routing, and the FMCSA
Hours-of-Service (HOS) simulation. **This app is presentation only:** it collects
four inputs, calls one API, and renders two things accurately and beautifully:

1. A **map** of the route with stop/rest markers.
2. **ELD daily log sheets** drawn on the 24-hour duty grid, one per calendar day.

It never re-implements HOS rules. The backend is the source of truth for
correctness; the frontend's job is **faithful rendering + great UX**. Two things
drive every decision:

- **Accuracy** — render the backend's output exactly (don't round, drop, or
  reorder segments) and make accurate input easy / accurate output unmistakable.
- **Design** — a cohesive, polished, responsive UI that evokes the real paper log.

## Stack

- **React 18 + TypeScript + Vite**
- **Leaflet + react-leaflet** with keyless OpenStreetMap / CARTO tiles
- **Hand-drawn SVG** for the ELD grid (crisp at any zoom, prints cleanly)
- **Tailwind CSS** for styling
- **react-hook-form + zod** for validation that mirrors the API constraints
- **TanStack Query** for the slow POST and the `?trip=<id>` rehydration query

## Quick start

```bash
npm install
cp .env.example .env      # set VITE_API_BASE_URL (defaults to local backend)
npm run dev               # http://localhost:5173
```

Point `VITE_API_BASE_URL` at a running backend (local or hosted) and you're set.
Try the **"Load example"** button in the form for a San Francisco → Sacramento →
Reno trip.

## Environment & configuration

| Var | Example | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000` (local) or `https://<app>.up.railway.app` | Base URL of the backend. Read in `src/api/client.ts`; never hardcoded. |

- Vite inlines any `VITE_*` variable into the bundle at build time; it's accessed
  via `import.meta.env` (typed in `src/vite-env.d.ts`).
- The dev server runs on **port 5173**, already in the backend's CORS allowlist.
  A CORS error in dev is a **backend** env fix (`CORS_ALLOWED_ORIGINS`), not a
  frontend change.
- `.env` is gitignored; `.env.example` is committed as the template.

## npm scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with HMR on `:5173` |
| `npm run build` | Type-check (`tsc -b`) **then** production build to `dist/` |
| `npm run preview` | Serve the built `dist/` locally to sanity-check the build |
| `npm run lint` | `tsc --noEmit` type-check only |

## Project structure

```
.
├── index.html              # entry HTML — loads /src/main.tsx, holds #root
├── vite.config.ts          # Vite + React plugin, dev server on :5173
├── tailwind.config.js      # theme: brand palette, duty colors, fonts
├── postcss.config.js       # Tailwind + autoprefixer pipeline
├── tsconfig*.json           # TS project refs (app code vs. node/build files)
├── vercel.json             # deploy: Vite preset, SPA rewrite
├── .env.example            # VITE_API_BASE_URL template
├── documentation/
│   └── api-contract.md     # the verified backend API contract (source of truth)
├── public/                 # static assets served as-is (favicon.svg)
└── src/
    ├── main.tsx            # React bootstrap: createRoot + QueryClient + StrictMode
    ├── App.tsx             # the only stateful component — orchestrates everything
    ├── index.css           # Tailwind layers, component classes, print stylesheet
    ├── vite-env.d.ts       # types for import.meta.env
    │
    ├── api/                # the contract boundary
    │   ├── types.ts        #   TS types mirroring the API exactly ([lon,lat], int minutes)
    │   ├── client.ts       #   fetch wrapper + ApiError (field-errors vs. `detail`)
    │   └── geocode.ts      #   GET /api/geocode/ autocomplete helper
    │
    ├── lib/                # pure helpers (no React) — the "single source of truth" layer
    │   ├── geo.ts          #   [lon,lat] → Leaflet [lat,lng] swap (centralized footgun #1)
    │   ├── grid.ts         #   minute→x, status→row, status colors (centralized footgun #2)
    │   ├── format.ts       #   minutes→HH:MM, ISO→trip-local time, tz abbreviation
    │   ├── derive.ts       #   fills API gaps: per-day From/To + apportioned miles (est.)
    │   ├── stopPlacement.ts#   reads stops[].coords for rest/fuel markers
    │   └── mapStyle.ts      #   MAP marker palette + route color (separate from duty colors)
    │
    └── components/
        ├── TripForm/       # accurate input
        │   ├── TripForm.tsx          # react-hook-form; re-seeds from a restored trip
        │   ├── schema.ts             # zod schema mirroring API constraints
        │   ├── LocationAutocomplete.tsx  # debounced typeahead, keyboard nav
        │   └── CycleHoursField.tsx   # slider + number, live "remaining of 70"
        ├── RouteMap/       # space
        │   ├── RouteMap.tsx          # Leaflet map: polyline + markers + fit-bounds
        │   ├── markers.ts            # divIcon pins (role-labeled) + dot icons
        │   └── MapLegend.tsx         # the map's OWN legend (route + markers)
        ├── EldSheet/       # time (the core drawing)
        │   ├── EldSheet.tsx          # one day: header + grid + integrity check + detail
        │   ├── EldSheetHeader.tsx    # FMCSA header block (+ editable operator fields)
        │   ├── EldGrid.tsx           # the SVG 24h grid + totals + under-grid remarks
        │   ├── RemarksList.tsx       # numbered duty breakdown (screen-only aid)
        │   └── logMeta.ts            # UI-only operator metadata model
        ├── EldSheetList/   # paginate days; duty-status legend; print page-breaks
        ├── StopsTimeline/  # human-readable Start → stops → Arrive list
        └── ui/             # Header, TripSummary, Legend, ErrorBanner,
                            #   LoadingState, EmptyState, TimezoneNote
```

## How it works (architecture & data flow)

### Boot chain

```
index.html  →  src/main.tsx  →  src/App.tsx  →  all components
```

- **`index.html`** is the real entry point (Vite convention). It holds
  `<div id="root">` and `<script src="/src/main.tsx">`.
- **`main.tsx`** mounts React into `#root` and wraps `<App/>` in `StrictMode` and
  the TanStack Query `QueryClientProvider`. It imports the global CSS and Leaflet's
  CSS once.
- **`App.tsx`** is the **only stateful component**. Everything below it is
  presentational and receives data via props.

### The one path through the app

```
TripForm ──POST /api/trips/──► Trip object ──► App state + ?trip=<id> URL
   │                                              │
   │  (autocomplete: GET /api/geocode/)           ├─► RouteMap      (the map)
   │                                              ├─► StopsTimeline (event list)
   └─ on refresh: ?trip=<id> ─► GET /api/trips/{id}/ ─► EldSheetList ─► EldSheet ─► EldGrid (log sheets)
```

1. The user fills `TripForm` (with geocode autocomplete + zod validation).
2. On submit, `App` fires `POST /api/trips/` via a TanStack Query mutation. While
   it runs (~3–7s cold), a **skeleton** echoes the inputs.
3. The returned `Trip` becomes `App` state and is rendered by `RouteMap`,
   `StopsTimeline`, and `EldSheetList`. `App` also pushes `?trip=<id>` to the URL.
4. On refresh / shared link, `App` reads `?trip=<id>` and **rehydrates** via
   `GET /api/trips/{id}/`, restoring both the results **and** the form inputs. A
   stale/invalid id is cleared from the URL with a one-time notice.

### State ownership

All state lives in `App.tsx`: the active `trip`, the last submitted request (for
the skeleton), a `bannerError`, the hovered stop key (for map↔timeline
cross-highlight), and `logMeta` (UI-only operator fields shared across sheets).
Children are pure props-in components.

## The API this app expects

The app codes against one backend. Base URL comes from `VITE_API_BASE_URL`.
**No auth.** All requests/responses are JSON.

> 📄 **Full contract:** [`documentation/api-contract.md`](documentation/api-contract.md)
> is the complete, verified API reference this frontend is built against — every
> endpoint, the exact request/response field shapes, error formats, the
> coordinate/minute/timezone gotchas, the ELD grid mapping, and the documented
> "known gaps." The summary below is the essentials; that file is the source of
> truth — read it before touching `src/api/types.ts` or any fetch.

### Endpoints used

| Method | Path | Purpose |
|---|---|---|
| `GET`  | `/api/health/`     | Liveness check (drives the header status dot) |
| `GET`  | `/api/geocode/?q=` | Place autocomplete for the location inputs |
| `POST` | `/api/trips/`      | **Plan a trip** → geocode → route → HOS → ELD sheets |
| `GET`  | `/api/trips/{id}/` | Retrieve one trip (same shape as POST) — used to rehydrate `?trip=<id>` |

### Request — `POST /api/trips/`

```json
{
  "current_location": "San Francisco, CA",
  "pickup_location": "Sacramento, CA",
  "dropoff_location": "Reno, NV",
  "current_cycle_used_hours": 0
}
```

Locations are 1–255 chars (any geocodable place). `current_cycle_used_hours` is
`0 ≤ x ≤ 70`. These are validated client-side (`TripForm/schema.ts`) before
submit, so users don't hit a server 400.

### Response — `Trip` (the shape everything renders from)

Top-level: `id`, the three echoed locations, `current_cycle_used_hours`,
`current_coords` / `pickup_coords` / `dropoff_coords` (`[lon, lat]`),
`total_distance_miles`, `total_duration_hours`, `route_geometry` (`[[lon,lat], …]`
polyline), `stops[]`, `timezone` (IANA, e.g. `"America/Los_Angeles"`),
`log_sheets[]`, `created_at`.

- **`stops[]`** — non-driving events (pickup, fuel, breaks, rests, dropoff): each
  has `type`, `status` (`OFF`/`SB`/`ON`), `start`/`end` (tz-aware ISO),
  `coords` (`[lon,lat]` or `null`; pickup/dropoff exact, rests projected onto the
  route by the backend), and `location` (real reverse-geocoded "City, ST").
- **`log_sheets[]`** — one per day, ordered by `day_index`: `date`, `day_index`,
  `totals` (`{OFF, SB, D, ON}`, **sums to 24 on every sheet**), and `segments[]`.
- **`segments[]`** — the drawable duty timeline: `status`, `start_minute` /
  `end_minute` (integer minutes from local midnight, 0–1440), `location`, `note`.
  Segments are contiguous, span the full day, and never cross midnight.

### Errors (two shapes)

- **Field errors** (`400`) — keyed by field name: `{ "pickup_location": ["…"] }`.
  Rendered **inline** next to the input.
- **`detail` error** (`400`) — a single user-friendly string for routing/geocoding
  failures. Rendered as a **dismissible banner**.

`src/api/client.ts` distinguishes them via the `ApiError` class.

### Three gotchas the code handles for you

1. **Coordinates are `[lon, lat]`** (GeoJSON order). Leaflet wants `[lat, lng]` —
   swapped **only** in `lib/geo.ts`.
2. **Segments are integer minutes**, not `HH:MM` — placed via `lib/grid.ts`.
3. **Times are in the trip's zone**, not the viewer's. The grid's `start_minute`
   is day-local; stop ISO timestamps carry the trip's offset. The app renders the
   wall-clock as given and surfaces the zone (e.g. "America/Los_Angeles (PDT)").

### Known API gaps (filled client-side, clearly labeled)

`from_location` / `to_location` come back empty and `total_miles_driving` is
`0.0`. `lib/derive.ts` fills these as **estimates**: per-day From/To from segment
locations + trip endpoints, and miles apportioned by each day's driving hours
(labeled "(est.)"). Stop map positions come straight from `stops[].coords` — no
client-side interpolation.

## Key design decisions & logic

- **Accurate input first.** All three location fields use autocomplete backed by
  the backend's own `GET /api/geocode/` (keyless, single source of truth). Picking
  a resolved place beats an ambiguous free string ("Springfield"). Cycle hours use
  a synced slider + number with a live "remaining of 70".
- **Render the grid exactly.** Segments are drawn from integer minutes with no
  rounding, as a continuous RODS line. Right-edge totals come straight from
  `totals`; the app **asserts every sheet sums to 24h** and flags it loudly if not
  — surfacing data issues rather than hiding them.
- **Two coordinate systems, two legends.** The map is *space*; the ELD grid is
  *time*. The **duty-status legend (OFF/SB/D/ON)** lives only on the grid; the
  **map has its own legend** (route line + Start/Pickup/Dropoff + rest/fuel). Map
  markers use a **separate palette** (`lib/mapStyle.ts`) so a color never means two
  things, and the route line is a single color.
- **Markers labeled by role.** Pins read "Start" / "Pickup" / "Dropoff" (matching
  the legend), not ambiguous letters.
- **Centralized footguns.** `[lon,lat]→[lat,lng]` lives only in `lib/geo.ts`; all
  grid math only in `lib/grid.ts`. Components never inline either.
- **Timezone correctness.** Everything renders in the *trip's* zone, read from the
  ISO offset / `timezone` field — never silently shifted to the browser's zone.
- **Smooth around the slow call.** Skeleton loading state, inline field errors,
  `detail` errors as a banner, and `?trip=<id>` persistence with full rehydration.
- **The official sheet vs. screen aids.** The under-grid city/state callouts are
  the *official* REMARKS (on screen and print). The numbered per-segment list is a
  screen-only reading aid ("Duty status detail"), hidden on print.

## The map: Leaflet vs CARTO vs OpenStreetMap

Three separate layers people often conflate:

- **OpenStreetMap** — the **data** (roads, places, coastlines). The origin of the
  map facts; hence the `© OpenStreetMap contributors` attribution.
- **CARTO** — a **tile renderer/host** that turns OSM data into styled PNG tiles
  (the "Voyager" basemap). Keyless and free. This is the picture under the route.
- **Leaflet** — the **JS library** that displays those tiles and *your* overlays
  (the `route_geometry` polyline and the stop markers) and handles pan/zoom.

The backend supplies the **line and markers**; the base-map imagery comes from
CARTO tiles (OSM data). The only third-party network call the browser makes for
the map is keyless tile images. Swapping the `<TileLayer url>` changes the style
without touching anything else.

## Printing / PDF export

"Print / Export PDF" uses a print stylesheet (`@media print` in `index.css`) so
the PDF is the **official sheet only**:

- Only the ELD sheets print — **one clean card per page** (`break-before: page`),
  never split mid-sheet.
- App chrome (`.no-print`) and the numbered duty breakdown (`.duty-breakdown`) are
  hidden.
- `@page { margin: 0 }` suppresses the browser's default header/footer (date, URL,
  page number) in Chrome/Edge; sheet padding restores breathing room. (Firefox/
  Safari may still need the "Headers and footers" checkbox unticked — the UI hints
  this.)

## Deploy (Vercel)

Framework preset **Vite**; build `npm run build`; output `dist`. Set
`VITE_API_BASE_URL` to the hosted backend URL in **Project → Settings →
Environment Variables**. `vercel.json` already sets the Vite preset and an SPA
rewrite so deep links / `?trip=<id>` refreshes resolve to the app.
