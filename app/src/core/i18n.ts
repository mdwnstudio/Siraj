/* ============================================================
   LANGUAGES. Pure: no DOM. The UI passes the browser's language
   list in; a native port passes the device locale list.

   Arabic is the reviewed original. English is a translation in
   beta: its Quran and hadith text comes from quran.com and
   sunnah.com (scripts/fetch-quotes.mjs), but the rest has not
   had its own review yet. The picker says so.
   ============================================================ */

export type Lang = 'ar' | 'en'

export const LANGS: readonly Lang[] = ['ar', 'en']

export function isLang(v: unknown): v is Lang {
  return v === 'ar' || v === 'en'
}

/** Arabic-Indic digits for ordinals in Arabic prose; Western digits in English.
 *  Stats always use Western digits (see .num). */
export function ordinal(n: number, lang: Lang): string {
  if (lang === 'en') return String(n)
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}
