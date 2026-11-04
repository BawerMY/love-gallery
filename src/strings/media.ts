import { formatDateRange } from "./format";

/** Adding, showing and deleting Media. */
export const media = {
  unsupported: (fileName: string) => `«${fileName}» non è una foto o un video che la galleria sa leggere.`,
  conversionFailed: (fileName: string) => `Non è stato possibile convertire «${fileName}».`,
  notFound: "Questa foto non esiste più.",
  noFiles: "Scegli almeno una foto o un video.",
  photoAlt: (position: number) => `Foto ${position}`,
  videoAlt: (position: number) => `Video ${position}`,

  // Admin page
  heading: "Foto e video",
  addPhotos: "Aggiungi foto e video",
  uploading: (percent: number) => `Caricamento… ${percent}%`,
  processing: "Conversione delle foto…",
  uploadFailed: "Il caricamento non è riuscito. Riprova.",
  noMedia: "Questo ricordo non ha ancora foto né video.",
  outsideDateRange: "Scattata fuori dalle date del ricordo",
  suggestedDateRange: (startDay: string, endDay: string) =>
    `Date suggerite dalle foto: ${formatDateRange(startDay, endDay)}`,
  useSuggestedDateRange: "Usa queste date",
  deletePhoto: "Elimina foto",
  deleteConfirm: "Eliminare questa foto? Non si può annullare.",
  deleteVideo: "Elimina video",
  deleteVideoConfirm: "Eliminare questo video? Non si può annullare.",
  /** A video waiting for its conversion, or being converted, in the background. */
  itemProcessing: "In elaborazione…",
  itemFailed: "Conversione non riuscita",
};
