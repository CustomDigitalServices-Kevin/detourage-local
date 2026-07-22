import type { ReactElement } from "react";
import { useLocale } from "../i18n/locale-context";

// Runtime dependencies and the bundled model only (build tooling — Vite,
// TypeScript, ESLint, Vitest, Playwright — is not shipped and is out of scope
// here). `covers` maps a display row to the package names it credits.
export interface RuntimeLicenseEntry {
  name: string;
  license: string;
  covers: string[];
}

export const RUNTIME_LICENSES: readonly RuntimeLicenseEntry[] = [
  { name: "react / react-dom", license: "MIT", covers: ["react", "react-dom"] },
  {
    name: "@huggingface/transformers (Transformers.js)",
    license: "Apache-2.0",
    covers: ["@huggingface/transformers"],
  },
  { name: "heic2any", license: "MIT", covers: ["heic2any"] },
  {
    name: "BiRefNet_lite (modèle ONNX, onnx-community)",
    license: "MIT",
    covers: [],
  },
];

interface LicensesPageProps {
  onBack: () => void;
}

export function LicensesPage({ onBack }: LicensesPageProps): ReactElement {
  const { t } = useLocale();

  return (
    <div className="flex flex-col gap-6 pt-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-txt">{t("licenses.title")}</h1>
      <p className="text-[14.5px] text-muted">{t("licenses.intro")}</p>

      <div className="overflow-x-auto rounded-2xl border border-line bg-panel">
        <table className="w-full text-left text-sm">
          <thead className="bg-panel-2">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-semibold text-txt">
                {t("licenses.columnLibrary")}
              </th>
              <th scope="col" className="px-4 py-2.5 font-semibold text-txt">
                {t("licenses.columnLicense")}
              </th>
            </tr>
          </thead>
          <tbody>
            {RUNTIME_LICENSES.map((entry) => (
              <tr key={entry.name} className="border-t border-line">
                <td className="px-4 py-2.5 text-muted">{entry.name}</td>
                <td className="px-4 py-2.5 text-muted">{entry.license}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        className="self-start rounded-xl border border-line-strong px-4 py-2 text-sm font-semibold text-muted transition-colors hover:border-faint hover:text-txt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
        onClick={onBack}
      >
        {t("licenses.back")}
      </button>
    </div>
  );
}
