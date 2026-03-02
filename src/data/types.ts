export interface CountryEnrollment {
  countryName: string;
  isoAlpha2: string;
  fipsCode: string;
  geoJsonId: string;
  studentCount: number;
}

export interface UniversityRecord {
  id: string;
  name: string;
  city: string;
  state: string;
  totalInternational: number;
  countries: CountryEnrollment[];
}

export interface PeopleGroup {
  PeopleID3: string;
  PeopNameInCountry: string;
  PeopNameAcrossCountries: string;
  Ctry: string;
  ROG3: string;
  Population: number;
  PrimaryReligion: string;
  PrimaryLanguageName: string;
  PercentEvangelical: number | null;
  JPScale: string;
  LeastReached: boolean;
  PhotoAddress: string | null;
  Summary: string | null;
}

export interface JPApiResponse {
  data: PeopleGroup[];
}
