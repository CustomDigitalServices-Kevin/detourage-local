import { describe, expect, it } from "vitest";
import type { Mask, RgbaImage } from "../../lib";
import {
  cutoutsReducer,
  EMPTY_CUTOUTS,
  pendingIds,
  readyIds,
} from "./cutouts-reducer";
import type { CutoutMap } from "./cutouts-reducer";

function image(): RgbaImage {
  return { data: new Uint8ClampedArray(4), width: 1, height: 1 };
}
function mask(value: number): Mask {
  return { data: new Uint8Array([value]), width: 1, height: 1 };
}

function ready(id: string, m: Mask): CutoutMap {
  return cutoutsReducer(EMPTY_CUTOUTS, { type: "succeed", id, original: image(), mask: m });
}

describe("cutoutsReducer", () => {
  it("marks an image processing then ready, seeding mask from the model output", () => {
    let state = cutoutsReducer(EMPTY_CUTOUTS, { type: "start", id: "a" });
    expect(state.get("a")?.status).toBe("processing");

    const base = mask(200);
    state = cutoutsReducer(state, { type: "succeed", id: "a", original: image(), mask: base });
    const entry = state.get("a");
    expect(entry?.status).toBe("ready");
    if (entry?.status === "ready") {
      expect(entry.mask).toBe(base);
      expect(entry.baseMask).toBe(base);
    }
  });

  it("stores the failure code on error", () => {
    const state = cutoutsReducer(EMPTY_CUTOUTS, { type: "fail", id: "a", code: "decode" });
    expect(state.get("a")).toEqual({ status: "error", code: "decode" });
  });

  it("replaces the working mask but keeps baseMask for reset", () => {
    const base = mask(10);
    let state = ready("a", base);
    const edited = mask(250);
    state = cutoutsReducer(state, { type: "setMask", id: "a", mask: edited });

    const afterEdit = state.get("a");
    if (afterEdit?.status === "ready") {
      expect(afterEdit.mask).toBe(edited);
      expect(afterEdit.baseMask).toBe(base);
    }

    state = cutoutsReducer(state, { type: "resetMask", id: "a" });
    const afterReset = state.get("a");
    if (afterReset?.status === "ready") {
      expect(afterReset.mask).toBe(base);
    }
  });

  it("ignores setMask / resetMask on a non-ready entry", () => {
    const processing = cutoutsReducer(EMPTY_CUTOUTS, { type: "start", id: "a" });
    expect(cutoutsReducer(processing, { type: "setMask", id: "a", mask: mask(1) })).toBe(processing);
    expect(cutoutsReducer(processing, { type: "resetMask", id: "a" })).toBe(processing);
  });

  it("removes an entry and clears everything", () => {
    let state = ready("a", mask(1));
    state = cutoutsReducer(state, { type: "remove", id: "a" });
    expect(state.has("a")).toBe(false);

    state = ready("b", mask(1));
    expect(cutoutsReducer(state, { type: "clear" })).toBe(EMPTY_CUTOUTS);
  });

  it("returns the same reference when removing an unknown id", () => {
    const state = ready("a", mask(1));
    expect(cutoutsReducer(state, { type: "remove", id: "ghost" })).toBe(state);
  });
});

describe("pendingIds / readyIds", () => {
  it("treats never-started and errored images as pending", () => {
    let state: CutoutMap = cutoutsReducer(EMPTY_CUTOUTS, { type: "fail", id: "b", code: "generic" });
    state = cutoutsReducer(state, { type: "succeed", id: "c", original: image(), mask: mask(1) });
    expect(pendingIds(["a", "b", "c"], state)).toEqual(["a", "b"]);
    expect(readyIds(["a", "b", "c"], state)).toEqual(["c"]);
  });
});
