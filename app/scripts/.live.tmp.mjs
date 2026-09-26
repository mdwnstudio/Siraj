import puppeteer from 'puppeteer-core'
const browser = await puppeteer.connect({ browserURL: 'http://localhost:9333', defaultViewport: null })
const w = ms => new Promise(r => setTimeout(r, ms))
const page = (await browser.pages()).find(p => /Siraj/.test(p.url()))
const info = await page.evaluate(() => {
  const bodies = [...document.querySelectorAll('[data-persp]')]
  const per = bodies.map(b => b.getAnimations().length)
  const hist = {}; per.forEach(n => hist[n] = (hist[n] || 0) + 1)
  const all = document.getAnimations()
  const byState = {}; all.forEach(a => { const k = `${a.playState}/${a.timeline?.constructor.name}`; byState[k] = (byState[k] || 0) + 1 })
  const sw = document.querySelector('.stairwrap')
  const tl = all.find(a => a.timeline?.constructor.name === 'ScrollTimeline')
  window.__muts = 0; window.__mutEls = {}
  new MutationObserver(ms => { for (const m of ms) { window.__muts++; const k = (m.target.className?.baseVal ?? m.target.className ?? m.target.tagName) + ''; window.__mutEls[k.slice(0, 40)] = (window.__mutEls[k.slice(0, 40)] || 0) + 1 } }).observe(document.body, { attributes: true, subtree: true, attributeFilter: ['style', 'class'] })
  return { bodies: bodies.length, animsPerBody: hist, byState, scrollTop: sw.scrollTop, max: sw.scrollHeight - sw.clientHeight, client: sw.clientHeight,
    tlSource: tl?.timeline?.source?.className, tlTime: tl?.timeline?.currentTime?.toString?.(), nav: performance.getEntriesByType('navigation')[0]?.type,
    inlineTransforms: bodies.filter(b => b.style.transform).length, scrollRestoration: history.scrollRestoration }
})
console.log(info)
const cdp = await page.createCDPSession()
await cdp.send('Input.synthesizeScrollGesture', { x: 218, y: 540, yDistance: -900, speed: 1500, gestureSourceType: 'touch' }); await w(500)
console.log(await page.evaluate(() => ({ muts: window.__muts, els: window.__mutEls, scrollTop: document.querySelector('.stairwrap').scrollTop })))
browser.disconnect()
