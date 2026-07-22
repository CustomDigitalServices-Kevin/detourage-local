import { describe, expect, it } from "vitest";
import { InvalidColorError, parseColor, rgbToHex } from "./color";

describe("parseColor", () => {
  it("parses 6-digit hex", () => {
    expect(parseColor("#ff6b00")).toEqual({ r: 255, g: 107, b: 0, a: 255 });
    expect(parseColor("#000000")).toEqual({ r: 0, g: 0, b: 0, a: 255 });
  });

  it("parses 3-digit shorthand", () => {
    expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255, a: 255 });
    expect(parseColor("#f80")).toEqual({ r: 255, g: 136, b: 0, a: 255 });
  });

  it("parses 8-digit hex with alpha", () => {
    expect(parseColor("#ff6b0080")).toEqual({ r: 255, g: 107, b: 0, a: 128 });
  });

  it("parses 4-digit shorthand with alpha", () => {
    expect(parseColor("#f008")).toEqual({ r: 255, g: 0, b: 0, a: 136 });
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(parseColor("  #FF6B00 ")).toEqual({ r: 255, g: 107, b: 0, a: 255 });
  });

  it("rejects non-hex and malformed input", () => {
    for (const bad of ["red", "", "#12", "#12345", "#gggggg", "ff6b00", "#1234567"]) {
      expect(() => parseColor(bad)).toThrow(InvalidColorError);
    }
  });
});

describe("rgbToHex", () => {
  it("emits the compact form for opaque colours", () => {
    expect(rgbToHex({ r: 255, g: 107, b: 0, a: 255 })).toBe("#ff6b00");
  });

  it("keeps the alpha byte when not fully opaque", () => {
    expect(rgbToHex({ r: 255, g: 107, b: 0, a: 128 })).toBe("#ff6b0080");
  });

  it("clamps out-of-range channels", () => {
    expect(rgbToHex({ r: 300, g: -20, b: 0, a: 255 })).toBe("#ff0000");
  });

  it("round-trips through parseColor", () => {
    const color = { r: 18, g: 52, b: 86, a: 120 };
    expect(parseColor(rgbToHex(color))).toEqual(color);
  });
});
