import { describe, expect, it } from "vitest";
import { partitionAcceptedFiles } from "./image-item";

function file(name: string, type = ""): File {
  return new File(["x"], name, { type });
}

describe("partitionAcceptedFiles", () => {
  it("keeps accepted images and collects rejected names in order", () => {
    const { accepted, rejectedNames } = partitionAcceptedFiles([
      file("a.png", "image/png"),
      file("b.pdf", "application/pdf"),
      file("c.heic", ""),
      file("d.txt", "text/plain"),
    ]);
    expect(accepted.map((f) => f.name)).toEqual(["a.png", "c.heic"]);
    expect(rejectedNames).toEqual(["b.pdf", "d.txt"]);
  });

  it("returns empty arrays for an empty batch", () => {
    const { accepted, rejectedNames } = partitionAcceptedFiles([]);
    expect(accepted).toEqual([]);
    expect(rejectedNames).toEqual([]);
  });

  it("keeps all files when every one is accepted", () => {
    const { accepted, rejectedNames } = partitionAcceptedFiles([
      file("a.png", "image/png"),
      file("b.webp", "image/webp"),
    ]);
    expect(accepted).toHaveLength(2);
    expect(rejectedNames).toEqual([]);
  });
});
