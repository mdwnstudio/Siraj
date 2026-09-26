import puppeteer from 'puppeteer-core'
const browser = await puppeteer.connect({ browserURL: 'http://localhost:9333', defaultViewport: null, protocolTimeout: 30000 })
const w = ms => new Promise(r => setTimeout(r, ms))
let p
for (const c of await browser.pages()) if (c.url().startsWith('http://localhost:4176') && await c.evaluate(() => document.visibilityState === 'visible').catch(() => false)) p = c
await p.evaluate(async () => { for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister(); for (const k of await caches.keys()) await caches.delete(k) })
await p.reload({ waitUntil: 'load' }); await w(4000)
console.log(await p.evaluate(() => ({ wc: getComputedStyle(document.querySelector('[data-persp]')).willChange, sw: !!navigator.serviceWorker.controller, nav: performance.getEntriesByType('navigation')[0].type, bars: document.querySelectorAll('[data-bar]').length })))
browser.disconnect()
