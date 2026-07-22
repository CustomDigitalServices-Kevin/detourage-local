import type { Rgba } from "./types";

/** Thrown when a colour string cannot be parsed as a hex colour. */
export class InvalidColorError extends Error {
  constructor(input: string) {
    super(`Invalid hex colour: ${JSON.stringify(input)}`);
    this.name = "InvalidColorError";
  }
}

const HEX_PATTERN = /^#([0-9a-f]+)$/i;

function byteAt(hex: string, start: number, len: number): number {
  const slice = hex.slice(start, start + len);
  const doubled = len === 1 ? slice + slice : slice;
  return Number.parseInt(doubled, 16);
}

/**
 * Parse a CSS hex colour into an {r,g,b,a} tuple (each 0..255).
 *
 * Accepts #rgb, #rgba, #rrggbb and #rrggbbaa (case-insensitive). Alpha
 * defaults to 255 (opaque) for the 3- and 6-digit forms. Any other shape
 * throws InvalidColorError rather than silently producing a wrong colour.
 */
export function parseColor(input: string): Rgba {
  const match = HEX_PATTERN.exec(input.trim());
  const hex = match?.[1];
  if (hex === undefined) {
    throw new InvalidColorError(input);
  }

  switch (hex.length) {
    case 3:
      return { r: byteAt(hex, 0, 1), g: byteAt(hex, 1, 1), b: byteAt(hex, 2, 1), a: 255 };
    case 4:
      return {
        r: byteAt(hex, 0, 1),
        g: byteAt(hex, 1, 1),
        b: byteAt(hex, 2, 1),
        a: byteAt(hex, 3, 1),
      };
    case 6:
      return { r: byteAt(hex, 0, 2), g: byteAt(hex, 2, 2), b: byteAt(hex, 4, 2), a: 255 };
    case 8:
      return {
        r: byteAt(hex, 0, 2),
        g: byteAt(hex, 2, 2),
        b: byteAt(hex, 4, 2),
        a: byteAt(hex, 6, 2),
      };
    default:
      throw new InvalidColorError(input);
  }
}

function clampByte(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(255, Math.max(0, Math.round(value)));
}

function hex2(value: number): string {
  return clampByte(value).toString(16).padStart(2, "0");
}

/**
 * Serialise a colour back to a hex string. Fully-opaque colours produce the
 * compact #rrggbb form; anything with alpha < 255 keeps the #rrggbbaa form so
 * the value round-trips through parseColor.
 */
export function rgbToHex(color: Rgba): string {
  const base = `#${hex2(color.r)}${hex2(color.g)}${hex2(color.b)}`;
  return clampByte(color.a) === 255 ? base : `${base}${hex2(color.a)}`;
}
