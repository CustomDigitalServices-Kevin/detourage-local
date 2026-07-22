import type { ReactElement } from "react";
import { useLocale } from "../i18n/locale-context";

/** Public repository whose README documents browser compatibility. */
const DOC_URL = "https://github.com/CustomDigitalServices-Kevin/detourage-local#compatibility";

// Inline, decorative desktop-browser glyph: the adjacent text carries the
// meaning, so the svg is aria-hidden.
function MonitorIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

/**
 * Honest empty-state shown IN PLACE of the cutout zone when WebGPU is missing.
 * It never mounts the Studio, so no engine is created and the ~110 MB model is
 * never fetched: there is simply no way to trigger inference from here.
 */
export function WebGpuUnsupported(): ReactElement {
  const { t } = useLocale();
  return (
    <div
      className="mx-auto max-w-2xl rounded-2xl border border-orange/25 bg-orange-soft/40 p-8 text-center"
      data-testid="webgpu-unsupported"
      role="alert"
    >
      <span className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-orange-soft text-orange">
        <MonitorIcon className="size-6" />
      </span>
      <h2 className="text-lg font-bold text-txt">{t("webgpu.title")}</h2>
      <p className="mx-auto mt-2.5 max-w-md text-[14px] text-muted">{t("webgpu.body")}</p>
      <p className="mx-auto mt-2 max-w-md text-[12.8px] text-faint">{t("webgpu.detail")}</p>
      <a
        href={DOC_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex items-center gap-2 rounded-xl border border-line-strong px-4 py-2.5 text-sm font-semibold text-txt transition-colors hover:border-orange hover:text-orange focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
      >
        {t("webgpu.docLink")}
      </a>
    </div>
  );
}
