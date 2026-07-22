import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { useLocale } from "../i18n/locale-context";
import type { Locale } from "../i18n/messages";
import { Dropzone } from "./Dropzone";
import { Studio } from "./Studio";
import { PrivacyPage } from "./PrivacyPage";
import { LicensesPage } from "./LicensesPage";
import { WebGpuUnsupported } from "./WebGpuUnsupported";
import { useWebGpuAvailability } from "./use-webgpu";
import type { CutoutEngine } from "./studio/cutout-engine";
import {
  createSelectedImage,
  partitionAcceptedFiles,
  releaseSelectedImage,
} from "./image-item";
import type { SelectedImage } from "./image-item";
import { BoltIcon, LockIcon, LogoIcon, WrenchIcon } from "./icons";

type Page = "home" | "privacy" | "licenses";

const NAV_LINK_CLASSES =
  "rounded-[10px] px-3 py-1.5 text-[13.5px] text-muted transition-colors duration-150 hover:bg-white/5 hover:text-txt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange";

interface TrustCard {
  icon: ReactElement;
  title: string;
  body: string;
}

export interface ShellProps {
  /**
   * WebGPU probe, injectable for tests. Defaults to the real adapter request.
   * When it resolves false the cutout zone is replaced by an honest
   * "unsupported browser" panel and no inference engine is ever mounted.
   */
  detectWebGpu?: () => Promise<boolean>;
  /** Injectable cutout engine, forwarded to the Studio for deterministic tests. */
  createEngine?: () => CutoutEngine;
}

