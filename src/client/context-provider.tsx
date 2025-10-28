"use client";

import type React from "react";
import { createContext, useContext } from "react";

type IntlContext = {
  locale: string;
  messages: object;
};

const Context = createContext<null | IntlContext>(null);

export const useIntlContext = () => {
  return useContext(Context);
};

export function IntlContextProvider(props: {
  value: IntlContext;
  children: React.ReactNode;
}) {
  return (
    <Context.Provider value={props.value}>{props.children}</Context.Provider>
  );
}
