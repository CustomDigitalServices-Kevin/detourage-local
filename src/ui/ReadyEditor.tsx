import { useCallback, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { useLocale } from "../i18n/locale-context";
import type { Mask } from "../lib";
import { encodePng, renderResult } from "../lib";
import type { SelectedImage } from "./image-item";
import type { ReadyCutout } from "./studio/cutouts-reducer";
import type { BackgroundState } from "./studio/background-state";
import { toBackgroundOption } from "./studio/background-state";
import { cutoutFileName, triggerDownload } from "./studio/download";
import { useLiveBrush } from "./studio/use-live-brush";
import type { BrushSettings } from "./studio/brush-settings";
import { BackgroundControls } from "./BackgroundControls";
import { BrushControls } from "./BrushControls";
import { PreviewPanels } from "./PreviewPanels";
import { DownloadIcon } from "./icons";

interface ReadyEditorProps {
  image: SelectedImage;
  cutout: ReadyCutout;
  background: BackgroundState;
  onBackgroundChange: (state: BackgroundState) => void;
  brush: BrushSettings;
  onBrushChange: (settings: BrushSettings) => void;
  onCommitMask: (mask: Mask) => void;
  onResetMask: () => void;
  onReprocess: () => void;
  busy: boolean;
}

export function ReadyEditor({
  image,
  cutout,
  background,
  onBackgroundChange,
  brush,
  onBrushChange,
  onCommitMask,
  onResetMask,
  onReprocess,
  busy,
}: ReadyEditorProps): ReactElement {
  const { t } = useLocale();
  const [downloadError, setDownloadError] = useState(false);

  const live = useLiveBrush(
    cutout.mask,
    { hardness: brush.hardness, mode: brush.mode },
    onCommitMask,
  );

  const backgroundOption = useMemo(
    () =>
      toBackgroundOption(background, {
        width: cutout.original.width,
        height: cutout.original.height,
      }),
    [background, cutout.original.width, cutout.original.height],
  );

  const result = useMemo(
    () => renderResult(cutout.original, live.mask, backgroundOption),
    [cutout.original, live.mask, backgroundOption],
  );

  const handleDownload = useCallback(async (): Promise<void> => {
    setDownloadError(false);
    try {
      const blob = await encodePng(result);
      triggerDownload(blob, cutoutFileName(image.file.name));
    } catch {
      setDownloadError(true);
    }
  }, [result, image.file.name]);

  return (
    <div className="flex flex-col gap-4">
      <PreviewPanels
        original={cutout.original}
        result={result}
        brushEnabled={!busy}
        brushDisplaySize={brush.displaySize}
        onStroke={(segment) => {
          live.paint(segment);
        }}
      />

      <p className="text-[12.5px] text-muted">{t("editor.hintReady")}</p>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <BackgroundControls state={background} onChange={onBackgroundChange} disabled={busy} />
        <BrushControls
          settings={brush}
          onChange={onBrushChange}
          onReset={onResetMask}
          disabled={busy}
        />
      </div>

      {downloadError && <p className="text-[12.5px] text-red">{t("editor.error.generic")}</p>}

      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-orange to-orange-mid px-4 py-2.5 text-sm font-bold text-black transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => {
            void handleDownload();
          }}
        >
          <DownloadIcon className="size-4" />
          {t("editor.download")}
        </button>
        <button
          type="button"
          disabled={busy}
          className="rounded-xl border border-line-strong px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:border-faint hover:text-txt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onReprocess}
        >
          {t("editor.reprocess")}
        </button>
      </div>
    </div>
  );
}
