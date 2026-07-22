import { isAcceptedImage } from "./accepted-formats";

// A user-selected image plus the object URL used to preview it. The URL is
// created with URL.createObjectURL and MUST be revoked (releaseSelectedImage)
// when the item leaves the list, otherwise the blob stays in memory for the
// whole session.
export interface SelectedImage {
  id: string;
  file: File;
  url: string;
}

export interface PartitionResult {
  accepted: File[];
  /** File names the tool cannot decode, surfaced to the user as feedback. */
  rejectedNames: string[];
}

/**
 * Split an incoming batch into images the tool accepts and the rest. Pure and
 * URL-free so it is trivially unit-testable; URL creation happens separately
 * in createSelectedImage.
 */
export function partitionAcceptedFiles(files: readonly File[]): PartitionResult {
  const accepted: File[] = [];
  const rejectedNames: string[] = [];
  for (const file of files) {
    if (isAcceptedImage(file)) {
      accepted.push(file);
    } else {
      rejectedNames.push(file.name);
    }
  }
  return { accepted, rejectedNames };
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for environments without the Web Crypto API (e.g. some test
  // runners): still unique enough to key a list of in-session selections.
  return `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function createSelectedImage(file: File): SelectedImage {
  return { id: newId(), file, url: URL.createObjectURL(file) };
}

export function releaseSelectedImage(item: SelectedImage): void {
  URL.revokeObjectURL(item.url);
}
