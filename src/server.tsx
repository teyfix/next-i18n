import dlv from "dlv";
import React, { type PropsWithChildren } from "react";
import { getTranslations } from "./create-intl/get-translations";
import type { CreateIntlOptions } from "./types/CreateIntl";
import type { InferTranslate } from "./types/InferTranslate";
import type { NamespacePaths } from "./types/NamespacePaths";

type MaybePromise<T> = T | Promise<T>;
type MaybeDefault<T> = T | { default: T };

type NextParams = Record<string, string | string[]>;

type IntlParams<TLocaleParam extends string> = NextParams & {
  [P in TLocaleParam]: string;
};

type IntlProps<TLocaleParam extends string> = {
  params: Promise<IntlParams<TLocaleParam>>;
  searchParams: Promise<NextParams>;
};

export type IntlImport<T> = MaybePromise<MaybeDefault<T>>;

export const createIntl = <
  TLocale extends string,
  TMessages extends object,
  TRef extends string = "$ref",
  TLocaleParam extends string = "locale",
>(
  options: CreateIntlOptions<TLocale, TMessages, TRef, TLocaleParam>,
) => {
  const refProp = options.refProp || ("$ref" as TRef);
  const localeParam = options.localeParam || ("locale" as TLocaleParam);

  const refLoader = options.refLoader;

  const hasLocale = (input: unknown): input is TLocale =>
    options.locales.some((locale) => input === locale);

  const intlCache = React.cache(() => {
    const intlValue = {
      locale: options.defaultLocale,
      messages: {},
    };

    return intlValue;
  });

  const getIntlCache = () => {
    return intlCache();
  };

  const setIntlCache = (partial: Partial<ReturnType<typeof intlCache>>) => {
    const intlValue = getIntlCache();

    Object.assign(intlValue, partial);
  };

  const withLocale = <P extends PropsWithChildren<IntlProps<TLocaleParam>>>(
    Component: React.ComponentType<P>,
  ) => {
    async function WithLocale(props: P) {
      const params = await props.params;
      const locale = hasLocale(params[localeParam])
        ? params[localeParam]
        : options.defaultLocale;

      setIntlCache({ locale });

      return <Component {...props} />;
    }

    return WithLocale;
  };

  return {
    hasLocale,
    withLocale,
    getTranslations: async <TPath extends NamespacePaths<TMessages, TRef>>(
      path: TPath,
    ): Promise<InferTranslate<TMessages, TPath, TRef>> => {
      const intl = getIntlCache();

      const { locale } = intl;
      const nsp = dlv(intl.messages, path);

      if (nsp) {
        return nsp;
      }

      const mod = await options.loader(locale);
      const messages = "default" in mod ? mod.default : mod;

      return getTranslations({ path, messages, refProp, refLoader });
    },
  };
};
