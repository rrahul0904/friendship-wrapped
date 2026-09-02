import type { MetadataRoute } from "next";

const routes = [
  "/", "/create", "/products", "/products/friendship", "/products/myyear", "/products/petlife", "/myyear", "/petlife",
  "/occasions", "/occasions/birthday", "/occasions/anniversary", "/occasions/long-distance", "/occasions/graduation", "/occasions/year-together",
  "/privacy", "/terms", "/contact",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://threadtales.vercel.app";
  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/create" ? 0.95 : path === "/products" || path === "/occasions" ? 0.82 : 0.7,
  }));
}
