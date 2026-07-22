import type { RgbaImage } from "./types";
import { bitmapToRgba } from "./raster";

/** Thrown when a file cannot be decoded into pixels. */
export class DecodeError extends Error {
  constructor(message: string, options?: { cause: unknown }) {
    super(message, options);
    this.name = "DecodeError";
  }
}

const HEIC_MIME_TYPES = new Set(["image/heic", "image/heif"]);
const HEIC_EXTENSIONS = new Set(["heic", "heif"]);

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

/**
 * True for iPhone HEIC/HEIF files. Browsers cannot decode these with the
 * native <img>/createImageBitmap path, and often report an empty MIME type,
 * so the extension is checked as well.
 */
export function isHeic(file: File): boolean {
  return HEIC_MIME_TYPES.has(file.type.toLowerCase()) || HEIC_EXTENSIONS.has(extensionOf(file.name));
}

// HEIC is transcoded to PNG first so the browser's own decoder can read it.
// heic2any is imported lazily: it spins up a Web Worker at module load, so
// pulling it in eagerly would break in non-worker environments and bloat the
// initial bundle for the common (non-HEIC) case.
async function toDecodableBlob(file: File): Promise<Blob> {
  if (!isHeic(file)) return file;
  try {
    const { default: heic2any } = await import("heic2any");
    const converted = await heic2any({ blob: file, toType: "image/png" });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    if (blob === undefined) {
      throw new DecodeError(`HEIC decode produced no image for ${file.name}`);
    }
    return blob;
  } catch (error) {
    if (error instanceof DecodeError) throw error;
    throw new DecodeError(`could not decode HEIC file ${file.name}`, { cause: error });
  }
}

/**
 * Decode any accepted image file (PNG/JPG/WebP, or HEIC via heic2any) into a
 * full-resolution RGBA raster. The returned image is the pristine original;
 * downscaling for inference happens separately so the final composite stays at
 * full resolution.
 */
export async function decodeImageFile(file: File): Promise<RgbaImage> {
  const source = await toDecodableBlob(file);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(source);
  } catch (error) {
    throw new DecodeError(`could not decode image ${file.name}`, { cause: error });
  }
  try {
    return bitmapToRgba(bitmap);
  } finally {
    bitmap.close();
  }
}
