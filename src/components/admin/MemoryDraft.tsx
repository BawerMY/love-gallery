"use client";

import { createContext, use, useEffect, useState, useTransition, type ReactNode } from "react";
import { saveMemoryEditsAction } from "@/app/admin/actions";
import { cellsBelowLayout, layoutProblem, readingOrder } from "@/gallery/layout";
import { DEFAULT_THEME } from "@/gallery/themes";
import type { MediaCell, Memory, Occasion } from "@/gallery/types";

/** The title, Cities, Date range and note as the Curator types them. */
export type DetailsDraft = { title: string; cities: string[]; startDay: string; endDay: string; note: string };

/** One of the Memory's Occasions in the draft; a new one, created only on saving, has a made-up id. */
export type DraftOccasion = Occasion & { isNew?: true };

/** What the Curator changed so far; whatever is left out is as saved. */
type Edits = {
  details?: DetailsDraft;
  occasions?: DraftOccasion[];
  /** The chosen Main occasion's id, or "" for "Automatica". */
  mainOccasionId?: string;
  /** Changed Layout cells, by Media id, on top of the saved Layout. */
  cells?: Record<string, MediaCell>;
  /** The chosen cover (no id: the default cover). */
  cover?: { mediaId?: string };
};

/** Where saving is at: shown in the save bar. */
type Status = { saved?: boolean; error?: string };

type MemoryDraft = {
  details: DetailsDraft;
  setDetails: (details: DetailsDraft) => void;
  /** The Memory's Occasions in badge order. */
  occasions: DraftOccasion[];
  setOccasions: (occasions: DraftOccasion[]) => void;
  /** Adds a new Occasion to the end, to be created in the list when saving. */
  addNewOccasion: (occasion: Omit<Occasion, "id">) => void;
  /** The Main occasion's id ("" for "Automatica"), only ever one of the non-Neutro Occasions of the draft. */
  mainOccasionId: string;
  setMainOccasionId: (id: string) => void;
  /** Every Media item's cell: the Curator's changes merged into the saved Layout (see `mergeChanges`). */
  cells: Record<string, MediaCell>;
  /** Takes a whole new Layout, by Media id. */
  setCells: (cells: Record<string, MediaCell>) => void;
  /** The chosen cover's Media id, if one is chosen. */
  coverMediaId?: string;
  setCoverMediaId: (id: string | undefined) => void;
  /** Whether the draft differs from what's saved. */
  dirty: boolean;
  pending: boolean;
  status: Status;
  save: () => void;
};

/** How many new Occasions were added to drafts so far: their made-up ids. */
let newOccasions = 0;

const Context = createContext<MemoryDraft | null>(null);

/** The draft of the Memory's Admin page, for the components inside `MemoryDraftProvider`. */
export function useMemoryDraft(): MemoryDraft {
  const draft = use(Context);
  if (!draft) throw new Error("useMemoryDraft outside MemoryDraftProvider");
  return draft;
}

type Props = {
  memory: Memory;
  /** The list of Occasions. */
  occasions: Occasion[];
  /** Show "saved" straight away, e.g. right after creating the Memory. */
  saved?: boolean;
  children: ReactNode;
};

/**
 * Holds every edit of a Memory's Admin page (details, Main occasion,
 * Occasions, Layout and cover) as an unsaved draft on top of the saved
 * Memory, until one Save sends it all (see `saveMemoryEdits`). As only the
 * changes are kept, a page refresh (Media arriving or deleted, which save at
 * once) keeps them and shows the rest as saved. Warns before the page is left
 * with unsaved changes.
 */
