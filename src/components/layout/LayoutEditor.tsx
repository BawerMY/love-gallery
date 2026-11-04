"use client";

import { useRef, useState, useTransition, type CSSProperties } from "react";
import { chooseCoverAction, saveLayoutAction, type LayoutState } from "@/app/admin/actions";
import { layoutBottom, layoutProblem } from "@/gallery/layout";
import type { MediaCell } from "@/gallery/types";
import { t } from "@/strings";
import styles from "./layout-editor.module.css";
import { useCellGesture } from "./useCellGesture";

/** One Media item as the editor needs it. */
export type EditorItem = {
  id: string;
  /** 1-based place in the saved Layout's reading order, for names. */
  position: number;
  cell: MediaCell;
  /** The thumbnail URL of a ready item; missing while it is processing or if it failed. */
  thumbnail?: string;
};

type Props = {
  memoryId: string;
  items: EditorItem[];
  /** The Media id the Timeline card shows now. */
  coverId?: string;
  /** Whether that cover was chosen by the Curator rather than picked by default. */
  coverChosen: boolean;
};

const GAP = 4;
/** Empty rows kept below the bottom of the Layout, so items can be dragged further down. */
const SPARE_ROWS = 2;

/**
 * The Layout editor: the Memory's 3-column grid of square cells, where each
 * item can be dragged by its ✥ handle and resized by its ◢ handle, with touch
 * or mouse. A change that would leave the grid or overlap another item is
 * simply not taken, and the core checks the whole Layout again on saving.
 */
export function LayoutEditor({ memoryId, items, coverId, coverChosen }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [cells, setCells] = useState(() => Object.fromEntries(items.map((item) => [item.id, item.cell])));
  const [dirty, setDirty] = useState(false);
  const [state, setState] = useState<LayoutState>({});
  const [pending, startTransition] = useTransition();

  const place = (id: string, cell: MediaCell) => {
    const old = cells[id];
    if (old.column === cell.column && old.row === cell.row && old.width === cell.width && old.height === cell.height)
      return;
    const next = { ...cells, [id]: cell };
    if (layoutProblem(Object.values(next))) return;
    setCells(next);
    setDirty(true);
    setState({});
  };
  const handlers = useCellGesture({ gridRef, gap: GAP, cellOf: (id) => cells[id], place });

  const save = () =>
    startTransition(async () => {
      const result = await saveLayoutAction(memoryId, cells);
      setState(result);
      if (result.saved) setDirty(false);
    });
  const chooseCover = (mediaId: string | undefined) =>
    startTransition(async () => {
      const result = await chooseCoverAction(memoryId, mediaId);
      if (result.error) setState(result);
    });

  const rows = layoutBottom(Object.values(cells)) + SPARE_ROWS;

  return (
    <div className={styles.editor}>
      <p className={styles.hint}>{t.layout.hint}</p>
      <div className={styles.frame}>
        <div
          ref={gridRef}
          className={styles.grid}
          style={{ "--grid-gap": `${GAP}px`, gridTemplateRows: `repeat(${rows}, var(--cell))` } as CSSProperties}
        >
          {Array.from({ length: rows * 3 }, (_, index) => (
            <div
              key={index}
              className={styles.emptyCell}
              aria-hidden="true"
              style={cellStyle({ column: index % 3, row: Math.floor(index / 3), width: 1, height: 1 })}
            />
          ))}
          {items.map((item) => {
            const cell = cells[item.id];
            const isCover = item.id === coverId;
            return (
              <div
                key={item.id}
                role="group"
                aria-label={t.layout.tile(item.position, cell)}
                className={styles.tile}
                style={cellStyle(cell)}
              >
                {item.thumbnail ? (
                  // A plain <img>: Media comes from the session-protected Media route, not next/image.
                  <img src={item.thumbnail} alt="" className={styles.image} draggable={false} />
                ) : (
                  <span className={styles.notReady}>{t.layout.notReady}</span>
                )}
                <button
                  type="button"
                  className={`${styles.handle} ${styles.move}`}
                  aria-label={t.layout.move(item.position)}
                  {...handlers(item.id, "move")}
                >
                  ✥
                </button>
                {item.thumbnail ? (
                  <button
                    type="button"
                    className={`${styles.handle} ${styles.cover}`}
                    aria-label={t.layout.makeCover(item.position)}
                    aria-pressed={isCover}
                    disabled={pending}
                    onClick={() => chooseCover(item.id)}
                  >
                    {isCover ? "★" : "☆"}
                  </button>
                ) : null}
                <button
                  type="button"
                  className={`${styles.handle} ${styles.resize}`}
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
      <div className={styles.actions}>
        <button type="button" onClick={save} disabled={pending || !dirty}>
          {pending ? t.layout.saving : t.layout.save}
        </button>
        {coverChosen ? (
          <button type="button" className="secondary" onClick={() => chooseCover(undefined)} disabled={pending}>
            {t.layout.defaultCover}
          </button>
        ) : null}
        <p role="status" className={state.error ? styles.error : styles.status}>
          {state.error ?? (state.saved ? t.layout.saved : dirty ? t.layout.unsaved : "")}
        </p>
      </div>
    </div>
  );
}

function cellStyle(cell: MediaCell): CSSProperties {
  return {
    gridColumn: `${cell.column + 1} / span ${cell.width}`,
    gridRow: `${cell.row + 1} / span ${cell.height}`,
  };
}
