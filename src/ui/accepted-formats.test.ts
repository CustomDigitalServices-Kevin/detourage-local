import { describe, expect, it } from "vitest";
import { ACCEPT_ATTRIBUTE, FORMAT_LABELS, isAcceptedImage } from "./accepted-formats";

function file(name: string, type = ""): File {
  return new File(["x"], name, { type });
}

describe("isAcceptedImage", () => {
  it("accepts by MIME type", () => {
    expect(isAcceptedImage(file("a.png", "image/png"))).toBe(true);
    expect(isAcceptedImage(file("b.jpg", "image/jpeg"))).toBe(true);
    expect(isAcceptedImage(file("c.webp", "image/webp"))).toBe(true);
  });

  it("accepts HEIC by extension when the browser reports no MIME type", () => {
    expect(isAcceptedImage(file("photo.heic", ""))).toBe(true);
    expect(isAcceptedImage(file("photo.HEIF", ""))).toBe(true);
  });

  it("accepts jpeg extension variants", () => {
    expect(isAcceptedImage(file("x.jpeg", ""))).toBe(true);
    expect(isAcceptedImage(file("x.JPG", ""))).toBe(true);
  });

  it("rejects unsupported formats", () => {
    expect(isAcceptedImage(file("doc.pdf", "application/pdf"))).toBe(false);
    expect(isAcceptedImage(file("sheet.csv", "text/csv"))).toBe(false);
    expect(isAcceptedImage(file("noext", ""))).toBe(false);
    expect(isAcceptedImage(file("image.gif", "image/gif"))).toBe(false);
  });
});

describe("format metadata", () => {
  it("exposes uppercase labels for the dropzone", () => {
    expect(FORMAT_LABELS).toEqual(["PNG", "JPG", "WEBP", "HEIC"]);
  });

  it("builds an accept attribute covering both MIME types and extensions", () => {
    expect(ACCEPT_ATTRIBUTE).toContain("image/png");
    expect(ACCEPT_ATTRIBUTE).toContain(".heic");
    expect(ACCEPT_ATTRIBUTE).toContain("image/webp");
  });
});
