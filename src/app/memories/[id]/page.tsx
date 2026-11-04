import Link from "next/link";
import { notFound } from "next/navigation";
import { MemoryHeader } from "@/components/memory/MemoryHeader";
import { getGallery, getMemory } from "@/gallery";
import { t } from "@/strings";

export const dynamic = "force-dynamic";

/** One Memory: its header, then (from later tickets) its Media in the Layout. */
export default async function MemoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const memory = await getMemory(getGallery().storage, id);
  if (!memory) notFound();

  return (
    <main className="memory">
      <Link href="/" className="back-link">
        ← {t.memory.backToTimeline}
      </Link>
      <MemoryHeader memory={memory} />
    </main>
  );
}
