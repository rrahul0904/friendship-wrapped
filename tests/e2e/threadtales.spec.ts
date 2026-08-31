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

test("free ThreadTales story deck supports chapter navigation and export controls", async ({ page }) => {
  await page.goto("/create?demo=1");
  await expect(page.locator("#results")).toBeVisible();
  const deck = page.getByRole("region", { name: /story chapters/i });
  await expect(deck).toBeVisible();
  await expect(deck.getByRole("button", { name: "Download PNG" })).toBeVisible();
  const firstTitle = await deck.locator(".chapter-preview h3").textContent();
  await deck.getByRole("button", { name: /Next/ }).click();
  await expect(deck.locator(".chapter-preview h3")).not.toHaveText(firstTitle ?? "");
});

test("anniversary occasion activates the anniversary story mode", async ({ page }) => {
  await page.goto("/occasions");
  await page.getByRole("link", { name: /Your anniversary story/i }).click();
  await expect(page).toHaveURL(/\/occasions\/anniversary$/);
  await page.getByRole("link", { name: /Try with demo data/i }).click();
  await expect(page).toHaveURL(/\/create\?mode=anniversary&demo=1/);
  await expect(page.locator("#results")).toBeVisible();
  await expect(page.getByRole("region", { name: /Anniversary story chapters/i })).toBeVisible();
});

test("premium remains gracefully unavailable when Stripe is not configured", async ({ page }) => {
  await page.goto("/create?demo=1");
  await expect(page.locator("#results")).toBeVisible();
  await page.getByRole("button", { name: "Unlock premium" }).click();
  await expect(page.getByText(/STRIPE_PRICE_THREADTALES_PREMIUM is not configured|Checkout is unavailable/i)).toBeVisible();
  await expect(page.locator("#results")).toBeVisible();
});

test("MyYear builds a deterministic recap from a manual highlight", async ({ page }) => {
  await page.goto("/products/myyear");
  await page.getByLabel("Year title").fill("My Test Year");
  await page.getByLabel("MyYear moment title").fill("First test moment");
  await page.getByLabel("MyYear moment date").fill("2026-08-20");
  await page.getByRole("button", { name: "Add moment" }).click();
  await expect(page.getByLabel("MyYear timeline").getByText("First test moment")).toBeVisible();
  await expect(page.getByRole("region", { name: "MyYear story chapters" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download 9:16 card" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy safe share summary" })).toBeVisible();
});

test("PetLife creates a local pet timeline, recap, and supports deletion", async ({ page }) => {
  await page.goto("/products/petlife");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.getByLabel("Pet name").fill("Milo Test");
  await page.getByLabel("Pet species").fill("Dog");
  await page.getByRole("button", { name: "Create pet" }).click();

  await page.getByLabel("Pet memory title").fill("First park day");
  await page.getByLabel("Pet memory date").fill("2026-08-20");
  await page.getByRole("button", { name: "Add to timeline" }).click();
  await expect(page.getByLabel("PetLife timeline").getByText("First park day")).toBeVisible();
  await expect(page.getByRole("region", { name: "PetLife annual recap" })).toBeVisible();

  await page.getByLabel("Type").selectOption("milestone");
  await page.getByLabel("Pet memory title").fill("Adoption anniversary");
  await page.getByLabel("Pet memory date").fill("2026-08-21");
  await page.getByRole("button", { name: "Add to timeline" }).click();
  await expect(page.getByLabel("PetLife timeline").getByText("Adoption anniversary")).toBeVisible();

  const timeline = page.getByLabel("PetLife timeline");
  await timeline.getByRole("button", { name: "Delete" }).first().click();
  await expect(timeline.getByRole("button", { name: "Delete" })).toHaveCount(1);
});

test("AI enrichment is gracefully disabled without credentials", async ({ page }) => {
  await page.goto("/create?demo=1");
  await expect(page.locator("#results")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Deterministic story mode is active." })).toBeVisible();
  await expect(page.getByText(/AI enrichment is not configured/i)).toBeVisible();
});

test("cloud save and household collaboration remain safely disabled without Supabase", async ({ page }) => {
  await page.goto("/create?demo=1");
  await expect(page.locator("#results")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Local mode is active." })).toBeVisible();

  await page.goto("/products/petlife");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.getByLabel("Pet name").fill("Cloudless Pet");
  await page.getByRole("button", { name: "Create pet" }).click();
  await expect(page.getByText(/dedicated Supabase project has not been configured/i)).toBeVisible();
});
