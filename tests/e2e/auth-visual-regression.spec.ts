import { expect, test } from "@playwright/test";

test("auth routes render the designed shell instead of browser-default HTML", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/login");

  const shell = page.locator(".saas-auth-page");
  const card = page.locator(".saas-auth-card");
  const visual = page.locator(".saas-auth-visual");
  const password = page.locator('input[name="password"]');

  await expect(shell).toBeVisible();
  await expect(card).toBeVisible();
  await expect(visual).toBeVisible();

  const shellDisplay = await shell.evaluate((node) => getComputedStyle(node).display);
  const cardBox = await card.boundingBox();
  const visualBox = await visual.boundingBox();
  const inputBox = await password.boundingBox();
  const radius = await card.evaluate((node) => parseFloat(getComputedStyle(node).borderRadius));
  const visualBackground = await visual.evaluate((node) => getComputedStyle(node).backgroundImage);

  expect(shellDisplay).toBe("grid");
  expect(cardBox?.width ?? 0).toBeGreaterThan(420);
  expect(visualBox?.width ?? 0).toBeGreaterThan(420);
  expect(inputBox?.height ?? 0).toBeGreaterThanOrEqual(48);
  expect(radius).toBeGreaterThanOrEqual(24);
  expect(visualBackground).not.toBe("none");
});

test("auth shell remains intentional and overflow-free on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/register");

  await expect(page.getByRole("heading", { name: "Create your memory vault" })).toBeVisible();
  const card = page.locator(".saas-auth-card");
  const box = await card.boundingBox();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

  expect(box?.width ?? 0).toBeGreaterThan(340);
  expect(box?.width ?? 9999).toBeLessThanOrEqual(390);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("onboarding has a real responsive card and selectable interest grid", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/onboarding");

  const section = page.locator(".saas-onboarding > section");
  const grid = page.locator(".saas-interest-grid");
  await expect(section).toBeVisible();
  await expect(grid).toBeVisible();

  const sectionBox = await section.boundingBox();
  const columns = await grid.evaluate((node) => getComputedStyle(node).gridTemplateColumns);

  expect(sectionBox?.width ?? 0).toBeGreaterThan(700);
  expect(columns.split(" ").length).toBe(2);

  const choice = page.getByRole("button", { name: "Friendships" });
  await choice.click();
  await expect(choice).toHaveClass(/selected/);
});
