import type { ProductType } from "@/platform/products/types";

export interface ShareSection {
  id: string;
  type: string;
  title?: string;
  payload: Record<string, unknown>;
}

export interface ShareManifest {
  version: 1;
  worldId: string;
  productType: ProductType;
  visibility: "unlisted" | "public";
  includeNames: boolean;
  sections: ShareSection[];
  createdAt: string;
}

export interface ShareRenderer {
  id: "web" | "social-card" | "pdf" | "video";
  render(manifest: ShareManifest): Promise<unknown>;
}
