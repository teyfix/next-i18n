import type { Get } from "type-fest";
import type { TranslateFn } from "./TranslateFn";
import type { TranslateProxy } from "./TranslateProxy";

type InferTranslateInner<T, TRef extends string> = TranslateFn<T, TRef> &
  TranslateProxy<T, TRef>;

export type InferTranslate<
  TMessages extends object,
  TPath extends string,
  TRef extends string,
> = InferTranslateInner<Get<TMessages, TPath>, TRef>;
