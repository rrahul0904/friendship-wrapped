import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const fixturePath = path.resolve(process.cwd(), "tests/fixtures/whatsapp/android-mdy-12h.txt");

async function uploadFixture(page: Page) {
  await page.goto("/create");
  await page.getByLabel(/Choose WhatsApp text export or Telegram JSON export/i).setInputFiles(fixturePath);
  await expect(page.getByLabel("Chapter 1 of 12")).toBeVisible();
}

function appError(page: Page) {
  return page.getByRole("alert");
}

test("landing page primary CTA reaches create", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Your chats, turned into a story worth sharing/i })).toBeVisible();
  await page.getByRole("link", { name: /Create my ThreadTale/i }).first().click();
  await expect(page).toHaveURL(/\/create$/);
  await expect(page.getByRole("heading", { name: "Your chats already contain a story." })).toBeVisible();
});

test("demo enters the source-first reveal instead of an analytics dashboard", async ({ page }) => {
  await page.goto("/create");
  await page.getByRole("button", { name: "See a demo first →" }).click();
  await expect(page.getByText("Building your ThreadTale")).toBeVisible();
  await expect(page.getByLabel("Chapter 1 of 12")).toBeVisible();
  await expect(page.locator("#results")).toHaveCount(0);
  await expect(page.locator(".story-hero")).toHaveCount(0);
});

test("synthetic WhatsApp fixture upload produces a 12-chapter story", async ({ page }) => {
  await uploadFixture(page);
  const card = page.getByTestId("threadtales-story-card");
  await expect(card).toContainText("Maya Rose + Jordan Lee");
  await page.getByRole("button", { name: "Next chapter" }).click();
  await page.getByRole("button", { name: "Next chapter" }).click();
  await expect(card).toHaveAttribute("data-kind", "scale");
  await expect(card).toContainText("5");
});

test("invalid file type shows an actionable recoverable error", async ({ page }) => {
  await page.goto("/create");
  await page.getByLabel(/Choose WhatsApp text export or Telegram JSON export/i).setInputFiles({
    name: "chat.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("not really a chat"),
  });
  await expect(appError(page)).toContainText(/\.txt|\.json/i);
  await expect(page.getByRole("heading", { name: "Your chats already contain a story." })).toBeVisible();
});

test("empty and insufficient chats show recoverable errors", async ({ page }) => {
  await page.goto("/create");
  const input = page.getByLabel(/Choose WhatsApp text export or Telegram JSON export/i);

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
  await expect(page.getByRole("heading", { name: "Your chats already contain a story." })).toBeVisible();
});

test("closing keepsake can return to a reusable importer", async ({ page }) => {
  await uploadFixture(page);
  await page.keyboard.press("End");
  await expect(page.getByRole("button", { name: "Save keepsake" })).toBeVisible();
  await page.getByRole("button", { name: "Another chat" }).click();
  await expect(page.getByRole("button", { name: "Choose a chat export" })).toBeVisible();
  await page.getByLabel(/Choose WhatsApp text export or Telegram JSON export/i).setInputFiles(fixturePath);
  await expect(page.getByLabel("Chapter 1 of 12")).toBeVisible();
});

test("privacy page explains local-first processing and optional AI data boundaries", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByText(/Parsing and statistical analysis happen in local browser memory/i)).toBeVisible();
  await expect(page.getByText(/By default, the raw export and message history are not sent/i)).toBeVisible();
  await expect(page.getByText(/request to the configured provider contains allowlisted derived metrics and chapter-type labels/i)).toBeVisible();
  await expect(page.getByText(/consent to send that exact snippet/i)).toBeVisible();
});

test("source-first story supports chapter navigation and per-chapter artifact actions", async ({ page }) => {
  await uploadFixture(page);
  await expect(page.getByRole("navigation", { name: "Story controls" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Share" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save card" })).toBeVisible();
  const firstTitle = await page.getByTestId("threadtales-story-card").getByRole("heading").textContent();
  await page.getByRole("button", { name: "Next chapter" }).click();
  await expect(page.getByTestId("threadtales-story-card").getByRole("heading")).not.toHaveText(firstTitle ?? "");
});

test("occasion deep links resolve into the same source-first create journey", async ({ page }) => {
  await page.goto("/occasions");
  await page.getByRole("link", { name: /Your anniversary story/i }).click();
  await expect(page).toHaveURL(/\/occasions\/anniversary$/);
  await page.getByRole("link", { name: /Try with demo data/i }).click();
  await expect(page).toHaveURL(/\/create\?mode=anniversary&demo=1/);
  await expect(page.getByRole("heading", { name: "Your chats already contain a story." })).toBeVisible();
  await page.getByRole("button", { name: "See a demo first →" }).click();
  await expect(page.getByLabel("Chapter 1 of 12")).toBeVisible();
});

test("premium cloud and AI surfaces do not interrupt the first-session ThreadTales path", async ({ page }) => {
  await page.goto("/create");
  await expect(page.getByText(/Unlock premium/i)).toHaveCount(0);
  await expect(page.getByText(/Cloud save/i)).toHaveCount(0);
  await expect(page.getByText(/AI enrichment/i)).toHaveCount(0);
  await page.getByRole("button", { name: "See a demo first →" }).click();
  await expect(page.getByLabel("Chapter 1 of 12")).toBeVisible();
  await expect(page.getByText(/Unlock premium/i)).toHaveCount(0);
  await expect(page.getByText(/AI enrichment/i)).toHaveCount(0);
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

test("PetLife cloud collaboration remains safely disabled without Supabase", async ({ page }) => {
  await page.goto("/products/petlife");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.getByLabel("Pet name").fill("Cloudless Pet");
  await page.getByRole("button", { name: "Create pet" }).click();
  await expect(page.getByText(/dedicated Supabase project has not been configured/i)).toBeVisible();
});
