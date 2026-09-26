import puppeteer from 'puppeteer-core'
const browser = await puppeteer.connect({ browserURL: 'http://localhost:9333', defaultViewport: null })
const w = ms => new Promise(r => setTimeout(r, ms))
const pages = []
for (const p of await browser.pages()) if (/Siraj/.test(p.url())) pages.push([p, await p.evaluate(() => document.visibilityState).catch(() => '?')])
console.log(pages.map(([p, v]) => p.url() + ' ' + v).join('\n'))
const page = (pages.find(([, v]) => v === 'visible') ?? pages[0])[0]
const cdp = await page.createCDPSession()
const events = []; cdp.on('Tracing.dataCollected', e => events.push(...e.value))
const done = new Promise(r => cdp.once('Tracing.tracingComplete', r))
await cdp.send('Tracing.start', { categories: 'cc,disabled-by-default-cc.debug,disabled-by-default-cc.debug.display_items,benchmark,memory', transferMode: 'ReportEvents' })
for (const yDistance of [-1500, 1500]) { await cdp.send('Input.synthesizeScrollGesture', { x: 218, y: 540, yDistance, speed: 2400, gestureSourceType: 'touch' }); await w(400) }
await cdp.send('Tracing.end'); await Promise.race([done, w(20000)])
const pick = n => events.filter(e => e.name === n)
const assign = pick('TileManager::AssignGpuMemoryToTiles')
console.log('AssignGpuMemoryToTiles', assign.length, JSON.stringify(assign.slice(-2).map(e => e.args)).slice(0, 900))
const st = events.filter(e => /TileManager/.test(e.name) && e.args && Object.keys(e.args).length).map(e => e.name)
console.log('tile events with args', [...new Set(st)].join(', '))
for (const n of ['TileManager::DidFinishRunningAllTileTasks', 'TileManager::CheckIfMoreTilesNeedToBePrepared', 'TileManager::PrepareTiles']) { const x = pick(n); if (x.length) console.log(n, x.length, JSON.stringify(x[x.length - 1].args).slice(0, 700)) }
const dec = events.filter(e => /ImageDecode|GpuImageDecodeCache/.test(e.name)).reduce((m, e) => (m[e.name] = (m[e.name] || 0) + 1, m), {})
console.log('image decode', JSON.stringify(dec))
const ck = pick('PictureLayerImpl::AppendQuads checkerboard').length
let f = 0, miss = 0; for (const e of pick('PipelineReporter')) { const r = e.args?.frame_reporter; if (r?.scroll_state && r.scroll_state !== 'SCROLL_NONE') { f++; if (r.has_missing_content || r.checkerboarded_needs_raster || r.checkerboarded_needs_record) miss++ } }
console.log({ checkerboardQuads: ck, scrollFrames: f, framesWithMissingTiles: miss })
browser.disconnect()
