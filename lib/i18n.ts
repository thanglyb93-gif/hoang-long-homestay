import { getRequestConfig } from 'next-intl/server';

const LOCALES = ['vi', 'en', 'zh', 'ko', 'ja'];
const DEFAULT_LOCALE = 'vi';

export default getRequestConfig(async ({ requestLocale }) => {
  // next-intl v4: requestLocale is a Promise<string | undefined>
  let locale = await requestLocale;

  // Fall back to default if missing or unrecognised
  if (!locale || !LOCALES.includes(locale)) {
    locale = DEFAULT_LOCALE;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
