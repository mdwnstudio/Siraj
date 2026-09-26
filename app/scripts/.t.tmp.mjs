import puppeteer from 'puppeteer-core'
const browser = await puppeteer.connect({ browserURL: 'http://localhost:9333', defaultViewport: null })
const w = ms => new Promise(r => setTimeout(r, ms))
const pages = await browser.pages()
console.log(pages.map(p => p.url()))
const page = pages.find(p => /Siraj/.test(p.url()))
const cdp = await page.createCDPSession()
const events = []; cdp.on('Tracing.dataCollected', e => events.push(...e.value))
const done = new Promise(r => cdp.once('Tracing.tracingComplete', r))
try { await cdp.send('Tracing.start', { categories: 'cc,benchmark', transferMode: 'ReportEvents' }) } catch (e) { console.log('start error', e.message) }
await w(1500)
try { await cdp.send('Tracing.end') } catch (e) { console.log('end error', e.message) }
await Promise.race([done, w(15000)])
console.log('events', events.length)
browser.disconnect()
