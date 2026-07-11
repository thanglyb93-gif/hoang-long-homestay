# Supabase SQL — `bookings` table

This table already exists in your project (`gtktzhiznhdytofkkbwp`) with 0 rows and realtime enabled. Re-run only if you're setting this up on a new project.

```sql
create table public.bookings (
  id               uuid primary key default gen_random_uuid(),
  ref              text not null unique,
  guest_name       text not null default '',
  guest_phone      text not null default '',
  guest_email      text not null default '',
  nationality      text not null default '',
  room_id          text not null default '',
  room_name        text not null default '',
  room_number      text not null default '',
  check_in         date not null,
  check_out        date not null,
  nights           integer not null default 0,
  guests           integer not null default 1,
  total_price      integer not null default 0,
  status           text not null default 'pending',
  special_requests text not null default '',
  payment_method   text not null default '',
  created_at       timestamptz not null default now()
);

create index bookings_status_idx on public.bookings (status);
create index bookings_check_in_idx on public.bookings (check_in);

alter publication supabase_realtime add table public.bookings;
```

## Note: extra columns beyond your spec

`room_number`, `nationality`, and `payment_method` were added beyond the 14 columns you originally listed — the existing admin UI (BookingsPanel, dashboard, revenue panel) already displays these fields for every booking, so dropping them would have broken those screens. Also `ref` is `unique` and `not null` (your spec didn't say, but the app relies on it as the lookup key everywhere).

## Security — currently open

RLS is disabled on `bookings` (matching every other table in this project — `admin_data`, `pricing`, `settings`, `room_store`). The anon key visible in your frontend bundle has full read/write on all guest PII and can forge status changes. This mirrors the existing project pattern rather than introducing a new gap, but it's worth locking down. If you want that, ask and I'll draft RLS policies (e.g., public insert-only for the booking form, update/select restricted to a service-role-backed API route rather than the anon key) rather than just running the blanket "enable RLS" statement, which would break the app without matching policies.
