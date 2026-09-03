export type ProductStage = "live";

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
  { slug: "friendship", name: "Friendship Wrapped", tagline: "Turn years of messages into the story of your friendship.", emoji: "💬", stage: "live", audience: "Friends, couples, siblings and group chats", input: "Chat exports", output: "Visual friendship story and share page", businessModel: "$5–15 premium story, video or book", needsPersistence: false },
  { slug: "lifemap", name: "LifeMap", tagline: "Your life, places, people and eras on one living map.", emoji: "🗺️", stage: "live", audience: "Individuals, couples and families", input: "Manual memories, local calendar/CSV/JSON imports, places and music", output: "Local chronological map and story artifact", businessModel: "Private archive, print books and yearly recap", needsPersistence: true },
  { slug: "relationship", name: "Relationship Universe", tagline: "Build a world from the places, songs and memories you share.", emoji: "💞", stage: "live", audience: "Couples", input: "Milestones, trips, songs, places and private notes", output: "Local relationship world and share-safe recap", businessModel: "Subscription plus premium gifts", needsPersistence: true },
  { slug: "petlife", name: "PetLife", tagline: "A living memory world for the animal who owns your heart.", emoji: "🐾", stage: "live", audience: "Pet owners and families", input: "Photos, birthdays, walks, health memories and stories", output: "Pet timeline, annual recap and private household memories", businessModel: "Storage, premium recaps, books and memorial products", needsPersistence: true },
  { slug: "babystory", name: "BabyStory", tagline: "Capture growing up without losing the tiny moments.", emoji: "🧸", stage: "live", audience: "Parents and grandparents", input: "Milestones, family memories, measurements and selected local media", output: "Private growing-up timeline and story artifact", businessModel: "Family plan, yearly books and storage", needsPersistence: true },
  { slug: "homestory", name: "HomeStory", tagline: "Give a home a memory, not just an address.", emoji: "🏡", stage: "live", audience: "Homeowners and families", input: "Rooms, projects, renovations, documents and stories", output: "Private home capsule and storybook recap", businessModel: "Archive, transfer and print products", needsPersistence: true },
  { slug: "myyear", name: "MyYear.World", tagline: "A living year-in-review that grows while you live it.", emoji: "✨", stage: "live", audience: "Consumers and creators", input: "Selected photos and manual highlights", output: "Local annual story with optional cloud save", businessModel: "Annual premium recap and exports", needsPersistence: true },
  { slug: "founderworld", name: "FounderWorld", tagline: "Watch your startup become a living city.", emoji: "🏙️", stage: "live", audience: "Indie hackers and startup teams", input: "Manual KPI events plus local CSV/JSON imports", output: "Startup world, metrics timeline and share-safe artifact", businessModel: "Monthly SaaS subscription", needsPersistence: true },
  { slug: "creatorworld", name: "CreatorWorld", tagline: "Turn an audience into a world you can explore.", emoji: "🎬", stage: "live", audience: "Creators and musicians", input: "Manual metrics plus local analytics CSV/JSON imports", output: "Creator world, audience timeline and share-safe artifact", businessModel: "Creator analytics subscription", needsPersistence: true },
  { slug: "familytree", name: "FamilyTree Live", tagline: "A family tree with voices, places, recipes and stories.", emoji: "🌳", stage: "live", audience: "Families and genealogy enthusiasts", input: "People, relationship labels, stories, places and recipes", output: "Private family archive and selected-branch recap", businessModel: "Family subscription, archive and AI interviews", needsPersistence: true },
];

export function getProduct(slug: string) { return products.find((product) => product.slug === slug); }
