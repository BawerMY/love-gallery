import { Timeline } from "@/components/timeline/Timeline";
import { getGallery, listTimeline, listYearlyOccasions } from "@/gallery";
import { page } from "@/components/ui";
import { t } from "@/strings";

export const dynamic = "force-dynamic";

/** The Timeline: every Memory, oldest at the top. */
export default async function TimelinePage() {
  const { storage } = getGallery();
  const [memories, yearlyOccasions] = await Promise.all([
    listTimeline(storage),
    listYearlyOccasions(storage),
  ]);

  return (
    <main className={page}>
      {memories.length === 0 ? (
        <p className="mt-[40vh] text-center text-cocoa-soft">{t.timeline.empty}</p>
      ) : (
        <Timeline memories={memories} yearlyOccasions={yearlyOccasions} />
      )}
    </main>
  );
}
