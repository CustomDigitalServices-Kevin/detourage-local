import type { ReactElement } from "react";
import { useLocale } from "../i18n/locale-context";
import type { SelectedImage } from "./image-item";
import type { CutoutEntry, CutoutMap } from "./studio/cutouts-reducer";
import { formatBytes } from "./format-bytes";
import { CheckIcon, CloseIcon } from "./icons";
import { Spinner } from "./Spinner";

interface GalleryProps {
  items: readonly SelectedImage[];
  cutouts: CutoutMap;
  activeId: string | null;
  rejectedNames: readonly string[];
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

function StatusBadge({ entry }: { entry: CutoutEntry | undefined }): ReactElement | null {
  const { t } = useLocale();
  if (entry === undefined || entry.status === "idle") return null;

  if (entry.status === "processing") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10.5px] font-semibold text-txt backdrop-blur-sm">
        <Spinner className="size-2.5" />
        {t("gallery.status.processing")}
      </span>
    );
  }
  if (entry.status === "ready") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green/85 px-2 py-0.5 text-[10.5px] font-bold text-black">
        <CheckIcon className="size-2.5" />
        {t("gallery.status.ready")}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-red/85 px-2 py-0.5 text-[10.5px] font-bold text-black">
      {t("gallery.status.error")}
    </span>
  );
}

export function Gallery({
  items,
  cutouts,
  activeId,
  rejectedNames,
  onSelect,
  onRemove,
  onClearAll,
}: GalleryProps): ReactElement {
  const { t } = useLocale();
  const countLabel = items.length === 1 ? t("work.count.one") : t("work.count.other");

  return (
    <div className="rounded-2xl border border-line bg-panel p-5" data-testid="work-area">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-base font-bold text-txt">{t("work.title")}</h2>
        {items.length > 0 && (
          <button
            type="button"
            className="rounded-lg border border-line-strong px-3 py-1.5 text-[12.5px] font-semibold text-muted transition-colors hover:border-faint hover:text-txt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
            onClick={onClearAll}
          >
            {t("work.clearAll")}
          </button>
        )}
      </div>

      {rejectedNames.length > 0 && (
        <p className="mb-4 rounded-xl border border-red/25 bg-red/8 px-3.5 py-2 text-[12.5px] text-red">
          {t("work.rejected")} {rejectedNames.join(", ")}
        </p>
      )}

      {items.length === 0 ? (
        <p className="py-8 text-center text-[13.5px] text-muted">{t("work.empty")}</p>
      ) : (
        <>
          <p className="mb-3 text-[12.5px] text-faint">
            {items.length} {countLabel}
          </p>
          <ul className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
            {items.map((item) => {
              const isActive = item.id === activeId;
              return (
                <li key={item.id} className="relative" data-testid="work-item">
                  <button
                    type="button"
                    aria-label={t("gallery.select")}
                    aria-pressed={isActive}
                    className={`block w-full overflow-hidden rounded-xl border bg-panel-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange ${
                      isActive ? "border-orange ring-1 ring-orange/40" : "border-line hover:border-line-strong"
                    }`}
                    onClick={() => {
                      onSelect(item.id);
                    }}
                  >
                    <span className="alpha-checkerboard relative flex aspect-square items-center justify-center">
                      <img src={item.url} alt={item.file.name} className="max-h-full max-w-full object-contain" />
                      <span className="absolute bottom-1.5 left-1.5">
                        <StatusBadge entry={cutouts.get(item.id)} />
                      </span>
                    </span>
                    <span className="block px-2.5 py-2">
                      <span className="block truncate text-[12px] font-medium text-txt" title={item.file.name}>
                        {item.file.name}
                      </span>
                      <span className="block text-[11px] text-faint">{formatBytes(item.file.size)}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-md bg-black/55 text-txt backdrop-blur-sm transition-colors hover:bg-black/75 hover:text-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
                    aria-label={t("work.remove")}
                    onClick={() => {
                      onRemove(item.id);
                    }}
                  >
                    <CloseIcon className="size-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
