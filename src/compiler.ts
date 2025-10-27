import { camelCase, capitalCase, pascalCase } from "change-case";
import { createConsola } from "consola";
import { dset } from "dset";
import merge from "merge";
import { existsSync } from "node:fs";
import {
  copyFile,
  glob,
  mkdir,
  readFile,
  stat,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { performance } from "node:perf_hooks";
import { format } from "prettier";
import sortKeys from "sort-keys";
import YAML from "yaml";
import type { RefObject } from "./types/Ref";

type Messages = {
  [P: string]: string | Messages | Array<string | Messages>;
};

type Namespace = {
  file: string;
  messages: Messages;
};

const $$logger = createConsola({
  defaults: { tag: "App" },
});

const rel = (path: string): string => path.replace(process.cwd(), ".");

const isFileError = (err: unknown): err is { code: string } =>
  typeof err === "object" && err !== null && "code" in err;

type LoadFile = ProcessFile & {
  file: string;
  ext: string;
};

const loadFile = async (options: LoadFile) => {
  const { locale, root, file, ext } = options;
  const logger = $$logger.withTag("LoadFile").withTag(rel(file));

  logger.trace("Loading locale file %s...", file);

  if (ext === ".md" || ext === ".mdx") {
    return {
      [options.ref]: {
        ext,
        kind: "mdx",
        path: file.replace(root, locale),
      },
    };
  }

  const content = await readFile(file, "utf-8");

  if (ext === ".yaml" || ext === ".yml") {
    const data = YAML.parse(content);

    logger.verbose("Parsed locale file %s as YAML", file);

    return data;
  }

  if (ext === ".json") {
    const data = JSON.parse(content);

    logger.verbose("Parsed locale file %s as JSON", file);

    return data;
  }

  throw new Error(`Unknown file extension: ${ext}`);
};

type ProcessFile = LoadMessages & {
  root: string;
  file: string;
};

const isRef = (
  input: unknown,
  options: ProcessFile,
): input is RefObject<string> =>
  !!input && typeof input === "object" && options.ref in input;

const processFile = async (options: ProcessFile): Promise<Namespace> => {
  const { root, file } = options;
  const logger = $$logger.withTag("Process").withTag(rel(file));

  logger.trace("Processing locale file %s", file);

  const ext = extname(file);
  const path = file
    .replace(root, "")
    .slice(1)
    .replace(ext, "")
    .split("/")
    .filter((seg) => seg !== "_index")
    .map((seg) => camelCase(seg));

  try {
    const content = await loadFile({ ...options, ext });
    const result = { file, messages: {} };

    if (isRef(content, options)) {
      const ref = content[options.ref];

      if (ref == null) {
        throw new Error(`Missing ref: ${options.ref} in ${file}`);
      }

      const copyPath = join(options.output, ref.path);

      if (await existsSync(copyPath)) {
        logger.verbose("Locale file %s already exists", rel(copyPath));
      } else {
        logger.info("Copying locale file %s to %s", rel(file), rel(copyPath));

        await mkdir(dirname(copyPath), { recursive: true });
        await copyFile(file, copyPath);
      }

      dset(
        result.messages,
        path.map((e, i, a) => (i === a.length - 1 ? pascalCase(e) : e)),
        content,
      );
    } else {
      dset(result.messages, path, content);
    }

    logger.verbose("Processed locale file %s", file);

    return result;
  } catch (err) {
    logger.error("Error processing locale file %s: %s", file, err);

    throw err;
  }
};

type LoadMessages = CompileLocale;

const loadMessages = async (options: LoadMessages): Promise<Messages> => {
  const { locale, input } = options;
  const logger = $$logger.withTag("LoadMessages").withTag(locale);

  logger.trace("Loading messages for locale %s...", locale);

  const root = join(input, locale);
  const pattern = join(root, "**", "*.{json,yml,yaml,md,mdx}");
  const promises: Promise<Namespace>[] = [];

  for await (const entry of glob(pattern)) {
    const stats = await stat(entry);

    if (stats.isFile()) {
      logger.verbose("Found locale file %s", entry);
      promises.push(processFile({ ...options, root, file: entry }));
    }
  }

  const namespaces = await Promise.all(promises);
  const messages = sortKeys(
    merge.recursive(...namespaces.map((nsp) => nsp.messages)),
    {
      deep: true,
    },
  );

  logger.verbose("Loaded messages for locale %s.", locale);

  return messages;
};

type WriteChangedFile = CompileLocale & {
  file: string;
  content: string;
};

const writeChangedFile = async (options: WriteChangedFile) => {
  const { file, content } = options;
  const fileContent = await readFile(file, "utf-8").catch((err) => {
    if (isFileError(err) && err.code === "ENOENT") {
      return "";
    }

    throw err;
  });

  if (content === fileContent) {
    return false;
  }

  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content);

  return true;
};

type CompileLocale = CreateCompiler & {
  locale: string;
};

const compileLocale = async (options: CompileLocale) => {
  const { locale, output } = options;
  const logger = $$logger.withTag("CompileLocale").withTag(locale);

  logger.info("Compiling locale %s...", locale);

  const messages = await loadMessages(options);

  const json = JSON.stringify(messages, null, 2);
  const typings = [
    `const messages = ${json} as const;`,
    "",
    `export type Messages${capitalCase(locale)} = typeof messages;`,
    "",
  ].join("\n");

  const [jsonPretty, typingsPretty] = await Promise.all([
    format(json, { parser: "json" }),
    format(typings, { parser: "typescript" }),
  ]);

  const [jsonChanged, typingsChanged] = await Promise.all([
    writeChangedFile({
      ...options,
      file: join(output, `${locale}.json`),
      content: jsonPretty,
    }),
    writeChangedFile({
      ...options,
      file: join(output, `${locale}.typings.ts`),
      content: typingsPretty,
    }),
  ]);

  if (jsonChanged) {
    logger.success("Compiled messages for locale: %s.", locale);
  } else {
    logger.info("Messages for locale %s is up to date.", locale);
  }

  if (typingsChanged) {
    logger.success("Compiled typings for locale %s.", locale);
  } else {
    logger.info("Typings for locale %s are up to date.", locale);
  }
};

const listLocales = async (options: CreateCompiler) => {
  const { input } = options;
  const logger = $$logger.withTag("ListLocales");
  const locales: string[] = [];

  logger.info("Listing locales: %s", input);

  for await (const entry of glob(join(input, "*"))) {
    const stats = await stat(entry);

    if (stats.isDirectory()) {
      const locale = basename(entry);

      logger.verbose("Found locale %s", locale);
      locales.push(locale);
    }
  }

  logger.success("Found locales: %s", locales.join(", "));

  return locales;
};

const main = async (options: CreateCompiler) => {
  const start = performance.now();
  const logger = $$logger.withTag("Main");

  await listLocales(options)
    .then((locales) =>
      Promise.all(
        locales.map((locale) => compileLocale({ ...options, locale })),
      ),
    )
    .then((res) => {
      logger.success("Compiled %d locales", res.length);
    });

  const total = performance.now() - start;

  logger.success("Completed in %sms", Math.round(total * 100) / 100);
};

type CreateCompiler = {
  input: string;
  output: string;
  ref: string;
};

export const createCompiler = (options: CreateCompiler) => {
  const compiler = async () => {
    try {
      await main(options);
    } catch (err) {
      $$logger.error(err);
    }
  };

  return compiler;
};
