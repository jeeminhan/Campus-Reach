import * as fs from "node:fs";
import { countryCodeMap } from "../src/data/countryCodeMap";

interface RawCountry {
  name: string;
  count: number;
}

interface RawUniversity {
  university: string;
  city: string;
  state: string;
  total: number;
  countries: RawCountry[];
}

interface OutputCountry {
  countryName: string;
  isoAlpha2: string;
  fipsCode: string;
  geoJsonId: string;
  studentCount: number;
}

interface OutputUniversity {
  id: string;
  name: string;
  city: string;
  state: string;
  totalInternational: number;
  countries: OutputCountry[];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-");
}

const raw = JSON.parse(
  fs.readFileSync("scripts/iie-raw.json", "utf8")
) as RawUniversity[];

const output: OutputUniversity[] = raw.map((u) => ({
  id: slugify(u.university),
  name: u.university,
  city: u.city,
  state: u.state,
  totalInternational: u.total,
  countries: u.countries
    .map((country) => {
      const entry = countryCodeMap.find((mapEntry) =>
        mapEntry.iieNames.some(
          (name) => name.toLowerCase() === country.name.toLowerCase()
        )
      );

      if (!entry) {
        console.warn(`No mapping found for: "${country.name}"`);
        return null;
      }

      return {
        countryName: entry.displayName,
        isoAlpha2: entry.isoAlpha2,
        fipsCode: entry.fipsCode,
        geoJsonId: entry.geoJsonId,
        studentCount: country.count,
      };
    })
    .filter((country): country is OutputCountry => country !== null),
}));

fs.writeFileSync("src/data/universities.json", JSON.stringify(output, null, 2));
console.log(`Wrote ${output.length} universities`);
