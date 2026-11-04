"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createMemory,
  deleteMedia,
  deleteMemory,
  GalleryError,
  getGallery,
  updateMemory,
  type MemoryInput,
} from "@/gallery";
import { t } from "@/strings";
import { requireSession } from "../require-session";

/** What the Memory form shows after saving: an Italian error, or that it was saved. */
export type MemoryFormState = { error?: string; saved?: boolean };

function readMemoryForm(form: FormData): MemoryInput {
  return {
    title: String(form.get("title") ?? ""),
    note: String(form.get("note") ?? ""),
    cities: form.getAll("city").map(String),
    startDay: String(form.get("startDay") ?? ""),
    endDay: String(form.get("endDay") ?? ""),
  };
}

/** Turns a broken gallery rule into a message for the form; anything else is rethrown. */
function failure(error: unknown): MemoryFormState {
  if (error instanceof GalleryError) return { error: error.message };
  console.error(error);
  return { error: t.admin.unexpectedError };
}

export async function createMemoryAction(
  _state: MemoryFormState,
  form: FormData,
): Promise<MemoryFormState> {
  await requireSession();
  let id: string;
  try {
    id = (await createMemory(getGallery().storage, readMemoryForm(form))).id;
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/", "layout");
  redirect(`/admin/memories/${id}?salvato=1`);
}

export async function updateMemoryAction(
  id: string,
  _state: MemoryFormState,
  form: FormData,
): Promise<MemoryFormState> {
  await requireSession();
  try {
    await updateMemory(getGallery().storage, id, readMemoryForm(form));
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/", "layout");
  return { saved: true };
}

export async function deleteMemoryAction(id: string): Promise<void> {
  await requireSession();
  await deleteMemory(getGallery().storage, id);
  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function deleteMediaAction(memoryId: string, mediaId: string): Promise<void> {
  await requireSession();
  await deleteMedia(getGallery().storage, memoryId, mediaId);
  revalidatePath("/", "layout");
}
