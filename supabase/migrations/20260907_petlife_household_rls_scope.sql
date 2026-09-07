-- Fix PetLife household-scope RLS predicates.
-- The previous policies compared hm.household_id to itself, which could let a
-- membership in one household satisfy a membership check for another.
-- Scope every membership EXISTS to the row being authorized.

drop policy if exists "pets_select_household" on public.pets;
create policy "pets_select_household"
on public.pets
for select
to authenticated
using (
  exists (
    select 1
    from public.households h
    where h.id = pets.household_id
      and h.owner_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.household_memberships hm
    where hm.household_id = pets.household_id
      and hm.user_id = (select auth.uid())
  )
);

drop policy if exists "pet_memories_select_household" on public.pet_memories;
create policy "pet_memories_select_household"
on public.pet_memories
for select
to authenticated
using (
  exists (
    select 1
    from public.households h
    where h.id = pet_memories.household_id
      and h.owner_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.household_memberships hm
    where hm.household_id = pet_memories.household_id
      and hm.user_id = (select auth.uid())
  )
);

drop policy if exists "pet_memories_insert_allowed" on public.pet_memories;
create policy "pet_memories_insert_allowed"
on public.pet_memories
for insert
to authenticated
with check (
  (select auth.uid()) = created_by
  and (
    exists (
      select 1
      from public.households h
      where h.id = pet_memories.household_id
        and h.owner_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.household_memberships hm
      where hm.household_id = pet_memories.household_id
        and hm.user_id = (select auth.uid())
        and hm.can_add_memories
    )
  )
);
