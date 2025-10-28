import React from "react";
import { IntlCacheError } from "../utils/errors";
import type { IntlConfig } from "./config";

type IntlCache<
  TLocale extends string,
  TMessages extends object,
  TRef extends string,
  TLocaleParam extends string,
> = {
  config: IntlConfig<TLocale, TMessages, TRef, TLocaleParam>;
  locale: TLocale;
  messages: Partial<Record<TLocale, TMessages>>;
  server: Partial<Record<TLocale, TMessages>>;
  client: Partial<Record<TLocale, TMessages>>;
};

type EmptyCache = {
  config: undefined;
};

const createCache = <
  TLocale extends string,
  TMessages extends object,
  TRef extends string,
  TLocaleParam extends string,
>(): EmptyCache | IntlCache<TLocale, TMessages, TRef, TLocaleParam> => {
  return { config: undefined };
};

const getCache = React.cache(createCache);

export const initIntlCache = <
  TLocale extends string,
  TMessages extends object,
  TRef extends string,
  TLocaleParam extends string,
>(
  config: IntlConfig<TLocale, TMessages, TRef, TLocaleParam>,
) => {
  const cache = getCache<TLocale, TMessages, TRef, TLocaleParam>();

  if (cache.config != null) {
    /**
     * Can be called multiple times while using
     * simultaneously on both of layout and page components
     */
    // throw new IntlCacheError("Already initialized");
  }

  const init: IntlCache<TLocale, TMessages, TRef, TLocaleParam> = {
    config,
    locale: config.defaultLocale,
    messages: {},
    server: {},
    client: {},
  };

  Object.assign(cache, init);
};

export const getIntlCache = <
  TLocale extends string,
  TMessages extends object,
  TRef extends string,
  TLocaleParam extends string,
>() => {
  const cache = getCache<TLocale, TMessages, TRef, TLocaleParam>();

  if (cache.config == null) {
    throw new IntlCacheError("Not initialized");
  }

  return cache;
};

export const setIntlCache = <
  TLocale extends string,
  TMessages extends object,
  TRef extends string,
  TLocaleParam extends string,
>(
  partial: Partial<IntlCache<TLocale, TMessages, TRef, TLocaleParam>>,
) => {
  const cache = getIntlCache<TLocale, TMessages, TRef, TLocaleParam>();

  Object.assign(cache, partial);
};
