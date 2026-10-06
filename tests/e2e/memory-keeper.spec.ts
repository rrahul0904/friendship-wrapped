import { expect, test } from "@playwright/test";

test("Memory Keeper creates a relationship-intent draft and approves derived memories", async ({ page }) => {
  await page.goto("/memory/new");

  await expect(page.getByRole("heading", { name: "Who is this for?" })).toBeVisible();
  await page.getByRole("button", { name: /Partner/i }).click();
  await expect(page.getByRole("heading", { name: "What are you trying to say?" })).toBeVisible();
  await page.getByRole("button", { name: /Anniversary/i }).click();

  await page.getByLabel("MemorySpace name").fill("Anjali");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Where should we start?" })).toBeVisible();
  await page.getByRole("button", { name: /Conversation/i }).click();

  await expect(page).toHaveURL(/\/create\?memorySpaceId=/);
  await page.getByRole("button", { name: "Use demo chat" }).click();
  await expect(page.getByRole("heading", { name: "We found moments worth reviewing." })).toBeVisible();
  await expect(page.locator(".story-hero")).toHaveCount(0);

  const firstCandidate = page.locator("[data-memory-candidate]").first();
  await firstCandidate.getByRole("button", { name: "Keep" }).click();
  await expect(firstCandidate.getByText("Kept in Memory Graph")).toBeVisible();

  const graph = await page.evaluate(() => {
    const key = Object.keys(window.localStorage).find((item) => item.startsWith("threadtales:memory-graph:v1:"));
    return key ? window.localStorage.getItem(key) : null;
  });
  expect(graph).not.toBeNull();
  const parsed = JSON.parse(graph ?? "{}") as { nodes?: unknown[] };
  expect(parsed.nodes).toHaveLength(1);
  expect(graph).not.toContain("rawChat");
  expect(graph).not.toContain("chatMessages");

  await page.reload();
  await page.getByRole("button", { name: "Use demo chat" }).click();
  await expect(page.getByText("✓ Kept in Memory Graph").first()).toBeVisible();
});

test("relationship and occasion remain independent choices", async ({ page }) => {
  await page.goto("/memory/new");
  await page.getByRole("button", { name: /Child/i }).click();

  await expect(page.getByRole("button", { name: /Proud of you/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Memory lane/i })).toBeVisible();
  await page.getByRole("button", { name: /Proud of you/i }).click();

  await page.getByLabel("MemorySpace name").fill("My daughter");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Start manually/i }).click();

  await expect(page).toHaveURL(/\/memory\/intake\/manual\?/);
});
