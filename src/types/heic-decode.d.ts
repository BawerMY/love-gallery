declare module "heic-decode" {
  type DecodedImage = { width: number; height: number; data: Uint8ClampedArray };
  /** Decodes the main image of a HEIC file into RGBA pixels. */
  function decode(input: { buffer: ArrayBufferLike | Uint8Array }): Promise<DecodedImage>;
  export default decode;
}
