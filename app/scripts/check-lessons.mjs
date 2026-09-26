#!/usr/bin/env node
/* ============================================================
   Holds the English curriculum to the Arabic one.

     node scripts/check-lessons.mjs

   A translation may change every word, but never the shape: the
   same lessons, cards, exercises, options and answer keys, in the
   same order. Otherwise the English learner would be graded against
   a different answer than the Arabic one. It also checks the house
   rule (no em-dashes) and that every tappable term is in its card.
   Exits non-zero on any mismatch.
   ============================================================ */

import { build } from 'esbuild'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import fs from 'node:fs'
import os from 'node:os'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const content = path.join(HERE, '../src/core/content')
const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'siraj-')), 'lessons.mjs')

await build({
  stdin: {
    contents: `export { LESSONS } from './lessons'\nexport { LESSONS_EN } from './lessons.en'`,
    resolveDir: content,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  logLevel: 'error',
})
const { LESSONS, LESSONS_EN } = await import(pathToFileURL(out).href)

const problems = []
const fail = (where, what) => problems.push(`${where}: ${what}`)
const same = (where, a, b) => {
  const x = JSON.stringify(a)
  const y = JSON.stringify(b)
  if (x !== y) fail(where, `Arabic ${x} / English ${y}`)
}

/** the parts of an exercise that decide what counts as right */
function key(ex) {
  switch (ex.kind) {
    case 'choice': return { options: ex.options.map((o) => o.id), answerId: ex.answerId }
    case 'boolean': return { answer: ex.answer }
    case 'order': return { items: ex.items.map((i) => i.id), answer: ex.answer }
    case 'match': return { pairs: ex.pairs.map((p) => p.id) }
    case 'sort': return { buckets: ex.buckets.map((b) => b.id), items: ex.items.map((i) => [i.id, i.bucket]) }
  }
}

same('lessons', Object.keys(LESSONS), Object.keys(LESSONS_EN))

for (const [id, ar] of Object.entries(LESSONS)) {
  const en = LESSONS_EN[id]
  if (!en) continue
  same(`${id} icon/xp`, [ar.icon, ar.xp], [en.icon, en.xp])
  same(`${id} cards`, ar.cards.map((c) => [c.id, c.kind]), en.cards.map((c) => [c.id, c.kind]))
  for (const c of ar.cards) {
    const e = en.cards.find((x) => x.id === c.id)
    if (!e) continue
    if (c.kind === 'fact') same(`${id} ${c.id} art`, c.art ?? null, e.art ?? null)
    if (c.kind === 'quote') same(`${id} ${c.id} of`, c.of, e.of)
    if (c.kind === 'list') same(`${id} ${c.id} items`, c.items.map((i) => i.icon ?? null), e.items.map((i) => i.icon ?? null))
    if (e.kind === 'fact' && e.term && !e.body.includes(e.term.word)) {
      fail(`${id} ${c.id}`, `the term "${e.term.word}" is not in the card, so it shows as a separate button`)
    }
  }
  same(`${id} exercises`, ar.exercises.map((x) => [x.id, x.kind]), en.exercises.map((x) => [x.id, x.kind]))
  for (const x of ar.exercises) {
    const e = en.exercises.find((y) => y.id === x.id)
    if (e) same(`${id} ${x.id} answer key`, key(x), key(e))
  }
  same(`${id} ask`, ar.ask.length, en.ask.length)
}

const text = JSON.stringify(LESSONS_EN)
if (text.includes('—')) fail('English', 'contains an em-dash (house rule 1)')

if (problems.length) {
  console.error(`${problems.length} problem(s):\n  ` + problems.join('\n  '))
  process.exit(1)
}
console.log(`English matches Arabic: ${Object.keys(LESSONS).length} lessons, every answer key identical.`)
