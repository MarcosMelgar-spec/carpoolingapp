"use client";

import { useState, useEffect, useRef } from "react";

interface Location {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (location: Location) => void;
  placeholder?: string;
  className?: string;
}

function formatName(result: any): string {
  const a = result.address ?? {};
  const city = a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? "";
  const state = a.state ?? "";
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  return result.display_name.split(",").slice(0, 2).join(",").trim();
}

export default function LocationInput({ value, onChange, onSelect, placeholder, className }: Props) {
  const [results, setResults] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedRef.current) { selectedRef.current = false; return; }
    if (value.length < 2) { setResults([]); setOpen(false); return; }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&countrycodes=ar&format=json&limit=6&addressdetails=1`,
          { headers: { "Accept-Language": "es" } }
        );
        const data = await res.json();
        const locations: Location[] = data.map((r: any) => ({
          name: formatName(r),
          displayName: r.display_name,
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
        }));
        // Deduplicar por name
        const seen = new Set<string>();
        const unique = locations.filter((l) => {
          if (seen.has(l.name)) return false;
          seen.add(l.name);
          return true;
        });
        setResults(unique);
        setOpen(unique.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, [value]);

  function handleSelect(location: Location) {
    selectedRef.current = true;
    onChange(location.name);
    onSelect?.(location);
    setOpen(false);
    setResults([]);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {results.map((location, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => handleSelect(location)}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-center gap-3"
              >
                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-slate-700 truncate">{location.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
