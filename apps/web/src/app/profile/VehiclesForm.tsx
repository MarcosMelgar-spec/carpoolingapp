"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Vehicle {
  id: string;
  car_model: string;
  car_color: string;
  car_plate: string;
}

interface Props {
  userId: string;
  initialVehicles: Vehicle[];
}

export default function VehiclesForm({ userId, initialVehicles }: Props) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [showAdd, setShowAdd] = useState(false);
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [plate, setPlate] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (model.trim().length < 2) {
      setError("El modelo debe tener al menos 2 caracteres");
      return;
    }
    if (color.trim().length < 2) {
      setError("El color debe tener al menos 2 caracteres");
      return;
    }
    const plateClean = plate.replace(/\s/g, "").toUpperCase();
    if (!/^[A-Z0-9]{5,10}$/.test(plateClean)) {
      setError("Ingresá una patente válida (ej: ABC123 o AB123CD)");
      return;
    }

    setAdding(true);
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("vehicles")
      .insert({
        user_id: userId,
        car_model: model.trim(),
        car_color: color.trim(),
        car_plate: plateClean,
      })
      .select()
      .single();

    setAdding(false);

    if (insertError) {
      if (insertError.code === "23505") {
        setError("Ya tenés un vehículo registrado con esa patente");
      } else {
        setError(insertError.message);
      }
      return;
    }

    setVehicles((prev) => [...prev, data as Vehicle]);
    setModel("");
    setColor("");
    setPlate("");
    setShowAdd(false);
  }

  async function handleDelete(vehicleId: string) {
    setDeletingId(vehicleId);
    const supabase = createClient();
    await supabase.from("vehicles").delete().eq("id", vehicleId);
    setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    setDeletingId(null);
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Mis vehículos</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Necesitás al menos uno para publicar viajes como conductor
        </p>
      </div>

      {vehicles.length > 0 && (
        <div className="space-y-2">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between gap-3 bg-slate-50 rounded-lg px-4 py-3"
            >
              <div className="flex items-center gap-2.5">
                <svg
                  className="w-4 h-4 text-slate-400 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h8l2-2h1a2 2 0 002-2v-5a1 1 0 00-.293-.707l-3-3A1 1 0 0013 6" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {v.car_color} · {v.car_model}
                  </p>
                  <p className="text-xs font-mono text-slate-500 tracking-widest">{v.car_plate}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(v.id)}
                disabled={deletingId === v.id}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
              >
                {deletingId === v.id ? "..." : "Eliminar"}
              </button>
            </div>
          ))}
        </div>
      )}

      {vehicles.length === 0 && !showAdd && (
        <p className="text-sm text-slate-400">Todavía no agregaste ningún vehículo.</p>
      )}

      {!showAdd && (
        <button
          type="button"
          onClick={() => {
            setShowAdd(true);
            setError("");
          }}
          className="flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-800 font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Agregar vehículo
        </button>
      )}

      {showAdd && (
        <form onSubmit={handleAdd} className="space-y-3 pt-3 border-t border-slate-100">
          <p className="text-sm font-semibold text-slate-700">Nuevo vehículo</p>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Modelo</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              maxLength={100}
              placeholder="Ej: Ford Focus, Volkswagen Gol"
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Color</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                maxLength={50}
                placeholder="Ej: Blanco"
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Patente</label>
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                maxLength={10}
                placeholder="ABC 123"
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-mono tracking-widest"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={adding}
              className="flex-1 bg-[#1e3a5f] text-white rounded-lg py-2 text-sm font-semibold hover:bg-[#16304f] disabled:opacity-50 transition-colors"
            >
              {adding ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAdd(false);
                setError("");
                setModel("");
                setColor("");
                setPlate("");
              }}
              className="flex-1 border border-slate-300 text-slate-600 rounded-lg py-2 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
