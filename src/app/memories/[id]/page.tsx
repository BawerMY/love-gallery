import Link from "next/link";
import { notFound } from "next/navigation";
import { MemoryGrid } from "@/components/memory/MemoryGrid";
import { MemoryHeader } from "@/components/memory/MemoryHeader";
import { VideoPlaybackProvider } from "@/components/memory/playback";
import { TopBar } from "@/components/TopBar";
import { backLink, page } from "@/components/ui";
import { getGallery, getMemory, listYearlyOccasions, occasionsOfMemory, themeOfMemory } from "@/gallery";
import { t } from "@/strings";

export const dynamic = "force-dynamic";

/** One Memory: its header, then its Media in the Layout. */
export default async function MemoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { storage } = getGallery();
  const memory = await getMemory(storage, id);
  if (!memory) notFound();
  const yearlyOccasions = await listYearlyOccasions(storage);
  const occasions = occasionsOfMemory(memory, yearlyOccasions);
  const { theme: themeKey } = themeOfMemory(memory, yearlyOccasions);

  return (
    <>
      <TopBar />
      <main className={page}>
        <Link href="/" className={backLink}>
          ← {t.memory.backToTimeline}
        </Link>
        <MemoryHeader memory={memory} occasions={occasions} themeKey={themeKey} />
        <VideoPlaybackProvider>
          <MemoryGrid memory={memory} />
        </VideoPlaybackProvider>
      </main>
    </>
  );
}
