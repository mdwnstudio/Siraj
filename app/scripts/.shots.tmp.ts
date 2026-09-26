/* Presentation screenshots of every screen, phone and desktop.
   Run with the production preview on :4173:
     npx tsx scripts/.shots.tmp.ts [phone|desktop] [only=<prefix>] */

import fs from 'node:fs'
import path from 'node:path'
import puppeteer, { type Page, type Browser } from 'puppeteer-core'
import { LESSONS } from '../src/core/content/lessons'
import { PATH } from '../src/core/content/path'

const URL0 = 'http://localhost:4173/Siraj/'
const WORKER = 'https://siraj-chat.yosefbore3y.workers.dev'
const OUT = path.resolve('../marketing/screenshots')
const CACHE_FILE = path.resolve('scripts/.ask-cache.tmp.json')
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const args = process.argv.slice(2)
const devices = args.filter((a) => a === 'phone' || a === 'desktop' || a === 'ipad' || a === 'mock')
const only = args.find((a) => a.startsWith('only='))?.slice(5)

const DEVICES = {
  phone: {
    viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  },
  // the phone's app area inside an iPhone frame: 844 minus the 47pt status bar
  mock: {
    viewport: { width: 390, height: 797, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  },
  ipad: {
    viewport: { width: 820, height: 1180, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    ua: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  },
  desktop: {
    viewport: { width: 1440, height: 900, deviceScaleFactor: 2, isMobile: false, hasTouch: false },
    ua: undefined,
  },
} as const
type Dev = keyof typeof DEVICES

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/* ---------- live answers, fetched once and reused on the other device ---------- */
const cache: Record<string, { type: string; body: string }> = fs.existsSync(CACHE_FILE)
  ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) : {}

async function proxyAsk(page: Page) {
  await page.setRequestInterception(true)
  page.on('request', async (req) => {
    if (!req.url().startsWith(WORKER)) return req.continue()
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'POST, OPTIONS' }
    if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: cors, body: '' })
    const q = JSON.parse(req.postData() ?? '{}').question as string
    let hit = cache[q]
    if (!hit) {
      const r = await fetch(WORKER, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'https://mdwnstudio.github.io' },
        body: req.postData(),
      })
      hit = { type: r.headers.get('content-type') ?? 'application/json', body: await r.text() }
      if (r.ok) { cache[q] = hit; fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 1)) }
    } else {
      await sleep(3500) // let the thinking state show, as it would live
    }
    req.respond({ status: 200, headers: { ...cors, 'content-type': hit.type }, body: hit.body })
  })
}

/* ---------- progress fixtures ---------- */
const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })()

function progressUpTo(nodeId: string | null, extra: Record<string, unknown> = {}) {
  const completed: Record<string, unknown> = {}
  if (nodeId) {
    for (const n of PATH) {
      completed[n.id] = { stars: 3, bestAccuracy: 1, at: Date.now() - 86400000 }
      if (n.id === nodeId) break
    }
  }
  return {
    version: 1, onboarded: true, name: 'يوسف', gender: 'm', avatar: 'av-12', banner: 'khatam',
    language: 'ar', xp: 485, streak: 6, lastActiveDay: today, oil: 5, oilUpdatedAt: Date.now(),
    completed,
    achievements: ['first-step', 'flawless', 'full-lamp', 'streak-3', 'unit-intro', 'unit-shahada', 'curious'],
    settings: { sound: true, haptics: true, reduceMotion: false, theme: 'light' },
    ...extra,
  }
}

/* ---------- a session ---------- */
class Shoot {
  n = 0
  page!: Page
  constructor(public browser: Browser, public dev: Dev) {}
  get dir() { return path.join(OUT, this.dev) }

  async open(progress: object | null, scene: string) {
    const ctx = await this.browser.createBrowserContext()
    const page = await ctx.newPage()
    const d = DEVICES[this.dev]
    await page.setViewport(d.viewport)
    if (d.ua) await page.setUserAgent(d.ua)
    await page.evaluateOnNewDocument((p) => {
      if (p) localStorage.setItem('siraj.progress.v1', JSON.stringify(p))
    }, progress as never)
    await proxyAsk(page)
    this.page = page
    await page.goto(URL0, { waitUntil: 'networkidle0' })
    await page.evaluate(() => document.fonts.ready)
    if (scene === 'app') await this.waitFor('.home, .page')
    await sleep(1400)
    return page
  }
  async close() { await this.page.browserContext().close() }

