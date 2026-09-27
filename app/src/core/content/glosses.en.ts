import type { GlossSeg } from '../types'
import { QURAN_GLOSSES_EN } from './glosses.quran.en'

/* ============================================================
   What each Arabic word or phrase means, for the English learner.
   Keyed by lesson and card: 'l-salah-3:c11'.

   The ayat come from quran.com's word-by-word English (generated,
   see scripts/fetch-glosses.mjs). The hadith below are glossed by
   hand, phrase by phrase, following the sunnah.com translation the
   card shows; a phrase is kept whole where its words mean little
   one by one. The phrases, joined with spaces, must spell the Arabic
   card exactly: scripts/check-lessons.mjs holds them to it.

   `tr` is how a phrase is said. Only the recite cards (the words a
   learner memorises for the prayer) carry it.

   NOTE FOR REVIEWERS - an unreviewed translation, like the rest of
   the English. See AGENTS.md.
   ============================================================ */

/* the two halves of the Ibrahimi prayer differ only in the verb */
const IBRAHIMI_HALF = (verb: 'salli' | 'barik'): GlossSeg[] => {
  const s = verb === 'salli'
  return [
    s
      ? { ar: 'اللهمّ صلِّ على محمدٍ،', tr: "Allahumma salli 'ala Muhammad,", en: 'O Allah, send Your mercy on Muhammad' }
      : { ar: 'اللهمّ باركْ على محمدٍ،', tr: "Allahumma barik 'ala Muhammad,", en: 'O Allah, send Your blessings on Muhammad' },
    { ar: 'وعلى آلِ محمدٍ،', tr: "wa 'ala ali Muhammad,", en: 'and on the family of Muhammad' },
    s
      ? { ar: 'كما صلّيتَ على إبراهيمَ،', tr: "kama sallayta 'ala Ibrahim,", en: 'as You sent Your mercy on Ibrahim (Abraham)' }
      : { ar: 'كما باركتَ على إبراهيمَ،', tr: "kama barakta 'ala Ibrahim,", en: 'as You sent Your blessings on Ibrahim (Abraham)' },
    { ar: 'وعلى آلِ إبراهيمَ،', tr: "wa 'ala ali Ibrahim,", en: 'and on the family of Ibrahim' },
    s
      ? { ar: 'إنّك حميدٌ مجيد،', tr: 'innaka Hamidun Majid.', en: 'You are the Most Praiseworthy, the Most Glorious' }
      : { ar: 'إنّك حميدٌ مجيد', tr: 'innaka Hamidun Majid.', en: 'You are the Most Praiseworthy, the Most Glorious' },
  ]
}

