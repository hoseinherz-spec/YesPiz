import type { Locale } from './config';
import { defaultLocale, isLocale } from './config';
import de from '../messages/de.json';
import en from '../messages/en.json';

export type Messages = typeof en;

const messagesByLocale: Record<Locale, Messages> = {
  en,
  de,
};

export async function getMessages(locale: Locale): Promise<Messages> {
  return getMessagesSync(locale);
}

export function getMessagesSync(locale: Locale): Messages {
  const resolved = isLocale(locale) ? locale : defaultLocale;
  return messagesByLocale[resolved];
}