  async shot(name: string) {
    fs.mkdirSync(this.dir, { recursive: true })
    this.n++
    const file = path.join(this.dir, `${String(this.n).padStart(2, '0')}-${name}.png`)
    await this.page.screenshot({ path: file })
    console.log(this.dev, path.basename(file))
  }

  async waitFor(sel: string, timeout = 15000) { await this.page.waitForSelector(sel, { visible: true, timeout }) }

  /** click the first visible element under `sel` whose text is exactly (or contains) `text` */
  async clickText(sel: string, text: string, exact = true) {
    const els = await this.page.$$(sel)
    for (const el of els) {
      const [t, vis] = await el.evaluate((e) => {
        const r = e.getBoundingClientRect()
        return [(e.textContent ?? '').trim(), r.width > 0 && r.height > 0 && !(e as HTMLButtonElement).disabled]
      })
      if (vis && (exact ? t === text : t.includes(text))) { await el.click(); return }
    }
    throw new Error(`no ${sel} with text ${text}`)
  }
  async click(sel: string) {
    await this.waitFor(sel)
    await this.page.click(sel)
  }
  async enter() { await this.page.keyboard.press('Enter') }

  async tab(label: string) {
    const sel = (this.dev === 'phone' || this.dev === 'mock') ? `.nav [aria-label="${label}"]` : `.side [aria-label="${label}"], .side__item`
    if (this.dev === 'phone' || this.dev === 'mock') await this.click(sel)
    else await this.clickText('.side__item', label, false)
    await sleep(900)
  }

  async me() {
    if (this.dev === 'phone' || this.dev === 'mock') await this.click('.nav__item--me')
    else await this.clickText('.side__item', 'يوسف', false)
    await sleep(1100)
  }

  async askWait() {
    // until the thinking bubble is gone and the typewriter has sealed the reply
    await this.page.waitForFunction(() => !document.querySelector('.thinking') && !document.querySelector('.msg__caret'), { timeout: 120000 })
    await sleep(1600)
  }
}

/* ---------- scenarios ---------- */

async function onboarding(s: Shoot) {
  await s.open(null, 'splash').catch(() => {})
  // the splash has already gone by networkidle; reload and catch it
  await s.page.goto(URL0, { waitUntil: 'domcontentloaded' })
  await sleep(700)
  await s.shot('splash')
  await s.waitFor('.ob', 20000)
  await sleep(1500)
  await s.shot('onboarding-1-welcome')
  await s.clickText('.ob__foot button', 'هيّا بنا'); await sleep(1100)
  await s.shot('onboarding-2-language')
  await s.clickText('.ob__foot button', 'متابعة'); await sleep(900)
  await s.page.type('.ob .field', 'يوسف', { delay: 40 }); await sleep(500)
  await s.page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
  await s.shot('onboarding-3-name')
  await s.clickText('.ob__foot button', 'متابعة'); await sleep(900)
  await s.click('.gpick__b'); await sleep(700)
  await s.shot('onboarding-4-gender')
  await s.clickText('.ob__foot button', 'متابعة'); await sleep(1100)
  await s.click('.avpick__b[aria-label="شابّ بنظّارة وقميصٍ خردلي"]'); await sleep(800)
  await s.shot('onboarding-5-avatar')
  await s.clickText('.ob__foot button', 'ابدأ الرحلة'); await sleep(700)
  await s.shot('onboarding-6-ready')
  await s.waitFor('.home', 15000); await sleep(2200)
  await s.shot('home-first-day')
  await s.close()
}

