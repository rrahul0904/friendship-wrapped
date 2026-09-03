-- ThreadTales full-platform launch migration.
-- Apply only to the dedicated threadtales-story-platform project. Do not apply
-- this migration to an unrelated Supabase project.

alter table public.worlds drop constraint if exists worlds_product_check;
alter table public.worlds add constraint worlds_product_check check (product in ('threadtales','myyear','petlife','relationship','lifemap','babystory','homestory','familytree','founderworld','creatorworld'));
alter table public.story_runs drop constraint if exists story_runs_product_check;
alter table public.story_runs add constraint story_runs_product_check check (product in ('threadtales','myyear','petlife','relationship','lifemap','babystory','homestory','familytree','founderworld','creatorworld'));
alter table public.product_events drop constraint if exists product_events_product_check;
alter table public.product_events add constraint product_events_product_check check (product in ('threadtales','myyear','petlife','relationship','lifemap','babystory','homestory','familytree','founderworld','creatorworld'));

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

create index if not exists story_events_world_date_idx on public.story_events(world_id, occurred_at desc);
alter table public.story_events enable row level security;
revoke all on table public.story_events from anon;
grant select, insert, update, delete on table public.story_events to authenticated;
drop policy if exists "story_events_select_own" on public.story_events;
create policy "story_events_select_own" on public.story_events for select to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
drop policy if exists "story_events_insert_own" on public.story_events;
create policy "story_events_insert_own" on public.story_events for insert to authenticated with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
drop policy if exists "story_events_update_own" on public.story_events;
create policy "story_events_update_own" on public.story_events for update to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id) with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
drop policy if exists "story_events_delete_own" on public.story_events;
create policy "story_events_delete_own" on public.story_events for delete to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

-- Private Storage. Objects must live under their authenticated owner's UUID,
-- for example <auth.uid()>/<world-id>/<filename>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('private-media', 'private-media', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "private_media_select_own" on storage.objects;
create policy "private_media_select_own" on storage.objects for select to authenticated using (bucket_id = 'private-media' and (storage.foldername(name))[1] = (select auth.uid()::text));
drop policy if exists "private_media_insert_own" on storage.objects;
create policy "private_media_insert_own" on storage.objects for insert to authenticated with check (bucket_id = 'private-media' and (storage.foldername(name))[1] = (select auth.uid()::text));
drop policy if exists "private_media_update_own" on storage.objects;
create policy "private_media_update_own" on storage.objects for update to authenticated using (bucket_id = 'private-media' and (storage.foldername(name))[1] = (select auth.uid()::text)) with check (bucket_id = 'private-media' and (storage.foldername(name))[1] = (select auth.uid()::text));
drop policy if exists "private_media_delete_own" on storage.objects;
create policy "private_media_delete_own" on storage.objects for delete to authenticated using (bucket_id = 'private-media' and (storage.foldername(name))[1] = (select auth.uid()::text));
