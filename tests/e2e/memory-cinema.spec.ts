import { expect, test } from "@playwright/test";

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
});
