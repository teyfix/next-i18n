import type { RefValue } from "../types/Ref";
import type { MaybeModule, NonEmptyTuple } from "../types/shared";
import { IntlRefLoaderError } from "../utils/errors";

export type IntlOptions<
  TLocale extends string,
  TMessages extends object,
  TRef extends string,
  TLocaleParam extends string,
> = {
  locales: NonEmptyTuple<TLocale>;
  defaultLocale: TLocale;
  localeParam?: TLocaleParam;
  loader: (locale: TLocale) => MaybeModule<TMessages>;
  refProp?: TRef;
  refLoader?: RefLoader;
};

export type RefLoader = (ref: RefValue) => MaybeModule<React.FC>;

export type IntlConfig<
  TLocale extends string,
  TMessages extends object,
  TRef extends string,
  TLocaleParam extends string,
> = Required<IntlOptions<TLocale, TMessages, TRef, TLocaleParam>>;

const refLoader = () => {
  throw new IntlRefLoaderError('No "refLoader" provided');
};

export const createConfig = <
  TLocale extends string,
  TMessages extends object,
  TRef extends string,
  TLocaleParam extends string,
>(
  options: IntlOptions<TLocale, TMessages, TRef, TLocaleParam>,
): IntlConfig<TLocale, TMessages, TRef, TLocaleParam> => ({
  localeParam: "locale" as TLocaleParam,
  refProp: "$ref" as TRef,
  refLoader,
  ...options,
});
