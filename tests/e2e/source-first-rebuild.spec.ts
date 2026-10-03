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

test("mobile rebuild keeps the 9:16 story and controls inside the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/rebuild");
  await page.getByRole("button", { name: "See a demo story" }).click();
  await expect(page.getByLabel("Chapter 1 of 12")).toBeVisible();
  const card = page.locator('section[aria-live="polite"]');
  const box = await card.boundingBox();
  expect(box).not.toBeNull();
  expect((box?.x ?? 0) >= 0).toBeTruthy();
  expect((box?.x ?? 0) + (box?.width ?? 0) <= 390).toBeTruthy();
  expect((box?.y ?? 0) + (box?.height ?? 0) <= 844).toBeTruthy();
  await expect(page.getByRole("button", { name: "Next chapter" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("rebuild honors reduced motion while preserving story navigation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/rebuild");
  await page.getByRole("button", { name: "See a demo story" }).click();
  const card = page.locator('section[aria-live="polite"]');
  await expect(card).toBeVisible();
  expect(await card.evaluate((element) => getComputedStyle(element).transitionDuration)).toBe("0s");
  await page.getByRole("button", { name: "Next chapter" }).click();
  await expect(page.getByText("Where it starts")).toBeVisible();
});

test("share sends the visual keepsake file when the device supports file sharing", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", { configurable: true, value: (data: ShareData) => Boolean(data.files?.length) });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data: ShareData) => {
        const first = data.files?.[0];
        sessionStorage.setItem("threadtales-share-receipt", JSON.stringify({
          fileCount: data.files?.length ?? 0,
          name: first?.name ?? "",
          type: first?.type ?? "",
          size: first?.size ?? 0,
          text: data.text ?? ""
        }));
      }
    });
  });
  await page.goto("/rebuild");
  await page.locator('input[type="file"]').setInputFiles({ name: "pair.txt", mimeType: "text/plain", buffer: Buffer.from(pairChat) });
  await expect(page.getByRole("heading", { name: "This is the story you kept writing." })).toBeVisible();
  await page.getByRole("button", { name: "Share" }).click();
  const receipt = await page.evaluate(() => JSON.parse(sessionStorage.getItem("threadtales-share-receipt") ?? "{}"));
  expect(receipt.fileCount).toBe(1);
  expect(receipt.name).toBe("threadtales-1.svg");
  expect(receipt.type).toBe("image/svg+xml");
  expect(receipt.size).toBeGreaterThan(500);
  expect(receipt.text).not.toContain("sentinel friendship");
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
