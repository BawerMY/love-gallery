/**
 * Runs once when the server starts: picks up the background processing of
 * videos that were still converting when the app last stopped.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { getGallery, resumeMediaProcessing } = await import("./gallery");
  try {
    await resumeMediaProcessing(getGallery().storage);
  } catch (error) {
    console.error(error);
  }
}
