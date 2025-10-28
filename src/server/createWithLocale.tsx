import type { PropsWithChildren } from "react";
import { initIntlCache, setIntlCache } from "../core/cache";
import type { IntlConfig } from "../core/config";
import type { MaybePromise, NonEmptyTuple } from "../types/shared";
import { IntlWithLocaleError } from "../utils/errors";
import { loadTranslations } from "./loadTranslations";

type NextParams = Record<string, string | string[]>;

type IntlParams<TLocaleParam extends string> = NextParams & {
  [P in TLocaleParam]: string;
};

export type IntlProps<TLocaleParam extends string> = {
  params: MaybePromise<IntlParams<TLocaleParam>>;
  searchParams: MaybePromise<NextParams>;
};

/**
 * Wrap the error message to reduce bundle size
 */
const notProvidedError = (message: string) =>
  `No "${message}" provided to the component wrapped by "withLocale"`;

/**
 * Check if a value is in the array
 */
const oneOf = <T,>(values: NonEmptyTuple<T>, value: unknown): value is T =>
  values.some((item) => item === value);

export const createWithLocale = <
  TLocale extends string,
  TMessages extends object,
  TRef extends string,
  TLocaleParam extends string,
>(
  config: IntlConfig<TLocale, TMessages, TRef, TLocaleParam>,
) => {
  const { localeParam } = config;

  const withLocale = <P extends PropsWithChildren<IntlProps<TLocaleParam>>>(
    Component: React.ComponentType<P>,
  ): React.ComponentType<P> => {
    async function WithLocale(props: P) {
      if (props == null) {
        throw new IntlWithLocaleError(notProvidedError("props"));
      }

      initIntlCache(config);

      const params = await props.params;

      if (params == null) {
        throw new IntlWithLocaleError(notProvidedError("params"));
      }

      const locale = params[localeParam];

      if (oneOf(config.locales, locale)) {
        setIntlCache({ locale });
      }

      await loadTranslations();

      return <Component {...props} />;
    }

    return WithLocale;
  };

  return withLocale;
};
