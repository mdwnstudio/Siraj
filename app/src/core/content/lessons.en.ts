import type { Card, Lesson } from '../types'
import { QUOTES_EN, type QuoteId } from './quotes.en'

/* ============================================================
   THE CURRICULUM IN ENGLISH (beta).

   A translation of lessons.ts, card for card: every lesson, card,
   exercise, option and answer key keeps the Arabic file's ids, so
   the two can never grade differently. scripts/check-lessons.mjs
   holds them to that.

   Quran and hadith are NOT translated here. They come from
   quran.com (Saheeh International) and sunnah.com through
   scripts/fetch-quotes.mjs, and are read from quotes.en.ts by id.

   NOTE FOR REVIEWERS - like the Arabic, this must be reviewed by
   a qualified person before it ships to the public. See AGENTS.md.
   ============================================================ */

/** a quote card's text and source, straight from quran.com or sunnah.com */
const q = (id: QuoteId): Pick<Extract<Card, { kind: 'quote' }>, 'text' | 'source' | 'url'> => QUOTES_EN[id]

/** an inline quotation with its reference */
const cite = (id: QuoteId): string => `“${QUOTES_EN[id].text}” (${QUOTES_EN[id].source})`

/* ---------------------------------------------------------------
   0 - The Beginning
   --------------------------------------------------------------- */

const whatIsIslam: Lesson = {
  id: 'l-intro-1',
  title: 'What is Islam?',
  subtitle: 'The Beginning',
  icon: 'Sun',
  xp: 10,
  cards: [
    {
      kind: 'fact',
      id: 'c1',
      title: 'Welcome',
      body: 'I am Siraj, your companion on this journey. We start from zero, so there is nothing you need to know beforehand.',
      art: 'siraj-wave',
    },
    {
      kind: 'fact',
      id: 'c2',
      title: 'A general meaning and a specific one',
      body: 'In its general meaning, Islam is the religion of all the prophets and messengers, from Adam to Muhammad, peace and blessings be upon them all. Their religion is one: Tawhid, and submitting to Allah. In its specific meaning, it is what Muhammad ﷺ was sent with, and that is what we learn on this journey.',
      art: { icon: 'Sun' },
    },
    {
      kind: 'quote',
      id: 'c3',
      of: 'ayah',
      ...q('q3_19'),
    },
    {
      kind: 'fact',
      id: 'c4',
      body: 'In the Arabic language, the word "Islam" means surrender and compliance. As a term of the religion it means: submitting to Allah through Tawhid, obeying Him, and disowning shirk and its people.',
      term: { word: 'term', meaning: 'The meaning the Shariah gives a word, which can be narrower than its everyday meaning' },
    },
    {
      kind: 'fact',
      id: 'c5',
      body: 'Whoever enters Islam is called a "Muslim": someone who has submitted to Allah and follows His command.',
      term: { word: 'Muslim', meaning: 'One who submits to Allah through Tawhid and follows His command' },
    },
    {
      kind: 'fact',
      id: 'c6',
      title: 'Five pillars',
      body: 'Islam is built on five pillars. Picture them as the columns that hold up a whole building. We will meet them one at a time.',
      art: { icon: 'Star' },
    },
  ],
  exercises: [
    {
      kind: 'choice',
      id: 'e1',
      prompt: 'What does the word "Islam" mean in Arabic?',
      options: [
        { id: 'a', label: 'Surrender and compliance' },
        { id: 'b', label: 'Patience and endurance' },
        { id: 'c', label: 'Knowledge and learning' },
        { id: 'd', label: 'Travel and journeying' },
      ],
      answerId: 'a',
      explain: 'Islam comes from "aslama": to surrender and comply.',
    },
    {
      kind: 'choice',
      id: 'e2',
      prompt: 'What is Islam in its general meaning?',
      options: [
        { id: 'a', label: 'The religion of all the prophets, from Adam to Muhammad ﷺ' },
        { id: 'b', label: 'The religion of the Arabs alone' },
        { id: 'c', label: 'A religion that began in the last century' },
        { id: 'd', label: 'A name for anyone who does good' },
      ],
      answerId: 'a',
      explain: 'The religion of the prophets is one at its root: Tawhid, and submitting to Allah.',
    },
    {
      kind: 'choice',
      id: 'e3',
      prompt: 'What does Islam mean as a term of the religion?',
      options: [
        { id: 'a', label: 'Submitting through Tawhid, obeying, and disowning shirk' },
        { id: 'b', label: 'Prayer alone' },
        { id: 'c', label: 'Learning the Arabic language' },
        { id: 'd', label: 'Only wishing people well' },
      ],
      answerId: 'a',
    },
    {
      kind: 'choice',
      id: 'e4',
      prompt: 'How many pillars is Islam built on?',
      options: [
        { id: 'a', label: 'Three' },
        { id: 'b', label: 'Five' },
        { id: 'c', label: 'Six' },
        { id: 'd', label: 'Seven' },
      ],
      answerId: 'b',
    },
  ],
  ask: [
    {
      q: 'Do I have to memorise anything in Arabic?',
      a: 'The two testimonies are said in Arabic, and they are two short sentences you will learn easily in the next lesson. The Quran is also recited in Arabic, because it is the word of Allah in its wording, and what you read in your own language is a translation of its meaning, not the Quran itself. Understanding and making dua are in your own language, and Allah knows what is in the hearts whatever the language.',
    },
    {
      q: 'What is the difference between Islam and Iman?',
      a: 'Islam is the outward actions: the two testimonies, prayer, zakah, fasting and Hajj. Iman is the inward belief: belief in Allah, His angels, His books, His messengers, the Last Day and the Decree. The two go together: the outward and the inward.',
    },
    {
      q: 'Why do we start with the five pillars?',
      a: 'Because they are the frame everything else rests on. Once you understand the five, the rest of the details become much easier, like learning the letters before the words.',
    },
  ],
}

const fivePillars: Lesson = {
  id: 'l-intro-2',
  title: 'The Five Pillars',
  subtitle: 'The whole picture',
  icon: 'Star',
  xp: 15,
  cards: [
    {
      kind: 'fact',
      id: 'c1',
      body: 'Jibril (Gabriel), peace be upon him, asked the Prophet ﷺ about Islam, and he answered with a reply that gathered all five pillars in one sentence.',
      art: 'siraj',
    },
    {
      kind: 'quote',
      id: 'c2',
      of: 'hadith',
      ...q('h_islam'),
      note: 'This is the order we will follow on our journey.',
    },
    {
      kind: 'list',
      id: 'c3',
      title: 'The five pillars',
      items: [
        { icon: 'Star', label: 'The two testimonies', note: 'To testify that there is no god but Allah and that Muhammad is the Messenger of Allah' },
        { icon: 'Sun', label: 'Establishing prayer', note: 'Five prayers in every day and night' },
        { icon: 'Droplet', label: 'Giving zakah', note: 'A set share of wealth, given to those entitled to it' },
        { icon: 'Crescent', label: 'Fasting Ramadan', note: 'Fasting the month of Ramadan every year' },
        { icon: 'Lantern', label: 'Hajj to the House', note: 'Travelling to the Sacred House once in a lifetime, for whoever is able' },
      ],
    },
    {
      kind: 'fact',
      id: 'c4',
      title: 'Why are they called pillars?',
      body: `A pillar is what a building stands on: if it falls, the whole building is shaken. The Prophet ﷺ said: ${cite('h_five')}`,
      art: { icon: 'Star' },
    },
  ],
  exercises: [
    {
      kind: 'order',
      id: 'e1',
      prompt: 'Put the pillars of Islam in the order of the hadith of Jibril',
      items: [
        { id: 'salah', label: 'Establishing prayer' },
        { id: 'hajj', label: 'Hajj to the House' },
        { id: 'shahada', label: 'The two testimonies' },
        { id: 'sawm', label: 'Fasting Ramadan' },
        { id: 'zakah', label: 'Giving zakah' },
      ],
      answer: ['shahada', 'salah', 'zakah', 'sawm', 'hajj'],
      explain: 'The two testimonies come first because they are the key, then prayer, then zakah, then fasting, then Hajj.',
    },
    {
      kind: 'match',
      id: 'e2',
      prompt: 'Match each pillar with its description',
      pairs: [
        { id: 'p1', left: 'Zakah', right: 'A due on wealth' },
        { id: 'p2', left: 'Fasting', right: 'The month of Ramadan' },
        { id: 'p3', left: 'Hajj', right: 'Once in a lifetime' },
        { id: 'p4', left: 'Prayer', right: 'Five a day' },
      ],
    },
    {
      kind: 'boolean',
      id: 'e3',
      statement: 'Hajj is required of every Muslim, even one who is not able to make it.',
      answer: false,
      explain: `Hajj is only required of those who are able: ${cite('h_islam_able')}`,
    },
    {
      kind: 'boolean',
      id: 'e4',
      statement: 'The two testimonies are the first pillar, and by them a person enters Islam.',
      answer: true,
      explain: 'They are the door, and the other pillars are built on them.',
    },
  ],
  ask: [
    {
      q: 'Why are the two testimonies the first pillar?',
      a: 'Because they are the door. The other pillars are deeds that are only accepted after affirming that none is worthy of worship but Allah and that Muhammad is His Messenger. They are the foundation the four remaining columns are built on.',
    },
    {
      q: 'What if I cannot do one of the pillars?',
      a: `Islam is a religion of ease: zakah is on those who own the nisab, Hajj is on those who are able, and the sick and the traveller are excused from fasting and make it up later. Prayer, though, is never dropped while the mind is present, and whoever abandons it deliberately without an excuse has left Islam. The Prophet ﷺ said: ${cite('h_prayer_kufr')}`,
    },
    {
      q: 'Do I start all of them at once?',
      a: 'No. You begin with the two testimonies, then learn the prayer and establish it, and each pillar comes in its time: zakah when you own the nisab, fasting in Ramadan, and Hajj once in a lifetime for whoever is able.',
    },
  ],
}

