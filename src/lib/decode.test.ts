import { afterEach, describe, expect, it, vi } from "vitest";
import { DecodeError, decodeImageFile, isHeic } from "./decode";

function file(name: string, type: string): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isHeic", () => {
  it("detects HEIC by MIME type", () => {
    expect(isHeic(file("photo.jpg", "image/heic"))).toBe(true);
    expect(isHeic(file("photo", "image/heif"))).toBe(true);
  });

  it("detects HEIC by extension when the browser reports no MIME type", () => {
    expect(isHeic(file("IMG_0001.HEIC", ""))).toBe(true);
    expect(isHeic(file("clip.heif", ""))).toBe(true);
  });

  it("returns false for the natively-decodable formats", () => {
    expect(isHeic(file("a.png", "image/png"))).toBe(false);
    expect(isHeic(file("a.jpg", "image/jpeg"))).toBe(false);
    expect(isHeic(file("a.webp", "image/webp"))).toBe(false);
  });
});

describe("DecodeError", () => {
  it("is an Error subclass with the decode name and preserves the cause", () => {
    const cause = new Error("underlying");
    const error = new DecodeError("could not decode", { cause });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("DecodeError");
    expect(error.cause).toBe(cause);
  });
});

describe("decodeImageFile", () => {
  it("wraps a createImageBitmap failure in a DecodeError carrying the cause", async () => {
    const underlying = new Error("unsupported source");
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockRejectedValue(underlying),
    );

    const promise = decodeImageFile(file("broken.png", "image/png"));
    await expect(promise).rejects.toBeInstanceOf(DecodeError);
    await expect(promise).rejects.toMatchObject({ cause: underlying });
  });
});
