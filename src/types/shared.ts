// biome-ignore lint/complexity/noBannedTypes: Aliasing
export type AnyFunction = Function;

// biome-ignore lint/suspicious/noExplicitAny: Aliasing
export type AnyArray = any[] | readonly any[];

export type NonEmptyTuple<T> = [T, ...T[]];

export type MaybePromise<T> = T | Promise<T>;
export type MaybeDefault<T> = T | { default: T };
export type MaybeModule<T> = MaybePromise<MaybeDefault<T>>;

export type Value<T> = T[keyof T];

export type Concat<Head extends string, Tail extends string> = Head extends ""
  ? Tail
  : `${Head}.${Tail}`;
