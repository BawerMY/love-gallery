import { expect, seedMemories, test } from "./fixtures";

test("the Curator adds a Yearly occasion in the Admin page and its badge shows on an existing Memory", async ({
  loggedInPage: page,
}) => {
  await seedMemories([
    { id: "estate", title: "Estate al mare", cities: ["Rimini"], startDay: "2025-06-12", endDay: "2025-06-16" },
    { id: "autunno", title: "Autunno", cities: ["Torino"], startDay: "2025-10-03", endDay: "2025-10-05" },
  ]);
  await page.goto("/admin");

  const form = page.getByRole("form", { name: "Nuova ricorrenza annuale" });
  await form.getByLabel("Nome").fill("anniversario");
  await form.getByLabel("Giorno").fill("14");
  await form.getByLabel("Mese").selectOption({ label: "giugno" });
  await form.getByLabel("Primo anno").fill("2023");
  await form.getByRole("button", { name: "Aggiungi" }).click();
  await expect(form.getByText("Ricorrenza salvata.")).toBeVisible();
  await expect(page.getByText("14 giugno · dal 2023")).toBeVisible();

  await page.goto("/");
  const badges = page.getByRole("list", { name: "Ricorrenze" });
  await expect(badges).toHaveCount(1);
  await expect(page.getByRole("link", { name: /Estate al mare/ }).getByRole("listitem")).toHaveText(
    "2° anniversario",
  );

  await page.getByRole("link", { name: /Estate al mare/ }).click();
  await expect(page.getByRole("list", { name: "Ricorrenze" }).getByRole("listitem")).toHaveText("2° anniversario");

  await page.goto("/admin");
  await page.getByRole("button", { name: "Modifica «anniversario»" }).click();
  const edit = page.getByRole("form", { name: "Modifica «anniversario»" });
  await edit.getByLabel("Primo anno").fill("");
  await edit.getByRole("button", { name: "Salva" }).click();
  await expect(page.getByText(/^14 giugno$/)).toBeVisible();

  await page.goto("/memories/estate");
  await expect(page.getByRole("list", { name: "Ricorrenze" }).getByRole("listitem")).toHaveText("anniversario");

  await page.goto("/admin");
  await page.getByRole("button", { name: "Elimina «anniversario»" }).click();
  await page.getByRole("button", { name: "Sì, elimina" }).click();
  await expect(page.getByText("Non hai ancora aggiunto nessuna ricorrenza annuale.")).toBeVisible();

  await page.goto("/");
  await expect(page.getByRole("list", { name: "Ricorrenze" })).toHaveCount(0);
});

test("the Curator adds and removes One-off occasions on a Memory, shown by day with the Yearly ones", async ({
  loggedInPage: page,
}) => {
  await seedMemories([
    { id: "estate", title: "Estate al mare", cities: ["Rimini"], startDay: "2025-06-12", endDay: "2025-06-16" },
  ]);
  await page.goto("/admin");
  const yearly = page.getByRole("form", { name: "Nuova ricorrenza annuale" });
  await yearly.getByLabel("Nome").fill("anniversario");
  await yearly.getByLabel("Giorno").fill("14");
  await yearly.getByLabel("Mese").selectOption({ label: "giugno" });
  await yearly.getByRole("button", { name: "Aggiungi" }).click();
  await expect(yearly.getByText("Ricorrenza salvata.")).toBeVisible();

  await page.goto("/admin/memories/estate");
  await expect(page.getByText("Questo ricordo non ha ricorrenze proprie.")).toBeVisible();
  const form = page.getByRole("form", { name: "Nuova ricorrenza del ricordo" });
  for (const [name, day] of [
    ["Cena sul molo", "2025-06-15"],
    ["Primo tuffo", "2025-06-12"],
  ]) {
    await form.getByLabel("Nome").fill(name);
    await form.getByLabel("Data").fill(day);
    await form.getByRole("button", { name: "Aggiungi" }).click();
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  }
  await expect(page.getByText("15 giugno 2025")).toBeVisible();

  // Moving the Date range so that "Cena sul molo" falls outside is refused.
  await page.getByLabel("Ultimo giorno").fill("2025-06-14");
  await page.getByRole("button", { name: "Salva", exact: true }).click();
  await expect(
    page.getByText("La ricorrenza «Cena sul molo» resterebbe fuori dalle nuove date. Spostala o eliminala prima."),
  ).toBeVisible();

  await page.goto("/");
  await expect(page.getByRole("link", { name: /Estate al mare/ }).getByRole("listitem")).toHaveText([
    "Primo tuffo",
    "anniversario",
    "Cena sul molo",
  ]);
  await page.goto("/memories/estate");
  await expect(page.getByRole("list", { name: "Ricorrenze" }).getByRole("listitem")).toHaveText([
    "Primo tuffo",
    "anniversario",
    "Cena sul molo",
  ]);

  await page.goto("/admin/memories/estate");
  await page.getByRole("button", { name: "Elimina «Cena sul molo»" }).click();
  await page.getByRole("button", { name: "Sì, elimina" }).click();
  await expect(page.getByText("Cena sul molo", { exact: true })).toHaveCount(0);

  await page.goto("/memories/estate");
  await expect(page.getByRole("list", { name: "Ricorrenze" }).getByRole("listitem")).toHaveText([
    "Primo tuffo",
    "anniversario",
  ]);
});
