import universitiesData from "@/data/universities.json";
import { UniversityRecord } from "@/data/types";

const universities = universitiesData as UniversityRecord[];

export function searchUniversities(query: string): UniversityRecord[] {
  const q = query.toLowerCase().trim();
  if (!q) {
    return getTop25Universities();
  }

  return universities.filter(
    (u) =>
      u.name.toLowerCase().includes(q) ||
      u.city.toLowerCase().includes(q) ||
      u.state.toLowerCase().includes(q)
  );
}

export function getUniversityById(id: string): UniversityRecord | null {
  return universities.find((u) => u.id === id) ?? null;
}

export function getTop25Universities(): UniversityRecord[] {
  return [...universities]
    .sort((a, b) => b.totalInternational - a.totalInternational)
    .slice(0, 25);
}
