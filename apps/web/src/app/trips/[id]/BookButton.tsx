"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function BookButton({ tripId, availableSeats }: { tripId: string; availableSeats: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleBook() {
    setLoading(true);
    setError("");

    if (availableSeats <= 0) {
      setError("No hay lugares disponibles en este viaje.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const { data: hasConflict, error: conflictError } = await supabase.rpc("check_double_booking", {
      p_passenger_id: user.id,
      p_trip_id: tripId,
    });

    if (conflictError) {
      setError(conflictError.message);
      setLoading(false);
      return;
    }

    if (hasConflict) {
      setError("Ya tenés una reserva activa en un viaje con horario similar (±3 hs). Cancelala primero.");
      setLoading(false);
      return;
    }

    const { data: booking, error } = await supabase.from("bookings").insert({
      trip_id: tripId,
      passenger_id: user.id,
      seats: 1,
    }).select().single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "booking_requested", bookingId: booking.id }),
    });

    router.refresh();
  }

  return (
    <div>
      <button
        onClick={handleBook}
        disabled={loading}
        className="w-full bg-[#1e3a5f] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#16304f] disabled:opacity-50 transition-colors"
      >
        {loading ? "Reservando..." : "Reservar 1 asiento"}
      </button>
      {error && (
        <p className="text-red-500 text-xs mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