async function home(s: Shoot) {
  await s.open(progressUpTo('n-salah-2'), 'app')
  await s.shot('home-journey')
  // the road ahead, ghosting upward
  await s.page.evaluate(() => { const w = document.querySelector('.stairwrap')!; w.scrollTop -= w.clientHeight * 0.75 })
  await sleep(1400)
  await s.shot('home-road-ahead')
  await s.page.evaluate(() => { const w = document.querySelector('.stairwrap')!; w.scrollTop += w.clientHeight * 1.6 })
  await sleep(1400)
  await s.shot('home-steps-climbed')
  await s.close()

  // everything climbed
  await s.open(progressUpTo(PATH[PATH.length - 1].id, { xp: 1690, streak: 21,
    achievements: ['first-step', 'flawless', 'full-lamp', 'streak-3', 'unit-intro', 'unit-shahada', 'unit-salah', 'unit-zakah', 'unit-sawm', 'unit-hajj', 'curious'] }), 'app')
  await s.shot('home-journey-complete')
  await s.close()

  // dark theme
  await s.open(progressUpTo('n-salah-2', { settings: { sound: true, haptics: true, reduceMotion: false, theme: 'dark' } }), 'app')
  await s.shot('home-dark')
  await s.me()
  await s.shot('profile-dark')
  await s.close()
}

async function chest(s: Shoot) {
  await s.open(progressUpTo('n-zakah-2'), 'app')
  await s.shot('home-chest-ready')
  await s.click('[data-node="n-zakah-chest"] .slab')
  await sleep(450)
  await s.shot('chest-reward')
  await s.waitFor('.opener__stage', 20000)
  await sleep(1700)
  await s.shot('unit-gate-opens')
  await s.close()
}

async function lesson(s: Shoot) {
  const L = LESSONS['l-salah-3']
  await s.open(progressUpTo('n-salah-2'), 'app')
  await s.click('[data-node="n-salah-3"] .slab'); await sleep(900)
  await s.shot('step-sheet')
  await s.clickText('.sheet button', 'ابدأ الدرس')
  await sleep(420)
  await s.shot('lesson-warmup')
  await s.waitFor('.kcard'); await sleep(1000)

  for (let i = 0; i < L.cards.length; i++) {
    const c = L.cards[i]
    const tag = c.kind === 'fact' ? (typeof c.art === 'object' && 'pose' in c.art ? `pose-${c.art.pose}` : 'fact') : c.kind
    await s.shot(`card-${String(i + 1).padStart(2, '0')}-${tag}`)
    if (c.kind === 'fact' && c.term && i < 3) {
      await s.click('.kcard .term'); await sleep(600)
      await s.shot(`card-${String(i + 1).padStart(2, '0')}-term-revealed`)
    }
    await s.enter(); await sleep(i === L.cards.length - 1 ? 1100 : 750)
  }

  const verdict = async (name: string) => { await s.waitFor('.verdict'); await sleep(1000); await s.shot(name) }
  const next = async () => { await s.clickText('.verdict button', '', false); await sleep(900) }

  for (let k = 0; k < L.exercises.length; k++) {
    const ex = L.exercises[k]
    const tag = `ex${k + 1}-${ex.kind}`
    await s.waitFor('.ex'); await sleep(700)
    if (ex.kind === 'order') {
      await s.shot(`${tag}-start`)
      for (const [j, id] of ex.answer.entries()) {
        await s.clickText('.pool .chip:not(.chip--ghost)', ex.items.find((it) => it.id === id)!.label); await sleep(260)
        if (j === 2) { await sleep(400); await s.shot(`${tag}-in-progress`) }
      }
      await sleep(500); await s.shot(`${tag}-ready-to-check`)
      await s.enter(); await verdict(`${tag}-correct`)
    } else if (ex.kind === 'match') {
      await s.shot(`${tag}-start`)
      for (const [j, p] of ex.pairs.entries()) {
        await s.clickText('.match__col:first-child .tile', p.left); await sleep(250)
        if (j === 2) { await sleep(300); await s.shot(`${tag}-in-progress`) }
        await s.clickText('.match__col:last-child .tile', p.right); await sleep(450)
      }
      await verdict(`${tag}-correct`)
    } else if (ex.kind === 'sort') {
      await sleep(600); await s.shot(`${tag}-start`)
      for (let j = 0; j < ex.items.length; j++) {
        // the top card is drawn last
        const top = await s.page.$$eval('.sort__card', (els) => (els.at(-1)?.textContent ?? '').trim())
        const b = ex.items.find((it) => it.label === top)!.bucket
        await s.clickText('.bucket', ex.buckets.find((x) => x.id === b)!.label); await sleep(650)
        if (j === 1) { await sleep(300); await s.shot(`${tag}-in-progress`) }
      }
      await verdict(`${tag}-correct`)
    } else if (ex.kind === 'choice') {
      await s.clickText('.choices .tile', ex.options.find((o) => o.id === ex.answerId)!.label); await sleep(500)
      await s.shot(`${tag}-selected`)
      await s.enter(); await verdict(`${tag}-correct`)
    } else if (ex.kind === 'boolean') {
      // the one deliberate slip: shows the lamp losing a drop
      await s.clickText('.bools .tile', ex.answer ? 'خطأ' : 'صح'); await sleep(500)
      await s.shot(`${tag}-selected`)
      await s.enter(); await sleep(250)
      await s.shot(`${tag}-oil-drains`)
      await verdict(`${tag}-wrong`)
    }
    await next()
  }

  // اسأل سراج, end of lesson
  await s.waitFor('.ask__head'); await sleep(1200)
  await s.shot('lesson-ask-start')
  await s.click('.ask__pills .pill'); await sleep(350)
  await s.shot('lesson-ask-thinking')
  await s.askWait()
  await s.shot('lesson-ask-suggested-answer')
  await s.page.type('.ask__input', 'ماذا أقول في الركوع؟', { delay: 25 }); await sleep(400)
  await s.shot('lesson-ask-typing')
  await s.enter(); await sleep(2600)
  await s.shot('lesson-ask-searching')
  await s.askWait()
  await s.page.evaluate(() => { const t = document.querySelector('.ask__thread')!; const q = [...t.querySelectorAll('.msg-row--me')].at(-1) as HTMLElement; t.scrollTop = q.offsetTop - 8 })
  await sleep(500)
  await s.shot('lesson-ask-live-answer')

  await s.clickText('.ask__finish button', 'تابع')
  await s.waitFor('.result'); await sleep(900)
  await s.shot('result-celebration')
  await sleep(2400)
  await s.shot('result-summary')
  await s.clickText('.result button', 'تابِع الصعود')
  await sleep(1100)
  await s.shot('home-next-step-lights')
  await s.close()
}

