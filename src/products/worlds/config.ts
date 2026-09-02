export type WorldSlug = "relationship" | "lifemap" | "babystory" | "homestory" | "familytree" | "founderworld" | "creatorworld";

export interface WorldBlueprint {
  name?: string;
  slug: WorldSlug;
  eyebrow: string;
  titleLabel: string;
  titlePlaceholder: string;
  dateLabel: string;
  eventLabel: string;
  eventPlaceholder: string;
  detailLabel: string;
  detailPlaceholder: string;
  peopleLabel: string;
  placeLabel: string;
  extraLabel: string;
  extraPlaceholder: string;
  visualTitle: string;
  visualCopy: string;
  kinds: string[];
  tone: "theme-rose" | "theme-sky" | "theme-gold" | "theme-emerald" | "theme-violet" | "theme-teal" | "theme-confetti";
  acceptsIcs?: boolean;
  acceptsMetrics?: boolean;
}

export const worldBlueprints: Record<WorldSlug, WorldBlueprint> = {
  relationship: { slug: "relationship", eyebrow: "Relationship Universe", titleLabel: "World name", titlePlaceholder: "Us, in little moments", dateLabel: "Relationship start", eventLabel: "Memory or milestone", eventPlaceholder: "The weekend we got lost on purpose", detailLabel: "Private note", detailPlaceholder: "A detail kept only in this local world", peopleLabel: "Partner names", placeLabel: "Place", extraLabel: "Song or ritual", extraPlaceholder: "The song that takes you back", visualTitle: "A constellation made of the moments you chose.", visualCopy: "Places, songs and milestones form a private relationship world. Nothing is public until you make a selected share artifact.", kinds: ["Milestone", "Trip", "Song", "Date night", "Memory"], tone: "theme-rose" },
  lifemap: { slug: "lifemap", eyebrow: "LifeMap", titleLabel: "Map title", titlePlaceholder: "My living map", dateLabel: "Memory date", eventLabel: "Memory", eventPlaceholder: "A place that changed the year", detailLabel: "Private note", detailPlaceholder: "What you want to remember", peopleLabel: "People", placeLabel: "Place", extraLabel: "Song or era", extraPlaceholder: "A soundtrack, season or era", visualTitle: "A life told through places and eras.", visualCopy: "Choose memories, places, calendar events and songs. The map is a local place-cluster view, so it works without map credentials.", kinds: ["Memory", "Trip", "Calendar", "Place", "Milestone"], tone: "theme-sky", acceptsIcs: true },
  babystory: { slug: "babystory", eyebrow: "BabyStory", titleLabel: "Child's story title", titlePlaceholder: "Milo's little years", dateLabel: "Birth date", eventLabel: "First or milestone", eventPlaceholder: "First rainy-day dance", detailLabel: "Private family note", detailPlaceholder: "Kept private unless you deliberately export it", peopleLabel: "Family contributors", placeLabel: "Place", extraLabel: "Measurement / favorite", extraPlaceholder: "e.g. 72 cm · dinosaurs", visualTitle: "A gentle growing-up book, one chosen moment at a time.", visualCopy: "BabyStory is private by default. Build a timeline, firsts and annual chapters without publishing a child profile.", kinds: ["First", "Milestone", "Drawing", "Memory", "Growth"], tone: "theme-gold" },
  homestory: { slug: "homestory", eyebrow: "HomeStory", titleLabel: "Home name", titlePlaceholder: "The house on Juniper", dateLabel: "Move-in or project date", eventLabel: "Room, project or memory", eventPlaceholder: "Kitchen paint finally dried", detailLabel: "Private note", detailPlaceholder: "A detail for the next chapter of this home", peopleLabel: "Household", placeLabel: "Room or area", extraLabel: "Project / document label", extraPlaceholder: "Renovation · warranty · recipe", visualTitle: "A home has chapters, not just an address.", visualCopy: "Capture rooms, repairs, projects and family rituals. Street addresses are never included in the share-safe artifact.", kinds: ["Move", "Renovation", "Room", "Project", "Memory"], tone: "theme-emerald" },
  familytree: { slug: "familytree", eyebrow: "FamilyTree Live", titleLabel: "Family archive name", titlePlaceholder: "The Rivera family stories", dateLabel: "Person or story date", eventLabel: "Person or family story", eventPlaceholder: "Grandma Rosa's lemon cake", detailLabel: "Private story", detailPlaceholder: "A family detail stored locally by default", peopleLabel: "People / relationship", placeLabel: "Place", extraLabel: "Recipe, interview or document", extraPlaceholder: "Recipe card · oral history", visualTitle: "A living branch of the family story.", visualCopy: "Add people and relationship-labelled memories, then explore a readable family timeline. Living-person details remain private by default.", kinds: ["Person", "Parent", "Partner", "Sibling", "Story"], tone: "theme-teal" },
  founderworld: { slug: "founderworld", eyebrow: "FounderWorld", titleLabel: "Company name", titlePlaceholder: "Tiny Lantern Inc.", dateLabel: "Founding or metric date", eventLabel: "Launch, metric or milestone", eventPlaceholder: "First 100 customers", detailLabel: "Private operating note", detailPlaceholder: "What changed and why", peopleLabel: "Team / customers", placeLabel: "Market or product", extraLabel: "Metric", extraPlaceholder: "MRR $4,500 · 12 releases", visualTitle: "A startup city built from real milestones.", visualCopy: "Enter metrics manually or import a CSV/JSON export. Skyline cards translate safe signals, while the numeric timeline stays visible.", kinds: ["Launch", "Revenue", "Customer", "Release", "Incident"], tone: "theme-violet", acceptsMetrics: true },
  creatorworld: { slug: "creatorworld", eyebrow: "CreatorWorld", titleLabel: "Creator or channel name", titlePlaceholder: "Studio Lumen", dateLabel: "Metric or release date", eventLabel: "Release, milestone or audience moment", eventPlaceholder: "The video that found its people", detailLabel: "Private creator note", detailPlaceholder: "What you learned from this moment", peopleLabel: "Platform / collaborators", placeLabel: "Audience or region", extraLabel: "Metric", extraPlaceholder: "12k views · 4.8% engagement", visualTitle: "An audience story built from the signals you choose.", visualCopy: "Import analytics CSV/JSON or add metrics manually. No social account connection is claimed or required.", kinds: ["Release", "Audience", "Revenue", "Milestone", "Collaboration"], tone: "theme-confetti", acceptsMetrics: true },
};

export function isWorldSlug(value: string): value is WorldSlug { return value in worldBlueprints; }
