import {
  memoryProfileForSlug,
  productTemplateForRelationship,
  type MemoryProductTemplate,
  type MemoryRelationshipType,
} from "./memory-platform";

export type RelationshipType = MemoryRelationshipType;

export type MemoryIntentKind =
  | "MEMORY_LANE"
  | "VALENTINE_GIFT"
  | "PROM_INVITATION"
  | "DATE_INVITATION"
  | "APOLOGY"
  | "I_LOVE_YOU"
  | "ANNIVERSARY"
  | "PROUD_OF_YOU"
  | "GROUP_MEMORY";

export type MemorySourceKind = "CONVERSATION" | "PHOTOS_VIDEOS" | "MANUAL";

export type MemoryDraftStep = "RELATIONSHIP" | "INTENT" | "NAME" | "SOURCE";

export interface MemoryIntentDefinition {
  kind: MemoryIntentKind;
  label: string;
  description: string;
  recommendedFor: RelationshipType[];
}

export interface RelationshipDefinition {
  kind: RelationshipType;
  label: string;
  description: string;
}

export interface MemorySpaceDraft {
  schemaVersion: 1;
  id: string;
  relationshipType: RelationshipType | null;
  productTemplate?: MemoryProductTemplate | null;
  intent: MemoryIntentKind | null;
  name: string;
  source: MemorySourceKind | null;
  step: MemoryDraftStep;
  updatedAt: string;
}

export const MEMORY_DRAFT_STORAGE_KEY = "threadtales:memory-space-draft:v1";

export const RELATIONSHIPS: readonly RelationshipDefinition[] = [
  { kind: "PARTNER", label: "Partner", description: "A wife, husband, partner, or someone you love." },
  { kind: "CHILD", label: "Child", description: "A daughter, son, or child whose story you want to keep." },
  { kind: "PARENT", label: "Parent", description: "Mom, Dad, or a parent figure." },
  { kind: "FRIEND", label: "Friend", description: "A best friend, old friend, or someone who has been there." },
  { kind: "FAMILY_GROUP", label: "Family / group", description: "A family, friend group, team, or shared circle." },
  { kind: "PET", label: "Pet", description: "A pet whose little moments, milestones, and story belong together." },
  { kind: "HOME", label: "Home", description: "A home, room, or place whose chapters you want to preserve." },
  { kind: "SELF", label: "Myself", description: "Your own memories, places, eras, and milestones." },
  { kind: "OTHER", label: "Someone else", description: "Start with the subject. You can shape the story next." },
] as const;

export const MEMORY_INTENTS: readonly MemoryIntentDefinition[] = [
  {
    kind: "MEMORY_LANE",
    label: "Memory lane",
    description: "Walk through the moments, rituals, eras, and little things that made this story yours.",
    recommendedFor: ["PARTNER", "CHILD", "PARENT", "FRIEND", "FAMILY_GROUP", "PET", "HOME", "SELF", "OTHER"],
  },
  {
    kind: "VALENTINE_GIFT",
    label: "Valentine gift",
    description: "Build a romantic keepsake from real memories, a song, and your own dedication.",
    recommendedFor: ["PARTNER", "OTHER"],
  },
  {
    kind: "PROM_INVITATION",
    label: "Ask to prom",
    description: "Turn a few shared moments into a short surprise that ends with the question.",
    recommendedFor: ["FRIEND", "OTHER"],
  },
  {
    kind: "DATE_INVITATION",
    label: "Be my date",
    description: "Make the invitation personal instead of sending another plain message.",
    recommendedFor: ["PARTNER", "FRIEND", "OTHER"],
  },
  {
    kind: "APOLOGY",
    label: "I’m sorry",
    description: "Use shared memories as context, then say the important part in your own words.",
    recommendedFor: ["PARTNER", "CHILD", "PARENT", "FRIEND", "OTHER"],
  },
  {
    kind: "I_LOVE_YOU",
    label: "I love you",
    description: "Collect the moments that say what a single sentence cannot.",
    recommendedFor: ["PARTNER", "CHILD", "PARENT", "FRIEND", "PET", "OTHER"],
  },
  {
    kind: "ANNIVERSARY",
    label: "Anniversary",
    description: "Tell the story from the beginning to today and leave room for the next chapter.",
    recommendedFor: ["PARTNER", "FRIEND", "FAMILY_GROUP", "HOME", "OTHER"],
  },
  {
    kind: "PROUD_OF_YOU",
    label: "Proud of you",
    description: "Celebrate growth, effort, milestones, and the moments that led here.",
    recommendedFor: ["PARTNER", "CHILD", "PARENT", "FRIEND", "PET", "SELF", "OTHER"],
  },
  {
    kind: "GROUP_MEMORY",
    label: "Group memory",
    description: "Preserve the cast, places, running jokes, trips, eras, and shared history.",
    recommendedFor: ["FAMILY_GROUP", "FRIEND"],
  },
] as const;

