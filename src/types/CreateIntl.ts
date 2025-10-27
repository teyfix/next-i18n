import type React from "react";
import type { NonEmptyTuple } from "type-fest";
import type { RefValue } from "./Ref";

type MaybePromise<T> = T | Promise<T>;
type MaybeDefault<T> = T | { default: T };
type MaybeModule<T> = MaybePromise<MaybeDefault<T>>;

export type RefLoader = (ref: RefValue) => MaybeModule<React.FC>;

export type CreateIntlOptions<
  TLocale extends string,
  TMessages extends object,
  TRef extends string = "$ref",
  TLocaleParam extends string = "locale",
> = {
  locales: NonEmptyTuple<TLocale>;
  defaultLocale: TLocale;
  localeParam?: TLocaleParam;
  loader: (locale: TLocale) => MaybeModule<TMessages>;
  refProp?: TRef;
  refLoader?: RefLoader;
};
