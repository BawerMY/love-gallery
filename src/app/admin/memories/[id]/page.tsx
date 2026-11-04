import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteMemoryButton } from "@/components/admin/DeleteMemoryButton";
import { MemoryForm } from "@/components/admin/MemoryForm";
import { getGallery, getMemory, suggestCities } from "@/gallery";
import { t } from "@/strings";
import { updateMemoryAction } from "../../actions";

export const dynamic = "force-dynamic";

/**
 * The Admin page for one Memory. Its details come first; Media, Layout and
 * One-off occasions get their own sections below in later tickets.
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
        />
      </section>
      <section className="danger-zone">
        <DeleteMemoryButton memoryId={memory.id} />
      </section>
    </main>
  );
}
