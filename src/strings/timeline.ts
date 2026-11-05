export const timeline = {
  empty: "Nessun ricordo ancora",
  daysApart: (days: number) => `${days} ${days === 1 ? "giorno" : "giorni"} di distanza`,
  coverPlaceholder: "Copertina in arrivo",
  untitled: "Ricordo senza titolo",
  /** The rail marker, read whole: e.g. "marzo 2025". */
  monthMarker: (month: string, year: string) => `${month} ${year}`,
};
