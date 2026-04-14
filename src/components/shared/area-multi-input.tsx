"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Multi-area chip input backed by the Google Places Autocomplete web service.
 *
 * - User types → calls the Places Autocomplete REST API with `types=geocode`
 *   and an SA (`components=country:za`) bias.
 * - Suggestions appear in a dropdown; clicking one adds it as a chip.
 * - User can also press Enter on a plain typed value to accept it as-is
 *   (falls back to a raw text chip when Places is unavailable or offline).
 * - Requires `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` env var. If missing, the
 *   component still works as a plain text chip input — no crash.
 *
 * Debounced at 250ms to keep the Places billing down.
 */
interface AreaMultiInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

interface PlacesSuggestion {
  place_id: string;
  description: string;
}

const PLACES_API_KEY =
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY : undefined;

export function AreaMultiInput({
  value,
  onChange,
  disabled,
  placeholder = "Start typing an area...",
}: AreaMultiInputProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlacesSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions (debounced)
  useEffect(() => {
    if (!query.trim() || !PLACES_API_KEY) {
      setSuggestions([]);
      return;
    }

    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const url = new URL(
          "/api/places/autocomplete",
          typeof window !== "undefined" ? window.location.origin : ""
        );
        url.searchParams.set("input", query);
        url.searchParams.set("types", "geocode");
        url.searchParams.set("components", "country:za");

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`Places API ${res.status}`);
        const body = await res.json();
        if (body.status === "OK" && Array.isArray(body.predictions)) {
          setSuggestions(
            body.predictions.slice(0, 6).map((p: { place_id: string; description: string }) => ({
              place_id: p.place_id,
              description: p.description,
            }))
          );
          setOpen(true);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error("[area-multi-input] places fetch failed:", err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(handle);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function addArea(area: string) {
    const trimmed = area.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setQuery("");
    setSuggestions([]);
    setOpen(false);
  }

  function removeArea(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      // If a suggestion is highlighted, take that; otherwise add the raw query
      if (suggestions[0]) {
        addArea(suggestions[0].description);
      } else if (query.trim()) {
        addArea(query.trim());
      }
    } else if (e.key === "Backspace" && !query && value.length > 0) {
      removeArea(value.length - 1);
    }
  }

  return (
    <div ref={containerRef} className="relative space-y-2">
      {/* Chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((area, i) => (
            <span
              key={`${area}-${i}`}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs text-blue-900"
            >
              <MapPin className="h-3 w-3" />
              {area}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeArea(i)}
                  className="ml-0.5 rounded-full hover:bg-blue-100 transition-colors"
                  aria-label={`Remove ${area}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query && suggestions.length > 0 && setOpen(true)}
          disabled={disabled}
          placeholder={value.length === 0 ? placeholder : "Add another area..."}
          className="pr-8"
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Suggestion dropdown */}
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border bg-white shadow-md">
          {suggestions.map((s) => (
            <button
              key={s.place_id}
              type="button"
              onClick={() => addArea(s.description)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                "hover:bg-muted focus:bg-muted focus:outline-none"
              )}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{s.description}</span>
            </button>
          ))}
        </div>
      )}

      {/* Hint when Places is disabled */}
      {!PLACES_API_KEY && (
        <p className="text-[11px] text-muted-foreground">
          Type an area and press Enter to add it. Google Places suggestions are disabled.
        </p>
      )}
    </div>
  );
}
