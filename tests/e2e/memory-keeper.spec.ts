import { expect, test } from "@playwright/test";

test("Memory Keeper creates a relationship-intent space, approves chat memories, and composes a story", async ({ page }) => {
  await page.goto("/memory/new");

  await expect(page.getByRole("heading", { name: "Who or what is this for?" })).toBeVisible();
  await page.getByRole("button", { name: /Partner/i }).click();
  await expect(page.getByRole("heading", { name: "What are you trying to create?" })).toBeVisible();
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

  await page.getByRole("link", { name: /Open MemorySpace/i }).click();
  await expect(page.getByRole("heading", { name: "Anjali" })).toBeVisible();
  await expect(page.getByText(/1 approved memory/i)).toBeVisible();
  await expect(page.getByText("Intent Composer")).toBeVisible();
  await page.getByLabel("Story intent").selectOption("ANNIVERSARY");
  await expect(page.locator("[data-story-intent='ANNIVERSARY']")).toBeVisible();
});

test("manual child memory becomes reusable graph data", async ({ page }) => {
  await page.goto("/memory/new");
  await page.getByRole("button", { name: /Child/i }).click();

  await expect(page.getByRole("button", { name: /Proud of you/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Memory lane/i })).toBeVisible();
  await page.getByRole("button", { name: /Proud of you/i }).click();

  await page.getByLabel("MemorySpace name").fill("My daughter");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Start manually/i }).click();

  await expect(page).toHaveURL(/\/memory\/intake\/manual\?/);
  await page.getByLabel("Memory title").fill("First day of school");
  await page.getByLabel("Kind").selectOption("MILESTONE");
  await page.getByLabel("What do you want to remember?").fill("She walked in nervous and came out smiling.");
  await page.getByRole("button", { name: "Keep this memory" }).click();
  await expect(page.getByText("Memory kept in this Memory Graph.")).toBeVisible();
  await page.getByRole("link", { name: /Open memory home/i }).first().click();
  await expect(page.getByRole("heading", { name: "My daughter" })).toBeVisible();
  await expect(page.getByText("First day of school")).toBeVisible();
});

test("existing relationship product keeps its identity and offers MemorySpace creation", async ({ page }) => {
  await page.goto("/products/relationship");
  await expect(page.getByRole("heading", { name: "Relationship Universe" })).toBeVisible();
  await page.getByRole("link", { name: /Create a MemorySpace/i }).click();
  await expect(page).toHaveURL(/\/memory\/new\?template=relationship/);
  await expect(page.getByRole("heading", { name: "What are you trying to create?" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Anniversary/i })).toBeVisible();
});
