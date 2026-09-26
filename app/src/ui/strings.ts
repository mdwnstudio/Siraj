import type { Lang } from '../core/i18n'
import { ordinal } from '../core/i18n'

/* ============================================================
   EVERY STRING THE INTERFACE SAYS, in both languages.
   The lessons carry their own text (core/content); this is the
   chrome around them. English must match Arabic key for key:
   `en` is typed as `typeof ar`, so a missing line fails the build.

   House rules apply to both columns: no em-dashes, and numbers
   that are stats stay Western digits inside a .num span (the
   components add that span, not these strings).
   ============================================================ */

const n = (x: number) => ordinal(x, 'ar')

const ar = {
  appName: 'سراج',
  soon: 'قريبًا',
  beta: 'BETA',

  /* onboarding */
  obHello: { before: 'أهلًا بك! أنا ', name: 'سراج', after: '، ورفيقك في رحلة تعلّم الإسلام، خطوةً خطوة.' },
  obLang: 'بأيّ لغة تحبّ أن نتعلّم؟',
  obName: 'بماذا أُناديك؟',
  obNamePlaceholder: 'اسمك (اختياري)',
  obNameLocal: 'يبقى على جهازك وحده.',
  obGender: (name: string) => (name ? `${name}، هل أنت أخٌ أم أخت؟` : 'هل أنت أخٌ أم أخت؟'),
  obGenderAria: 'أخ أم أخت',
  brother: 'أخ',
  sister: 'أخت',
  obAvatar: (name: string) => (name ? `اختر صورتك يا ${name}` : 'اختر صورةً تمثّلك'),
  yourPicture: 'صورتك',
  obAvatarLater: 'تستطيع تغييرها لاحقًا من ملفّك.',
  obReady: (name: string) => (name ? `أهلًا يا ${name}!` : 'كلّ شيء جاهز!'),
  obReadyText: 'رحلتك تبدأ الآن، من أوّل درجة وصعودًا.',
  letsGo: 'هيّا بنا',
  continue: 'متابعة',
  skip: 'تخطّي',
  startJourney: 'ابدأ الرحلة',

  /* the language picker (stat bar and settings) */
  language: 'اللغة',
  languageAria: (label: string) => `اللغة: ${label}`,
  languageNote: 'تقدّمك محفوظ، ويبقى كما هو بأيّ لغة.',
  languageBeta: 'الترجمة الإنجليزية تجريبية: الآيات والأحاديث منقولة من quran.com وsunnah.com، وبقية النص لم تُراجَع بعد.',

  /* bars */
  streak: 'أيام متتالية',
  xp: 'نقاط الخبرة',
  nav: 'التنقّل',
  tabs: { path: 'الرحلة', review: 'المراجعة', ask: 'اسأل سراج', wins: 'الإنجازات' },
  me: 'ملفي',
  initialFallback: 'س',

  /* the stair */
  unitKicker: (index: number, sub: string) => `الوحدة ${n(index)} · ${sub}`,
  outOf: (a: number, b: number) => `${a} من ${b}`,
  roadReward: 'مكافأة الطريق',
  points: 'نقطة',
  step: 'خطوة',
  chest: 'صندوق',
  trophy: 'إنجاز',
  claimed: 'تم الاستلام',
  reward: 'مكافأة',
  start: 'ابدأ',
  openReward: 'افتح المكافأة',
  lessonOf: (a: number, b: number) => `الدرس ${n(a)} من ${n(b)}`,
  lessonShape: (cards: number, ex: number) => `${n(cards)} بطاقات تعلُّم، ثم ${n(ex)} تمارين.`,
  startLesson: 'ابدأ الدرس',

  /* the unit gate */
  newUnit: 'وحدة جديدة',
  unitsDone: (a: number, b: number) => `أتممت ${n(a)} من ${n(b)} وحدات`,
  unitDoneLine: { well: 'أحسنت!', done: (from: string, to: string) => ` اكتملت وحدة «${from}». هيا نصعد إلى ${to}.` },
  climb: 'هيا نصعد',

  /* the rail */
  railAria: 'لوحة التقدّم',
  allDone: 'أتممتَ المتاح',
  allPillars: 'أتممتَ الأركان الخمسة كلّها',
  railShape: (cards: number, ex: number) => `${n(cards)} بطاقات، ثم ${n(ex)} تمارين`,
  openFromRoad: 'افتحها من الطريق',
  backToRoad: 'عُد إلى الطريق',
  continueJourney: 'تابع الرحلة',
  level: (l: number) => `المستوى ${n(l)}`,
  toNextLevel: { before: 'باقي ', after: ' نقطة للمستوى التالي' },
  wins: 'الإنجازات',
  seeAll: 'عرض الكل',
  of: 'من',
  haveQuestion: 'عندك سؤال؟',
  askPitch: 'سراج يجيبك عمّا تعلّمته، من مصادر موثوقة.',
  askSiraj: 'اسأل سراج',
  reviewedNote: 'المحتوى منقول عن مصادر موثوقة، ويُراجَع من أهل العلم قبل النشر.',

  /* the lesson */
  close: 'إغلاق',
  exerciseOf: (a: number, b: number) => `تمرين ${n(a)} من ${n(b)}`,
  inARow: (c: number) => `${n(c)} متتالية`,
  good: ['أحسنت!', 'ممتاز!', 'بالضبط!', 'رائع!', 'أصبتَ!', 'تمامًا!'],
  notQuite: 'ليست بعيدة',
  correctIs: 'الصحيح: ',
  finishExercises: 'أنهِ التمارين',
  prevCard: 'البطاقة السابقة',
  next: 'التالي',
  practise: 'لنتدرّب',
  matchHint: 'اختر من كل عمودٍ ما يقابله',
  sortHint: 'لكل بطاقة: اضغط على الجواب الصحيح',
  check: 'تحقّق',
  fromQuran: 'من القرآن',
  fromSunnah: 'من السنّة',
  termHint: 'اضغط على الكلمة المُظلّلة لمعناها',
  lessonXp: 'النقاط في هذا الدرس',

  /* exercises */
  trueOrFalse: 'صحيح أم خطأ؟',
  true: 'صح',
  false: 'خطأ',
  orderHint: 'اضغط على الخطوات بالترتيب',
  rightOrder: 'الترتيب الصحيح: ',
  orderArrow: ' ← ',
  sorted: 'تمّ التصنيف',
  sortCue: { card: 'البطاقة', of: 'من', tap: 'اضغط على الجواب' },

  /* result */
  newStep: 'أضاءت درجة جديدة',
  flawless: 'بلا خطأ!',
  wellDone: 'أحسنت!',
  perfectLine: 'أجبتَ عن كل شيء إجابةً صحيحة. درجةٌ أخرى خلفك.',
  scoreLine: (a: number, b: number) => `أصبتَ ${n(a)} من ${n(b)}. الدرجة التالية مفتوحة.`,
  statXp: 'نقاط',
  statAccuracy: 'الدقّة',
  statTime: 'الزمن',
  percent: '٪',
  streakDays: (d: number) => (d === 1 ? 'يومٌ متتالٍ' : `${n(d)} أيام متتالية`),
  keepClimbing: 'تابِع الصعود',

  /* wins */
  winsHero: (won: number, all: number) => (won === 0 ? 'أوّل إنجاز ينتظرك' : `${n(won)} من ${n(all)} إنجازات`),
  winsText: 'كل إنجاز علامة على الطريق. أكمل الدروس دون أخطاء، وحافظ على مصباحك مضاءً.',

  /* review */
  review: 'المراجعة',
  nothingYet: ['لا شيء لمراجعته بعد.', 'أتمِم درسًا أوّلًا وسيظهر هنا.'],
  reviewHero: 'التكرار يُثبّت المعلومة',
  reviewLine: (done: number, weakest: string) => `أتممتَ ${lessonsAr(done)}. ابدأ بالأضعف: ${weakest}.`,
  reviewWeakest: 'راجع الأضعف',
  allLearned: 'كل ما تعلّمته',

  /* me */
  friend: 'صديق سراج',
  editProfile: 'تعديل الملف',
  journey: 'رحلتك',
  statStreak: (d: number): string => (d === 1 ? 'يوم متتالٍ' : 'أيام متتالية'),
  statXpKey: 'نقطة خبرة',
  statSteps: (total: number) => `من ${n(total)} درجة`,
  statWins: 'إنجاز',
  about: 'عن سراج',
  aboutText: 'رحلة تفاعلية لتعلّم أساسيات الإسلام. المحتوى منقول عن مصادر موثوقة، ويُراجَع من أهل العلم قبل النشر.',
  version: 'الإصدار',
  settings: 'الإعدادات',
  sound: 'الأصوات',
  soundNote: 'نغمات قصيرة عند الإجابة',
  haptics: 'الاهتزاز',
  hapticsNote: 'على الأجهزة التي تدعمه',
  calm: 'تقليل الحركة',
  calmNote: 'إيقاف الاحتفالات المتحرّكة',
  look: 'المظهر',
  themes: { auto: 'تلقائي', light: 'فاتح', dark: 'داكن' },
  resetWarn: 'سيُحذف كل تقدّمك - النقاط والأيام المتتالية والدروج المفتوحة. لا يمكن التراجع.',
  resetYes: 'نعم، احذف',
  resetNo: 'تراجع',
  reset: 'إعادة ضبط التقدّم',

  /* the profile sheet */
  name: 'الاسم',
  namePlaceholder: 'اسمك',
  cover: 'الغلاف',
  done: 'تمّ',

  /* ask siraj */
  stage: {
    reading: 'أقرأ سؤالك…',
    searching: 'أبحث في مصادري الموثوقة…',
    digging: 'أراجع ما وجدتُ لأنقله بدقّة…',
    patient: 'ما زلت أبحث، الجواب الدقيق يستحق لحظة صبر…',
    writing: 'وجدتُ الجواب، أكتبه لك…',
  },
  after: ['هل بقي شيء غير واضح؟', 'تفضّل بسؤال آخر.', 'اسألني عن أي شيء في هذا الدرس.'],
  hereIsAnswer: 'إليك الجواب:',
  letMeCheck: 'لحظة، دعني أتحقّق…',
  askIntro: { before: 'شيءٌ لم يتّضح في ', after: '؟ اسألني.' },
  askPlaceholder: 'أو اكتب سؤالك…',
  send: 'إرسال',
  askNote: 'يجيب سراج نقلًا عن مصادر موثوقة فقط.',
  askFailed: 'تعذّر الحصول على إجابة.',
  askSorry: 'عذرًا، لم أتمكّن هذه المرة.',
  askDone: 'تابع',
}

