// File size units are technical/universal abbreviations (KB, MB) and are
// intentionally not localized, matching common practice across browsers
// and OS file managers in both French and English.
const UNITS = ["B", "KB", "MB", "GB"] as const;

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
  const unit = UNITS[exponent] ?? "B";
  const value = bytes / 1024 ** exponent;
  const formatted = exponent === 0 ? value.toString() : value.toFixed(1);
  return `${formatted} ${unit}`;
}
