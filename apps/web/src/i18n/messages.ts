import type { Locale } from "./config";

// Message imports
import ca from "./messages/ca.json";
import en from "./messages/en.json";
import es from "./messages/es.json";

const messages: Record<Locale, typeof en> = {
  en,
  es,
  ca,
};

export function getMessages(locale: Locale) {
  return messages[locale] ?? messages.en;
}

export type Messages = typeof en;
