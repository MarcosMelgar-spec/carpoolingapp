import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Política de privacidad — CarpoolingAR",
};

export default async function PrivacidadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <Navbar userEmail={user?.email} />

      <div className="bg-[#1e3a5f]">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link href="/" className="text-white/50 hover:text-white text-sm mb-4 inline-block transition-colors">
            ← Volver al inicio
          </Link>
          <h1 className="text-2xl font-bold text-white">Política de privacidad</h1>
          <p className="text-white/60 text-sm mt-1">Última actualización: abril de 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        <Section title="1. Responsable del tratamiento">
          <p>
            CarpoolingAR es responsable de la base de datos de usuarios registrados en la plataforma, en los
            términos de la <strong>Ley 25.326 de Protección de Datos Personales</strong> de la República Argentina
            y su normativa complementaria. La Agencia de Acceso a la Información Pública (AAIP) es el organismo
            de control competente.
          </p>
        </Section>

        <Section title="2. Datos que recolectamos">
          <p>Al registrarte y usar CarpoolingAR recolectamos:</p>
          <ul className="list-disc list-inside space-y-2 mt-3">
            <li><strong>Datos de registro:</strong> dirección de correo electrónico y contraseña (almacenada de forma encriptada).</li>
            <li><strong>Datos de perfil:</strong> nombre completo y número de teléfono (opcionales, cargados por el usuario).</li>
            <li><strong>Datos de vehículos:</strong> modelo, color y patente de los autos registrados por conductores.</li>
            <li><strong>Datos de viajes:</strong> origen, destino, fecha, precio y punto de encuentro de los viajes publicados.</li>
            <li><strong>Datos de reservas:</strong> historial de viajes como conductor y como pasajero.</li>
            <li><strong>Calificaciones y reseñas:</strong> puntuaciones y comentarios entre usuarios.</li>
            <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador y datos de sesión necesarios para el funcionamiento del servicio.</li>
          </ul>
        </Section>

        <Section title="3. Para qué usamos tus datos">
          <ul className="list-disc list-inside space-y-2">
            <li>Permitirte publicar viajes, hacer reservas y contactar a otros usuarios.</li>
            <li>Mostrar tu perfil y calificación a otros usuarios de la plataforma.</li>
            <li>Enviarte notificaciones relacionadas con tus viajes o reservas.</li>
            <li>Mejorar el funcionamiento y la seguridad de la plataforma.</li>
            <li>Cumplir con obligaciones legales que correspondan.</li>
          </ul>
          <p className="mt-3">
            <strong>No vendemos ni cedemos tus datos personales a terceros</strong> con fines comerciales o
            publicitarios.
          </p>
        </Section>

        <Section title="4. Datos visibles para otros usuarios">
          <p>Parte de tu información es visible para otros usuarios de la plataforma:</p>
          <ul className="list-disc list-inside space-y-2 mt-3">
            <li><strong>Visible para todos:</strong> nombre, calificación, cantidad de viajes realizados y los viajes que publicás.</li>
            <li><strong>Visible solo para pasajeros con reserva confirmada:</strong> número de teléfono (si lo cargaste), punto de encuentro del viaje y datos del vehículo.</li>
            <li><strong>Nunca visible:</strong> correo electrónico, contraseña ni ningún otro dato de sesión.</li>
          </ul>
        </Section>

        <Section title="5. Almacenamiento y seguridad">
          <p>
            Los datos son almacenados en <strong>Supabase</strong>, una plataforma de base de datos con
            infraestructura en la nube que cumple con estándares de seguridad internacionales (cifrado en tránsito
            y en reposo, autenticación segura y control de acceso por roles).
          </p>
          <p className="mt-3">
            Las contraseñas nunca se almacenan en texto plano; se utiliza el sistema de autenticación de Supabase
            que aplica hashing seguro. Sin embargo, ningún sistema es 100% infalible. Te recomendamos usar una
            contraseña única y no compartirla con nadie.
          </p>
        </Section>

        <Section title="6. Tus derechos (Ley 25.326)">
          <p>
            Como titular de datos personales tenés los siguientes derechos, que podés ejercer de forma gratuita:
          </p>
          <ul className="list-disc list-inside space-y-2 mt-3">
            <li><strong>Acceso:</strong> conocer qué datos tuyos almacenamos.</li>
            <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
            <li><strong>Supresión:</strong> solicitar la eliminación de tus datos (derecho al olvido).</li>
            <li><strong>Confidencialidad:</strong> oponerte al tratamiento de tus datos para determinadas finalidades.</li>
          </ul>
          <p className="mt-3">
            Para ejercer cualquiera de estos derechos podés escribirnos desde{" "}
            <Link href="/contacto" className="text-sky-600 hover:underline">
              la página de contacto
            </Link>{" "}
            o a{" "}
            <a href="mailto:marcosjmelgar@gmail.com" className="text-sky-600 hover:underline">
              marcosjmelgar@gmail.com
            </a>.
            Responderemos dentro de los plazos previstos por la Ley 25.326.
          </p>
          <p className="mt-3">
            Si considerás que tus derechos no fueron atendidos, podés presentar una denuncia ante la{" "}
            <strong>Agencia de Acceso a la Información Pública (AAIP)</strong> en{" "}
            <span className="font-mono text-slate-500">www.argentina.gob.ar/aaip</span>.
          </p>
        </Section>

        <Section title="7. Retención de datos">
          <p>
            Tus datos se conservan mientras tu cuenta esté activa. Al solicitar la eliminación de tu cuenta,
            borraremos tus datos personales identificables, con excepción de aquellos que debamos conservar
            por obligaciones legales o para resolver disputas pendientes.
          </p>
          <p className="mt-3">
            Los viajes y reseñas pasados pueden conservarse de forma anonimizada para análisis estadístico
            del funcionamiento de la plataforma.
          </p>
        </Section>

        <Section title="8. Cookies y datos de sesión">
          <p>
            CarpoolingAR utiliza cookies de sesión estrictamente necesarias para mantenerte autenticado
            mientras navegás la plataforma. No utilizamos cookies de seguimiento, publicidad ni analítica de
            terceros.
          </p>
        </Section>

        <Section title="9. Menores de edad">
          <p>
            CarpoolingAR está destinado exclusivamente a personas mayores de 18 años. No recolectamos ni
            procesamos datos de menores de manera intencional. Si tomamos conocimiento de que un menor se ha
            registrado, procederemos a eliminar su cuenta y sus datos.
          </p>
        </Section>

        <Section title="10. Cambios a esta política">
          <p>
            Podemos actualizar esta Política de Privacidad en cualquier momento. Los cambios serán notificados
            mediante un aviso visible en la plataforma y entrarán en vigencia desde su publicación. El uso
            continuado del servicio después de dichos cambios implica la aceptación de la nueva política.
          </p>
        </Section>

        <Section title="11. Contacto">
          <p>
            Para consultas, solicitudes sobre tus datos o cualquier cuestión relacionada con esta política,
            podés escribirnos desde{" "}
            <Link href="/contacto" className="text-sky-600 hover:underline">
              la página de contacto
            </Link>{" "}
            o directamente a{" "}
            <a href="mailto:marcosjmelgar@gmail.com" className="text-sky-600 hover:underline">
              marcosjmelgar@gmail.com
            </a>.
          </p>
        </Section>

      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 px-6 py-5">
      <h2 className="text-base font-bold text-slate-800 mb-3">{title}</h2>
      <div className="text-sm text-slate-600 leading-relaxed">{children}</div>
    </section>
  );
}
