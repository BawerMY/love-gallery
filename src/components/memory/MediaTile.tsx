import type { MediaItem } from "@/gallery";
import { PhotoTile } from "./PhotoTile";
import { VideoTile } from "./VideoTile";

type Props = {
  memoryId: string;
  item: MediaItem;
  /** 1-based place in the Layout's reading order, for the accessible name. */
  position: number;
};

/** One Media item filling its cell of the Memory grid, drawn by the tile for its kind. */
export function MediaTile({ memoryId, item, position }: Props) {
  switch (item.kind) {
    case "photo":
      return <PhotoTile memoryId={memoryId} item={item} position={position} />;
    case "video":
      return <VideoTile memoryId={memoryId} item={item} position={position} />;
    default:
      return null;
  }
}
