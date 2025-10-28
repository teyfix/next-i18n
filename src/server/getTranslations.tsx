import dlv from "dlv";
import { dset } from "dset/merge";
import { klona } from "klona";
import type { InferTranslate } from "../types/InferTranslate";
import type { NamespacePaths } from "../types/NamespacePaths";
import { IntlServerError } from "../utils/errors";
import { wrapMessages } from "../utils/wrapMessages";
import { getIntlCache } from "../core/cache";

export const getTranslations = async <
  TMessages extends object,
  TRef extends string,
  TPath extends NamespacePaths<TMessages, TRef>,
>(
  path: TPath,
): Promise<InferTranslate<TMessages, TPath, TRef>> => {
  const { config, locale, messages, server } = getIntlCache();

  if (messages[locale] == null) {
    throw new IntlServerError(`Locale "${locale}" not loaded`);
  }

  let nsp = dlv(server[locale], path);

  if (nsp == null) {
    nsp = dlv(messages[locale], path);

    if (nsp == null) {
      throw new IntlServerError(
        `Namespace "${path}" not found in locale "${locale}"`,
      );
    }

    nsp = wrapMessages(klona(nsp), config);
    server[locale] ||= {};

    dset(server[locale], path, nsp);
  }

  function tFunction(key: string, params: Record<string, string>) {
    const deepValue = dlv(nsp, key);

    if (deepValue == null) {
      throw new IntlServerError(
        `Translation "${key}" not found in namespace "${path}"`,
      );
    }

    if (typeof deepValue === "function" && !("displayName" in deepValue)) {
      return deepValue(params);
    }

    return deepValue;
  }

  Object.assign(tFunction, nsp);

  return tFunction as InferTranslate<TMessages, TPath, TRef>;
};
