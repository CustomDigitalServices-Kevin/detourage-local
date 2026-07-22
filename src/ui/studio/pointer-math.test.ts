import { describe, expect, it } from "vitest";
import { clientPointToImage, displayRadiusToImage } from "./pointer-math";

const rect = { left: 100, top: 50, width: 200, height: 100 };
const image = { width: 2000, height: 1000 };

describe("clientPointToImage", () => {
  it("maps the centre of the displayed canvas to the centre of the image", () => {
    expect(clientPointToImage(200, 100, rect, image)).toEqual({ x: 1000, y: 500 });
  });

  it("maps the top-left corner to (0, 0)", () => {
    expect(clientPointToImage(100, 50, rect, image)).toEqual({ x: 0, y: 0 });
  });

  it("clamps a pointer beyond the bottom-right to the last valid pixel", () => {
    expect(clientPointToImage(400, 200, rect, image)).toEqual({ x: 1999, y: 999 });
  });

  it("clamps a pointer that drifts above/left of the element to (0, 0)", () => {
    expect(clientPointToImage(80, 20, rect, image)).toEqual({ x: 0, y: 0 });
  });

  it("returns (0, 0) for a zero-sized rect instead of dividing by zero", () => {
    expect(clientPointToImage(10, 10, { left: 0, top: 0, width: 0, height: 0 }, image)).toEqual({
      x: 0,
      y: 0,
    });
  });
});

describe("displayRadiusToImage", () => {
  it("scales a display radius up by the image/display ratio", () => {
    // image is 10× wider than the displayed canvas (2000 / 200).
    expect(displayRadiusToImage(20, rect, image)).toBe(200);
  });

  it("never returns less than one image pixel", () => {
    expect(displayRadiusToImage(0, rect, image)).toBe(1);
  });

  it("falls back to the raw radius when the rect has no width", () => {
    expect(displayRadiusToImage(15, { left: 0, top: 0, width: 0, height: 0 }, image)).toBe(15);
  });
});
