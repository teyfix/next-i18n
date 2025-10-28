import { klona } from "klona";
import { getIntlCache } from "../core/cache";

export const loadTranslations = async (): Promise<void> => {
  const { config, locale, messages } = getIntlCache();

  if (messages[locale]) {
    return;
  }

  const mod = await config.loader(locale);
  const content = "default" in mod ? mod.default : mod;

  messages[locale] = klona(content);
};
