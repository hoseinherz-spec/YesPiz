import type { Locale } from './config';
import { defaultLocale, isLocale } from './config';
import { getMessagesSync, type Messages } from './get-messages';

type NestedKeyOf<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? NestedKeyOf<T[K], Prefix extends '' ? K : `${Prefix}.${K}`>
        : Prefix extends ''
          ? K
          : `${Prefix}.${K}`;
    }[keyof T & string]
  : never;

export type MessageKey = NestedKeyOf<Messages>;

function getByPath(messages: Messages, key: string): string | undefined {
  const value = key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, messages);

  return typeof value === 'string' ? value : undefined;
}

export function resolveLocale(acceptLanguage?: string | null): Locale {
  if (!acceptLanguage) {
    return defaultLocale;
  }

  const candidates = acceptLanguage
    .split(',')
    .map((part) => part.trim().split(';')[0]?.toLowerCase())
    .filter((part): part is string => Boolean(part));

  for (const candidate of candidates) {
    const base = candidate.split('-')[0];
    if (isLocale(candidate)) {
      return candidate;
    }
    if (isLocale(base)) {
      return base;
    }
  }

  return defaultLocale;
}

export function translate(
  locale: Locale | string | undefined,
  key: MessageKey | string,
  values?: Record<string, string | number>,
): string {
  const resolvedLocale = isLocale(locale) ? locale : defaultLocale;
  const messages = getMessagesSync(resolvedLocale);
  let message = getByPath(messages, key) ?? getByPath(getMessagesSync(defaultLocale), key) ?? key;

  if (values) {
    for (const [name, value] of Object.entries(values)) {
      message = message.replaceAll(`{${name}}`, String(value));
    }
  }

  return message;
}
