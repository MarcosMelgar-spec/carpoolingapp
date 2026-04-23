import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import BookButton from "./BookButton";
import CancelBookingButton from "./CancelBookingButton";
import CancelTripButton from "./CancelTripButton";
import ManageBookingButton from "./ManageBookingButton";
import DriverCancelBookingButton from "./DriverCancelBookingButton";
import ReviewButton from "@/components/ReviewButton";
import CarImage from "@/components/CarImage";

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
    .select("*, driver:profiles!driver_id(id, full_name, rating, trips_as_driver, phone)")
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
  const isPast = new Date(trip.departure_at) < new Date() && trip.status !== "cancelled";

  // Si es el conductor, traer la lista de pasajeros
  let bookings: { id: string; status: string; seats: number; has_pet: boolean; has_large_luggage: boolean; passenger_note: string | null; passenger: { id: string; full_name: string; rating: number; phone?: string | null } | null }[] = [];
  if (isDriver) {
    const { data } = await supabase
      .from("bookings")
      .select("id, status, seats, has_pet, has_large_luggage, passenger_note, passenger:profiles!passenger_id(id, full_name, rating, phone)")
      .eq("trip_id", id)
      .neq("status", "cancelled")
      .order("created_at", { ascending: true });
    bookings = (data ?? []) as unknown as typeof bookings;
  }

  // Reviews ya enviadas por el usuario en este viaje
  let reviewedIds = new Set<string>();
  if (user) {
    const { data: myReviews } = await supabase
      .from("reviews")
      .select("reviewed_id")
      .eq("trip_id", id)
      .eq("reviewer_id", user.id);
    reviewedIds = new Set((myReviews ?? []).map((r: { reviewed_id: string }) => r.reviewed_id));
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

        {isPast && !isCancelled && (
          <div className="mb-4 flex items-center gap-3 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3">
            <svg className="w-5 h-5 text-slate-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium text-slate-600">Este viaje ya partió y no está disponible para reservas</p>
          </div>
        )}

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
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <p className="text-white/60 text-sm capitalize">{formatDate(trip.departure_at)}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-white/60">
                    {trip.meeting_point ? "📍 Punto de encuentro" : "🏠 Puerta a puerta"}
                  </span>
                </div>
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

            {/* Punto de encuentro — visible para conductor y pasajeros confirmados */}
            {trip.meeting_point && (isDriver || existingBooking?.status === "confirmed") && (
              <div className="bg-sky-50 border border-sky-200 rounded-xl px-6 py-5">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-sky-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3 className="text-sm font-semibold text-sky-700 uppercase tracking-wide">Punto de encuentro</h3>
                </div>
                <p className="text-slate-700 text-sm">{trip.meeting_point}</p>
              </div>
            )}

            {/* WhatsApp — visible para pasajeros con reserva confirmada */}
            {user && !isDriver && existingBooking?.status === "confirmed" && (
              trip.driver?.phone ? (
                <a
                  href={`https://wa.me/54${trip.driver.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola! Reservé un lugar en tu viaje de ${trip.origin} a ${trip.destination} en CarpoolingAR`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-6 py-4 hover:bg-green-100 transition-colors"
                >
                  <svg className="w-6 h-6 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-green-700">Contactar al conductor por WhatsApp</p>
                    <p className="text-xs text-green-600">{trip.driver.full_name}</p>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-6 py-4">
                  <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Reserva confirmada</p>
                    <p className="text-xs text-slate-400">El conductor aún no cargó su número de WhatsApp</p>
                  </div>
                </div>
              )
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
                            {(booking.has_pet || booking.has_large_luggage) && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {booking.has_pet && (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200 rounded-full px-2 py-0.5">
                                    🐾 Mascota
                                  </span>
                                )}
                                {booking.has_large_luggage && (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-sky-50 text-sky-600 border border-sky-200 rounded-full px-2 py-0.5">
                                    🧳 Equipaje grande
                                  </span>
                                )}
                              </div>
                            )}
                            {booking.passenger_note && (
                              <p className="text-xs text-slate-500 italic mt-1">"{booking.passenger_note}"</p>
                            )}
                            {booking.passenger?.phone && (
                              booking.status === "confirmed" ? (
                                <a
                                  href={`https://wa.me/54${booking.passenger.phone.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 mt-1.5"
                                >
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                  </svg>
                                  {booking.passenger.phone}
                                </a>
                              ) : (
                                <p className="text-xs text-slate-400 mt-1.5">📞 {booking.passenger.phone}</p>
                              )
                            )}
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
                              {!isPast && (
                                <DriverCancelBookingButton
                                  bookingId={booking.id}
                                  passengerName={booking.passenger?.full_name ?? ""}
                                />
                              )}
                              {isPast && booking.passenger && (
                                <ReviewButton
                                  tripId={trip.id}
                                  reviewedId={booking.passenger.id}
                                  reviewedName={booking.passenger.full_name}
                                  alreadyReviewed={reviewedIds.has(booking.passenger.id)}
                                />
                              )}
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

              {/* Vehículo — visible para todos */}
              {(trip.vehicle_model || trip.vehicle_plate) && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Vehículo</p>
                  {trip.vehicle_model && (
                    <CarImage model={trip.vehicle_model} color={trip.vehicle_color} />
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7-7-7 7" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15h14M5 15a2 2 0 01-2-2v-2a2 2 0 012-2h1l2-4h8l2 4h1a2 2 0 012 2v2a2 2 0 01-2 2M5 15v4a1 1 0 001 1h1m10-5v4a1 1 0 01-1 1h-1m-8 0h8" />
                    </svg>
                    <div>
                      {trip.vehicle_model && (
                        <p className="text-sm font-semibold text-slate-700">
                          {trip.vehicle_color ? `${trip.vehicle_color} · ` : ""}{trip.vehicle_model}
                        </p>
                      )}
                      {trip.vehicle_plate && (
                        <p className="text-xs font-mono font-semibold text-slate-500 tracking-widest mt-0.5">
                          {trip.vehicle_plate}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
              {user && !isDriver && trip.status === "active" && trip.available_seats > 0 && !existingBooking && !isPast && (
                <BookButton tripId={trip.id} availableSeats={trip.available_seats} />
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
                  {!isPast && trip.status === "active" && (
                    <CancelBookingButton
                      bookingId={existingBooking.id}
                      departureAt={trip.departure_at}
                    />
                  )}
                  {isPast && existingBooking.status === "confirmed" && trip.driver && (
                    <ReviewButton
                      tripId={trip.id}
                      reviewedId={trip.driver_id}
                      reviewedName={trip.driver.full_name}
                      alreadyReviewed={reviewedIds.has(trip.driver_id)}
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
                  {!isPast && (
                    <Link
                      href={`/trips/${trip.id}/edit`}
                      className="block w-full text-center border border-slate-200 text-slate-600 rounded-lg py-2 text-sm font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Editar viaje
                    </Link>
                  )}
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
