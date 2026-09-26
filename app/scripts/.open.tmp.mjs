import puppeteer from 'puppeteer-core'
const browser = await puppeteer.connect({ browserURL: 'http://localhost:9333', defaultViewport: null, protocolTimeout: 20000 })
const w = ms => new Promise(r => setTimeout(r, ms))
const pages = await browser.pages()
const progress = await pages.find(p => p.url().startsWith('https://mdwnstudio.github.io/Siraj')).evaluate(() => localStorage.getItem('siraj.progress.v1'))
const p = pages.find(p => p.url().startsWith('http://localhost:4176'))
await p.evaluate(v => {
  localStorage.setItem('siraj.progress.v1', v)
  const set = Storage.prototype.setItem
  Storage.prototype.setItem = function (k, val) { if (k !== 'siraj.progress.v1') set.call(this, k, val) } // this page may not overwrite it on the way out
  location.reload()
}, progress)
await w(5000)
const p2 = (await browser.pages()).find(p => p.url().startsWith('http://localhost:4176'))
console.log(await p2.evaluate(() => ({ native: !!document.querySelector('.stairwrap--native'), onb: JSON.parse(localStorage.getItem('siraj.progress.v1')).onboarded })))
browser.disconnect()
