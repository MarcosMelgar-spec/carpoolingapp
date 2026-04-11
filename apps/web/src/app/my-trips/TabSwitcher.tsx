"use client";

import { useRouter } from "next/navigation";

export default function TabSwitcher({ activeTab }: { activeTab: string }) {
  const router = useRouter();

  return (
    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
      <button
        onClick={() => router.push("/my-trips?tab=passenger")}
        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
          activeTab === "passenger"
            ? "bg-white text-[#1e3a5f] shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        Como pasajero
      </button>
      <button
        onClick={() => router.push("/my-trips?tab=driver")}
        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
          activeTab === "driver"
            ? "bg-white text-[#1e3a5f] shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        Como conductor
      </button>
    </div>
  );
}
