"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  tripId: string;
  reviewedId: string;
  reviewedName: string;
  alreadyReviewed?: boolean;
}

export default function ReviewButton({ tripId, reviewedId, reviewedName, alreadyReviewed }: Props) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(alreadyReviewed ?? false);

  const firstName = reviewedName.split(" ")[0];

  if (done) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        Ya calificaste
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        Calificar a {firstName}
      </button>
    );
  }

  async function handleSubmit() {
    if (rating === 0) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("submit_review", {
      p_trip_id: tripId,
      p_reviewed_id: reviewedId,
      p_rating: rating,
      p_comment: comment.trim() || null,
    });
    setLoading(false);
    if (!error) {
      setDone(true);
      setOpen(false);
    }
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-2">
      <p className="text-sm font-semibold text-slate-700 mb-3">
        ¿Cómo fue viajar con {firstName}?
      </p>
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="p-0.5"
          >
            <svg
              className={`w-7 h-7 transition-colors ${(hovered || rating) >= star ? "text-amber-400" : "text-slate-200"}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={300}
        rows={2}
        placeholder="Comentario opcional..."
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent mb-3"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || loading}
          className="flex-1 bg-[#1e3a5f] text-white rounded-lg py-2 text-sm font-semibold hover:bg-[#16304f] disabled:opacity-50 transition-colors"
        >
          {loading ? "Enviando..." : "Enviar calificación"}
        </button>
        <button
          onClick={() => { setOpen(false); setRating(0); setComment(""); }}
          className="px-4 bg-white border border-slate-200 text-slate-600 rounded-lg py-2 text-sm hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
