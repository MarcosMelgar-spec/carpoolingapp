-- Información del vehículo del conductor
alter table public.profiles
  add column if not exists car_model text check (char_length(car_model) <= 100),
  add column if not exists car_color text check (char_length(car_color) <= 50),
  add column if not exists car_plate text check (char_length(car_plate) <= 10);
