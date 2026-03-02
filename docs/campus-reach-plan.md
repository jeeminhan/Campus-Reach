# Campus Reach — Implementation Plan

## Context

International students on US campuses represent one of the most concentrated mission opportunities in the world. Many come from countries with little to no evangelical Christian presence. This tool helps Cru staff, churches, students, and anyone interested in global mission to:

1. Search US universities by name
2. See which countries international students come from at that campus
3. Map those countries to unreached people groups (via Joshua Project)
4. View spiritual profiles: % evangelical, primary religion, unreached status

Data sources:
- **IIE Open Doors** — Annual international student enrollment by university + country of origin (static JSON, pre-processed offline)
- **Joshua Project API** — Unreached people group data by country, proxied server-side via Next.js API route

This is a **new standalone Next.js project** (not an extension of `ism-journey-map`), but it reuses patterns and assets from that project heavily.

---

## Reference Project

All patterns, components, and assets should be modeled after the existing project at:
`/Users/jeeminhan/Code/ism-journey-map/`

Key files to copy or adapt:
- `src/components/WorldMap.tsx` — adapt (change fill logic/props, keep SVG math verbatim)
- `src/data/world.json` — copy verbatim
- `src/types/geojson.ts` — copy verbatim
- `src/lib/getJourneyCell.ts` — pattern for lookup utilities
- `src/app/globals.css` — copy verbatim
- `src/app/layout.tsx` — adapt (update metadata, keep dark theme)
- `package.json` deps — match exactly

---

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript strict
- Tailwind CSS v4 with PostCSS
- `clsx` for conditional classes
- `framer-motion` for panel animation
- `lucide-react` for icons
- Dark slate theme (`bg-slate-950`) throughout

---

## Project Structure

```
campus-reach/
  .env.local                          # JOSHUA_PROJECT_API_KEY=...
  .gitignore
  next.config.ts
  package.json
  postcss.config.mjs
  tsconfig.json
  eslint.config.mjs
  scripts/
    process-iie-data.ts               # one-time data preprocessing (not bundled)
  src/
    app/
      globals.css
      layout.tsx
      page.tsx
      api/
        people-groups/
          route.ts                    # JP API proxy (server-side, 24h cache)
    components/
      Header.tsx
      SearchView.tsx
      UniversityCard.tsx
      CampusView.tsx
      CampusHeader.tsx
      CountryList.tsx
      PeopleGroupList.tsx
      PeopleGroupCard.tsx
      PeopleGroupPanel.tsx
      WorldMap.tsx                    # adapted from reference
    data/
      types.ts
      universities.json               # pre-processed IIE data
      countryCodeMap.ts
      world.json                      # copied from reference
    lib/
      universitySearch.ts
      countryUtils.ts
      usePeopleGroups.ts
      formatters.ts
    types/
      geojson.ts                      # copied from reference
```

---

## Step 1 — Bootstrap Project

```bash
npx create-next-app@16 campus-reach \
  --typescript --tailwind --app \
  --import-alias "@/*"
```

Then restructure to use `src/` directory matching the reference project layout above.

### `package.json` dependencies (match reference exactly)

```json
{
  "dependencies": {
    "clsx": "^2.1.1",
    "framer-motion": "^12.34.3",
    "lucide-react": "^0.575.0",
    "next": "16.1.6",
    "react": "19.2.3",
    "react-dom": "19.2.3"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.1.6",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

### `postcss.config.mjs`
```js
const config = { plugins: { "@tailwindcss/postcss": {} } };
export default config;
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### `.env.local`
```
JOSHUA_PROJECT_API_KEY=your_key_here
```

---

## Step 2 — Type Definitions

### `src/data/types.ts`

```typescript
// IIE data (pre-processed Open Doors)
export interface CountryEnrollment {
  countryName: string;      // display name, e.g. "China"
  isoAlpha2: string;        // "CN" — for flag emoji
  fipsCode: string;         // "CH" — for Joshua Project API
  geoJsonId: string;        // matches world.json feature id, e.g. "china"
  studentCount: number;
}

export interface UniversityRecord {
  id: string;               // slug, e.g. "university-of-southern-california"
  name: string;
  city: string;
  state: string;
  totalInternational: number;
  countries: CountryEnrollment[];
}

// Joshua Project API
export interface PeopleGroup {
  PeopleID3: string;
  PeopNameInCountry: string;
  PeopNameAcrossCountries: string;
  Ctry: string;
  ROG3: string;             // FIPS country code
  Population: number;
  PrimaryReligion: string;
  PrimaryLanguageName: string;
  PercentEvangelical: number | null;
  JPScale: string;          // "1" through "4.4"
  LeastReached: boolean;
  PhotoAddress: string | null;
  Summary: string | null;
}

export interface JPApiResponse {
  data: PeopleGroup[];
}
```

### `src/types/geojson.ts`

Copy verbatim from `/Users/jeeminhan/Code/ism-journey-map/src/types/geojson.ts`.

---

## Step 3 — Static Data

### `src/data/world.json`

Copy verbatim from `/Users/jeeminhan/Code/ism-journey-map/src/data/world.json`.

### `src/data/countryCodeMap.ts`

This is the critical mapping table that connects IIE country names → ISO alpha-2 (flags) → FIPS codes (Joshua Project) → GeoJSON IDs (world map).

