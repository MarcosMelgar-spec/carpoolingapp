"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import LocationInput from "@/components/LocationInput";

export default function NewTripPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    origin: "",
    origin_lat: "",
    origin_lng: "",
    destination: "",
    destination_lat: "",
    destination_lng: "",
    departure_at: "",
    available_seats: "3",
    price_per_seat: "0",
    description: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const { data, error } = await supabase.from("trips").insert({
      driver_id: user.id,
      origin: form.origin,
      origin_lat: parseFloat(form.origin_lat) || 0,
      origin_lng: parseFloat(form.origin_lng) || 0,
      destination: form.destination,
      destination_lat: parseFloat(form.destination_lat) || 0,
      destination_lng: parseFloat(form.destination_lng) || 0,
      departure_at: form.departure_at,
      available_seats: parseInt(form.available_seats),
      price_per_seat: parseFloat(form.price_per_seat),
      description: form.description || null,
    }).select().single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(`/trips/${data.id}`);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="bg-[#1e3a5f]">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-4">
          <Link href="/" className="text-white/50 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-white font-bold text-lg">Publicar nuevo viaje</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Ruta */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Ruta</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Origen</label>
                <LocationInput
                  value={form.origin}
                  onChange={(val) => setForm((p) => ({ ...p, origin: val }))}
                  onSelect={(loc) => setForm((p) => ({ ...p, origin: loc.name, origin_lat: String(loc.lat), origin_lng: String(loc.lng) }))}
                  placeholder="Ej: Rosario, Santa Fe"
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-center">
                <div className="flex flex-col items-center gap-1 text-slate-300">
                  <div className="w-px h-3 bg-slate-300" />
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v10.586l3.293-3.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L9 14.586V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Destino</label>
                <LocationInput
                  value={form.destination}
                  onChange={(val) => setForm((p) => ({ ...p, destination: val }))}
                  onSelect={(loc) => setForm((p) => ({ ...p, destination: loc.name, destination_lat: String(loc.lat), destination_lng: String(loc.lng) }))}
                  placeholder="Ej: Buenos Aires"
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Fecha */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Fecha y hora</h2>
            <input
              name="departure_at"
              type="datetime-local"
              required
              value={form.departure_at}
              onChange={handleChange}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          {/* Asientos y precio */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Capacidad y precio</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Asientos disponibles</label>
                <select
                  name="available_seats"
                  value={form.available_seats}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? "lugar" : "lugares"}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Precio por asiento ($)</label>
                <input
                  name="price_per_seat"
                  type="number"
                  min="0"
                  step="100"
                  required
                  value={form.price_per_seat}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Descripción <span className="normal-case font-normal text-slate-400">(opcional)</span></h2>
            <p className="text-xs text-slate-400 mb-3">Paradas, equipaje permitido, preferencias de viaje</p>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Ej: Salgo del centro de Rosario. Acepto mascotas pequeñas..."
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1e3a5f] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#16304f] disabled:opacity-50 transition-colors"
          >
            {loading ? "Publicando..." : "Publicar viaje"}
          </button>
        </form>
      </div>
    </div>
  );
}