const pillarsOfIman: Lesson = {
  id: 'l-intro-3',
  title: 'The Pillars of Iman',
  subtitle: 'What the heart believes',
  icon: 'Crescent',
  xp: 15,
  cards: [
    {
      kind: 'fact',
      id: 'c1',
      body: 'You now know the pillars of Islam, which are outward actions. In the same hadith of Jibril he also asked about Iman (faith), which is what the heart believes.',
      art: 'siraj',
    },
    {
      kind: 'quote',
      id: 'c2',
      of: 'hadith',
      ...q('h_iman'),
      note: 'The answer the Prophet ﷺ gave Jibril when he asked about Iman.',
    },
    {
      kind: 'list',
      id: 'c3',
      title: 'The six pillars of Iman',
      items: [
        { icon: 'Sun', label: 'Belief in Allah' },
        { icon: 'Sparkle', label: 'Belief in the angels' },
        { icon: 'Star', label: 'Belief in the books' },
        { icon: 'Droplet', label: 'Belief in the messengers' },
        { icon: 'Crescent', label: 'Belief in the Last Day' },
        { icon: 'Flame', label: 'Belief in the Decree', note: 'Its good and its bad' },
      ],
    },
    {
      kind: 'fact',
      id: 'c4',
      title: 'Do not mix them up',
      body: 'The pillars of Islam are five, and the pillars of Iman are six. The first are outward actions you do; the second are matters you believe in your heart. And Iman is saying with the tongue, believing with the heart, and acting with the limbs.',
      term: { word: 'limbs', meaning: 'The parts of the body a person acts with, such as the hands, the feet and the tongue' },
    },
  ],
  exercises: [
    {
      kind: 'choice',
      id: 'e1',
      prompt: 'How many pillars of Iman are there?',
      options: [
        { id: 'a', label: 'Five' },
        { id: 'b', label: 'Six' },
        { id: 'c', label: 'Seven' },
        { id: 'd', label: 'Four' },
      ],
      answerId: 'b',
    },
    {
      kind: 'order',
      id: 'e2',
      prompt: 'Put the pillars of Iman in the order of the hadith of Jibril',
      items: [
        { id: 'kutub', label: 'The books' },
        { id: 'allah', label: 'Allah' },
        { id: 'qadar', label: 'The Decree' },
        { id: 'rusul', label: 'The messengers' },
        { id: 'malaikah', label: 'The angels' },
        { id: 'akhir', label: 'The Last Day' },
      ],
      answer: ['allah', 'malaikah', 'kutub', 'rusul', 'akhir', 'qadar'],
    },
    {
      kind: 'sort',
      id: 'e3',
      prompt: 'Is this a pillar of Islam, or a pillar of Iman?',
      buckets: [
        { id: 'islam', label: 'A pillar of Islam' },
        { id: 'iman', label: 'A pillar of Iman' },
      ],
      items: [
        { id: 'i1', label: 'Establishing prayer', bucket: 'islam' },
        { id: 'i2', label: 'Belief in the angels', bucket: 'iman' },
        { id: 'i3', label: 'Giving zakah', bucket: 'islam' },
        { id: 'i4', label: 'Belief in the Decree', bucket: 'iman' },
        { id: 'i5', label: 'Fasting Ramadan', bucket: 'islam' },
        { id: 'i6', label: 'Belief in the Last Day', bucket: 'iman' },
      ],
      explain: 'The pillars of Islam are outward actions, and the pillars of Iman are beliefs in the heart.',
    },
    {
      kind: 'choice',
      id: 'e4',
      prompt: 'Which of these is NOT a pillar of Islam?',
      options: [
        { id: 'a', label: 'Establishing prayer' },
        { id: 'b', label: 'Belief in the books' },
        { id: 'c', label: 'Giving zakah' },
        { id: 'd', label: 'Hajj to the House' },
      ],
      answerId: 'b',
      explain: 'Belief in the books is a pillar of Iman, not of Islam.',
    },
    {
      kind: 'boolean',
      id: 'e5',
      statement: 'Iman is belief in the heart only, without words or deeds.',
      answer: false,
      explain: 'Iman is saying with the tongue, believing with the heart, and acting with the limbs.',
    },
  ],
  ask: [
    {
      q: 'Does Iman increase and decrease?',
      a: `Yes, it increases with obedience and decreases with sin. Allah says: ${cite('q48_4')}`,
    },
    {
      q: 'What does belief in the Decree mean?',
      a: 'That you believe Allah knew everything and wrote it, and that nothing happens except by His will and His creating, while you are still responsible for your own actions and choices.',
    },
    {
      q: 'Do we believe in all the books?',
      a: 'We believe that Allah sent down books to His messengers, among them the Torah, the Gospel (Injil) and the Psalms (Zabur), and that the Quran is the last of them, preserved by Allah Himself.',
    },
  ],
}

/* ---------------------------------------------------------------
   1 - The Shahadah
   --------------------------------------------------------------- */

const shahadaMeaning: Lesson = {
  id: 'l-shahada-1',
  title: 'The Meaning of the Shahadah',
  subtitle: 'The first pillar',
  icon: 'Star',
  xp: 15,
  cards: [
    {
      kind: 'fact',
      id: 'c1',
      title: 'The key',
      body: 'The two testimonies (the Shahadah) are the first pillar of Islam, and by them a person enters Islam. Two short sentences, but they change everything.',
      art: 'siraj',
    },
    {
      kind: 'quote',
      id: 'c2',
      of: 'ayah',
      ...q('q2_163'),
    },
    {
      kind: 'fact',
      id: 'c3',
      title: 'Its words',
      body: 'Ash-hadu an la ilaha illallah, wa ash-hadu anna Muhammadan rasulullah: I bear witness that there is no god worthy of worship except Allah, and I bear witness that Muhammad is the Messenger of Allah.',
      term: { word: 'Ash-hadu', meaning: 'I affirm and declare, with knowledge and certainty' },
    },
    {
      kind: 'list',
      id: 'c4',
      title: 'Two halves that never separate',
      items: [
        {
          icon: 'Star',
          label: '"La ilaha illallah": sincerity to the One worshipped',
          note: 'It means: none is worthy of worship but Allah. It tells us whom we worship, so we worship Allah alone and disown shirk.',
        },
        {
          icon: 'Droplet',
          label: '"Muhammadun rasulullah": following the Messenger ﷺ',
          note: 'It means: affirming that Muhammad was sent by Allah with His law. It tells us how we worship, so we obey him ﷺ, keep to his way, and worship Allah only as He prescribed.',
        },
      ],
    },
    {
      kind: 'fact',
      id: 'c5',
      title: 'Negation and affirmation',
      body: '"La ilaha" is a negation: there is no true god besides Him. "Illallah" is an affirmation: all worship is for Him alone. The negation empties the heart, and the affirmation fills it.',
      art: { icon: 'Lantern' },
    },
  ],
  exercises: [
    {
      kind: 'order',
      id: 'e1',
      prompt: 'Put the words of the first testimony in order',
      items: [
        { id: 'w3', label: 'la ilaha (there is no god)' },
        { id: 'w1', label: 'Ash-hadu (I bear witness)' },
        { id: 'w4', label: 'illallah (except Allah)' },
        { id: 'w2', label: 'an (that)' },
      ],
      answer: ['w1', 'w2', 'w3', 'w4'],
    },
    {
      kind: 'choice',
      id: 'e2',
      prompt: 'What does "Ash-hadu" mean?',
      options: [
        { id: 'a', label: 'I affirm and declare with certainty' },
        { id: 'b', label: 'I wish and hope' },
        { id: 'c', label: 'I suppose, perhaps' },
        { id: 'd', label: 'I hear and listen' },
      ],
      answerId: 'a',
      explain: 'Testifying is affirming with knowledge and certainty, not guessing or wishing.',
    },
    {
      kind: 'match',
      id: 'e3',
      prompt: 'Match each part with its meaning',
      pairs: [
        { id: 'p1', left: 'La ilaha', right: 'Negation' },
        { id: 'p2', left: 'Illallah', right: 'Affirmation' },
        { id: 'p3', left: 'Muhammadun rasulullah', right: 'Affirming his message' },
      ],
    },
    {
      kind: 'choice',
      id: 'e4',
      prompt: 'Testifying that Muhammad is the Messenger of Allah tells us:',
      options: [
        { id: 'a', label: 'How to worship Allah' },
        { id: 'b', label: 'When the Prophet ﷺ was born' },
        { id: 'c', label: 'How many prophets there were' },
        { id: 'd', label: 'Where to live' },
      ],
      answerId: 'a',
      explain: '"La ilaha illallah" tells us whom we worship, and "Muhammadun rasulullah" tells us how we worship Him.',
    },
    {
      kind: 'boolean',
      id: 'e5',
      statement: 'It is enough to testify that there is no god but Allah, without testifying that Muhammad ﷺ is His Messenger.',
      answer: false,
      explain: 'The two halves never separate: both are needed together.',
    },
    {
      kind: 'choice',
      id: 'e6',
      prompt: 'How does a person enter Islam?',
      options: [
        { id: 'a', label: 'By praying' },
        { id: 'b', label: 'By the two testimonies' },
        { id: 'c', label: 'By fasting' },
        { id: 'd', label: 'By Hajj' },
      ],
      answerId: 'b',
    },
  ],
  ask: [
    {
      q: 'Do I have to say it in Arabic?',
      a: 'Yes, it is said in Arabic as it was taught, and it is a short, easy sentence. What matters most, though, is that you understand its meaning in your heart, and that can be in any language.',
    },
    {
      q: 'What happens after saying the two testimonies?',
      a: 'You become a Muslim from that moment, and your journey with the other pillars begins: you learn the prayer, then zakah, then fasting, then Hajj. Step by step, not all at once.',
    },
    {
      q: 'Why does the negation come before the affirmation?',
      a: 'Because the heart is emptied before it is filled. "La ilaha" removes everything worshipped without right, and "illallah" affirms the one true God alone. Like a vessel you empty and then fill with clear water.',
    },
  ],
}