export function MemoryDraftProvider({ memory, occasions, saved = false, children }: Props) {
  const [edits, setEdits] = useState<Edits>({});
  const [status, setStatus] = useState<Status>({ saved });
  const [pending, startTransition] = useTransition();

  const savedDetails = detailsOf(memory);
  const savedOccasions = occasionsOf(memory, occasions);
  const savedMain = effectiveMain(savedOccasions, memory.mainOccasionId);
  const savedCells = Object.fromEntries(memory.media.map((item) => [item.id, item.cell]));

  const details = edits.details ?? savedDetails;
  // Occasions deleted from the list meanwhile are dropped from the draft too.
  const draftOccasions = (edits.occasions ?? savedOccasions).filter(
    (occasion) => occasion.isNew || occasions.some((listed) => listed.id === occasion.id),
  );
  const mainOccasionId = effectiveMain(draftOccasions, edits.mainOccasionId ?? memory.mainOccasionId);
  const cells = mergeChanges(readingOrder(memory.media), edits.cells ?? {});
  // A chosen cover deleted meanwhile is dropped from the draft.
  const cover =
    edits.cover && (edits.cover.mediaId === undefined || memory.media.some((item) => item.id === edits.cover!.mediaId))
      ? edits.cover
      : { mediaId: memory.coverMediaId };

  const dirty =
    !sameJson(details, savedDetails) ||
    !sameJson(draftOccasions.map((o) => [o.id, o.name, o.theme]), savedOccasions.map((o) => [o.id, o.name, o.theme])) ||
    mainOccasionId !== savedMain ||
    memory.media.some((item) => !sameCell(cells[item.id], savedCells[item.id])) ||
    cover.mediaId !== memory.coverMediaId;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function edit(change: Edits) {
    setEdits((current) => ({ ...current, ...change }));
    setStatus({});
  }

  function save() {
    const mainIndex = draftOccasions.findIndex((occasion) => occasion.id === mainOccasionId);
    setStatus({});
    startTransition(async () => {
      const result = await saveMemoryEditsAction(memory.id, {
        details,
        occasions: draftOccasions.map(({ id, name, theme, isNew }) => (isNew ? { name, theme } : { id })),
        mainOccasion: mainIndex < 0 ? undefined : mainIndex,
        cells,
        coverMediaId: cover.mediaId,
      });
      setStatus(result);
      if (result.saved) setEdits({});
    });
  }

  const draft: MemoryDraft = {
    details,
    setDetails: (next) => edit({ details: next }),
    occasions: draftOccasions,
    setOccasions: (next) => edit({ occasions: next }),
    addNewOccasion: (occasion) =>
      edit({ occasions: [...draftOccasions, { ...occasion, id: `new:${++newOccasions}`, isNew: true }] }),
    mainOccasionId,
    setMainOccasionId: (id) => edit({ mainOccasionId: id }),
    cells,
    // Only the cells that differ from the saved Layout are kept, items moved aside by the merge included.
    setCells: (next) =>
      edit({ cells: Object.fromEntries(memory.media.filter((item) => !sameCell(next[item.id], item.cell)).map((item) => [item.id, next[item.id]])) }),
    coverMediaId: cover.mediaId,
    setCoverMediaId: (mediaId) => edit({ cover: { mediaId } }),
    dirty,
    pending,
    status,
    save,
  };

  return <Context value={draft}>{children}</Context>;
}

function detailsOf(memory: Memory): DetailsDraft {
  return {
    title: memory.title ?? "",
    cities: memory.cities,
    startDay: memory.startDay,
    endDay: memory.endDay,
    note: memory.note ?? "",
  };
}

/** A Memory's Occasions in badge order (as `occasionsOfMemory`, which lives with the server-only core). */
function occasionsOf(memory: Memory, occasions: Occasion[]): DraftOccasion[] {
  const byId = new Map(occasions.map((occasion) => [occasion.id, occasion]));
  return memory.occasionIds.flatMap((id) => byId.get(id) ?? []);
}

/** The Main occasion the selector shows: the chosen one while it's a non-Neutro Occasion here, else "Automatica" (""). */
function effectiveMain(occasions: DraftOccasion[], chosen: string | undefined): string {
  return occasions.some((occasion) => occasion.id === chosen && occasion.theme !== DEFAULT_THEME) ? chosen! : "";
}

/**
 * The Layout the page shows: each item's unsaved change, or else its saved
 * cell. Changes for items no longer there are dropped. An item whose saved
 * cell would overlap a change (it arrived after the change was made) goes
 * in a new row below everything else.
 */
function mergeChanges(
  items: readonly { id: string; cell: MediaCell }[],
  changes: Readonly<Record<string, MediaCell>>,
): Record<string, MediaCell> {
  const placed: MediaCell[] = items.flatMap((item) => (changes[item.id] ? [changes[item.id]] : []));
  const cells: Record<string, MediaCell> = {};
  const clashing: { id: string }[] = [];
  for (const item of items) {
    const changed = changes[item.id];
    if (changed) cells[item.id] = changed;
    else if (layoutProblem([...placed, item.cell])) clashing.push(item);
    else {
      cells[item.id] = item.cell;
      placed.push(item.cell);
    }
  }
  const below = cellsBelowLayout(placed, clashing.length);
  clashing.forEach((item, i) => (cells[item.id] = below[i]));
  return cells;
}

export function sameCell(a: MediaCell | undefined, b: MediaCell | undefined): boolean {
  return !!a && !!b && a.column === b.column && a.row === b.row && a.width === b.width && a.height === b.height;
}

function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
