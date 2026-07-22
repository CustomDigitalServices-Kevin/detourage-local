import { describe, expect, it } from "vitest";
import { cutoutFileName } from "./download";

describe("cutoutFileName", () => {
  it("swaps the extension for a -detoure.png suffix", () => {
    expect(cutoutFileName("portrait.jpg")).toBe("portrait-detoure.png");
    expect(cutoutFileName("photo.HEIC")).toBe("photo-detoure.png");
  });

  it("keeps a dotted stem intact", () => {
    expect(cutoutFileName("my.holiday.photo.png")).toBe("my.holiday.photo-detoure.png");
  });

  it("handles a name without extension", () => {
    expect(cutoutFileName("scan")).toBe("scan-detoure.png");
  });

  it("handles a dotfile (leading dot, no stem)", () => {
    expect(cutoutFileName(".env")).toBe(".env-detoure.png");
  });

  it("falls back to a default stem for an empty name", () => {
    expect(cutoutFileName("")).toBe("image-detoure.png");
    expect(cutoutFileName("   ")).toBe("image-detoure.png");
  });
});