export type Strings = typeof ar

const en: Strings = {
  appName: 'Siraj',
  soon: 'Soon',
  beta: 'BETA',

  obHello: { before: 'Welcome! I am ', name: 'Siraj', after: ', your companion on the journey of learning Islam, step by step.' },
  obLang: 'Which language would you like to learn in?',
  obName: 'What should I call you?',
  obNamePlaceholder: 'Your name (optional)',
  obNameLocal: 'It stays on your device only.',
  obGender: (name) => (name ? `${name}, are you a brother or a sister?` : 'Are you a brother or a sister?'),
  obGenderAria: 'Brother or sister',
  brother: 'Brother',
  sister: 'Sister',
  obAvatar: (name) => (name ? `Pick your picture, ${name}` : 'Pick a picture for yourself'),
  yourPicture: 'Your picture',
  obAvatarLater: 'You can change it later from your profile.',
  obReady: (name) => (name ? `Welcome, ${name}!` : 'All set!'),
  obReadyText: 'Your journey starts now, from the first step upward.',
  letsGo: 'Let\'s go',
  continue: 'Continue',
  skip: 'Skip',
  startJourney: 'Start the journey',

  language: 'Language',
  languageAria: (label) => `Language: ${label}`,
  languageNote: 'Your progress is saved, and stays the same in any language.',
  languageBeta: 'The English translation is in beta: the verses and hadith are taken from quran.com and sunnah.com, and the rest has not been reviewed yet.',

  streak: 'Day streak',
  xp: 'Experience points',
  nav: 'Navigation',
  tabs: { path: 'Journey', review: 'Review', ask: 'Ask Siraj', wins: 'Achievements' },
  me: 'Me',
  initialFallback: 'S',

  unitKicker: (index, sub) => `Unit ${index} · ${sub}`,
  outOf: (a, b) => `${a} of ${b}`,
  roadReward: 'Road reward',
  points: 'XP',
  step: 'Step',
  chest: 'Chest',
  trophy: 'Trophy',
  claimed: 'Claimed',
  reward: 'Reward',
  start: 'Start',
  openReward: 'Open the reward',
  lessonOf: (a, b) => `Lesson ${a} of ${b}`,
  lessonShape: (cards, ex) => `${cards} learning cards, then ${ex} exercises.`,
  startLesson: 'Start the lesson',

  newUnit: 'New unit',
  unitsDone: (a, b) => `${a} of ${b} units done`,
  unitDoneLine: { well: 'Well done!', done: (from, to) => ` You finished "${from}". Let's climb to ${to}.` },
  climb: 'Let\'s climb',

  railAria: 'Progress panel',
  allDone: 'All caught up',
  allPillars: 'You finished all five pillars',
  railShape: (cards, ex) => `${cards} cards, then ${ex} exercises`,
  openFromRoad: 'Open it on the road',
  backToRoad: 'Back to the road',
  continueJourney: 'Continue the journey',
  level: (l) => `Level ${l}`,
  toNextLevel: { before: '', after: ' XP to the next level' },
  wins: 'Achievements',
  seeAll: 'See all',
  of: 'of',
  haveQuestion: 'Got a question?',
  askPitch: 'Siraj answers about what you learned, from trusted sources.',
  askSiraj: 'Ask Siraj',
  reviewedNote: 'The content is taken from trusted sources and is reviewed by people of knowledge before release.',

  close: 'Close',
  exerciseOf: (a, b) => `Exercise ${a} of ${b}`,
  inARow: (c) => `${c} in a row`,
  good: ['Well done!', 'Excellent!', 'Exactly!', 'Great!', 'You got it!', 'Spot on!'],
  notQuite: 'Not far off',
  correctIs: 'The answer: ',
  finishExercises: 'Finish the exercises',
  prevCard: 'Previous card',
  next: 'Next',
  practise: 'Let\'s practise',
  matchHint: 'Pick the matching pair from each column',
  sortHint: 'For each card, tap the right answer',
  check: 'Check',
  fromQuran: 'From the Quran',
  fromSunnah: 'From the Sunnah',
  termHint: 'Tap the highlighted word for its meaning',
  lessonXp: 'XP in this lesson',

  trueOrFalse: 'True or false?',
  true: 'True',
  false: 'False',
  orderHint: 'Tap the steps in order',
  rightOrder: 'The right order: ',
  orderArrow: ' → ',
  sorted: 'All sorted',
  sortCue: { card: 'Card', of: 'of', tap: 'tap the answer' },

  newStep: 'A new step is lit',
  flawless: 'Flawless!',
  wellDone: 'Well done!',
  perfectLine: 'You got everything right. Another step behind you.',
  scoreLine: (a, b) => `You got ${a} of ${b}. The next step is open.`,
  statXp: 'XP',
  statAccuracy: 'Accuracy',
  statTime: 'Time',
  percent: '%',
  streakDays: (d) => (d === 1 ? '1 day in a row' : `${d} days in a row`),
  keepClimbing: 'Keep climbing',

  winsHero: (won, all) => (won === 0 ? 'Your first achievement awaits' : `${won} of ${all} achievements`),
  winsText: 'Every achievement is a marker on the road. Finish lessons without mistakes, and keep your lamp lit.',

  review: 'Review',
  nothingYet: ['Nothing to review yet.', 'Finish a lesson first and it will show up here.'],
  reviewHero: 'Repetition makes it stick',
  reviewLine: (done, weakest) => `You have finished ${done === 1 ? 'one lesson' : `${done} lessons`}. Start with the weakest: ${weakest}.`,
  reviewWeakest: 'Review the weakest',
  allLearned: 'Everything you have learned',

  friend: 'Friend of Siraj',
  editProfile: 'Edit profile',
  journey: 'Your journey',
  statStreak: (d) => (d === 1 ? 'day in a row' : 'days in a row'),
  statXpKey: 'XP',
  statSteps: (total) => `of ${total} steps`,
  statWins: 'achievements',
  about: 'About Siraj',
  aboutText: 'An interactive journey through the basics of Islam. The content is taken from trusted sources and is reviewed by people of knowledge before release.',
  version: 'Version',
  settings: 'Settings',
  sound: 'Sounds',
  soundNote: 'Short tones when you answer',
  haptics: 'Vibration',
  hapticsNote: 'On devices that support it',
  calm: 'Reduce motion',
  calmNote: 'Turns off the animated celebrations',
  look: 'Appearance',
  themes: { auto: 'Auto', light: 'Light', dark: 'Dark' },
  resetWarn: 'All your progress will be deleted: points, streak and the steps you opened. This cannot be undone.',
  resetYes: 'Yes, delete',
  resetNo: 'Cancel',
  reset: 'Reset progress',

  name: 'Name',
  namePlaceholder: 'Your name',
  cover: 'Cover',
  done: 'Done',

  stage: {
    reading: 'Reading your question…',
    searching: 'Searching my trusted sources…',
    digging: 'Checking what I found so I quote it exactly…',
    patient: 'Still searching. An exact answer is worth a moment\'s patience…',
    writing: 'Found it, writing it out for you…',
  },
  after: ['Is anything still unclear?', 'Go ahead, ask another.', 'Ask me anything about this lesson.'],
  hereIsAnswer: 'Here is the answer:',
  letMeCheck: 'One moment, let me check…',
  askIntro: { before: 'Something unclear in ', after: '? Ask me.' },
  askPlaceholder: 'Or type your question…',
  send: 'Send',
  askNote: 'Siraj answers only by quoting trusted sources.',
  askFailed: 'Could not get an answer.',
  askSorry: 'Sorry, I could not manage it this time.',
  askDone: 'Continue',
}

export const STRINGS: Record<Lang, Strings> = { ar, en }

/** Arabic number agreement: درسًا واحدًا، درسين، ٣ دروس، ١١ درسًا */
function lessonsAr(x: number): string {
  if (x === 1) return 'درسًا واحدًا'
  if (x === 2) return 'درسين'
  if (x <= 10) return `${n(x)} دروس`
  return `${n(x)} درسًا`
}
