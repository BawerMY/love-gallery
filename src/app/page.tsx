import { Timeline } from "@/components/timeline/Timeline";
import { TopBar } from "@/components/TopBar";
import { getGallery, listTimeline, listOccasions } from "@/gallery";
import { page } from "@/components/ui";
import { t } from "@/strings";

export const dynamic = "force-dynamic";

/** The Timeline: every Memory, oldest at the top. */
export default async function TimelinePage() {
  const { storage } = getGallery();
  const [memories, occasions] = await Promise.all([
    listTimeline(storage),
    listOccasions(storage),
  ]);

  return (
    <>
      <TopBar />
      <main className={page}>
        {memories.length === 0 ? (
          <p className="mt-[40vh] text-center text-cocoa-soft">{t.timeline.empty}</p>
        ) : (
          <Timeline memories={memories} occasions={occasions} />
        )}
      </main>
    </>
  );
}
