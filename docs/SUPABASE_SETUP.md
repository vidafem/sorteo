# Supabase Setup For Raffles

This project now includes a base schema for:

- authenticated users
- public player access by raffle code
- raffles with visible shareable codes
- participants per raffle
- two or more privileged users per raffle
- winner selection and participant elimination permissions

The SQL file is here:

- `supabase/migrations/20260417_001_raffles_core_schema.sql`

## 1. Apply the SQL in Supabase

1. Open your Supabase project.
2. Go to `SQL Editor`.
3. Paste the full contents of `supabase/migrations/20260417_001_raffles_core_schema.sql`.
4. Run it once.

This will create:

- `profiles`
- `raffles`
- `raffle_staff`
- `raffle_participants`
- `raffle_events`

It also enables RLS and creates the base security policies.

## 2. Create the two privileged users

1. Go to `Authentication > Users`.
2. Create the two users manually with email and password.
3. Their `profiles` rows will be created automatically by the trigger.

If you want to mark them as global admins in `profiles`, run:

```sql
update public.profiles
set role = 'admin'
where email in (
  'admin1@tudominio.com',
  'admin2@tudominio.com'
);
```

That global role is optional.

For your app, the most important permission is not the global role. The real access is controlled per raffle in `raffle_staff`.

## 3. How a raffle gets its shareable code

Each raffle has a `raffle_code` column.

- If your app sends a code, it will be normalized to uppercase.
- If your app does not send a code, the database generates one automatically.

That is the code you will show in the user dashboard with a copy button.

## 4. How to create a raffle manually

Example:

```sql
insert into public.raffles (
  owner_id,
  title,
  description,
  prize_name,
  status,
  draw_at,
  timezone_name,
  allow_public_join,
  show_live_participants,
  show_countdown
)
values (
  'OWNER_USER_UUID',
  'Sorteo de prueba',
  'Sorteo para participantes por codigo',
  'Premio sorpresa',
  'scheduled',
  '2026-04-30 20:00:00-05',
  'America/Bogota',
  true,
  true,
  true
);
```

The owner is automatically inserted into `raffle_staff` with full permissions.

## 5. Assign the two privileged users to one raffle

Run this after the raffle exists:

```sql
insert into public.raffle_staff (
  raffle_id,
  user_id,
  role,
  can_manage_raffle,
  can_pick_winner,
  can_eliminate_participants
)
select
  'RAFFLE_UUID',
  p.id,
  'manager',
  true,
  true,
  true
from public.profiles p
where p.email in (
  'admin1@tudominio.com',
  'admin2@tudominio.com'
)
on conflict (raffle_id, user_id) do nothing;
```

With that, those two users can:

- manage the raffle
- pick winners
- eliminate participants

Players will not have those permissions.

## 6. How participants join a raffle

Participants are stored per raffle in `raffle_participants`.

Example insert:

```sql
insert into public.raffle_participants (
  raffle_id,
  display_name,
  assigned_number
)
values (
  'RAFFLE_UUID',
  'Carlos Perez',
  17
);
```

The schema already protects uniqueness of the number inside each raffle:

- `unique (raffle_id, assigned_number)`

## 7. How to mark a winner

Example:

```sql
update public.raffle_participants
set status = 'winner'
where id = 'PARTICIPANT_UUID';

update public.raffles
set winner_participant_id = 'PARTICIPANT_UUID',
    status = 'closed'
where id = 'RAFFLE_UUID';
```

## 8. How to eliminate a participant

```sql
update public.raffle_participants
set status = 'eliminated'
where id = 'PARTICIPANT_UUID';
```

## 9. What this prepares for the next phase

This schema is ready for:

- `Crear sorteo`
- `Ingresar a un sorteo` by shareable code
- visible code in dashboard
- copy button in dashboard
- participants and occupied numbers per raffle
- countdown by date and time
- two privileged users for winner and elimination actions

## 10. Important note

Your current frontend still uses older demo logic in some places.

This schema is the correct base to move the app to a real multi-raffle flow. The next implementation step is wiring:

- dashboard -> `raffles`
- join form -> `raffle_code`
- participants list -> `raffle_participants`
- privileged controls -> `raffle_staff`
