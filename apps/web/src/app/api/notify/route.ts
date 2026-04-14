import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  bookingRequestedEmail,
  bookingConfirmedEmail,
  bookingRejectedEmail,
  tripCancelledEmail,
  bookingCancelledByPassengerEmail,
  bookingCancelledByDriverEmail,
} from "@/lib/email";

const FROM = "CarpoolingAR <onboarding@resend.dev>";

async function getUserEmail(supabase: ReturnType<typeof createAdminClient>, userId: string) {
  const { data: { user } } = await supabase.auth.admin.getUserById(userId);
  return user?.email ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const { type, bookingId, tripId } = await req.json();
    const resend = new Resend(process.env.RESEND_API_KEY);
    const supabase = createAdminClient();

    // ── booking_requested: pasajero solicita → notificar conductor ──
    if (type === "booking_requested" && bookingId) {
      const { data: booking } = await supabase
        .from("bookings")
        .select("passenger_id, trip:trips!trip_id(id, origin, destination, departure_at, driver_id, driver:profiles!driver_id(full_name))")
        .eq("id", bookingId)
        .single();

      if (!booking) return NextResponse.json({ ok: false });

      const trip = booking.trip as any;
      const driverEmail = await getUserEmail(supabase, trip.driver_id);
      if (!driverEmail) return NextResponse.json({ ok: false });

      const { data: passenger } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", booking.passenger_id)
        .single();

      const tpl = bookingRequestedEmail({
        driverName: trip.driver?.full_name ?? "Conductor",
        passengerName: passenger?.full_name ?? "Un pasajero",
        origin: trip.origin,
        destination: trip.destination,
        departureAt: trip.departure_at,
        tripId: trip.id,
      });

      await resend.emails.send({ from: FROM, to: driverEmail, ...tpl });
    }

    // ── booking_confirmed: conductor confirma → notificar pasajero ──
    else if (type === "booking_confirmed" && bookingId) {
      const { data: booking } = await supabase
        .from("bookings")
        .select("passenger_id, trip:trips!trip_id(id, origin, destination, departure_at, driver:profiles!driver_id(full_name))")
        .eq("id", bookingId)
        .single();

      if (!booking) return NextResponse.json({ ok: false });

      const trip = booking.trip as any;
      const passengerEmail = await getUserEmail(supabase, booking.passenger_id);
      if (!passengerEmail) return NextResponse.json({ ok: false });

      const { data: passenger } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", booking.passenger_id)
        .single();

      const tpl = bookingConfirmedEmail({
        passengerName: passenger?.full_name ?? "Pasajero",
        driverName: trip.driver?.full_name ?? "El conductor",
        origin: trip.origin,
        destination: trip.destination,
        departureAt: trip.departure_at,
        tripId: trip.id,
      });

      await resend.emails.send({ from: FROM, to: passengerEmail, ...tpl });
    }

    // ── booking_rejected: conductor rechaza → notificar pasajero ──
    else if (type === "booking_rejected" && bookingId) {
      const { data: booking } = await supabase
        .from("bookings")
        .select("passenger_id, trip:trips!trip_id(origin, destination, departure_at, driver:profiles!driver_id(full_name))")
        .eq("id", bookingId)
        .single();

      if (!booking) return NextResponse.json({ ok: false });

      const trip = booking.trip as any;
      const passengerEmail = await getUserEmail(supabase, booking.passenger_id);
      if (!passengerEmail) return NextResponse.json({ ok: false });

      const { data: passenger } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", booking.passenger_id)
        .single();

      const tpl = bookingRejectedEmail({
        passengerName: passenger?.full_name ?? "Pasajero",
        driverName: trip.driver?.full_name ?? "El conductor",
        origin: trip.origin,
        destination: trip.destination,
        departureAt: trip.departure_at,
      });

      await resend.emails.send({ from: FROM, to: passengerEmail, ...tpl });
    }

    // ── trip_cancelled: conductor cancela viaje → notificar a todos los pasajeros ──
    else if (type === "trip_cancelled" && tripId) {
      const { data: trip } = await supabase
        .from("trips")
        .select("origin, destination, departure_at, cancellation_reason, driver:profiles!driver_id(full_name)")
        .eq("id", tripId)
        .single();

      if (!trip) return NextResponse.json({ ok: false });

      const { data: bookings } = await supabase
        .from("bookings")
        .select("passenger_id")
        .eq("trip_id", tripId)
        .eq("status", "cancelled"); // ya fueron canceladas por el CancelTripButton

      if (!bookings?.length) return NextResponse.json({ ok: true });

      const driver = (trip as any).driver;

      await Promise.all(
        bookings.map(async (b) => {
          const passengerEmail = await getUserEmail(supabase, b.passenger_id);
          if (!passengerEmail) return;

          const { data: passenger } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", b.passenger_id)
            .single();

          const tpl = tripCancelledEmail({
            passengerName: passenger?.full_name ?? "Pasajero",
            driverName: driver?.full_name ?? "El conductor",
            origin: trip.origin,
            destination: trip.destination,
            departureAt: trip.departure_at,
            reason: (trip as any).cancellation_reason ?? "",
          });

          await resend.emails.send({ from: FROM, to: passengerEmail, ...tpl });
        })
      );
    }

    // ── booking_cancelled_passenger: pasajero cancela → notificar conductor ──
    else if (type === "booking_cancelled_passenger" && bookingId) {
      const { data: booking } = await supabase
        .from("bookings")
        .select("passenger_id, trip:trips!trip_id(id, origin, destination, departure_at, driver_id, driver:profiles!driver_id(full_name))")
        .eq("id", bookingId)
        .single();

      if (!booking) return NextResponse.json({ ok: false });

      const trip = booking.trip as any;
      const driverEmail = await getUserEmail(supabase, trip.driver_id);
      if (!driverEmail) return NextResponse.json({ ok: false });

      const { data: passenger } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", booking.passenger_id)
        .single();

      const tpl = bookingCancelledByPassengerEmail({
        driverName: trip.driver?.full_name ?? "Conductor",
        passengerName: passenger?.full_name ?? "Un pasajero",
        origin: trip.origin,
        destination: trip.destination,
        departureAt: trip.departure_at,
        tripId: trip.id,
      });

      await resend.emails.send({ from: FROM, to: driverEmail, ...tpl });
    }

    // ── booking_cancelled_driver: conductor cancela reserva → notificar pasajero ──
    else if (type === "booking_cancelled_driver" && bookingId) {
      const { data: booking } = await supabase
        .from("bookings")
        .select("passenger_id, trip:trips!trip_id(origin, destination, departure_at, driver:profiles!driver_id(full_name))")
        .eq("id", bookingId)
        .single();

      if (!booking) return NextResponse.json({ ok: false });

      const trip = booking.trip as any;
      const passengerEmail = await getUserEmail(supabase, booking.passenger_id);
      if (!passengerEmail) return NextResponse.json({ ok: false });

      const { data: passenger } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", booking.passenger_id)
        .single();

      const tpl = bookingCancelledByDriverEmail({
        passengerName: passenger?.full_name ?? "Pasajero",
        driverName: trip.driver?.full_name ?? "El conductor",
        origin: trip.origin,
        destination: trip.destination,
        departureAt: trip.departure_at,
      });

      await resend.emails.send({ from: FROM, to: passengerEmail, ...tpl });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notify]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
