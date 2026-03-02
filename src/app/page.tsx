"use client";

import { useState } from "react";
import CampusView from "@/components/CampusView";
import SearchView from "@/components/SearchView";
import { PeopleGroup, UniversityRecord } from "@/data/types";

export default function Home() {
  const [university, setUniversity] = useState<UniversityRecord | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<PeopleGroup | null>(null);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      {!university ? (
        <SearchView onSelect={setUniversity} />
      ) : (
        <CampusView
          university={university}
          onBack={() => {
            setUniversity(null);
            setSelectedGroup(null);
          }}
          onSelectGroup={setSelectedGroup}
          onCloseGroup={() => setSelectedGroup(null)}
          selectedGroup={selectedGroup}
        />
      )}
    </main>
  );
}
