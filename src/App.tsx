import { LocaleProvider } from "./i18n/LocaleProvider";
import { Shell } from "./ui/Shell";

export function App(): React.ReactElement {
  return (
    <LocaleProvider>
      <Shell />
    </LocaleProvider>
  );
}
