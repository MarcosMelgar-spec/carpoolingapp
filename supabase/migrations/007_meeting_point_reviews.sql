-- Punto de encuentro en viajes (opcional, solo visible para confirmados)
alter table public.trips add column if not exists meeting_point text check (char_length(meeting_point) <= 200);

-- Tabla de reviews
create table if not exists public.reviews (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid references public.trips(id) on delete cascade not null,
  reviewer_id  uuid references auth.users(id) on delete cascade not null,
  reviewed_id  uuid references auth.users(id) on delete cascade not null,
  rating       integer not null check (rating between 1 and 5),
  comment      text check (char_length(comment) <= 300),
  created_at   timestamptz default now() not null,
  unique(trip_id, reviewer_id, reviewed_id)
);

alter table public.reviews enable row level security;

create policy "reviews_select" on public.reviews
  for select using (true);

create policy "reviews_insert" on public.reviews
  for insert with check (auth.uid() = reviewer_id);

-- Función: enviar review y actualizar rating promedio del perfil
create or replace function submit_review(
  p_trip_id     uuid,
  p_reviewed_id uuid,
  p_rating      integer,
  p_comment     text default null
)
returns void language plpgsql security definer as $$
declare
  v_reviewer_id uuid := auth.uid();
  v_new_avg     numeric;
begin
  insert into public.reviews(trip_id, reviewer_id, reviewed_id, rating, comment)
  values (p_trip_id, v_reviewer_id, p_reviewed_id, p_rating, p_comment);

  select avg(rating) into v_new_avg
  from public.reviews where reviewed_id = p_reviewed_id;

  update public.profiles
  set rating = round(v_new_avg::numeric, 1)
  where id = p_reviewed_id;
end;
$$;
