import { FlagAR, FlagEN, FlagFR, FlagTR, FlagID, FlagUR, FlagES, FlagDE } from './icons/Flags'

/* The languages the picker offers, each named in itself. Shared by
   onboarding and the stat bar's language button, so it lives outside
   either chunk. */
/* English is ready but unreviewed, so it says BETA; the rest are still to come */
export const LANGS = [
  { id: 'ar', label: 'العربية', Flag: FlagAR, ready: true },
  { id: 'en', label: 'English', Flag: FlagEN, ready: true, beta: true },
  { id: 'fr', label: 'Français', Flag: FlagFR, ready: false },
  { id: 'tr', label: 'Türkçe', Flag: FlagTR, ready: false },
  { id: 'id', label: 'Bahasa Indonesia', Flag: FlagID, ready: false },
  { id: 'ur', label: 'اردو', Flag: FlagUR, ready: false },
  { id: 'es', label: 'Español', Flag: FlagES, ready: false },
  { id: 'de', label: 'Deutsch', Flag: FlagDE, ready: false },
]

export const langById = (id: string) => LANGS.find((l) => l.id === id) ?? LANGS[0]
