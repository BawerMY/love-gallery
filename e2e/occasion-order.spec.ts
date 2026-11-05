import type { Locator, Page } from "@playwright/test";
import { expect, memoryTitlePage, seedMemories, test } from "./fixtures";
import { centre, mouseDrag, touchDrag } from "./gestures";

/** The Memory's entry on the Timeline. */
const timelineEntry = (page: Page, title: string) => page.getByRole("link").filter({ hasText: title });
const badgesIn = (scope: Page | Locator) => scope.getByRole("list", { name: "Occasioni", exact: true }).getByRole("listitem");

/** How far to drag `handle` up or down so it lands on the middle of `target`. */
async function toward(handle: Locator, target: Locator) {
  return (await centre(target)).y - (await centre(handle)).y;
}

test("the Curator reorders a Memory's Occasions by drag and drop, with the mouse and by touch, and the badges and Theme follow", async ({
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
        occasionIds: ["natale", "capodanno", "pranzo"],
      },
    ],
    [
      { id: "natale", name: "Natale", theme: "natale" },
      { id: "capodanno", name: "Capodanno", theme: "capodanno" },
      { id: "pranzo", name: "Pranzo dai nonni" },
    ],
  );
  await page.goto("/admin/memories/inverno");
  const section = page.getByRole("region", { name: "Occasioni di questo ricordo" });
  const items = section.getByRole("listitem");
  const names = items.locator("strong");
  await expect(names).toHaveText(["Natale", "Capodanno", "Pranzo dai nonni"]);
  await expect(page.getByLabel("Occasione principale")).toHaveValue("");

  // With the mouse, Capodanno goes above Natale; dropping saves straight away.
  const capodanno = section.getByRole("button", { name: "Sposta «Capodanno»" });
  await mouseDrag(page, capodanno, 0, await toward(capodanno, items.first()));
  await expect(names).toHaveText(["Capodanno", "Natale", "Pranzo dai nonni"]);
  await expect(section.getByText("Ordine salvato")).toBeVisible();

  await page.reload();
  await expect(names).toHaveText(["Capodanno", "Natale", "Pranzo dai nonni"]);

  // "Automatica" now takes Capodanno, the first non-Neutro Occasion.
  await page.goto("/");
  await expect(badgesIn(timelineEntry(page, "Natale e Capodanno"))).toHaveText(["Capodanno", "Natale", "Pranzo dai nonni"]);
  await expect(timelineEntry(page, "Natale e Capodanno")).toHaveAttribute("data-theme", "capodanno");
  await page.goto("/memories/inverno");
  await expect(badgesIn(page)).toHaveText(["Capodanno", "Natale", "Pranzo dai nonni"]);
  await expect(memoryTitlePage(page)).toHaveAttribute("data-theme", "capodanno");

  // By touch, Pranzo dai nonni goes first; being Neutro, it leaves the Theme to Capodanno.
  await page.goto("/admin/memories/inverno");
  const pranzo = section.getByRole("button", { name: "Sposta «Pranzo dai nonni»" });
  await touchDrag(page, pranzo, 0, await toward(pranzo, items.first()));
  await expect(names).toHaveText(["Pranzo dai nonni", "Capodanno", "Natale"]);
  await expect(section.getByText("Ordine salvato")).toBeVisible();

  // By touch again, Natale goes above Capodanno and takes the Theme.
  const natale = section.getByRole("button", { name: "Sposta «Natale»" });
  await touchDrag(page, natale, 0, await toward(natale, items.nth(1)));
  await expect(names).toHaveText(["Pranzo dai nonni", "Natale", "Capodanno"]);
  await expect(section.getByText("Ordine salvato")).toBeVisible();

  await page.reload();
  await expect(names).toHaveText(["Pranzo dai nonni", "Natale", "Capodanno"]);
  await page.goto("/");
  await expect(badgesIn(timelineEntry(page, "Natale e Capodanno"))).toHaveText(["Pranzo dai nonni", "Natale", "Capodanno"]);
  await expect(timelineEntry(page, "Natale e Capodanno")).toHaveAttribute("data-theme", "natale");
  await page.goto("/memories/inverno");
  await expect(badgesIn(page)).toHaveText(["Pranzo dai nonni", "Natale", "Capodanno"]);
  await expect(memoryTitlePage(page)).toHaveAttribute("data-theme", "natale");
});
