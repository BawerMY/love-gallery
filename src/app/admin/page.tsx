import Link from "next/link";
import { AdminMemoryList } from "@/components/admin/AdminMemoryList";
import { YearlyOccasionsSection } from "@/components/occasions/YearlyOccasionsSection";
import { adminHeading, adminPage, adminTitle, backLink, button } from "@/components/ui";
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
    <main className={adminPage}>
      <Link href="/" className={backLink}>
        ← {t.admin.backToTimeline}
      </Link>
      <h1 className={adminTitle}>{t.admin.title}</h1>
      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className={adminHeading}>{t.admin.memoriesHeading}</h2>
          <Link href="/admin/memories/new" className={button}>
            {t.admin.newMemory}
          </Link>
        </div>
        <AdminMemoryList memories={memories} />
      </section>
      <YearlyOccasionsSection occasions={yearlyOccasions} />
    </main>
  );
}
