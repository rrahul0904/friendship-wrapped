import { expect, test } from "@playwright/test";

test("MyYear selects and shows the newest available year when the current year has no memories", async ({ page }) => {
  await page.addInitScript(() => {
    const id = "historical-only-space";
    const createdAt = "2024-01-01T12:00:00.000Z";
    window.localStorage.setItem("threadtales:memory-space-index:v1", JSON.stringify([id]));
    window.localStorage.setItem(`threadtales:memory-space:v1:${id}`, JSON.stringify({
      schemaVersion: 1,
      id,
      name: "Family archive",
      subjectType: "FAMILY",
      productTemplate: "MEMORY_KEEPER",
      createdAt,
      updatedAt: createdAt,
    }));
    window.localStorage.setItem(`threadtales:memory-graph:v1:${id}`, JSON.stringify({
      schemaVersion: 1,
      memorySpaceId: id,
      updatedAt: createdAt,
      nodes: [{
        schemaVersion: 1,
        id: "historical-memory",
        memorySpaceId: id,
        kind: "MANUAL_MEMORY",
        title: "The lake house weekend",
        summary: "Three generations cooked dinner together.",
        occurredAt: Date.parse("2024-07-18T12:00:00.000Z"),
        source: "MANUAL",
        facts: {},
        approvedAt: createdAt,
      }],
    }));
  });

  await page.goto("/myyear");

  const yearSelect = page.getByRole("combobox", { name: "Year" });
  await expect(yearSelect).toHaveValue("2024");
  await expect(page.getByLabel("2024 shared memories")).toContainText("The lake house weekend");
  await expect(page.getByText("No approved memories with dates in 2024 yet.")).toHaveCount(0);
});
