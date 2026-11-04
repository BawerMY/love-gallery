/** Arranging a Memory's Media and choosing its cover. */
export const layout = {
  // Rules
  outOfBounds: "Una foto esce dalla griglia: deve stare nelle 3 colonne.",
  overlap: "Due foto si sovrappongono. Spostane una in celle libere.",
  unknownMedia: "Una delle foto non esiste più. Ricarica la pagina.",
  coverNotReady: "Questa foto non può essere la copertina.",

  // Admin page
  heading: "Disposizione",
  hint: "Trascina ✥ per spostare una foto e ◢ per cambiarne la misura.",
  move: (position: number) => `Sposta foto ${position}`,
  resize: (position: number) => `Ridimensiona foto ${position}`,
  tile: (position: number, cell: { column: number; row: number; width: number; height: number }) =>
    `Foto ${position}, ${cell.width}×${cell.height}, colonna ${cell.column + 1}, riga ${cell.row + 1}`,
  save: "Salva disposizione",
  saving: "Salvataggio…",
  saved: "Disposizione salvata.",
  unsaved: "Modifiche non salvate.",
  notReady: "In preparazione",
  makeCover: (position: number) => `Usa foto ${position} come copertina`,
  defaultCover: "Copertina automatica",
  noMedia: "Aggiungi delle foto per disporle.",
};
