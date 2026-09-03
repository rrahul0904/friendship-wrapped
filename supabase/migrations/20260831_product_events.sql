-- Privacy-safe Story Platform telemetry sink.
-- Browser roles receive no table privileges. The application writes only through
-- the sanitized server route using the server-only Supabase secret key.

create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  event text not null check (event in (
    'analysis_started',
    'analysis_completed',
    'story_viewed',
    'story_exported',
    'share_created',
    'share_opened',
    'make_yours_clicked',
    'checkout_started',
    'purchase_verified',
    'story_saved',
    'myyear_created',
    'pet_created',
    'pet_memory_added',
    'annual_recap_created',
    'ai_enrichment_started',
    'ai_enrichment_completed'
  )),
  product text not null check (product in ('threadtales', 'myyear', 'petlife')),
  mode text check (mode is null or mode in (
    'friends',
    'couple',
    'siblings',
    'family',
    'group',
    'birthday',
    'anniversary',
    'long-distance',
    'graduation',
    'year-together'
  )),
  created_at timestamptz not null default now()
);

create index if not exists product_events_created_idx on public.product_events(created_at desc);
create index if not exists product_events_product_event_idx on public.product_events(product, event, created_at desc);

alter table public.product_events enable row level security;

-- Deliberately no anon/authenticated policies: product telemetry is server-write-only.
revoke all on table public.product_events from anon, authenticated;
drop policy if exists "product_events_service_role_only" on public.product_events;
create policy "product_events_service_role_only" on public.product_events for all to service_role using (true) with check (true);
