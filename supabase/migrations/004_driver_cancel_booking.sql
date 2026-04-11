-- Conductor cancela la reserva de un pasajero y libera el asiento
create or replace function driver_cancel_booking(booking_id uuid)
returns void language plpgsql security definer as $$
declare
  v_trip_id uuid;
  v_seats   int;
  v_status  text;
  v_driver  uuid;
begin
  -- Verificar que el caller es el conductor del viaje
  select b.trip_id, b.seats, b.status, t.driver_id
  into v_trip_id, v_seats, v_status, v_driver
  from bookings b
  join trips t on t.id = b.trip_id
  where b.id = booking_id;

  if v_driver <> auth.uid() then
    raise exception 'No autorizado';
  end if;

  -- Cancelar la reserva
  update bookings
  set status              = 'cancelled',
      cancelled_at        = now(),
      cancellation_reason = 'Cancelado por el conductor'
  where id = booking_id;

  -- Solo restaurar asiento si la reserva estaba confirmada
  if v_status = 'confirmed' then
    update trips
    set available_seats = available_seats + v_seats,
        status = case
          when status = 'full' then 'active'
          else status
        end
    where id = v_trip_id;
  end if;
end;
$$;
