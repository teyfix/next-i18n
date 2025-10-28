import type { RefObject } from "./Ref";
import type { AnyArray, AnyFunction, Value } from "./shared";

/**
 * Declare banned types to avoid recursion (for namespaces)
 */
type Banned<TRef extends string> =
  | null
  | undefined
  | number
  | string
  | boolean
  | AnyFunction
  | AnyArray
  | RefObject<TRef>;

/**
 * Concatenate strings
 */
type Concat<Head extends string, Tail extends string> = Head extends ""
  ? Tail
  : `${Head}.${Tail}`;

/**
 * Recursively get the paths of a type
 */
type WithInner<P extends string, V, TRef extends string> =
  | P
  | PathsInner<V, TRef, P>;

type PathsInner<
  T,
  TRef extends string,
  Path extends string,
> = T extends Banned<TRef>
  ? never
  : Value<{
      [P in keyof T & string]: T[P] extends Banned<TRef>
        ? never
        : WithInner<Concat<Path, P>, T[P], TRef>;
    }>;

export type NamespacePaths<T, TRef extends string> = PathsInner<T, TRef, "">;
