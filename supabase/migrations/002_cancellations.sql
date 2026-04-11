-- Cancelaciones en reservas
alter table public.bookings
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_reason text;

-- Cancelaciones en viajes
alter table public.trips
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_reason text;

-- Historial de mal comportamiento en perfiles
alter table public.profiles
  add column if not exists late_cancellations int default 0,
  add column if not exists trips_cancelled_as_driver int default 0;
