import type { BackgroundOption, Rgba, RgbaImage, Size } from "../../lib";
import { parseColor } from "../../lib";
import { resizeRgba } from "../../lib/raster";

// UI-side representation of the "what replaces the removed background" choice.
// It is deliberately richer than the lib's BackgroundOption (it carries the raw
// hex string the user is typing and the decoded replacement image) and is
// projected down to a BackgroundOption only when a render is actually needed.

export type BackgroundKind = "transparent" | "color" | "image";

export interface BackgroundState {
  readonly kind: BackgroundKind;
  /** Hex colour string used when kind === "color". Always a valid #rrggbb. */
  readonly color: string;
  /** Decoded replacement image used when kind === "image", else null. */
  readonly image: RgbaImage | null;
}

/** Preset swatches offered in the colour picker (brand + neutral studio set). */
export const COLOR_PRESETS: readonly string[] = [
  "#ffffff",
  "#000000",
  "#0b0b0d",
  "#ff6b00",
  "#7fd6a8",
  "#9cc4ff",
  "#c7a6ff",
  "#ff8f8f",
];

export const DEFAULT_BACKGROUND: BackgroundState = {
  kind: "transparent",
  color: "#ffffff",
  image: null,
};

/**
 * True when the hex string parses to a colour. Used to gate the custom-colour
 * input so an in-progress value like "#ff" never crashes the renderer.
 */
export function isValidHexColor(value: string): boolean {
  try {
    parseColor(value);
    return true;
  } catch {
    return false;
  }
}

function safeColor(value: string): Rgba {
  return isValidHexColor(value) ? parseColor(value) : parseColor("#ffffff");
}

/**
 * Project the UI state onto the lib BackgroundOption used by renderResult, for
 * a foreground of the given size. The replacement image is resized to the
 * foreground's dimensions here (compositeOverImage requires identical sizes);
 * when kind is "image" but no image is loaded yet, it falls back to
 * transparent so a partial selection never throws.
 */
export function toBackgroundOption(state: BackgroundState, foreground: Size): BackgroundOption {
  switch (state.kind) {
    case "transparent":
      return { kind: "transparent" };
    case "color":
      return { kind: "color", color: safeColor(state.color) };
    case "image": {
      if (state.image === null) return { kind: "transparent" };
      const fitted =
        state.image.width === foreground.width && state.image.height === foreground.height
          ? state.image
          : resizeRgba(state.image, foreground);
      return { kind: "image", image: fitted };
    }
  }
}
