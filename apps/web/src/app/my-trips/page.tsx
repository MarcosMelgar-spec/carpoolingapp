import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import TabSwitcher from "./TabSwitcher";

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusLabel: Record<string, { label: string; class: string }> = {
  active:    { label: "Activo",     class: "bg-green-100 text-green-700" },
  full:      { label: "Completo",   class: "bg-amber-100 text-amber-700" },
  cancelled: { label: "Cancelado",  class: "bg-red-100 text-red-700" },
  completed: { label: "Completado", class: "bg-slate-100 text-slate-600" },
  pending:   { label: "Pendiente",  class: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Confirmada", class: "bg-green-100 text-green-700" },
};

export default async function MyTripsPage({ searchParams }: Props) {
  const { tab = "passenger" } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Viajes como pasajero
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, trip:trips(id, origin, destination, departure_at, price_per_seat, status, driver:profiles!driver_id(full_name))")
    .eq("passenger_id", user.id)
    .order("created_at", { ascending: false });

  // Viajes como conductor
  const { data: driverTrips } = await supabase
    .from("trips")
    .select("*, bookings:bookings(count)")
    .eq("driver_id", user.id)
    .order("departure_at", { ascending: false });

  const upcomingBookings = bookings?.filter(
    (b) => b.status !== "cancelled" && new Date(b.trip?.departure_at) > new Date()
  ) ?? [];
  const pastBookings = bookings?.filter(
    (b) => b.status === "cancelled" || new Date(b.trip?.departure_at) <= new Date()
  ) ?? [];

  const upcomingTrips = driverTrips?.filter(
    (t) => t.status !== "cancelled" && new Date(t.departure_at) > new Date()
  ) ?? [];
  const pastTrips = driverTrips?.filter(
    (t) => t.status === "cancelled" || new Date(t.departure_at) <= new Date()
  ) ?? [];

  return (
    <>
      <Navbar userEmail={user.email} />

      <div className="bg-[#1e3a5f]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-white">Mis viajes</h1>
          <p className="text-white/60 text-sm mt-0.5">Gestioná tus reservas y viajes publicados</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <TabSwitcher activeTab={tab} />

        {tab === "passenger" && (
          <div className="space-y-8 mt-6">
            {/* Próximos */}
            <section>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Próximos ({upcomingBookings.length})
              </h2>
              {upcomingBookings.length === 0 ? (
                <EmptyState
                  message="No tenés viajes próximos reservados"
                  action={<Link href="/" className="text-sky-600 text-sm font-medium hover:underline">Buscar viajes →</Link>}
                />
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              )}
            </section>

            {/* Historial */}
            {pastBookings.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Historial ({pastBookings.length})
                </h2>
                <div className="space-y-3">
                  {pastBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} muted />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {tab === "driver" && (
          <div className="space-y-8 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Próximos ({upcomingTrips.length})
              </h2>
              <Link
                href="/trips/new"
                className="bg-[#1e3a5f] text-white text-sm px-4 py-2 rounded-lg font-semibold hover:bg-[#16304f] transition-colors"
              >
                + Publicar viaje
              </Link>
            </div>

            {upcomingTrips.length === 0 ? (
              <EmptyState
                message="No tenés viajes publicados próximos"
                action={<Link href="/trips/new" className="text-sky-600 text-sm font-medium hover:underline">Publicar un viaje →</Link>}
              />
            ) : (
              <div className="space-y-3">
                {upcomingTrips.map((trip) => (
                  <DriverTripCard key={trip.id} trip={trip} />
                ))}
              </div>
            )}

            {pastTrips.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Historial ({pastTrips.length})
                </h2>
                <div className="space-y-3">
                  {pastTrips.map((trip) => (
                    <DriverTripCard key={trip.id} trip={trip} muted />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-6 py-10 text-center">
      <p className="text-slate-500 text-sm mb-2">{message}</p>
      {action}
    </div>
  );
}

function BookingCard({ booking, muted = false }: { booking: any; muted?: boolean }) {
  const trip = booking.trip;
  if (!trip) return null;
  const st = statusLabel[booking.status] ?? statusLabel.pending;

  return (
    <Link href={`/trips/${trip.id}`}>
      <div className={`bg-white border rounded-xl px-5 py-4 hover:border-sky-400 hover:shadow-sm transition-all ${muted ? "opacity-60 border-slate-100" : "border-slate-200"}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-slate-800 text-sm truncate">{trip.origin}</span>
              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-slate-800 text-sm truncate">{trip.destination}</span>
            </div>
            <p className="text-xs text-slate-400">{formatDate(trip.departure_at)}</p>
            <p className="text-xs text-slate-400 mt-0.5">Conductor: {trip.driver?.full_name}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-[#1e3a5f]">${Number(trip.price_per_seat).toLocaleString("es-AR")}</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.class}`}>{st.label}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function DriverTripCard({ trip, muted = false }: { trip: any; muted?: boolean }) {
  const bookingCount = trip.bookings?.[0]?.count ?? 0;
  const st = statusLabel[trip.status] ?? statusLabel.active;

  return (
    <Link href={`/trips/${trip.id}`}>
      <div className={`bg-white border rounded-xl px-5 py-4 hover:border-sky-400 hover:shadow-sm transition-all ${muted ? "opacity-60 border-slate-100" : "border-slate-200"}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-slate-800 text-sm truncate">{trip.origin}</span>
              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-slate-800 text-sm truncate">{trip.destination}</span>
            </div>
            <p className="text-xs text-slate-400">{formatDate(trip.departure_at)}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {bookingCount} {bookingCount === 1 ? "reserva" : "reservas"} · {trip.available_seats} {trip.available_seats === 1 ? "asiento libre" : "asientos libres"}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-[#1e3a5f]">${Number(trip.price_per_seat).toLocaleString("es-AR")}</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.class}`}>{st.label}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
