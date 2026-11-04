"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createMemory,
  deleteMemory,
  GalleryError,
  getGallery,
  updateMemory,
  type MemoryInput,
} from "@/gallery";
import { t } from "@/strings";
import { requireSession } from "../require-session";
import {
  addOneOffOccasion,
  createYearlyOccasion,
  deleteOneOffOccasion,
  deleteYearlyOccasion,
  updateYearlyOccasion,
  type YearlyOccasionInput,
} from "@/gallery";

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

// Yearly occasions

/** What a Yearly occasion form shows after saving: an Italian error, or that it was saved. */
export type YearlyOccasionFormState = { error?: string; saved?: boolean };

function readYearlyOccasionForm(form: FormData): YearlyOccasionInput {
  const firstYear = String(form.get("firstYear") ?? "").trim();
  return {
    name: String(form.get("name") ?? ""),
    month: Number(form.get("month")),
    day: Number(form.get("day")),
    ...(firstYear && { firstYear: Number(firstYear) }),
  };
}

export async function createYearlyOccasionAction(
  _state: YearlyOccasionFormState,
  form: FormData,
): Promise<YearlyOccasionFormState> {
  await requireSession();
  try {
    await createYearlyOccasion(getGallery().storage, readYearlyOccasionForm(form));
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/", "layout");
  return { saved: true };
}

export async function updateYearlyOccasionAction(
  id: string,
  _state: YearlyOccasionFormState,
  form: FormData,
): Promise<YearlyOccasionFormState> {
  await requireSession();
  try {
    await updateYearlyOccasion(getGallery().storage, id, readYearlyOccasionForm(form));
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/", "layout");
  return { saved: true };
}

export async function deleteYearlyOccasionAction(id: string): Promise<void> {
  await requireSession();
  await deleteYearlyOccasion(getGallery().storage, id);
  revalidatePath("/", "layout");
}

// One-off occasions

export async function addOneOffOccasionAction(
  memoryId: string,
  _state: YearlyOccasionFormState,
  form: FormData,
): Promise<YearlyOccasionFormState> {
  await requireSession();
  try {
    await addOneOffOccasion(getGallery().storage, memoryId, {
      name: String(form.get("name") ?? ""),
      day: String(form.get("day") ?? ""),
    });
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/", "layout");
  return { saved: true };
}

export async function deleteOneOffOccasionAction(memoryId: string, occasionId: string): Promise<void> {
  await requireSession();
  await deleteOneOffOccasion(getGallery().storage, memoryId, occasionId);
  revalidatePath("/", "layout");
}
