import type { MediaItem } from "@/gallery";
import { mediaPath } from "@/routes";
import { t } from "@/strings";

type Props = { memoryId: string; item: MediaItem; position: number };

/**
 * A photo filling its tile, loaded only as it nears the screen. A 1×1 tile
 * uses the thumbnail; larger tiles use the full WebP.
 */
export function PhotoTile({ memoryId, item, position }: Props) {
  const small = item.cell.width === 1 && item.cell.height === 1;
  return (
    // A plain <img>: Media comes from the session-protected Media route, not next/image.
    <img
      className="media-tile"
      src={mediaPath(memoryId, small ? item.files.thumbnail : item.files.display)}
      alt={t.media.photoAlt(position)}
      width={item.width}
      height={item.height}
      loading="lazy"
      decoding="async"
    />
  );
}
