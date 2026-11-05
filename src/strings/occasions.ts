/** Occasions: their badges, the "Occasioni" section of the Admin page and a Memory's Occasions. */
export const occasions = {
  badgesLabel: "Ricorrenze",
  heading: "Occasioni",
  none: "Non hai ancora aggiunto nessuna occasione.",
  newOccasion: "Nuova occasione",
  editOccasion: (name: string) => `Modifica «${name}»`,
  nameLabel: "Nome",
  add: "Aggiungi",
  save: "Salva",
  saving: "Salvataggio…",
  saved: "Occasione salvata.",
  edit: "Modifica",
  cancel: "Annulla",
  delete: "Elimina",
  deleteLabel: (name: string) => `Elimina «${name}»`,
  /** The confirmation before deleting an Occasion from the list, naming how many Memories have it. */
  deleteConfirm: (name: string, memories: number) =>
    memories === 0
      ? `Eliminare l'occasione «${name}»? Nessun ricordo la usa.`
      : memories === 1
        ? `Eliminare l'occasione «${name}»? Verrà tolta da 1 ricordo.`
        : `Eliminare l'occasione «${name}»? Verrà tolta da ${memories} ricordi.`,
  noName: "Dai un nome all'occasione.",
  duplicateName: (name: string) => `C'è già un'occasione chiamata «${name}».`,
  notFound: "Questa occasione non esiste più.",
  notOnMemory: "Questo ricordo non ha questa occasione.",
  alreadyOnMemory: "Questo ricordo ha già questa occasione.",
  themeLabel: "Tema",
  unknownTheme: "Scegli uno dei temi della lista.",
  memoryHeading: "Occasioni di questo ricordo",
  memoryNone: "Questo ricordo non ha ancora occasioni.",
  pickLabel: "Aggiungi un'occasione",
  pickPlaceholder: "Scegli un'occasione…",
  pickNoneLeft: "Questo ricordo ha già tutte le occasioni della lista.",
  pickListEmpty: "La lista delle occasioni è vuota: creane una qui sotto.",
  createOnMemory: "Crea",
  remove: "Togli",
  removeLabel: (name: string) => `Togli «${name}»`,
  move: (name: string) => `Sposta «${name}»`,
  orderHint: "Trascina ⠿ per cambiare l'ordine dei badge: il primo conta di più.",
  orderSaved: "Ordine salvato",
  orderOutdated: "L'ordine delle occasioni è cambiato nel frattempo: ricarica la pagina e riprova.",
  mainOccasionLabel: "Occasione principale",
  mainOccasionHint: "Dà il suo tema al ricordo",
  mainOccasionAutomatic: "Automatica",
  mainOccasionSaved: "Occasione principale salvata.",
  mainOccasionNeutroRefused: "Un'occasione con tema Neutro non può dare il tema al ricordo.",
};
