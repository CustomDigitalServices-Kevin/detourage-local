import type { ReactElement } from "react";
import { useLocale } from "../i18n/locale-context";

interface PrivacyPageProps {
  onBack: () => void;
}

export function PrivacyPage({ onBack }: PrivacyPageProps): ReactElement {
  const { t } = useLocale();

  return (
    <div className="flex flex-col gap-6 pt-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-txt">{t("privacy.title")}</h1>

      <section className="rounded-2xl border border-line bg-panel p-5">
        <h2 className="text-base font-bold text-txt">{t("privacy.intro.title")}</h2>
        <p className="mt-1.5 text-[14.5px] text-muted">{t("privacy.intro.body")}</p>
      </section>

      <section className="rounded-2xl border border-line bg-panel p-5">
        <h2 className="text-base font-bold text-txt">{t("privacy.local.title")}</h2>
        <p className="mt-1.5 text-[14.5px] text-muted">{t("privacy.local.body")}</p>
      </section>

      <section className="rounded-2xl border border-line bg-panel p-5">
        <h2 className="text-base font-bold text-txt">{t("privacy.comparison.title")}</h2>
        <p className="mt-1.5 text-[14.5px] text-muted">{t("privacy.comparison.body")}</p>
      </section>

      <section className="rounded-2xl border border-line bg-panel p-5">
        <h2 className="text-base font-bold text-txt">{t("privacy.data.title")}</h2>
        <p className="mt-1.5 text-[14.5px] text-muted">{t("privacy.data.body")}</p>
      </section>

      <section className="rounded-2xl border border-line bg-panel p-5">
        <h2 className="text-base font-bold text-txt">{t("privacy.cookies.title")}</h2>
        <p className="mt-1.5 text-[14.5px] text-muted">{t("privacy.cookies.body")}</p>
      </section>

      <button
        type="button"
        className="self-start rounded-xl border border-line-strong px-4 py-2 text-sm font-semibold text-muted transition-colors hover:border-faint hover:text-txt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
        onClick={onBack}
      >
        {t("privacy.back")}
      </button>
    </div>
  );
}
