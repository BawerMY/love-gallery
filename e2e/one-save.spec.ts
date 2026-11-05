import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Locator, Page } from "@playwright/test";
import { addMediaInCell, dataDir, expect, memoryTitlePage, saveBar, seedMemories, test } from "./fixtures";
import { centre, mouseDrag } from "./gestures";

const FIXTURES = path.join(import.meta.dirname, "..", "tests", "fixtures");
const PHOTO = path.join(FIXTURES, "gps-rotated.jpg");

/** Two ready 1×1 photos of the "inverno" Memory, side by side, with their files. */
async function twoPhotos() {
  const dir = path.join(dataDir, "media", "inverno");
  await mkdir(dir, { recursive: true });
  return Promise.all(
    ["a", "b"].map(async (id, column) => {
      await copyFile(path.join(FIXTURES, "playback-poster.webp"), path.join(dir, `${id}-thumb.webp`));
      await copyFile(path.join(FIXTURES, "playback-poster.webp"), path.join(dir, `${id}.webp`));
      return {
        id,
        kind: "photo",
        status: "ready",
        width: 96,
        height: 64,
        cell: { column, row: 0, width: 1, height: 1 },
        files: { display: `${id}.webp`, thumbnail: `${id}-thumb.webp` },
      };
    }),
  );
}

/** A winter Memory with Pranzo dai nonni (Neutro) and Natale; Capodanno waits in the list. */
async function seedInverno() {
  await seedMemories(
    [
      {
        id: "inverno",
        title: "Inverno",
        cities: ["Torino"],
        startDay: "2025-12-24",
        endDay: "2025-12-27",
        occasionIds: ["pranzo", "natale"],
        media: await twoPhotos(),
      },
    ],
    [
      { id: "pranzo", name: "Pranzo dai nonni" },
      { id: "natale", name: "Natale", theme: "natale" },
      { id: "capodanno", name: "Capodanno", theme: "capodanno" },
    ],
  );
}

async function savedMemory() {
  return JSON.parse(await readFile(path.join(dataDir, "database.json"), "utf8")).memories[0];
}

const saveButton = (page: Page) => saveBar(page).getByRole("button", { name: "Salva", exact: true });
const occasionsSection = (page: Page) => page.getByRole("region", { name: "Occasioni di questo ricordo" });
const badgesIn = (scope: Page | Locator) => scope.getByRole("list", { name: "Occasioni", exact: true }).getByRole("listitem");

/** Accepts the "leave with unsaved changes?" warnings, so a reload goes ahead. */
function acceptLeaving(page: Page) {
  page.on("dialog", (dialog) => void dialog.accept());
}

