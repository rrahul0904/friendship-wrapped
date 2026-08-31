import path from "node:path";
import { expect, test } from "@playwright/test";
import { makeSyntheticChat } from "../helpers/synthetic-chat";

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

test("demo mode produces a worker-backed results story", async ({ page }) => {
  await page.goto("/create?demo=1");
  await expect(page.locator("#results")).toBeVisible();
  await expect(page.locator(".story-hero")).toContainText("420 messages");
});

test("synthetic WhatsApp fixture upload produces worker-backed results", async ({ page }) => {
  await uploadFixture(page);
  await expect(page.locator(".story-hero")).toContainText("5 messages");
  await expect(page.getByText("Maya Rose + Jordan Lee")).toBeVisible();
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

test("empty and insufficient chats show recoverable worker errors", async ({ page }) => {
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
  await expect(page.getByText(/local browser memory/i)).toBeVisible();
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

test("large analysis exposes a real processing status and completes", async ({ page }) => {
  await page.goto("/create");
  const raw = makeSyntheticChat({ messages: 30_000, participants: 4, seed: 11 });
  await page.getByLabel("Choose WhatsApp text export").setInputFiles({
    name: "large.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(raw),
  });
  await expect(page.getByRole("status")).toBeVisible();
  await expect(page.locator("#results")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".story-hero")).toContainText("30,000 messages");
});

test("a newer import supersedes an in-flight large analysis", async ({ page }) => {
  await page.goto("/create");
  const input = page.getByLabel("Choose WhatsApp text export");
  const raw = makeSyntheticChat({ messages: 75_000, participants: 4, seed: 12 });
  await input.setInputFiles({ name: "large.txt", mimeType: "text/plain", buffer: Buffer.from(raw) });
  await expect(page.getByRole("status")).toBeVisible();
  await input.setInputFiles(fixturePath);
  await expect(page.locator("#results")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".story-hero")).toContainText("5 messages");
  await expect(page.locator(".story-hero")).not.toContainText("75,000 messages");
});

test("reset cancels in-flight work and the analyzer can be used again", async ({ page }) => {
  await page.goto("/create");
  const input = page.getByLabel("Choose WhatsApp text export");
  const raw = makeSyntheticChat({ messages: 75_000, participants: 4, seed: 13 });
  await input.setInputFiles({ name: "large.txt", mimeType: "text/plain", buffer: Buffer.from(raw) });
  await expect(page.getByRole("button", { name: "Cancel analysis" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel analysis" }).click();
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(page.locator("#results")).toHaveCount(0);
  await input.setInputFiles(fixturePath);
  await expect(page.locator("#results")).toBeVisible({ timeout: 30_000 });
});

test("auto date detection works through the worker pipeline", async ({ page }) => {
  await page.goto("/create");
  const raw = [
    "13/02/2026, 09:10 - Alice: one",
    "13/02/2026, 09:11 - Bob: two",
    "13/02/2026, 09:12 - Alice: three",
    "14/02/2026, 09:13 - Bob: four",
    "14/02/2026, 09:14 - Alice: five",
  ].join("\n");
  await page.getByLabel("Choose WhatsApp text export").setInputFiles({
    name: "dmy.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(raw),
  });
  await expect(page.locator("#results")).toBeVisible();
  await expect(page.locator(".story-hero")).toContainText("5 messages");
});
