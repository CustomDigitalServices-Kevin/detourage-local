// Turning a rendered cutout into a file the user keeps. The filename derivation
// is pure and unit-tested; triggerDownload is the thin DOM glue that actually
// hands the blob to the browser.

/**
 * Derive the PNG filename for a cutout from the original file name: the
 * extension is swapped for `.png` (the output is always a transparent-capable
 * PNG) and a `-detoure` suffix marks it as processed. Names without an
 * extension and empty names are handled so a download is always possible.
 */
export function cutoutFileName(originalName: string): string {
  const trimmed = originalName.trim();
  const base = trimmed === "" ? "image" : trimmed;
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  return `${stem}-detoure.png`;
}

/**
 * Save a blob to the user's disk by clicking a transient object-URL anchor. The
 * URL is revoked on the next tick so the blob is not retained for the session.
 */
export function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}
