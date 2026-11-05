import { expect, seedMemories, test } from "./fixtures";

test("the Curator manages the list of Occasions in the Admin page", async ({ pageWithSession: page }) => {
  await seedMemories(
    [
      { id: "estate", title: "Estate al mare", cities: ["Rimini"], startDay: "2025-06-12", endDay: "2025-06-16", occasionIds: ["viaggio"] },
      { id: "autunno", title: "Autunno", cities: ["Torino"], startDay: "2025-10-03", endDay: "2025-10-05", occasionIds: ["viaggio"] },
    ],
    [{ id: "viaggio", name: "Viaggio" }],
  );
  await page.goto("/admin");
  const section = page.getByRole("region", { name: "Occasioni", exact: true });

  // Create, listed alphabetically; a duplicate name is refused, ignoring case.
  const form = page.getByRole("form", { name: "Nuova occasione" });
  await expect(form.getByLabel("Tema")).toHaveValue("neutro");
  await form.getByLabel("Nome").fill("Anniversario");
  await form.getByLabel("Tema").selectOption({ label: "Anniversario" });
  await form.getByRole("button", { name: "Aggiungi" }).click();
  await expect(form.getByText("Occasione salvata.")).toBeVisible();
  await expect(form.getByLabel("Tema")).toHaveValue("neutro");
  await expect(section.getByRole("listitem").locator("strong")).toHaveText(["Anniversario", "Viaggio"]);
  await expect(section.getByRole("listitem").filter({ hasText: "Anniversario" })).toHaveAttribute("data-theme", "anniversario");

  await form.getByLabel("Nome").fill("viaggio");
  await form.getByRole("button", { name: "Aggiungi" }).click();
  await expect(form.getByRole("alert")).toHaveText("C'è già un'occasione chiamata «viaggio».");

  // Rename and change the Theme: every Memory that has it shows the change.
  await page.getByRole("button", { name: "Modifica «Viaggio»" }).click();
  const edit = page.getByRole("form", { name: "Modifica «Viaggio»" });
  await edit.getByLabel("Nome").fill("Viaggio insieme");
  await edit.getByLabel("Tema").selectOption({ label: "Natale" });
  await edit.getByRole("button", { name: "Salva" }).click();
  await expect(edit).toHaveCount(0);

  await page.goto("/");
  for (const title of ["Estate al mare", "Autunno"]) {
    const badge = page.getByRole("link", { name: new RegExp(title) }).getByRole("listitem");
    await expect(badge).toHaveText("Viaggio insieme");
    await expect(badge).toHaveAttribute("data-theme", "natale");
  }

  // Delete, after a confirmation that says how many Memories use it.
  await page.goto("/admin");
  await page.getByRole("button", { name: "Elimina «Viaggio insieme»" }).click();
  await expect(page.getByText("Eliminare l'occasione «Viaggio insieme»? Verrà tolta da 2 ricordi.")).toBeVisible();
  await page.getByRole("button", { name: "Sì, elimina" }).click();
  await expect(section.getByRole("listitem").locator("strong")).toHaveText(["Anniversario"]);

  await page.goto("/");
  await expect(page.getByRole("list", { name: "Occasioni", exact: true })).toHaveCount(0);
});

