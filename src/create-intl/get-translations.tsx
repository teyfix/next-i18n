import dlv from "dlv";
import { dset } from "dset";
import type { RefLoader } from "../types/CreateIntl";
import type { InferTranslate } from "../types/InferTranslate";
import type { NamespacePaths } from "../types/NamespacePaths";
import type { RefObject, RefValue } from "../types/Ref";

const paramRegex = /{\s*([^}\s]+)\s*}/g;

const wrapString = (value: string) => {
  if (paramRegex.test(value)) {
    return (params: Record<string, string>) => {
      return value.replace(paramRegex, (_, name) => {
        if (params[name] == null) {
          throw new Error(`Missing parameter "${name}"`);
        }

        return params[name];
      });
    };
  }

  return value;
};

const isRef = <TRef extends string>(
  input: object,
  refProp: TRef,
): input is RefObject<TRef> => {
  return refProp in input;
};

const wrapRef = (
  ref: RefValue,
  options: {
    refLoader: RefLoader;
  },
) => {
  if (!options.refLoader) {
    throw new Error(`Missing ref loader`);
  }

  const refLoader = options.refLoader;

  async function IntlRef() {
    const mod = await refLoader(ref);
    const Component = "default" in mod ? mod.default : mod;

    return <Component />;
  }

  IntlRef.displayName = ref.path;

  return IntlRef;
};

const wrap = <T, TRef extends string>(
  input: T,
  options: {
    refProp: TRef;
    refLoader?: RefLoader;
  },
): T => {
  if (typeof input === "string") {
    return wrapString(input) as T;
  }

  if (input == null || typeof input !== "object") {
    return input;
  }

  const { refProp } = options;

  if (isRef(input, refProp)) {
    if (!options.refLoader) {
      throw new Error(`Missing ref loader`);
    }

    return wrapRef(input[refProp], { refLoader: options.refLoader }) as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => wrap(item, options)) as T;
  }

  const output = {} as typeof input;

  for (const prop in input) {
    if (!Object.hasOwn(input, prop)) {
      continue;
    }

    output[prop] = wrap(input[prop], options);
  }

  return output;
};

export const getTranslations = <
  TMessages extends object,
  TRef extends string,
  TPath extends NamespacePaths<TMessages, TRef>,
>(options: {
  path: TPath;
  messages: TMessages;
  refProp: TRef;
  refLoader?: RefLoader;
}): InferTranslate<TMessages, TPath, TRef> => {
  const { path, messages } = options;
  let nsp = dlv(messages, path);

  if (nsp == null) {
    throw new Error(`Namespace "${path}" not found in locale`);
  }

  nsp = wrap(nsp, options);
  dset(messages, path, nsp);

  function tFunction(key: string, params: Record<string, string>) {
    const deepValue = dlv(nsp, key);

    if (deepValue == null) {
      throw new Error(`Translation "${key}" not found in namespace "${path}"`);
    }

    if (typeof deepValue === "function" && !("displayName" in deepValue)) {
      return deepValue(params);
    }

    return deepValue;
  }

  Object.assign(tFunction, nsp);

  return tFunction as InferTranslate<TMessages, TPath, TRef>;
};
