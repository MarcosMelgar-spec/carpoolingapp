import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import ContactForm from "./ContactForm";

export const metadata = {
  title: "Contacto — CarpoolingAR",
};

export default async function ContactoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <Navbar userEmail={user?.email} />

      <div className="bg-[#1e3a5f]">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Link href="/" className="text-white/50 hover:text-white text-sm mb-4 inline-block transition-colors">
            ← Volver al inicio
          </Link>
          <h1 className="text-2xl font-bold text-white">Contacto</h1>
          <p className="text-white/60 text-sm mt-1">
            Consultas, reportes o solicitudes sobre tus datos personales
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <InfoCard
            icon="🔒"
            title="Datos personales"
            text="Solicitudes de acceso, rectificación o eliminación (Ley 25.326)"
          />
          <InfoCard
            icon="🚗"
            title="Viajes y reservas"
            text="Problemas con un viaje, conductor o pasajero"
          />
          <InfoCard
            icon="💬"
            title="General"
            text="Sugerencias, bugs o cualquier otra consulta"
          />
        </div>

        <ContactForm userEmail={user?.email} />
      </div>
    </>
  );
}

function InfoCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
      <p className="text-2xl mb-2">{icon}</p>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{text}</p>
    </div>
  );
}
