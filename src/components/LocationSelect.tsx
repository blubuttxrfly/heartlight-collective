import { useState, useCallback, useEffect, useRef } from "react";
import { MapPin, Search, X, Loader2 } from "lucide-react";
import { useForwardGeocode, type GeocodeResult } from "../hooks/useForwardGeocode";
import type { LocationData } from "../types/ces";

interface LocationSelectProps {
  value: LocationData | null;
  onChange: (loc: LocationData | null) => void;
  theme?: "dark" | "light";
  allowRemote?: boolean;
  placeholder?: string;
  label?: string;
}

/**
 * LocationSelect — Heartlight Collective themed location picker
 *
 * Search for a place via OpenStreetMap, select from results,
 * and emit structured LocationData. Respects light/dark theme.
 */
export default function LocationSelect({
  value,
  onChange,
  theme: themeProp,
  allowRemote = true,
  placeholder = "Search city, town, or place…",
  label = "Location",
}: LocationSelectProps) {
  const [query, setQuery] = useState(value?.raw ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect theme from document if not provided as prop
  const [detectedTheme, setDetectedTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => {
      const t = el.getAttribute("data-theme");
      setDetectedTheme(t === "light" ? "light" : "dark");
    });
    observer.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    setDetectedTheme(el.getAttribute("data-theme") === "light" ? "light" : "dark");
    return () => observer.disconnect();
  }, []);

  const theme = themeProp ?? detectedTheme;
  const isDark = theme === "dark";

  const { results, status } = useForwardGeocode(query);
  const isLoading = status === "loading";
  const hasResults = results.length > 0 && isOpen;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!hasResults) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((i) => (i + 1) % results.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((i) => (i - 1 + results.length) % results.length);
          break;
        case "Enter":
          e.preventDefault();
          if (results[highlightedIndex]) {
            selectResult(results[highlightedIndex]);
          }
          break;
        case "Escape":
          setIsOpen(false);
          break;
      }
    },
    [hasResults, results, highlightedIndex]
  );

  function selectResult(result: GeocodeResult) {
    const loc: LocationData = {
      raw: result.displayName,
      lat: result.lat,
      lon: result.lon,
      city: result.address?.city ?? null,
      region: result.address?.state ?? null,
      country: result.address?.country ?? null,
      continent: result.address?.continent ?? null,
    };
    onChange(loc);
    setQuery(result.displayName);
    setIsOpen(false);
  }

  function clearLocation() {
    onChange(null);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  }

  function handleRemoteAnywhere() {
    const remoteLoc: LocationData = {
      raw: "Remote / Anywhere",
      lat: 0,
      lon: 0,
      city: null,
      region: null,
      country: null,
      continent: null,
    };
    onChange(remoteLoc);
    setQuery("Remote / Anywhere");
    setIsOpen(false);
  }

  // Theme-aware class helpers
  const inputBase = isDark
    ? "bg-void-900/60 border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/30"
    : "bg-white border-stone-300 text-stone-800 placeholder:text-stone-400 focus:border-gold-500";

  const dropdownBase = isDark
    ? "bg-void-900 border-lavender/10 shadow-lg shadow-void-950/50"
    : "bg-white border-stone-200 shadow-lg shadow-stone-200/50";

  const resultHover = isDark ? "hover:bg-void-800/60" : "hover:bg-stone-50";
  const resultActive = isDark ? "bg-void-800/40" : "bg-stone-100";
  const resultText = isDark ? "text-cream" : "text-stone-800";
  const resultMuted = isDark ? "text-lavender/50" : "text-stone-500";

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className={`block text-xs uppercase tracking-widest font-sans mb-2 ${isDark ? "text-lavender/40" : "text-stone-500"}`}>
          {label}
        </label>
      )}

      <div className="relative">
        <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-lavender/30" : "text-stone-400"}`} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-2.5 rounded-lg border focus:outline-none transition-colors ${inputBase}`}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
        />
        {isLoading && (
          <Loader2 className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin ${isDark ? "text-lavender/30" : "text-stone-400"}`} />
        )}
        {!isLoading && query && (
          <button
            onClick={clearLocation}
            className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? "text-lavender/30 hover:text-cream" : "text-stone-400 hover:text-stone-600"}`}
            aria-label="Clear location"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {hasResults && (
        <div className={`absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border ${dropdownBase}`}>
          {allowRemote && (
            <button
              onClick={handleRemoteAnywhere}
              className={`w-full text-left px-4 py-2.5 transition-colors border-b ${isDark ? "border-lavender/5" : "border-stone-100"} ${resultHover} ${resultText}`}
            >
              <div className="flex items-center gap-2">
                <Search className={`w-3.5 h-3.5 ${isDark ? "text-lavender/40" : "text-stone-400"}`} />
                <span className="text-sm">Remote / Anywhere</span>
              </div>
              <div className={`text-xs mt-0.5 pl-6 ${resultMuted}`}>No specific location</div>
            </button>
          )}

          {results.map((result, i) => {
            const isHighlighted = i === highlightedIndex;
            return (
              <button
                key={`${result.lat}-${result.lon}-${i}`}
                onClick={() => selectResult(result)}
                onMouseEnter={() => setHighlightedIndex(i)}
                className={`w-full text-left px-4 py-2.5 transition-colors ${i > 0 ? (isDark ? "border-t border-lavender/5" : "border-t border-stone-100") : ""} ${isHighlighted ? resultActive : resultHover} ${resultText}`}
              >
                <div className="text-sm truncate">{result.displayName}</div>
                {result.address && (
                  <div className={`text-xs mt-0.5 truncate ${resultMuted}`}>
                    {[result.address.continent, result.address.country, result.address.state]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Selected location summary */}
      {value && !isOpen && (
        <div className={`mt-2 flex items-center gap-2 text-xs ${isDark ? "text-green-400/80" : "text-green-600"}`}>
          <MapPin className="w-3 h-3" />
          <span>
            {[value.city, value.region, value.country].filter(Boolean).join(", ") || value.raw}
          </span>
          {value.continent && (
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${isDark ? "bg-green-400/10 border border-green-400/20" : "bg-green-100 border border-green-200"}`}>
              {value.continent}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
