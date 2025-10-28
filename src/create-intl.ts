import type { PropsWithChildren } from "react";
import { useTranslations } from "./client/useTranslations";
import { createConfig, type IntlOptions } from "./core/config";
import { createWithLocale, type IntlProps } from "./server/createWithLocale";
import { getTranslations } from "./server/getTranslations";
import type { InferTranslate } from "./types/InferTranslate";
import type { NamespacePaths } from "./types/NamespacePaths";

type Intl<
  _TLocale extends string,
  TMessages extends object,
  TRef extends string,
  TLocaleParam extends string,
> = {
  withLocale: <P extends PropsWithChildren<IntlProps<TLocaleParam>>>(
    Component: React.ComponentType<P>,
  ) => React.ComponentType<P>;

  getTranslations: <TPath extends NamespacePaths<TMessages, TRef>>(
    path: TPath,
  ) => Promise<InferTranslate<TMessages, TPath, TRef>>;

  useTranslations: <TPath extends NamespacePaths<TMessages, TRef>>(
    path: TPath,
  ) => InferTranslate<TMessages, TPath, TRef>;
};

export const createIntl = <
  TLocale extends string,
  TMessages extends object,
  TRef extends string = "$ref",
  TLocaleParam extends string = "locale",
>(
  options: IntlOptions<TLocale, TMessages, TRef, TLocaleParam>,
): Intl<TLocale, TMessages, TRef, TLocaleParam> => {
  const config = createConfig(options);
  const withLocale = createWithLocale(config);

  return {
    withLocale,
    getTranslations,
    useTranslations,
  };
};
