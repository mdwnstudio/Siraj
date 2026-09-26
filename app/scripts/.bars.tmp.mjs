import puppeteer from 'puppeteer-core'
import { execSync, spawn } from 'node:child_process'
const ADB = process.env.HOME + '/Library/Android/sdk/platform-tools/adb'
const browser = await puppeteer.connect({ browserURL: 'http://localhost:9333', defaultViewport: null, protocolTimeout: 30000 })
const w = ms => new Promise(r => setTimeout(r, ms))
let p
for (const c of await browser.pages()) if (c.url().startsWith('http://localhost:4176') && await c.evaluate(() => document.visibilityState === 'visible' && !!document.querySelector('.stairwrap')).catch(() => false)) { p = c; break }
console.log('tab', !!p)
if (process.env.FRESH) { await p.close(); p = await browser.newPage(); await p.goto('http://localhost:4176/Siraj/', { waitUntil: 'load' }); await w(5000) }
await p.bringToFront()
if (!process.env.NORELOAD) { await p.reload({ waitUntil: 'load' }); await w(5000) }
if (process.env.HINT) { await p.evaluate(h => { document.querySelector('.stairwrap').style.willChange = h; document.querySelectorAll('[data-bar]').forEach(e => e.remove()) }, process.env.HINT); await w(1500) }
if (process.env.NOBARS) { /* no bars */ }
if (process.env.NOCAM) await p.evaluate(() => { window.__nocam = 1 })
if (process.env.BODYWC) { await p.evaluate(v => { const st = document.createElement('style'); st.dataset.bar = 1; st.textContent = `[data-persp],.landscape__baked{will-change:${v}}`; document.head.append(st) }, process.env.BODYWC); await w(2500) }
const info = await p.evaluate(() => {
  const sw = document.querySelector('.stairwrap'), home = sw.parentElement, stair = sw.querySelector('.stair') ?? sw.firstElementChild
  const H = sw.scrollHeight, max = H - sw.clientHeight
  const stripes = 'repeating-linear-gradient(to bottom,#000 0 14px,#fff 14px 40px)'
  // A: scrolls natively with the road
  const a = document.createElement('div'); a.dataset.bar = 1
  a.style.cssText = `position:absolute;top:0;left:0;width:14px;height:${H}px;background:${stripes};z-index:9999;pointer-events:none`
  sw.firstElementChild.style.position ||= 'relative'
  sw.firstElementChild.appendChild(a)
  // B: pinned beside the scroller, moved only by a scroll-linked animation
  const b = document.createElement('div')
  const r = sw.getBoundingClientRect(), hr = home.getBoundingClientRect()
  b.style.cssText = `position:absolute;top:${r.top - hr.top}px;left:16px;width:14px;height:${H}px;background:${stripes};z-index:9999;pointer-events:none`
  const clip = document.createElement('div'); clip.dataset.bar = 1
  clip.style.cssText = `position:absolute;top:${r.top - hr.top}px;left:0;width:40px;height:${sw.clientHeight}px;overflow:hidden;z-index:9999;pointer-events:none`
  b.style.top = '0px'
  clip.appendChild(b); home.appendChild(clip)
  const tl = new ScrollTimeline({ source: sw, axis: 'block' })
  b.animate([{ transform: 'translate3d(0,0,0)' }, { transform: `translate3d(0,${-max}px,0)` }], { timeline: tl, fill: 'both' })
  if (window.__nocam) for (const x of document.getAnimations()) if (x.timeline?.constructor.name === 'ScrollTimeline' && x.effect?.target !== b) x.cancel()
  return { wc: getComputedStyle(sw).willChange, H, max, top: sw.scrollTop, anims: document.getAnimations().filter(x => x.timeline?.constructor.name === 'ScrollTimeline').length, nav: performance.getEntriesByType('navigation')[0].type }
})
console.log(info)
execSync(`${ADB} -s 10JDCE0125000PM shell rm -f /data/local/tmp/bars.mp4`)
execSync(`${ADB} -s 10JDCE0125000PM shell "nohup screenrecord --time-limit 14 --bit-rate 30000000 --size 540x1194 /data/local/tmp/bars.mp4 >/dev/null 2>&1 &"`)
await w(1200)
const cdp = await p.createCDPSession()
if (process.env.HOG) {
  p.evaluate(() => { const t = performance.now(); while (performance.now() - t < 4000); }).catch(() => {})
  await w(300)
  await cdp.send('Input.synthesizeScrollGesture', { x: 250, y: 540, yDistance: 1400, speed: 1400, gestureSourceType: 'touch' }).catch(e => console.log('g', e.message))
  await w(4000)
  browser.disconnect(); process.exit(0)
}
for (const [d, sp] of [[1400, 1800], [-1400, 1800], [1000, 900], [-1000, 900], [1600, 3000], [-1600, 3000]]) {
  await cdp.send('Input.synthesizeScrollGesture', { x: 250, y: 540, yDistance: d, speed: sp, gestureSourceType: 'touch' }); await w(250)
}
await w(1500)
browser.disconnect()
