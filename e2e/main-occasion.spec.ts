import type { Page } from "@playwright/test";
import { expect, memoryTitlePage, seedMemories, test } from "./fixtures";

/** The Memory's entry on the Timeline. */
const timelineEntry = (page: Page, title: string) => page.getByRole("link").filter({ hasText: title });

test("the Curator picks a Main occasion when a Memory has two or more, and it sets the Memory's Theme", async ({
  pageWithSession: page,
}) => {
  await seedMemories(
    [
      {
        id: "inverno",
        title: "Natale e Capodanno",
        cities: ["Torino"],
        startDay: "2025-12-24",
        endDay: "2026-01-02",
        oneOffOccasions: [{ id: "pranzo", name: "Pranzo dai nonni", day: "2025-12-26" }],
      },
      { id: "estate", title: "Estate al mare", cities: ["Bari"], startDay: "2025-08-01", endDay: "2025-08-05" },
      { id: "febbraio", title: "Febbraio a Roma", cities: ["Roma"], startDay: "2025-02-13", endDay: "2025-02-15" },
    ],
    [
      { id: "natale", name: "Natale", month: 12, day: 25, theme: "natale" },
      { id: "capodanno", name: "Capodanno", month: 1, day: 1, theme: "capodanno" },
      { id: "valentino", name: "San Valentino", month: 2, day: 14, theme: "san-valentino" },
    ],
  );

  // No selector with fewer than two Occasions; the one themed Occasion still sets the Theme.
  for (const id of ["estate", "febbraio"]) {
    await page.goto(`/admin/memories/${id}`);
    await expect(page.getByRole("heading", { name: "Modifica ricordo" })).toBeVisible();
    await expect(page.getByLabel("Occasione principale")).toHaveCount(0);
  }
  await page.goto("/");
  await expect(timelineEntry(page, "Estate al mare")).toHaveAttribute("data-theme", "neutro");
  await expect(timelineEntry(page, "Febbraio a Roma")).toHaveAttribute("data-theme", "san-valentino");

  // Automatic: the first non-Neutro Occasion by day.
  await expect(timelineEntry(page, "Natale e Capodanno")).toHaveAttribute("data-theme", "natale");
  await page.goto("/memories/inverno");
  await expect(memoryTitlePage(page)).toHaveAttribute("data-theme", "natale");

  await page.goto("/admin/memories/inverno");
  const main = page.getByLabel("Occasione principale");
  await expect(main).toHaveValue("");
  await expect(main.getByRole("option")).toHaveText(["Automatica", "Natale", "Pranzo dai nonni", "Capodanno"]);

  await main.selectOption({ label: "Capodanno" });
  await expect(page.getByText("Occasione principale salvata.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Occasione principale")).toHaveValue("yearly:capodanno");

  await page.goto("/");
  await expect(timelineEntry(page, "Natale e Capodanno")).toHaveAttribute("data-theme", "capodanno");
  await page.goto("/memories/inverno");
  await expect(memoryTitlePage(page)).toHaveAttribute("data-theme", "capodanno");

  // Back to automatic.
  await page.goto("/admin/memories/inverno");
  await page.getByLabel("Occasione principale").selectOption({ label: "Automatica" });
  await expect(page.getByText("Occasione principale salvata.")).toBeVisible();
  await page.goto("/memories/inverno");
  await expect(memoryTitlePage(page)).toHaveAttribute("data-theme", "natale");
});
