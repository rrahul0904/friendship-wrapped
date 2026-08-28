export type ProductStage = "live" | "next" | "planned";

export interface ProductDefinition {
  slug: string;
  name: string;
  tagline: string;
  emoji: string;
  stage: ProductStage;
  audience: string;
  input: string;
  output: string;
  businessModel: string;
  needsPersistence: boolean;
}

export const products: ProductDefinition[] = [
  {
    slug: "friendship",
    name: "Friendship Wrapped",
    tagline: "Turn years of messages into the story of your friendship.",
    emoji: "💬",
    stage: "live",
    audience: "Friends, couples, siblings and group chats",
    input: "Chat exports",
    output: "Visual friendship story and share page",
    businessModel: "$5–15 premium story, video or book",
    needsPersistence: false,
  },
  {
    slug: "lifemap",
    name: "LifeMap",
    tagline: "Your life, places, people and eras on one living map.",
    emoji: "🗺️",
    stage: "planned",
    audience: "Individuals, couples and families",
    input: "Photos, travel, music and calendar history",
    output: "Interactive personal map",
    businessModel: "Private archive, print books and yearly recap",
    needsPersistence: true,
  },
  {
    slug: "relationship",
    name: "Relationship Universe",
    tagline: "Build a world from the places, songs and memories you share.",
    emoji: "💞",
    stage: "planned",
    audience: "Couples",
    input: "Photos, trips, songs and milestones",
    output: "Persistent shared relationship world",
    businessModel: "Subscription plus premium gifts",
    needsPersistence: true,
  },
  {
    slug: "petlife",
    name: "PetLife",
    tagline: "A living memory world for the animal who owns your heart.",
    emoji: "🐾",
    stage: "next",
    audience: "Pet owners and families",
    input: "Photos, birthdays, walks, health milestones and stories",
    output: "Pet timeline, world and memorial archive",
    businessModel: "Storage, AI art, books and memorial products",
    needsPersistence: true,
  },
  {
    slug: "babystory",
    name: "BabyStory",
    tagline: "Capture growing up without losing the tiny moments.",
    emoji: "🧸",
    stage: "planned",
    audience: "Parents and grandparents",
    input: "Photos, milestones, recordings, drawings and measurements",
    output: "Private growing-up timeline",
    businessModel: "Family plan, yearly books and storage",
    needsPersistence: true,
  },
  {
    slug: "homestory",
    name: "HomeStory",
    tagline: "Give a home a memory, not just an address.",
    emoji: "🏡",
    stage: "planned",
    audience: "Homeowners and families",
    input: "Photos, renovations, documents and stories",
    output: "Transferable home memory capsule",
    businessModel: "Archive, transfer and print products",
    needsPersistence: true,
  },
  {
    slug: "myyear",
    name: "MyYear.World",
    tagline: "A living year-in-review that grows while you live it.",
    emoji: "✨",
    stage: "next",
    audience: "Consumers and creators",
    input: "Photos, music, travel, workouts, reading and journal entries",
    output: "Live annual story plus cinematic recap",
    businessModel: "Annual premium recap and exports",
    needsPersistence: true,
  },
  {
    slug: "founderworld",
    name: "FounderWorld",
    tagline: "Watch your startup become a living city.",
    emoji: "🏙️",
    stage: "planned",
    audience: "Indie hackers and startup teams",
    input: "Revenue, analytics, GitHub and social signals",
    output: "Live startup city and business observability",
    businessModel: "Monthly SaaS subscription",
    needsPersistence: true,
  },
  {
    slug: "creatorworld",
    name: "CreatorWorld",
    tagline: "Turn an audience into a world you can explore.",
    emoji: "🎬",
    stage: "planned",
    audience: "Creators and musicians",
    input: "YouTube, TikTok, Instagram and Spotify metrics",
    output: "Public creator world with analytics underneath",
    businessModel: "Creator analytics subscription",
    needsPersistence: true,
  },
  {
    slug: "familytree",
    name: "FamilyTree Live",
    tagline: "A family tree with voices, places, recipes and stories.",
    emoji: "🌳",
    stage: "planned",
    audience: "Families and genealogy enthusiasts",
    input: "People, photos, audio, documents and interviews",
    output: "Explorable family graph and archive",
    businessModel: "Family subscription, archive and AI interviews",
    needsPersistence: true,
  },
];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}
