"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  bookingId: string;
  passengerName: string;
}

export default function DriverCancelBookingButton({ bookingId, passengerName }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCancel() {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.rpc("driver_cancel_booking", { booking_id: bookingId });
    if (error) { setError(error.message); setLoading(false); return; }
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "booking_cancelled_driver", bookingId }),
    });
    router.refresh();
    setShowConfirm(false);
    setLoading(false);
  }

  if (showConfirm) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-slate-500">¿Cancelar reserva de <strong>{passengerName}</strong>? El lugar quedará libre.</p>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "..." : "Sí, cancelar"}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="flex-1 border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Volver
          </button>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
    >
      Cancelar reserva
    </button>
  );
}
