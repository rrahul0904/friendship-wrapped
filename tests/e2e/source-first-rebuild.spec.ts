import { expect, test } from "@playwright/test";

const pairChat = [
  "2/3/2026, 9:10 AM - Maya: hello from the sentinel friendship",
  "2/3/2026, 9:11 AM - Jordan: hi",
  "2/3/2026, 9:13 AM - Maya: coffee later?",
  "2/3/2026, 9:15 AM - Jordan: absolutely 😂",
  "2/3/2026, 10:20 AM - Maya: perfect ❤️",
  "2/4/2026, 8:01 AM - Jordan: morning",
  "2/4/2026, 8:07 AM - Maya: morning!",
].join("\n");

const groupChat = [
  "2/3/2026, 9:10 AM - Maya: group hello",
  "2/3/2026, 9:11 AM - Jordan: hi",
  "2/3/2026, 9:12 AM - Sam: made it",
  "2/3/2026, 9:13 AM - Maya: dinner?",
  "2/3/2026, 9:14 AM - Jordan: yes",
  "2/3/2026, 9:15 AM - Sam: yes 😂",
].join("\n");

test("greenfield rebuild enters a twelve-beat story directly from the demo", async ({ page }) => {
  await page.goto("/rebuild");
  await expect(page.getByRole("heading", { name: "Your chats already contain a story." })).toBeVisible();
  await page.getByRole("button", { name: "See a demo story" }).click();
  await expect(page.getByLabel("Chapter 1 of 12")).toBeVisible();
  await expect(page.getByRole("button", { name: "Next chapter" })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("Where it starts")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("The scale")).toBeVisible();
});

test("pair and group exports produce different editorial structures", async ({ page }) => {
  await page.goto("/rebuild");
  await page.locator('input[type="file"]').setInputFiles({ name: "pair.txt", mimeType: "text/plain", buffer: Buffer.from(pairChat) });
  await expect(page.getByRole("heading", { name: "This is the story you kept writing." })).toBeVisible();
  await expect(page.getByLabel("Chapter 1 of 12")).toBeVisible();

  await page.goto("/rebuild");
  await page.locator('input[type="file"]').setInputFiles({ name: "group.txt", mimeType: "text/plain", buffer: Buffer.from(groupChat) });
  await expect(page.getByRole("heading", { name: "This group built a history." })).toBeVisible();
  await expect(page.getByLabel("Chapter 1 of 12")).toBeVisible();
  await page.keyboard.press("End");
  await expect(page.getByText("Same room. Different eras. Still here.")).toBeVisible();
});

test("raw chat upload does not create an API transmission", async ({ page }) => {
  const outbound: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET" && request.method() !== "HEAD") outbound.push(`${request.method()} ${request.url()} ${request.postData() ?? ""}`);
  });
  await page.goto("/rebuild");
  await page.locator('input[type="file"]').setInputFiles({ name: "pair.txt", mimeType: "text/plain", buffer: Buffer.from(pairChat) });
  await expect(page.getByRole("heading", { name: "This is the story you kept writing." })).toBeVisible();
  expect(outbound.join("\n")).not.toContain("sentinel friendship");
  expect(outbound.filter((entry) => entry.includes("/api/"))).toEqual([]);
});
