import { formatDateRange } from "./format";

/** Adding, showing and deleting Media. */
export const media = {
  unsupported: (fileName: string) => `«${fileName}» non è una foto che la galleria sa leggere.`,
  conversionFailed: (fileName: string) => `Non è stato possibile convertire «${fileName}».`,
  notFound: "Questa foto non esiste più.",
  noFiles: "Scegli almeno una foto.",
  photoAlt: (position: number) => `Foto ${position}`,

  // Admin page
  heading: "Foto",
  addPhotos: "Aggiungi foto",
  uploading: (percent: number) => `Caricamento… ${percent}%`,
  processing: "Conversione delle foto…",
  uploadFailed: "Il caricamento non è riuscito. Riprova.",
  noMedia: "Questo ricordo non ha ancora foto.",
  outsideDateRange: "Scattata fuori dalle date del ricordo",
  suggestedDateRange: (startDay: string, endDay: string) =>
    `Date suggerite dalle foto: ${formatDateRange(startDay, endDay)}`,
  useSuggestedDateRange: "Usa queste date",
  deletePhoto: "Elimina foto",
  deleteConfirm: "Eliminare questa foto? Non si può annullare.",
};
