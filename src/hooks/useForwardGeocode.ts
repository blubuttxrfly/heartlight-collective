import { useEffect, useRef, useState } from "react";

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_USER_AGENT = "Heartlight-Collective/1.0";

export interface GeocodeResult {
  lat: number;
  lon: number;
  displayName: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    continent?: string;
  };
}

export type GeocodeStatus = "idle" | "loading" | "success" | "error";

const cache = new Map<string, GeocodeResult[]>();

/**
 * useForwardGeocode
 *
 * Searches OpenStreetMap Nominatim for a place name and returns
 * up to 5 matching coordinates with structured address data.
 * Results are client-cached to respect rate limits.
 */
export function useForwardGeocode(query: string): {
  results: GeocodeResult[];
  status: GeocodeStatus;
} {
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [status, setStatus] = useState<GeocodeStatus>("idle");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setStatus("idle");
      return;
    }

    if (cache.has(trimmed)) {
      setResults(cache.get(trimmed)!);
      setStatus("success");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");

    const url = `${NOMINATIM_ENDPOINT}?q=${encodeURIComponent(trimmed)}&format=json&limit=5&addressdetails=1&accept-language=en`;

    fetch(url, {
      headers: { "User-Agent": NOMINATIM_USER_AGENT },
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Forward geocode failed");
        return res.json();
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        const parsed: GeocodeResult[] = (Array.isArray(data) ? data : [])
          .map((item: any) => ({
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            displayName: item.display_name ?? "Unknown",
            address: item.address
              ? {
                  city: item.address.city ?? item.address.town ?? item.address.village ?? undefined,
                  state: item.address.state ?? undefined,
                  country: item.address.country ?? undefined,
                  continent: item.address.continent ?? undefined,
                }
              : undefined,
          }))
          .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lon));

        cache.set(trimmed, parsed);
        setResults(parsed);
        setStatus("success");
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setResults([]);
        setStatus("error");
      });

    return () => controller.abort();
  }, [query]);

  return { results, status };
}
