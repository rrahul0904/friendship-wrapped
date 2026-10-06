export type MemoryRelationshipType =
  | "PARTNER"
  | "CHILD"
  | "PARENT"
  | "FRIEND"
  | "FAMILY_GROUP"
  | "PET"
  | "HOME"
  | "SELF"
  | "OTHER";

export type MemorySubjectType =
  | "SELF"
  | "PERSON"
  | "RELATIONSHIP"
  | "GROUP"
  | "FAMILY"
  | "PET"
  | "HOME";

export type MemoryProductTemplate =
  | "MEMORY_KEEPER"
  | "FRIENDSHIP"
  | "RELATIONSHIP"
  | "BABYSTORY"
  | "FAMILYTREE"
  | "PETLIFE"
  | "HOMESTORY";

export type MemoryLens = "LIFEMAP" | "MYYEAR";
export type ProgressProductTemplate = "FOUNDERWORLD" | "CREATORWORLD";
export type ProductFamily = "MEMORY" | "LENS" | "PROGRESS";

export interface ProductMemoryProfile {
  slug: string;
  family: ProductFamily;
  template?: MemoryProductTemplate;
  lens?: MemoryLens;
  progressTemplate?: ProgressProductTemplate;
  subjectType?: MemorySubjectType;
  relationshipType?: MemoryRelationshipType;
}

export interface MemorySpaceManifest {
  schemaVersion: 1;
  id: string;
  name: string;
  subjectType: MemorySubjectType;
  productTemplate: MemoryProductTemplate;
  relationshipType?: MemoryRelationshipType;
  createdAt: string;
  updatedAt: string;
}

export const MEMORY_SPACE_STORAGE_PREFIX = "threadtales:memory-space:v1:";
export const MEMORY_SPACE_INDEX_KEY = "threadtales:memory-space-index:v1";

export const PRODUCT_MEMORY_PROFILES: Record<string, ProductMemoryProfile> = {
  friendship: {
    slug: "friendship",
    family: "MEMORY",
    template: "FRIENDSHIP",
    subjectType: "RELATIONSHIP",
    relationshipType: "FRIEND",
  },
  relationship: {
    slug: "relationship",
    family: "MEMORY",
    template: "RELATIONSHIP",
    subjectType: "RELATIONSHIP",
    relationshipType: "PARTNER",
  },
  babystory: {
    slug: "babystory",
    family: "MEMORY",
    template: "BABYSTORY",
    subjectType: "PERSON",
    relationshipType: "CHILD",
  },
  familytree: {
    slug: "familytree",
    family: "MEMORY",
    template: "FAMILYTREE",
    subjectType: "FAMILY",
    relationshipType: "FAMILY_GROUP",
  },
  petlife: {
    slug: "petlife",
    family: "MEMORY",
    template: "PETLIFE",
    subjectType: "PET",
    relationshipType: "PET",
  },
  homestory: {
    slug: "homestory",
    family: "MEMORY",
    template: "HOMESTORY",
    subjectType: "HOME",
    relationshipType: "HOME",
  },
  lifemap: {
    slug: "lifemap",
    family: "LENS",
    lens: "LIFEMAP",
  },
  myyear: {
    slug: "myyear",
    family: "LENS",
    lens: "MYYEAR",
  },
  founderworld: {
    slug: "founderworld",
    family: "PROGRESS",
    progressTemplate: "FOUNDERWORLD",
  },
  creatorworld: {
    slug: "creatorworld",
    family: "PROGRESS",
    progressTemplate: "CREATORWORLD",
  },
};

export function memoryProfileForSlug(slug: string): ProductMemoryProfile | null {
  return PRODUCT_MEMORY_PROFILES[slug] ?? null;
}

export function productTemplateForRelationship(
  relationshipType: MemoryRelationshipType,
): MemoryProductTemplate {
  if (relationshipType === "PARTNER") return "RELATIONSHIP";
  if (relationshipType === "CHILD") return "BABYSTORY";
  if (relationshipType === "FAMILY_GROUP" || relationshipType === "PARENT") return "FAMILYTREE";
  if (relationshipType === "PET") return "PETLIFE";
  if (relationshipType === "HOME") return "HOMESTORY";
  if (relationshipType === "FRIEND") return "FRIENDSHIP";
  return "MEMORY_KEEPER";
}

export function subjectTypeForRelationship(
  relationshipType: MemoryRelationshipType,
): MemorySubjectType {
  if (relationshipType === "PARTNER" || relationshipType === "FRIEND") return "RELATIONSHIP";
  if (relationshipType === "CHILD" || relationshipType === "PARENT" || relationshipType === "OTHER") return "PERSON";
  if (relationshipType === "FAMILY_GROUP") return "FAMILY";
  if (relationshipType === "PET") return "PET";
  if (relationshipType === "HOME") return "HOME";
  return "SELF";
}

export function createMemorySpaceManifest({
  id,
  name,
  relationshipType,
  productTemplate,
  now = new Date(),
}: {
  id: string;
  name: string;
  relationshipType: MemoryRelationshipType;
  productTemplate?: MemoryProductTemplate;
  now?: Date;
}): MemorySpaceManifest {
  const timestamp = now.toISOString();
  return {
    schemaVersion: 1,
    id,
    name: name.trim(),
    subjectType: subjectTypeForRelationship(relationshipType),
    productTemplate: productTemplate ?? productTemplateForRelationship(relationshipType),
    relationshipType,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function isMemorySpaceManifest(value: unknown): value is MemorySpaceManifest {
  if (!value || typeof value !== "object") return false;
  const manifest = value as Partial<MemorySpaceManifest>;
  return (
    manifest.schemaVersion === 1 &&
    typeof manifest.id === "string" &&
    manifest.id.length > 0 &&
    typeof manifest.name === "string" &&
    typeof manifest.subjectType === "string" &&
    typeof manifest.productTemplate === "string" &&
    typeof manifest.createdAt === "string" &&
    typeof manifest.updatedAt === "string"
  );
}

export function memorySpaceStorageKey(memorySpaceId: string) {
  return `${MEMORY_SPACE_STORAGE_PREFIX}${memorySpaceId}`;
}

export function memorySpaceHomeHref(memorySpaceId: string) {
  return `/memory/${encodeURIComponent(memorySpaceId)}`;
}

export function newMemoryHrefForProduct(slug: string) {
  const profile = memoryProfileForSlug(slug);
  if (!profile || profile.family !== "MEMORY" || !profile.template) return null;
  return `/memory/new?template=${slug}`;
}
