#!/usr/bin/env node
/* ============================================================
   English Quran and hadith text, fetched, never written by hand.

     node scripts/fetch-quotes.mjs

   Every English ayah comes from quran.com (Saheeh International,
   its default English translation, via api.quran.com). Every
   English hadith comes from its sunnah.com page. Each entry below
   names the reference and the first and last words of the part the
   Arabic card quotes; the script cuts that part out and writes
   src/core/content/quotes.en.ts, which lessons.en.ts reads.

   The only changes made to the source text:
   - quran.com footnote markers are removed
   - transliteration marks are folded to plain letters (Allāh ->
     Allah), because the brand fonts carry no glyphs for them
   - an excerpt that starts or stops mid-sentence gets an ellipsis
   - `edit` below, where named, for a typo or a join; each one says why

   sunnah.com refuses plain HTTP clients, so the hadith pages are
   read with headless Chrome (puppeteer-core, already a dev dependency).
   ============================================================ */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(HERE, '../src/core/content/quotes.en.ts')
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
/** Saheeh International on api.quran.com */
const TRANSLATION = 20

/* ---------------- the Quran ---------------- */

const QURAN = [
  { id: 'q3_19', key: '3:19', from: 'Indeed, the religion', to: 'is Islam.' },
  { id: 'q2_163', key: '2:163' },
  { id: 'q21_107', key: '21:107' },
  { id: 'q4_103', key: '4:103', from: 'Indeed, prayer', to: 'specified times.' },
  { id: 'q5_6_wudu', key: '5:6', from: 'O you who have believed', to: 'to the ankles.' },
  { id: 'q5_6_tayammum', key: '5:6', from: 'and do not find water', to: 'hands with it.' },
  { id: 'q2_43', key: '2:43' },
  { id: 'q2_43_short', key: '2:43', from: 'And establish prayer', to: 'give zakah' },
  { id: 'q9_60', key: '9:60', from: 'Zakah expenditures', to: '[stranded] traveler' },
  { id: 'q9_103', key: '9:103', from: 'Take, [O Muhammad]', to: 'cause them increase' },
  { id: 'q2_183', key: '2:183' },
  { id: 'q2_183_end', key: '2:183', from: 'that you may become righteous', to: 'become righteous' },
  { id: 'q2_184', key: '2:184', from: 'So whoever among you', to: '[are to be made up].' },
  { id: 'q2_187', key: '2:187', from: 'And eat and drink', to: 'until the night [i.e., sunset].' },
  { id: 'q3_97', key: '3:97', from: 'And [due] to Allah', to: 'thereto a way.' },
  { id: 'q2_127', key: '2:127' },
  { id: 'q2_127_short', key: '2:127', from: 'when Abraham was raising', to: '[with him] Ishmael' },
  { id: 'q2_158', key: '2:158', from: 'Indeed, as-Safa', to: 'symbols of Allah.' },
  { id: 'q2_203', key: '2:203', from: 'Then whoever hastens', to: 'fears Allah.' },
  { id: 'q2_203_short', key: '2:203', from: 'Then whoever hastens', to: 'no sin upon him' },
  { id: 'q48_4', key: '48:4', from: 'that they would increase', to: 'their [present] faith.' },
  { id: 'q33_56', key: '33:56' },
  { id: 'q2_144', key: '2:144', from: 'And wherever you', to: 'in prayer].' },
]

/* ---------------- the Sunnah ----------------
   `also` names the other collection when the Arabic card says متفق عليه
   or cites two books. */

