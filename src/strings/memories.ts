export const memories = {
  notFound: "Questo ricordo non esiste più.",
  noCity: "Aggiungi almeno una città.",
  invalidDay: "Inserisci date valide.",
  endBeforeStart: "L'ultimo giorno non può venire prima del primo.",
  overlaps: (other: string) => `Le date si sovrappongono a «${other}». Scegli altri giorni.`,
};
