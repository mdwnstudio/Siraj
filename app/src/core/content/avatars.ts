/* ============================================================
   THE PROFILE: who the learner is on the stair.
   Ten avatars and five banners, addressed by id so progress
   stores a word, not a picture. The drawings themselves live in
   public/img/avatars; the banners are drawn by the UI.
   The faces are left blank on purpose: no eyes, nose or mouth.
   ============================================================ */

export type Gender = 'm' | 'f'

/** grouped the way the picker shows them: adults first, then children */
export const AVATARS = [
  { id: 'av-1', gender: 'm', label: 'شابّ بغترة وعقال', en: 'Young man in a ghutra and agal' },
  { id: 'av-2', gender: 'm', label: 'رجلٌ بطاقية بيضاء', en: 'Man in a white cap' },
  { id: 'av-3', gender: 'm', label: 'رجلٌ كبير بنظّارة', en: 'Older man with glasses' },
  { id: 'av-5', gender: 'm', label: 'شابّ بقميصٍ أزرق', en: 'Young man in a blue shirt' },
  { id: 'av-11', gender: 'm', label: 'شابّ أشقر بكنزة رمادية', en: 'Fair-haired young man in a grey sweater' },
  { id: 'av-12', gender: 'm', label: 'شابّ بنظّارة وقميصٍ خردلي', en: 'Young man with glasses and a mustard shirt' },
  { id: 'av-13', gender: 'm', label: 'شابّ بسترة جينز', en: 'Young man in a denim jacket' },
  { id: 'av-4', gender: 'm', label: 'فتى بشعرٍ مجعّد', en: 'Boy with curly hair' },
  { id: 'av-18', gender: 'm', label: 'فتى بحقيبة ظهر', en: 'Boy with a backpack' },
  { id: 'av-17', gender: 'm', label: 'ولدٌ بطاقية بيضاء', en: 'Boy in a white cap' },
  { id: 'av-16', gender: 'm', label: 'طفلٌ صغير', en: 'Little boy' },
  { id: 'av-6', gender: 'f', label: 'فتاة بشعرٍ طويل', en: 'Girl with long hair' },
  { id: 'av-7', gender: 'f', label: 'فتاة بشعرٍ قصير مجعّد', en: 'Girl with short curly hair' },
  { id: 'av-8', gender: 'f', label: 'امرأة بحجابٍ عنّابي', en: 'Woman in a maroon hijab' },
  { id: 'av-9', gender: 'f', label: 'امرأة بحجابٍ أزرق ونظّارة', en: 'Woman in a blue hijab and glasses' },
  { id: 'av-10', gender: 'f', label: 'امرأة بنقاب', en: 'Woman in a niqab' },
  { id: 'av-14', gender: 'f', label: 'فتاة بذيل حصانٍ أشقر', en: 'Girl with a fair ponytail' },
  { id: 'av-15', gender: 'f', label: 'فتاة بشعرٍ قصير', en: 'Girl with short hair' },
  { id: 'av-21', gender: 'f', label: 'فتاة بحجابٍ بنفسجي', en: 'Girl in a violet hijab' },
  { id: 'av-20', gender: 'f', label: 'بنتٌ بضفيرتين', en: 'Girl with two braids' },
  { id: 'av-19', gender: 'f', label: 'طفلةٌ صغيرة', en: 'Little girl' },
] as const satisfies readonly { id: string; gender: Gender; label: string; en: string }[]

export type AvatarId = (typeof AVATARS)[number]['id']

export const BANNERS = [
  { id: 'khatam', label: 'النجوم', en: 'Stars' },
  { id: 'dawn', label: 'الفجر', en: 'Dawn' },
  { id: 'icons', label: 'رموز سراج', en: 'Siraj icons' },
  { id: 'ember', label: 'الجمر', en: 'Embers' },
  { id: 'night', label: 'الليل', en: 'Night' },
] as const

export type BannerId = (typeof BANNERS)[number]['id']

/** everyone starts on the star pattern; picking another is a settings choice */
export const DEFAULT_BANNER: BannerId = 'khatam'

/** an avatar's or banner's description in the learner's language */
export function pictureLabel(p: { label: string; en: string }, lang: 'ar' | 'en'): string {
  return lang === 'en' ? p.en : p.label
}

export function isAvatarId(v: unknown): v is AvatarId {
  return AVATARS.some((a) => a.id === v)
}

export function isGender(v: unknown): v is Gender {
  return v === 'm' || v === 'f'
}

export function avatarsFor(g: Gender | null) {
  return g ? AVATARS.filter((a) => a.gender === g) : AVATARS
}

export function isBannerId(v: unknown): v is BannerId {
  return BANNERS.some((b) => b.id === v)
}
