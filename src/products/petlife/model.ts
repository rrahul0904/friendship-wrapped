import type { StoryChapter, StoryEvent } from "@/platform/types";

export type PetMemoryType = "memory" | "milestone";

export interface PetProfile {
  id: string;
  name: string;
  species: string;
  birthday?: string;
  adoptionDate?: string;
}

export interface PetMemory {
  id: string;
  petId: string;
  type: PetMemoryType;
  date: string;
  title: string;
  note?: string;
  photoCount: number;
}

export interface PetLifeRecap {
  schemaVersion: 1;
  product: "petlife";
  year: number;
  pet: PetProfile;
  memories: PetMemory[];
  monthlyCounts: Array<{ month: number; label: string; memories: number }>;
  milestoneCount: number;
  photoCount: number;
}

export interface PetLifeShareManifest {
  version: 1;
  product: "petlife";
  year: number;
  petName?: string;
  memoryCount: number;
  milestoneCount: number;
  photoCount: number;
  activeMonths: string[];
  attribution: true;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (!Number.isFinite(date.getTime())) throw new Error("Pet memories need a valid date.");
  return date;
}

export function buildPetLifeRecap(profile: PetProfile, memories: PetMemory[], year: number): PetLifeRecap {
  if (!profile.name.trim() || !profile.species.trim()) throw new Error("Create a pet profile first.");
  if (!Number.isInteger(year) || year < 1900 || year > 2200) throw new Error("Choose a valid recap year.");
  const sorted = memories
    .filter((memory) => memory.petId === profile.id && parseDate(memory.date).getFullYear() === year)
    .map((memory) => ({ ...memory, title: memory.title.trim(), note: memory.note?.trim() }))
    .filter((memory) => memory.title)
    .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
  const monthlyCounts = Array.from({ length: 12 }, (_, month) => ({ month, label: MONTHS[month], memories: 0 }));
  for (const memory of sorted) monthlyCounts[parseDate(memory.date).getMonth()].memories += 1;
  return {
    schemaVersion: 1,
    product: "petlife",
    year,
    pet: { ...profile, name: profile.name.trim(), species: profile.species.trim() },
    memories: sorted,
    monthlyCounts,
    milestoneCount: sorted.filter((memory) => memory.type === "milestone").length,
    photoCount: sorted.reduce((sum, memory) => sum + Math.max(0, memory.photoCount), 0),
  };
}

export function petLifeEvents(recap: PetLifeRecap): StoryEvent[] {
  return recap.memories.map((memory) => ({
    id: memory.id,
    product: "petlife",
    occurredAt: `${memory.date}T12:00:00.000Z`,
    type: memory.type,
    title: memory.title,
    description: memory.note,
    metadata: { photoCount: memory.photoCount, petId: memory.petId },
  }));
}

export function composePetLifeChapters(recap: PetLifeRecap): StoryChapter[] {
  const activeMonths = recap.monthlyCounts.filter((item) => item.memories > 0);
  const busiest = [...recap.monthlyCounts].sort((a, b) => b.memories - a.memories)[0];
  const chapters: StoryChapter[] = [
    { id: "pet-cover", type: "cover", title: `${recap.pet.name}'s ${recap.year}`, subtitle: `${recap.pet.species} · a year of memories`, privacyLevel: "safe", renderVariant: "hero" },
    { id: "pet-scale", type: "scale", title: "The moments you kept", metric: recap.memories.length, subtitle: `${recap.milestoneCount} milestones · ${recap.photoCount} selected photos`, privacyLevel: "safe", renderVariant: "metric" },
  ];
  if (busiest?.memories) chapters.push({ id: "pet-busiest", type: "timeline", title: `${busiest.label} was full of stories`, metric: busiest.memories, subtitle: "saved memories", privacyLevel: "safe", renderVariant: "metric" });
  for (const memory of recap.memories.slice(0, 5)) {
    chapters.push({ id: `pet-${memory.id}`, type: memory.type === "milestone" ? "beginning" : "timeline", title: memory.title, subtitle: new Intl.DateTimeFormat("en", { month: "long", day: "numeric" }).format(parseDate(memory.date)), supportingText: memory.note || undefined, privacyLevel: "sensitive", renderVariant: "hero" });
  }
  chapters.push({ id: "pet-closing", type: "closing", title: `${recap.pet.name}'s story keeps growing.`, subtitle: `${activeMonths.length} active months in ${recap.year}`, privacyLevel: "safe", renderVariant: "closing" });
  return chapters;
}

export function createPetLifeShareManifest(recap: PetLifeRecap, includePetName = false): PetLifeShareManifest {
  return {
    version: 1,
    product: "petlife",
    year: recap.year,
    ...(includePetName ? { petName: recap.pet.name } : {}),
    memoryCount: recap.memories.length,
    milestoneCount: recap.milestoneCount,
    photoCount: recap.photoCount,
    activeMonths: recap.monthlyCounts.filter((item) => item.memories > 0).map((item) => item.label),
    attribution: true,
  };
}
