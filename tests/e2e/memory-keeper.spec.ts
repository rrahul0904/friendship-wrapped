import { expect, test } from "@playwright/test";

test("MemorySpace conversation flow requires explicit approval before graph persistence", async ({ page }) => {
  const requestBodies: string[] = [];
  page.on("request", (request) => {
    const body = request.postData();
    if (body) requestBodies.push(body);
  });

  await page.goto("/create?memorySpaceId=memory-e2e&intent=ANNIVERSARY&relationship=PARTNER&demo=1");

  await expect(page.getByRole("heading", { name: /Which moments belong in this memory/i })).toBeVisible();
  await expect(page.getByText(/Nothing becomes part of the Memory Graph until you choose/i)).toBeVisible();
  await expect(page.getByText("Story type")).toHaveCount(0);

  const candidates = page.getByRole("article");
  await expect(candidates.first()).toBeVisible();
  expect(await candidates.count()).toBeGreaterThan(1);

  const firstPrivateDetail = await candidates.first().locator("p").textContent();

  await candidates.first().getByRole("button", { name: "Skip" }).click();
  const afterSkip = await page.evaluate(() => JSON.parse(window.localStorage.getItem("threadtales:memory-graph:v1:memory-e2e") ?? "{}"));
  expect(afterSkip.nodes).toHaveLength(0);

  await candidates.nth(1).getByRole("button", { name: "Keep" }).click();
  const afterKeep = await page.evaluate(() => JSON.parse(window.localStorage.getItem("threadtales:memory-graph:v1:memory-e2e") ?? "{}"));
  expect(afterKeep.schemaVersion).toBe(1);
  expect(afterKeep.memorySpaceId).toBe("memory-e2e");
  expect(afterKeep.nodes).toHaveLength(1);
  expect(afterKeep.nodes[0].approvedAt).toBeTruthy();

  if (firstPrivateDetail) {
    expect(requestBodies.join("\n")).not.toContain(firstPrivateDetail);
  }
});

test("Memory Graph approval survives refresh in the same browser", async ({ page }) => {
  await page.goto("/create?memorySpaceId=memory-refresh&intent=MEMORY_LANE&relationship=FRIEND&demo=1");
  await expect(page.getByRole("heading", { name: /Which moments belong in this memory/i })).toBeVisible();

  const candidates = page.getByRole("article");
  await candidates.first().getByRole("button", { name: "Keep" }).click();
  await expect(page.getByText(/1 kept/)).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: /Which moments belong in this memory/i })).toBeVisible();
  await expect(page.getByText(/1 kept/)).toBeVisible();
});