const prophetMuhammad: Lesson = {
  id: 'l-shahada-2',
  title: 'Muhammad, the Messenger of Allah ﷺ',
  subtitle: 'The second half',
  icon: 'Sparkle',
  xp: 15,
  cards: [
    {
      kind: 'fact',
      id: 'c1',
      body: 'Muhammad son of Abdullah ﷺ was born in Makkah and was sent as a messenger at the age of forty. He is the Seal of the Prophets: there is no prophet after him.',
      term: { word: 'ﷺ', meaning: 'Salla Allahu alayhi wa sallam: may Allah send blessings and peace upon him. Allah\'s blessing on him is His praise of him among the angels and His mercy; our blessing on him is a prayer for him' },
      art: 'siraj',
    },
    {
      kind: 'quote',
      id: 'c2',
      of: 'ayah',
      ...q('q21_107'),
    },
    {
      kind: 'fact',
      id: 'c3',
      title: 'What does this testimony mean?',
      body: 'That you believe him in what he told, obey him in what he commanded, keep away from what he forbade, and worship Allah only in the way he taught.',
    },
    {
      kind: 'fact',
      id: 'c4',
      body: 'He is a human being and a messenger. He is not worshipped, and he is not called upon besides Allah. We love him and follow him, and worship is for Allah alone.',
      art: { icon: 'Crescent' },
    },
  ],
  exercises: [
    {
      kind: 'boolean',
      id: 'e1',
      statement: 'The Prophet Muhammad ﷺ is worshipped along with Allah.',
      answer: false,
      explain: 'He is a messenger who is followed and loved, and worship is for Allah alone.',
    },
    {
      kind: 'choice',
      id: 'e2',
      prompt: 'What does "the Seal of the Prophets" mean?',
      options: [
        { id: 'a', label: 'He is the last prophet, with no prophet after him' },
        { id: 'b', label: 'He is the first prophet' },
        { id: 'c', label: 'He lived longer than any other prophet' },
        { id: 'd', label: 'He worked as a maker of seals' },
      ],
      answerId: 'a',
    },
    {
      kind: 'sort',
      id: 'e3',
      prompt: 'Is this part of testifying that Muhammad is the Messenger of Allah?',
      buckets: [
        { id: 'yes', label: 'Yes, it is part of it' },
        { id: 'no', label: 'No, it is not' },
      ],
      items: [
        { id: 'i1', label: 'Believing him in what he told', bucket: 'yes' },
        { id: 'i2', label: 'Calling upon him besides Allah', bucket: 'no' },
        { id: 'i3', label: 'Obeying him in what he commanded', bucket: 'yes' },
        { id: 'i4', label: 'Keeping away from what he forbade', bucket: 'yes' },
      ],
    },
    {
      kind: 'match',
      id: 'e4',
      prompt: 'Match',
      pairs: [
        { id: 'p1', left: 'Where he was born', right: 'Makkah' },
        { id: 'p2', left: 'His age when sent', right: 'Forty years' },
        { id: 'p3', left: 'ﷺ', right: 'Peace and blessings be upon him' },
      ],
    },
  ],
  ask: [
    {
      q: 'Why do we say ﷺ after his name?',
      a: `Sending blessings on him ﷺ comes from two sides: from Allah, which is His praise of him among the angels and His mercy; and from His servants, which is praying for him and asking mercy for him. Allah commanded it: ${cite('q33_56')} And its reward is great. He ﷺ said: ${cite('h_salawat')}`,
    },
    {
      q: 'Are the other prophets mentioned in Islam?',
      a: 'Yes, and believing in all of them is required: Nuh (Noah), Ibrahim (Abraham), Musa (Moses), Isa (Jesus) and others, peace be upon them. A Muslim believes in every one of them, that they all came with Tawhid, and that Muhammad ﷺ is the last of them.',
    },
    {
      q: 'How do I follow him ﷺ?',
      a: 'Through the Sunnah: his sayings and actions, which were passed on and written down. From it you learn how to pray, how to fast, and how to treat people. You will meet its first practice in the prayer lessons.',
    },
  ],
}

/* ---------------------------------------------------------------
   2 - Establishing Prayer (wudu comes first on the stair)
   --------------------------------------------------------------- */

const fivePrayers: Lesson = {
  id: 'l-salah-1',
  title: 'Establishing Prayer',
  subtitle: 'The second pillar',
  icon: 'Sun',
  xp: 20,
  cards: [
    {
      kind: 'fact',
      id: 'c1',
      body: 'Establishing prayer is the second pillar, and it is your daily connection with Allah: five prayers spread across the day and the night.',
      art: 'siraj-wave',
    },
    {
      kind: 'quote',
      id: 'c2',
      of: 'ayah',
      ...q('q4_103'),
      note: 'That is: made obligatory at set times.',
    },
    {
      kind: 'list',
      id: 'c3',
      title: 'Each prayer\'s time, from start to end',
      items: [
        { icon: 'Crescent', label: 'Fajr', note: 'From the true dawn until sunrise' },
        { icon: 'Sun', label: 'Dhuhr', note: 'From when the sun passes its highest point until a thing\'s shadow equals its length' },
        { icon: 'Sun', label: 'Asr', note: 'From when a thing\'s shadow equals its length until the sun turns yellow' },
        { icon: 'Flame', label: 'Maghrib', note: 'From sunset until the red twilight disappears' },
        { icon: 'Star', label: 'Isha', note: 'From when the red twilight disappears until the middle of the night' },
      ],
    },
    {
      kind: 'quote',
      id: 'c4',
      of: 'hadith',
      ...q('h_times'),
    },
    {
      kind: 'fact',
      id: 'c5',
      title: 'When does Fajr begin?',
      body: 'The time of Fajr begins with the true dawn, not the false dawn that comes before it.',
      term: { word: 'true dawn', meaning: 'A whiteness that spreads sideways along the horizon and grows brighter until sunrise. The false dawn is an upright streak of light that rises in the sky and is followed by darkness again' },
    },
    {
      kind: 'fact',
      id: 'c6',
      body: 'Every prayer has a time that begins and ends. That is why its time changes from one country to another and from one day to the next: it follows the sun\'s positions, not the clock. Dhuhr begins at the zawal.',
      term: { word: 'zawal', meaning: 'The sun moving past the middle of the sky toward the west; with it the time of Dhuhr begins' },
    },
    {
      kind: 'fact',
      id: 'c7',
      title: 'The Qiblah',
      body: `One of the conditions of prayer is to face the Qiblah, which is the Kaaba in Makkah, wherever you are: ${cite('q2_144')}`,
      term: { word: 'Qiblah', meaning: 'The direction a Muslim faces in prayer: the Kaaba' },
      art: { icon: 'Lantern' },
    },
  ],
  exercises: [
    {
      kind: 'order',
      id: 'e1',
      prompt: 'Put the five prayers in the order they come in the day',
      items: [
        { id: 'maghrib', label: 'Maghrib' },
        { id: 'fajr', label: 'Fajr' },
        { id: 'isha', label: 'Isha' },
        { id: 'dhuhr', label: 'Dhuhr' },
        { id: 'asr', label: 'Asr' },
      ],
      answer: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
      explain: 'Fajr before sunrise, then Dhuhr, then Asr, then Maghrib at sunset, then Isha.',
    },
    {
      kind: 'match',
      id: 'e2',
      prompt: 'Match each prayer with the start of its time',
      pairs: [
        { id: 'p1', left: 'Fajr', right: 'The true dawn' },
        { id: 'p2', left: 'Dhuhr', right: 'The zawal' },
        { id: 'p3', left: 'Maghrib', right: 'Sunset' },
        { id: 'p4', left: 'Isha', right: 'The red twilight disappears' },
      ],
    },
    {
      kind: 'boolean',
      id: 'e3',
      statement: 'Prayer times are fixed by the clock in every country in the world.',
      answer: false,
      explain: 'They follow the sun\'s positions, so they change with the place and the season.',
    },
    {
      kind: 'choice',
      id: 'e4',
      prompt: 'What is the time of Maghrib?',
      options: [
        { id: 'a', label: 'From sunset until midnight' },
        { id: 'b', label: 'From Asr until sunset' },
        { id: 'c', label: 'From sunset until the red twilight disappears' },
        { id: 'd', label: 'From sunset until dawn' },
      ],
      answerId: 'c',
      explain: `He ﷺ said: ${cite('h_maghrib')}`,
    },
    {
      kind: 'choice',
      id: 'e5',
      prompt: 'What does "a decree of specified times" mean in the verse?',
      options: [
        { id: 'a', label: 'Obligatory at set times' },
        { id: 'b', label: 'Written on a page' },
        { id: 'c', label: 'Temporary, ending after a while' },
        { id: 'd', label: 'Optional, whenever you like' },
      ],
      answerId: 'a',
    },
    {
      kind: 'boolean',
      id: 'e6',
      statement: 'The Kaaba is the Qiblah Muslims face in their prayer.',
      answer: true,
      explain: 'And facing it is one of the conditions of prayer.',
    },
  ],
  ask: [
    {
      q: 'How long does one prayer take?',
      a: 'No length is set for it: it depends on the worshipper\'s focus and how much Quran they recite. The number of units (rak\'ahs) is fixed, though: Fajr two, Dhuhr four, Asr four, Maghrib three, and Isha four.',
    },
    {
      q: 'What if I miss a prayer?',
      a: `You pray it as soon as you remember, and this is called making it up (qada). Forgetting, and sleep that overcomes you, are excused; that is sleep that takes a person even after they did what they could to wake up. The Prophet ﷺ said: ${cite('h_forgot')} What is asked of you is to pray it when you remember, not to leave it.`,
    },
    {
      q: 'How do I know the times in my city?',
      a: 'The times are known by their signs: Fajr by the true dawn, Dhuhr by the zawal, Asr when a thing\'s shadow equals its length, Maghrib by sunset, and Isha when the red twilight disappears. Because the calculation changes every day, trusted apps, such as the Umm al-Qura calendar in Saudi Arabia, help you know them precisely in your city.',
    },
  ],
}

