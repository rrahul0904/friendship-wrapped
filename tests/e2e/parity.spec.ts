import { expect, test } from "@playwright/test";

const modes = [
  ["friends", "Best friends"], ["couple", "Couple"], ["siblings", "Siblings"], ["family", "Family"], ["group", "Group chat"], ["birthday", "Birthday"], ["anniversary", "Anniversary"], ["long-distance", "Long distance"], ["graduation", "Graduation / group"], ["year-together", "Year together"],
] as const;

const onePixelPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

test.describe("reverse-engineering parity browser matrix", () => {
  for (const [mode, label] of modes) {
    test(`${mode} story mode renders its deterministic chapter deck`, async ({ page }) => {
      await page.goto(`/create?mode=${mode}&demo=1`);
      await expect(page.locator("#results")).toBeVisible();
      const deck = page.getByRole("region", { name: new RegExp(`${label} story chapters`, "i") });
      await expect(deck).toBeVisible();
      await expect(deck.locator(".chapter-preview h3")).toBeVisible();
      await expect(deck.getByRole("button", { name: "Download PNG" })).toBeVisible();
    });
  }

  test("Telegram single-chat JSON imports locally and produces lore without changing the share boundary", async ({ page }) => {
    await page.goto("/create");
    const messages = Array.from({ length: 6 }, (_, index) => ({ type: "message", date: `2026-08-0${index + 1}T12:00:00`, from: index % 2 ? "Telegram A" : "Telegram B", text: index < 3 ? `tiny dragon club forever ${index}` : `ordinary local message ${index}` }));
    await page.getByLabel(/Choose WhatsApp text export or Telegram JSON export/i).setInputFiles({ name: "result.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ messages })) });
    await expect(page.locator("#results")).toBeVisible();
    await expect(page.locator(".story-hero")).toContainText("6 messages");
    await expect(page.getByRole("region", { name: "Local-only chat lore" })).toBeVisible();
    const shareUrl = await page.locator(".share-panel .share-input[readonly]").inputValue();
    expect(shareUrl).not.toContain("tiny dragon club forever");
  });

  test("story parity controls expose 4:5, themes, safe story set and accessible cinematic playback", async ({ page }) => {
    await page.goto("/create?demo=1");
    const deck = page.getByRole("region", { name: /story chapters/i });
    await expect(deck.getByLabel("Export")).toContainText("4:5 portrait");
    await expect(deck.getByLabel("Theme")).toContainText("Midnight");
    await expect(deck.getByLabel("Theme")).toContainText("Sunset");
    await expect(deck.getByRole("button", { name: "Share card" })).toBeVisible();
    await expect(deck.getByRole("button", { name: "Download safe story set" })).toBeVisible();
    const player = page.getByRole("region", { name: "Cinematic story playback" });
    await expect(player.getByRole("button", { name: "Play" })).toBeVisible();
    await expect(player.getByRole("button", { name: "Replay" })).toBeVisible();
  });

  test("MyYear photo bytes remain session-local while previews enrich the experience", async ({ page }) => {
    await page.goto("/products/myyear");
    await page.getByLabel("Year title").fill("Photo Test Year");
    await page.getByLabel("MyYear moment title").fill("Photo memory");
    await page.getByLabel("MyYear moment date").fill("2026-08-20");
    await page.getByLabel("Choose MyYear photos").setInputFiles({ name: "private-photo.png", mimeType: "image/png", buffer: onePixelPng });
    await expect(page.getByLabel("MyYear selected photo previews").locator("img")).toHaveCount(1);
    await page.getByRole("button", { name: "Add moment" }).click();
    await expect(page.getByLabel("MyYear timeline").locator("img")).toHaveCount(1);
    await expect(page.getByRole("region", { name: "MyYear story chapters" }).locator(".story-local-photo")).toBeVisible();
  });

  test("PetLife keeps image bytes out of localStorage and memorial mode is explicit", async ({ page }) => {
    await page.goto("/products/petlife");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await page.getByLabel("Pet name").fill("Milo Photo Test");
    await page.getByRole("button", { name: "Create pet" }).click();
    await page.getByLabel("Pet memory title").fill("Photo park day");
    await page.getByLabel("Pet memory date").fill("2026-08-20");
    await page.getByLabel("Choose PetLife photos").setInputFiles({ name: "private-pet-photo.png", mimeType: "image/png", buffer: onePixelPng });
    await expect(page.getByLabel("PetLife selected photo previews").locator("img")).toHaveCount(1);
    await page.getByRole("button", { name: "Add to timeline" }).click();
    await expect(page.getByLabel("PetLife timeline").locator("img")).toHaveCount(1);
    const local = await page.evaluate(() => window.localStorage.getItem("story-platform:petlife:v1") ?? "");
    expect(local).not.toContain("private-pet-photo.png");
    expect(local).not.toContain("blob:");
    await page.getByLabel(/Memorial mode/i).check();
    await expect(page.getByRole("heading", { name: "Remembering Milo Photo Test" })).toBeVisible();
  });
});
