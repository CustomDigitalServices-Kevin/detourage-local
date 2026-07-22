import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocaleProvider } from "../i18n/LocaleProvider";
import { Dropzone } from "./Dropzone";

function imageFile(name: string, type = "image/png"): File {
  return new File(["binary"], name, { type });
}

describe("Dropzone", () => {
  it("calls onFilesAdded with the dropped files (simulated DataTransfer)", () => {
    const onFilesAdded = vi.fn();
    render(
      <LocaleProvider>
        <Dropzone onFilesAdded={onFilesAdded} />
      </LocaleProvider>,
    );
    const zone = screen.getByTestId("dropzone");
    const files = [imageFile("a.png"), imageFile("b.jpg", "image/jpeg")];
    fireEvent.drop(zone, { dataTransfer: { files } });
    expect(onFilesAdded).toHaveBeenCalledWith(files);
  });

  it("ignores a drop with no files", () => {
    const onFilesAdded = vi.fn();
    render(
      <LocaleProvider>
        <Dropzone onFilesAdded={onFilesAdded} />
      </LocaleProvider>,
    );
    fireEvent.drop(screen.getByTestId("dropzone"), { dataTransfer: { files: [] } });
    expect(onFilesAdded).not.toHaveBeenCalled();
  });

  it("calls onFilesAdded when a file is chosen via the input", async () => {
    const onFilesAdded = vi.fn();
    const user = userEvent.setup();
    render(
      <LocaleProvider>
        <Dropzone onFilesAdded={onFilesAdded} />
      </LocaleProvider>,
    );
    const input = screen.getByLabelText("Browse your images");
    const file = imageFile("portrait.png");
    await user.upload(input, file);
    expect(onFilesAdded).toHaveBeenCalledWith([file]);
  });

  it("shows the active hint while dragging over", () => {
    render(
      <LocaleProvider>
        <Dropzone onFilesAdded={vi.fn()} />
      </LocaleProvider>,
    );
    const zone = screen.getByTestId("dropzone");
    fireEvent.dragOver(zone);
    expect(screen.getByText("Drop your images to add them")).toBeInTheDocument();
    fireEvent.dragLeave(zone);
    expect(screen.getByText("Drop your images here or click to browse")).toBeInTheDocument();
  });

  it("lists the accepted format pills", () => {
    render(
      <LocaleProvider>
        <Dropzone onFilesAdded={vi.fn()} />
      </LocaleProvider>,
    );
    for (const label of ["PNG", "JPG", "WEBP", "HEIC"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});
