/** Adding, showing and deleting Media. */
export const media = {
  unsupported: (fileName: string) => `«${fileName}» non è una foto che la galleria sa leggere.`,
  conversionFailed: (fileName: string) => `Non è stato possibile convertire «${fileName}».`,
  notFound: "Questa foto non esiste più.",
  noFiles: "Scegli almeno una foto.",
  uploadFailed: "Il caricamento non è riuscito. Riprova.",
  photoAlt: (position: number) => `Foto ${position}`,
};
