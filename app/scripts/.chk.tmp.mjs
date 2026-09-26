import puppeteer from 'puppeteer-core'
const browser = await puppeteer.connect({ browserURL: 'http://localhost:9333', defaultViewport: null, protocolTimeout: 20000 })
const p = (await browser.pages()).find(p => p.url().startsWith('http://localhost:4176'))
console.log(await p.evaluate(() => ({ visible: document.visibilityState, rm: JSON.parse(localStorage.getItem('siraj.progress.v1')).settings, calm: !!document.querySelector('.calm'), native: !!document.querySelector('.stairwrap--native'), anims: document.getAnimations().filter(a => a.timeline?.constructor.name === 'ScrollTimeline').length })))
browser.disconnect()
