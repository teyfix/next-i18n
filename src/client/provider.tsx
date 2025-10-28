import dlv from "dlv";
import { dset } from "dset/merge";
import { getIntlCache } from "../core/cache";
import { IntlProviderError } from "../utils/errors";
import { IntlContextProvider } from "./context-provider";

export async function IntlProvider(props: {
  children: React.ReactNode;
  namespaces: string[];
}) {
  if (!props.namespaces.length) {
    return props.children;
  }

  const { config, locale, messages } = getIntlCache();
  const context = {
    locale,
    config: {
      refProp: config.refProp,
    },
    messages: {},
  };

  for (const nsp of props.namespaces) {
    const value = dlv(messages[locale], nsp);

    if (value == null) {
      throw new IntlProviderError(
        `Namespace "${nsp}" not found in locale "${locale}"`,
      );
    }

    dset(context.messages, nsp, dlv(messages[locale], nsp));
  }

  return (
    <IntlContextProvider value={context}>{props.children}</IntlContextProvider>
  );
}
