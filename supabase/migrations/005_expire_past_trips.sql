-- Marca como "completed" todos los viajes activos cuya fecha ya pasó
create or replace function expire_past_trips()
returns void language plpgsql security definer as $$
begin
  update public.trips
  set status = 'completed'
  where status in ('active', 'full')
    and departure_at < now();
end;
$$;

-- Trigger: cuando se consulta un viaje, si ya pasó lo marca automáticamente
create or replace function auto_expire_trip()
returns trigger language plpgsql as $$
begin
  if NEW.departure_at < now() and NEW.status in ('active', 'full') then
    NEW.status := 'completed';
  end if;
  return NEW;
end;
$$;

create or replace trigger trg_auto_expire_trip
  before update on public.trips
  for each row execute procedure auto_expire_trip();
