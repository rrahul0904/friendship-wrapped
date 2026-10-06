import { expect, test } from "@playwright/test";

test("approved conversation memories become an anniversary story plan", async ({ page }) => {
  await page.goto("/create?memorySpaceId=story-e2e&intent=ANNIVERSARY&relationship=PARTNER&demo=1");
  await expect(page.getByRole("heading", { name: /Which moments belong in this memory/i })).toBeVisible();

  const candidates = page.getByRole("article");
  await candidates.first().getByRole("button", { name: "Keep" }).click();
  await candidates.nth(1).getByRole("button", { name: "Keep" }).click();
  await candidates.nth(2).getByRole("button", { name: "Keep" }).click();

  await page.getByRole("link", { name: /Preview this story/i }).click();
  await expect(page).toHaveURL(/\/memory\/story\?memorySpaceId=story-e2e&intent=ANNIVERSARY/);
  await expect(page.getByRole("heading", { name: "Another chapter together" })).toBeVisible();

  const timeline = page.getByRole("region", { name: /Another chapter together story beats/i });
  await expect(timeline).toBeVisible();
  await expect(timeline.getByText("approved memory").first()).toBeVisible();
  await expect(timeline.getByText("your words required")).toBeVisible();
  await expect(timeline.getByText(/What do you want them to hear today/i)).toBeVisible();

  const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem("threadtales:memory-story-plan:v1:story-e2e:ANNIVERSARY") ?? "{}"));
  expect(stored.schemaVersion).toBe(1);
  expect(stored.intent).toBe("ANNIVERSARY");
  expect(stored.memorySpaceId).toBe("story-e2e");
  expect(stored.beats.some((beat: { source?: string }) => beat.source === "MEMORY_NODE")).toBe(true);
});

test("apology preview leaves the actual apology to the user", async ({ page }) => {
  await page.goto("/memory/story?memorySpaceId=apology-e2e&intent=APOLOGY");
  await page.evaluate(() => {
    window.localStorage.setItem("threadtales:memory-graph:v1:apology-e2e", JSON.stringify({
      schemaVersion: 1,
      memorySpaceId: "apology-e2e",
      updatedAt: "2026-10-06T00:00:00.000Z",
      nodes: [{
        schemaVersion: 1,
        id: "approved-beginning",
        memorySpaceId: "apology-e2e",
        source: "CONVERSATION",
        kind: "BEGINNING",
        title: "Where this began",
        detail: "A real approved memory.",
        containsPrivateText: false,
        approvedAt: "2026-10-06T00:00:00.000Z",
        provenance: { type: "DERIVED_STAT", key: "beginning" },
      }],
    }));
  });
  await page.reload();

  await expect(page.getByRole("heading", { name: "Something I need to say" })).toBeVisible();
  await expect(page.getByText(/Write the apology in your own words/i)).toBeVisible();
  await expect(page.getByText(/leaves this beat unwritten on purpose/i)).toBeVisible();
  await expect(page.getByText(/forgive me/i)).toHaveCount(0);
});
