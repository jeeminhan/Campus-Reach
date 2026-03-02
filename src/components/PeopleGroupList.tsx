"use client";

import { PeopleGroup } from "@/data/types";
import { usePeopleGroups } from "@/lib/usePeopleGroups";
import PeopleGroupCard from "./PeopleGroupCard";

interface Props {
  fipsCode: string;
  countryName: string;
  onSelect: (pg: PeopleGroup) => void;
}

export default function PeopleGroupList({
  fipsCode,
  countryName,
  onSelect,
}: Props) {
  const { data, loading, error } = usePeopleGroups(fipsCode);

  return (
    <div>
      <p className="mb-3 text-xs uppercase tracking-widest text-slate-500">
        Unreached Peoples in {countryName}
      </p>

      {loading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-20 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {data && data.length === 0 && (
        <p className="rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-slate-400">
          No least-reached people groups found for this country in the Joshua
          Project database.
        </p>
      )}

      {data && data.length > 0 && (
        <div className="scrollbar-hide flex max-h-[360px] flex-col gap-2 overflow-y-auto">
          {data.map((group) => (
            <PeopleGroupCard
              key={`${group.PeopleID3}-${group.ROG3}-${group.PeopNameInCountry}`}
              group={group}
              onClick={() => onSelect(group)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