test("every edit on a Memory's Admin page waits for one Salva, which saves them all", async ({ pageWithSession: page }) => {
  await seedInverno();
  await page.goto("/admin/memories/inverno");
  await expect(saveButton(page)).toBeDisabled();

  // Details.
  await page.getByLabel("Titolo").fill("Natale a Torino");
  await expect(saveBar(page)).toContainText("Modifiche non salvate");
  await expect(saveButton(page)).toBeEnabled();
  await page.getByLabel("Ultimo giorno").fill("2025-12-28");

  // Occasions: pick Capodanno, create Tombolata, take off Pranzo dai nonni, drag Capodanno first.
  const section = occasionsSection(page);
  const names = section.getByRole("listitem").locator("strong");
  await section.getByLabel("Aggiungi un'occasione", { exact: true }).selectOption({ label: "Capodanno" });
  await section.getByRole("button", { name: "Aggiungi", exact: true }).click();
  const create = section.getByRole("form", { name: "Nuova occasione" });
  await create.getByLabel("Nome").fill("Tombolata");
  await create.getByLabel("Tema").selectOption({ label: "Anniversario" });
  await create.getByRole("button", { name: "Crea" }).click();
  await expect(create.getByLabel("Nome")).toHaveValue("");
  await section.getByRole("button", { name: "Togli «Pranzo dai nonni»" }).click();
  await expect(names).toHaveText(["Natale", "Capodanno", "Tombolata"]);
  // The picker offers only what the draft hasn't got: Pranzo dai nonni again.
  await expect(section.getByLabel("Aggiungi un'occasione", { exact: true }).getByRole("option")).toHaveText([
    "Scegli un'occasione…",
    "Pranzo dai nonni",
  ]);
  const capodanno = section.getByRole("button", { name: "Sposta «Capodanno»" });
  await mouseDrag(page, capodanno, 0, (await centre(section.getByRole("listitem").first())).y - (await centre(capodanno)).y);
  await expect(names).toHaveText(["Capodanno", "Natale", "Tombolata"]);

  // The Main occasion follows the draft Occasions.
  const main = page.getByLabel("Occasione principale");
  await expect(main.getByRole("option")).toHaveText(["Automatica", "Capodanno", "Natale", "Tombolata"]);
  await main.selectOption({ label: "Tombolata" });

  // Layout: Foto 1 goes down a row; Foto 2 becomes the cover.
  const editor = page.getByRole("region", { name: "Galleria" });
  const pitch = (await editor.getByRole("group", { name: /^Foto 1,/ }).boundingBox())!.width + 4;
  await mouseDrag(page, editor.getByRole("button", { name: "Sposta foto 1" }), 0, pitch);
  await expect(editor.getByRole("group", { name: "Foto 1, 1×1, colonna 1, riga 2" })).toBeVisible();
  await editor.getByRole("button", { name: "Usa foto 2 come copertina" }).click();

  // Nothing is saved yet.
  expect(await savedMemory()).toMatchObject({ title: "Inverno", occasionIds: ["pranzo", "natale"] });

  await saveButton(page).click();
  await expect(saveBar(page)).toContainText("Salvato");
  await expect(saveButton(page)).toBeDisabled();

  await page.reload();
  await expect(page.getByLabel("Titolo")).toHaveValue("Natale a Torino");
  await expect(page.getByLabel("Ultimo giorno")).toHaveValue("2025-12-28");
  await expect(names).toHaveText(["Capodanno", "Natale", "Tombolata"]);
  await expect(page.getByLabel("Occasione principale").locator("option:checked")).toHaveText("Tombolata");
  // Saved, the photos are named in their new reading order: the cover (once Foto 2) now comes first.
  await expect(editor.getByRole("group", { name: "Foto 2, 1×1, colonna 1, riga 2" })).toBeVisible();
  await expect(editor.getByRole("button", { name: "Usa foto 1 come copertina" })).toHaveAttribute("aria-pressed", "true");
  expect(await savedMemory()).toMatchObject({ coverMediaId: "b" });
  // A chosen cover is changed by choosing another: there's no way back to the automatic one.
  await expect(page.getByRole("button", { name: "Copertina automatica" })).toHaveCount(0);
  await expect(saveButton(page)).toBeDisabled();

  await page.goto("/memories/inverno");
  await expect(memoryTitlePage(page)).toHaveAttribute("data-theme", "anniversario");
  await expect(badgesIn(page)).toHaveText(["Capodanno", "Natale", "Tombolata"]);
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Natale a Torino/ })).toHaveAttribute("data-theme", "anniversario");
});

test("unsaved edits are lost on reload, after a warning, and the gallery pages show nothing new", async ({
  pageWithSession: page,
}) => {
  await seedInverno();
  await page.goto("/admin/memories/inverno");
  await page.getByLabel("Titolo").fill("Natale a Torino");
  const section = occasionsSection(page);
  await section.getByLabel("Aggiungi un'occasione", { exact: true }).selectOption({ label: "Capodanno" });
  await section.getByRole("button", { name: "Aggiungi", exact: true }).click();
  await expect(section.getByRole("listitem").locator("strong")).toHaveText(["Pranzo dai nonni", "Natale", "Capodanno"]);

  // The "← back" link asks first; saying no stays on the page with the edits.
  const asked: string[] = [];
  page.once("dialog", (dialog) => {
    asked.push(dialog.type());
    void dialog.dismiss();
  });
  await page.getByRole("link", { name: "Torna alla gestione" }).click();
  await expect.poll(() => asked).toEqual(["confirm"]);
  await expect(page).toHaveURL(/\/admin\/memories\/inverno$/);
  await expect(page.getByLabel("Titolo")).toHaveValue("Natale a Torino");

  // Reloading warns too; going ahead loses the edits.
  page.once("dialog", (dialog) => {
    asked.push(dialog.type());
    void dialog.accept();
  });
  await page.reload();
  await expect.poll(() => asked).toEqual(["confirm", "beforeunload"]);
  await expect(page.getByLabel("Titolo")).toHaveValue("Inverno");
  await expect(section.getByRole("listitem").locator("strong")).toHaveText(["Pranzo dai nonni", "Natale"]);
  await expect(saveButton(page)).toBeDisabled();

  await page.goto("/memories/inverno");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Inverno");
  await expect(badgesIn(page)).toHaveText(["Pranzo dai nonni", "Natale"]);
  await expect(memoryTitlePage(page)).toHaveAttribute("data-theme", "natale");
});