const wudu: Lesson = {
  id: 'l-salah-2',
  title: 'Wudu',
  subtitle: 'Purity before prayer',
  icon: 'Droplet',
  xp: 20,
  cards: [
    {
      kind: 'fact',
      id: 'c1',
      title: 'Before you stand before Him',
      body: 'Before you learn the prayer, you learn what comes before it: wudu. It is purification with water and a condition for the prayer to be valid, so there is no prayer without purity.',
      art: { icon: 'Droplet' },
    },
    {
      kind: 'quote',
      id: 'c2',
      of: 'ayah',
      ...q('q5_6_wudu'),
      note: 'The verse names the obligatory parts in their order.',
    },
    {
      kind: 'quote',
      id: 'c3',
      of: 'hadith',
      ...q('h_wudu_forgiven'),
      note: 'The Prophet ﷺ said this after Uthman, may Allah be pleased with him, performed wudu in front of the people: he washed his hands three times, then rinsed his mouth and nose, then washed his face three times, then his right arm to the elbow three times and then the left, then wiped his head, then washed his right foot to the ankles three times and then the left.',
    },
    {
      kind: 'quote',
      id: 'c4',
      of: 'hadith',
      ...q('h_wudu_face'),
      note: 'Wudu purifies the body and wipes away sins.',
    },
    {
      kind: 'list',
      id: 'c5',
      title: 'How to make wudu',
      items: [
        { icon: 'Sparkle', label: 'Intention', note: 'In the heart: intending to make wudu' },
        { icon: 'Sparkle', label: 'Bismillah', note: 'Saying "Bismillah" (in the name of Allah) before you begin' },
        { icon: 'Droplet', label: 'Rinsing the mouth and nose', note: 'These are part of washing the face' },
        { icon: 'Droplet', label: 'Washing the face' },
        { icon: 'Droplet', label: 'Washing the arms to the elbows', note: 'The elbows are included in the washing' },
        { icon: 'Droplet', label: 'Wiping the head' },
        { icon: 'Droplet', label: 'Washing the feet to the ankles', note: 'The ankles are included in the washing, like the elbows' },
      ],
    },
    {
      kind: 'fact',
      id: 'c6',
      title: 'Right first',
      body: 'You begin with the right arm before the left and the right foot before the left, and you wash each foot up to the ankles, as the Prophet ﷺ did.',
      term: { word: 'ankles', meaning: 'The two bones that stick out on either side where the leg meets the foot' },
    },
    {
      kind: 'fact',
      id: 'c7',
      title: 'If there is no water: tayammum',
      body: `Whoever finds no water, or cannot use it because of illness, makes tayammum: you intend it, strike clean earth once with your palms, wipe your face with them, then wipe the backs and fronts of your hands. ${cite('q5_6_tayammum')}`,
      term: { word: 'tayammum', meaning: 'Wiping the face and hands with clean earth in place of water, when there is none or it cannot be used' },
    },
    {
      kind: 'fact',
      id: 'c8',
      body: 'Your wudu stays valid until something breaks it. When it is broken, you make wudu again before you pray.',
      term: { word: 'breaks', meaning: 'Something that cancels wudu and makes it necessary to redo it' },
    },
    {
      kind: 'list',
      id: 'c9',
      title: 'What breaks wudu',
      items: [
        { icon: 'Droplet', label: 'Anything leaving the two private passages', note: 'The front or the back, such as urine, stool or wind' },
        { icon: 'Droplet', label: 'Losing or clouding the mind', note: 'Through deep sleep, fainting and the like' },
        { icon: 'Droplet', label: 'Touching the private parts with the hand', note: 'Directly, with nothing in between' },
        { icon: 'Droplet', label: 'Eating camel meat' },
      ],
    },
  ],
  exercises: [
    {
      kind: 'order',
      id: 'e1',
      prompt: 'Put the obligatory parts of wudu in order',
      items: [
        { id: 'head', label: 'Wiping the head' },
        { id: 'feet', label: 'Washing the feet to the ankles' },
        { id: 'mouth', label: 'Rinsing the mouth and nose' },
        { id: 'face', label: 'Washing the face' },
        { id: 'arms', label: 'Washing the arms to the elbows' },
      ],
      answer: ['mouth', 'face', 'arms', 'head', 'feet'],
      explain: 'Rinsing the mouth and nose is part of washing the face, then the arms to the elbows, then wiping the head, then the feet to the ankles.',
    },
    {
      kind: 'sort',
      id: 'e2',
      prompt: 'Does this break wudu?',
      buckets: [
        { id: 'yes', label: 'Yes, it breaks it' },
        { id: 'no', label: 'No, it does not' },
      ],
      items: [
        { id: 'i1', label: 'Anything leaving the two passages', bucket: 'yes' },
        { id: 'i2', label: 'Drinking water', bucket: 'no' },
        { id: 'i3', label: 'Deep sleep', bucket: 'yes' },
        { id: 'i4', label: 'Reading the Quran', bucket: 'no' },
        { id: 'i5', label: 'Eating camel meat', bucket: 'yes' },
        { id: 'i6', label: 'Sweating', bucket: 'no' },
        { id: 'i7', label: 'Touching the private parts directly', bucket: 'yes' },
      ],
    },
    {
      kind: 'boolean',
      id: 'e3',
      statement: 'You must redo wudu for every prayer, even if it has not been broken.',
      answer: false,
      explain: 'It is not required while your wudu is still valid, but renewing it for each prayer is Sunnah.',
    },
    {
      kind: 'choice',
      id: 'e4',
      prompt: 'How far are the arms washed in wudu?',
      options: [
        { id: 'a', label: 'To the wrists' },
        { id: 'b', label: 'To the elbows' },
        { id: 'c', label: 'To the shoulders' },
        { id: 'd', label: 'The palms only' },
      ],
      answerId: 'b',
    },
    {
      kind: 'choice',
      id: 'e5',
      prompt: 'How far are the feet washed in wudu?',
      options: [
        { id: 'a', label: 'To the ankles, and the ankles are included' },
        { id: 'b', label: 'To the middle of the shin' },
        { id: 'c', label: 'The toes only' },
        { id: 'd', label: 'They are wiped, not washed' },
      ],
      answerId: 'a',
      explain: 'The ankles are the two bones that stick out where the leg meets the foot.',
    },
    {
      kind: 'match',
      id: 'e6',
      prompt: 'Match each part with what is done to it',
      pairs: [
        { id: 'p1', left: 'The head', right: 'Is wiped' },
        { id: 'p2', left: 'The face', right: 'Is washed' },
        { id: 'p3', left: 'The feet', right: 'Are washed to the ankles' },
      ],
    },
    {
      kind: 'choice',
      id: 'e7',
      prompt: 'How is tayammum done?',
      options: [
        { id: 'a', label: 'Striking the earth with the palms, then wiping the face and hands' },
        { id: 'b', label: 'Washing the face with water only' },
        { id: 'c', label: 'Wiping the head with earth' },
        { id: 'd', label: 'Washing the feet with earth' },
      ],
      answerId: 'a',
    },
  ],
  ask: [
    {
      q: 'What if I cannot find water?',
      a: 'You make tayammum: you intend it, strike clean earth once with your palms, wipe your face, then the backs and fronts of your hands. This is how the Prophet ﷺ taught it to Ammar ibn Yasir, may Allah be pleased with him (Sahih al-Bukhari and Sahih Muslim). It is for whoever has no water or cannot use it because of illness: an ease from Allah to make things easy for you.',
    },
    {
      q: 'Does the order matter?',
      a: 'The obligatory parts come in order in the verse, and most scholars hold that the order is required in wudu. So begin with the face, then the arms, then the head, then the feet.',
    },
    {
      q: 'How many times do I wash each part?',
      a: 'Once, covering the whole part, is what is required. Three times is the Sunnah: the Prophet ﷺ made wudu washing each part three times. Going beyond three is waste and is not recommended.',
    },
  ],
}

