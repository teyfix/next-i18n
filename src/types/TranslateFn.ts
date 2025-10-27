import type { Get } from "type-fest";
import type { Paths } from "./Paths";
import type { RefObject, RefResult } from "./Ref";
import type { ParamsMap, TemplateParam } from "./TemplateParam";
import type { TranslateProxy } from "./TranslateProxy";

type Value<T> = T[keyof T];

type RenderPaths<T, TRef extends string> = string &
  Value<{
    [P in Paths<T> as P extends
      | `${string}.${TRef}`
      | `${string}.${TRef}.${string}`
      ? never
      : P]: P;
  }>;

type FnParams<Params extends string> = [Params] extends [never]
  ? []
  : [params: ParamsMap<Params>];

type RenderValue<T, TRef extends string> = T extends RefObject<TRef>
  ? RefResult
  : T;

export type TranslateFn<T, TRef extends string> = <
  P extends RenderPaths<T, TRef>,
  TParams extends FnParams<TemplateParam<Get<T, P>>>,
>(
  path: P,
  ...params: TParams
) => TranslateProxy<RenderValue<Get<T, P>, TRef>, TRef>;
