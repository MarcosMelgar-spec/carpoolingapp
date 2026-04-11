import Link from "next/link";
import type { Trip } from "@carpoolingapp/shared";

interface TripCardProps {
  trip: Trip;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RatingBar({ rating }: { rating: number }) {
  const pct = (rating / 5) * 100;
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-sky-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500">{Number(rating).toFixed(1)}</span>
    </div>
  );
}

export default function TripCard({ trip }: TripCardProps) {
  return (
    <Link href={`/trips/${trip.id}`} className="block group">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-sky-400 hover:shadow-md transition-all duration-200">
        {/* Route header */}
        <div className="bg-[#1e3a5f] px-5 py-4">
          <div className="flex items-center gap-2 text-white">
            <span className="font-semibold text-sm truncate max-w-[120px]">{trip.origin}</span>
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <div className="w-8 h-px bg-sky-400/60" />
              <svg className="w-3.5 h-3.5 text-sky-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-semibold text-sm truncate max-w-[120px]">{trip.destination}</span>
          </div>
          <p className="text-white/60 text-xs mt-1.5">{formatDate(trip.departure_at)}</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100" />

        {/* Details */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-0.5">Conductor</p>
              <p className="text-sm font-semibold text-slate-800">
                {trip.driver?.full_name ?? "—"}
              </p>
              <RatingBar rating={trip.driver?.rating ?? 5} />
            </div>

            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-0.5">Precio</p>
              <p className="text-xl font-bold text-[#1e3a5f]">
                ${Number(trip.price_per_seat).toLocaleString("es-AR")}
              </p>
              <p className="text-xs text-slate-400">
                {trip.available_seats} {trip.available_seats === 1 ? "lugar" : "lugares"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
