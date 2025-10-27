import type { Trim } from "type-fest";

type IsLetter<T extends string> = Uppercase<T> extends T
  ? Lowercase<T> extends T
    ? false
    : true
  : true;

type ParamGuard<
  T extends string,
  U extends string = T,
> = U extends `${infer Head}${infer Tail}`
  ? IsLetter<Head> extends true
    ? ParamGuard<T, Tail>
    : never
  : T;

export type TemplateParam<T> = ParamGuard<
  Trim<
    T extends `${infer _}{${infer Param}}${infer Rest}`
      ? Param | TemplateParam<Rest>
      : never
  >
>;

export type ParamsMap<T extends string> = Record<T, number | string>;
