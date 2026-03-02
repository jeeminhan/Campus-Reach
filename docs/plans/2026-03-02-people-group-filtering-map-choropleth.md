# People Group Filtering + Map Choropleth Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Cap people groups shown per country proportionally to student share, and encode student percentages on the world map via choropleth shading and hover tooltips.

**Architecture:** Two independent changes — (1) a `limit` param threads from component props → fetch hook → API route, with server-side JPScale sort + slice; (2) `WorldMap` gets a `countries` prop and uses it to compute fill color intensity per country plus a hover tooltip via React state.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, SVG map (no mapping library)

---

## Task 1: Extract `computeLimit` as a pure function + test it

No existing test infrastructure — set up Vitest minimally to test pure logic.

**Files:**
- Create: `src/lib/peopleGroupUtils.ts`
- Create: `src/lib/peopleGroupUtils.test.ts`

**Step 1: Install Vitest**

```bash
npm install -D vitest
```

**Step 2: Add test script to `package.json`**

In the `"scripts"` section, add:
```json
"test": "vitest run"
```

**Step 3: Write the failing test**

Create `src/lib/peopleGroupUtils.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { computeLimit } from "./peopleGroupUtils";

describe("computeLimit", () => {
  it("returns 10 for 20% share", () => {
    expect(computeLimit(200, 1000)).toBe(10);
  });

  it("returns 5 for 10% share", () => {
    expect(computeLimit(100, 1000)).toBe(5);
  });

  it("clamps to minimum 1 for tiny share", () => {
    expect(computeLimit(1, 10000)).toBe(1);
  });

  it("clamps to maximum 15 for dominant share", () => {
    expect(computeLimit(900, 1000)).toBe(15);
  });

  it("returns 1 when totalInternational is 0", () => {
    expect(computeLimit(0, 0)).toBe(1);
  });
});
```

**Step 4: Run tests to verify they fail**

```bash
npm test
```

Expected: All 5 tests fail with "Cannot find module './peopleGroupUtils'"

**Step 5: Create `src/lib/peopleGroupUtils.ts`**

```typescript
/**
 * Computes how many people groups to show for a country,
 * proportional to that country's share of total international students.
 *
 * Formula: clamp(round(share * 50), 1, 15)
 * - 20% share → 10 groups
 * - 10% share → 5 groups
 * - <2% share → 1 group (minimum)
 * - >30% share → 15 groups (maximum)
 */
export function computeLimit(studentCount: number, totalInternational: number): number {
  if (totalInternational <= 0) return 1;
  const share = studentCount / totalInternational;
  return Math.max(1, Math.min(15, Math.round(share * 50)));
}
```

**Step 6: Run tests to verify they pass**

```bash
npm test
```

Expected: All 5 tests PASS

**Step 7: Commit**

```bash
git add src/lib/peopleGroupUtils.ts src/lib/peopleGroupUtils.test.ts package.json package-lock.json
git commit -m "feat: add computeLimit utility with tests"
```

---

## Task 2: Update API route to sort by JPScale and respect `?limit=`

**Files:**
- Modify: `src/app/api/people-groups/route.ts`

The route currently returns all groups unsorted. We need to:
1. Read `?limit=` from the request (default to 50 as a safe cap if not provided)
2. Sort groups by `JPScale` ascending before slicing (JPScale "1" is most unreached)
3. Slice to `limit`

**Step 1: Read the current route**

File is at `src/app/api/people-groups/route.ts`. The `uniqueGroups` array is built at line 122 and returned at line 132. We insert sort + slice between those two points.

**Step 2: Edit the route**

Find this block near the end of the GET handler (after the `uniqueGroups` filter):

```typescript
  return NextResponse.json({ data: uniqueGroups });
```

Replace with:

```typescript
  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Math.max(1, Math.min(50, parseInt(limitParam, 10))) : 50;

  const sorted = [...uniqueGroups].sort((a, b) => {
    const aScale = parseFloat(a.JPScale) || 99;
    const bScale = parseFloat(b.JPScale) || 99;
    return aScale - bScale;
  });

  return NextResponse.json({ data: sorted.slice(0, limit) });
```

**Step 3: Manual verification**

Start the dev server:
```bash
npm run dev
```

Open in browser:
```
http://localhost:3000/api/people-groups?fipsCode=IN&limit=3
```

Expected: JSON response with exactly 3 people groups, ordered by JPScale ascending (lowest number first).

Also test without limit:
```
http://localhost:3000/api/people-groups?fipsCode=IN
```

Expected: Up to 50 groups returned.

**Step 4: Commit**

