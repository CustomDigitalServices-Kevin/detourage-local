import { useCallback, useId, useState } from "react";
import type { ChangeEvent, ReactElement } from "react";
import { useLocale } from "../i18n/locale-context";
import { decodeImageFile } from "../lib";
import type { BackgroundKind, BackgroundState } from "./studio/background-state";
import { COLOR_PRESETS, isValidHexColor } from "./studio/background-state";
import { ImageIcon } from "./icons";

interface BackgroundControlsProps {
  state: BackgroundState;
  onChange: (state: BackgroundState) => void;
  disabled?: boolean;
}

const KIND_KEYS: readonly { kind: BackgroundKind; label: "bg.transparent" | "bg.color" | "bg.image" }[] =
  [
    { kind: "transparent", label: "bg.transparent" },
    { kind: "color", label: "bg.color" },
    { kind: "image", label: "bg.image" },
  ];

export function BackgroundControls({
  state,
  onChange,
  disabled = false,
}: BackgroundControlsProps): ReactElement {
  const { t } = useLocale();
  const colorInputId = useId();
  const [imageError, setImageError] = useState(false);

  const selectKind = useCallback(
    (kind: BackgroundKind) => {
      onChange({ ...state, kind });
    },
    [onChange, state],
  );

  const selectColor = useCallback(
    (color: string) => {
      onChange({ ...state, kind: "color", color });
    },
    [onChange, state],
  );

  const handleColorInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      selectColor(event.target.value);
    },
    [selectColor],
  );

  const handleImageFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (file === undefined) return;
      setImageError(false);
      try {
        const image = await decodeImageFile(file);
        onChange({ ...state, kind: "image", image });
      } catch {
        setImageError(true);
      }
    },
    [onChange, state],
  );

  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <h3 className="mb-3 text-[13.5px] font-bold text-txt">{t("bg.title")}</h3>

      <div className="flex gap-1.5" role="group" aria-label={t("bg.title")}>
        {KIND_KEYS.map(({ kind, label }) => {
          const active = state.kind === kind;
          return (
            <button
              key={kind}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              className={`flex-1 rounded-lg border px-3 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange disabled:cursor-not-allowed disabled:opacity-50 ${
                active
                  ? "border-orange bg-orange-soft text-orange"
                  : "border-line-strong text-muted hover:border-faint hover:text-txt"
              }`}
              onClick={() => {
                selectKind(kind);
              }}
            >
              {t(label)}
            </button>
          );
        })}
      </div>

      {state.kind === "color" && (
        <div className="mt-3.5 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((preset) => {
              const active = state.color.toLowerCase() === preset.toLowerCase();
              return (
                <button
                  key={preset}
                  type="button"
                  disabled={disabled}
                  aria-label={preset}
                  aria-pressed={active}
                  className={`size-7 rounded-lg border transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange disabled:cursor-not-allowed disabled:opacity-50 ${
                    active ? "border-orange ring-2 ring-orange/40" : "border-line-strong"
                  }`}
                  data-swatch={preset}
                  style={{ backgroundColor: preset }}
                  onClick={() => {
                    selectColor(preset);
                  }}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-2.5">
            <input
              id={colorInputId}
              type="color"
              disabled={disabled}
              aria-label={t("bg.custom")}
              className="size-9 shrink-0 cursor-pointer rounded-lg border border-line-strong bg-transparent disabled:cursor-not-allowed disabled:opacity-50"
              value={isValidHexColor(state.color) ? normalizeHex(state.color) : "#ffffff"}
              onChange={handleColorInput}
            />
            <label htmlFor={colorInputId} className="text-[12.5px] text-muted">
              {t("bg.custom")}
              <span className="ml-2 font-mono text-faint">{state.color}</span>
            </label>
          </div>
        </div>
      )}

      {state.kind === "image" && (
        <div className="mt-3.5 flex flex-col gap-2">
          <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-line-strong px-3 py-2 text-[12.5px] font-semibold text-txt transition-colors hover:border-orange hover:text-orange focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-orange">
            <ImageIcon className="size-4" />
            {state.image === null ? t("bg.chooseImage") : t("bg.replaceImage")}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
              className="sr-only"
              disabled={disabled}
              onChange={(event) => {
                void handleImageFile(event);
              }}
            />
          </label>
          {imageError && <p className="text-[12px] text-red">{t("bg.imageError")}</p>}
        </div>
      )}
    </div>
  );
}

// A native <input type="color"> only accepts #rrggbb; the 3/4/8-digit forms the
// parser also allows must be widened before they can seed the picker.
function normalizeHex(value: string): string {
  const trimmed = value.trim();
  const short = /^#([0-9a-f]{3})$/i.exec(trimmed);
  if (short?.[1] !== undefined) {
    return `#${short[1].replace(/./g, (char) => char + char)}`;
  }
  const full = /^#([0-9a-f]{6})/i.exec(trimmed);
  return full?.[0] !== undefined ? full[0] : "#ffffff";
}
