import { notFound } from "next/navigation";
import { DeleteMemoryButton } from "@/components/admin/DeleteMemoryButton";
import { MemoryDetails } from "@/components/admin/MemoryDetails";
import { MemoryDraftProvider } from "@/components/admin/MemoryDraft";
import { LeaveLink, SaveBar } from "@/components/admin/SaveBar";
import { LayoutSection } from "@/components/layout/LayoutSection";
import { MemoryOccasionsSection } from "@/components/occasions/MemoryOccasionsSection";
import { adminCard, adminPage, adminTitle, backLink } from "@/components/ui";
import { getGallery, getMemory, listOccasions, suggestCities, suggestDateRange } from "@/gallery";
import { t } from "@/strings";

export const dynamic = "force-dynamic";

/**
 * The Admin page for one Memory: its details (with its Main occasion), its
 * Occasions, its Galleria (Media, Layout and cover), then the delete. Every
 * edit but uploading and deleting Media waits for the one Save in the bar at
 * the bottom.
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
    // Keyed by the Memory, so another Memory's page starts with no draft.
    <MemoryDraftProvider key={memory.id} memory={memory} occasions={occasions} saved={salvato === "1"}>
      <main className={`${adminPage} pb-32`}>
        <LeaveLink href="/admin" className={backLink}>
          ← {t.admin.backToAdmin}
        </LeaveLink>
        <h1 className={adminTitle}>{t.admin.editMemory}</h1>
        <MemoryDetails citySuggestions={citySuggestions} suggestedRange={suggestDateRange(memory.media)} />
        <MemoryOccasionsSection occasions={occasions} />
        <LayoutSection memory={memory} />
        <section className={adminCard}>
          <DeleteMemoryButton memoryId={memory.id} />
        </section>
      </main>
      <SaveBar />
    </MemoryDraftProvider>
  );
}
