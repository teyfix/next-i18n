import { getIntlCache } from "../core/cache";

export const loadTranslations = async (): Promise<void> => {
  const { config, locale, messages } = getIntlCache();

  if (messages[locale]) {
    return;
  }

  messages[locale] = await config.loader(locale);
};
