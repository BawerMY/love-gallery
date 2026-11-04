import Link from "next/link";
import { AdminMemoryList } from "@/components/admin/AdminMemoryList";
import { getGallery, listTimeline } from "@/gallery";
import { t } from "@/strings";

export const dynamic = "force-dynamic";

/** The Admin page: every Memory, and the way to add one. */
export default async function AdminPage() {
  const memories = await listTimeline(getGallery().storage);

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
    </main>
  );
}