test("a refused save shows why in the bar and saves nothing", async ({ pageWithSession: page }) => {
  await seedInverno();
  await page.goto("/admin/memories/inverno");
  await page.getByLabel("Titolo").fill("Natale a Torino");
  const create = occasionsSection(page).getByRole("form", { name: "Nuova occasione" });
  await create.getByLabel("Nome").fill("natale");
  await create.getByRole("button", { name: "Crea" }).click();

  await saveButton(page).click();
  await expect(saveBar(page).getByRole("alert")).toHaveText("C'è già un'occasione chiamata «natale».");
  // The edits stay, to fix and save again.
  await expect(page.getByLabel("Titolo")).toHaveValue("Natale a Torino");
  await expect(saveButton(page)).toBeEnabled();
  expect(await savedMemory()).toMatchObject({ title: "Inverno", occasionIds: ["pranzo", "natale"] });

  acceptLeaving(page);
  await page.reload();
  await expect(page.getByLabel("Titolo")).toHaveValue("Inverno");
  await page.goto("/admin");
  await expect(page.getByRole("region", { name: "Occasioni", exact: true }).getByRole("listitem").locator("strong")).toHaveText([
    "Capodanno",
    "Natale",
    "Pranzo dai nonni",
  ]);
});

test("Salva stays off until something changes, and adding and deleting Media in the Galleria save at once without touching the edits", async ({
  pageWithSession: page,
}) => {
  await seedMemories([{ id: "milano", title: "Milano", cities: ["Milano"], startDay: "2025-03-14", endDay: "2025-03-14" }]);
  await page.goto("/admin/memories/milano");
  await expect(saveButton(page)).toBeDisabled();

  // Typing and then undoing it by hand is no change.
  await page.getByLabel("Titolo").fill("Milano!");
  await expect(saveButton(page)).toBeEnabled();
  await page.getByLabel("Titolo").fill("Milano");
  await expect(saveButton(page)).toBeDisabled();

  // Details, Occasions, then the Galleria, which holds adding and deleting Media too.
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(["Dettagli", "Occasioni di questo ricordo", "Galleria"]);
  const galleria = page.getByRole("region", { name: "Galleria" });

  await page.getByLabel("Titolo").fill("Weekend a Milano");
  await addMediaInCell(page, [PHOTO], { click: true });
  await expect(galleria.getByRole("img", { name: "Foto 1" })).toBeVisible();
  await expect(galleria.getByRole("group", { name: /^Foto 1,/ })).toBeVisible();
  expect((await savedMemory()).media).toHaveLength(1);
  await expect(page.getByLabel("Titolo")).toHaveValue("Weekend a Milano");
  await expect(saveBar(page)).toContainText("Modifiche non salvate");

  await saveButton(page).click();
  await expect(saveBar(page)).toContainText("Salvato");
  expect(await savedMemory()).toMatchObject({ title: "Weekend a Milano" });

  // Deleting saves at once too, keeping a new unsaved edit.
  await page.getByLabel("Titolo").fill("Milano, di nuovo");
  await galleria.getByRole("button", { name: "Elimina foto 1" }).click();
  await page.getByRole("alertdialog", { name: "Elimina foto 1" }).getByRole("button", { name: "Sì, elimina" }).click();
  await expect(galleria.getByRole("img", { name: "Foto 1" })).toHaveCount(0);
  expect((await savedMemory()).media).toHaveLength(0);
  await expect(page.getByLabel("Titolo")).toHaveValue("Milano, di nuovo");
  await expect(saveBar(page)).toContainText("Modifiche non salvate");
});
