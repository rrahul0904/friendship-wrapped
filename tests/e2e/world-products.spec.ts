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
});