**FIPS quirks to note (these differ from ISO):**
- China: ISO `CN`, FIPS `CH`
- South Korea: ISO `KR`, FIPS `KS`
- Taiwan: ISO `TW`, FIPS `TW`
- Vietnam: ISO `VN`, FIPS `VM`
- Russia: ISO `RU`, FIPS `RS`
- Saudi Arabia: ISO `SA`, FIPS `SA`

```typescript
export interface CountryCodeEntry {
  iieNames: string[];       // all name variants in IIE data
  isoAlpha2: string;
  fipsCode: string;
  geoJsonId: string;        // matches feature.properties.id in world.json
  displayName: string;
}

export const countryCodeMap: CountryCodeEntry[] = [
  { iieNames: ["China", "China, People's Republic of"], isoAlpha2: "CN", fipsCode: "CH", geoJsonId: "china", displayName: "China" },
  { iieNames: ["India"], isoAlpha2: "IN", fipsCode: "IN", geoJsonId: "india", displayName: "India" },
  { iieNames: ["South Korea", "Korea, South", "Republic of Korea"], isoAlpha2: "KR", fipsCode: "KS", geoJsonId: "south korea", displayName: "South Korea" },
  { iieNames: ["Saudi Arabia"], isoAlpha2: "SA", fipsCode: "SA", geoJsonId: "saudi arabia", displayName: "Saudi Arabia" },
  { iieNames: ["Canada"], isoAlpha2: "CA", fipsCode: "CA", geoJsonId: "canada", displayName: "Canada" },
  { iieNames: ["Taiwan"], isoAlpha2: "TW", fipsCode: "TW", geoJsonId: "taiwan", displayName: "Taiwan" },
  { iieNames: ["Japan"], isoAlpha2: "JP", fipsCode: "JA", geoJsonId: "japan", displayName: "Japan" },
  { iieNames: ["Vietnam", "Viet Nam"], isoAlpha2: "VN", fipsCode: "VM", geoJsonId: "vietnam", displayName: "Vietnam" },
  { iieNames: ["Brazil"], isoAlpha2: "BR", fipsCode: "BR", geoJsonId: "brazil", displayName: "Brazil" },
  { iieNames: ["Mexico"], isoAlpha2: "MX", fipsCode: "MX", geoJsonId: "mexico", displayName: "Mexico" },
  { iieNames: ["Iran", "Iran, Islamic Republic of"], isoAlpha2: "IR", fipsCode: "IR", geoJsonId: "iran", displayName: "Iran" },
  { iieNames: ["Nigeria"], isoAlpha2: "NG", fipsCode: "NI", geoJsonId: "nigeria", displayName: "Nigeria" },
  { iieNames: ["Bangladesh"], isoAlpha2: "BD", fipsCode: "BG", geoJsonId: "bangladesh", displayName: "Bangladesh" },
  { iieNames: ["Pakistan"], isoAlpha2: "PK", fipsCode: "PK", geoJsonId: "pakistan", displayName: "Pakistan" },
  { iieNames: ["Nepal"], isoAlpha2: "NP", fipsCode: "NP", geoJsonId: "nepal", displayName: "Nepal" },
  { iieNames: ["Indonesia"], isoAlpha2: "ID", fipsCode: "ID", geoJsonId: "indonesia", displayName: "Indonesia" },
  { iieNames: ["Turkey", "Türkiye"], isoAlpha2: "TR", fipsCode: "TU", geoJsonId: "turkey", displayName: "Turkey" },
  { iieNames: ["Germany"], isoAlpha2: "DE", fipsCode: "GM", geoJsonId: "germany", displayName: "Germany" },
  { iieNames: ["France"], isoAlpha2: "FR", fipsCode: "FR", geoJsonId: "france", displayName: "France" },
  { iieNames: ["United Kingdom", "UK", "Great Britain"], isoAlpha2: "GB", fipsCode: "UK", geoJsonId: "united kingdom", displayName: "United Kingdom" },
  { iieNames: ["Malaysia"], isoAlpha2: "MY", fipsCode: "MY", geoJsonId: "malaysia", displayName: "Malaysia" },
  { iieNames: ["Thailand"], isoAlpha2: "TH", fipsCode: "TH", geoJsonId: "thailand", displayName: "Thailand" },
  { iieNames: ["Ghana"], isoAlpha2: "GH", fipsCode: "GH", geoJsonId: "ghana", displayName: "Ghana" },
  { iieNames: ["Kenya"], isoAlpha2: "KE", fipsCode: "KE", geoJsonId: "kenya", displayName: "Kenya" },
  { iieNames: ["Ethiopia"], isoAlpha2: "ET", fipsCode: "ET", geoJsonId: "ethiopia", displayName: "Ethiopia" },
  { iieNames: ["Egypt"], isoAlpha2: "EG", fipsCode: "EG", geoJsonId: "egypt", displayName: "Egypt" },
  { iieNames: ["Colombia"], isoAlpha2: "CO", fipsCode: "CO", geoJsonId: "colombia", displayName: "Colombia" },
  { iieNames: ["Venezuela"], isoAlpha2: "VE", fipsCode: "VE", geoJsonId: "venezuela", displayName: "Venezuela" },
  { iieNames: ["Peru"], isoAlpha2: "PE", fipsCode: "PE", geoJsonId: "peru", displayName: "Peru" },
  { iieNames: ["Philippines"], isoAlpha2: "PH", fipsCode: "RP", geoJsonId: "philippines", displayName: "Philippines" },
  { iieNames: ["Sri Lanka"], isoAlpha2: "LK", fipsCode: "CE", geoJsonId: "sri lanka", displayName: "Sri Lanka" },
  { iieNames: ["Myanmar", "Burma"], isoAlpha2: "MM", fipsCode: "BM", geoJsonId: "myanmar", displayName: "Myanmar" },
  { iieNames: ["Afghanistan"], isoAlpha2: "AF", fipsCode: "AF", geoJsonId: "afghanistan", displayName: "Afghanistan" },
  { iieNames: ["Iraq"], isoAlpha2: "IQ", fipsCode: "IZ", geoJsonId: "iraq", displayName: "Iraq" },
  { iieNames: ["Jordan"], isoAlpha2: "JO", fipsCode: "JO", geoJsonId: "jordan", displayName: "Jordan" },
  { iieNames: ["Kuwait"], isoAlpha2: "KW", fipsCode: "KU", geoJsonId: "kuwait", displayName: "Kuwait" },
  { iieNames: ["United Arab Emirates", "UAE"], isoAlpha2: "AE", fipsCode: "AE", geoJsonId: "united arab emirates", displayName: "UAE" },
  { iieNames: ["Israel"], isoAlpha2: "IL", fipsCode: "IS", geoJsonId: "israel", displayName: "Israel" },
  { iieNames: ["Russia", "Russian Federation"], isoAlpha2: "RU", fipsCode: "RS", geoJsonId: "russia", displayName: "Russia" },
  { iieNames: ["Ukraine"], isoAlpha2: "UA", fipsCode: "UP", geoJsonId: "ukraine", displayName: "Ukraine" },
  { iieNames: ["Kazakhstan"], isoAlpha2: "KZ", fipsCode: "KZ", geoJsonId: "kazakhstan", displayName: "Kazakhstan" },
  { iieNames: ["Australia"], isoAlpha2: "AU", fipsCode: "AS", geoJsonId: "australia", displayName: "Australia" },
  { iieNames: ["New Zealand"], isoAlpha2: "NZ", fipsCode: "NZ", geoJsonId: "new zealand", displayName: "New Zealand" },
  { iieNames: ["South Africa"], isoAlpha2: "ZA", fipsCode: "SF", geoJsonId: "south africa", displayName: "South Africa" },
  { iieNames: ["Tanzania", "Tanzania, United Republic of"], isoAlpha2: "TZ", fipsCode: "TZ", geoJsonId: "tanzania", displayName: "Tanzania" },
  { iieNames: ["Uganda"], isoAlpha2: "UG", fipsCode: "UG", geoJsonId: "uganda", displayName: "Uganda" },
  { iieNames: ["Morocco"], isoAlpha2: "MA", fipsCode: "MO", geoJsonId: "morocco", displayName: "Morocco" },
  { iieNames: ["Algeria"], isoAlpha2: "DZ", fipsCode: "AG", geoJsonId: "algeria", displayName: "Algeria" },
  { iieNames: ["Argentina"], isoAlpha2: "AR", fipsCode: "AR", geoJsonId: "argentina", displayName: "Argentina" },
  { iieNames: ["Chile"], isoAlpha2: "CL", fipsCode: "CI", geoJsonId: "chile", displayName: "Chile" },
  // Add more as needed when expanding the IIE dataset
];
```

