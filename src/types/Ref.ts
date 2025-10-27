import type React from "react";

export type RefPath<TRef extends string> =
  | TRef
  | `${string}.${TRef}`
  | `${string}.${TRef}.${string}`;

export type RefValue = {
  ext: string;
  kind: string;
  path: string;
};

export type RefObject<TRef extends string> = {
  [T in TRef]: RefValue;
};

export type RefResult = React.FC & {
  /**
   * The path where this ref is defined
   */
  displayName: string;
};
