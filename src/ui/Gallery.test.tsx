import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocaleProvider } from "../i18n/LocaleProvider";
import { Gallery } from "./Gallery";
import type { SelectedImage } from "./image-item";
import type { CutoutEntry, CutoutMap } from "./studio/cutouts-reducer";

function item(id: string, name: string): SelectedImage {
  return { id, file: new File(["x"], name, { type: "image/png" }), url: `blob:${id}` };
}

function cutouts(entries: Record<string, CutoutEntry>): CutoutMap {
  return new Map(Object.entries(entries));
}

function renderGallery(props: Partial<React.ComponentProps<typeof Gallery>> = {}) {
  const onSelect = props.onSelect ?? vi.fn();
  const onRemove = props.onRemove ?? vi.fn();
  const onClearAll = props.onClearAll ?? vi.fn();
  render(
    <LocaleProvider>
      <Gallery
        items={props.items ?? []}
        cutouts={props.cutouts ?? new Map()}
        activeId={props.activeId ?? null}
        rejectedNames={props.rejectedNames ?? []}
        onSelect={onSelect}
        onRemove={onRemove}
        onClearAll={onClearAll}
      />
    </LocaleProvider>,
  );
  return { onSelect, onRemove, onClearAll };
}

describe("Gallery", () => {
  it("shows the empty state and keeps the work-area landmark", () => {
    renderGallery();
    expect(screen.getByTestId("work-area")).toBeInTheDocument();
    expect(screen.getByText("No images yet. Add one above.")).toBeInTheDocument();
    expect(screen.queryByTestId("work-item")).not.toBeInTheDocument();
  });

  it("renders one card per image with its name", () => {
    renderGallery({ items: [item("1", "a.png"), item("2", "b.png")] });
    expect(screen.getAllByTestId("work-item")).toHaveLength(2);
    expect(screen.getByText("a.png")).toBeInTheDocument();
    expect(screen.getByText("b.png")).toBeInTheDocument();
  });

  it("fires onSelect with the clicked image id", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderGallery({ items: [item("42", "x.png")] });
    await user.click(screen.getByRole("button", { name: "Select this image" }));
    expect(onSelect).toHaveBeenCalledWith("42");
  });

  it("marks the active card as pressed", () => {
    renderGallery({ items: [item("1", "a.png")], activeId: "1" });
    expect(screen.getByRole("button", { name: "Select this image" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("fires onRemove and onClearAll", async () => {
    const user = userEvent.setup();
    const { onRemove, onClearAll } = renderGallery({ items: [item("7", "a.png")] });
    await user.click(screen.getByRole("button", { name: "Remove this image" }));
    expect(onRemove).toHaveBeenCalledWith("7");
    await user.click(screen.getByRole("button", { name: "Remove all" }));
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });

  it("surfaces rejected file names", () => {
    renderGallery({ rejectedNames: ["bad.pdf", "clip.gif"] });
    expect(screen.getByText(/bad\.pdf, clip\.gif/)).toBeInTheDocument();
  });

  it("shows a per-image status badge", () => {
    renderGallery({
      items: [item("1", "a.png"), item("2", "b.png"), item("3", "c.png")],
      cutouts: cutouts({
        "1": { status: "ready", original: img(), baseMask: m(), mask: m() },
        "2": { status: "processing" },
        "3": { status: "error", code: "generic" },
      }),
    });
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("Removing…")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });
});

function img() {
  return { data: new Uint8ClampedArray(4), width: 1, height: 1 };
}
function m() {
  return { data: new Uint8Array([255]), width: 1, height: 1 };
}
