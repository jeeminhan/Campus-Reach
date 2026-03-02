"use client";

import { useMemo, useState } from "react";
import {
  CountryEnrollment,
  PeopleGroup,
  UniversityRecord,
} from "@/data/types";
import CampusHeader from "./CampusHeader";
import CountryList from "./CountryList";
import PeopleGroupList from "./PeopleGroupList";
import PeopleGroupPanel from "./PeopleGroupPanel";
import WorldMap from "./WorldMap";

interface Props {
  university: UniversityRecord;
  onBack: () => void;
  onSelectGroup: (pg: PeopleGroup | null) => void;
  onCloseGroup: () => void;
  selectedGroup: PeopleGroup | null;
}

export default function CampusView({
  university,
  onBack,
  onSelectGroup,
  onCloseGroup,
  selectedGroup,
}: Props) {
  const [selectedCountry, setSelectedCountry] = useState<CountryEnrollment | null>(
    null
  );

  const highlightedIds = useMemo(
    () => new Set(university.countries.map((country) => country.geoJsonId)),
    [university]
  );

  const activeGeoJsonId = selectedCountry?.geoJsonId ?? null;

  function handleMapCountryClick(geoJsonId: string) {
    const match =
      university.countries.find((country) => country.geoJsonId === geoJsonId) ??
      null;
    setSelectedCountry(match);
  }

  return (
    <div>
      <CampusHeader university={university} onBack={onBack} />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
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

        <div className="hidden lg:block">
          <WorldMap
            highlightedCountryIds={highlightedIds}
            activeCountryId={activeGeoJsonId}
            onCountryClick={handleMapCountryClick}
          />
        </div>
      </div>

      <PeopleGroupPanel group={selectedGroup} onClose={onCloseGroup} />
    </div>
  );
}
