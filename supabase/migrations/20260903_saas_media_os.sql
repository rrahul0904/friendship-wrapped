-- ThreadTales SaaS + Media OS migration.
-- Apply ONLY to the dedicated threadtales-story-platform Supabase project.
-- Raw ThreadTales chat text is never persisted by this schema.

create extension if not exists pgcrypto;

alter table public.worlds add column if not exists anchor_date date;
alter table public.worlds add column if not exists cover_media_id uuid;
alter table public.worlds add column if not exists visibility text not null default 'private' check (visibility in ('private','shared'));
alter table public.worlds add column if not exists summary text check (summary is null or char_length(summary) <= 500);

alter table public.media_assets add column if not exists media_kind text not null default 'image' check (media_kind in ('image','video','audio','document'));
alter table public.media_assets add column if not exists width integer check (width is null or width > 0);
alter table public.media_assets add column if not exists height integer check (height is null or height > 0);
alter table public.media_assets add column if not exists caption text check (caption is null or char_length(caption) <= 500);
alter table public.media_assets add column if not exists occurred_at timestamptz;
alter table public.media_assets add column if not exists place text check (place is null or char_length(place) <= 160);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  avatar_media_id uuid,
  timezone text,
  locale text not null default 'en-US',
  onboarding_completed boolean not null default false,
  interests jsonb not null default '[]'::jsonb check (jsonb_typeof(interests) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.world_members (
  world_id uuid not null references public.worlds(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','editor','viewer')),
  can_add_memories boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (world_id, user_id)
);

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text check (description is null or char_length(description) <= 1000),
  cover_media_id uuid references public.media_assets(id) on delete set null,
  start_date date,
  end_date date,
  privacy text not null default 'private' check (privacy in ('private','shared')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.album_items (
  album_id uuid not null references public.albums(id) on delete cascade,
  media_id uuid not null references public.media_assets(id) on delete cascade,
  position integer not null default 0 check (position >= 0),
  caption text check (caption is null or char_length(caption) <= 500),
  occurred_at timestamptz,
  is_favorite boolean not null default false,
  primary key (album_id, media_id)
);

create table if not exists public.music_tracks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  artist text not null check (char_length(artist) between 1 and 160),
  album text check (album is null or char_length(album) <= 160),
  artwork_media_id uuid references public.media_assets(id) on delete set null,
  external_url text check (external_url is null or char_length(external_url) <= 1000),
  provider text not null default 'manual' check (provider in ('manual','spotify','apple','user_audio')),
  provider_track_id text,
  user_owned_audio_media_id uuid references public.media_assets(id) on delete set null,
  memory_date date,
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.world_music_tracks (
  world_id uuid not null references public.worlds(id) on delete cascade,
  track_id uuid not null references public.music_tracks(id) on delete cascade,
  position integer not null default 0 check (position >= 0),
  primary key (world_id, track_id)
);

create table if not exists public.album_music_tracks (
  album_id uuid not null references public.albums(id) on delete cascade,
  track_id uuid not null references public.music_tracks(id) on delete cascade,
  position integer not null default 0 check (position >= 0),
  primary key (album_id, track_id)
);

create table if not exists public.billing_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  plan_slug text not null check (plan_slug in ('free','plus','family','creator','business')),
  billing_interval text check (billing_interval is null or billing_interval in ('month','year')),
  status text not null check (status in ('free','trialing','active','past_due','unpaid','canceled','incomplete','incomplete_expired','paused')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stripe_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  product text not null,
  metric text not null,
  quantity numeric not null default 1 check (quantity >= 0),
  safe_dimensions jsonb not null default '{}'::jsonb check (jsonb_typeof(safe_dimensions) = 'object'),
  created_at timestamptz not null default now()
);

create table if not exists public.usage_counters (
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  metric text not null,
  quantity numeric not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, period_start, metric)
);

create table if not exists public.service_cost_events (
  id uuid primary key default gen_random_uuid(),
  service text not null,
  product text,
  environment text not null default 'production',
  amount_usd numeric(14,6) not null check (amount_usd >= 0),
  cost_type text not null check (cost_type in ('actual','estimated','manual')),
  source_reference text,
  occurred_at timestamptz not null default now(),
  safe_dimensions jsonb not null default '{}'::jsonb check (jsonb_typeof(safe_dimensions) = 'object')
);

create table if not exists public.cost_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null,
  service text not null,
  product text,
  amount_usd numeric(14,6) not null check (amount_usd >= 0),
  cost_type text not null check (cost_type in ('actual','estimated','manual')),
  created_at timestamptz not null default now()
);

create table if not exists public.cost_budgets (
  id uuid primary key default gen_random_uuid(),
  scope_type text not null check (scope_type in ('global','service','product','ai','storage')),
  scope_key text not null,
  monthly_budget_usd numeric(14,2) not null check (monthly_budget_usd >= 0),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(scope_type, scope_key)
);

create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  config jsonb not null default '{}'::jsonb check (jsonb_typeof(config) = 'object'),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','support','finance')),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  safe_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(safe_metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists profiles_updated_idx on public.profiles(updated_at desc);
create index if not exists world_members_user_idx on public.world_members(user_id, world_id);
create index if not exists albums_owner_updated_idx on public.albums(owner_id, updated_at desc);
create index if not exists albums_world_idx on public.albums(world_id, created_at desc);
create index if not exists album_items_position_idx on public.album_items(album_id, position);
create index if not exists music_tracks_owner_idx on public.music_tracks(owner_id, created_at desc);
create index if not exists subscriptions_user_status_idx on public.subscriptions(user_id, status);
create index if not exists usage_events_created_idx on public.usage_events(created_at desc, product, metric);
create index if not exists service_cost_events_time_idx on public.service_cost_events(occurred_at desc, service, product);
create index if not exists cost_snapshots_date_idx on public.cost_snapshots(snapshot_date desc, service, product);

alter table public.profiles enable row level security;
alter table public.world_members enable row level security;
alter table public.albums enable row level security;
alter table public.album_items enable row level security;
alter table public.music_tracks enable row level security;
alter table public.world_music_tracks enable row level security;
alter table public.album_music_tracks enable row level security;
alter table public.billing_customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.stripe_events enable row level security;
alter table public.usage_events enable row level security;
alter table public.usage_counters enable row level security;
alter table public.service_cost_events enable row level security;
alter table public.cost_snapshots enable row level security;
alter table public.cost_budgets enable row level security;
alter table public.feature_flags enable row level security;
alter table public.admin_roles enable row level security;
alter table public.admin_audit_logs enable row level security;

revoke all on public.billing_customers, public.stripe_events, public.service_cost_events, public.cost_snapshots, public.cost_budgets, public.admin_audit_logs from anon, authenticated;

grant select, insert, update, delete on public.profiles, public.world_members, public.albums, public.album_items, public.music_tracks, public.world_music_tracks, public.album_music_tracks to authenticated;
grant select on public.subscriptions, public.admin_roles, public.feature_flags to authenticated;
grant select, insert on public.usage_events to authenticated;
grant select, insert, update on public.usage_counters to authenticated;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "profiles_delete_own" on public.profiles for delete to authenticated using ((select auth.uid()) = user_id);

create policy "world_members_select_authorized" on public.world_members for select to authenticated using (
  user_id = (select auth.uid()) or exists (select 1 from public.worlds w where w.id = world_id and w.user_id = (select auth.uid()))
);
create policy "world_members_insert_owner" on public.world_members for insert to authenticated with check (exists (select 1 from public.worlds w where w.id = world_id and w.user_id = (select auth.uid())));
create policy "world_members_update_owner" on public.world_members for update to authenticated using (exists (select 1 from public.worlds w where w.id = world_id and w.user_id = (select auth.uid()))) with check (exists (select 1 from public.worlds w where w.id = world_id and w.user_id = (select auth.uid())));
create policy "world_members_delete_owner" on public.world_members for delete to authenticated using (exists (select 1 from public.worlds w where w.id = world_id and w.user_id = (select auth.uid())));

create policy "albums_select_authorized" on public.albums for select to authenticated using (owner_id = (select auth.uid()) or exists (select 1 from public.world_members wm where wm.world_id = albums.world_id and wm.user_id = (select auth.uid())));
create policy "albums_insert_owner" on public.albums for insert to authenticated with check (owner_id = (select auth.uid()) and exists (select 1 from public.worlds w where w.id = world_id and w.user_id = (select auth.uid())));
create policy "albums_update_owner" on public.albums for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "albums_delete_owner" on public.albums for delete to authenticated using (owner_id = (select auth.uid()));

create policy "album_items_select_authorized" on public.album_items for select to authenticated using (exists (select 1 from public.albums a where a.id = album_id and (a.owner_id = (select auth.uid()) or exists (select 1 from public.world_members wm where wm.world_id = a.world_id and wm.user_id = (select auth.uid())))));
create policy "album_items_insert_owner" on public.album_items for insert to authenticated with check (exists (select 1 from public.albums a where a.id = album_id and a.owner_id = (select auth.uid())));
create policy "album_items_update_owner" on public.album_items for update to authenticated using (exists (select 1 from public.albums a where a.id = album_id and a.owner_id = (select auth.uid()))) with check (exists (select 1 from public.albums a where a.id = album_id and a.owner_id = (select auth.uid())));
create policy "album_items_delete_owner" on public.album_items for delete to authenticated using (exists (select 1 from public.albums a where a.id = album_id and a.owner_id = (select auth.uid())));

create policy "music_tracks_select_own" on public.music_tracks for select to authenticated using (owner_id = (select auth.uid()));
create policy "music_tracks_insert_own" on public.music_tracks for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "music_tracks_update_own" on public.music_tracks for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "music_tracks_delete_own" on public.music_tracks for delete to authenticated using (owner_id = (select auth.uid()));

create policy "world_music_select_authorized" on public.world_music_tracks for select to authenticated using (exists (select 1 from public.worlds w where w.id = world_id and (w.user_id = (select auth.uid()) or exists (select 1 from public.world_members wm where wm.world_id = w.id and wm.user_id = (select auth.uid())))));
create policy "world_music_insert_owner" on public.world_music_tracks for insert to authenticated with check (exists (select 1 from public.worlds w where w.id = world_id and w.user_id = (select auth.uid())));
create policy "world_music_update_owner" on public.world_music_tracks for update to authenticated using (exists (select 1 from public.worlds w where w.id = world_id and w.user_id = (select auth.uid()))) with check (exists (select 1 from public.worlds w where w.id = world_id and w.user_id = (select auth.uid())));
create policy "world_music_delete_owner" on public.world_music_tracks for delete to authenticated using (exists (select 1 from public.worlds w where w.id = world_id and w.user_id = (select auth.uid())));

create policy "album_music_select_authorized" on public.album_music_tracks for select to authenticated using (exists (select 1 from public.albums a where a.id = album_id and (a.owner_id = (select auth.uid()) or exists (select 1 from public.world_members wm where wm.world_id = a.world_id and wm.user_id = (select auth.uid())))));
create policy "album_music_insert_owner" on public.album_music_tracks for insert to authenticated with check (exists (select 1 from public.albums a where a.id = album_id and a.owner_id = (select auth.uid())));
create policy "album_music_update_owner" on public.album_music_tracks for update to authenticated using (exists (select 1 from public.albums a where a.id = album_id and a.owner_id = (select auth.uid()))) with check (exists (select 1 from public.albums a where a.id = album_id and a.owner_id = (select auth.uid())));
create policy "album_music_delete_owner" on public.album_music_tracks for delete to authenticated using (exists (select 1 from public.albums a where a.id = album_id and a.owner_id = (select auth.uid())));

create policy "subscriptions_select_own" on public.subscriptions for select to authenticated using (user_id = (select auth.uid()));
create policy "admin_roles_select_self" on public.admin_roles for select to authenticated using (user_id = (select auth.uid()));
create policy "feature_flags_read" on public.feature_flags for select to authenticated using (true);
create policy "usage_events_insert_own" on public.usage_events for insert to authenticated with check (user_id = (select auth.uid()));
create policy "usage_events_select_own" on public.usage_events for select to authenticated using (user_id = (select auth.uid()));
create policy "usage_counters_select_own" on public.usage_counters for select to authenticated using (user_id = (select auth.uid()));
create policy "usage_counters_insert_own" on public.usage_counters for insert to authenticated with check (user_id = (select auth.uid()));
create policy "usage_counters_update_own" on public.usage_counters for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Expand the existing private-media bucket for the Media OS. Paths must begin with auth.uid().
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('private-media', 'private-media', false, 26214400, array['image/jpeg','image/png','image/webp','video/mp4','video/webm','audio/mpeg','audio/mp4','audio/wav','application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

insert into public.feature_flags(key, enabled, config) values
  ('ai_enabled', true, '{}'),
  ('video_uploads', true, '{}'),
  ('music_provider_integration', false, '{}'),
  ('public_albums', true, '{}'),
  ('family_collaboration', true, '{}'),
  ('new_subscriptions', true, '{}')
on conflict (key) do nothing;
