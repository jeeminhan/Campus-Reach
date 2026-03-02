export interface CountryCodeEntry {
  iieNames: string[];
  isoAlpha2: string;
  fipsCode: string;
  geoJsonId: string;
  displayName: string;
}

export const countryCodeMap: CountryCodeEntry[] = [
  {
    iieNames: ["China", "China, People's Republic of"],
    isoAlpha2: "CN",
    fipsCode: "CH",
    geoJsonId: "china",
    displayName: "China",
  },
  {
    iieNames: ["India"],
    isoAlpha2: "IN",
    fipsCode: "IN",
    geoJsonId: "india",
    displayName: "India",
  },
  {
    iieNames: ["Saudi Arabia"],
    isoAlpha2: "SA",
    fipsCode: "SA",
    geoJsonId: "saudi-arabia",
    displayName: "Saudi Arabia",
  },
  {
    iieNames: ["Mexico"],
    isoAlpha2: "MX",
    fipsCode: "MX",
    geoJsonId: "mexico",
    displayName: "Mexico",
  },
  {
    iieNames: ["Brazil"],
    isoAlpha2: "BR",
    fipsCode: "BR",
    geoJsonId: "brazil",
    displayName: "Brazil",
  },
  {
    iieNames: ["Nigeria"],
    isoAlpha2: "NG",
    fipsCode: "NI",
    geoJsonId: "nigeria",
    displayName: "Nigeria",
  },
  {
    iieNames: ["Japan"],
    isoAlpha2: "JP",
    fipsCode: "JA",
    geoJsonId: "japan",
    displayName: "Japan",
  },
  {
    iieNames: ["Indonesia"],
    isoAlpha2: "ID",
    fipsCode: "ID",
    geoJsonId: "indonesia",
    displayName: "Indonesia",
  },
  {
    iieNames: ["United Kingdom", "UK", "Great Britain"],
    isoAlpha2: "GB",
    fipsCode: "UK",
    geoJsonId: "uk",
    displayName: "United Kingdom",
  },
  {
    iieNames: ["Australia"],
    isoAlpha2: "AU",
    fipsCode: "AS",
    geoJsonId: "australia",
    displayName: "Australia",
  },
  {
    iieNames: ["South Korea", "Korea, South", "Republic of Korea"],
    isoAlpha2: "KR",
    fipsCode: "KS",
    geoJsonId: "south-korea",
    displayName: "South Korea",
  },
  {
    iieNames: ["Taiwan"],
    isoAlpha2: "TW",
    fipsCode: "TW",
    geoJsonId: "taiwan",
    displayName: "Taiwan",
  },
  {
    iieNames: ["Vietnam", "Viet Nam"],
    isoAlpha2: "VN",
    fipsCode: "VM",
    geoJsonId: "vietnam",
    displayName: "Vietnam",
  },
  {
    iieNames: ["Canada"],
    isoAlpha2: "CA",
    fipsCode: "CA",
    geoJsonId: "canada",
    displayName: "Canada",
  },
  {
    iieNames: ["Iran", "Iran, Islamic Republic of"],
    isoAlpha2: "IR",
    fipsCode: "IR",
    geoJsonId: "iran",
    displayName: "Iran",
  },
  {
    iieNames: ["Nepal"],
    isoAlpha2: "NP",
    fipsCode: "NP",
    geoJsonId: "nepal",
    displayName: "Nepal",
  },
];
