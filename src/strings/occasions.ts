import { LOCALE } from "./format";

const monthName = new Intl.DateTimeFormat(LOCALE, { month: "long", timeZone: "UTC" });
const dayMonth = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long", timeZone: "UTC" });

/** Occasions: their badges and the Yearly occasions section of the Admin page. */
export const occasions = {
  /** "gennaio" to "dicembre", for months 1 to 12. */
  monthNames: Array.from({ length: 12 }, (_, index) => monthName.format(Date.UTC(2024, index, 1))),
  /** E.g. "14 febbraio". 2024 is a leap year, so 29 February works too. */
  dayMonth: (month: number, day: number) => dayMonth.format(Date.UTC(2024, month - 1, day)),
  /** A badge: the name, numbered when the Yearly occasion has passed its first year. */
  badge: (name: string, number?: number) => (number ? `${number}° ${name}` : name),
  badgesLabel: "Ricorrenze",
  yearlyHeading: "Ricorrenze annuali",
  noYearly: "Non hai ancora aggiunto nessuna ricorrenza annuale.",
  newYearly: "Nuova ricorrenza annuale",
  editYearly: (name: string) => `Modifica «${name}»`,
  nameLabel: "Nome",
  dayLabel: "Giorno",
  monthLabel: "Mese",
  firstYearLabel: "Primo anno",
  firstYearHint: "Facoltativo: per numerarla, es. «2° anniversario»",
  add: "Aggiungi",
  save: "Salva",
  saving: "Salvataggio…",
  saved: "Ricorrenza salvata.",
  edit: "Modifica",
  cancel: "Annulla",
  delete: "Elimina",
  deleteConfirm: (name: string) => `Eliminare la ricorrenza «${name}» da tutti i ricordi?`,
  sinceYear: (year: number) => `dal ${year}`,
  deleteLabel: (name: string) => `Elimina «${name}»`,
  noName: "Dai un nome alla ricorrenza.",
  invalidDay: "Scegli un giorno e un mese che esistono.",
  invalidFirstYear: "Il primo anno non è valido.",
  notFound: "Questa ricorrenza non esiste più.",
  themeLabel: "Tema",
  unknownTheme: "Scegli uno dei temi della lista.",
  oneOffHeading: "Ricorrenze di questo ricordo",
  mainOccasionLabel: "Occasione principale",
  mainOccasionHint: "Dà il suo tema al ricordo",
  mainOccasionAutomatic: "Automatica",
  mainOccasionSaved: "Occasione principale salvata.",
  noOneOff: "Questo ricordo non ha ricorrenze proprie.",
  newOneOff: "Nuova ricorrenza del ricordo",
  oneOffDayLabel: "Data",
  oneOffDeleteConfirm: (name: string) => `Eliminare la ricorrenza «${name}» da questo ricordo?`,
  oneOffOutsideRange: "Scegli un giorno compreso nelle date del ricordo.",
  rangeExcludesOneOff: (name: string) =>
    `La ricorrenza «${name}» resterebbe fuori dalle nuove date. Spostala o eliminala prima.`,
};
