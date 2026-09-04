-- Hardening for the SaaS + Media OS tables.
-- Server-only operational tables remain inaccessible to browser roles.
drop policy if exists "billing_customers_service_role_only" on public.billing_customers;
create policy "billing_customers_service_role_only" on public.billing_customers for all to service_role using (true) with check (true);
drop policy if exists "stripe_events_service_role_only" on public.stripe_events;
create policy "stripe_events_service_role_only" on public.stripe_events for all to service_role using (true) with check (true);
drop policy if exists "service_cost_events_service_role_only" on public.service_cost_events;
create policy "service_cost_events_service_role_only" on public.service_cost_events for all to service_role using (true) with check (true);
drop policy if exists "cost_snapshots_service_role_only" on public.cost_snapshots;
create policy "cost_snapshots_service_role_only" on public.cost_snapshots for all to service_role using (true) with check (true);
drop policy if exists "cost_budgets_service_role_only" on public.cost_budgets;
create policy "cost_budgets_service_role_only" on public.cost_budgets for all to service_role using (true) with check (true);
drop policy if exists "admin_audit_logs_service_role_only" on public.admin_audit_logs;
create policy "admin_audit_logs_service_role_only" on public.admin_audit_logs for all to service_role using (true) with check (true);

create index if not exists admin_audit_logs_actor_idx on public.admin_audit_logs(actor_user_id);
create index if not exists album_items_media_idx on public.album_items(media_id);
create index if not exists album_music_tracks_track_idx on public.album_music_tracks(track_id);
create index if not exists albums_cover_media_idx on public.albums(cover_media_id);
create index if not exists music_tracks_artwork_idx on public.music_tracks(artwork_media_id);
create index if not exists music_tracks_audio_idx on public.music_tracks(user_owned_audio_media_id);
create index if not exists usage_events_user_idx on public.usage_events(user_id);
create index if not exists world_music_tracks_track_idx on public.world_music_tracks(track_id);