import { NextRequest, NextResponse } from "next/server";
import { PeopleGroup } from "@/data/types";

const JP_BASE = "https://api.joshuaproject.net";
export const runtime = "nodejs";
export const maxDuration = 10;

export async function GET(req: NextRequest) {
  const fipsCode = req.nextUrl.searchParams.get("fipsCode");

  if (!fipsCode) {
    return NextResponse.json({ error: "fipsCode is required" }, { status: 400 });
  }

  const apiKey = process.env.JOSHUA_PROJECT_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const candidateUrls = [
    `${JP_BASE}/v1/people_groups.json`,
    "https://joshuaproject.net/api/v2/people_groups",
  ];

  let response: Response | null = null;
  let lastErrorStatus = 500;
  let lastErrorText = "Unknown error";

  for (const candidateUrl of candidateUrls) {
    const url = new URL(candidateUrl);
    url.searchParams.set("ROG3", fipsCode);
    url.searchParams.set("LeastReached", "Y");
    url.searchParams.set("api_key", apiKey);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8_000);
    let candidateResponse: Response;

    try {
      candidateResponse = await fetch(url.toString(), {
        next: { revalidate: 86_400 },
        signal: controller.signal,
      });
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      lastErrorStatus = 504;
      lastErrorText =
        error instanceof Error && error.name === "AbortError"
          ? "Request timed out after 8s"
          : error instanceof Error
            ? error.message
            : "Network error";
      continue;
    }

    clearTimeout(timeoutId);

    if (candidateResponse.ok) {
      response = candidateResponse;
      break;
    }

    lastErrorStatus = candidateResponse.status;
    lastErrorText = (await candidateResponse.text()).slice(0, 300);
  }

  if (!response) {
    return NextResponse.json(
      {
        error: `Joshua Project error: ${lastErrorStatus}`,
        detail: lastErrorText,
      },
      { status: lastErrorStatus }
    );
  }

  const raw = await response.json();
  const sourceGroups = Array.isArray(raw)
    ? raw
    : Array.isArray(raw.data)
      ? raw.data
      : [];

  const groups: PeopleGroup[] = sourceGroups.map((group: Record<string, unknown>) => {
    const photoAddress =
      typeof group.PeopleGroupPhotoURL === "string" && group.PeopleGroupPhotoURL
        ? group.PeopleGroupPhotoURL
        : typeof group.PhotoAddress === "string" && group.PhotoAddress.startsWith("http")
          ? group.PhotoAddress
          : typeof group.PhotoAddress === "string" && group.PhotoAddress
            ? `https://joshuaproject.net/assets/media/profiles/photos/${group.PhotoAddress}`
            : null;

    const percentEvangelicalRaw = group.PercentEvangelical;
    const parsedPercent =
      typeof percentEvangelicalRaw === "number"
        ? percentEvangelicalRaw
        : typeof percentEvangelicalRaw === "string" && percentEvangelicalRaw.trim() !== ""
          ? Number.parseFloat(percentEvangelicalRaw)
          : null;

    return {
      PeopleID3: String(group.PeopleID3 ?? ""),
      PeopNameInCountry: String(group.PeopNameInCountry ?? ""),
      PeopNameAcrossCountries: String(group.PeopNameAcrossCountries ?? ""),
      Ctry: String(group.Ctry ?? ""),
      ROG3: String(group.ROG3 ?? ""),
      Population: Number(group.Population ?? 0),
      PrimaryReligion: String(group.PrimaryReligion ?? ""),
      PrimaryLanguageName: String(group.PrimaryLanguageName ?? ""),
      PercentEvangelical:
        parsedPercent === null || Number.isNaN(parsedPercent) ? null : parsedPercent,
      JPScale: String(group.JPScale ?? ""),
      LeastReached: String(group.LeastReached ?? "").toUpperCase() === "Y",
      PhotoAddress: photoAddress,
      Summary: typeof group.Summary === "string" ? group.Summary : null,
    };
  });

  const seen = new Set<string>();
  const uniqueGroups = groups.filter((group) => {
    const dedupeKey = `${group.PeopleID3}|${group.ROG3}|${group.PeopNameInCountry}`;
    if (seen.has(dedupeKey)) {
      return false;
    }

    seen.add(dedupeKey);
    return true;
  });

  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Math.max(1, Math.min(50, parseInt(limitParam, 10))) : 50;

  const sorted = [...uniqueGroups].sort((a, b) => {
    const aScale = parseFloat(a.JPScale) || 99;
    const bScale = parseFloat(b.JPScale) || 99;
    return aScale - bScale;
  });

  return NextResponse.json({ data: sorted.slice(0, limit) });
}
