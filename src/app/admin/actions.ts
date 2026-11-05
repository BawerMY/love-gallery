"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addOneOffOccasion,
  chooseCover,
  chooseMainOccasion,
  createMemory,
  createYearlyOccasion,
  deleteMedia,
  deleteMemory,
  deleteOneOffOccasion,
  deleteYearlyOccasion,
  GalleryError,
  getGallery,
  saveLayout,
  updateMemory,
  updateYearlyOccasion,
  type MainOccasionRef,
  type MediaCell,
  type MemoryInput,
  type YearlyOccasionInput,
} from "@/gallery";
import { t } from "@/strings";
import { requireSession } from "../require-session";

/** What an Admin form or editor shows after saving: an Italian error, or that it was saved. */
export type FormState = { error?: string; saved?: boolean };

/**
 * Turns an error into a message for the form. A broken gallery rule shows
 * its own Italian message; anything else is logged and shown as an
 * unexpected error, never rethrown.
 */
function failure(error: unknown): FormState {
  if (error instanceof GalleryError) return { error: error.message };
  console.error(error);
  return { error: t.admin.unexpectedError };
}

/**
 * The shape of every saving action: checks the session, runs `change`, and
 * on success refreshes every page and reports it saved; a failure becomes
 * the form's error (see `failure`).
 */
async function save(change: () => Promise<unknown>): Promise<FormState> {
  await requireSession();
  try {
    await change();
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/", "layout");
  return { saved: true };
}

/** The shape of every deleting action: checks the session, deletes, refreshes every page. Errors are passed on. */
async function remove(change: () => Promise<unknown>): Promise<void> {
  await requireSession();
  await change();
  revalidatePath("/", "layout");
}

const storage = () => getGallery().storage;

// Memories

function readMemoryForm(form: FormData): MemoryInput {
  return {
    title: String(form.get("title") ?? ""),
    note: String(form.get("note") ?? ""),
    cities: form.getAll("city").map(String),
    startDay: String(form.get("startDay") ?? ""),
    endDay: String(form.get("endDay") ?? ""),
  };
}

export async function createMemoryAction(_state: FormState, form: FormData): Promise<FormState> {
  let id = "";
  const state = await save(async () => {
    id = (await createMemory(storage(), readMemoryForm(form))).id;
  });
  if (!state.saved) return state;
  redirect(`/admin/memories/${id}?salvato=1`);
}

export async function updateMemoryAction(id: string, _state: FormState, form: FormData): Promise<FormState> {
  return save(() => updateMemory(storage(), id, readMemoryForm(form)));
}

export async function deleteMemoryAction(id: string): Promise<void> {
  await remove(() => deleteMemory(storage(), id));
  redirect("/admin");
}

export async function deleteMediaAction(memoryId: string, mediaId: string): Promise<void> {
  await remove(() => deleteMedia(storage(), memoryId, mediaId));
}

// Yearly occasions

function readYearlyOccasionForm(form: FormData): YearlyOccasionInput {
  const firstYear = String(form.get("firstYear") ?? "").trim();
  return {
    name: String(form.get("name") ?? ""),
    month: Number(form.get("month")),
    day: Number(form.get("day")),
    ...(firstYear && { firstYear: Number(firstYear) }),
    theme: String(form.get("theme") ?? ""),
  };
}

export async function createYearlyOccasionAction(_state: FormState, form: FormData): Promise<FormState> {
  return save(() => createYearlyOccasion(storage(), readYearlyOccasionForm(form)));
}

export async function updateYearlyOccasionAction(id: string, _state: FormState, form: FormData): Promise<FormState> {
  return save(() => updateYearlyOccasion(storage(), id, readYearlyOccasionForm(form)));
}

export async function deleteYearlyOccasionAction(id: string): Promise<void> {
  await remove(() => deleteYearlyOccasion(storage(), id));
}

// One-off occasions

export async function addOneOffOccasionAction(memoryId: string, _state: FormState, form: FormData): Promise<FormState> {
  return save(() =>
    addOneOffOccasion(storage(), memoryId, {
      name: String(form.get("name") ?? ""),
      day: String(form.get("day") ?? ""),
      theme: String(form.get("theme") ?? ""),
    }),
  );
}

/**
 * Chooses a Memory's Main occasion from the selector's value, `kind:id`
 * (e.g. `yearly:natale`); an empty value goes back to automatic.
 */
export async function chooseMainOccasionAction(memoryId: string, value: string): Promise<FormState> {
  const separator = value.indexOf(":");
  const kind = value.slice(0, separator);
  const ref: MainOccasionRef | undefined =
    kind === "yearly" || kind === "one-off" ? { kind, id: value.slice(separator + 1) } : undefined;
  return save(() => chooseMainOccasion(storage(), memoryId, ref));
}

export async function deleteOneOffOccasionAction(memoryId: string, occasionId: string): Promise<void> {
  await remove(() => deleteOneOffOccasion(storage(), memoryId, occasionId));
}

// Layout and cover

export async function saveLayoutAction(memoryId: string, cells: Record<string, MediaCell>): Promise<FormState> {
  return save(() => saveLayout(storage(), memoryId, cells));
}

/** Chooses the cover, or with no Media id goes back to the default cover. */
export async function chooseCoverAction(memoryId: string, mediaId: string | undefined): Promise<FormState> {
  return save(() => chooseCover(storage(), memoryId, mediaId));
}
