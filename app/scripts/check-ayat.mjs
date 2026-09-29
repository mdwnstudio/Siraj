#!/usr/bin/env node
/* ============================================================
   Every Arabic ayah in the curriculum, checked against the mushaf.

     node scripts/check-ayat.mjs

   The approved reference for the Quranic text is the King Fahd
   Complex mushaf, served by quranpedia.net (Hafs, mushaf 1). This
   reads every ayah the Arabic lessons quote, as a quote card or as
   «...» (سورة: رقم) inside running text, fetches that ayah, and
   checks that the quoted words appear in it, in order.

   The comparison is on the letters: harakat, tatweel and pause
   marks are dropped and the hamza seats are folded, because the
   lessons write the ayat in plain (imla'i) spelling, while the
   words themselves must match the mushaf exactly.
   ============================================================ */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SRC = fs.readFileSync(path.join(HERE, '../src/core/content/lessons.ts'), 'utf8')
const API = 'https://api.quranpedia.net/v1'
const UA = { 'user-agent': 'Siraj curriculum check (github.com/sleem-cyber/Siraj)' }

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩'
const num = (s) => Number(s.replace(/[٠-٩]/g, (d) => AR_DIGITS.indexOf(d)))

/** letters only: the words, not the way they are voweled or spelled out */
function letters(s) {
  return s
    .replace(/﻿/g, '')
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[ؤئ]/g, 'ء')
    .replace(/[^ء-ي ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** the surah names as the lessons write them, to their numbers */
async function surahNumbers() {
  const list = await (await fetch(`${API}/surahs`, { headers: UA })).json()
  const map = new Map()
  for (const s of list) {
    const bare = s.name.replace(/^سورة\s+/, '').trim()
    map.set(bare, s.id)
    map.set(bare.replace(/^ال/, ''), s.id)
  }
  return map
}

function quoted() {
  const out = []
  // quote cards: text, then a source like 'آل عمران: ١٩'
  for (const m of SRC.matchAll(/of: 'ayah',\s*text: '([^']+)',\s*source: '([^':]+): ([٠-٩]+)'/g)) {
    out.push({ text: m[1], surah: m[2].trim(), ayah: num(m[3]) })
  }
  // inline: «...» (البقرة: ٤٣)
  for (const m of SRC.matchAll(/«([^»]{3,400})» \(([^():]{2,20}): ([٠-٩]+)\)/g)) {
    out.push({ text: m[1], surah: m[2].trim(), ayah: num(m[3]) })
  }
  return out
}

async function main() {
  const surahs = await surahNumbers()
  const seen = new Set()
  let bad = 0
  let checked = 0
  for (const q of quoted()) {
    const key = `${q.surah}:${q.ayah}:${q.text}`
    if (seen.has(key)) continue
    seen.add(key)
    const s = surahs.get(q.surah) ?? surahs.get(q.surah.replace(/^ال/, ''))
    if (!s) {
      console.error(`? unknown surah «${q.surah}» for «${q.text}»`)
      bad++
      continue
    }
    const res = await fetch(`${API}/mushafs/1/${s}/${q.ayah}`, { headers: UA })
    const ayah = await res.json()
    checked++
    if (!ayah.text) {
      console.error(`? ${q.surah} ${q.ayah}: not found on quranpedia.net`)
      bad++
      continue
    }
    const want = letters(q.text)
    const got = letters(ayah.text)
    if (!got.includes(want)) {
      bad++
      console.error(`✗ ${q.surah} ${q.ayah}\n    lesson: ${q.text}\n    mushaf: ${ayah.text.replace(/﻿/g, '')}`)
    }
  }
  console.log(`${checked} ayat checked against the mushaf on quranpedia.net, ${bad} problem(s)`)
  process.exit(bad ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
