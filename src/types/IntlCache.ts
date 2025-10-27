import type { PartialDeep } from "type-fest";

export type IntlCache<TMessages extends object> = {
  locale: string;
  messages: PartialDeep<TMessages>;
};
