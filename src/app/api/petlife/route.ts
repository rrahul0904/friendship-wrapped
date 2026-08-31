import { NextResponse } from "next/server";
import { requireStorySession } from "@/platform/identity/session";
import { supabaseRest } from "@/platform/persistence/supabase-rest";
import type { PetMemory, PetProfile } from "@/products/petlife/model";

export const runtime = "nodejs";

type HouseholdRow = { id: string; name: string; owner_id: string };
type MembershipRow = { household_id: string; user_id: string; email?: string | null; role: "owner" | "member"; can_add_memories: boolean };
type PetRow = { id: string; household_id: string; name: string; species: string; birthday?: string | null; adoption_date?: string | null };
type PetMemoryRow = { id: string; pet_id: string; household_id: string; created_by: string; memory_type: string; memory_date: string; title: string; note?: string | null; photo_count: number };

function apiError(cause: unknown, fallback: string) {
  const message = cause instanceof Error ? cause.message : fallback;
  const status = message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400;
  return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Sign in to use PetLife cloud features." : message }, { status });
}

function assertUuid(value: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new Error("Invalid PetLife id.");
}

function validateProfile(profile: PetProfile) {
  assertUuid(profile.id);
  if (!profile.name?.trim() || profile.name.trim().length > 80) throw new Error("Pet name must be 1–80 characters.");
  if (!profile.species?.trim() || profile.species.trim().length > 60) throw new Error("Pet species must be 1–60 characters.");
  if (profile.birthday && !/^\d{4}-\d{2}-\d{2}$/.test(profile.birthday)) throw new Error("Invalid birthday.");
  if (profile.adoptionDate && !/^\d{4}-\d{2}-\d{2}$/.test(profile.adoptionDate)) throw new Error("Invalid adoption date.");
}

function validateMemory(memory: PetMemory, petId: string) {
  assertUuid(memory.id);
  if (memory.petId !== petId) throw new Error("Memory pet id does not match the profile.");
  if (!["memory", "milestone"].includes(memory.type)) throw new Error("Unsupported pet memory type.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(memory.date)) throw new Error("Invalid pet memory date.");
  if (!memory.title?.trim() || memory.title.trim().length > 120) throw new Error("Pet memory title must be 1–120 characters.");
  if (memory.note && memory.note.length > 500) throw new Error("Pet memory note is too long.");
  if (!Number.isInteger(memory.photoCount) || memory.photoCount < 0 || memory.photoCount > 12) throw new Error("Invalid photo count.");
}

export async function GET() {
  try {
    const { token, user } = await requireStorySession();
    const [households, memberships, pets, memories] = await Promise.all([
      supabaseRest<HouseholdRow[]>("households?select=id,name,owner_id&order=created_at.asc", token),
      supabaseRest<MembershipRow[]>("household_memberships?select=household_id,user_id,email,role,can_add_memories", token),
      supabaseRest<PetRow[]>("pets?select=id,household_id,name,species,birthday,adoption_date&order=created_at.asc", token),
      supabaseRest<PetMemoryRow[]>("pet_memories?select=id,pet_id,household_id,created_by,memory_type,memory_date,title,note,photo_count&order=memory_date.desc&limit=250", token),
    ]);
    return NextResponse.json({ user: { id: user.id, email: user.email }, households, memberships, pets, memories });
  } catch (cause) {
    return apiError(cause, "Could not load PetLife cloud data.");
  }
}

export async function POST(request: Request) {
  try {
    const { token, user } = await requireStorySession();
    const body = await request.json() as { profile?: PetProfile; memories?: PetMemory[] };
    if (!body.profile) throw new Error("Pet profile is required.");
    validateProfile(body.profile);
    const memories = body.memories ?? [];
    if (!Array.isArray(memories) || memories.length > 250) throw new Error("Too many pet memories in one sync.");
    memories.forEach((memory) => validateMemory(memory, body.profile!.id));

    let household = (await supabaseRest<HouseholdRow[]>(`households?select=id,name,owner_id&owner_id=eq.${encodeURIComponent(user.id)}&order=created_at.asc&limit=1`, token))[0];
    if (!household) {
      const created = await supabaseRest<HouseholdRow[]>("households?select=id,name,owner_id", token, {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ owner_id: user.id, name: `${body.profile.name.trim()}'s household` }),
      });
      household = created[0];
      if (!household) throw new Error("Could not create PetLife household.");
      await supabaseRest<MembershipRow[]>("household_memberships?on_conflict=household_id,user_id", token, {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ household_id: household.id, user_id: user.id, email: user.email ?? null, role: "owner", can_add_memories: true }),
      });
    }

    await supabaseRest<PetRow[]>("pets?on_conflict=id", token, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ id: body.profile.id, household_id: household.id, name: body.profile.name.trim(), species: body.profile.species.trim(), birthday: body.profile.birthday ?? null, adoption_date: body.profile.adoptionDate ?? null }),
    });

    if (memories.length) {
      await supabaseRest<PetMemoryRow[]>("pet_memories?on_conflict=id", token, {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(memories.map((memory) => ({ id: memory.id, pet_id: body.profile!.id, household_id: household!.id, created_by: user.id, memory_type: memory.type, memory_date: memory.date, title: memory.title.trim(), note: memory.note?.trim() || null, photo_count: memory.photoCount }))),
      });
    }

    return NextResponse.json({ householdId: household.id, petId: body.profile.id, syncedMemories: memories.length });
  } catch (cause) {
    return apiError(cause, "Could not sync PetLife data.");
  }
}

export async function DELETE(request: Request) {
  try {
    const { token } = await requireStorySession();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new Error("Pet id is required.");
    assertUuid(id);
    await supabaseRest<null>(`pets?id=eq.${encodeURIComponent(id)}`, token, { method: "DELETE" });
    return new NextResponse(null, { status: 204 });
  } catch (cause) {
    return apiError(cause, "Could not delete the cloud pet profile.");
  }
}