async function listAndScene(s: Shoot) {
  // the five pillars list card and a unit-scene card, from other lessons
  for (const [node, want] of [['n-intro-2', ['list']], ['n-shahada-1', ['scene', 'list']]] as const) {
    const L = LESSONS[PATH.find((n) => n.id === node)!.lessonId!]
    const prev = PATH[PATH.findIndex((n) => n.id === node) - 1].id
    await s.open(progressUpTo(prev), 'app')
    await s.click(`[data-node="${node}"] .slab`); await sleep(800)
    await s.clickText('.sheet button', 'ابدأ الدرس')
    await s.waitFor('.kcard'); await sleep(1000)
    for (let i = 0; i < L.cards.length; i++) {
      const hasScene = await s.page.$('.kcard .scene')
      if (L.cards[i].kind === 'list' && (want as readonly string[]).includes('list')) await s.shot(`card-list-${L.id}`)
      else if (hasScene && (want as readonly string[]).includes('scene')) await s.shot(`card-scene-${L.id}`)
      await s.enter(); await sleep(800)
    }
    await s.close()
  }
}

async function tabs(s: Shoot) {
  await s.open(progressUpTo('n-salah-2'), 'app')
  await s.tab('المراجعة'); await s.shot('tab-review')
  await s.tab('الإنجازات'); await s.shot('tab-achievements')
  await s.tab('اسأل سراج'); await sleep(600); await s.shot('tab-ask-siraj')

  await s.close()

  // one question per fresh chat, so each answer reads with its question above it
  const qs = [
    ['ask-why-takbir', 'لماذا نبدأ الصلاة بقول الله أكبر؟'],
    ['ask-rakaat-fajr', 'كم عدد ركعات صلاة الفجر؟'],
    ['ask-off-topic-refused', 'من سيفوز بكأس العالم القادم؟'],
  ]
  for (const [name, q] of qs) {
    await s.open(progressUpTo('n-salah-2'), 'app')
    await s.tab('اسأل سراج'); await sleep(600)
    await s.page.type('.ask__input', q, { delay: 20 })
    await s.enter(); await sleep(2000)
    if (name === qs[0][0]) await s.shot('tab-ask-siraj-searching')
    await s.askWait()
    await s.page.evaluate(() => { const t = document.querySelector('.ask__thread'); if (t) t.scrollTop = 0 })
    await sleep(500)
    await s.shot(`tab-${name}`)
    await s.close()
  }

  await s.open(progressUpTo('n-salah-2'), 'app')
  await s.me()
  await s.shot('profile')
  await s.page.evaluate(() => { const p = document.querySelector('.page')!; p.scrollTop = p.scrollHeight })
  await sleep(700)
  await s.shot('profile-settings')
  await s.page.evaluate(() => { const p = document.querySelector('.page')!; p.scrollTop = 0 })
  await sleep(500)
  await s.click('.profile__edit'); await sleep(900)
  await s.shot('profile-edit-sheet')
  await s.close()
}

