import puppeteer from 'puppeteer-core'
const [src, out] = process.argv.slice(2)
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--allow-file-access-from-files'] })
const p = await b.newPage()
await p.setViewport({ width: Number(process.env.W ?? 2400), height: Number(process.env.H ?? 2600), deviceScaleFactor: Number(process.env.DPR ?? 1) })
await p.goto('file://' + src, { waitUntil: 'networkidle0' })
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: out })
await b.close()
