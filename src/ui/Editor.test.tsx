import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocaleProvider } from "../i18n/LocaleProvider";
import { Editor } from "./Editor";
import type { SelectedImage } from "./image-item";
import type { CutoutEntry } from "./studio/cutouts-reducer";
import { DEFAULT_BACKGROUND } from "./studio/background-state";
import { DEFAULT_BRUSH } from "./studio/brush-settings";

function image(): SelectedImage {
  return { id: "1", file: new File(["x"], "cat.png", { type: "image/png" }), url: "blob:1" };
}

function renderEditor(
  overrides: {
    activeImage?: SelectedImage | null;
    entry?: CutoutEntry | undefined;
    modelBusy?: boolean;
  } = {},
) {
  const onProcess = vi.fn();
  render(
    <LocaleProvider>
      <Editor
        activeImage={overrides.activeImage === undefined ? image() : overrides.activeImage}
        entry={overrides.entry}
        background={DEFAULT_BACKGROUND}
        onBackgroundChange={vi.fn()}
        brush={DEFAULT_BRUSH}
        onBrushChange={vi.fn()}
        onProcess={onProcess}
        onCommitMask={vi.fn()}
        onResetMask={vi.fn()}
        modelBusy={overrides.modelBusy ?? false}
      />
    </LocaleProvider>,
  );
  return { onProcess };
}

describe("Editor", () => {
  it("prompts to select an image when none is active", () => {
    renderEditor({ activeImage: null });
    expect(screen.getByText("Select or add an image to remove its background.")).toBeInTheDocument();
  });

  it("offers the process action for an unprocessed image", async () => {
    const user = userEvent.setup();
    const { onProcess } = renderEditor({ entry: undefined });
    await user.click(screen.getByRole("button", { name: "Remove background" }));
    expect(onProcess).toHaveBeenCalledWith("1", expect.any(File));
  });

  it("disables the process action while the model is busy", () => {
    renderEditor({ entry: undefined, modelBusy: true });
    expect(screen.getByRole("button", { name: "Remove background" })).toBeDisabled();
  });

  it("shows the processing state without a process button", () => {
    renderEditor({ entry: { status: "processing" } });
    expect(screen.getByText("Removing background…")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove background" })).not.toBeInTheDocument();
  });

  it("shows a decode-specific error message", () => {
    renderEditor({ entry: { status: "error", code: "decode" } });
    expect(
      screen.getByText(/This image could not be decoded/),
    ).toBeInTheDocument();
  });

  it("shows a generic error message and a retry action", () => {
    renderEditor({ entry: { status: "error", code: "generic" } });
    expect(screen.getByText("Background removal failed. Please try again.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recompute cutout" })).toBeInTheDocument();
  });
});
