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

  test("create workspace keeps privacy reassurance close to the uploader", async ({ page }) => {
    await page.goto("/create");
    await expect(page.getByRole("heading", { name: /Open the time capsule/i })).toBeVisible();
    await expect(page.getByText("Raw messages stay in this browser")).toBeVisible();
    await expect(page.getByText("No account required")).toBeVisible();
    await expect(page.getByRole("button", { name: "Choose chat export" })).toBeVisible();
  });

  test("product universe labels future concepts honestly", async ({ page }) => {
    await page.goto("/products");
    await expect(page.getByText("Live", { exact: true })).toBeVisible();
    await expect(page.getByText("MVP", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Future", { exact: true }).first()).toBeVisible();
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

  test("story controls stay usable on phone and iPad layouts", async ({ page }) => {
    for (const viewport of [{ width: 390, height: 844 }, { width: 820, height: 1180 }]) {
      await page.setViewportSize(viewport);
      await page.goto("/create?demo=1");
      await expect(page.locator("#results")).toBeVisible();
      const deck = page.getByRole("region", { name: /story chapters/i });
      await expect(deck.getByRole("radiogroup", { name: "Story theme selector" })).toBeVisible();
      await expect(deck.getByRole("radio", { name: "Midnight Free" })).toBeVisible();
      await expect(deck.getByLabel("Export", { exact: true })).toBeVisible();
      await expect(deck.getByRole("button", { name: "9:16 Story" })).toBeVisible();
      await expect(deck.getByRole("button", { name: "4:5 Portrait" })).toBeVisible();
      await expect(deck.getByRole("button", { name: "1:1 Square" })).toBeVisible();
      const overflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
      expect(overflow, `story workspace overflow at ${viewport.width}px`).toBeLessThanOrEqual(1);
    }
  });
});