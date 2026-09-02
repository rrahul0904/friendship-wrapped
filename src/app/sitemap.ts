import type { MetadataRoute } from "next";

const routes = [
  "/", "/create", "/products", "/products/friendship", "/products/myyear", "/products/petlife", "/products/lifemap", "/products/relationship", "/products/babystory", "/products/homestory", "/products/familytree", "/products/founderworld", "/products/creatorworld", "/myyear", "/petlife", "/lifemap", "/relationship", "/babystory", "/homestory", "/familytree", "/founderworld", "/creatorworld",
  "/occasions", "/occasions/birthday", "/occasions/anniversary", "/occasions/long-distance", "/occasions/graduation", "/occasions/year-together",
  "/privacy", "/terms", "/contact",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://threadtales-five.vercel.app";
  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/create" ? 0.95 : path === "/products" || path === "/occasions" ? 0.82 : 0.7,
  }));
}