const howToPray: Lesson = {
  id: 'l-salah-3',
  title: 'How to Pray',
  subtitle: 'Movement by movement',
  icon: 'Sun',
  xp: 25,
  cards: [
    {
      kind: 'fact',
      id: 'c1',
      title: 'Let us pray together',
      body: 'You know wudu, and you know the prayer times. Now we learn the prayer itself: what you do and what you say, from its beginning to its end.',
      art: 'siraj-wave',
    },
    {
      kind: 'quote',
      id: 'c2',
      of: 'hadith',
      ...q('h_pray_as'),
      note: 'So we take the way of praying from what the Prophet ﷺ did, not from anyone\'s own opinion.',
    },
    {
      kind: 'fact',
      id: 'c3',
      title: 'The opening takbir',
      body: 'You stand facing the Qiblah, intend in your heart the prayer you want to pray, then raise your hands level with your shoulders and say: "Allahu akbar" (Allah is the Greatest). With it you enter your prayer.',
      term: { word: 'level with your shoulders', meaning: 'Across from your shoulders' },
      art: { pose: 'takbir' },
    },
    {
      kind: 'fact',
      id: 'c4',
      title: 'Standing and reciting',
      body: `You place your right hand over your left on your chest and look at the place where you will prostrate, then recite Al-Fatiha, then whatever you can of the Quran. He ﷺ said: ${cite('h_fatiha')}`,
      art: { pose: 'qiyam' },
    },
    {
      kind: 'fact',
      id: 'c5',
      title: 'Bowing (ruku)',
      body: 'You say "Allahu akbar" and bow, placing your hands on your knees with your back and head level, and say: "Subhana rabbiyal-azim" (Glory be to my Lord, the Most Great).',
      art: { pose: 'ruku' },
    },
    {
      kind: 'fact',
      id: 'c6',
      title: 'Rising from bowing',
      body: 'You raise your head saying "Sami\'a Allahu liman hamidah" (Allah hears whoever praises Him), and when you are standing straight you say "Rabbana wa lakal-hamd" (Our Lord, and to You belongs all praise).',
      art: { pose: 'itidal' },
    },
    {
      kind: 'fact',
      id: 'c7',
      title: 'Prostration (sujud)',
      body: 'You say "Allahu akbar" and prostrate, placing your forehead and nose, your palms, your knees and your toes on the ground, and say: "Subhana rabbiyal-a\'la" (Glory be to my Lord, the Most High).',
      art: { pose: 'sujud' },
    },
    {
      kind: 'quote',
      id: 'c8',
      of: 'hadith',
      ...q('h_sujud'),
      note: 'These are the seven parts of prostration.',
    },
    {
      kind: 'fact',
      id: 'c9',
      title: 'Sitting between the two prostrations',
      body: 'You say "Allahu akbar", raise your head and sit iftirash, with your hands on your thighs, and say "Rabbighfir li" (My Lord, forgive me). Then you prostrate a second time like the first, and with it the rak\'ah is complete.',
      term: { word: 'iftirash', meaning: 'Sitting on your left foot laid flat, with your right foot upright' },
      art: { pose: 'jalsa' },
    },
    {
      kind: 'fact',
      id: 'c10',
      title: 'The tashahhud',
      body: 'You stand for the second rak\'ah and do in it as you did in the first. After every two rak\'ahs you sit for the tashahhud, with your hands on your thighs, pointing with your right index finger.',
      art: { pose: 'tashahhud' },
    },
    {
      kind: 'quote',
      id: 'c11',
      of: 'hadith',
      ...q('h_tashahhud'),
      note: 'The Prophet ﷺ taught this tashahhud to Ibn Masud, may Allah be pleased with him. In the final tashahhud you add sending blessings on the Prophet ﷺ.',
    },
    {
      kind: 'fact',
      id: 'c12',
      title: 'The taslim',
      body: 'At the end of your prayer you turn to your right and say "As-salamu alaykum wa rahmatullah" (Peace be upon you and the mercy of Allah), then the same to your left. With this your prayer ends.',
      art: { pose: 'taslim' },
    },
  ],
  exercises: [
    {
      kind: 'order',
      id: 'e1',
      prompt: 'Put the movements of a rak\'ah in order',
      items: [
        { id: 'sujud', label: 'Prostration' },
        { id: 'takbir', label: 'The opening takbir' },
        { id: 'itidal', label: 'Rising from bowing' },
        { id: 'qiyam', label: 'Standing and reciting Al-Fatiha' },
        { id: 'jalsa', label: 'Sitting between the prostrations' },
        { id: 'ruku', label: 'Bowing' },
      ],
      answer: ['takbir', 'qiyam', 'ruku', 'itidal', 'sujud', 'jalsa'],
      explain: 'You say the takbir, recite, bow, rise, prostrate, sit, then prostrate a second time.',
    },
    {
      kind: 'match',
      id: 'e2',
      prompt: 'Match each movement with what you say in it',
      pairs: [
        { id: 'p1', left: 'Bowing', right: 'Subhana rabbiyal-azim' },
        { id: 'p2', left: 'Prostration', right: 'Subhana rabbiyal-a\'la' },
        { id: 'p3', left: 'Between the prostrations', right: 'Rabbighfir li' },
        { id: 'p4', left: 'After rising from bowing', right: 'Rabbana wa lakal-hamd' },
      ],
    },
    {
      kind: 'sort',
      id: 'e3',
      prompt: 'Do you say it standing, or sitting?',
      buckets: [
        { id: 'stand', label: 'Standing' },
        { id: 'sit', label: 'Sitting' },
      ],
      items: [
        { id: 'i1', label: 'Al-Fatiha', bucket: 'stand' },
        { id: 'i2', label: 'The tashahhud', bucket: 'sit' },
        { id: 'i3', label: 'Rabbana wa lakal-hamd', bucket: 'stand' },
        { id: 'i4', label: 'Rabbighfir li', bucket: 'sit' },
        { id: 'i5', label: 'The opening takbir', bucket: 'stand' },
        { id: 'i6', label: 'The taslim', bucket: 'sit' },
      ],
    },
    {
      kind: 'choice',
      id: 'e4',
      prompt: 'On how many parts of the body is prostration made?',
      options: [
        { id: 'a', label: 'Two: the forehead and the palms' },
        { id: 'b', label: 'Five' },
        { id: 'c', label: 'Seven' },
        { id: 'd', label: 'The forehead alone' },
      ],
      answerId: 'c',
      explain: 'The forehead with the nose, the two hands, the two knees, and the toes of both feet.',
    },
    {
      kind: 'boolean',
      id: 'e5',
      statement: 'The prayer is valid without reciting Al-Fatiha.',
      answer: false,
      explain: `He ﷺ said: ${cite('h_fatiha')}`,
    },
    {
      kind: 'choice',
      id: 'e6',
      prompt: 'How does the prayer end?',
      options: [
        { id: 'a', label: 'With the taslim, to the right and then the left' },
        { id: 'b', label: 'With the second prostration' },
        { id: 'c', label: 'By saying "Allahu akbar"' },
        { id: 'd', label: 'By standing up from sitting' },
      ],
      answerId: 'a',
    },
  ],
  ask: [
    {
      q: 'What do I say after the opening takbir?',
      a: `It is Sunnah to say an opening supplication quietly before Al-Fatiha, such as: ${cite('h_istiftah')} Then you recite Al-Fatiha.`,
    },
    {
      q: 'What if I have not memorised Al-Fatiha yet?',
      a: `Start memorising it, since it is the first thing you learn. Until you know it, say what the Prophet ﷺ taught a man who could not learn anything of the Quran: ${cite('h_tasbih')}`,
    },
    {
      q: 'What if I forget something in my prayer?',
      a: 'For this Allah legislated the prostration of forgetfulness (sujud as-sahw): two prostrations at the end of the prayer that make up for what was forgotten or doubted. The Prophet ﷺ made them when he forgot something in his own prayer (Sahih al-Bukhari and Sahih Muslim). As for the details of what they make up for and what they do not, ask the people of knowledge.',
    },
  ],
}

/* ---------------------------------------------------------------
   3 - Zakah
   --------------------------------------------------------------- */

const zakahMeaning: Lesson = {
  id: 'l-zakah-1',
  title: 'The Meaning of Zakah',
  subtitle: 'The third pillar',
  icon: 'Droplet',
  xp: 20,
  cards: [
    {
      kind: 'fact',
      id: 'c1',
      body: 'Zakah is the third pillar. In the Quran it very often comes together with prayer: prayer is Allah\'s right in your time, and zakah is the poor person\'s right in your wealth.',
      art: 'siraj',
    },
    {
      kind: 'quote',
      id: 'c2',
      of: 'ayah',
      ...q('q2_43'),
    },
    {
      kind: 'fact',
      id: 'c3',
      title: 'Purity and growth',
      body: 'In Arabic, zakah means purity and growth. As a term of the religion it is an obligatory due on particular wealth, for particular people, at a particular time. It purifies the giver from stinginess and brings blessing to their wealth.',
      term: { word: 'growth', meaning: 'Increase and blessing' },
    },
    {
      kind: 'quote',
      id: 'c4',
      of: 'hadith',
      ...q('h_sadaqah'),
      note: 'What you give does not make your wealth less; it adds blessing to it.',
    },
    {
      kind: 'fact',
      id: 'c5',
      title: 'An important difference',
      body: 'Zakah is an obligation with a set amount: a quarter of a tenth, that is 2.5% of money, gold and silver once it reaches the nisab. Sadaqah (charity) is voluntary and open: you give what you like, whenever you like.',
      art: { icon: 'Droplet' },
    },
  ],
  exercises: [
    {
      kind: 'choice',
      id: 'e1',
      prompt: 'What does the word "zakah" mean in Arabic?',
      options: [
        { id: 'a', label: 'Purity and growth' },
        { id: 'b', label: 'Patience and steadfastness' },
        { id: 'c', label: 'Travel and migration' },
        { id: 'd', label: 'Silence and reflection' },
      ],
      answerId: 'a',
      explain: 'Zakah purifies the soul and makes wealth grow with blessing.',
    },
    {
      kind: 'boolean',
      id: 'e2',
      statement: 'Zakah and sadaqah are exactly the same thing.',
      answer: false,
      explain: 'Zakah is an obligation with a set amount, and sadaqah is open and voluntary.',
    },
    {
      kind: 'sort',
      id: 'e3',
      prompt: 'Does this describe zakah, or sadaqah?',
      buckets: [
        { id: 'zakah', label: 'Zakah' },
        { id: 'sadaqah', label: 'Sadaqah' },
      ],
      items: [
        { id: 'i1', label: 'An obligation', bucket: 'zakah' },
        { id: 'i2', label: 'Voluntary, whenever you like', bucket: 'sadaqah' },
        { id: 'i3', label: 'A set amount: 2.5% of money', bucket: 'zakah' },
        { id: 'i4', label: 'You give as much as you like', bucket: 'sadaqah' },
      ],
    },
    {
      kind: 'boolean',
      id: 'e4',
      statement: 'Charity makes wealth smaller and takes away its blessing.',
      answer: false,
      explain: `The Prophet ﷺ said: ${cite('h_sadaqah')}`,
    },
    {
      kind: 'choice',
      id: 'e5',
      prompt: 'Which pillar is zakah often paired with in the Quran?',
      options: [
        { id: 'a', label: 'Hajj' },
        { id: 'b', label: 'Prayer' },
        { id: 'c', label: 'Fasting' },
        { id: 'd', label: 'It is not paired with anything' },
      ],
      answerId: 'b',
      explain: cite('q2_43_short'),
    },
  ],
  ask: [
    {
      q: 'Why did Allah make zakah obligatory?',
      a: `For many wise reasons: it purifies the rich person from stinginess, meets the need of the poor, and spreads love between people. Allah says: ${cite('q9_103')}`,
    },
    {
      q: 'Does every Muslim pay zakah?',
      a: 'No. Zakah is on whoever owns wealth that reaches a certain amount called the "nisab" and has held it for a full year. You will learn the nisab in the next lesson. Whoever\'s wealth does not reach it owes no zakah.',
    },
    {
      q: 'Can I give charity when I do not have much?',
      a: `Yes, sadaqah is an open door for everyone, in any amount. In the hadith: ${cite('h_half_date')} A little, given regularly, is a great good.`,
    },
  ],
}

