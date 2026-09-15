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

  test("desktop reveal uses the full story canvas and keeps Relive composition connected", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/create?demo=1");
    const results = page.locator("#results");
    await expect(results).toBeVisible();

    const hero = results.locator(".story-hero");
    const deck = results.locator(".mc-story-deck");
    const workbench = deck.locator(".mc-story-workbench");
    const canvas = workbench.locator(".mc-story-canvas");
    const themes = workbench.locator(".mc-theme-selector");
    const cinematic = results.locator(".mc-cinematic");
    const cinematicHead = cinematic.locator(".mc-cinematic-head");
    const cinematicStage = cinematic.locator(".mc-cinematic-stage");

    await expect(hero).toBeVisible();
    await expect(deck).toBeVisible();
    await expect(cinematic).toBeVisible();

    const heroBox = await hero.boundingBox();
    const deckBox = await deck.boundingBox();
    const canvasBox = await canvas.boundingBox();
    const themesBox = await themes.boundingBox();
    const cinematicBox = await cinematic.boundingBox();
    const cinematicHeadBox = await cinematicHead.boundingBox();
    const cinematicStageBox = await cinematicStage.boundingBox();

    expect(heroBox).not.toBeNull();
    expect(deckBox).not.toBeNull();
    expect(canvasBox).not.toBeNull();
    expect(themesBox).not.toBeNull();
    expect(cinematicBox).not.toBeNull();
    expect(cinematicHeadBox).not.toBeNull();
    expect(cinematicStageBox).not.toBeNull();

    expect(heroBox!.width).toBeGreaterThan(1000);
    expect(deckBox!.width).toBeGreaterThan(1000);
    expect(themesBox!.x).toBeGreaterThan(canvasBox!.x + 450);
    expect(cinematicBox!.width).toBeGreaterThan(1000);
    expect(cinematicStageBox!.x).toBeGreaterThan(cinematicHeadBox!.x + 300);
    expect(cinematicStageBox!.height).toBeGreaterThan(650);

    const overflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
