import puppeteer from 'puppeteer-core'
const browser = await puppeteer.connect({ browserURL: 'http://localhost:9333', defaultViewport: null, protocolTimeout: 30000 })
const w = ms => new Promise(r => setTimeout(r, ms))
const p = (await browser.pages()).find(p => p.url().startsWith('http://localhost:4176'))
await p.evaluate(() => document.querySelectorAll('[data-bar]').forEach(e => e.remove()))
await w(800)
const cdp = await p.createCDPSession()
const events = []; cdp.on('Tracing.dataCollected', e => events.push(...e.value))
const done = new Promise(r => cdp.once('Tracing.tracingComplete', r))
await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.invalidationTracking,blink,cc,disabled-by-default-cc.debug', transferMode: 'ReportEvents' })
await cdp.send('Input.synthesizeScrollGesture', { x: 250, y: 540, yDistance: 1200, speed: 1400, gestureSourceType: 'touch' })
await w(300)
await cdp.send('Tracing.end'); await Promise.race([done, w(25000)])
const count = pred => { const m = {}; for (const e of events) { const k = pred(e); if (k) m[k] = (m[k] || 0) + 1 } return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 14).map(x => `${x[1]}  ${x[0]}`).join('\n') }
console.log('--- invalidations'); console.log(count(e => /Invalidation/.test(e.name) && `${e.name} ${e.args?.data?.reason ?? ''} ${e.args?.data?.nodeName ?? ''}`))
console.log('--- commits/main'); console.log(count(e => /^(ProxyMain::BeginMainFrame::commit|WebFrameWidgetImpl::BeginMainFrame|ProxyImpl::BeginMainFrameAbortedOnImplThread|PictureLayer::Update|Paint|PaintImage|RasterTask|UpdateLayoutTree|Layout|ScrollTimeline.*|Animation.*Tick.*|EventDispatch)$/.test(e.name) && `${e.name}${e.name === 'EventDispatch' ? ' ' + e.args?.data?.type : ''}`))
console.log('--- pending tree'); console.log(count(e => /activat/i.test(e.name) && e.name))
const paints = events.filter(e => e.name === 'Paint').map(e => e.args?.data?.nodeId).filter(Boolean)
const byNode = {}; for (const n of paints) byNode[n] = (byNode[n] || 0) + 1
await cdp.send('DOM.enable'); await cdp.send('DOM.getDocument', { depth: -1 })
for (const [id, n] of Object.entries(byNode).sort((a, b) => b[1] - a[1]).slice(0, 8)) { const d = await cdp.send('DOM.describeNode', { backendNodeId: Number(id) }).catch(() => null); const a = d?.node?.attributes || []; const ci = a.indexOf('class'); console.log('paint', n, d?.node?.nodeName, ci >= 0 ? a[ci + 1] : '') }
browser.disconnect()