const zakahNisab: Lesson = {
  id: 'l-zakah-2',
  title: 'The Nisab and Who Receives It',
  subtitle: 'How much, and to whom?',
  icon: 'Star',
  xp: 20,
  cards: [
    {
      kind: 'fact',
      id: 'c1',
      title: 'When is it due?',
      body: 'Zakah is due on wealth once it reaches the nisab and a full Hijri year has passed while it is in your ownership.',
      term: { word: 'nisab', meaning: 'The smallest amount of wealth on which zakah is due' },
      art: 'siraj',
    },
    {
      kind: 'fact',
      id: 'c2',
      title: 'The nisab',
      body: 'The nisab of gold is twenty mithqals, about 85 grams, and the nisab of silver is about 595 grams. Money is measured by the value of one of them, and which one to use is explained in detail by the people of knowledge. The full year that must pass is called the hawl.',
      term: { word: 'hawl', meaning: 'A full Hijri year passing over the wealth' },
    },
    {
      kind: 'fact',
      id: 'c3',
      title: 'How much do you give?',
      body: 'On money, gold and silver: a quarter of a tenth, that is 2.5%. From every thousand you give twenty-five. Gold jewellery a woman wears for use has no zakah on it, according to most of the people of knowledge.',
      art: { icon: 'Star' },
    },
    {
      kind: 'quote',
      id: 'c4',
      of: 'ayah',
      ...q('q9_60'),
      note: 'Eight groups that Allah Himself named.',
    },
    {
      kind: 'list',
      id: 'c5',
      title: 'Some of the eight groups',
      items: [
        { icon: 'Droplet', label: 'The poor and the needy', note: 'Those who do not have enough' },
        { icon: 'Droplet', label: 'Those in debt', note: 'Those weighed down by debts' },
        { icon: 'Droplet', label: 'The stranded traveller', note: 'A traveller cut off on the road' },
        { icon: 'Droplet', label: 'Those who work on it', note: 'Those who collect and distribute it' },
      ],
    },
  ],
  exercises: [
    {
      kind: 'choice',
      id: 'e1',
      prompt: 'How much is the zakah on money?',
      options: [
        { id: 'a', label: '10%' },
        { id: 'b', label: '5%' },
        { id: 'c', label: '2.5%' },
        { id: 'd', label: '20%' },
      ],
      answerId: 'c',
      explain: 'A quarter of a tenth, that is 2.5%.',
    },
    {
      kind: 'match',
      id: 'e2',
      prompt: 'Match each word with its meaning',
      pairs: [
        { id: 'p1', left: 'Nisab', right: 'The least amount zakah is due on' },
        { id: 'p2', left: 'Hawl', right: 'A Hijri year passing' },
        { id: 'p3', left: 'Stranded traveller', right: 'A traveller cut off on the road' },
        { id: 'p4', left: 'Debtor', right: 'Someone weighed down by debt' },
      ],
    },
    {
      kind: 'boolean',
      id: 'e3',
      statement: 'Zakah is due on any wealth, however small.',
      answer: false,
      explain: 'It is not due until the wealth reaches the nisab and the hawl has passed over it.',
    },
    {
      kind: 'boolean',
      id: 'e6',
      statement: 'Gold jewellery a woman wears for use has no zakah on it, according to most of the people of knowledge.',
      answer: true,
    },
    {
      kind: 'choice',
      id: 'e4',
      prompt: 'How many groups of zakah recipients are in the verse?',
      options: [
        { id: 'a', label: 'Five' },
        { id: 'b', label: 'Six' },
        { id: 'c', label: 'Eight' },
        { id: 'd', label: 'Ten' },
      ],
      answerId: 'c',
    },
    {
      kind: 'sort',
      id: 'e5',
      prompt: 'Is this person entitled to zakah?',
      buckets: [
        { id: 'yes', label: 'Yes, entitled' },
        { id: 'no', label: 'Not entitled' },
      ],
      items: [
        { id: 'i1', label: 'A poor person without enough', bucket: 'yes' },
        { id: 'i2', label: 'A rich person who has enough', bucket: 'no' },
        { id: 'i3', label: 'A debtor weighed down by debt', bucket: 'yes' },
        { id: 'i4', label: 'A traveller cut off on the road', bucket: 'yes' },
      ],
    },
  ],
  ask: [
    {
      q: 'How do I work out my zakah?',
      a: 'Add up the money you have saved that has been with you for a year. If it reaches the nisab, give 2.5% of it. For example: whoever saved 40,000 riyals gives 1,000 riyals. In Saudi Arabia, the zakah calculator on the Ehsan platform helps you work it out exactly, and if anything is unclear, ask the people of knowledge.',
    },
    {
      q: 'Is there zakah on my house and car?',
      a: `No. A house you live in and a car you drive for your own use have no zakah on them. The Prophet ﷺ said: ${cite('h_no_zakah_horse')} Zakah is on wealth that is saved and grows.`,
    },
    {
      q: 'Can I give zakah to my father or my son?',
      a: 'Zakah is not given to those you are already obliged to provide for, such as your parents and children, because providing for them is already your duty. You may give it to other relatives in need, and there is the reward of charity and of keeping family ties in it.',
    },
  ],
}

/* ---------------------------------------------------------------
   4 - Fasting
   --------------------------------------------------------------- */

const ramadan: Lesson = {
  id: 'l-sawm-1',
  title: 'Fasting Ramadan',
  subtitle: 'The fourth pillar',
  icon: 'Crescent',
  xp: 20,
  cards: [
    {
      kind: 'fact',
      id: 'c1',
      body: 'Fasting is the fourth pillar. In Arabic it means holding back. As a term of the religion it means worshipping Allah by holding back from food, drink and everything else that breaks the fast, from dawn until sunset.',
      term: { word: 'breaks the fast', meaning: 'What spoils the fast, like eating and drinking. You will learn them in the next lesson' },
      art: 'siraj-wave',
    },
    {
      kind: 'list',
      id: 'c2',
      title: 'Two kinds of fasting',
      items: [
        { icon: 'Crescent', label: 'Obligatory', note: 'Fasting the month of Ramadan, which is the pillar' },
        { icon: 'Sparkle', label: 'Sunnah and voluntary', note: 'Such as fasting Mondays and Thursdays, and the day of Arafah for those not on Hajj' },
      ],
    },
    {
      kind: 'quote',
      id: 'c3',
      of: 'ayah',
      ...q('q2_183'),
      note: 'The goal of fasting: taqwa, being mindful of Allah.',
    },
    {
      kind: 'fact',
      id: 'c4',
      title: 'The month of the Quran',
      body: 'Ramadan is the ninth month of the Hijri calendar, and the Quran was sent down in it. It begins with the sighting of its crescent moon, which is why it comes about eleven days earlier every year.',
      term: { word: 'crescent', meaning: 'The moon on the first night of the month, a thin bow of light' },
      art: { icon: 'Crescent' },
    },
    {
      kind: 'quote',
      id: 'c5',
      of: 'hadith',
      ...q('h_ramadan'),
      note: '"Hoping to attain Allah\'s rewards": seeking the reward from Allah.',
    },
    {
      kind: 'fact',
      id: 'c6',
      title: 'Who must fast?',
      body: 'Fasting Ramadan is required of every Muslim who has reached puberty, is of sound mind, is able, and is not travelling. Whoever permanently cannot fast, because of old age or an illness not expected to heal, feeds a poor person for each day instead. A woman on her period or in post-natal bleeding does not fast, and makes the days up later.',
    },
    {
      kind: 'fact',
      id: 'c7',
      title: 'Ease, not hardship',
      body: `The sick and the traveller may break the fast and make up the days after Ramadan: ${cite('q2_184')} Making up the days is called qada.`,
      term: { word: 'qada', meaning: 'Fasting the days you missed for a valid reason, after Ramadan is over' },
    },
  ],
  exercises: [
    {
      kind: 'choice',
      id: 'e1',
      prompt: 'From when until when is the fast?',
      options: [
        { id: 'a', label: 'From sunrise until midday' },
        { id: 'b', label: 'From the Fajr adhan until the Maghrib adhan' },
        { id: 'c', label: 'From Dhuhr until Isha' },
        { id: 'd', label: 'A whole day and night' },
      ],
      answerId: 'b',
      explain: 'From the true dawn, known by the Fajr adhan, until sunset, known by the Maghrib adhan.',
    },
    {
      kind: 'match',
      id: 'e2',
      prompt: 'Match',
      pairs: [
        { id: 'p1', left: 'Fasting in Arabic', right: 'Holding back' },
        { id: 'p2', left: 'Fasting Ramadan', right: 'Obligatory' },
        { id: 'p3', left: 'Fasting Mondays and Thursdays', right: 'Sunnah and voluntary' },
        { id: 'p4', left: 'Qada', right: 'Fasting days missed for a reason' },
      ],
    },
    {
      kind: 'choice',
      id: 'e3',
      prompt: 'What is the goal of fasting, as the verse says?',
      options: [
        { id: 'a', label: 'Taqwa, being mindful of Allah' },
        { id: 'b', label: 'Losing weight' },
        { id: 'c', label: 'Saving food' },
        { id: 'd', label: 'Resting from work' },
      ],
      answerId: 'a',
      explain: cite('q2_183_end'),
    },
    {
      kind: 'boolean',
      id: 'e4',
      statement: 'Ramadan falls on the same Gregorian date every year.',
      answer: false,
      explain: 'It is a Hijri month that begins with the sighting of the crescent, so it comes about eleven days earlier every year.',
    },
    {
      kind: 'sort',
      id: 'e5',
      prompt: 'Must this person fast Ramadan?',
      buckets: [
        { id: 'yes', label: 'Yes, they must' },
        { id: 'no', label: 'No: they make it up, or feed the poor' },
      ],
      items: [
        { id: 'i1', label: 'A healthy adult Muslim at home', bucket: 'yes' },
        { id: 'i2', label: 'A traveller', bucket: 'no' },
        { id: 'i3', label: 'A sick person for whom fasting is hard', bucket: 'no' },
        { id: 'i4', label: 'An elderly person unable to fast', bucket: 'no' },
      ],
    },
  ],
  ask: [
    {
      q: 'Do children fast?',
      a: `Fasting is not required of a child until puberty, but it is good to get them used to it if they can manage. Ar-Rubayyi bint Muawwidh, may Allah be pleased with her, said about fasting the day of Ashura: ${cite('h_rubayyi')}`,
    },
    {
      q: 'What if I eat by mistake while fasting?',
      a: `Your fast is valid, so complete it. The Prophet ﷺ said: ${cite('h_forget_fast')}`,
    },
    {
      q: 'Why do we fast and go hungry?',
      a: `Hunger is not the goal. Among the wisdoms of fasting: first, it is a means to taqwa, being mindful of Allah, as in the verse: ${cite('q2_183_end')} Second, it makes the one fasting feel Allah's blessings when they hold back from them for hours, so they thank Him for them and feel mercy for those who do not have them.`,
    },
  ],
}

