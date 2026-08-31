import path from "node:path";
import { expect, test } from "@playwright/test";

const fixturePath = path.resolve(process.cwd(), "tests/fixtures/whatsapp/android-mdy-12h.txt");

async function uploadFixture(page: import("@playwright/test").Page) {
  await page.goto("/create");
  await page.getByLabel("Choose WhatsApp text export").setInputFiles(fixturePath);
  await expect(page.locator("#results")).toBeVisible();
}

function appError(page: import("@playwright/test").Page) {
  return page.locator(".error[role='alert']");
}

test("landing page primary CTA reaches create", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Your chats, turned into a story worth sharing/i })).toBeVisible();
  await page.getByRole("link", { name: /Create my ThreadTale/i }).first().click();
  await expect(page).toHaveURL(/\/create$/);
});

test("demo mode produces a results story", async ({ page }) => {
  await page.goto("/create?demo=1");
  await expect(page.locator("#results")).toBeVisible();
  await expect(page.locator(".story-hero")).toContainText("420 messages");
});

test("synthetic WhatsApp fixture upload produces results", async ({ page }) => {
  await uploadFixture(page);
  const hero = page.locator(".story-hero");
  await expect(hero).toContainText("5 messages");
  await expect(hero.getByText(/Maya Rose \+ Jordan Lee/)).toBeVisible();
});

test("invalid file type shows an actionable recoverable error", async ({ page }) => {
  await page.goto("/create");
  await page.getByLabel("Choose WhatsApp text export").setInputFiles({
    name: "chat.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("not really a chat"),
  });
  await expect(appError(page)).toContainText(".txt");
  await expect(page.locator("#results")).toHaveCount(0);
});

test("empty and insufficient chats show recoverable errors", async ({ page }) => {
  await page.goto("/create");
  const input = page.getByLabel("Choose WhatsApp text export");

  await input.setInputFiles({ name: "empty.txt", mimeType: "text/plain", buffer: Buffer.from("   \n") });
  await expect(appError(page)).toContainText("empty");

  await input.setInputFiles({
    name: "short.txt",
    mimeType: "text/plain",
    buffer: Buffer.from([
      "2/3/2026, 9:10 AM - Maya: hello",
      "2/3/2026, 9:11 AM - Jordan: hi",
    ].join("\n")),
  });
  await expect(appError(page)).toContainText("only 2 supported messages");
  await expect(page.locator("#results")).toHaveCount(0);
});

test("a second failed import clears the previous result and the input is reusable", async ({ page }) => {
  await uploadFixture(page);
  const input = page.getByLabel("Choose WhatsApp text export");

  await input.setInputFiles({ name: "bad.txt", mimeType: "text/plain", buffer: Buffer.from("not a chat") });
  await expect(appError(page)).toContainText("only 0 supported messages");
  await expect(page.locator("#results")).toHaveCount(0);

  await input.setInputFiles(fixturePath);
  await expect(page.locator("#results")).toBeVisible();
});

test("privacy page states the implemented local-only free flow", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByText(/Parsing and statistical analysis happen in local browser memory/i)).toBeVisible();
  await expect(page.getByText(/does not send the raw file or message text/i)).toBeVisible();
});

test("share flow uses a derived-stat payload and renders an anonymous public story", async ({ page }) => {
  await uploadFixture(page);

  const shareUrl = await page.locator(".share-input").inputValue();
  expect(shareUrl).toContain("/share#");
  expect(shareUrl).not.toContain("Maya Rose");
  expect(shareUrl).not.toContain("Morning");

  await page.goto(shareUrl);
  await expect(page.locator(".story-hero")).toContainText("A ThreadTale");
  await expect(page.locator(".story-hero")).toContainText("Person 1 + Person 2");
});
