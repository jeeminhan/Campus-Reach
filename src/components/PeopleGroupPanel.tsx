"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { PeopleGroup } from "@/data/types";
import {
  formatCount,
  formatPercent,
  jpScaleClasses,
  jpScaleLabel,
} from "@/lib/formatters";

interface Props {
  group: PeopleGroup | null;
  onClose: () => void;
}

export default function PeopleGroupPanel({ group, onClose }: Props) {
  return (
    <AnimatePresence>
      {group && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50"
          />

          <motion.div
            key={group.PeopleID3}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-slate-900"
          >
            <div className="p-6">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <p className="mb-1 text-xs uppercase tracking-widest text-slate-500">
                    People Group
                  </p>
                  <h2 className="text-2xl font-bold text-white">
                    {group.PeopNameInCountry}
                  </h2>
                  {group.PeopNameAcrossCountries !== group.PeopNameInCountry && (
                    <p className="mt-0.5 text-sm text-slate-400">
                      Also known as: {group.PeopNameAcrossCountries}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <span
                className={clsx(
                  "mb-6 inline-block rounded-full border px-3 py-1 text-sm",
                  jpScaleClasses(group.JPScale)
                )}
              >
                {jpScaleLabel(group.JPScale)} · JP Scale {group.JPScale}
              </span>

              <div className="mb-6 grid grid-cols-2 gap-3">
                <Stat label="Country" value={group.Ctry} />
                <Stat label="Population" value={formatCount(group.Population)} />
                <Stat label="Primary Religion" value={group.PrimaryReligion} />
                <Stat label="Primary Language" value={group.PrimaryLanguageName} />
                <Stat
                  label="Evangelical"
                  value={formatPercent(group.PercentEvangelical)}
                />
              </div>

              {group.PercentEvangelical !== null && (
                <div className="mb-6">
                  <p className="mb-1 text-xs text-slate-400">
                    {formatPercent(group.PercentEvangelical)} Evangelical
                  </p>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-sky-500"
                      style={{
                        width: `${Math.min(group.PercentEvangelical, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {group.Summary && (
                <div className="mb-6">
                  <p className="mb-2 text-xs uppercase tracking-widest text-slate-500">
                    About
                  </p>
                  <p className="text-sm leading-relaxed text-slate-300">
                    {group.Summary}
                  </p>
                </div>
              )}

              {group.PhotoAddress && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={group.PhotoAddress}
                  alt={group.PeopNameInCountry}
                  className="mb-6 w-full rounded-xl object-cover"
                />
              )}

              <div className="border-t border-white/10 pt-6">
                <p className="mb-3 text-xs uppercase tracking-widest text-slate-500">
                  Take Action
                </p>
                <a
                  href={`https://joshuaproject.net/people_groups/${group.PeopleID3}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-xl bg-sky-600 py-3 text-center font-semibold text-white transition hover:bg-sky-500"
                >
                  View on Joshua Project →
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-800/60 px-3 py-3">
      <p className="mb-0.5 text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-sm font-medium text-white">{value}</p>
    </div>
  );
}
