-- Máximo de viajes activos por conductor (3)
create or replace function public.check_driver_trip_limit(p_driver_id uuid)
returns boolean language plpgsql security definer as $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.trips
  where driver_id = p_driver_id
    and status in ('active', 'full')
    and departure_at > now();
  return v_count >= 3;
end;
$$;

-- Pasajero bloqueado por cancelaciones tardías (3 o más)
create or replace function public.check_passenger_blocked(p_passenger_id uuid)
returns boolean language plpgsql security definer as $$
declare
  v_late int;
begin
  select coalesce(late_cancellations, 0) into v_late
  from public.profiles where id = p_passenger_id;
  return v_late >= 3;
end;
$$;

-- Reserva en el mismo día calendario (huso horario Argentina)
create or replace function public.check_same_day_booking(
  p_passenger_id uuid,
  p_trip_id      uuid
)
returns boolean language plpgsql security definer as $$
declare
  v_departure timestamptz;
  v_count     int;
begin
  select departure_at into v_departure
  from public.trips where id = p_trip_id;

  select count(*) into v_count
  from public.bookings b
  join public.trips t on t.id = b.trip_id
  where b.passenger_id = p_passenger_id
    and b.status = 'confirmed'
    and b.trip_id <> p_trip_id
    and (t.departure_at at time zone 'America/Argentina/Buenos_Aires')::date
      = (v_departure    at time zone 'America/Argentina/Buenos_Aires')::date;

  return v_count > 0;
end;
$$;