const HADITH_GLOSSES_EN: Record<string, GlossSeg[]> = {
  'l-intro-2:c2': [
    { ar: 'الإسلامُ', en: 'Islam is' },
    { ar: 'أن تشهدَ', en: 'that you testify' },
    { ar: 'أن لا إلهَ إلا اللهُ', en: 'that there is no god but Allah' },
    { ar: 'وأنَّ محمدًا رسولُ اللهِ،', en: 'and that Muhammad is the Messenger of Allah' },
    { ar: 'وتُقيمَ الصلاةَ،', en: 'and that you establish the prayer' },
    { ar: 'وتُؤتيَ الزكاةَ،', en: 'and pay the zakah' },
    { ar: 'وتصومَ رمضانَ،', en: 'and fast Ramadan' },
    { ar: 'وتَحُجَّ البيتَ', en: 'and make the pilgrimage to the House' },
    { ar: 'إن استطعتَ إليه سبيلًا.', en: 'if you are able to find a way to it' },
  ],
  'l-intro-3:c2': [
    { ar: 'أن تؤمنَ باللهِ،', en: 'That you believe in Allah' },
    { ar: 'وملائكتِه،', en: 'and His angels' },
    { ar: 'وكتبِه،', en: 'and His Books' },
    { ar: 'ورسلِه،', en: 'and His Messengers' },
    { ar: 'واليومِ الآخرِ،', en: 'and the Last Day' },
    { ar: 'وتؤمنَ بالقدرِ', en: 'and that you believe in the Divine Decree' },
    { ar: 'خيرِه وشرِّه', en: 'its good and its evil' },
  ],
  'l-salah-1:c4': [
    { ar: 'وقتُ الظهرِ', en: 'The time of Dhuhr' },
    { ar: 'إذا زالتِ الشمسُ', en: 'is when the sun has passed the middle of the sky' },
    { ar: 'وكان ظِلُّ الرجلِ كطولِه', en: "and a man's shadow is as long as he is tall" },
    { ar: 'ما لم يحضُرِ العصرُ،', en: 'as long as Asr has not come' },
    { ar: 'ووقتُ العصرِ', en: 'And the time of Asr' },
    { ar: 'ما لم تصفرَّ الشمسُ،', en: 'lasts as long as the sun has not turned pale' },
    { ar: 'ووقتُ صلاةِ المغربِ', en: 'And the time of the Maghrib prayer' },
    { ar: 'ما لم يغِبِ الشفقُ،', en: 'lasts as long as the twilight has not gone' },
    { ar: 'ووقتُ صلاةِ العشاءِ', en: 'And the time of the Isha prayer' },
    { ar: 'إلى نصفِ الليلِ الأوسطِ،', en: 'is up to the middle of the night' },
    { ar: 'ووقتُ صلاةِ الصبحِ', en: 'And the time of the Fajr prayer' },
    { ar: 'من طلوعِ الفجرِ', en: 'is from the break of dawn' },
    { ar: 'ما لم تطلُعِ الشمسُ', en: 'as long as the sun has not risen' },
  ],
  'l-salah-2:c3': [
    { ar: 'مَن توضّأ', en: 'Whoever makes wudu' },
    { ar: 'نحوَ وضوئي هذا،', en: 'like this wudu of mine' },
    { ar: 'ثم صلّى ركعتين', en: "then prays two rak'ahs" },
    { ar: 'لا يُحدِّثُ فيهما نفسَه،', en: 'without letting his thoughts wander in them' },
    { ar: 'غُفِرَ له', en: 'is forgiven' },
    { ar: 'ما تقدَّم من ذنبِه', en: 'his past sins' },
  ],
  'l-salah-2:c4': [
    { ar: 'إذا توضّأ العبدُ المسلمُ', en: 'When the Muslim servant makes wudu' },
    { ar: 'فغسل وجهَه،', en: 'and washes his face' },
    { ar: 'خرج من وجهِه', en: 'there leaves his face' },
    { ar: 'كلُّ خطيئةٍ', en: 'every sin' },
    { ar: 'نظر إليها بعينيه', en: 'he looked at with his eyes' },
    { ar: 'مع الماء', en: 'with the water' },
  ],
  'l-salah-3:c2': [
    { ar: 'صلّوا', en: 'Pray' },
    { ar: 'كما رأيتموني', en: 'as you have seen me' },
    { ar: 'أُصلّي', en: 'praying' },
  ],
  'l-salah-3:c8': [
    { ar: 'أُمِرتُ', en: 'I have been commanded' },
    { ar: 'أن أسجدَ', en: 'to prostrate' },
    { ar: 'على سبعةِ أعظُمٍ:', en: 'on seven bones' },
    { ar: 'على الجبهةِ،', en: 'on the forehead' },
    { ar: 'وأشار بيدِه على أنفِه،', en: 'and he pointed with his hand to his nose' },
    { ar: 'واليدينِ،', en: 'and the two hands' },
    { ar: 'والركبتينِ،', en: 'and the two knees' },
    { ar: 'وأطرافِ القدمين', en: 'and the tips of the two feet' },
  ],
  'l-salah-3:c11': [
    { ar: 'التحيّاتُ لله،', tr: 'At-tahiyyatu lillah,', en: 'All greetings of honour are for Allah' },
    { ar: 'والصلواتُ والطيّبات،', tr: 'was-salawatu wat-tayyibat.', en: 'and all prayers and all good things' },
    { ar: 'السلامُ عليك أيّها النبيُّ', tr: "As-salamu 'alayka ayyuhan-nabiyyu", en: 'Peace be upon you, O Prophet' },
    { ar: 'ورحمةُ الله وبركاته،', tr: 'wa rahmatullahi wa barakatuh.', en: 'and the mercy of Allah and His blessings' },
    { ar: 'السلامُ علينا', tr: "As-salamu 'alayna", en: 'Peace be upon us' },
    { ar: 'وعلى عبادِ الله الصالحين،', tr: "wa 'ala 'ibadillahis-salihin.", en: 'and upon the righteous servants of Allah' },
    { ar: 'أشهدُ أن لا إله إلا الله،', tr: 'Ash-hadu an la ilaha illallah,', en: 'I bear witness that there is no god but Allah' },
    { ar: 'وأشهدُ أنّ محمدًا عبدُه ورسولُه', tr: "wa ash-hadu anna Muhammadan 'abduhu wa rasuluh.", en: 'and I bear witness that Muhammad is His servant and His Messenger' },
  ],
  'l-salah-3:c12': [...IBRAHIMI_HALF('salli'), ...IBRAHIMI_HALF('barik')],
  'l-zakah-1:c4': [
    { ar: 'ما نقصتْ', en: 'has never lessened' },
    { ar: 'صدقةٌ', en: 'charity' },
    { ar: 'مِن مالٍ', en: 'any wealth' },
  ],
  'l-sawm-1:c5': [
    { ar: 'مَن صام رمضانَ', en: 'Whoever fasts Ramadan' },
    { ar: 'إيمانًا', en: 'out of faith' },
    { ar: 'واحتسابًا،', en: "and hoping for Allah's reward" },
    { ar: 'غُفِرَ له', en: 'is forgiven' },
    { ar: 'ما تقدَّم مِن ذنبِه', en: 'his past sins' },
  ],
  'l-sawm-2:c2': [
    { ar: 'تسحَّروا', en: 'Eat suhoor' },
    { ar: 'فإنَّ في السَّحورِ', en: 'for in suhoor' },
    { ar: 'بركةً', en: 'there is blessing' },
  ],
  'l-hajj-2:c2': [
    { ar: 'لبَّيكَ اللهمَّ', en: 'Here I am, O Allah' },
    { ar: 'لبَّيك،', en: 'here I am' },
    { ar: 'لبَّيكَ', en: 'Here I am' },
    { ar: 'لا شريكَ لكَ', en: 'You have no partner' },
    { ar: 'لبَّيك،', en: 'here I am' },
    { ar: 'إنَّ الحمدَ', en: 'Indeed, all praise' },
    { ar: 'والنِّعمةَ', en: 'and all blessings' },
    { ar: 'لكَ', en: 'are Yours' },
    { ar: 'والمُلك،', en: 'and all dominion' },
    { ar: 'لا شريكَ لك', en: 'You have no partner' },
  ],
  'l-hajj-3:c3': [
    { ar: 'الحجُّ', en: 'Hajj' },
    { ar: 'عرفةُ', en: '(is) Arafah' },
  ],
}

export const GLOSSES_EN: Record<string, GlossSeg[]> = { ...QURAN_GLOSSES_EN, ...HADITH_GLOSSES_EN }

