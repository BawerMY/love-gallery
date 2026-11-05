import Link from "next/link";
import { AdminMemoryList } from "@/components/admin/AdminMemoryList";
import { OccasionsSection } from "@/components/occasions/OccasionsSection";
import { adminCard, adminHeading, adminPage, adminTitle, backLink, button } from "@/components/ui";
import { getGallery, listOccasions, listTimeline } from "@/gallery";
import { t } from "@/strings";

export const dynamic = "force-dynamic";

/** The Admin page: every Memory, the way to add one, and the list of Occasions. */
export default async function AdminPage() {
  const { storage } = getGallery();
  const [memories, occasions] = await Promise.all([listTimeline(storage), listOccasions(storage)]);

  return (
    <main className={adminPage}>
      <Link href="/" className={backLink}>
        ← {t.admin.backToTimeline}
      </Link>
      <h1 className={adminTitle}>{t.admin.title}</h1>
      <section aria-labelledby="memories-heading" className={adminCard}>
        <div className="flex items-center justify-between gap-3">
          <h2 id="memories-heading" className={adminHeading}>
            {t.admin.memoriesHeading}
          </h2>
          <Link href="/admin/memories/new" className={button}>
            {t.admin.newMemory}
          </Link>
        </div>
        <AdminMemoryList memories={memories} />
      </section>
      <OccasionsSection occasions={occasions} memories={memories} />
    </main>
  );
}
