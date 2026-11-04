import Link from "next/link";
import { AdminMemoryList } from "@/components/admin/AdminMemoryList";
import { YearlyOccasionsSection } from "@/components/occasions/YearlyOccasionsSection";
import { getGallery, listTimeline, listYearlyOccasions } from "@/gallery";
import { t } from "@/strings";

export const dynamic = "force-dynamic";

/** The Admin page: every Memory, and the way to add one. */
export default async function AdminPage() {
  const { storage } = getGallery();
  const [memories, yearlyOccasions] = await Promise.all([
    listTimeline(storage),
    listYearlyOccasions(storage),
  ]);

  return (
    <main className="admin">
      <Link href="/" className="back-link">
        ← {t.admin.backToTimeline}
      </Link>
      <h1>{t.admin.title}</h1>
      <section>
        <div className="section-heading">
          <h2>{t.admin.memoriesHeading}</h2>
          <Link href="/admin/memories/new" className="button">
            {t.admin.newMemory}
          </Link>
        </div>
        <AdminMemoryList memories={memories} />
      </section>
      <YearlyOccasionsSection occasions={yearlyOccasions} />
    </main>
  );
}
