import type { ProductType } from "@/platform/products/types";

export interface StoryEvent {
  id: string;
  worldId: string;
  productType: ProductType;
  type: string;
  occurredAt: string;
  title: string;
  description?: string;
  peopleIds: string[];
  placeIds: string[];
  mediaIds: string[];
  source?: string;
  metadata: Record<string, unknown>;
}

export interface StoryEventInput extends Omit<StoryEvent, "id"> {
  id?: string;
}
