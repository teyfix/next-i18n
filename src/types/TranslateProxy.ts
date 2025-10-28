import type { RefObject, RefResult } from "./Ref";
import type { AnyFunction } from "./shared";
import type { ParamsMap, TemplateParam } from "./TemplateParam";

type ParamsGuard<Tpl, P extends string> = [P] extends [never]
  ? Tpl
  : (params: ParamsMap<P>) => Tpl;

type InferStringType<Tpl extends string> = ParamsGuard<Tpl, TemplateParam<Tpl>>;

export type TranslateProxy<T, TRef extends string> = T extends
  | null
  | undefined
  | AnyFunction
  ? T
  : T extends string
    ? InferStringType<T>
    : T extends Array<infer R>
      ? Array<TranslateProxy<R, TRef>>
      : T extends RefObject<TRef>
        ? RefResult
        : T extends object
          ? {
              [P in keyof T as P extends TRef ? never : P]: TranslateProxy<
                T[P],
                TRef
              >;
            }
          : T;
