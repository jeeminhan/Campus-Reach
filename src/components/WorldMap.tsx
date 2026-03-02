"use client";

import worldGeoJson from "@/data/world.json";
import { GeoFeatureCollection, Geometry, Position } from "@/types/geojson";

interface Props {
  highlightedCountryIds: Set<string>;
  activeCountryId: string | null;
  onCountryClick: (geoJsonId: string) => void;
}

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 560;

function projectToMap(longitude: number, latitude: number) {
  const x = ((longitude + 180) / 360) * MAP_WIDTH;
  const y = ((90 - latitude) / 180) * MAP_HEIGHT;
  return [x, y] as const;
}

function ringToPath(ring: Position[]) {
  if (!ring.length) {
    return "";
  }

  const [firstLon, firstLat] = ring[0];
  const [firstX, firstY] = projectToMap(firstLon, firstLat);
  let d = `M ${firstX.toFixed(2)} ${firstY.toFixed(2)}`;

  for (let i = 1; i < ring.length; i += 1) {
    const [lon, lat] = ring[i];
    const [x, y] = projectToMap(lon, lat);
    d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }

  d += " Z";
  return d;
}

function geometryToPath(geometry: Geometry) {
  if (geometry.type === "Polygon") {
    return geometry.coordinates.map((ring) => ringToPath(ring)).join(" ");
  }

  return geometry.coordinates
    .flatMap((polygon) => polygon.map((ring) => ringToPath(ring)))
    .join(" ");
}

export default function WorldMap({
  highlightedCountryIds,
  activeCountryId,
  onCountryClick,
}: Props) {
  const geo = worldGeoJson as GeoFeatureCollection;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-white">Source Countries</h3>
          <p className="text-sm text-slate-300">
            Highlighted countries represent where students at this campus come
            from.
          </p>
        </div>
        <p className="text-xs text-slate-400">
          Click a highlighted country to sync with the country list.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-950/80 p-3 md:p-4">
        <div className="relative mx-auto aspect-[16/9] w-full max-w-4xl">
          <svg viewBox="0 0 1000 560" className="h-full w-full" role="img" aria-label="World map">
            <defs>
              <linearGradient id="ocean" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#082f49" />
                <stop offset="45%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
            </defs>

            <rect x="0" y="0" width="1000" height="560" fill="url(#ocean)" rx="20" />

            <g stroke="#334155" strokeWidth="1" opacity="0.35">
              <path d="M0 93h1000" />
              <path d="M0 186h1000" />
              <path d="M0 280h1000" />
              <path d="M0 373h1000" />
              <path d="M0 466h1000" />
              <path d="M166 0v560" />
              <path d="M333 0v560" />
              <path d="M500 0v560" />
              <path d="M666 0v560" />
              <path d="M833 0v560" />
            </g>

            <g>
              {geo.features.map((feature) => {
                const featureId = feature.properties?.id as string | undefined;
                if (!featureId) {
                  return null;
                }

                const isActive = featureId === activeCountryId;
                const isSource = highlightedCountryIds.has(featureId);
                const path = geometryToPath(feature.geometry);

                const fill = isActive ? "#38bdf8" : isSource ? "#1d4ed8" : "#1e293b";
                const stroke = isActive ? "#ffffff" : isSource ? "#93c5fd" : "#334155";
                const strokeWidth = isActive ? 1.5 : isSource ? 1 : 0.5;

                return (
                  <path
                    key={featureId}
                    d={path}
                    role={isSource ? "button" : undefined}
                    tabIndex={isSource ? 0 : -1}
                    aria-label={feature.properties.name}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    className={isSource ? "cursor-pointer transition-all duration-150" : undefined}
                    onClick={() => {
                      if (isSource) {
                        onCountryClick(featureId);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (!isSource) {
                        return;
                      }

                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onCountryClick(featureId);
                      }
                    }}
                  >
                    <title>{feature.properties.name}</title>
                  </path>
                );
              })}
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}
