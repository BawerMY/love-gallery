"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { deleteMediaAction } from "@/app/admin/actions";
import { LAYOUT_COLUMNS, layoutBottom, layoutProblem, readingOrder } from "@/gallery/layout";
import type { MediaCell, MediaItem } from "@/gallery/types";
import { t } from "@/strings";
import { MEDIA_ACCEPT, UploadStatus, useMediaUpload } from "../admin/MediaUpload";
import { sameCell, useMemoryDraft } from "../admin/MemoryDraft";
import { MEDIA_KINDS } from "../media-kinds";
import { dangerButton, secondaryButton } from "../ui";
import { useCellGesture } from "./useCellGesture";

/** One Media item as the editor needs it. */
export type EditorItem = {
  id: string;
  kind: MediaItem["kind"];
  status: MediaItem["status"];
  /** 1-based place in the saved Layout's reading order, for names. */
  position: number;
  cell: MediaCell;
  /** The thumbnail URL of a ready item; missing while it is processing or if it failed. */
  thumbnail?: string;
  /** Captured outside the Memory's Date range. */
  outsideDateRange: boolean;
};

const GAP = 4;
/**
 * The round ✥, ☆, ◢ and ✕ handles in a tile's corners. The drag handles also
 * take `touch-none`, so dragging them never scrolls the page; the rest of the
 * tile still scrolls as usual.
 */
const handle = "absolute size-9 rounded-full border-0 bg-white/85 p-0 text-lg leading-none text-cocoa";
/** Empty rows kept below the bottom of the Layout: always somewhere to tap to add Media, or to drag items down to. */
const SPARE_ROWS = 2;

/**
 * The Layout editor: the Memory's 3-column grid of square cells.
 *
 * - Tapping or clicking an empty cell opens the file picker; the chosen
 *   photos and videos are uploaded at once into that cell and the next free
 *   ones in reading order (see `cellsFrom`).
 * - Each item can be dragged by its ✥ handle and resized by its ◢ handle,
 *   with touch or mouse. A change that would leave the grid or overlap
 *   another item is simply not taken, and the core checks the whole Layout
 *   again on saving. The ☆ handle chooses the cover. These are saved with
 *   the rest of the page.
 * - The ✕ handle deletes the item at once, after a confirmation. Items still
 *   processing, or whose conversion failed, show their state on the tile.
 *
 * The cells come from the page's draft (see `MemoryDraftProvider`), which
 * keeps the unsaved changes on top of the saved Layout while new Media
 * arrives or is deleted.
 */
