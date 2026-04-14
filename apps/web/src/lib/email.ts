const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://carpoolingapp.vercel.app";

function base(content: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
    <div style="background:#1e3a5f;padding:24px 32px">
      <p style="margin:0;color:#fff;font-size:18px;font-weight:700">CarpoolingAR</p>
    </div>
    <div style="padding:32px">
      ${content}
    </div>
    <div style="padding:16px 32px;border-top:1px solid #f1f5f9;text-align:center">
      <p style="margin:0;font-size:12px;color:#94a3b8">Este es un mensaje automático de CarpoolingAR. No respondas este email.</p>
    </div>
  </div>
</body>
</html>`;
}

function btn(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;background:#1e3a5f;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600">${label}</a>`;
}

function trip(origin: string, destination: string) {
  return `<p style="margin:12px 0 0;font-size:20px;font-weight:700;color:#1e3a5f">${origin} → ${destination}</p>`;
}

function date(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ──────────────────────────────────────────
// Templates
// ──────────────────────────────────────────

export function bookingRequestedEmail(data: {
  driverName: string;
  passengerName: string;
  origin: string;
  destination: string;
  departureAt: string;
  tripId: string;
}) {
  return {
    subject: `Nueva solicitud de reserva — ${data.origin} → ${data.destination}`,
    html: base(`
      <p style="margin:0;font-size:16px;font-weight:600;color:#1e293b">Hola ${data.driverName} 👋</p>
      <p style="margin:12px 0 0;font-size:14px;color:#475569"><strong>${data.passengerName}</strong> quiere reservar un lugar en tu viaje:</p>
      ${trip(data.origin, data.destination)}
      <p style="margin:8px 0 0;font-size:14px;color:#64748b;text-transform:capitalize">${date(data.departureAt)}</p>
      <p style="margin:16px 0 0;font-size:14px;color:#475569">Entrá al viaje para confirmar o rechazar la solicitud.</p>
      ${btn(`${APP_URL}/trips/${data.tripId}`, "Ver solicitud")}
    `),
  };
}

export function bookingConfirmedEmail(data: {
  passengerName: string;
  driverName: string;
  origin: string;
  destination: string;
  departureAt: string;
  tripId: string;
}) {
  return {
    subject: `¡Reserva confirmada! ${data.origin} → ${data.destination}`,
    html: base(`
      <p style="margin:0;font-size:16px;font-weight:600;color:#1e293b">Hola ${data.passengerName} 👋</p>
      <p style="margin:12px 0 0;font-size:14px;color:#475569"><strong>${data.driverName}</strong> confirmó tu lugar en el viaje:</p>
      ${trip(data.origin, data.destination)}
      <p style="margin:8px 0 0;font-size:14px;color:#64748b;text-transform:capitalize">${date(data.departureAt)}</p>
      <div style="margin-top:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px">
        <p style="margin:0;font-size:14px;color:#16a34a;font-weight:600">✓ Tu reserva está confirmada</p>
        <p style="margin:4px 0 0;font-size:13px;color:#15803d">Entrá al viaje para ver el punto de encuentro y contactar al conductor.</p>
      </div>
      ${btn(`${APP_URL}/trips/${data.tripId}`, "Ver mi viaje")}
    `),
  };
}

export function bookingRejectedEmail(data: {
  passengerName: string;
  driverName: string;
  origin: string;
  destination: string;
  departureAt: string;
}) {
  return {
    subject: `Reserva no disponible — ${data.origin} → ${data.destination}`,
    html: base(`
      <p style="margin:0;font-size:16px;font-weight:600;color:#1e293b">Hola ${data.passengerName},</p>
      <p style="margin:12px 0 0;font-size:14px;color:#475569">Lamentablemente <strong>${data.driverName}</strong> no pudo aceptar tu reserva para:</p>
      ${trip(data.origin, data.destination)}
      <p style="margin:8px 0 0;font-size:14px;color:#64748b;text-transform:capitalize">${date(data.departureAt)}</p>
      <p style="margin:16px 0 0;font-size:14px;color:#475569">Podés buscar otro viaje disponible en la plataforma.</p>
      ${btn(`${APP_URL}`, "Buscar viajes")}
    `),
  };
}

export function tripCancelledEmail(data: {
  passengerName: string;
  driverName: string;
  origin: string;
  destination: string;
  departureAt: string;
  reason: string;
}) {
  return {
    subject: `Viaje cancelado — ${data.origin} → ${data.destination}`,
    html: base(`
      <p style="margin:0;font-size:16px;font-weight:600;color:#1e293b">Hola ${data.passengerName},</p>
      <p style="margin:12px 0 0;font-size:14px;color:#475569">El conductor <strong>${data.driverName}</strong> canceló el siguiente viaje:</p>
      ${trip(data.origin, data.destination)}
      <p style="margin:8px 0 0;font-size:14px;color:#64748b;text-transform:capitalize">${date(data.departureAt)}</p>
      ${data.reason ? `<p style="margin:12px 0 0;font-size:13px;color:#64748b">Motivo: ${data.reason}</p>` : ""}
      <p style="margin:16px 0 0;font-size:14px;color:#475569">Tu reserva fue cancelada automáticamente. Podés buscar otro viaje disponible.</p>
      ${btn(`${APP_URL}`, "Buscar viajes")}
    `),
  };
}

export function bookingCancelledByPassengerEmail(data: {
  driverName: string;
  passengerName: string;
  origin: string;
  destination: string;
  departureAt: string;
  tripId: string;
}) {
  return {
    subject: `${data.passengerName} canceló su reserva — ${data.origin} → ${data.destination}`,
    html: base(`
      <p style="margin:0;font-size:16px;font-weight:600;color:#1e293b">Hola ${data.driverName},</p>
      <p style="margin:12px 0 0;font-size:14px;color:#475569"><strong>${data.passengerName}</strong> canceló su reserva en tu viaje:</p>
      ${trip(data.origin, data.destination)}
      <p style="margin:8px 0 0;font-size:14px;color:#64748b;text-transform:capitalize">${date(data.departureAt)}</p>
      <p style="margin:16px 0 0;font-size:14px;color:#475569">El lugar quedó disponible nuevamente.</p>
      ${btn(`${APP_URL}/trips/${data.tripId}`, "Ver mi viaje")}
    `),
  };
}

export function bookingCancelledByDriverEmail(data: {
  passengerName: string;
  driverName: string;
  origin: string;
  destination: string;
  departureAt: string;
}) {
  return {
    subject: `Tu reserva fue cancelada — ${data.origin} → ${data.destination}`,
    html: base(`
      <p style="margin:0;font-size:16px;font-weight:600;color:#1e293b">Hola ${data.passengerName},</p>
      <p style="margin:12px 0 0;font-size:14px;color:#475569">El conductor <strong>${data.driverName}</strong> canceló tu reserva en el siguiente viaje:</p>
      ${trip(data.origin, data.destination)}
      <p style="margin:8px 0 0;font-size:14px;color:#64748b;text-transform:capitalize">${date(data.departureAt)}</p>
      <p style="margin:16px 0 0;font-size:14px;color:#475569">Podés buscar otro viaje disponible en la plataforma.</p>
      ${btn(`${APP_URL}`, "Buscar viajes")}
    `),
  };
}
