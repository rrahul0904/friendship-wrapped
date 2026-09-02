-- Story Platform reference schema for optional Supabase activation.
-- Generate a real migration with `supabase migration new story_platform` before applying in a dedicated project.
-- ThreadTales story_runs MUST contain derived results only; raw imported chat messages are never persisted.
-- This schema has NOT been applied automatically to any Supabase project by this repository.

create extension if not exists pgcrypto;

create table if not exists public.worlds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product text not null check (product in ('threadtales','myyear','petlife','relationship','lifemap','babystory','homestory','familytree','founderworld','creatorworld')),
  title text not null check (char_length(title) between 1 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.story_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  world_id uuid references public.worlds(id) on delete cascade,
  product text not null check (product in ('threadtales','myyear','petlife','relationship','lifemap','babystory','homestory','familytree','founderworld','creatorworld')),
  mode text,
  title text not null check (char_length(title) between 1 and 160),
  result jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.share_manifests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  story_run_id uuid not null references public.story_runs(id) on delete cascade,
  manifest jsonb not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

-- Normalized, opt-in event records for all ten product worlds. Raw imported
-- chat messages must never be inserted here; ThreadTales stores derived output only.
create table if not exists public.story_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  world_id uuid not null references public.worlds(id) on delete cascade,
  product text not null check (product in ('threadtales','myyear','petlife','relationship','lifemap','babystory','homestory','familytree','founderworld','creatorworld')),
  event_type text not null check (char_length(event_type) between 1 and 80),
  occurred_at timestamptz not null,
  title text not null check (char_length(title) between 1 and 160),
  description text check (description is null or char_length(description) <= 2000),
  people jsonb not null default '[]'::jsonb check (jsonb_typeof(people) = 'array'),
  location text check (location is null or char_length(location) <= 160),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  product text not null,
  provider text not null check (provider in ('stripe','manual')),
  provider_reference text not null,
  status text not null default 'active' check (status in ('active','revoked','expired')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique(provider, provider_reference)
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  world_id uuid references public.worlds(id) on delete cascade,
  bucket text not null default 'private-media',
  object_path text not null,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  created_at timestamptz not null default now(),
  unique(bucket, object_path)
);

-- PetLife collaboration model. Media bytes are deliberately not required for the MVP.
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.household_memberships (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  role text not null check (role in ('owner','member')),
  can_add_memories boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table if not exists public.pets (
  id uuid primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  species text not null check (char_length(species) between 1 and 60),
  birthday date,
  adoption_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pet_memories (
  id uuid primary key,
  pet_id uuid not null references public.pets(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  memory_type text not null check (memory_type in ('memory','milestone')),
  memory_date date not null,
  title text not null check (char_length(title) between 1 and 120),
  note text check (note is null or char_length(note) <= 500),
  photo_count integer not null default 0 check (photo_count between 0 and 12),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  can_add_memories boolean not null default true,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists story_runs_user_created_idx on public.story_runs(user_id, created_at desc);
create index if not exists worlds_user_product_idx on public.worlds(user_id, product);
create index if not exists share_manifests_story_idx on public.share_manifests(story_run_id);
create index if not exists story_events_world_date_idx on public.story_events(world_id, occurred_at desc);
create index if not exists media_assets_world_idx on public.media_assets(world_id);
create index if not exists households_owner_idx on public.households(owner_id);
create index if not exists memberships_user_idx on public.household_memberships(user_id);
create index if not exists pets_household_idx on public.pets(household_id);
create index if not exists pet_memories_pet_date_idx on public.pet_memories(pet_id, memory_date desc);
create index if not exists pet_memories_household_idx on public.pet_memories(household_id);
create index if not exists household_invites_household_idx on public.household_invites(household_id, expires_at desc);

alter table public.worlds enable row level security;
alter table public.story_runs enable row level security;
alter table public.share_manifests enable row level security;
alter table public.story_events enable row level security;
alter table public.entitlements enable row level security;
alter table public.media_assets enable row level security;
alter table public.households enable row level security;
alter table public.household_memberships enable row level security;
alter table public.pets enable row level security;
alter table public.pet_memories enable row level security;
alter table public.household_invites enable row level security;

create policy "worlds_select_own" on public.worlds for select to authenticated using ((select auth.uid()) = user_id);
create policy "worlds_insert_own" on public.worlds for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "worlds_update_own" on public.worlds for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "worlds_delete_own" on public.worlds for delete to authenticated using ((select auth.uid()) = user_id);

create policy "story_runs_select_own" on public.story_runs for select to authenticated using ((select auth.uid()) = user_id);
create policy "story_runs_insert_own" on public.story_runs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "story_runs_update_own" on public.story_runs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "story_runs_delete_own" on public.story_runs for delete to authenticated using ((select auth.uid()) = user_id);

create policy "share_manifests_select_own" on public.share_manifests for select to authenticated using ((select auth.uid()) = user_id);
create policy "share_manifests_insert_own" on public.share_manifests for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "share_manifests_update_own" on public.share_manifests for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "share_manifests_delete_own" on public.share_manifests for delete to authenticated using ((select auth.uid()) = user_id);

create policy "story_events_select_own" on public.story_events for select to authenticated using ((select auth.uid()) = user_id);
create policy "story_events_insert_own" on public.story_events for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "story_events_update_own" on public.story_events for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "story_events_delete_own" on public.story_events for delete to authenticated using ((select auth.uid()) = user_id);

create policy "entitlements_select_own" on public.entitlements for select to authenticated using ((select auth.uid()) = user_id);
create policy "media_assets_select_own" on public.media_assets for select to authenticated using ((select auth.uid()) = user_id);
create policy "media_assets_insert_own" on public.media_assets for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "media_assets_update_own" on public.media_assets for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "media_assets_delete_own" on public.media_assets for delete to authenticated using ((select auth.uid()) = user_id);

-- Household rows are managed by their owner. Members derive access through membership rows.
create policy "households_select_owner" on public.households for select to authenticated using ((select auth.uid()) = owner_id);
create policy "households_insert_owner" on public.households for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "households_update_owner" on public.households for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "households_delete_owner" on public.households for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "memberships_select_self_or_owner" on public.household_memberships for select to authenticated using (
  (select auth.uid()) = user_id or exists (
    select 1 from public.households h where h.id = household_id and h.owner_id = (select auth.uid())
  )
);
create policy "memberships_insert_owner" on public.household_memberships for insert to authenticated with check (
  exists (select 1 from public.households h where h.id = household_id and h.owner_id = (select auth.uid()))
);
create policy "memberships_update_owner" on public.household_memberships for update to authenticated using (
  exists (select 1 from public.households h where h.id = household_id and h.owner_id = (select auth.uid()))
) with check (
  exists (select 1 from public.households h where h.id = household_id and h.owner_id = (select auth.uid()))
);
create policy "memberships_delete_owner" on public.household_memberships for delete to authenticated using (
  exists (select 1 from public.households h where h.id = household_id and h.owner_id = (select auth.uid()))
);

create policy "pets_select_household" on public.pets for select to authenticated using (
  exists (select 1 from public.households h where h.id = household_id and h.owner_id = (select auth.uid()))
  or exists (select 1 from public.household_memberships hm where hm.household_id = household_id and hm.user_id = (select auth.uid()))
);
create policy "pets_insert_owner" on public.pets for insert to authenticated with check (
  exists (select 1 from public.households h where h.id = household_id and h.owner_id = (select auth.uid()))
);
create policy "pets_update_owner" on public.pets for update to authenticated using (
  exists (select 1 from public.households h where h.id = household_id and h.owner_id = (select auth.uid()))
) with check (
  exists (select 1 from public.households h where h.id = household_id and h.owner_id = (select auth.uid()))
);
create policy "pets_delete_owner" on public.pets for delete to authenticated using (
  exists (select 1 from public.households h where h.id = household_id and h.owner_id = (select auth.uid()))
);

create policy "pet_memories_select_household" on public.pet_memories for select to authenticated using (
  exists (select 1 from public.households h where h.id = household_id and h.owner_id = (select auth.uid()))
  or exists (select 1 from public.household_memberships hm where hm.household_id = household_id and hm.user_id = (select auth.uid()))
);
create policy "pet_memories_insert_allowed" on public.pet_memories for insert to authenticated with check (
  (select auth.uid()) = created_by and (
    exists (select 1 from public.households h where h.id = household_id and h.owner_id = (select auth.uid()))
    or exists (select 1 from public.household_memberships hm where hm.household_id = household_id and hm.user_id = (select auth.uid()) and hm.can_add_memories)
  )
);
create policy "pet_memories_update_creator_or_owner" on public.pet_memories for update to authenticated using (
  (select auth.uid()) = created_by or exists (select 1 from public.households h where h.id = household_id and h.owner_id = (select auth.uid()))
) with check (
  (select auth.uid()) = created_by or exists (select 1 from public.households h where h.id = household_id and h.owner_id = (select auth.uid()))
);
create policy "pet_memories_delete_creator_or_owner" on public.pet_memories for delete to authenticated using (
  (select auth.uid()) = created_by or exists (select 1 from public.households h where h.id = household_id and h.owner_id = (select auth.uid()))
);

create policy "household_invites_owner_all" on public.household_invites for all to authenticated using (
  exists (select 1 from public.households h where h.id = household_id and h.owner_id = (select auth.uid()))
) with check (
  (select auth.uid()) = created_by and exists (select 1 from public.households h where h.id = household_id and h.owner_id = (select auth.uid()))
);

grant select, insert, update, delete on public.worlds to authenticated;
grant select, insert, update, delete on public.story_runs to authenticated;
grant select, insert, update, delete on public.share_manifests to authenticated;
grant select, insert, update, delete on public.story_events to authenticated;
grant select on public.entitlements to authenticated;
grant select, insert, update, delete on public.media_assets to authenticated;
grant select, insert, update, delete on public.households to authenticated;
grant select, insert, update, delete on public.household_memberships to authenticated;
grant select, insert, update, delete on public.pets to authenticated;
grant select, insert, update, delete on public.pet_memories to authenticated;
grant select, insert, update, delete on public.household_invites to authenticated;
