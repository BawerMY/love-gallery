/** Arranging a Memory's Media and choosing its cover. */
export const layout = {
  // Rules
  outOfBounds: "Una foto esce dalla griglia: deve stare nelle 3 colonne.",
  overlap: "Due foto si sovrappongono. Spostane una in celle libere.",
  unknownMedia: "Una delle foto non esiste più. Ricarica la pagina.",
  coverNotReady: "Questa foto non può essere la copertina.",

  // Admin page
  heading: "Galleria",
  hint: "Tocca una cella vuota per aggiungere foto e video. Trascina ✥ per spostare una foto e ◢ per cambiarne la misura; ✕ la elimina.",
  move: (position: number) => `Sposta foto ${position}`,
  resize: (position: number) => `Ridimensiona foto ${position}`,
  tile: (position: number, cell: { column: number; row: number; width: number; height: number }) =>
    `Foto ${position}, ${cell.width}×${cell.height}, colonna ${cell.column + 1}, riga ${cell.row + 1}`,
  makeCover: (position: number) => `Usa foto ${position} come copertina`,
};