export function newMemorySpaceDraft(id: string, now = new Date()): MemorySpaceDraft {
  return {
    schemaVersion: 1,
    id,
    relationshipType: null,
    productTemplate: null,
    intent: null,
    name: "",
    source: null,
    step: "RELATIONSHIP",
    updatedAt: now.toISOString(),
  };
}

export function draftForProductSlug(
  id: string,
  slug: string,
  now = new Date(),
): MemorySpaceDraft {
  const draft = newMemorySpaceDraft(id, now);
  const profile = memoryProfileForSlug(slug);
  if (!profile || profile.family !== "MEMORY" || !profile.relationshipType || !profile.template) return draft;
  return {
    ...draft,
    relationshipType: profile.relationshipType,
    productTemplate: profile.template,
    step: "INTENT",
  };
}

export function recommendedIntents(relationshipType: RelationshipType): MemoryIntentDefinition[] {
  return MEMORY_INTENTS.filter((intent) => intent.recommendedFor.includes(relationshipType));
}

export function isRelationshipType(value: unknown): value is RelationshipType {
  return RELATIONSHIPS.some((relationship) => relationship.kind === value);
}

export function isMemoryIntentKind(value: unknown): value is MemoryIntentKind {
  return MEMORY_INTENTS.some((intent) => intent.kind === value);
}

export function isMemorySourceKind(value: unknown): value is MemorySourceKind {
  return value === "CONVERSATION" || value === "PHOTOS_VIDEOS" || value === "MANUAL";
}

export function isMemorySpaceDraft(value: unknown): value is MemorySpaceDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<MemorySpaceDraft>;
  return (
    draft.schemaVersion === 1 &&
    typeof draft.id === "string" &&
    draft.id.length > 0 &&
    (draft.relationshipType === null || isRelationshipType(draft.relationshipType)) &&
    (draft.productTemplate === undefined || draft.productTemplate === null || typeof draft.productTemplate === "string") &&
    (draft.intent === null || isMemoryIntentKind(draft.intent)) &&
    typeof draft.name === "string" &&
    (draft.source === null || isMemorySourceKind(draft.source)) &&
    (draft.step === "RELATIONSHIP" || draft.step === "INTENT" || draft.step === "NAME" || draft.step === "SOURCE") &&
    typeof draft.updatedAt === "string"
  );
}

export function sourceIntakeHref(draft: MemorySpaceDraft): string | null {
  if (!draft.source || !draft.relationshipType || !draft.intent || !draft.name.trim()) return null;
  const productTemplate = draft.productTemplate ?? productTemplateForRelationship(draft.relationshipType);
  const params = new URLSearchParams({
    memorySpaceId: draft.id,
    intent: draft.intent,
    relationship: draft.relationshipType,
    template: productTemplate,
  });

  if (draft.source === "CONVERSATION") return `/create?${params.toString()}`;
  const sourceSlug = draft.source === "PHOTOS_VIDEOS" ? "photos-videos" : "manual";
  return `/memory/intake/${sourceSlug}?${params.toString()}`;
}
