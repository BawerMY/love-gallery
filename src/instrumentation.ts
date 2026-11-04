/** Runs once when the server starts: creates `database.json` if it's missing. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { getGallery } = await import("@/gallery/config");
  await getGallery().storage.ensure();
}
