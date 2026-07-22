import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocaleProvider } from "../i18n/LocaleProvider";
import { BackgroundControls } from "./BackgroundControls";
import type { BackgroundState } from "./studio/background-state";
import { DEFAULT_BACKGROUND } from "./studio/background-state";

function renderControls(state: BackgroundState = DEFAULT_BACKGROUND) {
  const onChange = vi.fn();
  render(
    <LocaleProvider>
      <BackgroundControls state={state} onChange={onChange} />
    </LocaleProvider>,
  );
  return { onChange };
}

describe("BackgroundControls", () => {
  it("hides the colour palette until the colour kind is active", () => {
    renderControls();
    expect(screen.queryByLabelText("#ff6b00")).not.toBeInTheDocument();
  });

  it("switches to the colour kind", async () => {
    const user = userEvent.setup();
    const { onChange } = renderControls();
    await user.click(screen.getByRole("button", { name: "Colour" }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ kind: "color" }));
  });

  it("selects a preset swatch when the colour kind is active", async () => {
    const user = userEvent.setup();
    const { onChange } = renderControls({ kind: "color", color: "#ffffff", image: null });
    await user.click(screen.getByLabelText("#ff6b00"));
    expect(onChange).toHaveBeenCalledWith({ kind: "color", color: "#ff6b00", image: null });
  });

  it("marks the active kind as pressed", () => {
    renderControls({ kind: "color", color: "#ffffff", image: null });
    expect(screen.getByRole("button", { name: "Colour" })).toHaveAttribute("aria-pressed", "true");
  });

  it("offers a background image picker under the image kind", () => {
    renderControls({ kind: "image", color: "#ffffff", image: null });
    expect(screen.getByText("Choose a background image")).toBeInTheDocument();
  });
});
