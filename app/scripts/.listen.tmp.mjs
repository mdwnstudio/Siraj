import puppeteer from 'puppeteer-core'
const browser = await puppeteer.connect({ browserURL: 'http://localhost:9333', defaultViewport: null })
const w = ms => new Promise(r => setTimeout(r, ms))
const page = (await browser.pages()).find(p => /Siraj/.test(p.url()))
const cdp = await page.createCDPSession()
await cdp.send('DOM.enable'); await cdp.send('DOMDebugger.enable').catch(() => {})
const targets = { window: 'window', document: 'document', root: "document.getElementById('root')", stairwrap: "document.querySelector('.stairwrap')", body: 'document.body' }
for (const [name, expr] of Object.entries(targets)) {
  const { result } = await cdp.send('Runtime.evaluate', { expression: expr })
  if (!result.objectId) continue
  const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId, depth: 0 })
  const rel = listeners.filter(l => /touch|wheel|pointer|scroll/.test(l.type))
  if (rel.length) console.log(name, rel.map(l => `${l.type}${l.passive ? '(passive)' : ' NON-PASSIVE'}`).join(', '))
}
let ls = []; cdp.on('LayerTree.layerTreeDidChange', e => { if (e.layers) ls = e.layers })
await cdp.send('LayerTree.enable'); await w(600)
const rects = {}
for (const l of ls) for (const r of l.scrollRects || []) rects[r.type] = (rects[r.type] || 0) + 1
console.log('scroll bottleneck rects', rects)
const t = ls.filter(l => l.touchActionRegion ?? l.stickyPositionConstraint)
console.log('layers', ls.length)
browser.disconnect()
