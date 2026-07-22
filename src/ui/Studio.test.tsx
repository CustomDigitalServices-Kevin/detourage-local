import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocaleProvider } from "../i18n/LocaleProvider";
import { DecodeError } from "../lib";
import type { Cutout } from "../lib";
import { Studio } from "./Studio";
import type { SelectedImage } from "./image-item";
import type { CutoutEngine } from "./studio/cutout-engine";

function item(id: string, name: string): SelectedImage {
  return { id, file: new File(["x"], name, { type: "image/png" }), url: `blob:${id}` };
}

function fakeCutout(): Cutout {
  return {
    original: { data: new Uint8ClampedArray(4), width: 1, height: 1 },
    mask: { data: new Uint8Array([255]), width: 1, height: 1 },
  };
}

interface FakeOptions {
  loadFails?: boolean;
  cutoutError?: Error;
}

function fakeEngine(options: FakeOptions = {}): CutoutEngine {
  return {
    backend: "wasm",
    load: async (onProgress) => {
      if (options.loadFails) throw new Error("network down");
      onProgress?.({ fraction: 1, ready: true });
      return Promise.resolve();
    },
    cutout: async () => {
      if (options.cutoutError) throw options.cutoutError;
      return Promise.resolve(fakeCutout());
    },
  };
}

function renderStudio(
  items: SelectedImage[],
  options: FakeOptions = {},
  handlers: { onRemove?: () => void; onClearAll?: () => void } = {},
) {
  render(
    <LocaleProvider>
      <Studio
        items={items}
        rejectedNames={[]}
        onRemove={handlers.onRemove ?? vi.fn()}
        onClearAll={handlers.onClearAll ?? vi.fn()}
        createEngine={() => fakeEngine(options)}
      />
    </LocaleProvider>,
  );
}

describe("Studio", () => {
  it("shows only the empty gallery when there are no images", () => {
    renderStudio([]);
    expect(screen.getByText("No images yet. Add one above.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove all backgrounds" })).not.toBeInTheDocument();
  });

  it("offers a batch action and an idle editor for the active image", () => {
    renderStudio([item("1", "a.png"), item("2", "b.png")]);
    expect(screen.getByRole("button", { name: "Remove all backgrounds" })).toBeInTheDocument();
    // First image is active by default → its process button is shown.
    expect(screen.getByRole("button", { name: "Remove background" })).toBeInTheDocument();
  });

  it("surfaces a model-load failure and marks the image as failed", async () => {
    const user = userEvent.setup();
    renderStudio([item("1", "a.png")], { loadFails: true });
    await user.click(screen.getByRole("button", { name: "Remove background" }));
    expect(await screen.findByText(/The model failed to load/)).toBeInTheDocument();
    expect(screen.getByText("Background removal failed. Please try again.")).toBeInTheDocument();
  });

  it("reports a decode failure from the engine on the active image", async () => {
    const user = userEvent.setup();
    renderStudio([item("1", "a.png")], { cutoutError: new DecodeError("bad") });
    await user.click(screen.getByRole("button", { name: "Remove background" }));
    expect(await screen.findByText(/This image could not be decoded/)).toBeInTheDocument();
  });

  it("removes an image through the wrapped handler", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    renderStudio([item("1", "a.png")], {}, { onRemove });
    await user.click(screen.getByRole("button", { name: "Remove this image" }));
    expect(onRemove).toHaveBeenCalledWith("1");
  });
});
