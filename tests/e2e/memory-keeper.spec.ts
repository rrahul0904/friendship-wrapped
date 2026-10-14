import { expect, test } from "@playwright/test";
import path from "node:path";

test("the default create route stays source-first while MemorySpace selects candidate intake", async ({ page }) => {
  await page.goto("/create");
  await expect(page.getByRole("heading", { name: "Your chats already contain a story." })).toBeVisible();

  await page.evaluate(() => {
    const now = new Date().toISOString();
    window.localStorage.setItem("threadtales:memory-space:v1:memory-space-test", JSON.stringify({
      schemaVersion: 1,
      id: "memory-space-test",
      name: "Test space",
      subjectType: "RELATIONSHIP",
      productTemplate: "RELATIONSHIP",
      relationshipType: "PARTNER",
      createdAt: now,
      updatedAt: now,
    }));
  });
  await page.goto("/create?memorySpaceId=memory-space-test");
  await expect(page.getByRole("heading", { name: /Add a conversation to your memory home/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Use demo chat" })).toBeVisible();

  await page.goto("/create?memorySpaceId=missing-space");
  await expect(page.getByText(/This MemorySpace is not available in this browser/i)).toBeVisible();
  await expect(page.getByLabel(/Choose WhatsApp text export or Telegram JSON export/i)).toHaveCount(0);
  await page.goto("/memory/intake/manual?memorySpaceId=missing-space");
  await expect(page.getByText(/This MemorySpace is not available in this browser/i)).toBeVisible();
  await expect(page.getByLabel("Memory title")).toHaveCount(0);
  await page.goto("/memory/missing-space");
  await expect(page.getByText(/This MemorySpace is not available in this browser/i)).toBeVisible();
  expect(await page.evaluate(() => Object.keys(window.localStorage).filter((key) => key.startsWith("threadtales:memory-graph:v1:")))).toHaveLength(0);

  const corruptGraph = JSON.stringify({ schemaVersion: 1, memorySpaceId: "corrupt-space", nodes: [{ kind: "BROKEN" }] });
  await page.evaluate((rawGraph) => {
    const now = new Date().toISOString();
    window.localStorage.setItem("threadtales:memory-space:v1:corrupt-space", JSON.stringify({
      schemaVersion: 1,
      id: "corrupt-space",
      name: "Corrupt space",
      subjectType: "RELATIONSHIP",
      productTemplate: "RELATIONSHIP",
      relationshipType: "PARTNER",
      createdAt: now,
      updatedAt: now,
    }));
    window.localStorage.setItem("threadtales:memory-graph:v1:corrupt-space", rawGraph);
  }, corruptGraph);
  await page.goto("/memory/corrupt-space");
  await expect(page.getByRole("heading", { name: "Your saved memories need attention." })).toBeVisible();
  expect(await page.evaluate(() => window.localStorage.getItem("threadtales:memory-graph:v1:corrupt-space"))).toBe(corruptGraph);
  const recoveryDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download recovery copy" }).click();
  expect((await recoveryDownload).suggestedFilename()).toContain("memory-graph-recovery.json");
  await page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Replace with an empty graph" }).click();
  await expect(page.getByText("Started a new Memory Graph. Your recovery file remains in Downloads.")).toBeVisible();
  const resetGraph = await page.evaluate(() => JSON.parse(window.localStorage.getItem("threadtales:memory-graph:v1:corrupt-space") ?? "{}"));
  expect(resetGraph.nodes).toEqual([]);
});

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
  const outboundRequests: Array<{ url: string; body: string }> = [];
  page.on("request", (request) => outboundRequests.push({ url: request.url(), body: request.postData() ?? "" }));
  await page.getByLabel(/Choose WhatsApp text export or Telegram JSON export/i).setInputFiles(
    path.resolve(process.cwd(), "tests/fixtures/whatsapp/ios-mdy.txt"),
  );
  await expect(page.getByRole("heading", { name: "We found moments worth reviewing." })).toBeVisible();
  await expect(page.locator(".story-hero")).toHaveCount(0);
  const outboundPayloads = outboundRequests.map((request) => `${request.url} ${request.body}`).join("\n");
  for (const canary of ["Maya Rose", "Jordan Lee", "Morning", "Coffee?", "Dinner later", "yes please", "made it home"]) {
    expect(outboundPayloads).not.toContain(canary);
  }
  const telemetryPayloads = outboundRequests
    .filter((request) => request.url.endsWith("/api/telemetry"))
    .map((request) => JSON.parse(request.body) as Record<string, unknown>);
  expect(telemetryPayloads.length).toBeGreaterThan(0);
  for (const payload of telemetryPayloads) {
    expect(Object.keys(payload).sort()).toEqual(["event", "product"]);
  }

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
  expect(graph).not.toContain("made it home");

  await page.getByRole("link", { name: /Open MemorySpace/i }).click();
  await expect(page.getByRole("heading", { name: "Anjali", level: 2 })).toBeVisible();
  await expect(page.getByText(/1 approved memory/i)).toBeVisible();

  await page.getByRole("link", { name: "Manual memory" }).click();
  await page.getByLabel("Memory title").fill("Our favorite picnic");
  await page.getByLabel("Kind").selectOption("MANUAL_MEMORY");
  await page.getByLabel("What do you want to remember?").fill("We brought peaches and stayed until sunset.");
  await page.getByRole("button", { name: "Keep this memory" }).click();
  await expect(page.getByText("Memory kept in this Memory Graph.")).toBeVisible();
  await page.getByRole("link", { name: /Open memory home/i }).first().click();
  await expect(page.getByText(/2 approved memories/i)).toBeVisible();

  await expect(page.getByText("Intent Composer")).toBeVisible();
  await page.getByLabel("Story intent").selectOption("ANNIVERSARY");
  await expect(page.locator("[data-story-intent='ANNIVERSARY']")).toBeVisible();
  const memorySelectors = page.locator(".memory-selection-list input[type='checkbox']");
  await expect(memorySelectors).toHaveCount(2);
  const memorySelector = memorySelectors.first();
  await expect(memorySelector).toBeChecked();
  await expect(page.locator(".chapter-dots button")).toHaveCount(4);
  await page.getByRole("button", { name: "Open memory story chapter 4" }).click();
  await memorySelector.uncheck();
  await expect(page.locator(".chapter-dots button")).toHaveCount(3);
  await expect(page.locator(".chapter-dots button.active")).toHaveAttribute("aria-label", "Open memory story chapter 1");
  await page.getByRole("button", { name: "Open memory story chapter 2" }).click();
  await expect(page.locator("[data-story-intent='ANNIVERSARY']").getByRole("heading", { name: "Our favorite picnic" })).toBeVisible();
  await expect(page.locator("[data-story-intent='ANNIVERSARY']")).not.toContainText("Where this thread begins");
  const activeCard = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download 9:16 card" }).click();
  expect((await activeCard).suggestedFilename()).toMatch(/-vertical\.png$/);
  await expect(page.getByRole("status").filter({ hasText: "Downloaded the active 9:16 story card." })).toBeVisible();
  await expect(memorySelector).not.toBeChecked();
  await page.evaluate(() => {
    const indexKey = "threadtales:memory-space-index:v1";
    const ids = JSON.parse(window.localStorage.getItem(indexKey) ?? "[]") as string[];
    window.localStorage.setItem(indexKey, JSON.stringify([...ids, "untouched-space"]));
    window.localStorage.setItem("threadtales:memory-space:v1:untouched-space", "keep-manifest");
    window.localStorage.setItem("threadtales:memory-graph:v1:untouched-space", "keep-graph");
  });

  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Delete this MemorySpace" }).click();
  await expect(page.getByRole("heading", { name: "Anjali", level: 2 })).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete this MemorySpace" }).click();
  await expect(page).toHaveURL(/\/memory\/new$/);
  await expect(page.getByRole("heading", { name: "Who or what is this for?" })).toBeVisible();
  const deletedState = await page.evaluate(() => ({
    manifestKeys: Object.keys(window.localStorage).filter((key) => key.startsWith("threadtales:memory-space:v1:")),
    graphKeys: Object.keys(window.localStorage).filter((key) => key.startsWith("threadtales:memory-graph:v1:")),
    spaceIndex: window.localStorage.getItem("threadtales:memory-space-index:v1"),
  }));
  expect(deletedState.manifestKeys).toEqual(["threadtales:memory-space:v1:untouched-space"]);
  expect(deletedState.graphKeys).toEqual(["threadtales:memory-graph:v1:untouched-space"]);
  expect(deletedState.spaceIndex).toBe(JSON.stringify(["untouched-space"]));
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
  await expect(page.getByRole("heading", { name: "My daughter" }).first()).toBeVisible();
  await expect(page.locator(".timeline-list").getByText("First day of school")).toBeVisible();
});

test("existing relationship product keeps its identity and offers MemorySpace creation", async ({ page }) => {
  await page.goto("/products/relationship");
  await expect(page.getByRole("heading", { name: "Relationship Universe" })).toBeVisible();
  await page.getByRole("link", { name: /Create a MemorySpace/i }).click();
  await expect(page).toHaveURL(/\/memory\/new\?template=relationship/);
  await expect(page.getByRole("heading", { name: "What are you trying to create?" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Anniversary/i })).toBeVisible();
});
