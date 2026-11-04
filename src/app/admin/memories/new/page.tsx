import Link from "next/link";
import { MemoryForm } from "@/components/admin/MemoryForm";
import { getGallery, suggestCities } from "@/gallery";
import { t } from "@/strings";
import { createMemoryAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function NewMemoryPage() {
  const citySuggestions = await suggestCities(getGallery().storage);

  return (
    <main className="admin">
      <Link href="/admin" className="back-link">
        ← {t.admin.backToAdmin}
      </Link>
      <h1>{t.admin.newMemory}</h1>
      <MemoryForm action={createMemoryAction} citySuggestions={citySuggestions} />
    </main>
  );
}