### `src/data/universities.json`

This file is generated by the preprocessing script. For initial development, create it manually with the **top 25 US universities by international enrollment** from IIE Open Doors 2023 data. Each university should include the top 10-15 countries by student count.

**Seed data for initial development** (fill in accurate counts from IIE Open Doors report):

```json
[
  {
    "id": "new-york-university",
    "name": "New York University",
    "city": "New York",
    "state": "NY",
    "totalInternational": 19401,
    "countries": [
      { "countryName": "China", "isoAlpha2": "CN", "fipsCode": "CH", "geoJsonId": "china", "studentCount": 7200 },
      { "countryName": "India", "isoAlpha2": "IN", "fipsCode": "IN", "geoJsonId": "india", "studentCount": 1800 },
      { "countryName": "South Korea", "isoAlpha2": "KR", "fipsCode": "KS", "geoJsonId": "south korea", "studentCount": 1200 },
      { "countryName": "Canada", "isoAlpha2": "CA", "fipsCode": "CA", "geoJsonId": "canada", "studentCount": 600 },
      { "countryName": "France", "isoAlpha2": "FR", "fipsCode": "FR", "geoJsonId": "france", "studentCount": 450 }
    ]
  },
  {
    "id": "northeastern-university",
    "name": "Northeastern University",
    "city": "Boston",
    "state": "MA",
    "totalInternational": 18396,
    "countries": [
      { "countryName": "China", "isoAlpha2": "CN", "fipsCode": "CH", "geoJsonId": "china", "studentCount": 6500 },
      { "countryName": "India", "isoAlpha2": "IN", "fipsCode": "IN", "geoJsonId": "india", "studentCount": 4200 },
      { "countryName": "South Korea", "isoAlpha2": "KR", "fipsCode": "KS", "geoJsonId": "south korea", "studentCount": 900 },
      { "countryName": "Canada", "isoAlpha2": "CA", "fipsCode": "CA", "geoJsonId": "canada", "studentCount": 700 },
      { "countryName": "Brazil", "isoAlpha2": "BR", "fipsCode": "BR", "geoJsonId": "brazil", "studentCount": 350 }
    ]
  },
  {
    "id": "columbia-university",
    "name": "Columbia University",
    "city": "New York",
    "state": "NY",
    "totalInternational": 17209,
    "countries": [
      { "countryName": "China", "isoAlpha2": "CN", "fipsCode": "CH", "geoJsonId": "china", "studentCount": 5800 },
      { "countryName": "India", "isoAlpha2": "IN", "fipsCode": "IN", "geoJsonId": "india", "studentCount": 2400 },
      { "countryName": "South Korea", "isoAlpha2": "KR", "fipsCode": "KS", "geoJsonId": "south korea", "studentCount": 1100 },
      { "countryName": "France", "isoAlpha2": "FR", "fipsCode": "FR", "geoJsonId": "france", "studentCount": 500 },
      { "countryName": "Canada", "isoAlpha2": "CA", "fipsCode": "CA", "geoJsonId": "canada", "studentCount": 480 }
    ]
  },
  {
    "id": "university-of-southern-california",
    "name": "University of Southern California",
    "city": "Los Angeles",
    "state": "CA",
    "totalInternational": 15009,
    "countries": [
      { "countryName": "China", "isoAlpha2": "CN", "fipsCode": "CH", "geoJsonId": "china", "studentCount": 5200 },
      { "countryName": "India", "isoAlpha2": "IN", "fipsCode": "IN", "geoJsonId": "india", "studentCount": 2100 },
      { "countryName": "South Korea", "isoAlpha2": "KR", "fipsCode": "KS", "geoJsonId": "south korea", "studentCount": 1400 },
      { "countryName": "Taiwan", "isoAlpha2": "TW", "fipsCode": "TW", "geoJsonId": "taiwan", "studentCount": 600 },
      { "countryName": "Japan", "isoAlpha2": "JP", "fipsCode": "JA", "geoJsonId": "japan", "studentCount": 400 }
    ]
  },
  {
    "id": "arizona-state-university",
    "name": "Arizona State University",
    "city": "Tempe",
    "state": "AZ",
    "totalInternational": 13077,
    "countries": [
      { "countryName": "India", "isoAlpha2": "IN", "fipsCode": "IN", "geoJsonId": "india", "studentCount": 3800 },
      { "countryName": "China", "isoAlpha2": "CN", "fipsCode": "CH", "geoJsonId": "china", "studentCount": 2900 },
      { "countryName": "Saudi Arabia", "isoAlpha2": "SA", "fipsCode": "SA", "geoJsonId": "saudi arabia", "studentCount": 1200 },
      { "countryName": "South Korea", "isoAlpha2": "KR", "fipsCode": "KS", "geoJsonId": "south korea", "studentCount": 700 },
      { "countryName": "Mexico", "isoAlpha2": "MX", "fipsCode": "MX", "geoJsonId": "mexico", "studentCount": 550 }
    ]
  }
]
```

