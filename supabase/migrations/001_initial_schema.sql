-- ─── Profiles ─────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  avatar_url  text,
  phone       text,
  rating      numeric(3,2) default 5.00,
  trips_as_driver    int default 0,
  trips_as_passenger int default 0,
  created_at  timestamptz default now()
);

-- Create profile automatically when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'Usuario'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Trips ────────────────────────────────────────────────────────────────────
create table if not exists public.trips (
  id              uuid primary key default gen_random_uuid(),
  driver_id       uuid not null references public.profiles(id) on delete cascade,
  origin          text not null,
  origin_lat      float8 not null,
  origin_lng      float8 not null,
  destination     text not null,
  destination_lat float8 not null,
  destination_lng float8 not null,
  departure_at    timestamptz not null,
  available_seats int not null check (available_seats between 1 and 8),
  price_per_seat  numeric(10,2) not null default 0,
  description     text,
  status          text not null default 'active'
                  check (status in ('active','full','cancelled','completed')),
  created_at      timestamptz default now()
);

-- ─── Bookings ─────────────────────────────────────────────────────────────────
create table if not exists public.bookings (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid not null references public.trips(id) on delete cascade,
  passenger_id uuid not null references public.profiles(id) on delete cascade,
  seats        int not null default 1 check (seats >= 1),
  status       text not null default 'pending'
               check (status in ('pending','confirmed','cancelled')),
  created_at   timestamptz default now(),
  unique(trip_id, passenger_id)
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.trips     enable row level security;
alter table public.bookings  enable row level security;

-- Profiles: anyone can read, only owner can update
create policy "Profiles are publicly readable"
  on public.profiles for select using (true);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Trips: anyone can read active trips, only driver can insert/update
create policy "Active trips are publicly readable"
  on public.trips for select using (true);
create policy "Drivers can insert trips"
  on public.trips for insert with check (auth.uid() = driver_id);
create policy "Drivers can update their own trips"
  on public.trips for update using (auth.uid() = driver_id);

-- Bookings: passengers can read their own, drivers can read bookings for their trips
create policy "Passengers can read their own bookings"
  on public.bookings for select using (auth.uid() = passenger_id);
create policy "Drivers can read bookings for their trips"
  on public.bookings for select using (
    auth.uid() = (select driver_id from public.trips where id = trip_id)
  );
create policy "Passengers can create bookings"
  on public.bookings for insert with check (auth.uid() = passenger_id);
create policy "Passengers can cancel their own bookings"
  on public.bookings for update using (auth.uid() = passenger_id);
