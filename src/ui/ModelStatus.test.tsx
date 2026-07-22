import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocaleProvider } from "../i18n/LocaleProvider";
import { ModelStatus } from "./ModelStatus";
import type { ModelState } from "./studio/use-studio";

function renderStatus(model: ModelState, onRetry = vi.fn()) {
  render(
    <LocaleProvider>
      <ModelStatus model={model} onRetry={onRetry} />
    </LocaleProvider>,
  );
  return { onRetry };
}

describe("ModelStatus", () => {
  it("renders nothing while idle", () => {
    renderStatus({ status: "idle", fraction: 0, backend: null });
    expect(screen.queryByTestId("model-status")).not.toBeInTheDocument();
  });

  it("shows a percentage and a progressbar while loading", () => {
    renderStatus({ status: "loading", fraction: 0.42, backend: null });
    expect(screen.getByText("42%")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "42");
  });

  it("shows the chosen backend once ready", () => {
    renderStatus({ status: "ready", fraction: 1, backend: "webgpu" });
    expect(screen.getByText("Model ready")).toBeInTheDocument();
    expect(screen.getByText("GPU acceleration (WebGPU)")).toBeInTheDocument();
  });

  it("labels the WASM fallback", () => {
    renderStatus({ status: "ready", fraction: 1, backend: "wasm" });
    expect(screen.getByText("Compatibility mode (WebAssembly)")).toBeInTheDocument();
  });

  it("offers a retry on error", async () => {
    const user = userEvent.setup();
    const { onRetry } = renderStatus({ status: "error", fraction: 0, backend: null });
    expect(screen.getByText(/The model failed to load/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
