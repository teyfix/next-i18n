export type Interpolate<
  S extends string,
  Values extends Record<string, string | number>,
> = S extends `${infer Before}{${infer Key}}${infer After}`
  ? Key extends keyof Values
    ? `${Before}${Values[Key]}${Interpolate<After, Values>}`
    : never
  : S;
