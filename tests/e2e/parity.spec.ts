import { expect, test } from "@playwright/test";

const onePixelPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

test.describe("reverse-engineering parity browser matrix", () => {
  test("legacy occasion query parameters cannot reintroduce the old dashboard shell", async ({ page }) => {
    await page.goto("/create?mode=anniversary&demo=1");
    await expect(page.getByRole("heading", { name: "Your chats already contain a story." })).toBeVisible();
    await expect(page.locator("#results")).toHaveCount(0);
    await expect(page.locator(".mc-story-deck")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Choose a chat export" })).toBeVisible();
  });

  test("Telegram single-chat JSON imports locally into the same 12-chapter story", async ({ page }) => {
    await page.goto("/create");
    const messages = Array.from({ length: 6 }, (_, index) => ({ type: "message", date: `2026-08-0${index + 1}T12:00:00`, from: index % 2 ? "Telegram A" : "Telegram B", text: index < 3 ? `tiny dragon club forever ${index}` : `ordinary local message ${index}` }));
    await page.getByLabel(/Choose WhatsApp text export or Telegram JSON export/i).setInputFiles({ name: "result.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ messages })) });
    await expect(page.getByLabel("Chapter 1 of 12")).toBeVisible();
    const card = page.getByTestId("threadtales-story-card");
    await expect(card).toContainText("Telegram A");
    await expect(card).not.toContainText("tiny dragon club forever");
    await page.keyboard.press("ArrowRight");
    await expect(card).toHaveAttribute("data-kind", "beginning");
    await page.keyboard.press("ArrowRight");
    await expect(card).toHaveAttribute("data-kind", "scale");
    await expect(card).toContainText("active days");
  });

  test("source-first artifact controls replace theme and cinematic workbench controls", async ({ page }) => {
    await page.goto("/create");
    await page.getByRole("button", { name: "See a demo first →" }).click();
    await expect(page.getByLabel("Chapter 1 of 12")).toBeVisible();
    await expect(page.getByRole("button", { name: "Share" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save card" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Next chapter" })).toBeVisible();
    await expect(page.getByLabel("Theme")).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Cinematic story playback" })).toHaveCount(0);
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
    await expect(page.getByRole("heading", { name: "Remembering Milo Photo Test" }).first()).toBeVisible();
  });
});
