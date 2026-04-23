alter table public.bookings
  add column has_pet          boolean not null default false,
  add column has_large_luggage boolean not null default false,
  add column passenger_note   text check (char_length(passenger_note) <= 200);
