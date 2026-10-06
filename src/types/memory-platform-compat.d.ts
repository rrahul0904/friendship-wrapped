import type { MemoryProductTemplate, MemoryRelationshipType, MemorySpaceManifest } from "@/lib/memory-platform";

declare module "@/lib/memory-platform" {
  export function createMemorySpaceManifest(args: {
    id: string;
    name: string;
    relationshipType: MemoryRelationshipType | null;
    productTemplate?: MemoryProductTemplate;
    now?: Date;
  }): MemorySpaceManifest;
}
