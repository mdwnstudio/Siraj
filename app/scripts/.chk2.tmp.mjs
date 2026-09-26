import puppeteer from 'puppeteer-core'
const browser = await puppeteer.connect({ browserURL: 'http://localhost:9333', defaultViewport: null, protocolTimeout: 30000 })
for (const c of await browser.pages()) if (c.url().startsWith('http://localhost:4176')) console.log(await c.evaluate(() => [...new Set([...document.querySelectorAll('[data-persp]')].map(e => e.className.split(' ')[0] + ':' + getComputedStyle(e).willChange))]).catch(e => e.message))
browser.disconnect()
