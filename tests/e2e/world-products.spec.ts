import { expect, test } from "@playwright/test";

const worlds = [
  ["relationship", "Relationship Universe"],
  ["lifemap", "LifeMap"],
  ["babystory", "BabyStory"],
  ["homestory", "HomeStory"],
  ["familytree", "FamilyTree Live"],
  ["founderworld", "FounderWorld"],
  ["creatorworld", "CreatorWorld"],
] as const;

test.describe("local-first story worlds", () => {
  for (const [slug, eyebrow] of worlds) {
    test(`${slug} supports create, edit, export and reset without an account`, async ({ page }) => {
      await page.goto(`/products/${slug}`);
      await page.getByLabel(`${eyebrow} event title`).fill("A private test milestone");
      await page.getByRole("button", { name: "Add to world" }).click();
      await expect(page.getByLabel(`${eyebrow} world story`)).toBeVisible();
      await page.getByRole("button", { name: "Edit" }).click();
      await page.getByLabel(`${eyebrow} event title`).fill("An edited local milestone");
      await page.getByRole("button", { name: "Save changes" }).click();
      await expect(page.getByText("An edited local milestone")).toBeVisible();
      const download = page.waitForEvent("download");
      await page.getByRole("button", { name: "Download local backup" }).click();
      await (await download).delete();
      page.once("dialog", (dialog) => dialog.accept());
      await page.getByRole("button", { name: "Delete world" }).click();
      await expect(page.getByText("The local world was deleted from this browser.")).toBeVisible();
    });
  }

  test("desktop world builder is a composed two-column workspace rather than a narrow form island", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/products/familytree");

    const workspace = page.locator("#familytree-builder .product-workspace");
    const cards = workspace.locator(":scope > .builder-card");
    await expect(workspace).toBeVisible();
    await expect(cards).toHaveCount(2);

    const workspaceBox = await workspace.boundingBox();
    const foundationBox = await cards.nth(0).boundingBox();
    const entryBox = await cards.nth(1).boundingBox();

    expect(workspaceBox).not.toBeNull();
    expect(foundationBox).not.toBeNull();
    expect(entryBox).not.toBeNull();
    expect(workspaceBox!.width).toBeGreaterThan(1000);
    expect(foundationBox!.width).toBeGreaterThan(300);
    expect(entryBox!.width).toBeGreaterThan(440);
    expect(foundationBox!.x).toBeLessThan(entryBox!.x);
    expect(Math.abs(foundationBox!.y - entryBox!.y)).toBeLessThan(10);

    await page.getByLabel("FamilyTree Live event title").fill("A family milestone");
    await page.getByRole("button", { name: "Add to world" }).click();

    const story = page.getByLabel("FamilyTree Live world story");
    const storyBox = await story.boundingBox();
    expect(storyBox).not.toBeNull();
    expect(storyBox!.width).toBeGreaterThan(1000);
    await expect(story.locator(".chapter-preview")).toBeVisible();
  });

  test("story world workspace collapses cleanly on mobile without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/products/founderworld");

    const workspace = page.locator("#founderworld-builder .product-workspace");
    const cards = workspace.locator(":scope > .builder-card");
    await expect(workspace).toBeVisible();
    await expect(cards).toHaveCount(2);

    const firstBox = await cards.nth(0).boundingBox();
    const secondBox = await cards.nth(1).boundingBox();
    expect(firstBox).not.toBeNull();
    expect(secondBox).not.toBeNull();
    expect(secondBox!.y).toBeGreaterThan(firstBox!.y);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
