import { ArrowLeft } from "lucide-react";
import { UniversityRecord } from "@/data/types";
import { getFlagEmoji } from "@/lib/countryUtils";
import { formatCount } from "@/lib/formatters";

interface Props {
  university: UniversityRecord;
  onBack: () => void;
}

export default function CampusHeader({ university, onBack }: Props) {
  const topFlags = university.countries
    .slice(0, 6)
    .map((country) => getFlagEmoji(country.isoAlpha2));

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
      >
        <ArrowLeft size={16} /> Back to search
      </button>

      <h2 className="mb-1 text-3xl font-bold text-white">{university.name}</h2>
      <p className="mb-3 text-slate-400">
        {university.city}, {university.state}
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <span className="font-semibold text-sky-400">
          {formatCount(university.totalInternational)} international students
        </span>
        <span className="text-2xl">{topFlags.join(" ")}</span>
      </div>
    </div>
  );
}
