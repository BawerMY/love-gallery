import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminMediaList } from "@/components/admin/AdminMediaList";
import { DeleteMemoryButton } from "@/components/admin/DeleteMemoryButton";
import { LayoutSection } from "@/components/layout/LayoutSection";
import { MediaUpload } from "@/components/admin/MediaUpload";
import { MemoryForm } from "@/components/admin/MemoryForm";
import { MainOccasionSelect } from "@/components/occasions/MainOccasionSelect";
import { MemoryOccasionsSection } from "@/components/occasions/MemoryOccasionsSection";
import { adminHeading, adminPage, adminTitle, backLink } from "@/components/ui";
import {
  getGallery,
  getMemory,
  listOccasions,
  occasionsOfMemory,
  suggestCities,
  suggestDateRange,
} from "@/gallery";
import { t } from "@/strings";
import { updateMemoryAction } from "../../actions";

export const dynamic = "force-dynamic";

/**
 * The Admin page for one Memory. Its details (and its Main occasion) come first, then its Media,
 * then its Layout (with the cover) and its Occasions.
 */
export default async function EditMemoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ salvato?: string }>;
}) {
  const { id } = await params;
  const { salvato } = await searchParams;
  const { storage } = getGallery();
  const memory = await getMemory(storage, id);
  if (!memory) notFound();
  const [citySuggestions, occasions] = await Promise.all([suggestCities(storage), listOccasions(storage)]);

  return (
    <main className={adminPage}>
      <Link href="/admin" className={backLink}>
        ← {t.admin.backToAdmin}
      </Link>
      <h1 className={adminTitle}>{t.admin.editMemory}</h1>
      <section>
        <MemoryForm
          key={memory.id}
          memory={memory}
          action={updateMemoryAction.bind(null, memory.id)}
          citySuggestions={citySuggestions}
          saved={salvato === "1"}
          suggestedRange={suggestDateRange(memory.media)}
        />
        {/* Keyed by the Memory's Occasions, so it restarts when they change. */}
        <MainOccasionSelect
          key={memory.occasionIds.join()}
          memory={memory}
          occasions={occasionsOfMemory(memory, occasions)}
        />
      </section>
      <section className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className={adminHeading}>{t.media.heading}</h2>
          <MediaUpload memoryId={memory.id} />
        </div>
        <AdminMediaList memory={memory} />
      </section>
      <LayoutSection memory={memory} />
      <MemoryOccasionsSection memory={memory} occasions={occasions} />
      <section className="mt-8 border-t border-cocoa/15 pt-4">
        <DeleteMemoryButton memoryId={memory.id} />
      </section>
    </main>
  );
}
