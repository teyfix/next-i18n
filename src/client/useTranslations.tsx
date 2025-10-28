import dlv from "dlv";
import { dset } from "dset/merge";
import { klona } from "klona";
import { getIntlCache } from "../core/cache";
import type { InferTranslate } from "../types/InferTranslate";
import type { NamespacePaths } from "../types/NamespacePaths";
import { createTFunction } from "../utils/createTFunction";
import { IntlClientError } from "../utils/errors";
import { wrapMessages } from "../utils/wrapMessages";
import { useIntlContext } from "./context-provider";

declare var window: unknown;

const localeNotLoaded = (locale: string) => {
  throw new IntlClientError(`Locale "${locale}" not loaded`);
};

const nspNotFound = (path: string, locale: string) => {
  throw new IntlClientError(
    `Namespace "${path}" not found in locale "${locale}"`,
  );
};

export const useTranslations = <
  TMessages extends object,
  TRef extends string,
  TPath extends NamespacePaths<TMessages, TRef>,
>(
  path: TPath,
): InferTranslate<TMessages, TPath, TRef> => {
  const context = useIntlContext();

  if (context == null) {
    throw new IntlClientError(
      "useTranslations must be used within <IntlProvider />",
    );
  }

  let nsp = dlv(context.messages, path);

  /**
   * Try to load the namespace from React.cache
   * if we're in the server
   */
  if (nsp == null && typeof window === "undefined") {
    const { config, locale, messages, client } = getIntlCache();

    /**
     * Check if the locale is loaded.
     */
    if (messages[locale] == null) {
      localeNotLoaded(locale);
    }

    /**
     * Check the cache if we loaded the namespace
     */
    nsp = dlv(client[locale], path);

    /**
     * If not, load the namespace
     */
    if (nsp == null) {
      /**
       * Get the namespace from React.cache
       */
      nsp = dlv(messages[locale], path);

      /**
       * Locale is loaded but namespace does not exist
       */
      if (nsp == null) {
        nspNotFound(path, locale);
      }

      /**
       * Wrap the namespace without refLoader
       * since passing the function to the client
       * is not possible
       */
      nsp = wrapMessages(klona(nsp), {
        refProp: config.refProp,
      });

      client[locale] ||= {};

      /**
       * Update client cache for SSR
       */
      dset(client[locale], path, nsp);

      /**
       * Update client context for hydration
       */
      dset(context.messages, path, nsp);
    }
  }

  if (nsp == null) {
    nspNotFound(path, context.locale);
  }

  const tFunction = createTFunction(nsp, path);

  return tFunction as InferTranslate<TMessages, TPath, TRef>;
};
