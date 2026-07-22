import { describe, expect, it } from "vitest";
import { paintDab, paintStroke } from "./brush";
import type { Mask } from "./types";
import type { Brush, BrushMode } from "./brush";

function blank(width: number, height: number, fill = 0): Mask {
  return { data: new Uint8Array(width * height).fill(fill), width, height };
}

function at(mask: Mask, x: number, y: number): number {
  return mask.data[y * mask.width + x] ?? -1;
}

const hardBrush = (mode: BrushMode): Brush => ({ radius: 3, hardness: 1, mode });

describe("paintDab", () => {
  it("restores the covered disc to full opacity", () => {
    const out = paintDab(blank(7, 7), { x: 3, y: 3 }, hardBrush("restore"));
    expect(at(out, 3, 3)).toBe(255);
    expect(at(out, 4, 3)).toBe(255);
  });

  it("erases the covered disc on a full matte", () => {
    const out = paintDab(blank(7, 7, 255), { x: 3, y: 3 }, hardBrush("erase"));
    expect(at(out, 3, 3)).toBe(0);
  });

  it("leaves pixels outside the radius untouched with a hard brush", () => {
    const out = paintDab(blank(9, 9), { x: 4, y: 4 }, hardBrush("restore"));
    expect(at(out, 0, 0)).toBe(0);
    expect(at(out, 8, 8)).toBe(0);
  });

  it("feathers the edge with a soft brush", () => {
    const soft = paintDab(blank(9, 1), { x: 4, y: 0 }, { radius: 4, hardness: 0, mode: "restore" });
    // Centre is fully applied; a pixel near the rim is only partially applied.
    expect(at(soft, 4, 0)).toBe(255);
    const rim = at(soft, 1, 0);
    expect(rim).toBeGreaterThan(0);
    expect(rim).toBeLessThan(255);
  });

  it("does nothing with a zero radius", () => {
    const out = paintDab(blank(5, 5), { x: 2, y: 2 }, { radius: 0, hardness: 1, mode: "restore" });
    expect(Array.from(out.data).every((v) => v === 0)).toBe(true);
  });

  it("does not mutate the input mask", () => {
    const src = blank(5, 5);
    paintDab(src, { x: 2, y: 2 }, hardBrush("restore"));
    expect(Array.from(src.data).every((v) => v === 0)).toBe(true);
  });
});

describe("paintStroke", () => {
  it("covers the whole segment between the two endpoints", () => {
    const out = paintStroke(blank(16, 5), { x: 1, y: 2 }, { x: 14, y: 2 }, {
      radius: 2,
      hardness: 1,
      mode: "restore",
    });
    expect(at(out, 1, 2)).toBe(255);
    expect(at(out, 7, 2)).toBe(255);
    expect(at(out, 14, 2)).toBe(255);
  });
});