const HADITH = [
  { id: 'h_islam', ref: 'muslim:8a', from: 'Al-Islam implies', to: 'the journey.' },
  { id: 'h_islam_able', ref: 'muslim:8a', from: 'perform pilgrimage to the (House)', to: 'the journey.' },
  { id: 'h_iman', ref: 'muslim:8a', from: 'That you affirm your faith in Allah', to: 'good and evil.' },
  { id: 'h_five', ref: 'bukhari:8', from: 'Islam is based on', to: 'five (principles)', close: '.', also: 'Sahih Muslim 16' },
  { id: 'h_times', ref: 'muslim:612d', from: 'The time of the noon prayer', to: 'the sun has not risen' },
  { id: 'h_maghrib', ref: 'muslim:612d', from: 'the time of the evening prayer', to: 'twilight has not ended' },
  { id: 'h_prayer_kufr', ref: 'muslim:82b', from: 'Between man and polytheism', to: 'abandonment of salat.' },
  { id: 'h_salawat', ref: 'muslim:408', from: 'He who blesses me once', to: 'ten times.' },
  { id: 'h_forgot', ref: 'muslim:684c', from: 'He who forgets the prayer', to: 'when he remembers it.' },
  { id: 'h_wudu_forgiven', ref: 'bukhari:159', from: 'If anyone performs ablution', to: 'will be forgiven.', also: 'Sahih Muslim 226' },
  { id: 'h_wudu_face', ref: 'muslim:244', from: 'When a bondsman', to: 'the last drop of water' },
  { id: 'h_pray_as', ref: 'bukhari:631', from: 'Pray as you have seen me praying', to: 'seen me praying', close: '.' },
  { id: 'h_sujud', ref: 'bukhari:812', from: 'I have been ordered', to: 'toes of both feet', also: 'Sahih Muslim 490' },
  {
    id: 'h_tashahhud', ref: 'bukhari:831', also: 'Sahih Muslim 402',
    parts: [
      { from: 'All the compliments', to: 'pious subjects of Allah' },
      { from: 'I testify that there is no Deity', to: 'His slave and His Apostle' },
    ],
    join: '. ', close: '.',
    // the page reads "Peace be on us an on the pious"
    edit: (t) => t.replace('on us an on', 'on us and on'),
  },
  { id: 'h_fatiha', ref: 'bukhari:756', from: 'Whoever does not recite', to: 'is invalid.', also: 'Sahih Muslim 394' },
  { id: 'h_istiftah', ref: 'tirmidhi:243', from: 'Glorious You are O Allah', to: 'but You.', also: 'Sunan Abi Dawud 776' },
  { id: 'h_tasbih', ref: 'abudawud:832', from: 'Glory be to Allah, and praise', to: 'but in Allah.' },
  { id: 'h_sadaqah', ref: 'muslim:2588', from: 'Charity does not decrease wealth', to: 'decrease wealth', close: '.' },
  { id: 'h_half_date', ref: 'bukhari:1417', from: 'Save yourself', to: 'in charity.', also: 'Sahih Muslim 1016' },
  { id: 'h_no_zakah_horse', ref: 'bukhari:1464', from: 'There is no Zakat', to: 'to a Muslim.', also: 'Sahih Muslim 982' },
  { id: 'h_ramadan', ref: 'bukhari:38', from: 'Whoever observes fasts', to: 'will be forgiven.', also: 'Sahih Muslim 760' },
  { id: 'h_suhoor', ref: 'bukhari:1923', from: 'Take Suhur', to: 'blessing in it.', also: 'Sahih Muslim 1095' },
  { id: 'h_iftar', ref: 'bukhari:1957', from: 'The people will remain', to: 'breaking of the fast.', also: 'Sahih Muslim 1098' },
  { id: 'h_forget_fast', ref: 'bukhari:1933', from: 'If somebody eats', to: 'by Allah.', also: 'Sahih Muslim 1155' },
  { id: 'h_rubayyi', ref: 'bukhari:1960', from: 'Since then we used to fast', to: 'make our boys fast.', also: 'Sahih Muslim 1136' },
  { id: 'h_talbiyah', ref: 'bukhari:1549', from: 'I respond to Your call O Allah', to: 'no partners with you.', also: 'Sahih Muslim 1184' },
  { id: 'h_hajj_reborn', ref: 'bukhari:1521', from: 'Whoever performs Hajj', to: 'born anew.', also: 'Sahih Muslim 1350' },
  { id: 'h_arafah', ref: 'tirmidhi:889', from: 'The Hajj is Arafah', to: 'is Arafah.' },
  { id: 'h_rites', ref: 'muslim:1297', from: 'Learn your rituals', to: 'performing them)' },
  {
    id: 'h_tashriq', ref: 'muslim:1141a', from: 'The days of Tashriq', to: 'eating and drinking',
    // Muslim 1141b is the same hadith "with this addition: And remembrance of
    // Allah", which is the wording the Arabic card quotes
    edit: (t) => t + ' and remembrance of Allah', close: '.', source: 'Sahih Muslim 1141a, 1141b',
  },
  { id: 'h_arafah_fast', ref: 'muslim:1162a', from: 'I seek from Allah that fasting on the day of', to: 'the coming years' },
]

/* ---------------- text clean-up ---------------- */

