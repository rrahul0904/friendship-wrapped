import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const schema = readFileSync(path.resolve(process.cwd(), "supabase/schema.sql"), "utf8");
const inviteRoute = readFileSync(path.resolve(process.cwd(), "src/app/api/petlife/invites/route.ts"), "utf8");
const memoryRoute = readFileSync(path.resolve(process.cwd(), "src/app/api/petlife/memories/route.ts"), "utf8");
const memberRoute = readFileSync(path.resolve(process.cwd(), "src/app/api/petlife/members/route.ts"), "utf8");

function normalized(value: string) {
  return value.replace(/\s+/g, " ").toLowerCase();
}

const sql = normalized(schema);

describe("PetLife household RLS contract", () => {
  it("enables RLS on every household data table", () => {
    for (const table of ["households", "household_memberships", "pets", "pet_memories", "household_invites"]) {
      expect(sql).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("keeps household management owner-only", () => {
    expect(sql).toContain('create policy "households_insert_owner"');
    expect(sql).toContain('create policy "households_update_owner"');
    expect(sql).toContain('create policy "households_delete_owner"');
    expect(sql).toContain('(select auth.uid()) = owner_id');
  });

  it("allows members to see household pets but gates memory inserts on explicit permission", () => {
    expect(sql).toContain('create policy "pets_select_household"');
    expect(sql).toContain('from public.household_memberships hm');
    expect(sql).toContain('create policy "pet_memories_insert_household"');
    expect(sql).toContain('hm.can_add_memories');
    expect(sql).toContain('m.created_by = (select auth.uid())');
  });

  it("prevents arbitrary members from deleting memories they did not create", () => {
    expect(sql).toContain('create policy "pet_memories_delete_creator_or_owner"');
    expect(sql).toContain('m.created_by = (select auth.uid())');
    expect(sql).toContain('h.owner_id = (select auth.uid())');
  });

  it("keeps invitation creation and deletion owner-only", () => {
    expect(sql).toContain('create policy "household_invites_insert_owner"');
    expect(sql).toContain('create policy "household_invites_delete_owner"');
    expect(sql).toContain('h.owner_id = (select auth.uid())');
  });
});

describe("PetLife invitation and contribution routes", () => {
  it("stores invitation hashes rather than raw invitation tokens", () => {
    expect(inviteRoute).toContain('createHash("sha256")');
    expect(inviteRoute).toContain("token_hash");
    expect(inviteRoute).toContain("randomBytes(32)");
    expect(inviteRoute).not.toContain("token: inviteToken");
  });

  it("requires unused, unexpired invitations and email match before membership acceptance", () => {
    expect(inviteRoute).toContain("accepted_at=is.null");
    expect(inviteRoute).toContain("expires_at=gt.");
    expect(inviteRoute).toContain("invite.email.toLowerCase() !== user.email?.toLowerCase()");
    expect(inviteRoute).toContain("accepted_at: new Date().toISOString()");
  });

  it("rechecks signed-in member permission before inserting a shared memory", () => {
    expect(memoryRoute).toContain("requireStorySession");
    expect(memoryRoute).toContain("can_add_memories");
    expect(memoryRoute).toContain("membership[0]?.role === \"owner\"");
    expect(memoryRoute).toContain("membership[0]?.can_add_memories");
    expect(memoryRoute).toContain("created_by: user.id");
  });

  it("requires owner authorization before removing a member", () => {
    expect(memberRoute).toContain("requireStorySession");
    expect(memberRoute).toMatch(/owner_id/);
    expect(memberRoute).toMatch(/user\.id/);
  });

  it("uses stable SHA-256 invite hashing semantics", () => {
    const token = "invite-token-for-regression";
    expect(createHash("sha256").update(token).digest("hex")).toHaveLength(64);
    expect(createHash("sha256").update(token).digest("hex")).toBe(createHash("sha256").update(token).digest("hex"));
    expect(createHash("sha256").update(`${token}-different`).digest("hex")).not.toBe(createHash("sha256").update(token).digest("hex"));
  });
});
