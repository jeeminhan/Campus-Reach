# Design: People Group Relevance Filtering + Map Choropleth

Date: 2026-03-02

## Problems

1. **Too many people groups per country.** The `/api/people-groups` route returns all least-reached groups for a country with no limit. Countries like India or China return hundreds, making the list unusable.
2. **Map shows no student distribution data.** The world map highlights source countries as binary (blue = has students) with no encoding of how many students come from each country.

## Goals

- Surface people groups proportional to the number of students from that country (more students = more groups shown), prioritizing the most unreached.
- Encode student percentage on the map via choropleth shading + hover tooltip.

---

## Feature 1: Proportional People Group Cap

### Logic

The number of groups shown per country is computed by the caller and passed as a `?limit=` query param to the API:

```
studentShare = country.studentCount / university.totalInternational
limit = clamp(round(studentShare * 50), 1, 15)
```

Examples:
- 20% of students → limit 10
- 10% → limit 5
- 2% → limit 1
- Always at least 1, at most 15

The API sorts results by `JPScale` ascending (most unreached first) before slicing to `limit`.

### Files changed

| File | Change |
|------|--------|
| `src/app/api/people-groups/route.ts` | Read `?limit=` param; sort by JPScale asc; slice before returning |
| `src/lib/usePeopleGroups.ts` | Accept `limit` param; include in fetch URL; cache key includes limit |
| `src/components/PeopleGroupList.tsx` | Accept `studentCount` + `totalInternational` props; compute limit; pass to hook |
| `src/components/CampusView.tsx` | Pass `studentCount` and `university.totalInternational` to `PeopleGroupList` |

### API sorting note

Joshua Project does not guarantee sort order. Sorting must happen server-side after fetching, before slicing.

---

## Feature 2: Choropleth Map + Hover Tooltip

### Color scale

Compute `maxStudentCount = max(country.studentCount)` across all countries for the current university. Each source country path gets a fill color interpolated from a low-intensity blue at `minPct` to full blue at `maxStudentCount`:

```
intensity = country.studentCount / maxStudentCount   // 0.0 → 1.0
fill = interpolate(#1e3a5f, #1d4ed8, intensity)
```

Active (clicked) country stays `#38bdf8` as today.

### Hover tooltip

On `mouseenter` of a source country `<path>`, show a small div positioned via `onMouseMove` tracking coordinates relative to the SVG container. Tooltip content:

```
🇮🇳 India
500 students · 18.4%
```

Dismiss on `mouseleave`. Implemented with React state: `tooltip: { x, y, country: CountryEnrollment } | null`.

### Props change

`WorldMap` receives a new `countries: CountryEnrollment[]` prop (in addition to existing `highlightedCountryIds`, `activeCountryId`, `onCountryClick`). The component derives per-country student data from this prop for both color and tooltip. `highlightedCountryIds` is still used for the clickable-country guard.

### Files changed

| File | Change |
|------|--------|
| `src/components/WorldMap.tsx` | Add `countries` prop; compute color per country; add tooltip state + handlers |
| `src/components/CampusView.tsx` | Pass `university.countries` to `WorldMap` |

---

## Data flow

```
CampusView
  ├─ passes university.countries[] to WorldMap
  │    └─ computes intensity per country for fill color
  │    └─ shows tooltip with studentCount + pct on hover
  └─ passes studentCount + totalInternational to PeopleGroupList
       └─ computes limit
       └─ passes limit to usePeopleGroups(fipsCode, limit)
            └─ fetches /api/people-groups?fipsCode=...&limit=...
                 └─ API sorts by JPScale asc, slices to limit
```

---

## What is not changing

- Clicking a country on the map still scrolls the country list (existing behavior).
- The country list UI itself is unchanged.
- The `PeopleGroupPanel` detail drawer is unchanged.
- No new dependencies are added.
