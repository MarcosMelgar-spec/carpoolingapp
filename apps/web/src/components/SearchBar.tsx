"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import LocationInput from "./LocationInput";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [origin, setOrigin] = useState(searchParams.get("origin") ?? "");
  const [destination, setDestination] = useState(searchParams.get("destination") ?? "");
  const [date, setDate] = useState(searchParams.get("date") ?? "");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (origin.trim()) params.set("origin", origin.trim());
    if (destination.trim()) params.set("destination", destination.trim());
    if (date) params.set("date", date);
    router.push(`/?${params.toString()}`);
  }

  function handleClear() {
    setOrigin("");
    setDestination("");
    setDate("");
    router.push("/");
  }

  const hasFilters = origin || destination || date;

  return (
    <form onSubmit={handleSearch} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Origen</label>
          <LocationInput
            value={origin}
            onChange={setOrigin}
            placeholder="Ej: Rosario"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Destino</label>
          <LocationInput
            value={destination}
            onChange={setDestination}
            placeholder="Ej: Buenos Aires"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="submit"
          className="bg-[#1e3a5f] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#16304f] transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Buscar viajes
        </button>
        {hasFilters && (
          <button
            type="button"
            onClick={handleClear}
            className="text-slate-400 hover:text-slate-700 text-sm transition-colors px-3 py-2"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </form>
  );
}
