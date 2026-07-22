import type { BrushMode } from "../../lib";

/** Brush configuration in UI terms: size is in displayed (CSS) pixels. */
export interface BrushSettings {
  readonly mode: BrushMode;
  /** Radius on screen, in CSS pixels; converted to image pixels at paint time. */
  readonly displaySize: number;
  /** Edge softness 0..1, passed straight to the lib brush. */
  readonly hardness: number;
}

export const DEFAULT_BRUSH: BrushSettings = { mode: "restore", displaySize: 24, hardness: 0.7 };

export const BRUSH_MIN_SIZE = 6;
export const BRUSH_MAX_SIZE = 120;
