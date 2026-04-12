-- 1. Función faltante: incrementar cancelaciones tardías
create or replace function increment_late_cancellations(user_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.profiles
  set late_cancellations = late_cancellations + 1
  where id = user_id;
end;
$$;

-- 2. Fix confirm_booking: guard contra doble confirmación y asientos insuficientes
create or replace function confirm_booking(booking_id uuid)
returns void language plpgsql security definer as $$
declare
  v_trip_id   uuid;
  v_seats     int;
  v_driver    uuid;
  v_status    text;
  v_available int;
begin
  select b.trip_id, b.seats, t.driver_id, b.status
  into v_trip_id, v_seats, v_driver, v_status
  from bookings b
  join trips t on t.id = b.trip_id
  where b.id = booking_id;

  if v_driver <> auth.uid() then
    raise exception 'No autorizado';
  end if;

  -- Evitar doble confirmación
  if v_status <> 'pending' then
    raise exception 'La reserva no está en estado pendiente';
  end if;

  -- Confirmar con guard adicional en la query
  update bookings
  set status = 'confirmed'
  where id = booking_id and status = 'pending';

  -- Descontar asiento con guard para no ir negativo
  update trips
  set available_seats = available_seats - v_seats
  where id = v_trip_id
    and available_seats >= v_seats
  returning available_seats into v_available;

  if not found then
    -- Revertir el booking si no había asientos
    update bookings set status = 'pending' where id = booking_id;
    raise exception 'No hay suficientes asientos disponibles';
  end if;

  if v_available <= 0 then
    update trips set status = 'full' where id = v_trip_id;
  end if;
end;
$$;

-- 3. Trigger: cuando un viaje se completa, actualizar contadores de conductor y pasajeros
create or replace function on_trip_completed()
returns trigger language plpgsql security definer as $$
begin
  if NEW.status = 'completed' and OLD.status in ('active', 'full') then
    -- Incrementar viajes del conductor
    update public.profiles
    set trips_as_driver = trips_as_driver + 1
    where id = NEW.driver_id;

    -- Incrementar viajes de cada pasajero confirmado
    update public.profiles
    set trips_as_passenger = trips_as_passenger + 1
    where id in (
      select passenger_id
      from public.bookings
      where trip_id = NEW.id
        and status = 'confirmed'
    );
  end if;
  return NEW;
end;
$$;

create or replace trigger trg_on_trip_completed
  after update on public.trips
  for each row execute procedure on_trip_completed();
