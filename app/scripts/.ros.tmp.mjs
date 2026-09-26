import puppeteer from 'puppeteer-core'
const browser = await puppeteer.connect({ browserURL: 'http://localhost:9333', defaultViewport: null })
const w = ms => new Promise(r => setTimeout(r, ms))
const page = (await browser.pages()).find(p => /Siraj/.test(p.url()))
const cdp = await page.createCDPSession()
await cdp.send('DOM.enable')
let ls = []; cdp.on('LayerTree.layerTreeDidChange', e => { if (e.layers) ls = e.layers })
await cdp.send('LayerTree.enable'); await w(600)
const desc = async id => { if (!id) return '(no node)'; const d = await cdp.send('DOM.describeNode', { backendNodeId: id }).catch(() => null); const n = d?.node; if (!n) return '?'; const a = n.attributes || []; const ci = a.indexOf('class'); return `${n.nodeName.toLowerCase()}.${ci >= 0 ? a[ci + 1].split(' ').join('.') : ''}` }
for (const l of ls) for (const r of l.scrollRects || []) if (r.type === 'RepaintsOnScroll') {
  const reasons = await cdp.send('LayerTree.compositingReasons', { layerId: l.layerId }).catch(() => ({}))
  console.log('RepaintsOnScroll layer', l.width + 'x' + l.height, await desc(l.backendNodeId), JSON.stringify(r.rect), (reasons.compositingReasonIds || []).join(','))
}
// which elements could cause it: background-attachment fixed, or fixed/sticky inside a scroller
console.log(await page.evaluate(() => {
  const out = []
  for (const el of document.querySelectorAll('*')) { const s = getComputedStyle(el); if (s.backgroundAttachment.includes('fixed') || s.backgroundAttachment.includes('local')) out.push(`${el.tagName.toLowerCase()}.${(el.className?.baseVal ?? el.className) || ''} bg-attach=${s.backgroundAttachment}`) }
  return out.slice(0, 10)
}))
browser.disconnect()
