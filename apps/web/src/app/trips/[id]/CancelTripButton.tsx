"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const REASONS = [
  "Problema mecánico",
  "Emergencia personal",
  "Condiciones climáticas",
  "Sin pasajeros suficientes",
  "Otro",
];

export default function CancelTripButton({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCancel() {
    setLoading(true);
    setError("");

    const finalReason = reason === "Otro" && customReason.trim()
      ? customReason.trim()
      : reason;

    const supabase = createClient();

    const { error: tripError } = await supabase
      .from("trips")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancellation_reason: finalReason,
      })
      .eq("id", tripId);

    if (tripError) {
      setError(tripError.message);
      setLoading(false);
      return;
    }

    // Cancelar todas las reservas activas del viaje
    const { error: bookingsError } = await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancellation_reason: `Conductor canceló el viaje: ${finalReason}`,
      })
      .eq("trip_id", tripId)
      .in("status", ["pending", "confirmed"]);

    if (bookingsError) {
      // El viaje ya fue cancelado — igual navegamos pero mostramos advertencia
      setError("Viaje cancelado, pero hubo un error al notificar a los pasajeros.");
      setLoading(false);
      setTimeout(() => router.push("/my-trips"), 2000);
      return;
    }

    router.push("/my-trips");
  }

  if (showConfirm) {
    return (
      <div className="border border-red-200 bg-red-50 rounded-xl p-4">
        <p className="text-sm font-semibold text-red-700 mb-1">¿Cancelar este viaje?</p>
        <p className="text-xs text-red-600 mb-3">
          Todos los pasajeros con reserva serán notificados y sus reservas se cancelarán automáticamente.
        </p>
        <div className="mb-4 space-y-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Motivo</label>
          <select
            value={reason}
            onChange={(e) => { setReason(e.target.value); setCustomReason(""); }}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            {REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {reason === "Otro" && (
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              maxLength={200}
              rows={2}
              placeholder="Describí el motivo..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Cancelando..." : "Sí, cancelar viaje"}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="flex-1 bg-white border border-slate-200 text-slate-700 rounded-lg py-2 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Volver
          </button>
        </div>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="w-full border border-red-200 text-red-600 rounded-lg py-2.5 text-sm font-medium hover:bg-red-50 transition-colors mt-2"
    >
      Cancelar viaje
    </button>
  );
}
