import { describe, expect, it } from "vitest";
import { formatBytes } from "./format-bytes";

describe("formatBytes", () => {
  it("returns 0 B for zero or negative input", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(-10)).toBe("0 B");
  });

  it("keeps bytes without decimals", () => {
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats kilobytes and megabytes with one decimal", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  it("caps at the largest known unit", () => {
    expect(formatBytes(3 * 1024 ** 3)).toBe("3.0 GB");
  });
});
