"use client";

import type React from "react";
import { createContext, useContext, useRef } from "react";
import { wrapMessages } from "../utils/wrapMessages";

type IntlContext = {
  locale: string;
  messages: object;
  config: {
    refProp: string;
  };
};

const Context = createContext<null | IntlContext>(null);

export const useIntlContext = () => {
  return useContext(Context);
};

export function IntlContextProvider(props: {
  value: IntlContext;
  children: React.ReactNode;
}) {
  const ref = useRef<IntlContext | null>(null);

  if (ref.current == null) {
    ref.current = props.value;
    ref.current.messages = wrapMessages(
      ref.current.messages,
      ref.current.config,
    );
  }

  return (
    <Context.Provider value={ref.current}>{props.children}</Context.Provider>
  );
}
