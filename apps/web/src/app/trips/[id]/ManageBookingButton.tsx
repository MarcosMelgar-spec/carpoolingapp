"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  bookingId: string;
  passengerName: string;
}

export default function ManageBookingButton({ bookingId, passengerName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"confirm" | "reject" | null>(null);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setLoading("confirm");
    setError("");
    const supabase = createClient();
    const { error } = await supabase.rpc("confirm_booking", { booking_id: bookingId });
    if (error) { setError(error.message); setLoading(null); return; }
    router.refresh();
    setLoading(null);
  }

  async function handleReject() {
    setLoading("reject");
    setError("");
    const supabase = createClient();
    const { error } = await supabase.rpc("reject_booking", { booking_id: bookingId });
    if (error) { setError(error.message); setLoading(null); return; }
    router.refresh();
    setLoading(null);
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={!!loading}
          className="flex-1 bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading === "confirm" ? "..." : "✓ Confirmar"}
        </button>
        <button
          onClick={handleReject}
          disabled={!!loading}
          className="flex-1 border border-red-200 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          {loading === "reject" ? "..." : "✕ Rechazar"}
        </button>
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}