export function Shell({ detectWebGpu, createEngine }: ShellProps = {}): ReactElement {
  const { locale, setLocale, t } = useLocale();
  const [page, setPage] = useState<Page>("home");
  const [items, setItems] = useState<SelectedImage[]>([]);
  const [rejectedNames, setRejectedNames] = useState<string[]>([]);
  const nextLocale: Locale = locale === "fr" ? "en" : "fr";

  // Probe WebGPU once. Until it resolves we stay optimistic and show the cutout
  // zone (the common desktop-Chromium path is instant); only a definitive
  // "unavailable" swaps in the unsupported panel.
  const webgpuStatus = useWebGpuAvailability(detectWebGpu);
  const webgpuUnsupported = webgpuStatus === "unavailable";

  // Revoke every outstanding object URL on unmount so preview blobs never
  // outlive the component.
  const itemsRef = useRef<SelectedImage[]>(items);
  itemsRef.current = items;
  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) releaseSelectedImage(item);
    };
  }, []);

  const handleFilesAdded = useCallback((files: File[]) => {
    const { accepted, rejectedNames: rejected } = partitionAcceptedFiles(files);
    setRejectedNames(rejected);
    if (accepted.length > 0) {
      setItems((prev) => [...prev, ...accepted.map(createSelectedImage)]);
    }
  }, []);

  const handleRemove = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target !== undefined) releaseSelectedImage(target);
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setItems((prev) => {
      for (const item of prev) releaseSelectedImage(item);
      return [];
    });
    setRejectedNames([]);
  }, []);

  const trustCards: TrustCard[] = [
    { icon: <LockIcon className="size-3.5" />, title: t("trust.gdpr.title"), body: t("trust.gdpr.body") },
    { icon: <BoltIcon className="size-3.5" />, title: t("trust.offline.title"), body: t("trust.offline.body") },
    {
      icon: <WrenchIcon className="size-3.5" />,
      title: t("trust.opensource.title"),
      body: t("trust.opensource.body"),
    },
  ];

  const studioExtra = createEngine !== undefined ? { createEngine } : {};

  return (
    <div className="min-h-screen bg-bg font-sans text-txt antialiased">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/72 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-4 px-4">
          <span className="flex items-center gap-2.5 font-bold tracking-tight">
            <span className="grid size-[30px] shrink-0 place-items-center rounded-[9px] bg-linear-to-br from-orange to-orange-light">
              <LogoIcon className="size-4" />
            </span>
            {t("app.title")}
          </span>

          <nav className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              className={NAV_LINK_CLASSES}
              aria-current={page === "home" ? "page" : undefined}
              onClick={() => {
                setPage("home");
              }}
            >
              {t("nav.home")}
            </button>
            <button
              type="button"
              className={NAV_LINK_CLASSES}
              aria-current={page === "privacy" ? "page" : undefined}
              onClick={() => {
                setPage("privacy");
              }}
            >
              {t("nav.privacy")}
            </button>
            <button
              type="button"
              className={NAV_LINK_CLASSES}
              aria-current={page === "licenses" ? "page" : undefined}
              onClick={() => {
                setPage("licenses");
              }}
            >
              {t("nav.licenses")}
            </button>
          </nav>

          <button
            type="button"
            className="rounded-full border border-line-strong px-3 py-1.5 text-xs font-bold tracking-wide transition-colors hover:border-orange hover:text-orange focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
            data-testid="locale-toggle"
            onClick={() => {
              setLocale(nextLocale);
            }}
          >
            {nextLocale.toUpperCase()}
          </button>
        </div>
      </header>

      <main>
        {page === "home" && (
          <div className="flex flex-col gap-14 pb-20">
            <section className="hero-halo relative overflow-hidden px-4 pt-16 pb-4 text-center">
              <div className="relative mx-auto max-w-3xl">
                <p
                  data-testid="local-banner"
                  className="mx-auto mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-green/22 bg-green/8 px-3.5 py-1.5 text-[12.5px] font-semibold text-green"
                >
                  <span
                    aria-hidden="true"
                    className="size-[7px] shrink-0 rounded-full bg-green shadow-[0_0_10px_var(--color-green)]"
                  />
                  {t("app.localBanner")}
                </p>
                <h1 className="bg-linear-to-r from-orange to-orange-light bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
                  {t("app.title")}
                </h1>
                <p className="mx-auto mt-4 max-w-xl text-base text-muted sm:text-[16.5px]">{t("app.tagline")}</p>
              </div>
            </section>

            {webgpuUnsupported ? (
              <section className="px-4">
                <div className="mx-auto max-w-3xl">
                  <WebGpuUnsupported />
                </div>
              </section>
            ) : (
              <>
                <section className="px-4">
                  <div className="mx-auto max-w-3xl">
                    <Dropzone onFilesAdded={handleFilesAdded} />
                  </div>
                </section>

                <section className="px-4">
                  <div className="mx-auto max-w-3xl">
                    <Studio
                      items={items}
                      rejectedNames={rejectedNames}
                      onRemove={handleRemove}
                      onClearAll={handleClearAll}
                      {...studioExtra}
                    />
                  </div>
                </section>
              </>
            )}

            <section className="px-4">
              <div className="mx-auto grid max-w-3xl gap-3.5 sm:grid-cols-3">
                {trustCards.map((card) => (
                  <div key={card.title} className="rounded-2xl border border-line bg-panel p-5">
                    <h3 className="mb-1.5 flex items-center gap-2 text-[13.5px] font-bold text-txt">
                      <span className="grid size-6.5 shrink-0 place-items-center rounded-lg bg-orange-soft text-orange">
                        {card.icon}
                      </span>
                      {card.title}
                    </h3>
                    <p className="text-[12.8px] text-muted">{card.body}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {page === "privacy" && (
          <div className="mx-auto max-w-3xl px-4 pb-20">
            <PrivacyPage
              onBack={() => {
                setPage("home");
              }}
            />
          </div>
        )}

        {page === "licenses" && (
          <div className="mx-auto max-w-3xl px-4 pb-20">
            <LicensesPage
              onBack={() => {
                setPage("home");
              }}
            />
          </div>
        )}
      </main>

      <footer className="border-t border-line px-4 py-6 text-center text-[12.5px] text-faint">
        {t("footer.brand")}
      </footer>
    </div>
  );
}
