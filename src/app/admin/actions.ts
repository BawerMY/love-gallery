"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createMemory,
  createOccasion,
  deleteMedia,
  deleteMemory,
  deleteOccasion,
  GalleryError,
  getGallery,
  saveMemoryEdits,
  updateOccasion,
  type MemoryEdits,
  type MemoryInput,
  type OccasionInput,
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

/**
 * Saves every edit of a Memory's Admin page at once (see `saveMemoryEdits`):
 * all of it, or on any refusal none of it.
 */
export async function saveMemoryEditsAction(id: string, edits: MemoryEdits): Promise<FormState> {
  return save(() => saveMemoryEdits(storage(), id, edits));
}

export async function deleteMemoryAction(id: string): Promise<void> {
  await remove(() => deleteMemory(storage(), id));
  redirect("/admin");
}

export async function deleteMediaAction(memoryId: string, mediaId: string): Promise<void> {
  await remove(() => deleteMedia(storage(), memoryId, mediaId));
}

// Occasions

function readOccasionForm(form: FormData): OccasionInput {
  return { name: String(form.get("name") ?? ""), theme: String(form.get("theme") ?? "") };
}

export async function createOccasionAction(_state: FormState, form: FormData): Promise<FormState> {
  return save(() => createOccasion(storage(), readOccasionForm(form)));
}

export async function updateOccasionAction(id: string, _state: FormState, form: FormData): Promise<FormState> {
  return save(() => updateOccasion(storage(), id, readOccasionForm(form)));
}

export async function deleteOccasionAction(id: string): Promise<void> {
  await remove(() => deleteOccasion(storage(), id));
}
