// The input formats the background remover accepts. HEIC (iPhone photos) is
// decoded to a canvas-friendly format with heic2any before inference (wired
// in a later step); it is accepted here because the browser's own <img>
// decoder cannot read it directly.
//
// Detection is by MIME type when the browser provides one, with an extension
// fallback: browsers frequently report an empty `type` for HEIC/HEIF, so the
// extension is the reliable signal there.

export interface AcceptedFormat {
  /** Uppercase label shown as a pill in the dropzone. */
  label: string;
  /** Lowercase file extensions (without the dot) that map to this format. */
  extensions: readonly string[];
  /** MIME types that map to this format, when the browser reports one. */
  mimeTypes: readonly string[];
}

export const ACCEPTED_FORMATS: readonly AcceptedFormat[] = [
  { label: "PNG", extensions: ["png"], mimeTypes: ["image/png"] },
  { label: "JPG", extensions: ["jpg", "jpeg"], mimeTypes: ["image/jpeg"] },
  { label: "WEBP", extensions: ["webp"], mimeTypes: ["image/webp"] },
  {
    label: "HEIC",
    extensions: ["heic", "heif"],
    mimeTypes: ["image/heic", "image/heif"],
  },
];

// `accept` attribute value for the <input type="file"> element.
export const ACCEPT_ATTRIBUTE: string = ACCEPTED_FORMATS.flatMap((format) => [
  ...format.mimeTypes,
  ...format.extensions.map((extension) => `.${extension}`),
]).join(",");

export const FORMAT_LABELS: readonly string[] = ACCEPTED_FORMATS.map((format) => format.label);

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

/**
 * True when a file matches one of the accepted image formats, by MIME type or
 * by extension. Files the tool cannot decode are rejected up front so the user
 * gets clear feedback instead of a failed conversion later.
 */
export function isAcceptedImage(file: File): boolean {
  const mime = file.type.toLowerCase();
  const extension = extensionOf(file.name);
  return ACCEPTED_FORMATS.some(
    (format) =>
      (mime !== "" && format.mimeTypes.includes(mime)) ||
      format.extensions.includes(extension),
  );
}
