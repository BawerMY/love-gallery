import { safeNextPath } from "@/routes";
import { t } from "@/strings";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; errore?: string }>;
}) {
  const { next, errore } = await searchParams;

  return (
    <main className="login">
      <h1>{t.login.title}</h1>
      <p>{t.login.intro}</p>
      <form method="post" action="/api/session">
        <input type="hidden" name="next" value={safeNextPath(next)} />
        <label htmlFor="password">{t.login.passwordLabel}</label>
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
            {t.login.wrongPassword}
          </p>
        ) : null}
        <button type="submit">{t.login.submit}</button>
      </form>
    </main>
  );
}