```bash
git add src/app/api/people-groups/route.ts
git commit -m "feat: sort people groups by JPScale and respect limit param"
```

---

## Task 3: Update `usePeopleGroups` hook to accept and pass `limit`

**Files:**
- Modify: `src/lib/usePeopleGroups.ts`

The hook currently fetches `/api/people-groups?fipsCode=...`. We add a `limit` param, include it in the URL, and make the cache key include `limit` so different limits don't collide.

**Step 1: Update the hook signature and internals**

Current signature (line 14):
```typescript
export function usePeopleGroups(fipsCode: string | null): State {
```

New signature:
```typescript
export function usePeopleGroups(fipsCode: string | null, limit: number): State {
```

Update the cache key (line 28):
```typescript
  const cacheKey = fipsCode ? `${fipsCode}:${limit}` : null;
```

Update all `cache.has(fipsCode)` / `cache.get(fipsCode)` / `cache.set(fipsCode, ...)` to use `cacheKey`:
```typescript
  if (cacheKey && cache.has(cacheKey)) {
    setState({ data: cache.get(cacheKey) ?? [], loading: false, error: null });
    return;
  }
  // ...
  cache.set(cacheKey!, groups);
```

Update the fetch URL (line 44):
```typescript
  fetch(`/api/people-groups?fipsCode=${encodeURIComponent(fipsCode)}&limit=${limit}`, {
```

Update the `useEffect` dependency array (line 108):
```typescript
  }, [fipsCode, limit]);
```

**Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors (there will be a type error in `PeopleGroupList` since it still calls the old signature — fix that in Task 4).

**Step 3: Commit**

```bash
git add src/lib/usePeopleGroups.ts
git commit -m "feat: thread limit param through usePeopleGroups hook"
```

---

## Task 4: Update `PeopleGroupList` to compute and pass limit

**Files:**
- Modify: `src/components/PeopleGroupList.tsx`

**Step 1: Add props**

Current Props interface:
```typescript
interface Props {
  fipsCode: string;
  countryName: string;
  onSelect: (pg: PeopleGroup) => void;
}
```

New Props interface:
```typescript
interface Props {
  fipsCode: string;
  countryName: string;
  studentCount: number;
  totalInternational: number;
  onSelect: (pg: PeopleGroup) => void;
}
```

**Step 2: Compute limit and pass to hook**

Add import at the top:
```typescript
import { computeLimit } from "@/lib/peopleGroupUtils";
```

Update the component body:
```typescript
export default function PeopleGroupList({
  fipsCode,
  countryName,
  studentCount,
  totalInternational,
  onSelect,
}: Props) {
  const limit = computeLimit(studentCount, totalInternational);
  const { data, loading, error } = usePeopleGroups(fipsCode, limit);
```

**Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: Error in `CampusView` since it doesn't pass the new props yet — fix in Task 5.

**Step 4: Commit**

```bash
git add src/components/PeopleGroupList.tsx
git commit -m "feat: compute people group limit from student share in PeopleGroupList"
```

---

## Task 5: Update `CampusView` to pass new props to `PeopleGroupList`

**Files:**
- Modify: `src/components/CampusView.tsx`

**Step 1: Pass `studentCount` and `totalInternational` to `PeopleGroupList`**

Find the `PeopleGroupList` usage (around line 63):
```tsx
<PeopleGroupList
  fipsCode={selectedCountry.fipsCode}
  countryName={selectedCountry.countryName}
  onSelect={onSelectGroup}
/>
```

Replace with:
```tsx
<PeopleGroupList
  fipsCode={selectedCountry.fipsCode}
  countryName={selectedCountry.countryName}
  studentCount={selectedCountry.studentCount}
  totalInternational={university.totalInternational}
  onSelect={onSelectGroup}
/>
```

**Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Manual smoke test**

```bash
npm run dev
```

1. Open the app, select a university with many international students (e.g., one with India listed)
2. Click India — should see a capped, sorted list of people groups
3. Click a small country — should see 1–2 groups max
4. Verify groups appear ordered from lowest JPScale to highest

**Step 4: Commit**

```bash
git add src/components/CampusView.tsx
git commit -m "feat: pass student counts to PeopleGroupList for proportional group capping"
```

---

## Task 6: Extract `interpolateColor` as a pure function + test it

**Files:**
- Modify: `src/lib/peopleGroupUtils.ts` (add to existing file)
- Modify: `src/lib/peopleGroupUtils.test.ts` (add tests)

**Step 1: Write the failing test**

Add to `src/lib/peopleGroupUtils.test.ts`:

