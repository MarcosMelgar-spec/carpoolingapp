-- Función para que el conductor confirme una reserva
-- Usa security definer para poder actualizar booking + trip en una sola transacción
create or replace function confirm_booking(booking_id uuid)
returns void language plpgsql security definer as $$
declare
  v_trip_id uuid;
  v_seats   int;
  v_driver  uuid;
  v_available int;
begin
  -- Verificar que el caller es el conductor del viaje
  select b.trip_id, b.seats, t.driver_id
  into v_trip_id, v_seats, v_driver
  from bookings b
  join trips t on t.id = b.trip_id
  where b.id = booking_id;

  if v_driver <> auth.uid() then
    raise exception 'No autorizado';
  end if;

  -- Confirmar la reserva
  update bookings
  set status = 'confirmed'
  where id = booking_id;

  -- Descontar asiento del viaje
  update trips
  set available_seats = available_seats - v_seats
  where id = v_trip_id
  returning available_seats into v_available;

  -- Si no quedan lugares, marcar como completo
  if v_available <= 0 then
    update trips set status = 'full' where id = v_trip_id;
  end if;
end;
$$;

-- Función para que el conductor rechace una reserva
create or replace function reject_booking(booking_id uuid)
returns void language plpgsql security definer as $$
declare
  v_driver uuid;
begin
  select t.driver_id into v_driver
  from bookings b
  join trips t on t.id = b.trip_id
  where b.id = booking_id;

  if v_driver <> auth.uid() then
    raise exception 'No autorizado';
  end if;

  update bookings
  set status      = 'cancelled',
      cancelled_at = now(),
      cancellation_reason = 'Rechazado por el conductor'
  where id = booking_id;
end;
$$;
