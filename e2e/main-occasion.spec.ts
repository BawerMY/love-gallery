import type { Page } from "@playwright/test";
import { expect, memoryTitlePage, seedMemories, test } from "./fixtures";

/** The Memory's entry on the Timeline. */
const timelineEntry = (page: Page, title: string) => page.getByRole("link").filter({ hasText: title });

test("the Curator picks a Main occasion when a Memory has two or more non-Neutro Occasions, and it sets the Memory's Theme", async ({
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
        occasionIds: ["pranzo", "natale", "capodanno"],
      },
      // One themed and one Neutro Occasion: no real choice.
      {
        id: "febbraio",
        title: "Febbraio a Roma",
        cities: ["Roma"],
        startDay: "2025-02-13",
        endDay: "2025-02-15",
        occasionIds: ["pranzo", "valentino"],
      },
      { id: "estate", title: "Estate al mare", cities: ["Bari"], startDay: "2025-08-01", endDay: "2025-08-05" },
    ],
    [
      { id: "natale", name: "Natale", theme: "natale" },
      { id: "capodanno", name: "Capodanno", theme: "capodanno" },
      { id: "valentino", name: "San Valentino", theme: "san-valentino" },
      { id: "pranzo", name: "Pranzo dai nonni" },
    ],
  );

  // No selector with fewer than two non-Neutro Occasions; the one themed Occasion still sets the Theme.
  for (const id of ["estate", "febbraio"]) {
    await page.goto(`/admin/memories/${id}`);
    await expect(page.getByRole("heading", { name: "Modifica ricordo" })).toBeVisible();
    await expect(page.getByLabel("Occasione principale")).toHaveCount(0);
  }
  await page.goto("/");
  await expect(timelineEntry(page, "Estate al mare")).toHaveAttribute("data-theme", "neutro");
  await expect(timelineEntry(page, "Febbraio a Roma")).toHaveAttribute("data-theme", "san-valentino");

  // Automatic: the first non-Neutro Occasion in badge order.
  await expect(timelineEntry(page, "Natale e Capodanno")).toHaveAttribute("data-theme", "natale");
  await page.goto("/memories/inverno");
  await expect(memoryTitlePage(page)).toHaveAttribute("data-theme", "natale");

  await page.goto("/admin/memories/inverno");
  const main = page.getByLabel("Occasione principale");
  await expect(main).toHaveValue("");
  // Only the non-Neutro Occasions, in badge order: a Neutro one has no Theme to give.
  await expect(main.getByRole("option")).toHaveText(["Automatica", "Natale", "Capodanno"]);

  await main.selectOption({ label: "Capodanno" });
  await expect(page.getByText("Occasione principale salvata.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Occasione principale")).toHaveValue("capodanno");

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

  // Adding a second themed Occasion to a Memory brings the selector.
  await page.goto("/admin/memories/febbraio");
  await page.getByLabel("Aggiungi un'occasione", { exact: true }).selectOption({ label: "Capodanno" });
  await page.getByRole("button", { name: "Aggiungi", exact: true }).click();
  await expect(page.getByLabel("Occasione principale").getByRole("option")).toHaveText([
    "Automatica",
    "San Valentino",
    "Capodanno",
  ]);
});