```typescript
import { interpolateBlue } from "./peopleGroupUtils";

describe("interpolateBlue", () => {
  it("returns dim blue at intensity 0", () => {
    expect(interpolateBlue(0)).toBe("rgb(30,58,95)");
  });

  it("returns full blue at intensity 1", () => {
    expect(interpolateBlue(1)).toBe("rgb(29,78,216)");
  });

  it("returns midpoint blue at intensity 0.5", () => {
    // midpoint between (30,58,95) and (29,78,216)
    expect(interpolateBlue(0.5)).toBe("rgb(30,68,156)");
  });

  it("clamps intensity above 1", () => {
    expect(interpolateBlue(2)).toBe(interpolateBlue(1));
  });

  it("clamps intensity below 0", () => {
    expect(interpolateBlue(-1)).toBe(interpolateBlue(0));
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: 5 new failures with "interpolateBlue is not a function"

**Step 3: Add `interpolateBlue` to `src/lib/peopleGroupUtils.ts`**

```typescript
// Base color: #1e3a5f (dim slate-blue for low student share)
// Full color: #1d4ed8 (vivid blue-700 for high student share)
const LOW = [30, 58, 95] as const;
const HIGH = [29, 78, 216] as const;

/**
 * Interpolates between a dim blue and vivid blue based on intensity (0–1).
 * Returns a CSS rgb() string.
 */
export function interpolateBlue(intensity: number): string {
  const t = Math.max(0, Math.min(1, intensity));
  const r = Math.round(LOW[0] + (HIGH[0] - LOW[0]) * t);
  const g = Math.round(LOW[1] + (HIGH[1] - LOW[1]) * t);
  const b = Math.round(LOW[2] + (HIGH[2] - LOW[2]) * t);
  return `rgb(${r},${g},${b})`;
}
```

**Step 4: Run tests**

```bash
npm test
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/lib/peopleGroupUtils.ts src/lib/peopleGroupUtils.test.ts
git commit -m "feat: add interpolateBlue utility with tests"
```

---

## Task 7: Update `WorldMap` with choropleth shading and hover tooltip

**Files:**
- Modify: `src/components/WorldMap.tsx`

This is the largest single change. Read the current file carefully before editing.

**Step 1: Update Props interface**

Current:
```typescript
interface Props {
  highlightedCountryIds: Set<string>;
  activeCountryId: string | null;
  onCountryClick: (geoJsonId: string) => void;
}
```

New:
```typescript
import { CountryEnrollment } from "@/data/types";
import { interpolateBlue } from "@/lib/peopleGroupUtils";

