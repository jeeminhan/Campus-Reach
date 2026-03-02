export type Position = [number, number]; // [longitude, latitude]

export interface PolygonGeometry {
  type: "Polygon";
  coordinates: Position[][];
}

export interface MultiPolygonGeometry {
  type: "MultiPolygon";
  coordinates: Position[][][];
}

export type Geometry = PolygonGeometry | MultiPolygonGeometry;

export interface GeoFeature {
  type: "Feature";
  properties: {
    id: string;
    name: string;
  };
  geometry: Geometry;
}

export interface GeoFeatureCollection {
  type: "FeatureCollection";
  features: GeoFeature[];
}
