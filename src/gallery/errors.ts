/**
 * A rule of the gallery was broken. The message is in Italian and is meant to
 * be shown to the Curator as it is.
 */
export class GalleryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GalleryError";
  }
}