const suhoorIftar: Lesson = {
  id: 'l-sawm-2',
  title: 'Suhoor and Iftar',
  subtitle: 'A day of fasting',
  icon: 'Flame',
  xp: 20,
  cards: [
    {
      kind: 'fact',
      id: 'c1',
      title: 'A day with a beginning and an end',
      body: 'The fasting day begins with a meal before dawn called suhoor, a Sunnah of the Prophet ﷺ, and ends with iftar at the Maghrib adhan.',
      art: 'siraj',
    },
    {
      kind: 'quote',
      id: 'c2',
      of: 'hadith',
      ...q('h_suhoor'),
    },
    {
      kind: 'quote',
      id: 'c3',
      of: 'ayah',
      ...q('q2_187'),
      note: 'The white thread is the whiteness of morning: the light of the true dawn that appears across the horizon against the darkness of night. The black thread is the darkness of night.',
    },
    {
      kind: 'fact',
      id: 'c4',
      title: 'Do not delay iftar',
      body: `The Sunnah is to have iftar as soon as the Maghrib adhan is called, and to delay suhoor until just before dawn. He ﷺ said: ${cite('h_iftar')}`,
      term: { word: 'iftar', meaning: 'The first thing someone fasting eats at the Maghrib adhan' },
      art: { icon: 'Flame' },
    },
    {
      kind: 'list',
      id: 'c5',
      title: 'Some things that break the fast',
      items: [
        { icon: 'Droplet', label: 'Eating and drinking on purpose' },
        { icon: 'Droplet', label: 'What takes the place of food and drink', note: 'Such as intravenous feeding and nutritional injections' },
        { icon: 'Droplet', label: 'Intercourse during the day in Ramadan' },
        { icon: 'Droplet', label: 'Vomiting on purpose' },
        { icon: 'Droplet', label: 'The start of menstrual or post-natal bleeding' },
      ],
    },
  ],
  exercises: [
    {
      kind: 'order',
      id: 'e1',
      prompt: 'Put a fasting day in order',
      items: [
        { id: 'iftar', label: 'Iftar at the Maghrib adhan' },
        { id: 'suhoor', label: 'Suhoor' },
        { id: 'fast', label: 'Holding back all day' },
        { id: 'fajr', label: 'The Fajr adhan' },
      ],
      answer: ['suhoor', 'fajr', 'fast', 'iftar'],
      explain: 'You eat suhoor, then the Fajr adhan is called and you stop, you fast through the day, then you break your fast at the Maghrib adhan.',
    },
    {
      kind: 'sort',
      id: 'e2',
      prompt: 'Does this break the fast?',
      buckets: [
        { id: 'yes', label: 'Yes, it breaks it' },
        { id: 'no', label: 'No, it does not' },
      ],
      items: [
        { id: 'i1', label: 'Eating on purpose', bucket: 'yes' },
        { id: 'i2', label: 'Eating by mistake', bucket: 'no' },
        { id: 'i3', label: 'Drinking on purpose', bucket: 'yes' },
        { id: 'i4', label: 'Taking a bath', bucket: 'no' },
        { id: 'i5', label: 'Vomiting on purpose', bucket: 'yes' },
        { id: 'i6', label: 'Sleeping', bucket: 'no' },
        { id: 'i7', label: 'Intravenous feeding', bucket: 'yes' },
      ],
    },
    {
      kind: 'choice',
      id: 'e3',
      prompt: 'What is meant by "the white thread" in the verse?',
      options: [
        { id: 'a', label: 'The whiteness of morning: the light of the true dawn' },
        { id: 'b', label: 'A thread of cloth' },
        { id: 'c', label: 'Moonlight' },
        { id: 'd', label: 'Sunset' },
      ],
      answerId: 'a',
      explain: 'The whiteness of morning, the light of the true dawn that appears across the horizon against the darkness of night.',
    },
    {
      kind: 'boolean',
      id: 'e4',
      statement: 'The Sunnah is to delay iftar until after Isha.',
      answer: false,
      explain: 'The Sunnah is to hurry to break the fast as soon as the Maghrib adhan is called.',
    },
    {
      kind: 'choice',
      id: 'e5',
      prompt: 'What did the Prophet ﷺ say about suhoor?',
      options: [
        { id: 'a', label: 'That it is disliked' },
        { id: 'b', label: 'That there is blessing in it' },
        { id: 'c', label: 'That it is only for travellers' },
        { id: 'd', label: 'That it spoils the fast' },
      ],
      answerId: 'b',
    },
  ],
  ask: [
    {
      q: 'What should I break my fast with?',
      a: 'The Sunnah is to break your fast with fresh dates, and if there are none then dried dates, and if there are none then a few sips of water. This is what the Prophet ﷺ did (Sunan Abi Dawud and Jami at-Tirmidhi). Then eat what you like, in moderation.',
    },
    {
      q: 'What if I miss suhoor?',
      a: 'Your fast is valid, because suhoor is a Sunnah and not a condition. Intend to fast and complete your day; you have only missed its blessing, so make sure to have it tomorrow.',
    },
    {
      q: 'Does worship end when Ramadan ends?',
      a: 'No. Ramadan closes with zakat al-fitr, which is obligatory; the Messenger of Allah ﷺ made it a duty (Sahih al-Bukhari and Sahih Muslim). It is a sa\' of food a Muslim gives for themselves and for those they provide for, such as a wife and children, and it is given to the poor before the Eid prayer. Then comes Eid al-Fitr, a joy at completing the fast, and your bond with Allah continues all year.',
    },
  ],
}

/* ---------------------------------------------------------------
   5 - Hajj
   --------------------------------------------------------------- */

const meccaKaaba: Lesson = {
  id: 'l-hajj-1',
  title: 'Makkah and the Kaaba',
  subtitle: 'The fifth pillar',
  icon: 'Lantern',
  xp: 25,
  cards: [
    {
      kind: 'fact',
      id: 'c1',
      body: 'Hajj is the fifth pillar. In Arabic it means setting out for a place. As a term of the religion it means travelling to the sacred sites to perform the rites, at a particular place and time, in worship of Allah.',
      term: { word: 'rites', meaning: 'The acts of worship of Hajj, such as ihram, tawaf, sa\'i and standing at Arafah' },
      art: 'siraj-wave',
    },
    {
      kind: 'quote',
      id: 'c2',
      of: 'ayah',
      ...q('q3_97'),
      note: 'It is required once in a lifetime of whoever is able.',
    },
    {
      kind: 'fact',
      id: 'c3',
      title: 'The first House',
      body: 'The Kaaba is the first house set up on earth for the worship of Allah. Ibrahim (Abraham) and his son Ismail (Ishmael), peace be upon them, raised its foundations. It is the Qiblah Muslims face in their prayer.',
      term: { word: 'Qiblah', meaning: 'The direction a Muslim faces in prayer: the Kaaba' },
      art: { icon: 'Lantern' },
    },
    {
      kind: 'quote',
      id: 'c4',
      of: 'ayah',
      ...q('q2_127'),
    },
    {
      kind: 'fact',
      id: 'c5',
      title: 'When is Hajj?',
      body: 'Hajj has one time in the year, in the month of Dhul-Hijjah, when pilgrims gather from every country in the world.',
      term: { word: 'Dhul-Hijjah', meaning: 'The twelfth and last month of the Hijri calendar' },
    },
  ],
  exercises: [
    {
      kind: 'choice',
      id: 'e1',
      prompt: 'How many times in a lifetime is Hajj required?',
      options: [
        { id: 'a', label: 'Every year' },
        { id: 'b', label: 'Once in a lifetime, for whoever is able' },
        { id: 'c', label: 'Three times' },
        { id: 'd', label: 'Never' },
      ],
      answerId: 'b',
    },
    {
      kind: 'choice',
      id: 'e2',
      prompt: 'Who raised the foundations of the Kaaba?',
      options: [
        { id: 'a', label: 'Musa and Harun (Moses and Aaron), peace be upon them' },
        { id: 'b', label: 'Nuh (Noah), peace be upon him' },
        { id: 'c', label: 'Ibrahim and Ismail (Abraham and Ishmael), peace be upon them' },
        { id: 'd', label: 'Dawud and Sulayman (David and Solomon), peace be upon them' },
      ],
      answerId: 'c',
      explain: cite('q2_127_short'),
    },
    {
      kind: 'boolean',
      id: 'e3',
      statement: 'Hajj can be performed in any month of the year.',
      answer: false,
      explain: 'Hajj has one time in the year, in the month of Dhul-Hijjah.',
    },
    {
      kind: 'choice',
      id: 'e4',
      prompt: 'What does "Hajj" mean in Arabic?',
      options: [
        { id: 'a', label: 'Setting out for a place' },
        { id: 'b', label: 'A long journey' },
        { id: 'c', label: 'Gathering' },
        { id: 'd', label: 'Patience' },
      ],
      answerId: 'a',
    },
    {
      kind: 'match',
      id: 'e5',
      prompt: 'Match',
      pairs: [
        { id: 'p1', left: 'The Kaaba', right: 'The first house for worshipping Allah' },
        { id: 'p2', left: 'Dhul-Hijjah', right: 'The month of Hajj' },
        { id: 'p3', left: 'The Qiblah', right: 'The direction of prayer' },
        { id: 'p4', left: 'Makkah', right: 'The city of the Sacred House' },
      ],
    },
  ],
  ask: [
    {
      q: 'What does being "able" mean?',
      a: 'That you are healthy in body, own the cost of the journey and your stay beyond what you and those you provide for need, and that the road is safe. Whoever is not able carries no sin, and Allah does not burden a soul beyond what it can bear.',
    },
    {
      q: 'Do we worship the Kaaba?',
      a: 'No, we worship Allah alone. The Kaaba is a house that Allah commanded us to face in prayer and to walk around, in obedience to His command.',
    },
    {
      q: 'What is the reward of Hajj?',
      a: `The Prophet ﷺ said: ${cite('h_hajj_reborn')} So whoever guards their Hajj from both comes back clean of their sins, like a newborn.`,
    },
  ],
}

