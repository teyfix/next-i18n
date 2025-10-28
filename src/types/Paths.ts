import type { AnyFunction, Concat } from "./shared";

type Primitive =
  | string
  | number
  | boolean
  | null
  | undefined
  | AnyFunction
  | symbol
  | Date
  | RegExp;

type IsAnyArray<T> = T extends readonly unknown[] ? true : false;
type ArrayElement<T> = T extends readonly (infer E)[] ? E : never;

export type Paths<T, Path extends string = ""> = T extends Primitive
  ? Path
  : IsAnyArray<T> extends true
    ?
        | Concat<Path, `${number}`>
        | Paths<ArrayElement<T>, Concat<Path, `${number}`>>
    : {
        [K in keyof T & string]: Concat<Path, K> | Paths<T[K], Concat<Path, K>>;
      }[keyof T & string];