export function LayoutEditor({ memoryId, items }: { memoryId: string; items: EditorItem[] }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const target = useRef<{ column: number; row: number }>(null);
  const [deleting, setDeleting] = useState<EditorItem | null>(null);
  const { upload, progress, error, busy } = useMediaUpload(memoryId);
  const { cells: draftCells, setCells, coverMediaId, setCoverMediaId } = useMemoryDraft();
  // An item the draft doesn't know yet (the page is refreshing) keeps its saved cell.
  const cells = Object.fromEntries(items.map((item) => [item.id, draftCells[item.id] ?? item.cell]));

  const place = (id: string, cell: MediaCell) => {
    if (sameCell(cells[id], cell)) return;
    const next = { ...cells, [id]: cell };
    if (layoutProblem(Object.values(next))) return;
    setCells(next);
  };
  const handlers = useCellGesture({ gridRef, gap: GAP, cellOf: (id) => cells[id], place });

  // The cover the Timeline card will show: the chosen one, or else the first ready item in this Layout.
  const ready = items.filter((item) => item.thumbnail);
  const chosen = ready.find((item) => item.id === coverMediaId);
  const coverId = (chosen ?? readingOrder(ready.map((item) => ({ id: item.id, cell: cells[item.id] })))[0])?.id;

  const rows = layoutBottom(Object.values(cells)) + SPARE_ROWS;
  const empty = Array.from({ length: rows * LAYOUT_COLUMNS }, (_, index) => ({
    column: index % LAYOUT_COLUMNS,
    row: Math.floor(index / LAYOUT_COLUMNS),
    width: 1,
    height: 1,
  })).filter((cell) => !layoutProblem([cell, ...Object.values(cells)]));

  function pickFilesFor(cell: { column: number; row: number }) {
    target.current = { column: cell.column, row: cell.row };
    fileRef.current?.click();
  }

  const outside = items.filter((item) => item.outsideDateRange);

  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-sm text-cocoa-soft">{t.layout.hint}</p>
      <UploadStatus progress={progress} error={error} />
      <input
        ref={fileRef}
        type="file"
        multiple
        hidden
        accept={MEDIA_ACCEPT}
        aria-label={t.media.addPhotos}
        onChange={(event) => {
          const files = event.target.files;
          if (files && target.current) upload(files, { ...target.current, taken: Object.values(cells) });
          event.target.value = "";
        }}
      />
      <div className="@container">
        <div
          ref={gridRef}
          // Square cells, as on the Memory page: a row is as tall as a column is wide.
          className="grid grid-cols-3 gap-(--grid-gap) [--cell:calc((100cqi_-_2_*_var(--grid-gap))_/_3)]"
          style={{ "--grid-gap": `${GAP}px`, gridTemplateRows: `repeat(${rows}, var(--cell))` } as CSSProperties}
        >
          {empty.map((cell) => (
            <button
              key={`${cell.column}-${cell.row}`}
              type="button"
              className="cursor-pointer rounded-sm border border-dashed border-cocoa/20 bg-transparent p-0 text-2xl leading-none text-cocoa/25 hover:border-honey hover:bg-honey/10 hover:text-amber focus-visible:border-honey focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-honey/40 disabled:cursor-default"
              aria-label={t.media.addHere(cell.column + 1, cell.row + 1)}
              disabled={busy}
              style={cellStyle(cell)}
              onClick={() => pickFilesFor(cell)}
            >
              +
            </button>
          ))}
          {items.map((item) => {
            const cell = cells[item.id];
            const isCover = item.id === coverId;
            const kind = MEDIA_KINDS[item.kind];
            return (
              <div
                key={item.id}
                role="group"
                aria-label={t.layout.tile(item.position, cell)}
                className={`relative overflow-hidden rounded-sm bg-butter ring-2 ${item.outsideDateRange ? "ring-amber" : "ring-white"}`}
                style={cellStyle(cell)}
              >
                {item.thumbnail ? (
                  // A plain <img>: Media comes from the session-protected Media route, not next/image.
                  <img
                    src={item.thumbnail}
                    alt={kind.alt(item.position)}
                    className="pointer-events-none block size-full object-cover select-none"
                    draggable={false}
                  />
                ) : (
                  <span
                    role="status"
                    className={`absolute inset-0 grid place-items-center px-1 text-center text-xs ${item.status === "failed" ? "text-danger" : "text-cocoa-soft"}`}
                  >
                    {item.status === "failed" ? t.media.itemFailed : t.media.itemProcessing}
                  </span>
                )}
                <button
                  type="button"
                  className={`${handle} top-1 left-1 cursor-grab touch-none active:cursor-grabbing`}
                  aria-label={t.layout.move(item.position)}
                  {...handlers(item.id, "move")}
                >
                  ✥
                </button>
                {item.thumbnail ? (
                  <button
                    type="button"
                    className={`${handle} top-1 right-1 text-amber aria-pressed:bg-honey aria-pressed:text-white`}
                    aria-label={t.layout.makeCover(item.position)}
                    aria-pressed={isCover}
                    onClick={() => setCoverMediaId(item.id)}
                  >
                    {isCover ? "★" : "☆"}
                  </button>
                ) : null}
                <button
                  type="button"
                  className={`${handle} bottom-1 left-1 text-base text-danger`}
                  aria-label={kind.deleteLabel(item.position)}
                  onClick={() => setDeleting(item)}
                >
                  ✕
                </button>
                <button
                  type="button"
                  className={`${handle} right-1 bottom-1 cursor-nwse-resize touch-none`}
                  aria-label={t.layout.resize(item.position)}
                  {...handlers(item.id, "resize")}
                >
                  ◢
                </button>
              </div>
            );
          })}
        </div>
      </div>
      {outside.length ? (
        <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm text-amber">
          {outside.map((item) => (
            <li key={item.id}>{t.media.outsideDateRange(MEDIA_KINDS[item.kind].alt(item.position))}</li>
          ))}
        </ul>
      ) : null}
      {deleting ? <ConfirmMediaDelete memoryId={memoryId} item={deleting} onClose={() => setDeleting(null)} /> : null}
    </div>
  );
}

/** Asks, in a dialog over the page, before deleting a Media item; deletes it at once when confirmed. */
function ConfirmMediaDelete({ memoryId, item, onClose }: { memoryId: string; item: EditorItem; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const kind = MEDIA_KINDS[item.kind];
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      role="alertdialog"
      aria-label={kind.deleteLabel(item.position)}
      className="m-auto w-[min(calc(100vw-2rem),360px)] rounded-card border-0 bg-white p-5 text-cocoa shadow-soft backdrop:bg-cocoa/40"
      onClose={onClose}
    >
      <form
        className="flex flex-col gap-4"
        action={async () => {
          await deleteMediaAction(memoryId, item.id);
          onClose();
        }}
      >
        <div className="flex items-center gap-3">
          {item.thumbnail ? <img src={item.thumbnail} alt="" className="size-16 shrink-0 rounded-tile object-cover" /> : null}
          <p className="m-0">{kind.deleteQuestion}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className={secondaryButton} onClick={() => dialogRef.current?.close()}>
            {t.admin.deleteNo}
          </button>
          <button type="submit" className={dangerButton}>
            {t.admin.deleteYes}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function cellStyle(cell: MediaCell): CSSProperties {
  return {
    gridColumn: `${cell.column + 1} / span ${cell.width}`,
    gridRow: `${cell.row + 1} / span ${cell.height}`,
  };
}