interface Props {
  highlightedCountryIds: Set<string>;
  activeCountryId: string | null;
  onCountryClick: (geoJsonId: string) => void;
  countries: CountryEnrollment[];
}
```

**Step 2: Add tooltip state and country lookup map**

Inside the component, before the return:

```typescript
export default function WorldMap({
  highlightedCountryIds,
  activeCountryId,
  onCountryClick,
  countries,
}: Props) {
  const geo = worldGeoJson as GeoFeatureCollection;

  // Build lookup: geoJsonId → CountryEnrollment
  const countryByGeoId = useMemo(() => {
    const map = new Map<string, CountryEnrollment>();
    for (const c of countries) {
      map.set(c.geoJsonId, c);
    }
    return map;
  }, [countries]);

  // Max student count for normalizing color intensity
  const maxStudentCount = useMemo(
    () => Math.max(1, ...countries.map((c) => c.studentCount)),
    [countries]
  );

  // Total for percentage calculation
  const totalStudents = useMemo(
    () => countries.reduce((sum, c) => sum + c.studentCount, 0),
    [countries]
  );

  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    country: CountryEnrollment;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
```

Add the necessary imports at the top of the file:
```typescript
import { useRef, useState, useMemo } from "react";
import { CountryEnrollment } from "@/data/types";
import { interpolateBlue } from "@/lib/peopleGroupUtils";
```

**Step 3: Update path rendering to use choropleth fill**

Current fill logic (around line 109):
```typescript
const fill = isActive ? "#38bdf8" : isSource ? "#1d4ed8" : "#1e293b";
const stroke = isActive ? "#ffffff" : isSource ? "#93c5fd" : "#334155";
const strokeWidth = isActive ? 1.5 : isSource ? 1 : 0.5;
```

Replace with:
```typescript
let fill: string;
let stroke: string;
let strokeWidth: number;

if (isActive) {
  fill = "#38bdf8";
  stroke = "#ffffff";
  strokeWidth = 1.5;
} else if (isSource) {
  const enrollment = countryByGeoId.get(featureId);
  const intensity = enrollment ? enrollment.studentCount / maxStudentCount : 0.1;
  fill = interpolateBlue(intensity);
  stroke = "#93c5fd";
  strokeWidth = 1;
} else {
  fill = "#1e293b";
  stroke = "#334155";
  strokeWidth = 0.5;
}
```

**Step 4: Add mouse event handlers to path elements**

On the `<path>` element, add these handlers (alongside the existing `onClick` and `onKeyDown`):

```tsx
onMouseMove={(e) => {
  if (!isSource || !containerRef.current) return;
  const rect = containerRef.current.getBoundingClientRect();
  const enrollment = countryByGeoId.get(featureId);
  if (enrollment) {
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      country: enrollment,
    });
  }
}}
onMouseLeave={() => {
  if (isSource) setTooltip(null);
}}
```

**Step 5: Add `ref` to the container div and render tooltip**

Wrap the existing `<div className="relative overflow-hidden ...">` with `ref={containerRef}`:

```tsx
<div ref={containerRef} className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-950/80 p-3 md:p-4">
```

Inside that div, after the SVG, add the tooltip:

```tsx
{tooltip && (
  <div
    className="pointer-events-none absolute z-10 rounded-lg border border-white/10 bg-slate-800/95 px-3 py-2 text-sm shadow-lg backdrop-blur-sm"
    style={{
      left: tooltip.x + 12,
      top: tooltip.y - 10,
      transform: tooltip.x > 700 ? "translateX(-100%)" : undefined,
    }}
  >
    <p className="font-medium text-white">
      {getFlagEmoji(tooltip.country.isoAlpha2)} {tooltip.country.countryName}
    </p>
    <p className="text-xs text-slate-400">
      {formatCount(tooltip.country.studentCount)} students ·{" "}
      {totalStudents > 0
        ? ((tooltip.country.studentCount / totalStudents) * 100).toFixed(1)
        : "0.0"}
      %
    </p>
  </div>
)}
```

Import `getFlagEmoji` and `formatCount` at the top:
```typescript
import { getFlagEmoji } from "@/lib/countryUtils";
import { formatCount } from "@/lib/formatters";
```

**Step 6: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: Error in `CampusView` because `WorldMap` now requires `countries` prop — fix in Task 8.

**Step 7: Commit**

```bash
git add src/components/WorldMap.tsx
git commit -m "feat: add choropleth shading and hover tooltip to WorldMap"
```

---

## Task 8: Update `CampusView` to pass `countries` to `WorldMap`

**Files:**
- Modify: `src/components/CampusView.tsx`

**Step 1: Pass `countries` prop**

Find the `WorldMap` usage (around line 72):
```tsx
<WorldMap
  highlightedCountryIds={highlightedIds}
  activeCountryId={activeGeoJsonId}
  onCountryClick={handleMapCountryClick}
/>
```

Replace with:
```tsx
<WorldMap
  highlightedCountryIds={highlightedIds}
  activeCountryId={activeGeoJsonId}
  onCountryClick={handleMapCountryClick}
  countries={university.countries}
/>
```

**Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Full manual smoke test**

```bash
npm run dev
```

Verify all of the following:

1. **Choropleth:** On a campus view, source countries should shade from dim blue (low %) to vivid blue (high %). No country should be flat blue like before.
2. **Tooltip:** Hovering a source country shows flag + name + student count + percentage. Hovering a non-source country shows nothing.
3. **Tooltip positioning:** Tooltip doesn't go off the right edge of the map (flips left when `x > 700`).
4. **Active country:** Clicking a country still highlights it sky-blue and scrolls the list — unchanged behavior.
5. **People group list:** Selecting a large country (India, China) shows a capped list sorted by JPScale. Selecting a small country shows 1–2 groups.
6. **TypeScript:** `npx tsc --noEmit` passes clean.

**Step 4: Commit**

```bash
git add src/components/CampusView.tsx
git commit -m "feat: pass university.countries to WorldMap for choropleth"
```

---

## Task 9: Run full build and push

**Step 1: Run the full build**

```bash
npm run build
```

Expected: Build completes with no errors. Output should show:
```
Route (app)
┌ ○ /
├ ○ /_not-found
└ ƒ /api/people-groups
✓ Compiled successfully
```

**Step 2: Fix any build errors before continuing**

If there are TypeScript or lint errors, fix them before pushing.

**Step 3: Push to trigger Vercel deployment**

```bash
git push
```

**Step 4: Monitor Vercel deployment**

```bash
vercel logs --follow
```

Or check the Vercel dashboard. Deployment should go green.
