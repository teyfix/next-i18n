import type { RefLoader } from "../core/config";
import type { RefValue } from "../types/Ref";
import { IntlMissingParamError, IntlRefLoaderError } from "./errors";

declare var window: unknown;

const paramRegex = /{\s*([^}\s]+)\s*}/g;

const wrapString = (value: string) => {
  if (paramRegex.test(value)) {
    return (params: Record<string, string>) => {
      return value.replace(paramRegex, (_, name) => {
        if (params[name] == null) {
          throw new IntlMissingParamError(`Missing parameter "${name}"`);
        }

        return params[name];
      });
    };
  }

  return value;
};

const isRef = <TRef extends string>(
  input: unknown,
  refProp: TRef,
): input is { [P in TRef]: RefValue } => {
  return input instanceof Object && refProp in input;
};

const wrapRef = (
  ref: RefValue,
  options: {
    refLoader?: RefLoader;
  },
) => {
  if (typeof window !== "undefined") {
    throw new IntlRefLoaderError('Cannot use "refLoader" in the browser');
  }

  if (!options.refLoader) {
    throw new IntlRefLoaderError("Missing ref loader");
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

export const wrapMessages = <
  T,
  TRef extends string,
  TOptions extends { refProp: TRef; refLoader?: RefLoader },
>(
  input: T,
  options: TOptions,
): T => {
  const { refProp, refLoader } = options;

  if (typeof input === "string") {
    return wrapString(input) as T;
  }

  if (input == null || typeof input !== "object") {
    return input;
  }

  if (isRef(input, refProp)) {
    return wrapRef(input[refProp], { refLoader }) as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => wrapMessages(item, options)) as T;
  }

  const output = {} as typeof input;

  for (const prop in input) {
    if (!Object.hasOwn(input, prop)) {
      continue;
    }

    output[prop] = wrapMessages(input[prop], options);
  }

  return output;
};
