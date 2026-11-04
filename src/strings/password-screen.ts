export const passwordScreen = {
  title: "La nostra galleria",
  intro: "Inserisci la password per entrare.",
  passwordLabel: "Password",
  submit: "Entra",
  wrongPassword: "Password sbagliata. Riprova.",
  /** After too many wrong passwords in a row. */
  tooManyAttempts: (seconds: number) => {
    const wait =
      seconds < 60
        ? `${seconds} ${seconds === 1 ? "secondo" : "secondi"}`
        : `${Math.ceil(seconds / 60)} ${Math.ceil(seconds / 60) === 1 ? "minuto" : "minuti"}`;
    return `Troppi tentativi sbagliati. Riprova tra ${wait}.`;
  },
};
