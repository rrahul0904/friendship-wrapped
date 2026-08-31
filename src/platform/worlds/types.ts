import type { ProductType } from "@/platform/products/types";

export type WorldVisibility = "private" | "unlisted" | "public";

export interface World {
  id: string;
  productType: ProductType;
  title: string;
  visibility: WorldVisibility;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface WorldMember {
  worldId: string;
  userId: string;
  role: "owner" | "editor" | "viewer";
  createdAt: string;
}
