import { safeNextPath } from "@/routes";
import { t } from "@/strings";

export default async function PasswordScreenPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; errore?: string }>;
}) {
  const { next, errore } = await searchParams;

  return (
    <main className="password-screen">
      <h1>{t.passwordScreen.title}</h1>
      <p>{t.passwordScreen.intro}</p>
      <form method="post" action="/api/session">
        <input type="hidden" name="next" value={safeNextPath(next)} />
        <label htmlFor="password">{t.passwordScreen.passwordLabel}</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
        />
        {errore ? (
          <p role="alert" className="error">
            {t.passwordScreen.wrongPassword}
          </p>
        ) : null}
        <button type="submit">{t.passwordScreen.submit}</button>
      </form>
    </main>
  );
}
