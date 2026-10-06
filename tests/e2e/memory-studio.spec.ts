import { expect, test } from "@playwright/test";

const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zx2AAAAAASUVORK5CYII=",
  "base64",
);

test("Memory Studio keeps media, dedication, and soundtrack reference local", async ({ page }) => {
  const writes: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET" && request.method() !== "HEAD") writes.push(request.url());
  });

  await page.goto("/memory/studio?memorySpaceId=studio-e2e&intent=ANNIVERSARY");
  await expect(page.getByRole("heading", { name: /Shape the memory/i })).toBeVisible();
  await expect(page.getByLabel("9:16 Memory Story preview")).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles({
    name: "memory.png",
    mimeType: "image/png",
    buffer: ONE_PIXEL_PNG,
  });

  await expect(page.getByAltText("memory.png").first()).toBeVisible();
  await page.getByLabel("Your dedication").fill("I would choose these memories again.");
  await page.getByRole("textbox", { name: "Song", exact: true }).fill("Our Song");
  await page.getByRole("textbox", { name: "Artist", exact: true }).fill("Our Artist");

  await expect(page.getByText(/♫ Our Song — Our Artist/)).toBeVisible();
  await page.getByRole("button", { name: /Next/i }).click();
  await expect(page.getByLabel("9:16 Memory Story preview").getByAltText("memory.png")).toBeVisible();

  const persisted = await page.evaluate(() => JSON.parse(window.localStorage.getItem("threadtales:memory-studio:v1:studio-e2e:ANNIVERSARY") ?? "{}"));
  expect(persisted.dedication).toBe("I would choose these memories again.");
  expect(persisted.soundtrack).toMatchObject({ title: "Our Song", artist: "Our Artist", mode: "REFERENCE" });

  const localMediaCount = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("threadtales-memory-v1", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      const transaction = db.transaction("media", "readonly");
      const records = await new Promise<Array<{ memorySpaceId: string }>>((resolve, reject) => {
        const request = transaction.objectStore("media").getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      return records.filter((record) => record.memorySpaceId === "studio-e2e").length;
    } finally {
      db.close();
    }
  });
  expect(localMediaCount).toBe(1);
  expect(writes).toEqual([]);

  await page.reload();
  await expect(page.getByAltText("memory.png").first()).toBeVisible();
  await expect(page.getByLabel("Your dedication")).toHaveValue("I would choose these memories again.");
  await expect(page.getByRole("textbox", { name: "Song", exact: true })).toHaveValue("Our Song");
});

test("photo-video MemorySpace start routes directly into the studio", async ({ page }) => {
  await page.goto("/memory/intake/photos-videos?memorySpaceId=media-first&intent=MEMORY_LANE&relationship=CHILD");
  await expect(page).toHaveURL(/\/memory\/studio\?memorySpaceId=media-first&intent=MEMORY_LANE/);
  await expect(page.getByRole("heading", { name: /Shape the memory/i })).toBeVisible();
});