> **Note for Codex:** Populate this file with accurate data from the IIE Open Doors 2023 report (https://opendoorsdata.org/data/). The top 25 universities and their country breakdowns are available in the downloadable Excel files. Each `geoJsonId` must match the `properties.id` field in `world.json` exactly — inspect `world.json` to verify spellings.

---

## Step 4 — App Shell

### `src/app/globals.css`

```css
@import "tailwindcss";

@layer utilities {
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
}
```

### `src/app/layout.tsx`

```typescript
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Campus Reach",
  description: "Discover the unreached peoples behind every campus",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white min-h-screen antialiased">
        <Header />
        {children}
      </body>
    </html>
  );
}
```

### `src/components/Header.tsx`

```typescript
export default function Header() {
  return (
    <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
      <div>
        <span className="text-xs font-semibold tracking-widest uppercase text-sky-400">
          Campus
        </span>
        <h1 className="text-lg font-bold text-white leading-tight">Reach</h1>
      </div>
      <p className="text-sm text-slate-400 hidden md:block">
        International students · Unreached peoples
      </p>
    </header>
  );
}
```

---

## Step 5 — Joshua Project API Route

### `src/app/api/people-groups/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { PeopleGroup } from "@/data/types";

const JP_BASE = "https://joshuaproject.net/api/v2";

export async function GET(req: NextRequest) {
  const fipsCode = req.nextUrl.searchParams.get("fipsCode");

  if (!fipsCode) {
    return NextResponse.json({ error: "fipsCode is required" }, { status: 400 });
  }

  const apiKey = process.env.JOSHUA_PROJECT_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const url = new URL(`${JP_BASE}/people_groups`);
  url.searchParams.set("ROG3", fipsCode);
  url.searchParams.set("LeastReached", "Y");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set(
    "select",
    "PeopleID3,PeopNameInCountry,PeopNameAcrossCountries,Ctry,ROG3,Population,PrimaryReligion,PrimaryLanguageName,PercentEvangelical,JPScale,LeastReached,PhotoAddress,Summary"
  );

  const res = await fetch(url.toString(), {
    next: { revalidate: 86400 }, // cache 24 hours
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: `Joshua Project error: ${res.status}` },
      { status: res.status }
    );
  }

  const raw = await res.json();
  const groups: PeopleGroup[] = Array.isArray(raw) ? raw : (raw.data ?? []);

  return NextResponse.json({ data: groups });
}
```

---

## Step 6 — Utility Libraries

### `src/lib/universitySearch.ts`

```typescript
import universitiesData from "@/data/universities.json";
import { UniversityRecord } from "@/data/types";

