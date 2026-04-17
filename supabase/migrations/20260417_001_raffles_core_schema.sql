create extension if not exists pgcrypto;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  role text not null default 'player' check (role in ('player', 'admin')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    'player'
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(excluded.display_name, public.profiles.display_name),
        updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create table if not exists public.raffles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  description text,
  prize_name text,
  raffle_code text not null unique,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'active', 'closed', 'cancelled')),
  draw_at timestamptz,
  timezone_name text not null default 'America/Bogota',
  allow_public_join boolean not null default true,
  show_live_participants boolean not null default true,
  show_countdown boolean not null default true,
  max_participants integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.generate_raffle_code()
returns text
language plpgsql
as $$
declare
  new_code text;
begin
  loop
    new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (
      select 1
      from public.raffles
      where raffle_code = new_code
    );
  end loop;

  return new_code;
end;
$$;

create or replace function public.handle_raffle_defaults()
returns trigger
language plpgsql
as $$
begin
  if new.raffle_code is null or btrim(new.raffle_code) = '' then
    new.raffle_code := public.generate_raffle_code();
  else
    new.raffle_code := upper(btrim(new.raffle_code));
  end if;

  return new;
end;
$$;

drop trigger if exists before_raffle_insert on public.raffles;

create trigger before_raffle_insert
before insert on public.raffles
for each row
execute function public.handle_raffle_defaults();

create table if not exists public.raffle_staff (
  raffle_id uuid not null references public.raffles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'manager' check (role in ('owner', 'manager', 'moderator')),
  can_manage_raffle boolean not null default false,
  can_pick_winner boolean not null default false,
  can_eliminate_participants boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (raffle_id, user_id)
);

