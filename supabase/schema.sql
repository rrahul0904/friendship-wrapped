-- Story Platform reference schema for optional Supabase activation.
-- Generate a real migration with `supabase migration new story_platform` before applying in a configured project.
-- ThreadTales story_runs MUST contain derived results only; raw imported chat messages are never persisted.

create extension if not exists pgcrypto;

create table if not exists public.worlds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product text not null check (product in ('threadtales','myyear','petlife')),
  title text not null check (char_length(title) between 1 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.story_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  world_id uuid references public.worlds(id) on delete cascade,
  product text not null check (product in ('threadtales','myyear','petlife')),
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

create index if not exists story_runs_user_created_idx on public.story_runs(user_id, created_at desc);
create index if not exists worlds_user_product_idx on public.worlds(user_id, product);
create index if not exists share_manifests_story_idx on public.share_manifests(story_run_id);
create index if not exists media_assets_world_idx on public.media_assets(world_id);

alter table public.worlds enable row level security;
alter table public.story_runs enable row level security;
alter table public.share_manifests enable row level security;
alter table public.entitlements enable row level security;
alter table public.media_assets enable row level security;

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

create policy "entitlements_select_own" on public.entitlements for select to authenticated using ((select auth.uid()) = user_id);
create policy "media_assets_select_own" on public.media_assets for select to authenticated using ((select auth.uid()) = user_id);
create policy "media_assets_insert_own" on public.media_assets for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "media_assets_update_own" on public.media_assets for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "media_assets_delete_own" on public.media_assets for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.worlds to authenticated;
grant select, insert, update, delete on public.story_runs to authenticated;
grant select, insert, update, delete on public.share_manifests to authenticated;
grant select on public.entitlements to authenticated;
grant select, insert, update, delete on public.media_assets to authenticated;