/** footnotes out, transliteration marks folded to the letters the fonts carry */
function plain(s) {
  return s
    .replace(/<sup[^>]*>.*?<\/sup>/g, '')
    .replace(/<[^>]+>/g, '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC')
    .replace(/[\u02bf\u02be`]/g, "'")
    .replace(/\s*[\u2013\u2014]\s*/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim()
}

function cut(text, from, to, where) {
  if (!from) return text
  const a = text.indexOf(from)
  if (a < 0) throw new Error(`${where}: start "${from}" not found`)
  const b = text.indexOf(to, a)
  if (b < 0) throw new Error(`${where}: end "${to}" not found after the start`)
  return text.slice(a, b + to.length)
}

/** an excerpt that starts or ends mid-sentence says so */
function frame(t, close) {
  let s = t.trim().replace(/\s+-$/, '').replace(/[;,:]$/, '')
  if (/^[a-z]/.test(s)) s = '…' + s
  if (close !== undefined) s += close
  else if (!/[.!?)'"”]$/.test(s) || /\)$/.test(s)) s += '…'
  return s
}

/* ---------------- fetch ---------------- */

async function quranText(key) {
  const res = await fetch(`https://api.quran.com/api/v4/verses/by_key/${key}?translations=${TRANSLATION}`)
  if (!res.ok) throw new Error(`quran.com ${key}: HTTP ${res.status}`)
  const data = await res.json()
  const tr = data.verse.translations.find((t) => t.resource_id === TRANSLATION)
  if (!tr) throw new Error(`quran.com ${key}: no translation ${TRANSLATION}`)
  return plain(tr.text)
}

async function surahNames() {
  const res = await fetch('https://api.quran.com/api/v4/chapters?language=en')
  const data = await res.json()
  return new Map(data.chapters.map((c) => [c.id, plain(c.name_simple)]))
}

async function main() {
  const out = {}
  const names = await surahNames()

  for (const q of QURAN) {
    const [s, a] = q.key.split(':')
    const text = cut(await quranText(q.key), q.from, q.to, q.id)
    out[q.id] = {
      text: frame(text),
      source: `${names.get(Number(s))} ${q.key}`,
      url: `https://quran.com/${s}/${a}`,
    }
  }

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
  try {
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36')
    const pages = new Map()
    const read = async (ref) => {
      if (pages.has(ref)) return pages.get(ref)
      const res = await page.goto(`https://sunnah.com/${ref}`, { waitUntil: 'domcontentloaded' })
      if (!res || res.status() !== 200) throw new Error(`sunnah.com ${ref}: HTTP ${res?.status()}`)
      const got = await page.evaluate(() => {
        const c = document.querySelector('.actualHadithContainer')
        return {
          ref: c?.querySelector('.hadith_reference')?.innerText.split('\n')[0].replace(/^Reference\s*:\s*/, '').trim(),
          en: c?.querySelector('.english_hadith_full')?.innerText ?? '',
        }
      })
      if (!got.en) throw new Error(`sunnah.com ${ref}: no English text on the page`)
      const v = { ref: plain(got.ref ?? ref), en: plain(got.en) }
      pages.set(ref, v)
      return v
    }

    for (const h of HADITH) {
      const p = await read(h.ref)
      let text = h.parts
        ? h.parts.map((x) => cut(p.en, x.from, x.to, h.id)).join(h.join ?? ' ')
        : cut(p.en, h.from, h.to, h.id)
      if (h.edit) text = h.edit(text)
      const source = h.source ?? p.ref
      out[h.id] = {
        text: frame(text, h.close),
        source: h.also ? `${source}; ${h.also}` : source,
        url: `https://sunnah.com/${h.ref}`,
      }
    }
  } finally {
    await browser.close()
  }

  const body = Object.entries(out)
    .map(([id, q]) => `  ${id}: {\n    text: ${JSON.stringify(q.text)},\n    source: ${JSON.stringify(q.source)},\n    url: ${JSON.stringify(q.url)},\n  },`)
    .join('\n')
  fs.writeFileSync(OUT, `/* GENERATED by scripts/fetch-quotes.mjs from quran.com (Saheeh International)
   and sunnah.com. Do not edit by hand: change the entry in the script and run it again. */

export interface SourcedQuote {
  text: string
  source: string
  url: string
}

export const QUOTES_EN = {
${body}
} satisfies Record<string, SourcedQuote>

export type QuoteId = keyof typeof QUOTES_EN
`)
  console.log(`wrote ${Object.keys(out).length} quotes to ${path.relative(process.cwd(), OUT)}`)
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
