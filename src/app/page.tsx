import { Timeline } from "@/components/timeline/Timeline";
import { getGallery, listTimeline } from "@/gallery";
import { t } from "@/strings";

export const dynamic = "force-dynamic";

/** The Timeline: every Memory, oldest at the top. */
export default async function TimelinePage() {
  const memories = await listTimeline(getGallery().storage);

  return (
    <main className="timeline">
      {memories.length === 0 ? (
        <p className="empty">{t.timeline.empty}</p>
      ) : (
        <Timeline memories={memories} />
      )}
    </main>
  );
}
