import puppeteer from 'puppeteer-core'
const browser = await puppeteer.connect({ browserURL: 'http://localhost:9333', defaultViewport: null })
const w = ms => new Promise(r => setTimeout(r, ms))
const page = (await browser.pages()).find(p => /Siraj/.test(p.url()))
const cdp = await page.createCDPSession()
async function trace(fn) {
  const events = []; const h = e => events.push(...e.value); cdp.on('Tracing.dataCollected', h)
  const done = new Promise(r => cdp.once('Tracing.tracingComplete', r))
  await cdp.send('Tracing.start', { categories: 'cc,benchmark,devtools.timeline,blink.animations,disabled-by-default-devtools.timeline,disabled-by-default-cc.debug', transferMode: 'ReportEvents' })
  await fn()
  await cdp.send('Tracing.end'); await Promise.race([done, w(20000)]); cdp.off('Tracing.dataCollected', h)
  return events
}
const summary = evs => {
  let f = 0, main = 0, comp = 0
  for (const e of evs) if (e.name === 'PipelineReporter' && e.ph === 'b') { const r = e.args?.frame_reporter ?? {}; if (r.scroll_state && r.scroll_state !== 'SCROLL_NONE') { f++; if (r.has_main_animation) main++; if (r.has_compositor_animation) comp++ } }
  return { scrollFrames: f, mainAnim: main, compAnim: comp }
}
const fling = async () => { for (const d of [1200, -1200]) { await cdp.send('Input.synthesizeScrollGesture', { x: 218, y: 540, yDistance: d, speed: 2000, gestureSourceType: 'touch' }); await w(300) } }
console.log('before rebuild', summary(await trace(fling)))
// nudge the stair's size so its ResizeObserver rebuilds the camera
const evs = await trace(async () => {
  await page.evaluate(async () => { const s = document.querySelector('.stair') ?? document.querySelector('.stairwrap').firstElementChild; s.style.paddingBottom = '1px'; await new Promise(r => setTimeout(r, 300)); s.style.paddingBottom = ''; await new Promise(r => setTimeout(r, 300)) })
  await w(500)
})
const an = evs.filter(e => e.name === 'Animation' && e.args?.data)
const fails = {}; for (const e of an) { const d = e.args.data; const k = `compositeFailed=${d.compositeFailed ?? '-'} unsupported=${(d.unsupportedProperties || []).join('|')}`; fails[k] = (fails[k] || 0) + 1 }
console.log('animation start records', an.length, fails)
console.log('after rebuild', summary(await trace(fling)))
browser.disconnect()
