# API Contract — ELD Trip Planner

The contract this React app codes against — the **actual JSON shape the backend
returns**, captured from live responses. Treat this file as the source of truth for
request/response shapes; build the TypeScript types to match it exactly.

---

## Base URL & environment

| Env | Base URL |
|---|---|
| Local dev | `http://127.0.0.1:8000` |
| Production | the deployed backend URL (e.g. on Railway) |

- Put the base URL in a FE env var (`VITE_API_BASE_URL`). Never hardcode it.
- **No authentication.** No tokens, no cookies, no CSRF for these read/create calls.
- **Content type:** send `Content-Type: application/json`; responses are JSON.
- All paths below are under the base URL.

### CORS (why your fetch may fail in dev)

The backend only allows browser calls from origins on its allow-list (the common dev
servers — `localhost:5173`, `127.0.0.1:5173`, `localhost:3000` — are included by
default). If your dev server runs on a different origin, it must be added to the
**backend's** CORS config. A CORS error is a backend-config fix, not a frontend one.

---

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET`  | `/api/health/`        | Liveness check |
| `GET`  | `/api/geocode/`       | **Place autocomplete** — suggestions for the location inputs |
| `POST` | `/api/trips/`         | **Plan a trip** — geocode → route → HOS → ELD sheets |
| `GET`  | `/api/trips/`         | List previously planned trips |
| `GET`  | `/api/trips/{id}/`    | Retrieve one trip — **same shape as the POST `201`** |

> **`GET /api/trips/{id}/` returns the identical Trip object to the POST response.**
> Use it to **hydrate from a `?trip=<id>` URL on load/refresh**: read the id, fetch
> the trip, and render exactly as you would from a fresh POST — *and re-seed the form
> fields from the echoed `current_location`/`pickup_location`/`dropoff_location`/
> `current_cycle_used_hours`*. Without this, a refresh or shared link is a blank page.

`POST /api/trips/` is the workhorse. It makes **live geocoding + routing + per-stop
reverse-geocoding network calls** (run **concurrently** server-side), so a **fresh**
plan is **~3–7s**; **repeated/popular trips are near-instant** (the backend caches
geocoding & routing). It can fail on bad input or upstream outages — design the UI
around the cold latency (loading state).

---

## `GET /api/health/`

`200 OK`
```json
{ "status": "ok", "service": "eld-trip-planner-backend" }
```
Use it for a connectivity check / status indicator.

---

## `GET /api/geocode/` — place autocomplete

Powers the typeahead on the three location inputs. Call it as the user types
(debounced) and show the results in a dropdown; when the user picks one, put its
`label` into the field. **The backend proxies a geocoder for you** — the frontend
needs no geocoding API key and no second provider.

**Results are country-restricted** (default: **US**, configured server-side) so users
can only pick places that are actually routable for a US HOS trip — e.g. a query that
only matches abroad returns `[]`. You don't pass anything for this; it's enforced
server-side.

### Request

```
GET /api/geocode/?q=San%20Fran&limit=5
```

| Query param | Type | Default | Notes |
|---|---|---|---|
| `q` | string | — | The text typed so far. **Queries shorter than 2 chars return `[]`** (no upstream call). |
| `limit` | int | 5 | Max suggestions. Capped server-side at **10**. |

### Success — `200 OK`

```json
{
  "results": [
    { "label": "San Francisco, CA, USA",        "coords": [-122.431272, 37.778008] },
    { "label": "San Francisco County, CA, USA", "coords": [-122.4425, 37.77823] }
  ]
}
```

| Field | Type | Meaning |
|---|---|---|
| `results` | array | Ordered best-match first; **may be empty** (short query or no matches) — that's `200`, not an error. |
| `results[].label` | string | Human-readable place name. **Put this string into the location field** and submit it as-is to `POST /api/trips/`. |
| `results[].coords` | `[lon, lat]` | The resolved point (**lon-first**). Optional for you — handy to preview a pin; you don't need to send it back. |

### Errors

A short/empty `q` is **not** an error — it returns `{"results": []}` with `200`, so
you can call on every keystroke. An upstream geocoder failure returns a `400` with a
`detail` string; for a typeahead, treat that as "no suggestions right now" (show
nothing) — the user can still type a free-form string and submit it.

### How it fits the flow

The `label` you submit is re-geocoded authoritatively by `POST /api/trips/`, so the
**backend stays the single source of truth** — autocomplete just helps the user land
on an unambiguous place string. You never reconcile two geocoders.

---

## `POST /api/trips/` — plan a trip

### Request body

```json
{
  "current_location": "San Francisco, CA",
  "pickup_location": "Sacramento, CA",
  "dropoff_location": "Reno, NV",
  "current_cycle_used_hours": 0
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `current_location` | string | yes | 1–255 chars. Any geocodable place ("City, ST", address, landmark). |
| `pickup_location` | string | yes | 1–255 chars. |
| `dropoff_location` | string | yes | 1–255 chars. |
| `current_cycle_used_hours` | number | yes | **0 ≤ x ≤ 70** (hours already used in the 70hr/8day cycle). |

Validate client-side before submitting (required + the 0–70 range) — it's the single
biggest lever on output accuracy and avoids a round-trip `400`.

### Success — `201 Created`

The full planned trip. Real example (geometry truncated; it is typically
hundreds–thousands of points):

```json
{
  "id": 4,
  "current_location": "San Francisco, CA",
  "pickup_location": "Sacramento, CA",
  "dropoff_location": "Reno, NV",
  "current_cycle_used_hours": 0.0,

  "current_coords":  [-122.431272, 37.778008],
  "pickup_coords":   [-121.466786, 38.578730],
  "dropoff_coords":  [-119.806347, 39.530395],

  "total_distance_miles": 222.3,
  "total_duration_hours": 5.68,
  "route_geometry": [[-122.431166, 37.778022], [-122.431132, 37.77786], "…", [-119.806183, 39.529756]],

  "stops": [
    { "type": "Pickup (loading)",   "status": "ON", "coords": [-121.466786, 38.578730], "start": "2026-06-23T10:30:26.900000-07:00", "end": "2026-06-23T11:30:26.900000-07:00", "location": "Sacramento, CA" },
    { "type": "Dropoff (unloading)","status": "ON", "coords": [-119.806347, 39.530395], "start": "2026-06-23T14:40:58.600000-07:00", "end": "2026-06-23T15:40:58.600000-07:00", "location": "Reno, NV" }
  ],
  "timezone": "America/Los_Angeles",

  "log_sheets": [
    {
      "date": "2026-06-23",
      "day_index": 0,
      "from_location": "",
      "to_location": "",
      "total_miles_driving": 0.0,
      "totals": { "OFF": 16.33, "SB": 0.0, "D": 5.67, "ON": 2.0 },
      "segments": [
        { "status": "OFF", "start_minute": 0,    "end_minute": 510,  "location": "",                    "note": "Off duty" },
        { "status": "D",   "start_minute": 510,  "end_minute": 660,  "location": "En route to pickup",  "note": "Driving" },
        { "status": "ON",  "start_minute": 660,  "end_minute": 720,  "location": "Sacramento, CA",      "note": "Pickup (loading)" },
        { "status": "D",   "start_minute": 720,  "end_minute": 910,  "location": "En route to dropoff", "note": "Driving" },
        { "status": "ON",  "start_minute": 910,  "end_minute": 970,  "location": "Reno, NV",            "note": "Dropoff (unloading)" },
        { "status": "OFF", "start_minute": 970,  "end_minute": 1440, "location": "",                    "note": "Off duty" }
      ]
    }
  ],
  "created_at": "2026-06-23T04:25:12.789568Z"
}
```

### Field reference

**Trip (top level)**

| Field | Type | Meaning |
|---|---|---|
| `id` | int | Trip id; use in `GET /api/trips/{id}/`. |
| `current_location` / `pickup_location` / `dropoff_location` | string | Echo of the inputs — **use these to re-seed the form on hydration**. |
| `current_cycle_used_hours` | float | Echo of input. |
| `current_coords` / `pickup_coords` / `dropoff_coords` | `[lon, lat]` | Geocoded coordinates. **⚠ lon-first** (see gotcha). |
| `total_distance_miles` | float | Whole-route driving distance (current→pickup→dropoff). |
| `total_duration_hours` | float | Pure driving time estimate (excludes stops/rests). |
| `route_geometry` | `[[lon, lat], …]` | Polyline for the map. **⚠ lon-first.** |
| `stops` | array | Non-driving events for map markers (see below). |
| `timezone` | string | **IANA zone of the trip** (the current location's zone, e.g. `"America/Denver"`). All log/stop times are in it. **Show it in the UI.** |
| `log_sheets` | array | One ELD sheet per calendar day, ordered by `day_index`. |
| `created_at` | ISO datetime | When the trip was planned (UTC metadata). |

**`stops[]`** — every non-driving event (pickup, fuel, breaks, rests, restart, dropoff):

| Field | Type | Meaning |
|---|---|---|
| `type` | string | Human label (e.g. `"Pickup (loading)"`, `"Fueling"`, `"30-min break"`, `"10-hour reset"`, `"34-hour restart"`, `"Dropoff (unloading)"`). |
| `status` | enum | `OFF` / `SB` / `ON` (never `D` — stops are non-driving). |
| `coords` | `[lon, lat]` or `null` | **Map position** (**lon-first**). Pickup/dropoff exact; rests/fuel/breaks projected onto the route server-side. `null` only if geometry was unavailable. **Drop markers straight from this — no interpolation needed.** |
| `start` / `end` | ISO datetime (tz-aware, trip's local zone) | Absolute timestamps. |
| `location` | string | Real **"City, ST"** (reverse-geocoded; may be `"County, ST"` for unincorporated spots; a generic label like `"Rest area"` only if reverse-geocoding failed). |

**`log_sheets[]`** — one per day:

| Field | Type | Meaning |
|---|---|---|
| `date` | `YYYY-MM-DD` | Calendar day of the sheet (see date convention below). |
| `day_index` | int | 0-based day number — the **stable** day identifier. |
| `from_location` / `to_location` | string | **Currently empty `""`** — see Known Gaps. |
| `total_miles_driving` | float | **Currently `0.0`** — see Known Gaps. |
| `totals` | object | Hours per status `{ "OFF", "SB", "D", "ON" }`. **Sums to 24 on every sheet** (off-duty-padded). |
| `segments` | array | Duty-status spans for the grid (see below). |

> **Time zone — everything is in the trip's local zone, and you must surface it.**
> Times are in the local zone of the **current location**, returned explicitly as the
> trip's **`timezone`** field (IANA name) and held constant for the whole trip —
> mirroring a driver's fixed home-terminal time. So `stops[].start/end` carry that
> zone's offset (e.g. `-07:00`), **not** UTC, and the grid minutes are local. Render
> the minute fields and offsets as given — don't convert.
>
> **Show the zone in the UI** so the user knows these are the **driver's local
> (location) time**, not their own — e.g. *"Times shown in the driver's local time —
> America/Denver (MDT)."* Get the abbreviation from the browser:
> ```js
> new Intl.DateTimeFormat("en-US", { timeZone: trip.timezone, timeZoneName: "short" })
>   .formatToParts(new Date(stop.start)).find(p => p.type === "timeZoneName").value  // "MDT"
> ```
> Format stop/segment times *in that zone* (same `timeZone` option) so they don't
> shift to the viewer's local zone.

> **Date convention — lead with the day number, not the clock.** The trip starts
> **"now" in that local zone** (the moment the driver goes on duty — no fixed shift
> start), so `day_index: 0` is the start day and each later sheet is the next calendar
> date. Every sheet is a **full 24h**: time before the driver goes on duty and after
> the final duty status is padded with off-duty, so day 0 opens with `OFF` from
> midnight to the start time — not a stunted partial day. Frame the UI as
> **"Day 1 · Tue, Jun 23, 2026"** (`day_index + 1` primary, `date` secondary). Treat
> `day_index` as the sheet's identity; `date` shifts if the same trip is planned later.

**`segments[]`** — the drawable timeline (what you render on the grid):

| Field | Type | Meaning |
|---|---|---|
| `status` | enum | `OFF` / `SB` / `D` / `ON` → grid rows 1–4 (see grid mapping). |
| `start_minute` | int | **Minutes from local midnight, 0–1440.** |
| `end_minute` | int | Minutes from local midnight, 0–1440. `start < end`. |
| `location` | string | Where this span happened / began. |
| `note` | string | Label (`"Driving"`, `"30-min break"`, `"Fueling"`, `"Pickup (loading)"`, …). Use for the remarks. |

Segments within a sheet are **contiguous, span the full day (0 → 1440), and never
cross midnight**. The backend splits any span over midnight across two sheets and pads
the edges with `OFF` (`note: "Off duty"`) — so you can draw the RODS line straight
from 00:00 to 24:00 with no gaps.

### Errors

**`400` — validation** (bad/missing input). Field-error shape, keyed by field name:
```json
{
  "current_cycle_used_hours": ["Ensure this value is less than or equal to 70."],
  "pickup_location": ["This field is required."]
}
```

**`400` — routing/geocoding failure** (place not found, no drivable route). Single
`detail` string, already **user-friendly** — safe to show as-is:
```json
{ "detail": "We couldn't find a location matching “Atlantis”. Check the spelling, or try a more specific place like “City, State”." }
```
```json
{ "detail": "We couldn't find a drivable route between those locations. Make sure each one is reachable by road — they can't be separated by water or on different continents." }
```
Upstream failures always surface as **4xx, never 500**. Your handler should render
field errors inline next to inputs, and a `detail` string as a top-level banner/toast.
Distinguish them by checking for a `detail` key vs. field keys.

---

## ⚠ Gotchas (read before coding the map/grid)

### 1. Coordinates are `[longitude, latitude]` (lon-first)
`current_coords`, `pickup_coords`, `dropoff_coords`, `stops[].coords`, and every point
in `route_geometry` are GeoJSON order **`[lon, lat]`**.

- **Leaflet** expects `[lat, lng]` → you **must swap**: `[p[1], p[0]]`.
- **Mapbox GL JS** expects `[lng, lat]` → use as-is.

This is the #1 source of "my route is in the ocean" bugs. Centralize the swap in one
helper.

### 2. Segments are integer minutes, not `HH:MM`
`start_minute`/`end_minute` are **integers (0–1440)**, not `"07:00"` strings. Convert
for display: `hh = Math.floor(m / 60)`, `mm = m % 60`.

### 3. Times are in the trip's local zone; the grid is "minutes from local midnight"
`stops[].start/end` are tz-aware ISO timestamps in the **trip's local zone** (offset
like `-07:00`, not UTC). The grid coordinates (`start_minute`) are already day-local in
that same zone — **don't** re-derive them from the ISO timestamps; use the minute
fields directly. (`created_at` is the exception — UTC metadata, not part of the log.)

---

## ELD grid mapping (segments → the drawing)

The grid is **24 hours wide × 4 rows tall**. Each hour has 4 fifteen-minute ticks →
**96 columns** of resolution; `start_minute/end_minute` give exact placement, no rounding.

**X axis (time):** `x = (minute / 1440) * gridWidth`. A segment is a horizontal line
in its row from `start_minute` to `end_minute`, with **vertical connectors** at each
status change (the classic continuous RODS line).

**Y axis (status → row):**

| Row | Status | Label |
|---|---|---|
| 1 (top) | `OFF` | Off Duty |
| 2 | `SB` | Sleeper Berth |
| 3 | `D` | Driving |
| 4 (bottom) | `ON` | On Duty (not driving) |

**Right-edge totals:** read straight from `log_sheets[].totals`. SVG is the
recommended renderer (crisp at any size, easy to export to PNG/PDF).

---

## Known gaps / things the API does NOT give you (yet)

Real today — plan the FE around them. None block the build; most can be derived
client-side, or added to the backend on request.

1. **`from_location` / `to_location` are empty** on every sheet. To fill the sheet
   header's "From / To", derive per day: day 0 starts at `current_location`; the day
   containing the Pickup stop transitions through `pickup_location`; the last day ends
   at `dropoff_location`. Simplest acceptable version: `current_location → dropoff_location`
   on every sheet, or use the first/last non-`OFF` segment `location` of each day.
2. **`total_miles_driving` is `0.0`** per sheet. A daily log's header shows "Total
   Miles Driving Today". Approximate by apportioning `total_distance_miles` across days
   by each day's driving hours (`totals.D / Σ totals.D * total_distance_miles`) and
   label it an estimate. (Or request the backend to populate it exactly.)
3. **Grid `segments` carry no coordinates** (only a text `location`) — and you don't
   need them to: every **`stops[]` entry has `coords`** (pickup/dropoff exact;
   rests/fuel/breaks projected onto the route and reverse-geocoded). Drop **all map
   markers from `stops[].coords`** and draw the line from `route_geometry`. (The duty
   grid is time-domain and needs no coordinates.)
4. **No carrier/truck/shipping metadata** (carrier name, truck #, manifest). A daily
   log has these header fields; the API doesn't supply them. Render as blank lines or
   optional UI-only inputs — they don't affect HOS accuracy.

If you want (1) or (2) served by the API instead of derived, that's a small backend
change — flag it.
