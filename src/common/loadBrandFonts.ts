const FONT_LINK_ID = 'fieldnotes-fonts';
const FONT_URL =
  'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Instrument+Serif:ital@0;1&display=swap';

/** Adds the Fieldnotes fonts to the page once, however many web parts use them. Falls back to Segoe UI if blocked. */
export function loadBrandFonts(): void {
  if (document.getElementById(FONT_LINK_ID)) {
    return;
  }
  const link = document.createElement('link');
  link.id = FONT_LINK_ID;
  link.rel = 'stylesheet';
  link.href = FONT_URL;
  document.head.appendChild(link);
}

/** e.g. "Tuesday 17 November". */
export function formatLongDate(now: Date, locale: string = 'en-GB'): string {
  return now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
}
