import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminMediaList } from "@/components/admin/AdminMediaList";
import { DeleteMemoryButton } from "@/components/admin/DeleteMemoryButton";
import { MediaUpload } from "@/components/admin/MediaUpload";
import { MemoryForm } from "@/components/admin/MemoryForm";
import { OneOffOccasionsSection } from "@/components/occasions/OneOffOccasionsSection";
import { getGallery, getMemory, suggestCities, suggestDateRange } from "@/gallery";
import { t } from "@/strings";
import { updateMemoryAction } from "../../actions";

export const dynamic = "force-dynamic";

/**
 * The Admin page for one Memory. Its details come first, then its Media;
 * Layout and One-off occasions get their own sections below in later tickets.
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
  const citySuggestions = await suggestCities(storage);

  return (
    <main className="admin">
      <Link href="/admin" className="back-link">
        ← {t.admin.backToAdmin}
      </Link>
      <h1>{t.admin.editMemory}</h1>
      <section>
        <MemoryForm
          key={memory.id}
          memory={memory}
          action={updateMemoryAction.bind(null, memory.id)}
          citySuggestions={citySuggestions}
          saved={salvato === "1"}
          suggestedRange={suggestDateRange(memory.media)}
        />
      </section>
      <section className="admin-media">
        <div className="section-heading">
          <h2>{t.media.heading}</h2>
          <MediaUpload memoryId={memory.id} />
        </div>
        <AdminMediaList memory={memory} />
      </section>
      <OneOffOccasionsSection memory={memory} />
      <section className="danger-zone">
        <DeleteMemoryButton memoryId={memory.id} />
      </section>
    </main>
  );
}
