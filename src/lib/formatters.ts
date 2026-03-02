export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatPercent(n: number | null): string {
  if (n === null || n === 0) {
    return "< 0.1%";
  }

  return `${n.toFixed(1)}%`;
}

export function jpScaleLabel(scale: string): string {
  const num = parseFloat(scale);

  if (num <= 2) {
    return "Unreached";
  }

  if (num <= 3) {
    return "Minimally Reached";
  }

  return "Superficially Reached";
}

export function jpScaleClasses(scale: string): string {
  const num = parseFloat(scale);

  if (num <= 2) {
    return "border-red-500/40 bg-red-900/50 text-red-300";
  }

  if (num <= 3) {
    return "border-orange-500/40 bg-orange-900/50 text-orange-300";
  }

  return "border-amber-500/40 bg-amber-900/50 text-amber-300";
}
