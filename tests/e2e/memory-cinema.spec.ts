import { expect, test } from "@playwright/test";

const responsiveWidths = [360, 375, 390, 430, 768, 820, 1024, 1180, 1280, 1440, 1728];

test.describe("Memory Cinema UI", () => {
  test("landing communicates the private emotional story promise", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Your chats, turned into a story worth sharing/i })).toBeVisible();
    await expect(page.getByText(/Private by default · zero raw-chat upload/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Not a dashboard/i })).toBeVisible();
    await expect(page.getByLabel("ThreadTales product flow")).toBeVisible();
  });

  test("mobile navigation remains available instead of disappearing", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const menu = page.getByRole("button", { name: "Open navigation" });
    await expect(menu).toBeVisible();
    await menu.click();
    await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Products" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Make yours/i })).toBeVisible();
  });

  test("create keeps concise privacy reassurance beside the one primary action", async ({ page }) => {
    await page.goto("/create");
    await expect(page.getByRole("heading", { name: "Your chats already contain a story." })).toBeVisible();
    await expect(page.getByText("Processed on this device")).toBeVisible();
    await expect(page.getByRole("button", { name: "Choose a chat export" })).toBeVisible();
    await expect(page.getByRole("button", { name: "See a demo first →" })).toBeVisible();
  });

  test("product universe exposes ten live products", async ({ page }) => {
    await page.goto("/products");
    await expect(page.getByText("Live", { exact: true })).toHaveCount(10);
    await expect(page.getByText("MVP", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Future", { exact: true })).toHaveCount(0);
  });

  test("short MyYear and PetLife routes resolve to their actual MVP pages", async ({ page }) => {
    await page.goto("/myyear");
    await expect(page).toHaveURL(/\/products\/myyear$/);
    await expect(page.getByLabel("Year title")).toBeVisible();
    await page.goto("/petlife");
    await expect(page).toHaveURL(/\/products\/petlife$/);
    await expect(page.getByLabel("Pet name")).toBeVisible();
  });

  test("required responsive matrix does not create horizontal page overflow", async ({ page }) => {
    test.setTimeout(45_000);
    for (const width of responsiveWidths) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
      await page.goto("/");
      const overflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
      expect(overflow, `unexpected horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);
    }
  });

  test("source-first story controls stay usable on phone and iPad layouts", async ({ page }) => {
    for (const viewport of [{ width: 390, height: 844 }, { width: 820, height: 1180 }]) {
      await page.setViewportSize(viewport);
      await page.goto("/create");
      await page.getByRole("button", { name: "See a demo first →" }).click();
      await expect(page.getByLabel("Chapter 1 of 12")).toBeVisible();
      const card = page.getByTestId("threadtales-story-card");
      const box = await card.boundingBox();
      expect(box).not.toBeNull();
      expect((box?.width ?? 0) / (box?.height ?? 1)).toBeCloseTo(9 / 16, 1);
      await expect(page.getByRole("button", { name: "Share" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Save card" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Next chapter" })).toBeVisible();
      const overflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
      expect(overflow, `story workspace overflow at ${viewport.width}px`).toBeLessThanOrEqual(1);
    }
  });

  test("desktop reveal preserves a centered vertical story instead of expanding into a dashboard", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/create");
    await page.getByRole("button", { name: "See a demo first →" }).click();
    await expect(page.getByLabel("Chapter 1 of 12")).toBeVisible();

    const card = page.getByTestId("threadtales-story-card");
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(570);
    expect(box!.width / box!.height).toBeCloseTo(9 / 16, 1);
    expect(box!.x).toBeGreaterThan(400);
    expect(box!.x + box!.width).toBeLessThan(1040);

    await expect(page.locator(".story-hero")).toHaveCount(0);
    await expect(page.locator(".mc-story-deck")).toHaveCount(0);
    await expect(page.locator(".mc-cinematic")).toHaveCount(0);
    const overflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