const hajjRites: Lesson = {
  id: 'l-hajj-2',
  title: 'Ihram and Tawaf',
  subtitle: 'The pilgrim\'s journey',
  icon: 'Sparkle',
  xp: 25,
  cards: [
    {
      kind: 'fact',
      id: 'c1',
      title: 'Ihram',
      body: 'Hajj begins with ihram: the intention to enter the rites. A man wears two white sheets, one around the waist and one over the shoulders, and a woman wears her usual modest clothes.',
      term: { word: 'ihram', meaning: 'The intention to enter Hajj; with it the rites begin' },
      art: 'siraj',
    },
    {
      kind: 'quote',
      id: 'c2',
      of: 'hadith',
      ...q('h_talbiyah'),
      note: 'This is the "talbiyah", which the pilgrim repeats after entering ihram.',
    },
    {
      kind: 'fact',
      id: 'c3',
      title: 'Tawaf and sa\'i',
      body: 'Tawaf is walking around the Kaaba seven times, starting and ending at the Black Stone, with the Kaaba on your left. Sa\'i is seven laps between Safa and Marwah, starting at Safa and ending at Marwah. Going from Safa to Marwah is one lap, and coming back from Marwah to Safa is another.',
      art: { icon: 'Sparkle' },
    },
    {
      kind: 'list',
      id: 'c3b',
      title: 'Some Sunnahs of tawaf and sa\'i',
      items: [
        { icon: 'Sparkle', label: 'Raml', note: 'Walking briskly with short steps in the first three circuits of the arrival tawaf, for men' },
        { icon: 'Sparkle', label: 'Idtiba', note: 'Uncovering the right shoulder during that tawaf, for men' },
        { icon: 'Sparkle', label: 'Running in sa\'i', note: 'Going quickly between the two green markers in the sa\'i area, for men' },
        { icon: 'Sparkle', label: 'Touching the Black Stone', note: 'And kissing it if you can; otherwise you point to it' },
      ],
    },
  ],
  exercises: [
    {
      kind: 'match',
      id: 'e2',
      prompt: 'Match each rite with its description',
      pairs: [
        { id: 'p1', left: 'Tawaf', right: 'Seven circuits around the Kaaba' },
        { id: 'p2', left: 'Sa\'i', right: 'Between Safa and Marwah' },
        { id: 'p3', left: 'Talbiyah', right: 'Labbayk Allahumma labbayk' },
        { id: 'p4', left: 'Ihram', right: 'The intention to enter the rites' },
      ],
    },
    {
      kind: 'boolean',
      id: 'e4',
      statement: 'The pilgrim walks around the Kaaba seven times.',
      answer: true,
    },
    {
      kind: 'choice',
      id: 'e6',
      prompt: 'How is a lap of sa\'i counted?',
      options: [
        { id: 'a', label: 'Safa to Marwah is one lap, and back to Safa is another' },
        { id: 'b', label: 'To Marwah and back to Safa is one lap' },
        { id: 'c', label: 'It starts at Marwah and ends at Safa' },
        { id: 'd', label: 'A full circuit around the Kaaba' },
      ],
      answerId: 'a',
      explain: 'It starts at Safa and ends at Marwah, so the seventh lap ends at Marwah.',
    },
    {
      kind: 'match',
      id: 'e7',
      prompt: 'Match each Sunnah with its description',
      pairs: [
        { id: 'p1', left: 'Raml', right: 'Walking briskly with short steps' },
        { id: 'p2', left: 'Idtiba', right: 'Uncovering the right shoulder' },
        { id: 'p3', left: 'Running', right: 'Between the two green markers' },
      ],
    },
  ],
  ask: [
    {
      q: 'Why do pilgrims wear the same clothes?',
      a: 'The clothes of ihram melt away the differences: rich and poor, king and worker, all in two white sheets standing before Allah as equals. They are also a reminder of the burial shroud and of standing on the Day of Gathering.',
    },
    {
      q: 'What does "Labbayk" mean?',
      a: 'It means: I answer You, my Lord, again and again, and I remain in obedience to You. With it the pilgrim declares that he has come answering Allah\'s call, Who has no partner.',
    },
    {
      q: 'What are Safa and Marwah?',
      a: `Two small hills near the Kaaba. Hajar, the mother of Ismail, peace be upon him, went back and forth between them looking for water for her son (Sahih al-Bukhari), and Allah made walking between them one of the rites of Hajj: ${cite('q2_158')}`,
    },
  ],
}

const hajjDays: Lesson = {
  id: 'l-hajj-3',
  title: 'The Days of Hajj',
  subtitle: 'Day by day',
  icon: 'Star',
  xp: 25,
  cards: [
    {
      kind: 'fact',
      id: 'c1',
      title: 'Hajj is a journey of days',
      body: 'Hajj is not a single day. It is a journey that begins on the eighth of Dhul-Hijjah, and each day has its own deeds. Let us walk with the pilgrim, day by day.',
      art: 'siraj',
    },
    {
      kind: 'list',
      id: 'c2',
      title: 'The eighth and ninth days',
      items: [
        { icon: 'Sun', label: 'The 8th: the Day of Tarwiyah', note: 'The pilgrim goes to Mina in ihram, prays the prayers there, and spends the night' },
        { icon: 'Star', label: 'The 9th: the Day of Arafah', note: 'He goes to Arafah and calls on Allah and remembers Him until the sun sets' },
        { icon: 'Crescent', label: 'The night of the 10th: Muzdalifah', note: 'After sunset he comes down to Muzdalifah, prays Maghrib and Isha, and spends the night there' },
      ],
    },
    {
      kind: 'quote',
      id: 'c3',
      of: 'hadith',
      ...q('h_arafah'),
      note: 'That is, standing at Arafah is the greatest pillar of Hajj. Whoever misses standing at Arafah has missed the Hajj.',
    },
    {
      kind: 'fact',
      id: 'c4',
      title: 'What are the Jamarat?',
      body: 'In Mina there are three places called the Jamarat. The pilgrim throws small pebbles at them, seven at each one, and says with every pebble: "Allahu akbar".',
      term: { word: 'Jamarat', meaning: 'Three places in Mina: the small, the middle, and the large one, which is Jamrat al-Aqabah' },
    },
    {
      kind: 'list',
      id: 'c5',
      title: 'The day of Eid and after',
      items: [
        { icon: 'Flame', label: 'The 10th: the Day of Sacrifice', note: 'He stones Jamrat al-Aqabah, sacrifices his animal, shaves or shortens his hair, then does tawaf of the Kaaba. It is the day of Eid al-Adha' },
        { icon: 'Sun', label: 'The Days of Tashriq', note: 'The 11th, 12th and 13th: he stays in Mina and stones all three Jamarat each day after the zawal' },
        { icon: 'Sparkle', label: 'The farewell tawaf', note: 'The last thing the pilgrim does before leaving Makkah: a tawaf of the Kaaba to say farewell' },
      ],
    },
    {
      kind: 'quote',
      id: 'c6',
      of: 'ayah',
      ...q('q2_203'),
      note: 'So whoever wishes leaves Mina on the 12th, and whoever wishes stays until the 13th.',
    },
  ],
  exercises: [
    {
      kind: 'order',
      id: 'e1',
      prompt: 'Put the pilgrim\'s journey in order',
      items: [
        { id: 'arafah', label: 'Standing at Arafah' },
        { id: 'farewell', label: 'The farewell tawaf' },
        { id: 'mina', label: 'Mina on the Day of Tarwiyah' },
        { id: 'jamrah', label: 'Stoning Jamrat al-Aqabah' },
        { id: 'muzdalifah', label: 'The night at Muzdalifah' },
        { id: 'tashreeq', label: 'The Days of Tashriq' },
      ],
      answer: ['mina', 'arafah', 'muzdalifah', 'jamrah', 'tashreeq', 'farewell'],
      explain: 'Mina on the 8th, Arafah on the 9th, Muzdalifah by night, the stoning on the day of Eid, then the Days of Tashriq, and last of all the farewell tawaf.',
    },
    {
      kind: 'match',
      id: 'e2',
      prompt: 'Match each day with its place',
      pairs: [
        { id: 'p1', left: 'The 8th day', right: 'Mina' },
        { id: 'p2', left: 'The 9th day', right: 'Arafah' },
        { id: 'p3', left: 'The night of the 10th', right: 'Muzdalifah' },
        { id: 'p4', left: 'Before leaving', right: 'The farewell tawaf' },
      ],
    },
    {
      kind: 'choice',
      id: 'e3',
      prompt: 'What is the greatest pillar of Hajj?',
      options: [
        { id: 'a', label: 'Staying the night in Mina' },
        { id: 'b', label: 'Standing at Arafah' },
        { id: 'c', label: 'Stoning the Jamarat' },
        { id: 'd', label: 'Wearing ihram clothes' },
      ],
      answerId: 'b',
      explain: `The Prophet ﷺ said: ${cite('h_arafah')}`,
    },
    {
      kind: 'choice',
      id: 'e4',
      prompt: 'Which day is Eid al-Adha?',
      options: [
        { id: 'a', label: 'The 8th of Dhul-Hijjah' },
        { id: 'b', label: 'The 9th of Dhul-Hijjah' },
        { id: 'c', label: 'The 10th of Dhul-Hijjah' },
        { id: 'd', label: 'The 1st of Ramadan' },
      ],
      answerId: 'c',
    },
    {
      kind: 'choice',
      id: 'e5',
      prompt: 'How many pebbles does the pilgrim throw at each Jamrah?',
      options: [
        { id: 'a', label: 'Three pebbles' },
        { id: 'b', label: 'Seven pebbles' },
        { id: 'c', label: 'Ten pebbles' },
        { id: 'd', label: 'One pebble' },
      ],
      answerId: 'b',
      explain: 'And with every pebble he says: "Allahu akbar".',
    },
    {
      kind: 'boolean',
      id: 'e6',
      statement: 'Whoever leaves Mina on the 12th day carries no sin.',
      answer: true,
      explain: cite('q2_203_short'),
    },
  ],
  ask: [
    {
      q: 'Why does the pilgrim stone the Jamarat?',
      a: `To follow the Prophet ﷺ, who stoned on the Day of Sacrifice and said: ${cite('h_rites')} The pilgrim says "Allahu akbar" with every pebble, so it is worship and remembrance of Allah.`,
    },
    {
      q: 'What are the Days of Tashriq?',
      a: `They are the 11th, 12th and 13th of Dhul-Hijjah. He ﷺ said: ${cite('h_tashriq')} In them the pilgrim stays in Mina and stones the Jamarat.`,
    },
    {
      q: 'And what does someone not on Hajj do at Eid al-Adha?',
      a: `They pray the Eid prayer, and it is recommended for them to offer a sacrifice if they can. Fasting the day of Arafah is Sunnah for those not on Hajj; about it the Prophet ﷺ said: ${cite('h_arafah_fast')}`,
    },
  ],
}

export const LESSONS_EN: Record<string, Lesson> = {
  [whatIsIslam.id]: whatIsIslam,
  [fivePillars.id]: fivePillars,
  [pillarsOfIman.id]: pillarsOfIman,
  [shahadaMeaning.id]: shahadaMeaning,
  [prophetMuhammad.id]: prophetMuhammad,
  [fivePrayers.id]: fivePrayers,
  [wudu.id]: wudu,
  [howToPray.id]: howToPray,
  [zakahMeaning.id]: zakahMeaning,
  [zakahNisab.id]: zakahNisab,
  [ramadan.id]: ramadan,
  [suhoorIftar.id]: suhoorIftar,
  [meccaKaaba.id]: meccaKaaba,
  [hajjRites.id]: hajjRites,
  [hajjDays.id]: hajjDays,
}
