// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Geospatial Utilities
//  Haversine distance + coordinate helpers for Local discovery
// ─────────────────────────────────────────────────────────────

export interface Coordinates {
  lat: number;
  lon: number;
}

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine distance between two points on Earth (in kilometers).
 * Returns null if either coordinate is invalid.
 */
export function haversineDistance(a: Coordinates, b: Coordinates): number | null {
  if (!isValidCoord(a) || !isValidCoord(b)) return null;

  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return EARTH_RADIUS_KM * c;
}

/** Check if coordinates are valid finite numbers */
export function isValidCoord(c: Coordinates): boolean {
  return (
    typeof c.lat === 'number' &&
    typeof c.lon === 'number' &&
    Number.isFinite(c.lat) &&
    Number.isFinite(c.lon) &&
    c.lat >= -90 && c.lat <= 90 &&
    c.lon >= -180 && c.lon <= 180
  );
}

/** Format distance as human-readable string */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
