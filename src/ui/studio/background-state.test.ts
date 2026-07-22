import { describe, expect, it } from "vitest";
import type { RgbaImage } from "../../lib";
import { isValidHexColor, toBackgroundOption } from "./background-state";

function solid(width: number, height: number): RgbaImage {
  return { data: new Uint8ClampedArray(width * height * 4), width, height };
}

describe("isValidHexColor", () => {
  it("accepts the short, full and alpha hex forms", () => {
    expect(isValidHexColor("#fff")).toBe(true);
    expect(isValidHexColor("#1a1a1a")).toBe(true);
    expect(isValidHexColor("#1a1a1aff")).toBe(true);
  });

  it("rejects incomplete or non-hex strings", () => {
    expect(isValidHexColor("#ff")).toBe(false);
    expect(isValidHexColor("orange")).toBe(false);
    expect(isValidHexColor("")).toBe(false);
  });
});

describe("toBackgroundOption", () => {
  const size = { width: 4, height: 3 };

  it("maps the transparent kind straight through", () => {
    expect(toBackgroundOption({ kind: "transparent", color: "#ffffff", image: null }, size)).toEqual({
      kind: "transparent",
    });
  });

  it("parses a valid colour into an rgba option", () => {
    expect(toBackgroundOption({ kind: "color", color: "#ff6b00", image: null }, size)).toEqual({
      kind: "color",
      color: { r: 255, g: 107, b: 0, a: 255 },
    });
  });

  it("falls back to white for an in-progress invalid colour instead of throwing", () => {
    expect(toBackgroundOption({ kind: "color", color: "#ff", image: null }, size)).toEqual({
      kind: "color",
      color: { r: 255, g: 255, b: 255, a: 255 },
    });
  });

  it("falls back to transparent when the image kind has no image yet", () => {
    expect(toBackgroundOption({ kind: "image", color: "#ffffff", image: null }, size)).toEqual({
      kind: "transparent",
    });
  });

  it("uses a same-size replacement image without resizing it", () => {
    const image = solid(4, 3);
    const option = toBackgroundOption({ kind: "image", color: "#ffffff", image }, size);
    expect(option).toEqual({ kind: "image", image });
    if (option.kind === "image") expect(option.image).toBe(image);
  });
});
