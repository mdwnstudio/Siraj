/* Bakes the stair's scenery islands into the WebP images phones draw
   (public/img/path/<unit>-<theme>.webp, see PathLandscape.tsx and
   AGENTS.md section 10). Run it after changing a landmark drawing or a
   --land-* colour in app.css, with the dev server up:

     npm run dev
     node scripts/bake-islands.mjs [url] [--theme=dark|light] [--check]

   It opens the desktop layout (which draws the islands live), lifts each
   unit's island out of the road at the baked size, 1035x625, still in its
   soft-edged frame, and screenshots it on a transparent page. --check
   compares against the images already on disk instead of writing.
   Needs Python 3 with Pillow for the WebP encode. */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const args = process.argv.slice(2)
const url = args.find(a => !a.startsWith('--')) ?? 'http://localhost:5173/'
const themes = args.find(a => a.startsWith('--theme='))?.slice(8).split(',') ?? ['light', 'dark']
const check = args.includes('--check')
const chrome = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const outDir = process.env.OUT ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '../public/img/path')
const W = 1035, H = 625

const browser = await puppeteer.launch({ executablePath: chrome, headless: true })
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'siraj-bake-'))

for (const theme of themes) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
  await page.evaluateOnNewDocument(t => {
    localStorage.setItem('siraj.progress.v1', JSON.stringify({ version: 1, onboarded: true, name: 'bake', language: 'ar', settings: { sound: false, haptics: false, reduceMotion: true, theme: t } }))
  }, theme)
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForSelector('.landscape:not(.landscape--baked)')
  await page.evaluate(() => document.fonts.ready)
  const units = await page.$$eval('.path-unit', els => els.map(e => e.dataset.unit))
  for (const unit of units) {
    await page.evaluate((unit, W, H) => {
      document.getElementById('bake')?.remove()
      const style = document.getElementById('bake-style') ?? document.head.appendChild(Object.assign(document.createElement('style'), { id: 'bake-style' }))
      style.textContent = 'html,body{background:transparent!important}#root{visibility:hidden}'
      const stage = document.createElement('div')
      stage.id = 'bake'
      stage.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:99999;visibility:visible`
      const island = document.querySelector(`.path-unit[data-unit="${unit}"] .landscape`).cloneNode(true)
      island.removeAttribute('style')
      // the original bakes sat 10px higher in their frame than the live layout
      island.style.cssText = 'inset:-10px 0 10px;transform:none;opacity:1;visibility:visible'
      for (const layer of island.querySelectorAll('[data-depth]')) layer.style.transform = 'none'
      stage.appendChild(island)
      document.body.appendChild(stage)
    }, unit, W, H)
    await new Promise(r => setTimeout(r, 150))
    const png = path.join(tmp, `${unit}-${theme}.png`)
    await page.screenshot({ path: png, omitBackground: true, clip: { x: 0, y: 0, width: W, height: H } })
    const webp = path.join(outDir, `${unit}-${theme}.webp`)
    const py = check
      ? `from PIL import Image, ImageChops\na=Image.open(${JSON.stringify(png)}).convert('RGBA');b=Image.open(${JSON.stringify(webp)}).convert('RGBA')\nd=ImageChops.difference(a,b);print(max(x[1] for x in d.getextrema()), sum(d.convert('L').getdata())/(${W}*${H}))`
      : `from PIL import Image\nImage.open(${JSON.stringify(png)}).convert('RGBA').save(${JSON.stringify(webp)},'WEBP',quality=86,method=6,alpha_quality=90)`
    const res = execFileSync('python3', ['-c', py]).toString().trim()
    console.log(unit, theme, check ? `max diff, mean diff: ${res}` : `${(fs.statSync(webp).size / 1024).toFixed(1)} KB`)
  }
  await page.close()
}
await browser.close()
fs.rmSync(tmp, { recursive: true, force: true })
