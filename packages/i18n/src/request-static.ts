import { getRequestConfig } from 'next-intl/server';
import { defaultLocale } from './config';
import { getMessages } from './get-messages';

/**
 * Cookie-free request config for static export (e.g. Capacitor).
 */
export default getRequestConfig(async () => ({
  locale: defaultLocale,
  messages: await getMessages(defaultLocale),
}));
