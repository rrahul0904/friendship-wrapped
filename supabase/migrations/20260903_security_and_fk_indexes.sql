-- Hardens the server-only telemetry table and indexes all queried foreign keys.
-- Apply only to the dedicated ThreadTales Supabase project.

drop policy if exists "product_events_service_role_only" on public.product_events;
create policy "product_events_service_role_only" on public.product_events for all to service_role using (true) with check (true);

create index if not exists story_runs_world_idx on public.story_runs(world_id);
create index if not exists share_manifests_user_idx on public.share_manifests(user_id);
create index if not exists story_events_user_idx on public.story_events(user_id);
create index if not exists entitlements_user_idx on public.entitlements(user_id);
create index if not exists media_assets_user_idx on public.media_assets(user_id);
create index if not exists pet_memories_created_by_idx on public.pet_memories(created_by);
create index if not exists household_invites_created_by_idx on public.household_invites(created_by);
