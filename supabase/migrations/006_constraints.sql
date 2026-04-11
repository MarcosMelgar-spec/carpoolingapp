-- Precio no puede ser negativo
alter table public.trips
  add constraint price_non_negative check (price_per_seat >= 0);

-- Asientos disponibles no puede ser negativo
alter table public.trips
  add constraint seats_non_negative check (available_seats >= 0);

-- Fecha de salida debe ser posterior a la creación del viaje
alter table public.trips
  add constraint departure_after_creation check (departure_at > created_at);

-- Asientos reservados deben ser al menos 1
alter table public.bookings
  add constraint booking_seats_positive check (seats >= 1);

-- Función para verificar doble reserva (mismo pasajero, misma franja horaria ±3hs)
create or replace function check_double_booking(
  p_passenger_id uuid,
  p_trip_id uuid
)
returns boolean language plpgsql security definer as $$
declare
  v_departure timestamptz;
  v_conflict  int;
begin
  select departure_at into v_departure
  from trips where id = p_trip_id;

  select count(*) into v_conflict
  from bookings b
  join trips t on t.id = b.trip_id
  where b.passenger_id = p_passenger_id
    and b.status not in ('cancelled')
    and b.trip_id <> p_trip_id
    and t.departure_at between (v_departure - interval '3 hours')
                           and (v_departure + interval '3 hours');

  return v_conflict > 0;
end;
$$;
