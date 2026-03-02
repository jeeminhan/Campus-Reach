"use client";

import { useMemo, useState } from "react";
import { UniversityRecord } from "@/data/types";
import { getTop25Universities, searchUniversities } from "@/lib/universitySearch";
import UniversityCard from "./UniversityCard";

interface Props {
  onSelect: (u: UniversityRecord) => void;
}

export default function SearchView({ onSelect }: Props) {
  const [query, setQuery] = useState("");

  const results = useMemo(
    () => (query.trim() ? searchUniversities(query) : getTop25Universities()),
    [query]
  );

  return (
    <div>
      <div className="mb-10">
        <h2 className="mb-2 text-4xl font-bold">Find Your Campus.</h2>
        <p className="text-lg text-slate-400">
          See the unreached peoples behind every campus.
        </p>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search universities..."
        className="mb-8 w-full max-w-lg rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
      />

      <p className="mb-4 text-xs uppercase tracking-widest text-slate-500">
        {query.trim()
          ? `${results.length} results`
          : "Top 25 by international enrollment"}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((university) => (
          <UniversityCard
            key={university.id}
            university={university}
            onClick={() => onSelect(university)}
          />
        ))}
      </div>
    </div>
  );
}
