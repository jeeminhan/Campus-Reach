import clsx from "clsx";
import { PeopleGroup } from "@/data/types";
import {
  formatCount,
  formatPercent,
  jpScaleClasses,
  jpScaleLabel,
} from "@/lib/formatters";

interface Props {
  group: PeopleGroup;
  onClick: () => void;
}

export default function PeopleGroupCard({ group, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-left transition-all duration-150 hover:border-white/20"
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug text-white">
          {group.PeopNameInCountry}
        </p>
        <span
          className={clsx(
            "shrink-0 rounded border px-2 py-0.5 text-xs",
            jpScaleClasses(group.JPScale)
          )}
        >
          {jpScaleLabel(group.JPScale)}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400">
        <span>{formatCount(group.Population)} people</span>
        <span>{group.PrimaryReligion}</span>
        <span>{formatPercent(group.PercentEvangelical)} evangelical</span>
      </div>
    </button>
  );
}
