import { expect, test, type Page } from "@playwright/test";

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

async function openPair(page: Page) {
  await page.goto("/create");
  await page.locator('input[type="file"]').setInputFiles({ name: "pair.txt", mimeType: "text/plain", buffer: Buffer.from(pairChat) });
  await expect(page.getByRole("heading", { name: "This is the story you kept writing." })).toBeVisible();
}

test("/create is the source-first ThreadTales entry and demo reveals the real story", async ({ page }) => {
  await page.goto("/create");
  await expect(page.getByRole("heading", { name: "Your chats already contain a story." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Choose a chat export" })).toBeVisible();
  await expect(page.getByText("Processed on this device")).toBeVisible();
  await page.getByRole("button", { name: "See a demo first →" }).click();
  await expect(page.getByText("Building your ThreadTale")).toBeVisible();
  await expect(page.getByLabel("Chapter 1 of 12")).toBeVisible();
  await expect(page.getByRole("button", { name: "Next chapter" })).toBeVisible();
  await page.getByTestId("threadtales-story-card").click();
  await expect(page.getByText("Where it starts")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("The scale")).toBeVisible();
});

test("pair and group exports keep different editorial structures and end in a keepsake", async ({ page }) => {
  await openPair(page);
  await expect(page.getByLabel("Chapter 1 of 12")).toBeVisible();
  await page.keyboard.press("End");
  await expect(page.getByText("Still talking. That is the whole point.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save keepsake" })).toBeVisible();

  await page.goto("/create");
  await page.locator('input[type="file"]').setInputFiles({ name: "group.txt", mimeType: "text/plain", buffer: Buffer.from(groupChat) });
  await expect(page.getByRole("heading", { name: "This group built a history." })).toBeVisible();
  await expect(page.getByLabel("Chapter 1 of 12")).toBeVisible();
  await page.keyboard.press("End");
  await expect(page.getByText("Same room. Different eras. Still here.")).toBeVisible();
  await expect(page.getByText(/messages$/).first()).toBeVisible();
});

test("mobile create keeps the 9:16 story and controls inside the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/create");
  await page.getByRole("button", { name: "See a demo first →" }).click();
  await expect(page.getByLabel("Chapter 1 of 12")).toBeVisible();
  const card = page.getByTestId("threadtales-story-card");
  const box = await card.boundingBox();
  expect(box).not.toBeNull();
  expect((box?.x ?? 0) >= 0).toBeTruthy();
  expect((box?.x ?? 0) + (box?.width ?? 0) <= 390).toBeTruthy();
  expect((box?.y ?? 0) + (box?.height ?? 0) <= 844).toBeTruthy();
  await expect(page.getByRole("button", { name: "Next chapter" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("create honors reduced motion while preserving story navigation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/create");
  await page.getByRole("button", { name: "See a demo first →" }).click();
  const card = page.getByTestId("threadtales-story-card");
  await expect(card).toBeVisible();
  expect(await card.evaluate((element) => getComputedStyle(element).transitionDuration)).toBe("0s");
  await page.getByRole("button", { name: "Next chapter" }).click();
  await expect(page.getByText("Where it starts")).toBeVisible();
});

test("share sends a portable visual PNG when file sharing is supported", async ({ page }) => {
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
  await openPair(page);
  await page.getByRole("button", { name: "Share" }).click();
  await expect(page.getByText("Share sheet opened with your keepsake image.")).toBeVisible();
  const receipt = await page.evaluate(() => JSON.parse(sessionStorage.getItem("threadtales-share-receipt") ?? "{}"));
  expect(receipt.fileCount).toBe(1);
  expect(receipt.name).toBe("threadtales-1.png");
  expect(receipt.type).toBe("image/png");
  expect(receipt.size).toBeGreaterThan(1000);
  expect(receipt.text).not.toContain("sentinel friendship");
});

test("raw chat remains local on the primary create route", async ({ page }) => {
  const outbound: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET" && request.method() !== "HEAD") outbound.push(`${request.method()} ${request.url()} ${request.postData() ?? ""}`);
  });
  await openPair(page);
  expect(outbound.join("\n")).not.toContain("sentinel friendship");
  expect(outbound.filter((entry) => entry.includes("/api/"))).toEqual([]);
});

test("/rebuild remains an alias for source-first review links", async ({ page }) => {
  await page.goto("/rebuild");
  await expect(page.getByRole("heading", { name: "Your chats already contain a story." })).toBeVisible();
});
