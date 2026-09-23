/* ============================================================
   REVIEW SHEET
   Builds one self-contained HTML file a content reviewer scrolls
   through: every lesson's cards, exercises and Ask Siraj answers,
   styled like the game, with every text editable in place.
   The reviewer saves a copy with the edits embedded as JSON
   (in <script id="siraj-edits">), which is what gets applied back.

   node scripts/review-sheet.mjs [out.html]
   ============================================================ */

import { build } from 'esbuild'
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.resolve(process.argv[2] ?? path.join(APP, 'siraj-review.html'))

/* ---- the curriculum and the seven icons, straight from the app source ---- */
const entry = `
  import { renderToStaticMarkup } from 'react-dom/server'
  import { createElement } from 'react'
  import { SIRAJ_ICONS } from './ui/icons/SirajIcons'
  export { LESSONS } from './core/content/lessons'
  export { UNITS } from './core/content/path'
  export const ICONS = Object.fromEntries(Object.entries(SIRAJ_ICONS).map(([k, C]) => [k, renderToStaticMarkup(createElement(C, { size: 22 }))]))
`
/* written beside node_modules so the external React import resolves */
const tmpDir = path.join(APP, 'node_modules/.cache/review-sheet')
const tmp = path.join(tmpDir, `bundle-${process.pid}.mjs`)
mkdirSync(tmpDir, { recursive: true })
await build({
  stdin: { contents: entry, resolveDir: path.join(APP, 'src'), loader: 'tsx' },
  bundle: true, format: 'esm', platform: 'node', outfile: tmp, jsx: 'automatic', logLevel: 'warning',
  external: ['react', 'react-dom', 'react/*', 'react-dom/*'],
})
const mod = await import(pathToFileURL(tmp).href)
rmSync(tmp, { force: true })
const { LESSONS, UNITS, ICONS } = mod

const units = UNITS.map((u) => ({
  id: u.id, index: u.index, title: u.title, subtitle: u.subtitle, icon: u.icon, tone: u.tone,
  lessons: u.nodes.filter((n) => n.lessonId && LESSONS[n.lessonId]).map((n) => LESSONS[n.lessonId]),
})).filter((u) => u.lessons.length)

const b64 = (p) => readFileSync(path.join(APP, 'public', p)).toString('base64')
const font = (name, file, weight) =>
  `@font-face{font-family:'${name}';src:url(data:font/woff2;base64,${b64('fonts/' + file)}) format('woff2');font-weight:${weight};font-display:swap}`
const fonts = [
  font('Ping', 'ping-regular.woff2', 400), font('Ping', 'ping-bold.woff2', 700),
  font('Ping', 'ping-black.woff2', 900), font('Norsal', 'norsal.woff2', '400 900'),
].join('\n')
const img = { main: 'data:image/webp;base64,' + b64('img/siraj-main.webp'), wave: 'data:image/webp;base64,' + b64('img/siraj-wave.webp') }

let commit = ''
try { commit = execSync('git rev-parse --short HEAD', { cwd: APP }).toString().trim() } catch {}

const meta = { commit, builtAt: new Date().toISOString().slice(0, 10) }
/* JSON inside <script> must never contain a closing tag */
const json = (v) => JSON.stringify(v).replace(/</g, '\\u003c')

const html = readFileSync(path.join(APP, 'scripts/review-sheet.template.html'), 'utf8')
  .replace('/*FONTS*/', () => fonts)
  .replace('"__DATA__"', () => json({ meta, units, icons: ICONS, img }))

writeFileSync(out, html)
console.log(`review sheet: ${out} (${(html.length / 1024).toFixed(0)} KB, ${units.reduce((n, u) => n + u.lessons.length, 0)} lessons)`)
