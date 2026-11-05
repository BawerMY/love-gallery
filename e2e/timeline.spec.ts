import { expect, seedMemories, test } from "./fixtures";

test("the Timeline reads like a journal: month markers, themed entries and their notes", async ({
  pageWithSession: page,
}) => {
  await seedMemories(
    [
      { id: "primo", title: "Primo weekend", cities: ["Milano"], startDay: "2025-03-07", endDay: "2025-03-09" },
      {
        id: "secondo",
        title: "Di nuovo insieme",
        note: "Pioveva, ma che importa.",
        cities: ["Bergamo"],
        startDay: "2025-03-21",
        endDay: "2025-03-23",
      },
      {
        id: "inverno",
        title: "Inverno a Torino",
        cities: ["Torino"],
        startDay: "2025-12-24",
        endDay: "2025-12-27",
        oneOffOccasions: [{ id: "cena", name: "Cena coi nonni", day: "2025-12-24" }],
      },
    ],
    [{ id: "natale", name: "Natale", month: 12, day: 25, theme: "natale" }],
  );
  await page.goto("/");

  // A marker wherever the month changes: one for March, one for December.
  await expect(page.getByText("marzo 2025", { exact: true })).toHaveCount(1);
  await expect(page.getByText("dicembre 2025", { exact: true })).toHaveCount(1);

  const second = page.getByRole("link").filter({ hasText: "Di nuovo insieme" });
  await expect(second).toContainText("Pioveva, ma che importa.");
  await expect(second).toHaveAttribute("data-theme", "neutro");
  await expect(page.getByText("11 giorni di distanza")).toBeVisible();

  // The entry wears its Main occasion's Theme; each badge its own.
  const winter = page.getByRole("link").filter({ hasText: "Inverno a Torino" });
  await expect(winter).toHaveAttribute("data-theme", "natale");
  const badges = winter.getByRole("list", { name: "Ricorrenze" }).getByRole("listitem");
  await expect(badges).toHaveText(["Cena coi nonni", "Natale"]);
  await expect(badges.nth(0)).toHaveAttribute("data-theme", "neutro");
  await expect(badges.nth(1)).toHaveAttribute("data-theme", "natale");
});
