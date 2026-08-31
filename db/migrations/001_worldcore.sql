-- WorldCore initial schema
-- PostgreSQL / Neon compatible.
-- Deliberately does NOT create a raw chat-message table.

create extension if not exists pgcrypto;

do $$ begin
  create type world_product_type as enum (
    'friendship',
    'lifemap',
    'relationship',
    'petlife',
    'babystory',
    'homestory',
    'myyear',
    'founderworld',
    'creatorworld',
    'familytree'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type world_visibility as enum ('private', 'unlisted', 'public');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type world_member_role as enum ('owner', 'editor', 'viewer');
exception
  when duplicate_object then null;
end $$;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  external_subject text unique,
  email text,
  display_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists worlds (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references users(id) on delete cascade,
  product_type world_product_type not null,
  title text not null,
  visibility world_visibility not null default 'private',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists worlds_owner_product_idx on worlds(owner_user_id, product_type);
create index if not exists worlds_updated_idx on worlds(updated_at desc);

create table if not exists world_members (
  world_id uuid not null references worlds(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role world_member_role not null,
  created_at timestamptz not null default now(),
  primary key (world_id, user_id)
);

create index if not exists world_members_user_idx on world_members(user_id, created_at desc);

create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references worlds(id) on delete cascade,
  display_name text not null,
  relationship_label text,
  avatar_media_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists people_world_idx on people(world_id, created_at);

create table if not exists story_events (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references worlds(id) on delete cascade,
  product_type world_product_type not null,
  event_type text not null,
  occurred_at timestamptz not null,
  title text not null,
  description text,
  source text,
  people_ids uuid[] not null default '{}'::uuid[],
  place_ids uuid[] not null default '{}'::uuid[],
  media_ids uuid[] not null default '{}'::uuid[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists story_events_world_time_idx on story_events(world_id, occurred_at desc);
create index if not exists story_events_world_type_idx on story_events(world_id, event_type);
create index if not exists story_events_metadata_gin_idx on story_events using gin(metadata);

create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references worlds(id) on delete cascade,
  owner_user_id uuid references users(id) on delete set null,
  media_type text not null,
  storage_provider text not null,
  storage_key text not null,
  mime_type text,
  byte_size bigint,
  width integer,
  height integer,
  duration_ms integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (storage_provider, storage_key)
);

create index if not exists media_world_idx on media(world_id, created_at desc);

alter table people
  drop constraint if exists people_avatar_media_fk;
alter table people
  add constraint people_avatar_media_fk foreign key (avatar_media_id) references media(id) on delete set null;

create table if not exists share_pages (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references worlds(id) on delete cascade,
  slug text not null unique,
  visibility world_visibility not null default 'unlisted',
  manifest jsonb not null,
  created_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists share_pages_world_idx on share_pages(world_id, created_at desc);
create index if not exists share_pages_active_slug_idx on share_pages(slug) where revoked_at is null;

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  product_id text not null,
  provider text not null,
  provider_checkout_session_id text unique,
  provider_payment_id text,
  amount_total integer,
  currency text,
  payment_status text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists purchases_user_idx on purchases(user_id, created_at desc);
create index if not exists purchases_product_status_idx on purchases(product_id, payment_status);

create table if not exists entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  product_id text not null,
  source text not null,
  source_purchase_id uuid references purchases(id) on delete set null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists entitlements_user_product_idx on entitlements(user_id, product_id, granted_at desc);
create index if not exists entitlements_active_idx on entitlements(product_id, granted_at desc) where revoked_at is null;

comment on table worlds is 'Persistent product worlds. Free ThreadTales analysis does not require a world row.';
comment on table story_events is 'Normalized derived/milestone events. Do not use as a raw private chat-message dump.';
comment on table share_pages is 'Explicit public/unlisted share manifests. Public fields must be whitelisted by product logic.';
