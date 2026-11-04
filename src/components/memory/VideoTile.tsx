import type { MediaItem } from "@/gallery";
import { mediaPath } from "@/routes";
import { t } from "@/strings";

type Props = { memoryId: string; item: MediaItem; position: number };

/**
 * A video filling its tile: a plain `<video>` showing its poster until it
 * plays. Only metadata is fetched up front, so a page of videos stays light.
 * Autoplay while on screen and the unmute button come with ticket 06.
 */
export function VideoTile({ memoryId, item, position }: Props) {
  return (
    <video
      className="media-tile"
      src={mediaPath(memoryId, item.files.display)}
      poster={mediaPath(memoryId, item.files.thumbnail)}
      aria-label={t.media.videoAlt(position)}
      width={item.width}
      height={item.height}
      preload="metadata"
      playsInline
      muted
      controls
    />
  );
}
