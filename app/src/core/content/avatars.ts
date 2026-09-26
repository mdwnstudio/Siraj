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
  { id: 'av-1', gender: 'm', label: 'شابّ بغترة وعقال' },
  { id: 'av-2', gender: 'm', label: 'رجلٌ بطاقية بيضاء' },
  { id: 'av-3', gender: 'm', label: 'رجلٌ كبير بنظّارة' },
  { id: 'av-5', gender: 'm', label: 'شابّ بقميصٍ أزرق' },
  { id: 'av-11', gender: 'm', label: 'شابّ أشقر بكنزة رمادية' },
  { id: 'av-12', gender: 'm', label: 'شابّ بنظّارة وقميصٍ خردلي' },
  { id: 'av-13', gender: 'm', label: 'شابّ بسترة جينز' },
  { id: 'av-4', gender: 'm', label: 'فتى بشعرٍ مجعّد' },
  { id: 'av-18', gender: 'm', label: 'فتى بحقيبة ظهر' },
  { id: 'av-17', gender: 'm', label: 'ولدٌ بطاقية بيضاء' },
  { id: 'av-16', gender: 'm', label: 'طفلٌ صغير' },
  { id: 'av-6', gender: 'f', label: 'فتاة بشعرٍ طويل' },
  { id: 'av-7', gender: 'f', label: 'فتاة بشعرٍ قصير مجعّد' },
  { id: 'av-8', gender: 'f', label: 'امرأة بحجابٍ عنّابي' },
  { id: 'av-9', gender: 'f', label: 'امرأة بحجابٍ أزرق ونظّارة' },
  { id: 'av-10', gender: 'f', label: 'امرأة بنقاب' },
  { id: 'av-14', gender: 'f', label: 'فتاة بذيل حصانٍ أشقر' },
  { id: 'av-15', gender: 'f', label: 'فتاة بشعرٍ قصير' },
  { id: 'av-21', gender: 'f', label: 'فتاة بحجابٍ بنفسجي' },
  { id: 'av-20', gender: 'f', label: 'بنتٌ بضفيرتين' },
  { id: 'av-19', gender: 'f', label: 'طفلةٌ صغيرة' },
] as const satisfies readonly { id: string; gender: Gender; label: string }[]

export type AvatarId = (typeof AVATARS)[number]['id']

export const BANNERS = [
  { id: 'khatam', label: 'النجوم' },
  { id: 'dawn', label: 'الفجر' },
  { id: 'icons', label: 'رموز سراج' },
  { id: 'ember', label: 'الجمر' },
  { id: 'night', label: 'الليل' },
] as const

export type BannerId = (typeof BANNERS)[number]['id']

/** everyone starts on the star pattern; picking another is a settings choice */
export const DEFAULT_BANNER: BannerId = 'khatam'

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
