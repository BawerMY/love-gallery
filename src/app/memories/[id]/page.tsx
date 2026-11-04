import Link from "next/link";
import { notFound } from "next/navigation";
import { MemoryGrid } from "@/components/memory/MemoryGrid";
import { MemoryHeader } from "@/components/memory/MemoryHeader";
import { VideoPlaybackProvider } from "@/components/memory/playback";
import { getGallery, getMemory, listYearlyOccasions, occasionsOfMemory } from "@/gallery";
import { t } from "@/strings";

export const dynamic = "force-dynamic";

/** One Memory: its header, then its Media in the Layout. */
export default async function MemoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { storage } = getGallery();
  const memory = await getMemory(storage, id);
  if (!memory) notFound();
  const occasions = occasionsOfMemory(memory, await listYearlyOccasions(storage));

  return (
    <main className="memory">
      <Link href="/" className="back-link">
        ← {t.memory.backToTimeline}
      </Link>
      <MemoryHeader memory={memory} occasions={occasions} />
      <VideoPlaybackProvider>
        <MemoryGrid memory={memory} />
      </VideoPlaybackProvider>
    </main>
  );
}
