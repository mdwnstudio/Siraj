import puppeteer from 'puppeteer-core'
import crypto from 'node:crypto'
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const w = ms => new Promise(r => setTimeout(r, ms))
const page = await browser.newPage()
await page.emulate({ viewport: { width: 436, height: 904, deviceScaleFactor: 1, isMobile: true, hasTouch: true }, userAgent: 'Mozilla/5.0 (Linux; Android 15; V2247) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36' })
await page.evaluateOnNewDocument(() => localStorage.setItem('siraj.progress.v1', JSON.stringify({ onboarded: true, name: 'b', language: 'ar' })))
await page.goto('http://localhost:4176/Siraj/', { waitUntil: 'networkidle0' }); await w(3500)
console.log('version', await browser.version())
// probe: a pinned box moved only by a scroll-linked animation, and read its on-screen position from the compositor via screenshots
await page.evaluate(() => {
  const sw = document.querySelector('.stairwrap'), home = sw.parentElement
  const b = document.createElement('div'); b.id = 'probe'
  b.style.cssText = 'position:absolute;left:0;top:0;width:30px;height:30px;background:#f00;z-index:99999'
  home.appendChild(b)
  const max = sw.scrollHeight - sw.clientHeight
  b.animate([{ transform: 'translateY(100px)' }, { transform: 'translateY(700px)' }], { timeline: new ScrollTimeline({ source: sw }), fill: 'both' })
  sw.scrollTop = max
})
await w(500)
const cdp = await page.createCDPSession()
const redY = async () => { const shot = await page.screenshot({ encoding: 'binary', clip: { x: 0, y: 0, width: 30, height: 904 } }); return shot }
// block the main thread for 2.5s, and scroll on the compositor in the middle of it
const before = await page.evaluate(() => document.querySelector('.stairwrap').scrollTop)
page.evaluate(() => { const t = performance.now(); while (performance.now() - t < 2500); }).catch(() => {})
await w(200)
const frames = []
cdp.on('Page.screencastFrame', f => { frames.push(f.data); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}) })
await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 })
await cdp.send('Input.synthesizeScrollGesture', { x: 200, y: 500, yDistance: 700, speed: 1400, gestureSourceType: 'touch' }).catch(e => console.log('gesture', e.message))
await w(300)
await cdp.send('Page.stopScreencast')
console.log('screencast frames during the blocked main thread:', frames.length)
// find the probe's y in each frame by decoding PNG rows is heavy; save first and last for a look
import('node:fs').then(fs => { fs.writeFileSync(process.argv[2] + '-first.png', Buffer.from(frames[1] ?? frames[0], 'base64')); fs.writeFileSync(process.argv[2] + '-last.png', Buffer.from(frames[frames.length - 2] ?? frames[frames.length - 1], 'base64')) })
await w(3000)
console.log('scrollTop before', Math.round(before), 'after', Math.round(await page.evaluate(() => document.querySelector('.stairwrap').scrollTop)))
await browser.close()