create or replace function public.handle_new_raffle_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.raffle_staff (
    raffle_id,
    user_id,
    role,
    can_manage_raffle,
    can_pick_winner,
    can_eliminate_participants
  )
  values (
    new.id,
    new.owner_id,
    'owner',
    true,
    true,
    true
  )
  on conflict (raffle_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists after_raffle_insert on public.raffles;

create trigger after_raffle_insert
after insert on public.raffles
for each row
execute function public.handle_new_raffle_owner();

create table if not exists public.raffle_participants (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references public.raffles(id) on delete cascade,
  display_name text not null,
  assigned_number integer not null check (assigned_number > 0),
  status text not null default 'active' check (status in ('active', 'eliminated', 'winner')),
  joined_by_user_id uuid references auth.users(id) on delete set null,
  joined_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (raffle_id, assigned_number)
);

alter table public.raffles
add column if not exists winner_participant_id uuid references public.raffle_participants(id) on delete set null;

create table if not exists public.raffle_events (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references public.raffles(id) on delete cascade,
  participant_id uuid references public.raffle_participants(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (
    event_type in (
      'raffle_created',
      'participant_joined',
      'participant_eliminated',
      'winner_selected',
      'winner_removed',
      'staff_added',
      'staff_removed'
    )
  ),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_raffles_owner_id on public.raffles(owner_id);
create index if not exists idx_raffles_code on public.raffles(raffle_code);
create index if not exists idx_raffles_status on public.raffles(status);
create index if not exists idx_raffle_staff_user_id on public.raffle_staff(user_id);
create index if not exists idx_raffle_participants_raffle_id on public.raffle_participants(raffle_id);
create index if not exists idx_raffle_participants_status on public.raffle_participants(status);
create index if not exists idx_raffle_events_raffle_id on public.raffle_events(raffle_id);

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
before update on public.profiles
for each row
execute function public.touch_updated_at();

drop trigger if exists touch_raffles_updated_at on public.raffles;
create trigger touch_raffles_updated_at
before update on public.raffles
for each row
execute function public.touch_updated_at();

drop trigger if exists touch_raffle_participants_updated_at on public.raffle_participants;
create trigger touch_raffle_participants_updated_at
before update on public.raffle_participants
for each row
execute function public.touch_updated_at();

create or replace function public.is_raffle_staff(target_raffle_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.raffle_staff rs
    where rs.raffle_id = target_raffle_id
      and rs.user_id = auth.uid()
  );
$$;

create or replace function public.can_manage_raffle(target_raffle_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.raffle_staff rs
    where rs.raffle_id = target_raffle_id
      and rs.user_id = auth.uid()
      and (rs.role = 'owner' or rs.can_manage_raffle = true)
  );
$$;

create or replace function public.can_pick_winner_for_raffle(target_raffle_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.raffle_staff rs
    where rs.raffle_id = target_raffle_id
      and rs.user_id = auth.uid()
      and (
        rs.role = 'owner'
        or rs.can_manage_raffle = true
        or rs.can_pick_winner = true
      )
  );
$$;

create or replace function public.can_eliminate_participants_for_raffle(target_raffle_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.raffle_staff rs
    where rs.raffle_id = target_raffle_id
      and rs.user_id = auth.uid()
      and (
        rs.role = 'owner'
        or rs.can_manage_raffle = true
        or rs.can_eliminate_participants = true
      )
  );
$$;

alter table public.profiles enable row level security;
alter table public.raffles enable row level security;
alter table public.raffle_staff enable row level security;
alter table public.raffle_participants enable row level security;
alter table public.raffle_events enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "raffles_select_public_or_staff" on public.raffles;
create policy "raffles_select_public_or_staff"
on public.raffles
for select
to anon, authenticated
using (
  public.is_raffle_staff(id)
  or (
    allow_public_join = true
    and status in ('scheduled', 'active', 'closed')
  )
);

drop policy if exists "raffles_insert_owner" on public.raffles;
create policy "raffles_insert_owner"
on public.raffles
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "raffles_update_managers" on public.raffles;
create policy "raffles_update_managers"
on public.raffles
for update
to authenticated
using (public.can_manage_raffle(id))
with check (public.can_manage_raffle(id));

drop policy if exists "raffles_delete_managers" on public.raffles;
create policy "raffles_delete_managers"
on public.raffles
for delete
to authenticated
using (public.can_manage_raffle(id));

drop policy if exists "raffle_staff_select_staff" on public.raffle_staff;
create policy "raffle_staff_select_staff"
on public.raffle_staff
for select
to authenticated
using (
  public.is_raffle_staff(raffle_id)
  or public.can_manage_raffle(raffle_id)
);

drop policy if exists "raffle_staff_insert_managers" on public.raffle_staff;
create policy "raffle_staff_insert_managers"
on public.raffle_staff
for insert
to authenticated
with check (public.can_manage_raffle(raffle_id));

drop policy if exists "raffle_staff_update_managers" on public.raffle_staff;
create policy "raffle_staff_update_managers"
on public.raffle_staff
for update
to authenticated
using (public.can_manage_raffle(raffle_id))
with check (public.can_manage_raffle(raffle_id));

drop policy if exists "raffle_staff_delete_managers" on public.raffle_staff;
create policy "raffle_staff_delete_managers"
on public.raffle_staff
for delete
to authenticated
using (public.can_manage_raffle(raffle_id));

drop policy if exists "raffle_participants_select_public_or_staff" on public.raffle_participants;
create policy "raffle_participants_select_public_or_staff"
on public.raffle_participants
for select
to anon, authenticated
using (
  public.is_raffle_staff(raffle_id)
  or exists (
    select 1
    from public.raffles r
    where r.id = raffle_id
      and r.allow_public_join = true
      and r.show_live_participants = true
      and r.status in ('scheduled', 'active', 'closed')
  )
);

drop policy if exists "raffle_participants_insert_public_join" on public.raffle_participants;
create policy "raffle_participants_insert_public_join"
on public.raffle_participants
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.raffles r
    where r.id = raffle_id
      and r.allow_public_join = true
      and r.status in ('scheduled', 'active')
      and (r.max_participants is null or (
        select count(*)
        from public.raffle_participants rp
        where rp.raffle_id = raffle_id
      ) < r.max_participants)
  )
);

drop policy if exists "raffle_participants_update_staff" on public.raffle_participants;
create policy "raffle_participants_update_staff"
on public.raffle_participants
for update
to authenticated
using (
  public.can_manage_raffle(raffle_id)
  or public.can_pick_winner_for_raffle(raffle_id)
  or public.can_eliminate_participants_for_raffle(raffle_id)
)
with check (
  public.can_manage_raffle(raffle_id)
  or public.can_pick_winner_for_raffle(raffle_id)
  or public.can_eliminate_participants_for_raffle(raffle_id)
);

drop policy if exists "raffle_participants_delete_staff" on public.raffle_participants;
create policy "raffle_participants_delete_staff"
on public.raffle_participants
for delete
to authenticated
using (
  public.can_manage_raffle(raffle_id)
  or public.can_eliminate_participants_for_raffle(raffle_id)
);

drop policy if exists "raffle_events_select_staff" on public.raffle_events;
create policy "raffle_events_select_staff"
on public.raffle_events
for select
to authenticated
using (public.is_raffle_staff(raffle_id));

drop policy if exists "raffle_events_insert_join_or_staff" on public.raffle_events;
create policy "raffle_events_insert_join_or_staff"
on public.raffle_events
for insert
to anon, authenticated
with check (
  (
    event_type = 'participant_joined'
    and exists (
      select 1
      from public.raffles r
      where r.id = raffle_id
        and r.allow_public_join = true
        and r.status in ('scheduled', 'active')
    )
  )
  or public.is_raffle_staff(raffle_id)
);

grant execute on function public.generate_raffle_code() to anon, authenticated;
grant execute on function public.is_raffle_staff(uuid) to anon, authenticated;
grant execute on function public.can_manage_raffle(uuid) to authenticated;
grant execute on function public.can_pick_winner_for_raffle(uuid) to authenticated;
grant execute on function public.can_eliminate_participants_for_raffle(uuid) to authenticated;
