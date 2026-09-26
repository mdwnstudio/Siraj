import puppeteer from 'puppeteer-core'
const browser = await puppeteer.connect({ browserURL: 'http://localhost:9333', defaultViewport: null, protocolTimeout: 30000 })
const w = ms => new Promise(r => setTimeout(r, ms))
let p
for (const c of await browser.pages()) if (c.url().startsWith('http://localhost:4176') && await c.evaluate(() => document.visibilityState === 'visible').catch(() => false)) p = c
if (!process.env.NORELOAD) { await p.reload({ waitUntil: "load" }); await w(9000) }
if (process.env.CSS) await p.evaluate(css => { const s = document.createElement('style'); s.textContent = css; document.head.append(s) }, process.env.CSS)
await w(800)
const cdp = await p.createCDPSession()
const events = []; cdp.on('Tracing.dataCollected', e => events.push(...e.value))
const done = new Promise(r => cdp.once('Tracing.tracingComplete', r))
await cdp.send('Tracing.start', { categories: 'cc,disabled-by-default-cc.debug,disabled-by-default-cc.debug.picture,benchmark', transferMode: 'ReportEvents' })
for (const d of [1400, -1400]) { await cdp.send('Input.synthesizeScrollGesture', { x: 250, y: 540, yDistance: d, speed: 1200, gestureSourceType: 'touch' }); await w(300) }
await cdp.send('Tracing.end'); await Promise.race([done, w(25000)])
const names = {}; for (const e of events) if (/Picture|Tiling|Scale|Raster|Tile/i.test(e.name)) names[e.name] = (names[e.name] || 0) + 1
console.log(names)
const at = events.filter(e => /AddTilingsForRasterScale|RecalculateRasterScales/.test(e.name))
console.log(JSON.stringify(at.slice(0, 3).map(e => ({ n: e.name, a: e.args }))).slice(0, 900))
const raster = events.filter(e => e.name === 'RasterTask').length
let f = 0, bad = 0; for (const e of events) if (e.name === 'PipelineReporter' && e.ph === 'b') { const r = e.args?.frame_reporter; if (r?.scroll_state && r.scroll_state !== 'SCROLL_NONE') { f++; if (r.state !== 'STATE_PRESENTED_ALL' && r.state !== 'STATE_NO_UPDATE_DESIRED') bad++ } }
console.log({ rasterTasks: raster, scrollFrames: f, notFullyPresented: bad })
browser.disconnect()
