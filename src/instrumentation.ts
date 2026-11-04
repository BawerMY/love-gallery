/**
 * Runs once when the server starts: creates `database.json` if it's missing,
 * then picks up the background processing of videos that were still
 * converting when the app last stopped.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { getGallery } = await import("@/gallery/config");
  const { resumeMediaProcessing } = await import("@/gallery/media");
  const { storage } = getGallery();
  await storage.ensure();
  try {
    await resumeMediaProcessing(storage);
  } catch (error) {
    console.error(error);
  }
}
