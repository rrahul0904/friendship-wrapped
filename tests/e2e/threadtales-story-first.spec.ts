import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const fixturePath = path.resolve(process.cwd(), "tests/fixtures/whatsapp/android-mdy-12h.txt");

async function openDemo(page: Page) {
  await page.goto("/create?demo=1");
  await expect(page.locator("#results")).toBeVisible();
  await expect(page.getByRole("region", { name: /story chapters/i })).toBeVisible();
}

async function expectVerticalStory(page: Page) {
  const box = await page.locator(".chapter-preview[data-story-aspect='9:16']").boundingBox();
  expect(box).not.toBeNull();
  const ratio = (box?.width ?? 0) / (box?.height ?? 1);
  expect(ratio).toBeGreaterThan(0.54);
  expect(ratio).toBeLessThan(0.585);
}

test("desktop create reveals the 9:16 story first and supports keyboard chapter navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await openDemo(page);

  await expect(page.locator(".story-grid")).toHaveCount(0);
  await expect(page.locator(".mc-cinematic")).toHaveCount(0);
  await expectVerticalStory(page);

  const viewer = page.getByLabel("Story chapter viewer");
  await viewer.focus();
  await expect(viewer).toHaveAttribute("data-active-chapter", "1");
  await page.keyboard.press("ArrowRight");
  await expect(viewer).toHaveAttribute("data-active-chapter", "2");
  await page.keyboard.press("End");
  const progress = page.locator(".mc-story-progress button");
  await expect(viewer).toHaveAttribute("data-active-chapter", String(await progress.count()));
  await page.keyboard.press("Home");
  await expect(viewer).toHaveAttribute("data-active-chapter", "1");
});

test.describe("mobile story reveal", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("keeps the primary deck vertical without horizontal overflow", async ({ page }) => {
    await openDemo(page);
    await expectVerticalStory(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    const deck = page.getByRole("region", { name: /story chapters/i });
    const firstTitle = await deck.locator(".chapter-preview h3").textContent();
    await deck.getByRole("button", { name: /Next/ }).click();
    await expect(deck.locator(".chapter-preview h3")).not.toHaveText(firstTitle ?? "");
  });
});

test("reduced-motion preference removes reveal animation and transition timing", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openDemo(page);
  const motion = await page.locator(".chapter-preview").evaluate((element) => {
    const style = getComputedStyle(element);
    return { animationDuration: style.animationDuration, transitionDuration: style.transitionDuration };
  });
  expect(motion.animationDuration).toBe("0s");
  expect(motion.transitionDuration).toBe("0s");
});

test("every active chapter keeps download and share actions available", async ({ page }) => {
  await openDemo(page);
  const deck = page.getByRole("region", { name: /story chapters/i });
  await expect(deck.getByRole("button", { name: "Download PNG" })).toBeVisible();
  await expect(deck.getByRole("button", { name: "Share card" })).toBeVisible();

  const download = page.waitForEvent("download");
  await deck.getByRole("button", { name: "Download PNG" }).click();
  expect((await download).suggestedFilename()).toMatch(/^threadtales-.*-vertical\.png$/);

  const shareFallback = page.waitForEvent("download");
  await deck.getByRole("button", { name: "Share card" }).click();
  expect((await shareFallback).suggestedFilename()).toMatch(/^threadtales-.*-vertical\.png$/);
  await expect(page.getByRole("status")).toContainText("downloaded instead");
});

test("raw uploaded chat text never appears in a network request", async ({ page }) => {
  const marker = "RAW_CHAT_NETWORK_SENTINEL_20";
  const outbound: string[] = [];
  page.on("request", (request) => {
    outbound.push(`${request.url()}\n${request.postData() ?? ""}`);
  });

  await page.goto("/create");
  const rawChat = [
    `2/3/2026, 9:10 AM - Maya: ${marker} one`,
    `2/3/2026, 9:11 AM - Jordan: ${marker} two`,
    `2/3/2026, 9:12 AM - Maya: ${marker} three`,
    `2/3/2026, 9:13 AM - Jordan: ${marker} four`,
    `2/3/2026, 9:14 AM - Maya: ${marker} five`,
  ].join("\n");
  await page.getByLabel("Choose WhatsApp text export or Telegram JSON export").setInputFiles({ name: "privacy.txt", mimeType: "text/plain", buffer: Buffer.from(rawChat) });
  await expect(page.getByRole("region", { name: /story chapters/i })).toBeVisible();

  expect(outbound.join("\n")).not.toContain(marker);
});

test("fixture import skips the analytics dashboard and enters the deterministic deck", async ({ page }) => {
  await page.goto("/create");
  await page.getByLabel("Choose WhatsApp text export or Telegram JSON export").setInputFiles(fixturePath);
  const deck = page.getByRole("region", { name: /story chapters/i });
  await expect(deck).toBeVisible();
  await expect(page.locator(".story-grid")).toHaveCount(0);
  await deck.getByRole("button", { name: "Open chapter 3" }).click();
  await expect(deck.locator(".chapter-preview")).toContainText("5");
  await expect(deck.locator(".chapter-preview")).toContainText("messages");
});
