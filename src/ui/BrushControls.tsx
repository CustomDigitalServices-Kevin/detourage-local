import type { ChangeEvent, ReactElement } from "react";
import { useLocale } from "../i18n/locale-context";
import type { BrushMode } from "../lib";
import type { BrushSettings } from "./studio/brush-settings";
import { BRUSH_MAX_SIZE, BRUSH_MIN_SIZE } from "./studio/brush-settings";
import { BrushIcon } from "./icons";

interface BrushControlsProps {
  settings: BrushSettings;
  onChange: (settings: BrushSettings) => void;
  onReset: () => void;
  disabled?: boolean;
}

const MODES: readonly { mode: BrushMode; label: "brush.restore" | "brush.erase" }[] = [
  { mode: "restore", label: "brush.restore" },
  { mode: "erase", label: "brush.erase" },
];

export function BrushControls({
  settings,
  onChange,
  onReset,
  disabled = false,
}: BrushControlsProps): ReactElement {
  const { t } = useLocale();

  const handleSize = (event: ChangeEvent<HTMLInputElement>): void => {
    onChange({ ...settings, displaySize: Number(event.target.value) });
  };
  const handleHardness = (event: ChangeEvent<HTMLInputElement>): void => {
    onChange({ ...settings, hardness: Number(event.target.value) / 100 });
  };

  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <h3 className="mb-1 flex items-center gap-2 text-[13.5px] font-bold text-txt">
        <BrushIcon className="size-4 text-orange" />
        {t("brush.title")}
      </h3>
      <p className="mb-3 text-[12px] text-muted">{t("brush.hint")}</p>

      <div className="flex gap-1.5" role="group" aria-label={t("brush.title")}>
        {MODES.map(({ mode, label }) => {
          const active = settings.mode === mode;
          return (
            <button
              key={mode}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              className={`flex-1 rounded-lg border px-3 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange disabled:cursor-not-allowed disabled:opacity-50 ${
                active
                  ? "border-orange bg-orange-soft text-orange"
                  : "border-line-strong text-muted hover:border-faint hover:text-txt"
              }`}
              onClick={() => {
                onChange({ ...settings, mode });
              }}
            >
              {t(label)}
            </button>
          );
        })}
      </div>

      <label className="mt-3.5 block text-[12px] text-muted">
        <span className="mb-1.5 flex items-center justify-between">
          {t("brush.size")}
          <span className="font-semibold tabular-nums text-faint">{settings.displaySize} px</span>
        </span>
        <input
          type="range"
          min={BRUSH_MIN_SIZE}
          max={BRUSH_MAX_SIZE}
          step={1}
          value={settings.displaySize}
          disabled={disabled}
          className="w-full accent-orange disabled:cursor-not-allowed disabled:opacity-50"
          onChange={handleSize}
        />
      </label>

      <label className="mt-3 block text-[12px] text-muted">
        <span className="mb-1.5 flex items-center justify-between">
          {t("brush.hardness")}
          <span className="font-semibold tabular-nums text-faint">
            {Math.round(settings.hardness * 100)}%
          </span>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(settings.hardness * 100)}
          disabled={disabled}
          className="w-full accent-orange disabled:cursor-not-allowed disabled:opacity-50"
          onChange={handleHardness}
        />
      </label>

      <button
        type="button"
        disabled={disabled}
        className="mt-3.5 rounded-lg border border-line-strong px-3 py-1.5 text-[12.5px] font-semibold text-muted transition-colors hover:border-faint hover:text-txt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange disabled:cursor-not-allowed disabled:opacity-50"
        onClick={onReset}
      >
        {t("brush.reset")}
      </button>
    </div>
  );
}
