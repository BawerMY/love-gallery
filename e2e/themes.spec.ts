import { expect, memoryTitlePage, seedMemories, test } from "./fixtures";

test("the Curator gives Occasions a Theme in the Admin page and each badge shows its own", async ({
  pageWithSession: page,
}) => {
  await seedMemories([
    { id: "inverno", title: "Inverno a Torino", cities: ["Torino"], startDay: "2025-12-24", endDay: "2025-12-27" },
  ]);
  await page.goto("/admin");

  const form = page.getByRole("form", { name: "Nuova occasione" });
  for (const [name, theme] of [
    ["Natale", "Natale"],
    ["Cena coi nonni", undefined],
    ["Compleanno di Giulia", "Compleanno"],
  ] as const) {
    await expect(form.getByLabel("Tema")).toHaveValue("neutro");
    await form.getByLabel("Nome").fill(name);
    if (theme) await form.getByLabel("Tema").selectOption({ label: theme });
    await form.getByRole("button", { name: "Aggiungi" }).click();
    await expect(page.getByRole("region", { name: "Occasioni", exact: true }).locator("strong", { hasText: name })).toBeVisible();
  }

  await page.goto("/admin/memories/inverno");
  const picker = page.getByLabel("Aggiungi un'occasione", { exact: true });
  const section = page.getByRole("region", { name: "Occasioni di questo ricordo" });
  for (const name of ["Natale", "Cena coi nonni", "Compleanno di Giulia"]) {
    await picker.selectOption({ label: name });
    await section.getByRole("button", { name: "Aggiungi" }).click();
    await expect(section.getByRole("listitem").filter({ hasText: name })).toBeVisible();
  }

  const expected = [
    ["Natale", "natale"],
    ["Cena coi nonni", "neutro"],
    ["Compleanno di Giulia", "compleanno"],
  ];
  for (const path of ["/", "/memories/inverno"]) {
    await page.goto(path);
    const badges = page.getByRole("list", { name: "Ricorrenze" }).getByRole("listitem");
    await expect(badges).toHaveText(expected.map(([name]) => name));
    for (const [index, [, theme]] of expected.entries()) {
      await expect(badges.nth(index)).toHaveAttribute("data-theme", theme);
    }
  }

  // Changing the Occasion's Theme changes its badge.
  await page.goto("/admin");
  await page.getByRole("button", { name: "Modifica «Natale»" }).click();
  const edit = page.getByRole("form", { name: "Modifica «Natale»" });
  await expect(edit.getByLabel("Tema")).toHaveValue("natale");
  await edit.getByLabel("Tema").selectOption({ label: "Capodanno" });
  await edit.getByRole("button", { name: "Salva" }).click();
  await expect(edit).toHaveCount(0);

  await page.goto("/memories/inverno");
  await expect(page.getByRole("listitem").filter({ hasText: "Natale" })).toHaveAttribute("data-theme", "capodanno");
});

test("the Pasqua, Viaggio and Escursione Themes show on badges, Timeline entries and title pages", async ({
  pageWithSession: page,
}) => {
  const memories = [
    { id: "aprile", title: "Aprile a Firenze", day: "2025-04-20", name: "Pasqua", theme: "pasqua" },
    { id: "luglio", title: "Luglio a Lisbona", day: "2025-07-01", name: "Viaggio insieme", theme: "viaggio" },
    { id: "settembre", title: "Settembre in Valle d'Aosta", day: "2025-09-01", name: "Escursione insieme", theme: "escursione" },
  ];
  await seedMemories(
    memories.map(({ id, title, day }) => ({ id, title, cities: ["Torino"], startDay: day, endDay: day, occasionIds: [id] })),
    memories.map(({ id, name, theme }) => ({ id, name, theme })),
  );

  await page.goto("/admin");
  await expect(page.getByRole("form", { name: "Nuova occasione" }).getByLabel("Tema").getByRole("option")).toContainText([
    "Pasqua",
    "Viaggio",
    "Escursione",
  ]);

  for (const { id, title, name, theme } of memories) {
    await page.goto("/");
    const entry = page.getByRole("link").filter({ hasText: title });
    await expect(entry).toHaveAttribute("data-theme", theme);
    await expect(entry.getByRole("listitem").filter({ hasText: name })).toHaveAttribute("data-theme", theme);

    await page.goto(`/memories/${id}`);
    await expect(memoryTitlePage(page)).toHaveAttribute("data-theme", theme);
    await expect(page.getByRole("list", { name: "Ricorrenze" }).getByRole("listitem")).toHaveAttribute("data-theme", theme);
  }
});
