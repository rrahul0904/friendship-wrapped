import { afterEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/version/route";

const originalVercelSha = process.env.VERCEL_GIT_COMMIT_SHA;
const originalPublicSha = process.env.NEXT_PUBLIC_GIT_SHA;
const originalVercelEnv = process.env.VERCEL_ENV;

afterEach(() => {
  if (originalVercelSha === undefined) delete process.env.VERCEL_GIT_COMMIT_SHA;
  else process.env.VERCEL_GIT_COMMIT_SHA = originalVercelSha;

  if (originalPublicSha === undefined) delete process.env.NEXT_PUBLIC_GIT_SHA;
  else process.env.NEXT_PUBLIC_GIT_SHA = originalPublicSha;

  if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = originalVercelEnv;
});

describe("/api/version", () => {
  it("falls back to NEXT_PUBLIC_GIT_SHA when Vercel injects an empty commit SHA", async () => {
    process.env.VERCEL_GIT_COMMIT_SHA = "";
    process.env.NEXT_PUBLIC_GIT_SHA = "45cb14fd1e66255fbd845aee0d9432df19c9cb6f";
    process.env.VERCEL_ENV = "production";

    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      commit: "45cb14fd1e66255fbd845aee0d9432df19c9cb6f",
      environment: "production",
    });
  });

  it("prefers the non-empty Vercel Git SHA when available", async () => {
    process.env.VERCEL_GIT_COMMIT_SHA = "vercel-sha";
    process.env.NEXT_PUBLIC_GIT_SHA = "fallback-sha";
    process.env.VERCEL_ENV = "preview";

    const response = await GET();
    await expect(response.json()).resolves.toEqual({
      commit: "vercel-sha",
      environment: "preview",
    });
  });
});