test("the Curator picks Occasions for a Memory and removes one, and the badges follow the order", async ({
  pageWithSession: page,
}) => {
  await seedMemories(
    [
      { id: "estate", title: "Estate al mare", cities: ["Rimini"], startDay: "2025-06-12", endDay: "2025-06-16" },
      { id: "autunno", title: "Autunno", cities: ["Torino"], startDay: "2025-10-03", endDay: "2025-10-05", occasionIds: ["tuffo"] },
    ],
    [
      { id: "tuffo", name: "Primo tuffo" },
      { id: "natale", name: "Natale", theme: "natale" },
      { id: "cena", name: "Cena sul molo" },
    ],
  );
  await page.goto("/admin/memories/estate");
  const section = page.getByRole("region", { name: "Occasioni di questo ricordo" });
  await expect(section.getByText("Questo ricordo non ha ancora occasioni.")).toBeVisible();

  const picker = section.getByLabel("Aggiungi un'occasione", { exact: true });
  for (const name of ["Natale", "Primo tuffo", "Cena sul molo"]) {
    await picker.selectOption({ label: name });
    await section.getByRole("button", { name: "Aggiungi" }).click();
    await expect(section.getByRole("listitem").filter({ hasText: name })).toBeVisible();
  }
  // Every Occasion is on the Memory now, so there's nothing left to pick.
  await expect(section.getByText("Questo ricordo ha già tutte le occasioni della lista.")).toBeVisible();

  for (const path of ["/", "/memories/estate"]) {
    await page.goto(path);
    // On the Timeline, the summer Memory comes first.
    const badges = page.getByRole("list", { name: "Occasioni", exact: true }).first().getByRole("listitem");
    await expect(badges).toHaveText(["Natale", "Primo tuffo", "Cena sul molo"]);
    await expect(badges.first()).toHaveAttribute("data-theme", "natale");
  }

  // Changing the Date range leaves the Occasions alone.
  await page.goto("/admin/memories/estate");
  await page.getByLabel("Primo giorno").fill("2025-07-01");
  await page.getByLabel("Ultimo giorno").fill("2025-07-03");
  await page.getByRole("button", { name: "Salva", exact: true }).click();
  await expect(page.getByText("Ricordo salvato.")).toBeVisible();

  // Removing takes it off this Memory only: it stays in the picker and on other Memories.
  await section.getByRole("button", { name: "Togli «Primo tuffo»" }).click();
  await expect(section.getByRole("listitem").locator("strong")).toHaveText(["Natale", "Cena sul molo"]);
  await expect(picker.getByRole("option", { name: "Primo tuffo" })).toHaveCount(1);

  await page.goto("/memories/estate");
  await expect(page.getByRole("list", { name: "Occasioni", exact: true }).getByRole("listitem")).toHaveText(["Natale", "Cena sul molo"]);
  await page.goto("/memories/autunno");
  await expect(page.getByRole("list", { name: "Occasioni", exact: true }).getByRole("listitem")).toHaveText(["Primo tuffo"]);
});

test("the Curator creates an Occasion from a Memory's Admin page, adding it to that Memory and the list", async ({
  pageWithSession: page,
}) => {
  await seedMemories(
    [{ id: "napoli", title: "Napoli", cities: ["Napoli"], startDay: "2025-05-10", endDay: "2025-05-11", occasionIds: ["natale"] }],
    [{ id: "natale", name: "Natale", theme: "natale" }],
  );
  await page.goto("/admin/memories/napoli");
  const section = page.getByRole("region", { name: "Occasioni di questo ricordo" });
  const form = section.getByRole("form", { name: "Nuova occasione" });

  await expect(form.getByLabel("Tema")).toHaveValue("neutro");
  await form.getByLabel("Nome").fill("Prima pizza insieme");
  await form.getByRole("button", { name: "Crea" }).click();
  await expect(section.getByRole("listitem").locator("strong")).toHaveText(["Natale", "Prima pizza insieme"]);
  await expect(form.getByLabel("Nome")).toHaveValue("");

  // A name already in the list is refused, ignoring case, and nothing is added.
  await form.getByLabel("Nome").fill("natale");
  await form.getByRole("button", { name: "Crea" }).click();
  await expect(form.getByRole("alert")).toHaveText("C'è già un'occasione chiamata «natale».");
  await expect(section.getByRole("listitem")).toHaveCount(2);

  await page.goto("/memories/napoli");
  await expect(page.getByRole("list", { name: "Occasioni", exact: true }).getByRole("listitem")).toHaveText([
    "Natale",
    "Prima pizza insieme",
  ]);

  await page.goto("/admin");
  await expect(
    page.getByRole("region", { name: "Occasioni", exact: true }).getByRole("listitem").locator("strong"),
  ).toHaveText(["Natale", "Prima pizza insieme"]);
});
