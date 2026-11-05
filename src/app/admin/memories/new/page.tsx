import Link from "next/link";
import { MemoryForm } from "@/components/admin/MemoryForm";
import { adminPage, adminTitle, backLink } from "@/components/ui";
import { getGallery, suggestCities } from "@/gallery";
import { t } from "@/strings";
import { createMemoryAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function NewMemoryPage() {
  const citySuggestions = await suggestCities(getGallery().storage);

  return (
    <main className={adminPage}>
      <Link href="/admin" className={backLink}>
        ← {t.admin.backToAdmin}
      </Link>
      <h1 className={adminTitle}>{t.admin.newMemory}</h1>
      <MemoryForm action={createMemoryAction} citySuggestions={citySuggestions} />
    </main>
  );
}
