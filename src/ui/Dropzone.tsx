import { useCallback, useId, useState } from "react";
import type { ChangeEvent, DragEvent, ReactElement } from "react";
import { useLocale } from "../i18n/locale-context";
import { ACCEPT_ATTRIBUTE, FORMAT_LABELS } from "./accepted-formats";
import { UploadIcon } from "./icons";

interface DropzoneProps {
  onFilesAdded: (files: File[]) => void;
}

export function Dropzone({ onFilesAdded }: DropzoneProps): ReactElement {
  const { t } = useLocale();
  const [isActive, setIsActive] = useState(false);
  const inputId = useId();

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsActive(false);
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsActive(false);
      const files = Array.from(event.dataTransfer.files);
      if (files.length > 0) onFilesAdded(files);
    },
    [onFilesAdded],
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      if (files.length > 0) onFilesAdded(files);
      event.target.value = "";
    },
    [onFilesAdded],
  );

  return (
    <div
      className={`relative mx-auto max-w-3xl rounded-[22px] p-[2px] transition-all duration-300 ${
        isActive
          ? "dropzone-border-active -translate-y-0.5 shadow-[0_24px_60px_-28px_rgba(255,107,0,0.45)]"
          : "dropzone-border hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-28px_rgba(255,107,0,0.35)]"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid="dropzone"
    >
      <label
        htmlFor={inputId}
        className="dropzone-inner-glow flex cursor-pointer flex-col items-center gap-3.5 rounded-[20px] px-8 py-12 text-center focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-orange"
      >
        <span className="grid size-16 place-items-center rounded-2xl border border-orange/30 bg-orange-soft">
          <UploadIcon className="size-7.5 text-orange" />
        </span>
        <span className="text-lg font-bold text-txt">
          {isActive ? t("dropzone.hintActive") : t("dropzone.hint")}
        </span>
        <span className="flex flex-wrap justify-center gap-1.5 pt-1.5">
          {FORMAT_LABELS.map((format) => (
            <span
              key={format}
              className="rounded-[7px] border border-line bg-panel-2 px-2.5 py-1 text-[11px] font-bold tracking-wider text-muted uppercase"
            >
              {format}
            </span>
          ))}
        </span>
        <input
          id={inputId}
          type="file"
          multiple
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          aria-label={t("dropzone.browseLabel")}
          onChange={handleChange}
        />
      </label>
    </div>
  );
}
