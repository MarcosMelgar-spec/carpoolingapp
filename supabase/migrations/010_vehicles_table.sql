-- Eliminar columnas de vehículo simple de profiles (reemplazado por tabla vehicles)
alter table public.profiles
  drop column if exists car_model,
  drop column if exists car_color,
  drop column if exists car_plate;

-- Tabla de vehículos (un usuario puede tener varios)
create table if not exists public.vehicles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  car_model  text not null check (char_length(car_model) >= 2 and char_length(car_model) <= 100),
  car_color  text not null check (char_length(car_color) >= 2 and char_length(car_color) <= 50),
  car_plate  text not null check (char_length(car_plate) >= 5 and char_length(car_plate) <= 10),
  created_at timestamptz default now() not null,
  unique(user_id, car_plate)
);

alter table public.vehicles enable row level security;

-- El dueño puede gestionar sus vehículos
create policy "vehicles_owner" on public.vehicles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Guardar snapshot del vehículo elegido en el viaje
alter table public.trips
  add column if not exists vehicle_model text,
  add column if not exists vehicle_color text,
  add column if not exists vehicle_plate text;
