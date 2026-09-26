import puppeteer from 'puppeteer-core'
const browser = await puppeteer.connect({ browserURL: 'http://localhost:9333', defaultViewport: null, protocolTimeout: 30000 })
for (const c of await browser.pages()) if (c.url().startsWith('http://localhost:4176')) {
  const r = await c.evaluate(() => { document.querySelectorAll('div[data-bar]').forEach(e => e.remove()); return { wc: getComputedStyle(document.querySelector('[data-persp]') ?? document.body).willChange, vis: document.visibilityState } }).catch(e => e.message)
  console.log(r)
}
browser.disconnect()
