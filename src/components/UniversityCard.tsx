import clsx from "clsx";
import { UniversityRecord } from "@/data/types";
import { getFlagEmoji } from "@/lib/countryUtils";
import { formatCount } from "@/lib/formatters";

interface Props {
  university: UniversityRecord;
  onClick: () => void;
}

export default function UniversityCard({ university, onClick }: Props) {
  const topFlags = university.countries
    .slice(0, 5)
    .map((country) => getFlagEmoji(country.isoAlpha2));

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "w-full rounded-xl border border-white/10 bg-slate-900/70 p-4 text-left",
        "transition-all duration-150 hover:border-sky-500/40 hover:bg-slate-800/70"
      )}
    >
      <p className="mb-1 font-semibold leading-snug text-white">{university.name}</p>
      <p className="mb-3 text-xs text-slate-400">
        {university.city}, {university.state}
      </p>
      <p className="mb-2 text-sm font-semibold text-sky-400">
        {formatCount(university.totalInternational)} international students
      </p>
      <div className="text-xl">{topFlags.join(" ")}</div>
    </button>
  );
}
