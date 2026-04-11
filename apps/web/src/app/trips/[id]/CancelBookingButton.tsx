"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  bookingId: string;
  departureAt: string;
}

function getPolicy(departureAt: string): { label: string; isLate: boolean } {
  const hoursLeft = (new Date(departureAt).getTime() - Date.now()) / 36e5;
  if (hoursLeft < 2) return { label: "Cancelación a menos de 2 hs — se registrará en tu historial.", isLate: true };
  if (hoursLeft < 24) return { label: "Cancelación con menos de 24 hs — el conductor será notificado.", isLate: false };
  return { label: "Cancelación con anticipación — sin penalidad.", isLate: false };
}

export default function CancelBookingButton({ bookingId, departureAt }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const policy = getPolicy(departureAt);
  const isPast = new Date(departureAt) < new Date();

  if (isPast) {
    return (
      <div className="w-full border border-slate-200 bg-slate-50 text-slate-400 rounded-lg py-2.5 text-sm text-center">
        Este viaje ya partió — no se puede cancelar
      </div>
    );
  }

  async function handleCancel() {
    setLoading(true);
    setError("");

    const supabase = createClient();

    const updateData: Record<string, unknown> = {
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", bookingId);

    if (error) {
      setError(error.message);
      setLoading(false);
      setShowConfirm(false);
      return;
    }

    if (policy.isLate) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.rpc("increment_late_cancellations", { user_id: user.id });
      }
    }

    router.refresh();
    setShowConfirm(false);
  }

  if (showConfirm) {
    return (
      <div className="border border-red-200 bg-red-50 rounded-xl p-4">
        <p className="text-sm font-semibold text-red-700 mb-1">¿Cancelar tu reserva?</p>
        <p className="text-xs text-red-600 mb-4">{policy.label}</p>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Cancelando..." : "Sí, cancelar"}
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
    <div>
      {error && (
        <p className="text-red-500 text-xs mb-2 text-center">{error}</p>
      )}
      <button
        onClick={() => { setShowConfirm(true); setError(""); }}
        className="w-full border border-red-200 text-red-600 rounded-lg py-2.5 text-sm font-medium hover:bg-red-50 transition-colors"
      >
        Cancelar reserva
      </button>
    </div>
  );
}
