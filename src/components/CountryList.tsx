import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import { CountryEnrollment } from "@/data/types";
import { getFlagEmoji } from "@/lib/countryUtils";
import { formatCount } from "@/lib/formatters";

interface Props {
  countries: CountryEnrollment[];
  selectedFipsCode: string | null;
  onSelect: (c: CountryEnrollment) => void;
}

export default function CountryList({
  countries,
  selectedFipsCode,
  onSelect,
}: Props) {
  const total = countries.reduce((sum, country) => sum + country.studentCount, 0);

  return (
    <div>
      <p className="mb-3 text-xs uppercase tracking-widest text-slate-500">
        Countries of Origin
      </p>

      <div className="scrollbar-hide flex max-h-[420px] flex-col gap-2 overflow-y-auto">
        {countries.map((country) => {
          const pct = total > 0 ? ((country.studentCount / total) * 100).toFixed(1) : "0.0";
          const isActive = country.fipsCode === selectedFipsCode;

          return (
            <button
              key={`${country.fipsCode}-${country.countryName}`}
              type="button"
              onClick={() => onSelect(country)}
              className={clsx(
                "flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all duration-150",
                isActive
                  ? "border-sky-500/50 bg-sky-950/30 ring-1 ring-sky-400"
                  : "border-white/10 bg-slate-900/70 hover:border-white/20"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{getFlagEmoji(country.isoAlpha2)}</span>
                <div>
                  <p className="text-sm font-medium text-white">{country.countryName}</p>
                  <p className="text-xs text-slate-400">
                    {formatCount(country.studentCount)} students · {pct}%
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-500" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
