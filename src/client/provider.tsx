import { getIntlCache } from "../core/cache";
import { IntlContextProvider } from "./context-provider";

export async function IntlProvider(props: { children: React.ReactNode }) {
  const cache = getIntlCache();

  return (
    <IntlContextProvider
      value={{ locale: cache.locale, messages: cache.client }}
    >
      {props.children}
    </IntlContextProvider>
  );
}
