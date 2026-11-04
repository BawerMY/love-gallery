import { expect, galleryPassword, logIn, test } from "./fixtures";

test("redirects to the password screen and shows the empty Timeline after logging in", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "La nostra galleria" })).toBeVisible();

  await page.getByLabel("Password").fill(galleryPassword);
  await page.getByRole("button", { name: "Entra" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Nessun ricordo ancora")).toBeVisible();
});

test("shows an Italian error for a wrong Gallery password", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Password").fill("sbagliata");
  await page.getByRole("button", { name: "Entra" }).click();

  await expect(page.getByText("Password sbagliata. Riprova.")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("returns to the page that was asked for after logging in", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);

  await page.getByLabel("Password").fill(galleryPassword);
  await page.getByRole("button", { name: "Entra" }).click();

  await expect(page).toHaveURL(/\/admin$/);
});

test("remembers the session for a year with a secure cookie", async ({ page, context }) => {
  await logIn(page);

  const [cookie] = (await context.cookies()).filter((c) => c.name === "galleria_sessione");
  expect(cookie).toMatchObject({ httpOnly: true, secure: true, sameSite: "Lax" });
  const days = (cookie.expires * 1000 - Date.now()) / 86_400_000;
  expect(days).toBeGreaterThan(364);
  expect(days).toBeLessThanOrEqual(366);

  await page.goto("/");
  await expect(page.getByText("Nessun ricordo ancora")).toBeVisible();
});

test("answers API requests without a session with 401", async ({ request }) => {
  const response = await request.get("/api/memories");
  expect(response.status()).toBe(401);
});

test("tells search engines not to index any response", async ({ request, page }) => {
  const pages = await request.get("/login");
  expect(pages.headers()["x-robots-tag"]).toBe("noindex");

  const redirect = await request.get("/", { maxRedirects: 0 });
  expect(redirect.status()).toBe(307);
  expect(redirect.headers()["x-robots-tag"]).toBe("noindex");

  const api = await request.get("/api/memories");
  expect(api.headers()["x-robots-tag"]).toBe("noindex");

  await logIn(page);
  const timeline = await page.goto("/");
  expect(timeline!.headers()["x-robots-tag"]).toBe("noindex");
});
