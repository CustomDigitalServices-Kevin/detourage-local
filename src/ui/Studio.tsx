import { useCallback, useState } from "react";
import type { ReactElement } from "react";
import { useLocale } from "../i18n/locale-context";
import { encodePng, renderResult } from "../lib";
import type { SelectedImage } from "./image-item";
import type { CutoutEngine } from "./studio/cutout-engine";
import { readyIds } from "./studio/cutouts-reducer";
import { useStudio } from "./studio/use-studio";
import type { BackgroundState } from "./studio/background-state";
import { DEFAULT_BACKGROUND, toBackgroundOption } from "./studio/background-state";
import { cutoutFileName, triggerDownload } from "./studio/download";
import type { BrushSettings } from "./studio/brush-settings";
import { DEFAULT_BRUSH } from "./studio/brush-settings";
import { Gallery } from "./Gallery";
import { Editor } from "./Editor";
import { ModelStatus } from "./ModelStatus";
import { Spinner } from "./Spinner";
import { DownloadIcon } from "./icons";

interface StudioProps {
  items: readonly SelectedImage[];
  rejectedNames: readonly string[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
  /** Injectable for tests; defaults to the real ONNX-backed engine. */
  createEngine?: () => CutoutEngine;
}

export function Studio({
  items,
  rejectedNames,
  onRemove,
  onClearAll,
  createEngine,
}: StudioProps): ReactElement {
  const { t } = useLocale();
  const studio = useStudio(createEngine);
  const { cutouts, model } = studio;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [background, setBackground] = useState<BackgroundState>(DEFAULT_BACKGROUND);
  const [brush, setBrush] = useState<BrushSettings>(DEFAULT_BRUSH);

  // Derive the active image every render so a removed selection falls back to
  // the first image without a synchronising effect.
  const active = items.find((item) => item.id === selectedId) ?? items[0] ?? null;
  const modelBusy = model.status === "loading";
  const ready = readyIds(
    items.map((item) => item.id),
    cutouts,
  );

  const handleRemove = useCallback(
    (id: string) => {
      studio.remove(id);
      onRemove(id);
    },
    [studio, onRemove],
  );

  const handleClearAll = useCallback(() => {
    studio.clear();
    onClearAll();
  }, [studio, onClearAll]);

  const handleProcessAll = useCallback(() => {
    void studio.processAll(items.map((item) => ({ id: item.id, file: item.file })));
  }, [studio, items]);

  const handleDownloadAll = useCallback(async (): Promise<void> => {
    for (const id of ready) {
      const entry = cutouts.get(id);
      const item = items.find((candidate) => candidate.id === id);
      if (entry?.status !== "ready" || item === undefined) continue;
      const option = toBackgroundOption(background, {
        width: entry.original.width,
        height: entry.original.height,
      });
      const blob = await encodePng(renderResult(entry.original, entry.mask, option));
      triggerDownload(blob, cutoutFileName(item.file.name));
    }
  }, [ready, cutouts, items, background]);

  return (
    <div className="flex flex-col gap-4" data-testid="studio">
      <ModelStatus model={model} onRetry={handleProcessAll} />

      {items.length > 0 && (
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            disabled={modelBusy}
            className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-orange to-orange-mid px-4 py-2.5 text-sm font-bold text-black transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleProcessAll}
          >
            {modelBusy && <Spinner className="size-4 border-black/30 border-t-black" />}
            {modelBusy ? t("gallery.processing") : t("gallery.processAll")}
          </button>

          {ready.length > 0 && (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-line-strong px-4 py-2.5 text-sm font-semibold text-txt transition-colors hover:border-orange hover:text-orange focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
              onClick={() => {
                void handleDownloadAll();
              }}
            >
              <DownloadIcon className="size-4" />
              {t("editor.downloadAll")}
            </button>
          )}
        </div>
      )}

      <Gallery
        items={items}
        cutouts={cutouts}
        activeId={active?.id ?? null}
        rejectedNames={rejectedNames}
        onSelect={setSelectedId}
        onRemove={handleRemove}
        onClearAll={handleClearAll}
      />

      <Editor
        activeImage={active}
        entry={active !== null ? cutouts.get(active.id) : undefined}
        background={background}
        onBackgroundChange={setBackground}
        brush={brush}
        onBrushChange={setBrush}
        onProcess={(id, file) => {
          void studio.process(id, file);
        }}
        onCommitMask={(id, mask) => {
          studio.setMask(id, mask);
        }}
        onResetMask={(id) => {
          studio.resetMask(id);
        }}
        modelBusy={modelBusy}
      />
    </div>
  );
}