const universities = universitiesData as UniversityRecord[];

export function searchUniversities(query: string): UniversityRecord[] {
  const q = query.toLowerCase().trim();
  if (!q) return getTop25Universities();
  return universities.filter(
    (u) =>
      u.name.toLowerCase().includes(q) ||
      u.city.toLowerCase().includes(q) ||
      u.state.toLowerCase().includes(q)
  );
}

export function getUniversityById(id: string): UniversityRecord | null {
  return universities.find((u) => u.id === id) ?? null;
}

export function getTop25Universities(): UniversityRecord[] {
  return [...universities]
    .sort((a, b) => b.totalInternational - a.totalInternational)
    .slice(0, 25);
}
```

### `src/lib/countryUtils.ts`

```typescript
import { countryCodeMap } from "@/data/countryCodeMap";

export function getFlagEmoji(isoAlpha2: string): string {
  return isoAlpha2
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

export function lookupCountryByFips(fipsCode: string) {
  return countryCodeMap.find((e) => e.fipsCode === fipsCode) ?? null;
}
```

### `src/lib/formatters.ts`

```typescript
export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatPercent(n: number | null): string {
  if (n === null || n === 0) return "< 0.1%";
  return `${n.toFixed(1)}%`;
}

export function jpScaleLabel(scale: string): string {
  const num = parseFloat(scale);
  if (num <= 2) return "Unreached";
  if (num <= 3) return "Minimally Reached";
  return "Superficially Reached";
}

export function jpScaleClasses(scale: string): string {
  const num = parseFloat(scale);
  if (num <= 2) return "bg-red-900/50 border-red-500/40 text-red-300";
  if (num <= 3) return "bg-orange-900/50 border-orange-500/40 text-orange-300";
  return "bg-amber-900/50 border-amber-500/40 text-amber-300";
}
```

### `src/lib/usePeopleGroups.ts`

```typescript
"use client";
import { useState, useEffect, useRef } from "react";
import { PeopleGroup } from "@/data/types";

interface State {
  data: PeopleGroup[] | null;
  loading: boolean;
  error: string | null;
}

// In-memory session cache — avoids redundant fetches
const cache = new Map<string, PeopleGroup[]>();

export function usePeopleGroups(fipsCode: string | null): State {
  const [state, setState] = useState<State>({ data: null, loading: false, error: null });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!fipsCode) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    if (cache.has(fipsCode)) {
      setState({ data: cache.get(fipsCode)!, loading: false, error: null });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ data: null, loading: true, error: null });

    fetch(`/api/people-groups?fipsCode=${encodeURIComponent(fipsCode)}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((json) => {
        const groups: PeopleGroup[] = json.data ?? [];
        cache.set(fipsCode, groups);
        setState({ data: groups, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setState({ data: null, loading: false, error: "Failed to load people groups" });
      });

    return () => controller.abort();
  }, [fipsCode]);

  return state;
}
```

---

## Step 7 — World Map Component

### `src/components/WorldMap.tsx`

Adapted from `/Users/jeeminhan/Code/ism-journey-map/src/components/WorldMap.tsx`.

**Copy verbatim:** the `projectToMap` function, `ringToPath` function, `geometryToPath` function, `MAP_WIDTH`/`MAP_HEIGHT` constants (1000/560), SVG viewBox, ocean background rect, lat/lon grid lines, all SVG structural setup.

**Change only:**

1. Props interface:
```typescript
interface Props {
  highlightedCountryIds: Set<string>;  // geoJsonIds to highlight (source countries)
  activeCountryId: string | null;       // currently selected country
  onCountryClick: (geoJsonId: string) => void;
}
```

2. Remove `worldMapCountries.ts` import and `countriesById` map. Instead derive fill from `highlightedCountryIds` and `activeCountryId`:

```typescript
// Replace the worldview fill logic with:
const featureId = feature.properties?.id as string | undefined;
const isActive = featureId === activeCountryId;
const isSource = featureId ? highlightedCountryIds.has(featureId) : false;

const fill = isActive ? "#38bdf8" : isSource ? "#1d4ed8" : "#1e293b";
const stroke = isActive ? "#ffffff" : isSource ? "#93c5fd" : "#334155";
const strokeWidth = isActive ? 1.5 : isSource ? 1 : 0.5;
```

3. Click handler: call `onCountryClick(featureId)` only if `isSource` (non-source countries are not interactive).

4. Remove the country info sidebar that existed in the reference. The WorldMap component only renders the SVG map.

---

## Step 8 — Main Page

### `src/app/page.tsx`

```typescript
"use client";
import { useState } from "react";
import SearchView from "@/components/SearchView";
import CampusView from "@/components/CampusView";
import { UniversityRecord, PeopleGroup } from "@/data/types";

export default function Home() {
  const [university, setUniversity] = useState<UniversityRecord | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<PeopleGroup | null>(null);

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      {!university ? (
        <SearchView onSelect={setUniversity} />
      ) : (
        <CampusView
          university={university}
          onBack={() => { setUniversity(null); setSelectedGroup(null); }}
          onSelectGroup={setSelectedGroup}
          selectedGroup={selectedGroup}
        />
      )}
    </main>
  );
}
```

---

## Step 9 — Search View Components

### `src/components/SearchView.tsx`

```typescript
"use client";
import { useState, useMemo } from "react";
import { searchUniversities, getTop25Universities } from "@/lib/universitySearch";
import { UniversityRecord } from "@/data/types";
import UniversityCard from "./UniversityCard";

interface Props { onSelect: (u: UniversityRecord) => void; }

export default function SearchView({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const results = useMemo(
    () => query.trim() ? searchUniversities(query) : getTop25Universities(),
    [query]
  );

  return (
    <div>
      <div className="mb-10">
        <h2 className="text-4xl font-bold mb-2">Find Your Campus.</h2>
        <p className="text-slate-400 text-lg">See the unreached peoples behind every campus.</p>
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search universities..."
        className="w-full max-w-lg mb-8 px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
      <p className="text-xs text-slate-500 uppercase tracking-widest mb-4">
        {query.trim() ? `${results.length} results` : "Top 25 by international enrollment"}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((u) => (
          <UniversityCard key={u.id} university={u} onClick={() => onSelect(u)} />
        ))}
      </div>
    </div>
  );
}
```

### `src/components/UniversityCard.tsx`

```typescript
import { UniversityRecord } from "@/data/types";
import { getFlagEmoji } from "@/lib/countryUtils";
import { formatCount } from "@/lib/formatters";
import clsx from "clsx";

interface Props { university: UniversityRecord; onClick: () => void; }

export default function UniversityCard({ university, onClick }: Props) {
  const topFlags = university.countries.slice(0, 5).map((c) => getFlagEmoji(c.isoAlpha2));

  return (
    <button
      onClick={onClick}
      className={clsx(
        "text-left w-full p-4 rounded-xl border border-white/10 bg-slate-900/70",
        "hover:border-sky-500/40 hover:bg-slate-800/70 transition-all duration-150"
      )}
    >
      <p className="font-semibold text-white leading-snug mb-1">{university.name}</p>
      <p className="text-xs text-slate-400 mb-3">{university.city}, {university.state}</p>
      <p className="text-sm text-sky-400 font-semibold mb-2">
        {formatCount(university.totalInternational)} international students
      </p>
      <div className="text-xl">{topFlags.join(" ")}</div>
    </button>
  );
}
```

---

## Step 10 — Campus View Components

### `src/components/CampusView.tsx`

```typescript
"use client";
import { useState, useMemo } from "react";
import { UniversityRecord, CountryEnrollment, PeopleGroup } from "@/data/types";
import CampusHeader from "./CampusHeader";
import CountryList from "./CountryList";
import PeopleGroupList from "./PeopleGroupList";
import PeopleGroupPanel from "./PeopleGroupPanel";
import WorldMap from "./WorldMap";

interface Props {
  university: UniversityRecord;
  onBack: () => void;
  onSelectGroup: (pg: PeopleGroup) => void;
  selectedGroup: PeopleGroup | null;
}

export default function CampusView({ university, onBack, onSelectGroup, selectedGroup }: Props) {
  const [selectedCountry, setSelectedCountry] = useState<CountryEnrollment | null>(null);

  const highlightedIds = useMemo(
    () => new Set(university.countries.map((c) => c.geoJsonId)),
    [university]
  );

  const activeGeoJsonId = selectedCountry?.geoJsonId ?? null;

  function handleMapCountryClick(geoJsonId: string) {
    const match = university.countries.find((c) => c.geoJsonId === geoJsonId) ?? null;
    setSelectedCountry(match);
  }

  return (
    <div>
      <CampusHeader university={university} onBack={onBack} />
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div>
          <CountryList
            countries={university.countries}
            selectedFipsCode={selectedCountry?.fipsCode ?? null}
            onSelect={setSelectedCountry}
          />
          {selectedCountry && (
            <div className="mt-6">
              <PeopleGroupList
                fipsCode={selectedCountry.fipsCode}
                countryName={selectedCountry.countryName}
                onSelect={onSelectGroup}
              />
            </div>
          )}
        </div>
        {/* Right column */}
        <div className="hidden lg:block">
          <WorldMap
            highlightedCountryIds={highlightedIds}
            activeCountryId={activeGeoJsonId}
            onCountryClick={handleMapCountryClick}
          />
        </div>
      </div>
      <PeopleGroupPanel group={selectedGroup} onClose={() => onSelectGroup(null as unknown as PeopleGroup)} />
    </div>
  );
}
```

> **Note:** Fix the `onClose` to properly clear the selected group. Pass a setter prop from `page.tsx` instead of using `null as unknown as PeopleGroup`. Refactor: add `onCloseGroup: () => void` prop to `CampusView` and pass `() => onSelectGroup(null)` from page.tsx using `useState<PeopleGroup | null>`.

### `src/components/CampusHeader.tsx`

```typescript
import { UniversityRecord } from "@/data/types";
import { getFlagEmoji } from "@/lib/countryUtils";
import { formatCount } from "@/lib/formatters";
import { ArrowLeft } from "lucide-react";

interface Props { university: UniversityRecord; onBack: () => void; }

export default function CampusHeader({ university, onBack }: Props) {
  const topFlags = university.countries.slice(0, 6).map((c) => getFlagEmoji(c.isoAlpha2));

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition mb-4 text-sm"
      >
        <ArrowLeft size={16} /> Back to search
      </button>
      <h2 className="text-3xl font-bold text-white mb-1">{university.name}</h2>
      <p className="text-slate-400 mb-3">{university.city}, {university.state}</p>
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-sky-400 font-semibold">
          {formatCount(university.totalInternational)} international students
        </span>
        <span className="text-2xl">{topFlags.join(" ")}</span>
      </div>
    </div>
  );
}
```

### `src/components/CountryList.tsx`

```typescript
import { CountryEnrollment } from "@/data/types";
import { getFlagEmoji } from "@/lib/countryUtils";
import { formatCount } from "@/lib/formatters";
import { ChevronRight } from "lucide-react";
import clsx from "clsx";

interface Props {
  countries: CountryEnrollment[];
  selectedFipsCode: string | null;
  onSelect: (c: CountryEnrollment) => void;
}

export default function CountryList({ countries, selectedFipsCode, onSelect }: Props) {
  const total = countries.reduce((sum, c) => sum + c.studentCount, 0);

  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">
        Countries of Origin
      </p>
      <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto scrollbar-hide">
        {countries.map((c) => {
          const pct = ((c.studentCount / total) * 100).toFixed(1);
          const isActive = c.fipsCode === selectedFipsCode;
          return (
            <button
              key={c.fipsCode}
              onClick={() => onSelect(c)}
              className={clsx(
                "flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-150 text-left",
                isActive
                  ? "border-sky-500/50 bg-sky-950/30 ring-1 ring-sky-400"
                  : "border-white/10 bg-slate-900/70 hover:border-white/20"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{getFlagEmoji(c.isoAlpha2)}</span>
                <div>
                  <p className="text-sm font-medium text-white">{c.countryName}</p>
                  <p className="text-xs text-slate-400">{formatCount(c.studentCount)} students · {pct}%</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-500" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

### `src/components/PeopleGroupList.tsx`

```typescript
"use client";
import { usePeopleGroups } from "@/lib/usePeopleGroups";
import { PeopleGroup } from "@/data/types";
import PeopleGroupCard from "./PeopleGroupCard";

interface Props {
  fipsCode: string;
  countryName: string;
  onSelect: (pg: PeopleGroup) => void;
}

export default function PeopleGroupList({ fipsCode, countryName, onSelect }: Props) {
  const { data, loading, error } = usePeopleGroups(fipsCode);

  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">
        Unreached Peoples in {countryName}
      </p>
      {loading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      )}
      {error && (
        <p className="text-sm text-red-400 bg-red-950/30 border border-red-500/20 rounded-xl px-4 py-3">
          {error}
        </p>
      )}
      {data && data.length === 0 && (
        <p className="text-sm text-slate-400 bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3">
          No least-reached people groups found for this country in the Joshua Project database.
        </p>
      )}
      {data && data.length > 0 && (
        <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto scrollbar-hide">
          {data.map((pg) => (
            <PeopleGroupCard key={pg.PeopleID3} group={pg} onClick={() => onSelect(pg)} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### `src/components/PeopleGroupCard.tsx`

```typescript
import { PeopleGroup } from "@/data/types";
import { formatCount, formatPercent, jpScaleLabel, jpScaleClasses } from "@/lib/formatters";
import clsx from "clsx";

interface Props { group: PeopleGroup; onClick: () => void; }

export default function PeopleGroupCard({ group, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="text-left w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-900/70 hover:border-white/20 transition-all duration-150"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm font-semibold text-white leading-snug">{group.PeopNameInCountry}</p>
        <span className={clsx("text-xs px-2 py-0.5 rounded border shrink-0", jpScaleClasses(group.JPScale))}>
          {jpScaleLabel(group.JPScale)}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400">
        <span>{formatCount(group.Population)} people</span>
        <span>{group.PrimaryReligion}</span>
        <span>{formatPercent(group.PercentEvangelical)} evangelical</span>
      </div>
    </button>
  );
}
```

### `src/components/PeopleGroupPanel.tsx`

```typescript
"use client";
import { AnimatePresence, motion } from "framer-motion";
import { PeopleGroup } from "@/data/types";
import { formatCount, formatPercent, jpScaleLabel, jpScaleClasses } from "@/lib/formatters";
import { X } from "lucide-react";
import clsx from "clsx";

interface Props { group: PeopleGroup | null; onClose: () => void; }

export default function PeopleGroupPanel({ group, onClose }: Props) {
  return (
    <AnimatePresence>
      {group && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          {/* Panel */}
          <motion.div
            key={group.PeopleID3}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-slate-900 border-l border-white/10 z-50 overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">People Group</p>
                  <h2 className="text-2xl font-bold text-white">{group.PeopNameInCountry}</h2>
                  {group.PeopNameAcrossCountries !== group.PeopNameInCountry && (
                    <p className="text-sm text-slate-400 mt-0.5">Also known as: {group.PeopNameAcrossCountries}</p>
                  )}
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
                  <X size={20} />
                </button>
              </div>

              {/* Status badge */}
              <span className={clsx("inline-block text-sm px-3 py-1 rounded-full border mb-6", jpScaleClasses(group.JPScale))}>
                {jpScaleLabel(group.JPScale)} · JP Scale {group.JPScale}
              </span>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Stat label="Country" value={group.Ctry} />
                <Stat label="Population" value={formatCount(group.Population)} />
                <Stat label="Primary Religion" value={group.PrimaryReligion} />
                <Stat label="Primary Language" value={group.PrimaryLanguageName} />
                <Stat label="Evangelical" value={formatPercent(group.PercentEvangelical)} />
              </div>

              {/* Evangelical bar */}
              {group.PercentEvangelical !== null && (
                <div className="mb-6">
                  <p className="text-xs text-slate-400 mb-1">
                    {formatPercent(group.PercentEvangelical)} Evangelical
                  </p>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full"
                      style={{ width: `${Math.min(group.PercentEvangelical, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Summary */}
              {group.Summary && (
                <div className="mb-6">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">About</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{group.Summary}</p>
                </div>
              )}

              {/* Photo */}
              {group.PhotoAddress && (
                <img
                  src={group.PhotoAddress}
                  alt={group.PeopNameInCountry}
                  className="w-full rounded-xl object-cover mb-6"
                />
              )}

              {/* CTA */}
              <div className="border-t border-white/10 pt-6">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Take Action</p>
                <a
                  href={`https://joshuaproject.net/people_groups/${group.PeopleID3}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold transition"
                >
                  View on Joshua Project →
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-800/60 rounded-xl px-3 py-3">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-white font-medium">{value}</p>
    </div>
  );
}
```

---

## Step 11 — Fix `CampusView` null-safety issue

Update `src/app/page.tsx` to pass a proper close handler:

```typescript
// In page.tsx
<CampusView
  university={university}
  onBack={() => { setUniversity(null); setSelectedGroup(null); }}
  onSelectGroup={setSelectedGroup}
  onCloseGroup={() => setSelectedGroup(null)}
  selectedGroup={selectedGroup}
/>
```

Update `CampusView` props interface to include `onCloseGroup: () => void` and pass it to `PeopleGroupPanel`:

```typescript
<PeopleGroupPanel group={selectedGroup} onClose={onCloseGroup} />
```

---

## Step 12 — Data Preprocessing Script (for expansion)

### `scripts/process-iie-data.ts`

Run with: `npx tsx scripts/process-iie-data.ts`

```typescript
import * as fs from "fs";
import { countryCodeMap } from "../src/data/countryCodeMap";

// Expects a manually-extracted JSON file from IIE Excel data
// Input format: array of { university: string, city: string, state: string, total: number, countries: { name: string, count: number }[] }
const raw = JSON.parse(fs.readFileSync("scripts/iie-raw.json", "utf8"));

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-");
}

const output = raw.map((u: any) => ({
  id: slugify(u.university),
  name: u.university,
  city: u.city,
  state: u.state,
  totalInternational: u.total,
  countries: u.countries
    .map((c: { name: string; count: number }) => {
      const entry = countryCodeMap.find((e) =>
        e.iieNames.some((n) => n.toLowerCase() === c.name.toLowerCase())
      );
      if (!entry) {
        console.warn(`No mapping found for: "${c.name}"`);
        return null;
      }
      return {
        countryName: entry.displayName,
        isoAlpha2: entry.isoAlpha2,
        fipsCode: entry.fipsCode,
        geoJsonId: entry.geoJsonId,
        studentCount: c.count,
      };
    })
    .filter(Boolean),
}));

fs.writeFileSync("src/data/universities.json", JSON.stringify(output, null, 2));
console.log(`Wrote ${output.length} universities`);
```

---

## Verification Checklist

Run each check in order before marking the build complete:

1. `npm run dev` starts without errors — header renders on `bg-slate-950` background
2. `console.log(getTop25Universities())` in page.tsx returns 25 universities with countries
3. `curl "http://localhost:3000/api/people-groups?fipsCode=CH"` returns JSON array of Chinese people groups
4. Typing "Harvard" in search shows matching results
5. Clicking a university shows CampusView with country list and world map
6. Countries from that university are highlighted (blue) on the world map
7. Clicking a country row loads people groups below it (loading skeleton → data)
8. Clicking the same country a second time shows cached result instantly (no network request)
9. Clicking a people group card opens the slide-in panel with full data
10. Clicking the backdrop or X closes the panel
11. Clicking a highlighted country on the map selects the same country row in the list
12. `npm run build` exits 0 with no TypeScript errors

---

## Known Limitations / Future Improvements

- `universities.json` starts with manually seeded top 25 — run `scripts/process-iie-data.ts` to expand to full dataset
- `countryCodeMap.ts` covers ~50 countries initially — uncommon countries log a warning in the preprocessing script
- No URL-based routing — sharing a specific campus view requires adding Next.js dynamic routes later
- Mobile: `WorldMap` is hidden on small screens (`hidden lg:block`) — a future improvement could show a simplified mobile view
- Joshua Project API key must be obtained manually from https://joshuaproject.net/api/v2
