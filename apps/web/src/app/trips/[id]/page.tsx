import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import BookButton from "./BookButton";
import CancelBookingButton from "./CancelBookingButton";
import CancelTripButton from "./CancelTripButton";
import ManageBookingButton from "./ManageBookingButton";
import DriverCancelBookingButton from "./DriverCancelBookingButton";

interface Props {
  params: Promise<{ id: string }>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RatingBar({ rating }: { rating: number }) {
  const pct = (rating / 5) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-sky-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-slate-700">{Number(rating).toFixed(1)}/5</span>
    </div>
  );
}

export default async function TripDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: trip } = await supabase
    .from("trips")
    .select("*, driver:profiles!driver_id(id, full_name, rating, trips_as_driver)")
    .eq("id", id)
    .single();

  if (!trip) notFound();

  let existingBooking = null;
  if (user) {
    const { data } = await supabase
      .from("bookings")
      .select("id, status")
      .eq("trip_id", id)
      .eq("passenger_id", user.id)
      .single();
    existingBooking = data;
  }

  const isDriver = user?.id === trip.driver_id;
  const isCancelled = trip.status === "cancelled";

  // Si es el conductor, traer la lista de pasajeros
  let bookings: { id: string; status: string; seats: number; passenger: { id: string; full_name: string; rating: number } | null }[] = [];
  if (isDriver) {
    const { data } = await supabase
      .from("bookings")
      .select("id, status, seats, passenger:profiles!passenger_id(id, full_name, rating)")
      .eq("trip_id", id)
      .neq("status", "cancelled")
      .order("created_at", { ascending: true });
    bookings = (data ?? []) as unknown as typeof bookings;
  }

  return (
    <>
      <Navbar userEmail={user?.email} />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver a viajes
        </Link>

        {isCancelled && (
          <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-700">Este viaje fue cancelado</p>
              {trip.cancellation_reason && (
                <p className="text-xs text-red-600">Motivo: {trip.cancellation_reason}</p>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Main */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-[#1e3a5f] px-6 py-5">
                <div className="flex items-center gap-3 mb-3">
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wide mb-0.5">Origen</p>
                    <p className="text-white font-bold text-lg">{trip.origin}</p>
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-2">
                    <div className="flex-1 h-px bg-white/20" />
                    <svg className="w-5 h-5 text-sky-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1 h-px bg-white/20" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/50 uppercase tracking-wide mb-0.5">Destino</p>
                    <p className="text-white font-bold text-lg">{trip.destination}</p>
                  </div>
                </div>
                <p className="text-white/60 text-sm capitalize">{formatDate(trip.departure_at)}</p>
              </div>

              <div className="px-6 py-4 grid grid-cols-3 divide-x divide-slate-100">
                <div className="pr-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Lugares</p>
                  {isDriver ? (
                    <>
                      <p className="text-2xl font-bold text-slate-800">{trip.available_seats}</p>
                      <p className="text-xs text-slate-400">{trip.available_seats === 1 ? "disponible" : "disponibles"}</p>
                    </>
                  ) : (
                    <>
                      <div className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        trip.available_seats > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${trip.available_seats > 0 ? "bg-green-500" : "bg-red-500"}`} />
                        {trip.available_seats > 0 ? "Hay lugar" : "Sin lugares"}
                      </div>
                    </>
                  )}
                </div>
                <div className="px-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Precio</p>
                  <p className="text-2xl font-bold text-[#1e3a5f]">${Number(trip.price_per_seat).toLocaleString("es-AR")}</p>
                  <p className="text-xs text-slate-400">por asiento</p>
                </div>
                <div className="pl-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Estado</p>
                  <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${
                    trip.status === "active" ? "bg-green-100 text-green-700" :
                    trip.status === "full" ? "bg-amber-100 text-amber-700" :
                    trip.status === "cancelled" ? "bg-red-100 text-red-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {trip.status === "active" ? "Activo" :
                     trip.status === "full" ? "Completo" :
                     trip.status === "cancelled" ? "Cancelado" : "Completado"}
                  </span>
                </div>
              </div>
            </div>

            {trip.description && (
              <div className="bg-white rounded-xl border border-slate-200 px-6 py-5">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Descripción</h3>
                <p className="text-slate-700 text-sm leading-relaxed">{trip.description}</p>
              </div>
            )}

            {/* Lista de pasajeros — solo visible para el conductor */}
            {isDriver && (
              <div className="bg-white rounded-xl border border-slate-200 px-6 py-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    Pasajeros
                  </h3>
                  <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                    {bookings.length} / {bookings.length + trip.available_seats}
                  </span>
                </div>

                {bookings.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-slate-400">Todavía no hay pasajeros</p>
                    <p className="text-xs text-slate-300 mt-0.5">Las reservas aparecerán acá</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {booking.passenger?.full_name?.charAt(0).toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {booking.passenger?.full_name ?? "—"}
                            </p>
                            <p className="text-xs text-slate-400">
                              ⭐ {Number(booking.passenger?.rating ?? 5).toFixed(1)} · {booking.seats} {booking.seats === 1 ? "asiento" : "asientos"}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 min-w-[130px]">
                          {booking.status === "pending" ? (
                            <ManageBookingButton
                              bookingId={booking.id}
                              passengerName={booking.passenger?.full_name ?? ""}
                            />
                          ) : (
                            <div className="space-y-1.5">
                              <span className="block text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-center">
                                Confirmado
                              </span>
                              <DriverCancelBookingButton
                                bookingId={booking.id}
                                passengerName={booking.passenger?.full_name ?? ""}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 px-5 py-5">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Conductor</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white font-bold text-lg">
                  {trip.driver?.full_name?.charAt(0).toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{trip.driver?.full_name}</p>
                  <p className="text-xs text-slate-400">{trip.driver?.trips_as_driver ?? 0} viajes realizados</p>
                </div>
              </div>
              <RatingBar rating={trip.driver?.rating ?? 5} />
            </div>

            {/* Action panel */}
            <div className="bg-white rounded-xl border border-slate-200 px-5 py-5">
              {/* No logueado */}
              {!user && !isCancelled && (
                <div>
                  <p className="text-sm text-slate-500 mb-3">Iniciá sesión para reservar este viaje</p>
                  <Link
                    href="/auth/login"
                    className="block w-full text-center bg-[#1e3a5f] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#16304f] transition-colors"
                  >
                    Ingresar
                  </Link>
                </div>
              )}

              {/* Pasajero: puede reservar */}
              {user && !isDriver && trip.status === "active" && !existingBooking && (
                <BookButton tripId={trip.id} />
              )}

              {/* Pasajero: reserva activa */}
              {user && !isDriver && existingBooking && existingBooking.status !== "cancelled" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-green-700">
                        Reserva {existingBooking.status === "confirmed" ? "confirmada" : "pendiente"}
                      </p>
                      <p className="text-xs text-green-600">Tenés un lugar en este viaje</p>
                    </div>
                  </div>
                  {trip.status === "active" && (
                    <CancelBookingButton
                      bookingId={existingBooking.id}
                      departureAt={trip.departure_at}
                    />
                  )}
                </div>
              )}

              {/* Pasajero: reserva ya cancelada */}
              {user && !isDriver && existingBooking?.status === "cancelled" && (
                <p className="text-sm text-slate-500 text-center py-2">Cancelaste tu reserva para este viaje</p>
              )}

              {/* Conductor: opciones */}
              {isDriver && !isCancelled && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700 text-center">Sos el conductor de este viaje</p>
                  <CancelTripButton tripId={trip.id} />
                </div>
              )}

              {/* Viaje cancelado */}
              {isCancelled && (
                <p className="text-sm text-slate-400 text-center py-2">Este viaje fue cancelado</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
