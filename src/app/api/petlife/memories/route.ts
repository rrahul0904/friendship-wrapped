import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireStorySession } from "@/platform/identity/session";
import { supabaseRest } from "@/platform/persistence/supabase-rest";

export const runtime = "nodejs";

type PetRow = { id: string; household_id: string; name: string };
type HouseholdRow = { id: string; owner_id: string };
type MembershipRow = { household_id: string; user_id: string; role: "owner" | "member"; can_add_memories: boolean };

function errorResponse(cause: unknown) {
  const message = cause instanceof Error ? cause.message : "Could not add this shared memory.";
  const status = message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : /permission|access/i.test(message) ? 403 : 400;
  return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Sign in to add a shared PetLife memory." : message }, { status });
}

function uuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: Request) {
  try {
    const { token, user } = await requireStorySession();
    const body = await request.json() as {
      petId?: string;
      type?: "memory" | "milestone";
      date?: string;
      title?: string;
      note?: string;
      photoCount?: number;
    };

    if (!body.petId || !uuid(body.petId)) throw new Error("Invalid shared pet id.");
    if (!body.type || !["memory", "milestone"].includes(body.type)) throw new Error("Unsupported pet memory type.");
    if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) throw new Error("Invalid pet memory date.");
    const title = body.title?.trim() ?? "";
    const note = body.note?.trim() ?? "";
    const photoCount = body.photoCount ?? 0;
    if (!title || title.length > 120) throw new Error("Pet memory title must be 1–120 characters.");
    if (note.length > 500) throw new Error("Pet memory note is too long.");
    if (!Number.isInteger(photoCount) || photoCount < 0 || photoCount > 12) throw new Error("Invalid photo count.");

    const pet = (await supabaseRest<PetRow[]>(`pets?select=id,household_id,name&id=eq.${encodeURIComponent(body.petId)}&limit=1`, token))[0];
    if (!pet) throw new Error("You do not have access to this shared pet.");

    const [ownedHousehold, membership] = await Promise.all([
      supabaseRest<HouseholdRow[]>(`households?select=id,owner_id&id=eq.${encodeURIComponent(pet.household_id)}&owner_id=eq.${encodeURIComponent(user.id)}&limit=1`, token),
      supabaseRest<MembershipRow[]>(`household_memberships?select=household_id,user_id,role,can_add_memories&household_id=eq.${encodeURIComponent(pet.household_id)}&user_id=eq.${encodeURIComponent(user.id)}&limit=1`, token),
    ]);
    const isOwner = Boolean(ownedHousehold[0]) || membership[0]?.role === "owner";
    const mayAdd = isOwner || Boolean(membership[0]?.can_add_memories);
    if (!mayAdd) throw new Error("Your household membership does not have permission to add memories.");

    const id = randomUUID();
    await supabaseRest("pet_memories?select=id", token, {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        id,
        pet_id: pet.id,
        household_id: pet.household_id,
        created_by: user.id,
        memory_type: body.type,
        memory_date: body.date,
        title,
        note: note || null,
        photo_count: photoCount,
      }),
    });

    return NextResponse.json({ id, petId: pet.id, householdId: pet.household_id }, { status: 201 });
  } catch (cause) {
    return errorResponse(cause);
  }
}
