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
