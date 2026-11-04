import { safeNextPath } from "@/routes";
import { t } from "@/strings";

/** The password screen, where the Gallery password is entered. */
export default async function PasswordScreenPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; errore?: string; attesa?: string }>;
}) {
  const { next, errore, attesa } = await searchParams;
  const waitSeconds = Math.max(0, Math.floor(Number(attesa) || 0));
  const message = waitSeconds
    ? t.passwordScreen.tooManyAttempts(waitSeconds)
    : errore
      ? t.passwordScreen.wrongPassword
      : undefined;

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
        {message ? (
          <p role="alert" className="error">
            {message}
          </p>
        ) : null}
        <button type="submit">{t.passwordScreen.submit}</button>
      </form>
    </main>
  );
}
