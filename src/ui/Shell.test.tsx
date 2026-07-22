import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../App";
import { LocaleProvider } from "../i18n/LocaleProvider";
import { Shell } from "./Shell";
import type { CutoutEngine } from "./studio/cutout-engine";

// Every functional test drives the real Shell with WebGPU FORCED AVAILABLE so
// the cutout zone renders deterministically (happy-dom has no navigator.gpu, so
// the real probe would report "unavailable"). The WebGPU-missing behaviour has
// its own test at the bottom.
function renderHome(): void {
  render(
    <LocaleProvider>
      <Shell detectWebGpu={() => Promise.resolve(true)} />
    </LocaleProvider>,
  );
}

describe("Shell", () => {
  it("renders the local-first banner", () => {
    render(<App />);
    expect(screen.getByTestId("local-banner")).toBeInTheDocument();
  });

  it("switches locale between FR and EN", async () => {
    const user = userEvent.setup();
    renderHome();
    const initialTitle = screen.getByRole("heading", { level: 1 }).textContent;
    await user.click(screen.getByTestId("locale-toggle"));
    const toggledTitle = screen.getByRole("heading", { level: 1 }).textContent;
    expect(toggledTitle).not.toBe(initialTitle);
    expect(["Détourage local", "Local Background Remover"]).toContain(toggledTitle);
  });

  it("navigates to the privacy page and back", async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(screen.getByRole("button", { name: "Privacy & GDPR" }));
    expect(screen.getByRole("heading", { level: 1, name: "Privacy & GDPR" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back to home" }));
    expect(
      screen.getByRole("heading", { level: 1, name: "Local Background Remover" }),
    ).toBeInTheDocument();
  });

  it("navigates to the licenses page and lists runtime dependencies", async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(screen.getByRole("button", { name: "Third-party licenses" }));
    expect(
      screen.getByRole("heading", { level: 1, name: "Third-party licenses" }),
    ).toBeInTheDocument();
    expect(screen.getByText("react / react-dom")).toBeInTheDocument();
    expect(screen.getByText(/Transformers\.js/)).toBeInTheDocument();
    expect(screen.getAllByText("MIT").length).toBeGreaterThan(0);
  });

  it("shows the empty work area on first load", async () => {
    renderHome();
    expect(await screen.findByTestId("work-area")).toBeInTheDocument();
    expect(screen.getByText("No images yet. Add one above.")).toBeInTheDocument();
  });

  it("adds a selected image to the work area after choosing a file", async () => {
    const user = userEvent.setup();
    renderHome();
    const input = screen.getByLabelText("Browse your images");
    await user.upload(input, new File(["binary"], "portrait.png", { type: "image/png" }));
    expect(screen.getByTestId("work-item")).toBeInTheDocument();
    // The name shows both on the gallery card and in the editor header.
    expect(screen.getAllByText("portrait.png").length).toBeGreaterThan(0);
  });

  it("replaces the cutout zone with an honest panel when WebGPU is unavailable and never builds the engine", async () => {
    // If the studio ever mounted and tried to run, this would throw — proving
    // the WebGPU-less path never reaches any inference code.
    const createEngine = vi.fn((): CutoutEngine => {
      throw new Error("inference engine must not be constructed without WebGPU");
    });

    render(
      <LocaleProvider>
        <Shell detectWebGpu={() => Promise.resolve(false)} createEngine={createEngine} />
      </LocaleProvider>,
    );

    // The honest unsupported panel appears in place of the cutout zone.
    expect(await screen.findByTestId("webgpu-unsupported")).toBeInTheDocument();
    expect(screen.getByText(/requires a WebGPU-capable browser/i)).toBeInTheDocument();

    // There is no way to trigger a cutout: dropzone, work area and batch action
    // are all absent, so the ~110 MB model is never fetched and segmentation is
    // never invoked.
    expect(screen.queryByLabelText("Browse your images")).not.toBeInTheDocument();
    expect(screen.queryByTestId("work-area")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove all backgrounds" })).not.toBeInTheDocument();
    expect(createEngine).not.toHaveBeenCalled();
  });
});
