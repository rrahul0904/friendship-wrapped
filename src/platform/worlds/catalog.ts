export const worldProducts = ["threadtales","myyear","petlife","relationship","lifemap","babystory","homestory","familytree","founderworld","creatorworld"] as const;
export type WorldProduct = typeof worldProducts[number];

export const worldProductLabels: Record<WorldProduct, string> = {
  threadtales: "ThreadTales",
  myyear: "MyYear.World",
  petlife: "PetLife",
  relationship: "Relationship Universe",
  lifemap: "LifeMap",
  babystory: "BabyStory",
  homestory: "HomeStory",
  familytree: "FamilyTree Live",
  founderworld: "FounderWorld",
  creatorworld: "CreatorWorld",
};

export function isWorldProduct(value: unknown): value is WorldProduct {
  return typeof value === "string" && (worldProducts as readonly string[]).includes(value);
}