/* four for the iPad: the stair, a posture card, an exercise, a live answer */
async function ipad(s: Shoot) {
  await s.open(progressUpTo('n-salah-2'), 'app')
  await s.shot('home-journey')
  await s.click('[data-node="n-salah-3"] .slab'); await sleep(800)
  await s.clickText('.sheet button', 'ابدأ الدرس')
  await s.waitFor('.kcard'); await sleep(1000)
  for (let i = 0; i < 3; i++) { await s.enter(); await sleep(750) }
  await s.shot('card-pose-qiyam')
  const L = LESSONS['l-salah-3']
  for (let i = 3; i < L.cards.length; i++) { await s.enter(); await sleep(650) }
  await sleep(500)
  const order = L.exercises[0]
  if (order.kind !== 'order') throw new Error('expected order first')
  for (const id of order.answer) { await s.clickText('.pool .chip:not(.chip--ghost)', order.items.find((it) => it.id === id)!.label); await sleep(220) }
  await s.enter(); await s.waitFor('.verdict'); await sleep(900)
  await s.clickText('.verdict button', '', false); await sleep(1000)
  const match = L.exercises[1]
  if (match.kind !== 'match') throw new Error('expected match second')
  for (const p of match.pairs.slice(0, 2)) {
    await s.clickText('.match__col:first-child .tile', p.left); await sleep(250)
    await s.clickText('.match__col:last-child .tile', p.right); await sleep(500)
  }
  await s.clickText('.match__col:first-child .tile', match.pairs[2].left); await sleep(500)
  await s.shot('exercise-match')
  await s.close()

  await s.open(progressUpTo('n-salah-2'), 'app')
  await s.tab('اسأل سراج'); await sleep(600)
  await s.page.type('.ask__input', 'كم عدد ركعات صلاة الفجر؟', { delay: 20 })
  await s.enter(); await s.askWait()
  await s.page.evaluate(() => { const t = document.querySelector('.ask__thread'); if (t) t.scrollTop = 0 })
  await sleep(500)
  await s.shot('ask-siraj-live-answer')
  await s.close()
}

const SCENES: [string, (s: Shoot) => Promise<void>][] = [
  ['onboarding', onboarding], ['home', home], ['chest', chest], ['lesson', lesson],
  ['cards', listAndScene], ['tabs', tabs], ['ipad', ipad],
]

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--lang=ar', '--hide-scrollbars'] })
for (const dev of (devices.length ? devices : ['phone', 'desktop']) as Dev[]) {
  const s = new Shoot(browser, dev)
  for (const [name, run] of SCENES) {
    if (only && !name.startsWith(only)) continue
    if ((dev === 'ipad') !== (name === 'ipad')) continue
    s.n = { onboarding: 0, home: 10, chest: 20, lesson: 30, cards: 80, tabs: 85, ipad: 0 }[name]!
    try { await run(s) } catch (e) { console.error(dev, name, 'FAILED:', (e as Error).message); await s.page?.browserContext().close().catch(() => {}) }
  }
}
await browser.close()
