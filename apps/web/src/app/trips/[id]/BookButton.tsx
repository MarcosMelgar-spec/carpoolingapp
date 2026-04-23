"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function BookButton({ tripId, availableSeats }: { tripId: string; availableSeats: number }) {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "form" | "loading">("idle");
  const [needsPhone, setNeedsPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [hasPet, setHasPet] = useState(false);
  const [hasLargeLuggage, setHasLargeLuggage] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [conflictTripId, setConflictTripId] = useState<string | null>(null);

  async function handleShowForm() {
    setStep("form");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone")
      .eq("id", user.id)
      .single();
    if (!profile?.phone) setNeedsPhone(true);
  }

  async function handleBook() {
    setStep("loading");
    setError("");
    setConflictTripId(null);

    if (needsPhone && phoneInput.replace(/\D/g, "").length < 8) {
      setError("Ingresá un número de teléfono válido (mínimo 8 dígitos).");
      setStep("form");
      return;
    }

    if (availableSeats <= 0) {
      setError("No hay lugares disponibles en este viaje.");
      setStep("form");
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (!profile?.full_name || profile.full_name.trim().length < 2) {
      setError("Completá tu nombre en el perfil antes de reservar.");
      setStep("form");
      return;
    }

    if (needsPhone) {
      const { error: phoneError } = await supabase
        .from("profiles")
        .update({ phone: phoneInput.trim() })
        .eq("id", user.id);
      if (phoneError) {
        setError("No se pudo guardar el teléfono. Intentá de nuevo.");
        setStep("form");
        return;
      }
    }

    const { data: isBlocked } = await supabase.rpc("check_passenger_blocked", {
      p_passenger_id: user.id,
    });

    if (isBlocked) {
      setError("Tu cuenta tiene restricciones por cancelaciones tardías. Contactanos para más información.");
      setStep("form");
      return;
    }

    const { data: hasConflict, error: conflictError } = await supabase.rpc("check_double_booking", {
      p_passenger_id: user.id,
      p_trip_id: tripId,
    });

    if (conflictError) {
      setError(conflictError.message);
      setStep("form");
      return;
    }

    if (hasConflict) {
      setError("Ya tenés una reserva activa en un viaje con horario similar (±3 hs). Cancelala primero.");
      setStep("form");
      return;
    }

    const { data: sameDayTripId } = await supabase.rpc("get_same_day_conflict_trip", {
      p_passenger_id: user.id,
      p_trip_id: tripId,
    });

    if (sameDayTripId) {
      setConflictTripId(sameDayTripId);
      setStep("form");
      return;
    }

    const { data: booking, error: bookingError } = await supabase.from("bookings").insert({
      trip_id: tripId,
      passenger_id: user.id,
      seats: 1,
      has_pet: hasPet,
      has_large_luggage: hasLargeLuggage,
      passenger_note: note.trim() || null,
    }).select().single();

    if (bookingError) {
      setError(bookingError.message);
      setStep("form");
      return;
    }

    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "booking_requested", bookingId: booking.id }),
    });

    router.refresh();
  }

  if (step === "idle") {
    return (
      <button
        onClick={handleShowForm}
        className="w-full bg-[#1e3a5f] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#16304f] transition-colors"
      >
        Reservar 1 asiento
      </button>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {needsPhone && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-3">
            <p className="text-xs font-semibold text-amber-700 mb-2">
              📱 El conductor necesita tu teléfono para contactarte
            </p>
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="Ej: 3413001122"
              className="w-full text-sm border border-amber-200 rounded-lg px-3 py-2 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 bg-white"
            />
            <p className="text-xs text-amber-600 mt-1">Solo se comparte con el conductor si tu reserva es aceptada</p>
          </div>
        )}

        <p className="text-sm font-semibold text-slate-700">¿Viajás con algo especial?</p>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasPet}
            onChange={(e) => setHasPet(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
          />
          <span className="text-sm text-slate-700">🐾 Viajo con mascota</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasLargeLuggage}
            onChange={(e) => setHasLargeLuggage(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
          />
          <span className="text-sm text-slate-700">🧳 Llevo equipaje grande</span>
        </label>

        <div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 200))}
            placeholder="Aclaración opcional..."
            rows={2}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 resize-none"
          />
          <p className="text-xs text-slate-400 text-right mt-0.5">{note.length}/200</p>
        </div>

        {error && <p className="text-red-500 text-xs text-center">{error}</p>}

        <button
          onClick={handleBook}
          disabled={step === "loading"}
          className="w-full bg-[#1e3a5f] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#16304f] disabled:opacity-50 transition-colors"
        >
          {step === "loading" ? "Reservando..." : "Confirmar reserva"}
        </button>

        <button
          onClick={() => { setStep("idle"); setError(""); setNeedsPhone(false); setPhoneInput(""); }}
          className="block w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          Cancelar
        </button>
      </div>

      {conflictTripId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { setConflictTripId(null); setStep("form"); }}
          />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Ya tenés un viaje ese día</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              Tenés una reserva activa para ese mismo día. Cancelala primero para poder reservar este viaje.
            </p>
            <div className="w-full space-y-2">
              <Link
                href={`/trips/${conflictTripId}`}
                className="block w-full bg-[#1e3a5f] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#16304f] transition-colors text-center"
              >
                Ver mi reserva activa
              </Link>
              <button
                onClick={() => { setConflictTripId(null); setStep("form"); }}
                className="block w-full border border-slate-200 text-slate-600 rounded-lg py-2.5 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
