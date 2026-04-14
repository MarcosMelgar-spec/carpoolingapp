"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import LocationInput from "@/components/LocationInput";

interface Vehicle {
  id: string;
  car_model: string;
  car_color: string;
  car_plate: string;
}

export default function NewTripPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Vehicle state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoaded, setVehiclesLoaded] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newModel, setNewModel] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newPlate, setNewPlate] = useState("");
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [vehicleError, setVehicleError] = useState("");

  const [form, setForm] = useState({
    origin: "",
    origin_lat: "",
    origin_lng: "",
    destination: "",
    destination_lat: "",
    destination_lng: "",
    departure_at: "",
    available_seats: "3",
    price_per_seat: "0",
    description: "",
    trip_type: "door_to_door" as "door_to_door" | "meeting_point",
    meeting_point: "",
  });

  useEffect(() => {
    async function loadVehicles() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("vehicles")
        .select("id, car_model, car_color, car_plate")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      const list = (data ?? []) as Vehicle[];
      setVehicles(list);
      if (list.length > 0) setSelectedVehicleId(list[0].id);
      setVehiclesLoaded(true);
    }
    loadVehicles();
  }, []);

  async function handleAddVehicle() {
    setVehicleError("");

    if (newModel.trim().length < 2) { setVehicleError("El modelo debe tener al menos 2 caracteres"); return; }
    if (newColor.trim().length < 2) { setVehicleError("El color debe tener al menos 2 caracteres"); return; }
    const plateClean = newPlate.replace(/\s/g, "").toUpperCase();
    if (!/^[A-Z0-9]{5,10}$/.test(plateClean)) { setVehicleError("Ingresá una patente válida (ej: ABC123 o AB123CD)"); return; }

    setAddingVehicle(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAddingVehicle(false); router.push("/auth/login"); return; }

    const { data, error: insertError } = await supabase
      .from("vehicles")
      .insert({ user_id: user.id, car_model: newModel.trim(), car_color: newColor.trim(), car_plate: plateClean })
      .select()
      .single();

    setAddingVehicle(false);

    if (insertError) {
      setVehicleError(insertError.code === "23505" ? "Ya tenés un vehículo con esa patente" : insertError.message);
      return;
    }

    const newVehicle = data as Vehicle;
    setVehicles((prev) => [...prev, newVehicle]);
    setSelectedVehicleId(newVehicle.id);
    setNewModel("");
    setNewColor("");
    setNewPlate("");
    setShowAddVehicle(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.origin.trim()) { setError("Seleccioná el origen del viaje"); return; }
    if (!form.destination.trim()) { setError("Seleccioná el destino del viaje"); return; }

    const originCity = form.origin.split(",")[0].trim().toLowerCase();
    const destinationCity = form.destination.split(",")[0].trim().toLowerCase();
    if (originCity === destinationCity) {
      setError("El origen y el destino no pueden ser iguales");
      return;
    }

    if (!form.departure_at) { setError("Seleccioná la fecha y hora de salida"); return; }
    if (new Date(form.departure_at) <= new Date()) {
      setError("La fecha de salida debe ser en el futuro");
      return;
    }

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    if (new Date(form.departure_at) > maxDate) {
      setError("No podés publicar un viaje con más de 30 días de anticipación");
      return;
    }

    if (parseFloat(form.price_per_seat) < 0) {
      setError("El precio no puede ser negativo");
      return;
    }

    if (form.description.length > 500) {
      setError("La descripción no puede superar los 500 caracteres");
      return;
    }

    if (form.trip_type === "meeting_point" && !form.meeting_point.trim()) {
      setError("Ingresá el punto de encuentro o elegí la modalidad Puerta a puerta");
      return;
    }

    if (!selectedVehicleId) {
      setError("Seleccioná el vehículo con el que vas a hacer el viaje");
      return;
    }

    const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
    if (!selectedVehicle) {
      setError("Vehículo no encontrado. Intentá de nuevo.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      router.push("/auth/login");
      return;
    }

    // Nombre requerido para publicar
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (!profile?.full_name || profile.full_name.trim().length < 2) {
      setError("Completá tu nombre en el perfil antes de publicar un viaje.");
      setLoading(false);
      return;
    }

    // Límite de 3 viajes activos simultáneos
    const { data: limitReached } = await supabase.rpc("check_driver_trip_limit", {
      p_driver_id: user.id,
    });

    if (limitReached) {
      setError("Ya tenés 3 viajes activos. Cancelá o esperá que terminen antes de publicar uno nuevo.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.from("trips").insert({
      driver_id: user.id,
      origin: form.origin,
      origin_lat: parseFloat(form.origin_lat) || 0,
      origin_lng: parseFloat(form.origin_lng) || 0,
      destination: form.destination,
      destination_lat: parseFloat(form.destination_lat) || 0,
      destination_lng: parseFloat(form.destination_lng) || 0,
      departure_at: form.departure_at,
      available_seats: parseInt(form.available_seats),
      price_per_seat: parseFloat(form.price_per_seat),
      description: form.description || null,
      meeting_point: form.trip_type === "meeting_point" ? form.meeting_point.trim() || null : null,
      vehicle_model: selectedVehicle.car_model,
      vehicle_color: selectedVehicle.car_color,
      vehicle_plate: selectedVehicle.car_plate,
    }).select().single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(`/trips/${data.id}`);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="bg-[#1e3a5f]">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-4">
          <Link href="/" className="text-white/50 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-white font-bold text-lg">Publicar nuevo viaje</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Ruta */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 relative z-10">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Ruta</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Origen</label>
                <LocationInput
                  value={form.origin}
                  onChange={(val) => setForm((p) => ({ ...p, origin: val }))}
                  onSelect={(loc) => setForm((p) => ({ ...p, origin: loc.name, origin_lat: String(loc.lat), origin_lng: String(loc.lng) }))}
                  placeholder="Ej: Rosario, Santa Fe"
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-center">
                <div className="flex flex-col items-center gap-1 text-slate-300">
                  <div className="w-px h-3 bg-slate-300" />
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v10.586l3.293-3.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L9 14.586V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Destino</label>
                <LocationInput
                  value={form.destination}
                  onChange={(val) => setForm((p) => ({ ...p, destination: val }))}
                  onSelect={(loc) => setForm((p) => ({ ...p, destination: loc.name, destination_lat: String(loc.lat), destination_lng: String(loc.lng) }))}
                  placeholder="Ej: Buenos Aires"
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Fecha */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Fecha y hora</h2>
            <input
              name="departure_at"
              type="datetime-local"
              required
              value={form.departure_at}
              onChange={handleChange}
              min={new Date().toISOString().slice(0, 16)}
              max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          {/* Asientos y precio */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Capacidad y precio</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Asientos disponibles</label>
                <select
                  name="available_seats"
                  value={form.available_seats}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? "lugar" : "lugares"}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Precio por asiento ($)</label>
                <input
                  name="price_per_seat"
                  type="number"
                  min="0"
                  step="100"
                  required
                  value={form.price_per_seat}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Modalidad */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Modalidad de encuentro</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, trip_type: "door_to_door", meeting_point: "" }))}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  form.trip_type === "door_to_door"
                    ? "border-sky-500 bg-sky-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <p className="text-lg mb-1">🏠</p>
                <p className={`text-sm font-semibold ${form.trip_type === "door_to_door" ? "text-sky-700" : "text-slate-700"}`}>
                  Puerta a puerta
                </p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Coordinás el punto de encuentro con cada pasajero por separado
                </p>
              </button>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, trip_type: "meeting_point" }))}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  form.trip_type === "meeting_point"
                    ? "border-sky-500 bg-sky-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <p className="text-lg mb-1">📍</p>
                <p className={`text-sm font-semibold ${form.trip_type === "meeting_point" ? "text-sky-700" : "text-slate-700"}`}>
                  Punto de encuentro
                </p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Todos se reúnen en un lugar fijo que vos definís
                </p>
              </button>
            </div>

            {form.trip_type === "meeting_point" && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Lugar de encuentro
                </label>
                <input
                  name="meeting_point"
                  type="text"
                  value={form.meeting_point}
                  onChange={handleChange}
                  maxLength={200}
                  placeholder="Ej: Shell Av. Pellegrini 1234, frente al semáforo"
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-400 mt-1">Solo visible para pasajeros con reserva confirmada</p>
              </div>
            )}
          </div>

          {/* Vehículo */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Vehículo</h2>
            <p className="text-xs text-slate-400 mb-4">Con qué auto vas a viajar</p>

            {!vehiclesLoaded && (
              <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
            )}

            {vehiclesLoaded && vehicles.length > 0 && !showAddVehicle && (
              <div className="space-y-3">
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.car_color} · {v.car_model} — {v.car_plate}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => { setShowAddVehicle(true); setVehicleError(""); }}
                  className="flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-800 font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar otro vehículo
                </button>
              </div>
            )}

            {vehiclesLoaded && vehicles.length === 0 && !showAddVehicle && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <svg className="w-4 h-4 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-amber-700">No tenés vehículos registrados. Agregá uno para continuar.</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowAddVehicle(true); setVehicleError(""); }}
                  className="flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-800 font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar vehículo
                </button>
              </div>
            )}

            {showAddVehicle && (
              <div className="space-y-3">
                {vehicles.length > 0 && (
                  <p className="text-sm font-semibold text-slate-700">Nuevo vehículo</p>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Modelo</label>
                  <input
                    type="text"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
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
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      maxLength={50}
                      placeholder="Ej: Blanco"
                      className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Patente</label>
                    <input
                      type="text"
                      value={newPlate}
                      onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                      maxLength={10}
                      placeholder="ABC 123"
                      className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-mono tracking-widest"
                    />
                  </div>
                </div>
                {vehicleError && <p className="text-red-500 text-sm">{vehicleError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddVehicle}
                    disabled={addingVehicle}
                    className="flex-1 bg-[#1e3a5f] text-white rounded-lg py-2 text-sm font-semibold hover:bg-[#16304f] disabled:opacity-50 transition-colors"
                  >
                    {addingVehicle ? "Guardando..." : "Guardar vehículo"}
                  </button>
                  {vehicles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => { setShowAddVehicle(false); setVehicleError(""); setNewModel(""); setNewColor(""); setNewPlate(""); }}
                      className="flex-1 border border-slate-300 text-slate-600 rounded-lg py-2 text-sm font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Descripción */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Descripción <span className="normal-case font-normal text-slate-400">(opcional)</span></h2>
              <span className={`text-xs ${form.description.length > 450 ? "text-red-500" : "text-slate-400"}`}>
                {form.description.length}/500
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">Paradas, equipaje permitido, preferencias de viaje</p>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              maxLength={500}
              placeholder="Ej: Salgo del centro de Rosario. Acepto mascotas pequeñas..."
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1e3a5f] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#16304f] disabled:opacity-50 transition-colors"
          >
            {loading ? "Publicando..." : "Publicar viaje"}
          </button>
        </form>
      </div>
    </div>
  );
}
