import dlv from "dlv";
import type { InferTranslate } from "../types/InferTranslate";
import type { NamespacePaths } from "../types/NamespacePaths";
import { createTFunction } from "../utils/createTFunction";
import { IntlClientError, IntlContextError } from "../utils/errors";
import { useIntlContext } from "./context-provider";

const nspHint =
  "Maybe you forgot to declare namespaces using `withLocale().withNamespaces(...)`?";

const nspNotFound = (message: string) => `${message}\n${nspHint}`;

export const useTranslations = <
  TMessages extends object,
  TRef extends string,
  TPath extends NamespacePaths<TMessages, TRef>,
>(
  path: TPath,
): InferTranslate<TMessages, TPath, TRef> => {
  const context = useIntlContext();

  if (context == null) {
    throw new IntlContextError(
      nspNotFound("`useTranslations` must be used within `<IntlProvider />`"),
    );
  }

  const nsp = dlv(context.messages, path);

  if (nsp == null) {
    throw new IntlClientError(
      nspNotFound(
        `Namespace "${path}" not found in locale "${context.locale}"`,
      ),
    );
  }

  const tFunction = createTFunction(nsp, path);

  return tFunction as InferTranslate<TMessages, TPath, TRef>;
};
