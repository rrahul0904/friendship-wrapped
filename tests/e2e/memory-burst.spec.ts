import { expect, test } from "@playwright/test";

const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zx2AAAAAASUVORK5CYII=",
  "base64",
);

test("Memory Studio opens an interactive local burst without network writes or sign-in", async ({ page }) => {
  const writes: string[] = [];
  page.on("request", (request) => {
    if (!["GET", "HEAD"].includes(request.method())) writes.push(request.url());
  });

  await page.goto("/memory/studio?memorySpaceId=burst-e2e&intent=MEMORY_LANE");
  await page.locator('input[type="file"]').setInputFiles({
    name: "memory.png",
    mimeType: "image/png",
    buffer: ONE_PIXEL_PNG,
  });
  await expect(page.getByAltText("memory.png").first()).toBeVisible();
  await page.getByRole("link", { name: /Play as burst/ }).click();

  await expect(page).toHaveURL(/\/memory\/burst\?memorySpaceId=burst-e2e&intent=MEMORY_LANE/);
  await expect(page.getByLabel("Memory Burst player")).toBeVisible();
  await expect(page.getByText("Private preview · no account")).toBeVisible();
  await page.getByRole("button", { name: "Next →" }).click();
  await expect(page.getByLabel("Memory Burst player").getByAltText("memory.png")).toBeVisible();
  await page.getByRole("button", { name: "Play burst" }).click();
  await expect(page.getByRole("button", { name: "Pause burst" })).toBeVisible();
  await expect(page.locator("input[type=file]")).toHaveCount(0);
  expect(writes).toEqual([]);

  await page.reload();
  await page.getByRole("button", { name: "Next →" }).click();
  await expect(page.getByLabel("Memory Burst player").getByAltText("memory.png")).toBeVisible();
});
