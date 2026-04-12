"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userId: string;
  initialName: string;
  initialPhone: string;
  initialCarModel: string;
  initialCarColor: string;
  initialCarPlate: string;
}

export default function ProfileForm({
  userId,
  initialName,
  initialPhone,
  initialCarModel,
  initialCarColor,
  initialCarPlate,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [carModel, setCarModel] = useState(initialCarModel);
  const [carColor, setCarColor] = useState(initialCarColor);
  const [carPlate, setCarPlate] = useState(initialCarPlate);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (name.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres");
      return;
    }
    if (phone.trim()) {
      const digits = phone.replace(/[\s\-\+\(\)]/g, "");
      if (!/^\d{8,15}$/.test(digits)) {
        setError("Ingresá un número de teléfono válido (ej: 3413456789)");
        return;
      }
    }
    if (carPlate.trim()) {
      const plateClean = carPlate.replace(/\s/g, "").toUpperCase();
      if (!/^[A-Z0-9]{5,10}$/.test(plateClean)) {
        setError("Ingresá una patente válida (ej: ABC123 o AB123CD)");
        return;
      }
    }

    setLoading(true);
    const supabase = createClient();
    const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, "");
    const cleanPlate = carPlate.replace(/\s/g, "").toUpperCase() || null;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: name.trim(),
        phone: cleanPhone || null,
        car_model: carModel.trim() || null,
        car_color: carColor.trim() || null,
        car_plate: cleanPlate,
      })
      .eq("id", userId);

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Datos personales */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Datos personales</h2>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre completo</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            placeholder="Tu nombre y apellido"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Teléfono / WhatsApp{" "}
            <span className="text-slate-400 font-normal">(opcional)</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            placeholder="Ej: 3413456789"
          />
          <p className="text-xs text-slate-400 mt-1">
            Los pasajeros con reserva confirmada podrán contactarte por WhatsApp
          </p>
        </div>
      </div>

      {/* Vehículo */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Mi vehículo</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Se muestra a los pasajeros para que identifiquen tu auto
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Modelo <span className="text-slate-400 font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            value={carModel}
            onChange={(e) => setCarModel(e.target.value)}
            maxLength={100}
            className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            placeholder="Ej: Ford Focus, Volkswagen Gol"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Color <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={carColor}
              onChange={(e) => setCarColor(e.target.value)}
              maxLength={50}
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="Ej: Blanco"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Patente <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={carPlate}
              onChange={(e) => setCarPlate(e.target.value.toUpperCase())}
              maxLength={10}
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-mono tracking-widest"
              placeholder="ABC 123"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm px-1">{error}</p>}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <svg className="w-4 h-4 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-sm font-medium text-green-700">Perfil actualizado</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1e3a5f] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#16304f] disabled:opacity-50 transition-colors"
      >
        {loading ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
