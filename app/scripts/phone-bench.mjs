/* Budget-phone check for the home stair (AGENTS.md section 10).

   Loads a production build in headless Chrome shaped like a Vivo Y36:
   360x800 at 2x, touch, CPU slowed 6x. A busy loop holds the main thread
   about three quarters of the time, standing in for the OS and the other
   apps a real phone is running. Then it flicks the stair and records every
   presented frame, and counts the ones where the picture did not move.

   Usage (with `npx vite preview --port 4173` running on a fresh build):
     node scripts/phone-bench.mjs [url] [--no-stress] [--rate=6]
   CHROME=/path/to/chrome overrides the browser. */

import crypto from 'node:crypto'
import puppeteer from 'puppeteer-core'

const args = process.argv.slice(2)
const url = args.find(a => !a.startsWith('--')) ?? 'http://localhost:4173/Siraj/'
const stress = !args.includes('--no-stress')
const rate = Number(args.find(a => a.startsWith('--rate='))?.slice(7) ?? 6)
const chrome = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const browser = await puppeteer.launch({ executablePath: chrome, headless: true })
const page = await browser.newPage()
await page.emulate({
  viewport: { width: 360, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  userAgent: 'Mozilla/5.0 (Linux; Android 15; V2247) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
})
const cdp = await page.createCDPSession()
await page.evaluateOnNewDocument(() => {
  localStorage.setItem('siraj.progress.v1', JSON.stringify({ onboarded: true, name: 'bench', language: 'ar' }))
})
await page.goto(url, { waitUntil: 'networkidle0' })
await page.waitForSelector('.stairwrap')
await new Promise(r => setTimeout(r, 2500))
await cdp.send('Emulation.setCPUThrottlingRate', { rate })
if (stress) {
  await page.evaluate(() => {
    setInterval(() => { const t = performance.now(); while (performance.now() - t < 30) { /* hog */ } }, 40)
  })
}
const camera = await page.evaluate(() => document.querySelector('.stairwrap--ground') ? 'ground' : 'js')

const frames = []
cdp.on('Page.screencastFrame', f => {
  frames.push({ t: f.metadata.timestamp, hash: crypto.createHash('md5').update(f.data).digest('hex') })
  cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {})
})
await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1, maxWidth: 180, maxHeight: 400 })
await new Promise(r => setTimeout(r, 300))

let total = 0
let frozen = 0
for (const yDistance of [1600, -1600]) {
  const start = Date.now() / 1000
  await cdp.send('Input.synthesizeScrollGesture', { x: 180, y: 450, yDistance, speed: 1200, gestureSourceType: 'touch' })
  const end = Date.now() / 1000
  const during = frames.filter(f => f.t >= start && f.t <= end)
  total += during.length
  for (let i = 1; i < during.length; i++) if (during[i].hash === during[i - 1].hash) frozen++
}
await cdp.send('Page.stopScreencast')
await browser.close()

const pct = (100 * frozen / Math.max(1, total)).toFixed(1)
console.log(`camera: ${camera}, cpu ${rate}x, ${stress ? 'main thread hogged' : 'idle main thread'}`)
console.log(`frozen frames while scrolling: ${frozen}/${total} (${pct}%)`)
process.exitCode = frozen / Math.max(1, total) > 0.05 ? 1 : 0
