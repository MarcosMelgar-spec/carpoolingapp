import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import TripCard from "@/components/TripCard";
import SearchBar from "@/components/SearchBar";
import type { Trip } from "@carpoolingapp/shared";
import Link from "next/link";
import { Suspense } from "react";

interface SearchParams {
  origin?: string;
  destination?: string;
  date?: string;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("trips")
    .select("*, driver:profiles!driver_id(id, full_name, rating)")
    .eq("status", "active")
    .gte("departure_at", new Date().toISOString())
    .order("departure_at", { ascending: true })
    .limit(50);

  if (filters.origin) {
    query = query.ilike("origin", `%${filters.origin}%`);
  }
  if (filters.destination) {
    query = query.ilike("destination", `%${filters.destination}%`);
  }
  if (filters.date) {
    const from = `${filters.date}T00:00:00`;
    const to = `${filters.date}T23:59:59`;
    query = query.gte("departure_at", from).lte("departure_at", to);
  }

  const { data: trips } = await query;
  const hasFilters = filters.origin || filters.destination || filters.date;

  return (
    <>
      <Navbar userEmail={user?.email} />

      <div className="bg-[#1e3a5f]">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold text-white mb-1">Viajes disponibles</h1>
          <p className="text-white/60 text-sm">Encontrá tu próximo viaje compartido en Argentina</p>
        </div>
      </div>

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Suspense>
            <SearchBar />
          </Suspense>
        </div>
      </div>

      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>
              <strong className="text-slate-800">{trips?.length ?? 0}</strong>
              {hasFilters ? " viajes encontrados" : " viajes activos"}
            </span>
          </div>
          {!user && (
            <Link href="/auth/register" className="ml-auto text-sm text-sky-600 font-medium hover:underline">
              Registrate gratis para reservar →
            </Link>
          )}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {!trips || trips.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {hasFilters ? (
              <>
                <p className="text-lg font-semibold text-slate-700">Sin resultados</p>
                <p className="text-sm text-slate-400 mt-1 mb-6">No hay viajes que coincidan con tu búsqueda</p>
                <Link href="/" className="inline-block text-sky-600 text-sm font-medium hover:underline">
                  Ver todos los viajes
                </Link>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-slate-700">No hay viajes disponibles</p>
                <p className="text-sm text-slate-400 mt-1 mb-6">Sé el primero en publicar uno</p>
                {user ? (
                  <Link href="/trips/new" className="inline-block bg-[#1e3a5f] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#16304f] transition-colors">
                    Publicar viaje
                  </Link>
                ) : (
                  <Link href="/auth/register" className="inline-block bg-[#1e3a5f] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#16304f] transition-colors">
                    Crear cuenta
                  </Link>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(trips as Trip[]).map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
