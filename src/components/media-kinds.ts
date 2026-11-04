import type { MediaFiles, MediaItem } from "@/gallery";
import { t } from "@/strings";

/** What differs between a photo and a video wherever a Media item is shown or deleted. */
type MediaKind = {
  /** The accessible name of the item at this 1-based place in the Layout. */
  alt: (position: number) => string;
  /** The accessible name of the item magnified. */
  magnifiedLabel: (position: number) => string;
  deleteLabel: string;
  deleteQuestion: string;
  /** The file to show as a still image when it isn't playing: the photo itself, or a video's poster. */
  still: (files: MediaFiles) => string;
  /** The poster to show until it plays; none for a photo. */
  poster: (files: MediaFiles) => string | undefined;
};

export const MEDIA_KINDS: Record<MediaItem["kind"], MediaKind> = {
  photo: {
    alt: t.media.photoAlt,
    magnifiedLabel: t.magnify.photoLabel,
    deleteLabel: t.media.deletePhoto,
    deleteQuestion: t.media.deleteConfirm,
    still: (files) => files.display,
    poster: () => undefined,
  },
  video: {
    alt: t.media.videoAlt,
    magnifiedLabel: t.magnify.videoLabel,
    deleteLabel: t.media.deleteVideo,
    deleteQuestion: t.media.deleteVideoConfirm,
    still: (files) => files.thumbnail,
    poster: (files) => files.thumbnail,
  },
};
