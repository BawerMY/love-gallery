import { expect, seedMemories, test } from "./fixtures";

test("the Curator gives Occasions a Theme in the Admin page and each badge shows its own", async ({
  pageWithSession: page,
}) => {
  await seedMemories([
    { id: "inverno", title: "Inverno a Torino", cities: ["Torino"], startDay: "2025-12-24", endDay: "2025-12-27" },
  ]);
  await page.goto("/admin");

  const yearly = page.getByRole("form", { name: "Nuova ricorrenza annuale" });
  await expect(yearly.getByLabel("Tema")).toHaveValue("neutro");
  await yearly.getByLabel("Nome").fill("Natale");
  await yearly.getByLabel("Giorno").fill("25");
  await yearly.getByLabel("Mese").selectOption({ label: "dicembre" });
  await yearly.getByLabel("Tema").selectOption({ label: "Natale" });
  await yearly.getByRole("button", { name: "Aggiungi" }).click();
  await expect(yearly.getByText("Ricorrenza salvata.")).toBeVisible();
  await expect(yearly.getByLabel("Tema")).toHaveValue("neutro");

  await page.goto("/admin/memories/inverno");
  const oneOff = page.getByRole("form", { name: "Nuova ricorrenza del ricordo" });
  await expect(oneOff.getByLabel("Tema")).toHaveValue("neutro");
  await oneOff.getByLabel("Nome").fill("Cena coi nonni");
  await oneOff.getByLabel("Data").fill("2025-12-26");
  await oneOff.getByRole("button", { name: "Aggiungi" }).click();
  await expect(page.getByText("Cena coi nonni", { exact: true })).toBeVisible();
  await oneOff.getByLabel("Nome").fill("Compleanno di Giulia");
  await oneOff.getByLabel("Data").fill("2025-12-27");
  await oneOff.getByLabel("Tema").selectOption({ label: "Compleanno" });
  await oneOff.getByRole("button", { name: "Aggiungi" }).click();
  await expect(page.getByText("Compleanno di Giulia", { exact: true })).toBeVisible();

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

  // Changing the Yearly occasion's Theme changes its badge.
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
