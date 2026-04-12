import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Términos y condiciones — CarpoolingAR",
};

export default async function TerminosPage() {
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
          <h1 className="text-2xl font-bold text-white">Términos y condiciones</h1>
          <p className="text-white/60 text-sm mt-1">Última actualización: abril de 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        <Section title="1. Aceptación de los términos">
          <p>
            Al registrarte y utilizar CarpoolingAR aceptás en forma plena y sin reservas los presentes Términos y
            Condiciones de Uso. Si no estás de acuerdo con alguna de estas condiciones, no debés utilizar la
            plataforma. CarpoolingAR se reserva el derecho de modificar estos términos en cualquier momento; los
            cambios entrarán en vigencia desde su publicación en el sitio.
          </p>
        </Section>

        <Section title="2. Descripción del servicio">
          <p>
            CarpoolingAR es una plataforma digital de intermediación que permite a personas que realizan un mismo
            trayecto compartir los gastos del viaje en automóvil particular. CarpoolingAR <strong>no es una empresa de
            transporte</strong>, no presta servicios de transporte de pasajeros y no es parte de ningún contrato
            de transporte entre conductores y pasajeros.
          </p>
          <p className="mt-3">
            La plataforma actúa exclusivamente como un tablero de anuncios digital, facilitando el contacto entre
            usuarios que desean compartir viajes. La relación contractual se establece directamente entre conductor
            y pasajero, sin intervención de CarpoolingAR.
          </p>
        </Section>

        <Section title="3. Requisitos para registrarse">
          <ul className="list-disc list-inside space-y-2">
            <li>Ser mayor de 18 años y tener plena capacidad jurídica para contratar bajo la legislación argentina.</li>
            <li>Proporcionar datos verídicos, precisos y actualizados al momento del registro.</li>
            <li>Cada persona puede tener una única cuenta. El registro de múltiples cuentas puede derivar en la suspensión de todas ellas.</li>
            <li>La persona registrada debe ser quien efectivamente realice el viaje. No está permitido registrarse en nombre de terceros.</li>
          </ul>
        </Section>

        <Section title="4. Obligaciones del conductor">
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Principio de viaje propio:</strong> El conductor debe estar realizando el trayecto publicado por
              motivos propios, independientemente de la existencia de pasajeros. No puede publicar viajes cuyo único
              fin sea trasladar pasajeros a cambio de dinero.
            </li>
            <li>
              <strong>Límite de contribución:</strong> El monto que puede solicitar a los pasajeros no puede superar
              la parte proporcional de los gastos reales del viaje (combustible y peajes). Cobrar un monto que implique
              lucro puede invalidar la cobertura del seguro del vehículo y encuadrar la actividad como transporte
              remunerado no habilitado.
            </li>
            <li>
              <strong>Documentación vigente:</strong> El conductor debe contar con licencia de conducir vigente,
              seguro del vehículo al día (que cubra a terceros transportados) y la documentación del vehículo en
              regla conforme la legislación argentina.
            </li>
            <li>
              <strong>Veracidad del anuncio:</strong> La información publicada (origen, destino, fecha, horario,
              precio y vehículo) debe ser exacta y actualizada.
            </li>
            <li>
              <strong>Cancelaciones:</strong> El conductor debe notificar con la mayor anticipación posible cualquier
              cancelación del viaje, especialmente cuando ya existen pasajeros confirmados.
            </li>
          </ul>
        </Section>

        <Section title="5. Obligaciones del pasajero">
          <ul className="list-disc list-inside space-y-2">
            <li>Respetar el horario y el punto de encuentro acordado con el conductor.</li>
            <li>Abonar la contribución acordada al momento pactado.</li>
            <li>Comportarse de manera apropiada durante el viaje y respetar las indicaciones del conductor.</li>
            <li>Notificar al conductor con anticipación si no puede presentarse al viaje.</li>
            <li>Llevar únicamente el equipaje acordado previamente con el conductor.</li>
          </ul>
        </Section>

        <Section title="6. Precios y contribución a los gastos">
          <p>
            Los precios publicados en CarpoolingAR representan la <strong>contribución a los gastos del viaje</strong>
            y no el precio de un servicio de transporte. Los conductores establecen libremente el monto solicitado,
            el cual no debería exceder la división proporcional de los gastos reales del trayecto.
          </p>
          <p className="mt-3">
            CarpoolingAR no cobra comisión por viaje ni interviene en las transacciones económicas entre usuarios.
            Los pagos se acuerdan y realizan directamente entre conductor y pasajero.
          </p>
        </Section>

        <Section title="7. Responsabilidad de la plataforma">
          <p>
            CarpoolingAR no garantiza la realización efectiva de ningún viaje ni las condiciones en que este se
            desarrollará. La plataforma no asume responsabilidad por:
          </p>
          <ul className="list-disc list-inside space-y-2 mt-3">
            <li>Accidentes, daños personales o materiales ocurridos durante los viajes.</li>
            <li>Incumplimientos, cancelaciones o comportamientos inadecuados de los usuarios.</li>
            <li>La veracidad de la información proporcionada por los usuarios.</li>
            <li>La validez del seguro del vehículo del conductor.</li>
            <li>Pérdidas, robos u otros daños a objetos personales durante el viaje.</li>
          </ul>
          <p className="mt-3">
            CarpoolingAR hace sus mejores esfuerzos por mantener la plataforma disponible, pero no garantiza un
            funcionamiento ininterrumpido ni libre de errores.
          </p>
        </Section>

        <Section title="8. Conductas prohibidas">
          <p>Queda expresamente prohibido:</p>
          <ul className="list-disc list-inside space-y-2 mt-3">
            <li>Utilizar la plataforma con fines comerciales o como empresa de transporte remunerado.</li>
            <li>Publicar datos falsos o engañosos en los anuncios.</li>
            <li>Publicar o compartir datos personales de terceros sin su consentimiento.</li>
            <li>Realizar múltiples registros o usurpar la identidad de otra persona.</li>
            <li>Utilizar la plataforma para actividades ilícitas.</li>
            <li>Interferir con el funcionamiento técnico de la plataforma.</li>
            <li>Acosar, amenazar o intimidar a otros usuarios.</li>
          </ul>
        </Section>

        <Section title="9. Suspensión y baja de cuentas">
          <p>
            CarpoolingAR puede suspender o dar de baja una cuenta, con o sin previo aviso, ante el incumplimiento
            de estos términos, reportes de otros usuarios o cualquier conducta que considere perjudicial para la
            comunidad o la plataforma.
          </p>
        </Section>

        <Section title="10. Propiedad intelectual">
          <p>
            Todos los contenidos de CarpoolingAR (diseño, código, marca, textos) son propiedad de sus creadores
            y están protegidos por la legislación argentina sobre propiedad intelectual. Los usuarios no pueden
            reproducir, distribuir ni modificar dichos contenidos sin autorización expresa.
          </p>
        </Section>

        <Section title="11. Ley aplicable y jurisdicción">
          <p>
            Estos términos se rigen por la legislación de la República Argentina. Ante cualquier controversia,
            las partes se someten a la jurisdicción de los Tribunales Ordinarios de la Ciudad de Rosario,
            Provincia de Santa Fe, renunciando a cualquier otro fuero que pudiera corresponder.
          </p>
        </Section>

        <Section title="12. Contacto">
          <p>
            Para consultas sobre estos términos podés escribirnos desde{" "}
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
