import { countryCodeMap } from "@/data/countryCodeMap";

export function getFlagEmoji(isoAlpha2: string): string {
  return isoAlpha2
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65))
    .join("");
}

export function lookupCountryByFips(fipsCode: string) {
  return countryCodeMap.find((entry) => entry.fipsCode === fipsCode) ?? null;
}
