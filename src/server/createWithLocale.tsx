import type React from "react";
import type { PropsWithChildren } from "react";
import { IntlProvider } from "../client/provider";
import { initIntlCache, setIntlCache } from "../core/cache";
import type { IntlConfig } from "../core/config";
import type { NamespacePaths } from "../types/NamespacePaths";
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

type WithLocaleComponent<TLocaleParam extends string> = <
  P extends PropsWithChildren<IntlProps<TLocaleParam>>,
>(
  Component: React.ComponentType<P>,
) => React.ComponentType<P>;

type WithNamespaceHelper<
  TLocale extends string,
  TMessages extends object,
  TRef extends string,
  TLocaleParam extends string,
> = {
  withNamespace: <P extends NamespacePaths<TMessages, TRef>>(
    ...namespaces: NonEmptyTuple<P>
  ) => WithLocale<TLocale, TMessages, TRef, TLocaleParam>;
};

export type WithLocale<
  TLocale extends string,
  TMessages extends object,
  TRef extends string,
  TLocaleParam extends string,
> = WithLocaleComponent<TLocaleParam> &
  WithNamespaceHelper<TLocale, TMessages, TRef, TLocaleParam>;

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
    async function WithLocale(props: P): Promise<React.ReactNode> {
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

      return (
        <IntlProvider namespaces={WithLocale.__i18n__.namespaces}>
          <Component {...props} />
        </IntlProvider>
      );
    }

    WithLocale.displayName = `withLocale(${Component.displayName})`;
    WithLocale.__i18n__ = {
      namespaces: [],
    };

    const withNamespaces = <P extends NamespacePaths<TMessages, TRef>>(
      ...namespaces: NonEmptyTuple<P>
    ) => {
      WithLocale.__i18n__.namespaces.push(...namespaces);

      return Object.assign(WithLocale, {
        __intl__: {
          namespaces,
        },
      });
    };

    return Object.assign(WithLocale, { withNamespaces });
  };

  return withLocale as WithLocale<TLocale, TMessages, TRef, TLocaleParam>;
};
