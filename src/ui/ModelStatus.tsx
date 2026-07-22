import type { ReactElement } from "react";
import { useLocale } from "../i18n/locale-context";
import type { ModelState } from "./studio/use-studio";
import { BoltIcon, CheckIcon } from "./icons";

interface ModelStatusProps {
  model: ModelState;
  onRetry: () => void;
}

function BackendBadge({ backend }: { backend: "webgpu" | "wasm" }): ReactElement {
  const { t } = useLocale();
  const label = backend === "webgpu" ? t("model.backend.webgpu") : t("model.backend.wasm");
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel-2 px-2.5 py-1 text-[11.5px] font-semibold text-muted">
      <BoltIcon className="size-3 text-orange" />
      {label}
    </span>
  );
}

export function ModelStatus({ model, onRetry }: ModelStatusProps): ReactElement | null {
  const { t } = useLocale();

  if (model.status === "idle") return null;

  if (model.status === "error") {
    return (
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red/25 bg-red/8 px-4 py-3"
        data-testid="model-status"
        role="alert"
      >
        <p className="text-[13px] text-red">{t("model.error")}</p>
        <button
          type="button"
          className="rounded-lg border border-line-strong px-3 py-1.5 text-[12.5px] font-semibold text-txt transition-colors hover:border-orange hover:text-orange focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
          onClick={onRetry}
        >
          {t("model.retry")}
        </button>
      </div>
    );
  }

  if (model.status === "ready") {
    return (
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green/22 bg-green/8 px-4 py-3"
        data-testid="model-status"
      >
        <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-green">
          <CheckIcon className="size-3.5" />
          {t("model.ready")}
        </p>
        {model.backend !== null && <BackendBadge backend={model.backend} />}
      </div>
    );
  }

  // loading
  const percent = Math.round(model.fraction * 100);
  return (
    <div
      className="flex flex-col gap-2.5 rounded-xl border border-line bg-panel px-4 py-3"
      data-testid="model-status"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-txt">{t("model.loading")}</p>
        <span className="text-[12.5px] font-semibold tabular-nums text-muted">{percent}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-panel-2"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("model.loading")}
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-orange to-orange-light transition-[width] duration-200"
          style={{ width: `${percent.toString()}%` }}
        />
      </div>
    </div>
  );
}
