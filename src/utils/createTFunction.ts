import dlv from "dlv";
import { IntlClientError } from "./errors";

export const createTFunction = <T extends object>(nsp: T, path: string) => {
  function tFunction(key: string, params: Record<string, string>) {
    const deepValue = dlv(nsp, key);

    if (deepValue == null) {
      throw new IntlClientError(
        `Translation "${key}" not found in namespace "${path}"`,
      );
    }

    if (typeof deepValue === "function" && !("displayName" in deepValue)) {
      return deepValue(params);
    }

    return deepValue;
  }

  Object.assign(tFunction, nsp);

  return tFunction;
};
