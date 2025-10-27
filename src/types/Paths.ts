// biome-ignore lint/complexity/noBannedTypes: Aliasing
type AnyFunction = Function;

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

// Helper to concatenate paths
type Concat<Head extends string, Tail extends string> = Head extends ""
  ? Tail
  : `${Head}.${Tail}`;

// Check if a type is an array
type IsAnyArray<T> = T extends readonly unknown[] ? true : false;

// Get array element type
type ArrayElement<T> = T extends readonly (infer E)[] ? E : never;

// Main Paths type - optimized for translation keys
export type Paths<T, Path extends string = ""> = T extends Primitive
  ? Path
  : IsAnyArray<T> extends true
    ? // For arrays, recurse into element type with numeric index placeholder
        | Concat<Path, `${number}`>
        | Paths<ArrayElement<T>, Concat<Path, `${number}`>>
    : // For objects, iterate through keys
      {
        [K in keyof T & string]: Concat<Path, K> | Paths<T[K], Concat<Path, K>>;
      }[keyof T & string];
