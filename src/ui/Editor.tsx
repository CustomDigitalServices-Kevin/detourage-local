import type { ReactElement } from "react";
import { useLocale } from "../i18n/locale-context";
import type { Mask } from "../lib";
import type { SelectedImage } from "./image-item";
import type { CutoutEntry } from "./studio/cutouts-reducer";
import type { BackgroundState } from "./studio/background-state";
import type { BrushSettings } from "./studio/brush-settings";
import { ReadyEditor } from "./ReadyEditor";
import { Spinner } from "./Spinner";

interface EditorProps {
  activeImage: SelectedImage | null;
  entry: CutoutEntry | undefined;
  background: BackgroundState;
  onBackgroundChange: (state: BackgroundState) => void;
  brush: BrushSettings;
  onBrushChange: (settings: BrushSettings) => void;
  onProcess: (id: string, file: File) => void;
  onCommitMask: (id: string, mask: Mask) => void;
  onResetMask: (id: string) => void;
  modelBusy: boolean;
}

export function Editor(props: EditorProps): ReactElement {
  const { t } = useLocale();
  const { activeImage, entry, onProcess, modelBusy } = props;

  if (activeImage === null) {
    return (
      <div className="rounded-2xl border border-line bg-panel p-8 text-center" data-testid="editor">
        <p className="text-[13.5px] text-muted">{t("editor.empty")}</p>
      </div>
    );
  }

  const status = entry?.status ?? "idle";

  return (
    <div className="rounded-2xl border border-line bg-panel p-5" data-testid="editor">
      <h2 className="mb-4 flex items-center gap-2 truncate text-base font-bold text-txt">
        <span className="truncate" title={activeImage.file.name}>
          {activeImage.file.name}
        </span>
      </h2>

      {status === "ready" && entry?.status === "ready" ? (
        <ReadyEditor
          image={activeImage}
          cutout={entry}
          background={props.background}
          onBackgroundChange={props.onBackgroundChange}
          brush={props.brush}
          onBrushChange={props.onBrushChange}
          onCommitMask={(mask) => {
            props.onCommitMask(activeImage.id, mask);
          }}
          onResetMask={() => {
            props.onResetMask(activeImage.id);
          }}
          onReprocess={() => {
            onProcess(activeImage.id, activeImage.file);
          }}
          busy={modelBusy}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="alpha-checkerboard grid place-items-center overflow-hidden rounded-xl border border-line">
            <img
              src={activeImage.url}
              alt={activeImage.file.name}
              className="max-h-80 max-w-full object-contain"
            />
          </div>

          {status === "processing" && (
            <p className="inline-flex items-center gap-2.5 text-[13.5px] text-muted">
              <Spinner className="size-4" />
              {t("editor.processing")}
            </p>
          )}

          {status === "error" && entry?.status === "error" && (
            <p className="rounded-xl border border-red/25 bg-red/8 px-3.5 py-2.5 text-[12.5px] text-red">
              {entry.code === "decode" ? t("editor.error.decode") : t("editor.error.generic")}
            </p>
          )}

          {status !== "processing" && (
            <button
              type="button"
              disabled={modelBusy}
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-linear-to-r from-orange to-orange-mid px-4 py-2.5 text-sm font-bold text-black transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                onProcess(activeImage.id, activeImage.file);
              }}
            >
              {status === "error" ? t("editor.reprocess") : t("editor.process")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
