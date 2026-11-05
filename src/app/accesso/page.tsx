import { Wordmark } from "@/components/Wordmark";
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
    <main className="mx-auto flex min-h-dvh max-w-[360px] flex-col items-center justify-center gap-2 p-4 text-center">
      <Wordmark className="text-6xl" />
      <h1 className="mt-4 text-xl font-semibold">{t.passwordScreen.title}</h1>
      <p className="text-cocoa-soft">{t.passwordScreen.intro}</p>
      <form method="post" action="/api/session" className="mt-4 flex w-full flex-col gap-3">
        <input type="hidden" name="next" value={safeNextPath(next)} />
        <label htmlFor="password" className="sr-only">
          {t.passwordScreen.passwordLabel}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder={t.passwordScreen.passwordLabel}
          required
          autoFocus
          className="rounded-full border border-cocoa/20 bg-white px-5 py-3 text-center text-cocoa placeholder:text-cocoa-soft focus:border-honey focus:outline-2 focus:outline-honey"
        />
        {message ? (
          <p role="alert" className="text-danger">
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          className="cursor-pointer rounded-full bg-honey px-5 py-3 font-bold text-cocoa shadow-soft"
        >
          {t.passwordScreen.submit}
        </button>
      </form>
    </main>
  );
}
