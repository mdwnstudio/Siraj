import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
const OUT = process.argv[2]; const log = s => fs.appendFileSync(OUT, s + '\n')
const w = ms => new Promise(r => setTimeout(r, ms))
const browser = await puppeteer.connect({ browserURL: 'http://localhost:9333', defaultViewport: null })
const page = (await browser.pages()).find(p => /Siraj/.test(p.url()))
const top = () => page.evaluate(() => document.querySelector('.stairwrap')?.scrollTop ?? -1).catch(() => -1)
let base = await top()
const t0 = Date.now()
while (!process.env.NOW && Date.now() - t0 < 300000) {
  const now = await top()
  if (base < 0) base = now
  else if (now >= 0 && Math.abs(now - base) > 40) break
  await w(150)
}
log('nav ' + await page.evaluate(() => performance.getEntriesByType('navigation')[0]?.type).catch(() => '?'))
const cdp = await page.createCDPSession()
const events = []; cdp.on('Tracing.dataCollected', e => events.push(...e.value))
const done = new Promise(r => cdp.once('Tracing.tracingComplete', r))
await cdp.send('Tracing.start', { categories: 'cc,benchmark,input,toplevel,devtools.timeline,disabled-by-default-cc.debug', transferMode: 'ReportEvents' })
await w(15000)
await cdp.send('Tracing.end'); await Promise.race([done, w(30000)])
fs.writeFileSync(OUT + '.json', JSON.stringify(events))
let f = 0, st = {}
for (const e of events) if (e.name === 'PipelineReporter' && e.ph === 'b') { const r = e.args?.frame_reporter ?? {}; if (r.scroll_state && r.scroll_state !== 'SCROLL_NONE') { f++; st[r.state] = (st[r.state] || 0) + 1 } }
log(`scroll frames ${f} ${JSON.stringify(st)} events ${events.length}`)
log('DONE')
browser.disconnect()
