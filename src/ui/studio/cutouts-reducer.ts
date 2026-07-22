import type { Mask, RgbaImage } from "../../lib";

// Per-image processing state, keyed by SelectedImage.id. Kept as a pure reducer
// so every transition (start → ready / error, mask edits, reset, removal) is
// unit-testable without React or the ONNX runtime. The React hook merely
// dispatches these actions around the real async cutout call.

/**
 * Stable, locale-independent reason a cutout failed. The component maps it to a
 * translated message so a language switch re-renders the error in the new
 * locale (a pre-formatted string would freeze the original language).
 */
export type CutoutErrorCode = "decode" | "generic";

export interface ReadyCutout {
  readonly status: "ready";
  /** Pristine full-resolution original. */
  readonly original: RgbaImage;
  /** Model output matte at full resolution — the reset target for the brush. */
  readonly baseMask: Mask;
  /** Current matte, possibly edited by the brush tools. */
  readonly mask: Mask;
}

export type CutoutEntry =
  | { readonly status: "idle" }
  | { readonly status: "processing" }
  | { readonly status: "error"; readonly code: CutoutErrorCode }
  | ReadyCutout;

export type CutoutMap = ReadonlyMap<string, CutoutEntry>;

export type CutoutAction =
  | { readonly type: "start"; readonly id: string }
  | {
      readonly type: "succeed";
      readonly id: string;
      readonly original: RgbaImage;
      readonly mask: Mask;
    }
  | { readonly type: "fail"; readonly id: string; readonly code: CutoutErrorCode }
  | { readonly type: "setMask"; readonly id: string; readonly mask: Mask }
  | { readonly type: "resetMask"; readonly id: string }
  | { readonly type: "remove"; readonly id: string }
  | { readonly type: "clear" };

export const EMPTY_CUTOUTS: CutoutMap = new Map<string, CutoutEntry>();

function withEntry(state: CutoutMap, id: string, entry: CutoutEntry): CutoutMap {
  const next = new Map(state);
  next.set(id, entry);
  return next;
}

export function cutoutsReducer(state: CutoutMap, action: CutoutAction): CutoutMap {
  switch (action.type) {
    case "start":
      return withEntry(state, action.id, { status: "processing" });
    case "succeed":
      return withEntry(state, action.id, {
        status: "ready",
        original: action.original,
        baseMask: action.mask,
        mask: action.mask,
      });
    case "fail":
      return withEntry(state, action.id, { status: "error", code: action.code });
    case "setMask": {
      const current = state.get(action.id);
      if (current === undefined || current.status !== "ready") return state;
      return withEntry(state, action.id, { ...current, mask: action.mask });
    }
    case "resetMask": {
      const current = state.get(action.id);
      if (current === undefined || current.status !== "ready") return state;
      return withEntry(state, action.id, { ...current, mask: current.baseMask });
    }
    case "remove": {
      if (!state.has(action.id)) return state;
      const next = new Map(state);
      next.delete(action.id);
      return next;
    }
    case "clear":
      return EMPTY_CUTOUTS;
  }
}

/** Ids that still need processing (never started, or a previous attempt failed). */
export function pendingIds(ids: readonly string[], state: CutoutMap): string[] {
  return ids.filter((id) => {
    const entry = state.get(id);
    return entry === undefined || entry.status === "error";
  });
}

/** Ids with a finished cutout, in the given order — the set that can be exported. */
export function readyIds(ids: readonly string[], state: CutoutMap): string[] {
  return ids.filter((id) => state.get(id)?.status === "ready");
}
