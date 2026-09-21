import { memo, useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { UNITS } from '../../core/content/path'
import { Crescent, Lantern } from '../icons/SirajIcons'
import { sampleScrollFrame } from '../perf'

/* An elevated camera: every building shares the same two ground-plane axes.
 * Roofs and courtyard tops are real vector faces, not a skew of a flat picture.
 */
function Block({ x, y, w, d, h, roof = 'var(--land-light)', wall = 'var(--land-stone)' }: {
  x: number; y: number; w: number; d: number; h: number; roof?: string; wall?: string
}) {
  const a = `${x},${y - h}`
  const b = `${x + w},${y + w * .48 - h}`
  const c = `${x + w - d},${y + (w + d) * .48 - h}`
  const e = `${x - d},${y + d * .48 - h}`
  return <g strokeLinejoin="round">
    <path d={`M${e}L${c}v${h}l${-w},${-w * .48}Z`} fill={wall} />
    <path d={`M${b}L${c}v${h}l${d},${-d * .48}Z`} fill="var(--land-shadow)" />
    <path d={`M${a}L${b}L${c}L${e}Z`} fill={roof} />
    <path d={`M${e}L${c}L${b}`} fill="none" stroke={roof} strokeWidth="2" opacity=".7" />
  </g>
}

function Palm({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cx="21" cy="11" rx="37" ry="10" fill="var(--land-shadow)" opacity=".24" transform="rotate(24 21 11)" />
    <path d="M-4 0Q8-39 0-77L7-79Q18-36 5 3Z" fill="var(--land-shadow)" />
    <path d="M4-73Q-33-112-48-85Q-27-88 4-73M4-73Q20-113 48-91Q24-92 4-73M4-73Q-34-85-46-49Q-15-71 4-73M4-73Q45-84 57-51Q29-68 4-73M4-73Q-7-113 13-120Q16-93 4-73M4-73Q-7-53 14-39Q21-61 4-73" fill="var(--land-leaf)" />
    <path d="M4-73-29-89M4-73 33-91M4-73 37-62" stroke="var(--land-light)" strokeWidth="2" opacity=".45" />
    <path d="m7-23 7-3m-5-16 7-3" stroke="var(--land-stone)" strokeWidth="3" />
  </g>
}

function Gateway({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <Block x={0} y={0} w={93} d={53} h={14} />
    <Block x={5} y={-13} w={18} d={25} h={100} />
    <Block x={72} y={19} w={18} d={25} h={100} />
    <Block x={5} y={-93} w={85} d={25} h={26} />
    <g transform="matrix(1 .48 0 1 -20 -1)">
      <path d="M0 0V-100H85V0H67V-53Q67-66 42.5-83Q18-66 18-53V0Z" fill="var(--land-stone)" />
      <path d="M18-4V-53Q18-66 42.5-83Q67-66 67-53V-4" fill="none" stroke="var(--land-light)" strokeWidth="3" opacity=".65" />
    </g>
    <Block x={1} y={-111} w={94} d={30} h={8} roof="var(--land-accent)" />
  </g>
}

function House({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <Block x={0} y={0} w={66} d={50} h={59} />
    <path d="M-40-33 6-11 6 23-40 1Z" fill="var(--land-stone)" />
    <path d="m-20-10 16 8v22l-16-8Z" fill="var(--land-recess)" />
    <path d="m29-13 15-7v17l-15 7Z" fill="var(--land-glow)" />
    <path d="M-39-37V-50L0-69 56-42 16-23Z" fill="var(--land-shadow)" />
    <path d="M-31-48 0-63 49-40 18-25Z" fill="var(--land-light)" />
    <path d="M-40-38 17-11 66-35" fill="none" stroke="var(--land-light)" strokeWidth="6" />
  </g>
}

function Mosque() {
  return <g>
    <Block x={342} y={220} w={104} d={97} h={17} />
    <Block x={348} y={210} w={77} d={71} h={58} />
    <path d="m285 200 13 6v28l-13-6Zm23 11 13 6v28l-13-6Zm23 11 13 6v28l-13-6Z" fill="var(--land-recess)" />
    <path d="m382 206 13-7v29l-13 7Zm22-11 13-7v29l-13 7Z" fill="var(--land-recess)" />
    <ellipse cx="350" cy="173" rx="37" ry="19" fill="var(--land-shadow)" />
    <path d="M313 165Q312 128 349 113Q387 129 387 165Q351 192 313 165Z" fill="var(--land-accent)" />
    <path d="M349 113Q325 142 335 178Q317 174 313 165Q312 128 349 113Z" fill="var(--land-light)" opacity=".55" />
    <ellipse cx="350" cy="171" rx="39" ry="17" fill="none" stroke="var(--land-light)" strokeWidth="4" />
    <path d="M349 114V102" stroke="var(--land-accent)" strokeWidth="3" strokeLinecap="round" />
    <Block x={412} y={186} w={16} d={17} h={118} />
    <Block x={411} y={87} w={24} d={24} h={8} roof="var(--land-accent)" />
    <Block x={412} y={67} w={15} d={15} h={23} />
    <path d="M396 47 410 17 428 46 411 55Z" fill="var(--land-accent)" />
    <path d="M396 47 410 17 411 55Z" fill="var(--land-light)" opacity=".5" />
  </g>
}

function Landmark({ unitId }: { unitId: string }) {
  switch (unitId) {
    case 'u-intro': return <>
      <Block x={352} y={236} w={129} d={106} h={29} />
      <Gateway x={359} y={216} scale={1.06} />
      <Block x={24} y={239} w={78} d={54} h={21} />
      <Palm x={30} y={237} scale={.87} />
      <g transform="translate(297 233)" color="var(--land-accent)"><Lantern size={24} /></g>
    </>
    case 'u-shahada': return <>
      <Block x={40} y={210} w={100} d={95} h={32} />
      <Gateway x={45} y={191} scale={.96} />
      <Block x={394} y={234} w={101} d={75} h={25} />
      <Gateway x={405} y={215} scale={.68} />
      <Palm x={359} y={271} scale={.57} />
    </>
    case 'u-salah': return <>
      <Mosque />
      <Block x={38} y={238} w={73} d={69} h={22} />
      <path d="m-18 258 48-23 57 27-48 23Z" fill="var(--land-water)" stroke="var(--land-light)" strokeWidth="5" />
      <ellipse cx="35" cy="258" rx="20" ry="9" fill="var(--land-shadow)" />
      <path d="M34 257V236" stroke="var(--land-light)" strokeWidth="6" />
      <ellipse cx="34" cy="235" rx="15" ry="7" fill="var(--land-water)" stroke="var(--land-light)" strokeWidth="4" />
      <Palm x={8} y={230} scale={.72} />
    </>
    case 'u-zakah': return <>
      <Block x={371} y={218} w={115} d={97} h={26} />
      <House x={404} y={198} scale={1.03} /><House x={347} y={232} scale={.8} />
      <Block x={35} y={233} w={93} d={80} h={23} roof="var(--land-leaf)" />
      <path d="m-34 258 59-28m-38 39 60-29m-39 39 60-29" stroke="var(--land-light)" strokeWidth="3" opacity=".6" />
      <Palm x={16} y={235} scale={1.03} /><Palm x={79} y={264} scale={.66} />
      <Block x={334} y={291} w={25} d={22} h={17} roof="var(--land-accent)" />
      <path d="m314 288 23 11m-20-4 20 10" stroke="var(--land-light)" strokeWidth="3" />
    </>
    case 'u-sawm': return <>
      <Block x={32} y={232} w={94} d={86} h={25} />
      <House x={33} y={204} scale={1.08} />
      <Block x={391} y={218} w={117} d={98} h={25} />
      <House x={423} y={206} scale={1.15} />
      <path d="M318 172Q355 219 405 210" stroke="var(--land-shadow)" strokeWidth="2" />
      {[329, 360, 389].map((x, i) => <g key={x} transform={`translate(${x} ${183 + i * 10})`} color="var(--land-glow)"><Lantern size={16} /></g>)}
      <Block x={337} y={268} w={42} d={26} h={21} roof="var(--land-accent)" />
      <ellipse cx="342" cy="259" rx="12" ry="5" fill="var(--land-light)" transform="rotate(25 342 259)" />
      <path d="m338 257 8 4" stroke="var(--land-recess)" strokeWidth="4" strokeLinecap="round" />
      <path d="m358 262-2-12 8 3-1 12Z" fill="var(--land-water)" />
      <Palm x={6} y={264} scale={.64} />
    </>
    case 'u-hajj': return <>
      <Block x={354} y={218} w={125} d={111} h={30} />
      <path d="m258 257 88-42 107 52-88 42Z" fill="var(--land-light)" />
      <path d="m275 258 70-33 91 43-70 33Z" stroke="var(--land-stone)" strokeWidth="2" />
      <Block x={351} y={223} w={66} d={62} h={80} roof="var(--land-kaaba-top)" wall="var(--land-kaaba-side)" />
      <path d="m355 204 62-30v80l-62 30Z" fill="var(--land-kaaba)" />
      <path d="m289 189 66 32 62-30v10l-62 30-66-32Z" fill="var(--land-glow)" />
      <path d="m387 224 14-7v25l-14 7Z" fill="var(--land-glow)" />
      <Block x={15} y={229} w={81} d={67} h={24} />
      <Palm x={34} y={248} scale={.84} />
    </>
    default: return null
  }
}

/** the stepped ground every unit's buildings stand on */
function Ground() {
  return <>
    <path d="M-80 198 64 129 201 196 313 143 544 255 395 327 255 260 131 320Z" fill="var(--land-ground)" />
    <path d="M-80 198 131 320v45L-80 243ZM131 320 255 260 395 327 544 255V300L395 372 255 305 131 365Z" fill="var(--land-dune)" />
    <path d="m-60 204 191 92 124-60 140 67 129-62" stroke="var(--land-light)" strokeWidth="3" />
    <path d="m-5 182 109 53-47 23m243-60 126 61m-43-82-42 20m48 0-42 20M30 291l33-16" stroke="var(--land-shadow)" strokeWidth="2" opacity=".25" />
  </>
}

/** A teaching card's header: the unit's own world in miniature, with an
 * actor (Siraj or the card's icon) standing on the open ground in the middle. */
export const UnitScene = memo(function UnitScene({ unitId, children }: { unitId: string; children?: ReactNode }) {
  return <div className={`scene landscape--${unitId}`}>
    <svg className="scene__art" viewBox="0 40 460 330" fill="none" focusable="false" aria-hidden="true">
      <Ground />
      <Landmark unitId={unitId} />
    </svg>
    {children && <div className="scene__actor">{children}</div>}
  </div>
})

export const PathLandscape = memo(function PathLandscape({
  unitId, flat = false, dark = false,
}: {
  unitId: string
  flat?: boolean
  dark?: boolean
}) {
  if (flat) {
    const src = `${import.meta.env.BASE_URL}img/path/${unitId}-${dark ? 'dark' : 'light'}.webp`
    return (
      <div className={`landscape landscape--baked landscape--${unitId}`} aria-hidden="true">
        {/* the camera moves the <img> itself, so Chrome can hand the decoded
            picture to the GPU as it is instead of painting it into tiles.
            Loaded up front and decoded with its tile: a lazy or async picture
            is drawn empty mid-scroll on a slow phone and pops in a beat later. */}
        <img className="landscape__baked" src={src} alt="" width="1035" height="625" decoding="sync" data-persp />
      </div>
    )
  }
  const night = unitId === 'u-sawm'
  return <div className={`landscape landscape--${unitId}`} data-persp aria-hidden="true">
    {/* the soft edges live on this inner box, not on the moving one: when
        nothing inside is composited (html.lite) the mask is painted once
        into the island's texture instead of re-applied every frame */}
    <div className="landscape__view">
    <div className="landscape__far" data-depth="0.4">
      <svg viewBox="0 0 460 380" fill="none" focusable="false">
        <path d="M-110 103 39 31 155 87 6 159ZM320 112 471 40 572 89 421 161Z" fill="var(--land-hill)" />
        <path d="m-110 103 116 56v90l-116-56Zm116 56 149-72v90L6 249ZM320 112l101 49v83l-101-49Zm101 49 151-72v83l-151 72Z" fill="var(--land-dune)" />
        <path d="M-60 335 105 256 226 314 61 393ZM328 348 460 285 565 335 432 399Z" fill="var(--land-hill)" />
        {night && <g color="var(--land-glow)" transform="translate(331 42)"><Crescent size={31} /></g>}
      </svg>
    </div>
    <div className="landscape__architecture" data-depth="0.24">
      <svg viewBox="0 0 460 380" fill="none" focusable="false">
        <Ground />
        <Landmark unitId={unitId} />
      </svg>
    </div>
    </div>
  </div>
})

/* ---------------- the open sky behind every unit ----------------
 * Cloud banks are plain tiled images, one drawing per theme, picked in CSS.
 * (They were alpha masks over a --cloud fill, which cost a masked render
 * pass per bank on every scrolled frame.) Each bank scrolls at its own
 * fraction of the path's speed; the smaller the fraction, the further away
 * it reads.
 */
const puff = (x: number, y: number, s: number) =>
  `<g transform='translate(${x} ${y}) scale(${s})'><circle cx='30' cy='26' r='18'/><circle cx='54' cy='17' r='24'/><circle cx='80' cy='27' r='16'/><rect x='10' y='24' width='90' height='20' rx='10'/></g>`

// the fills match the old --cloud values: white by day, a faint warm haze by night
const CLOUD_FILL = { light: "fill='#FFFFFF'", dark: "fill='rgb(255,236,220)' fill-opacity='.09'" }
type Puffs = [number, number, number][]

const bank = (w: number, h: number, puffs: Puffs, theme: keyof typeof CLOUD_FILL) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' width='${w}' height='${h}' ${CLOUD_FILL[theme]}>${puffs.map(p => puff(...p)).join('')}</svg>`)}")`

const CLOUD_BANKS = ([
  { id: 'far', speed: 0.05, w: 360, h: 560, puffs: [[18, 50, .42], [248, 150, .34], [120, 300, .5], [276, 420, .38], [8, 470, .3]] },
  { id: 'mid', speed: 0.16, w: 380, h: 780, puffs: [[6, 90, .8], [262, 250, .66], [60, 470, .92], [272, 650, .7]] },
  { id: 'near', speed: 0.34, w: 400, h: 1040, puffs: [[2, 170, 1.3], [250, 540, 1.2], [12, 880, 1.1]] },
] as { id: string; speed: number; w: number; h: number; puffs: Puffs }[]).map(b => ({
  ...b,
  style: {
    ['--cloud-day' as string]: bank(b.w, b.h, b.puffs, 'light'),
    ['--cloud-night' as string]: bank(b.w, b.h, b.puffs, 'dark'),
  },
}))

export const PathSky = memo(function PathSky({ skyRef, fog = false }: { skyRef?: RefObject<HTMLDivElement | null>; fog?: boolean }) {
  return <div className={fog ? 'sky sky--fog' : 'sky'} ref={skyRef} aria-hidden="true">
    <div className="sky__high" />
    <div className="sky__sun" />
    {CLOUD_BANKS.map(b => (
      <div key={b.id} className={`sky__clouds sky__clouds--${b.id}`}
        data-speed={b.speed} data-ratio={b.h / b.w} style={b.style} />
    ))}
  </div>
})

/* ---------------- the camera ----------------
 * The path is a road climbing away from you, seen from above. Each tagged
 * element ([data-persp]) is projected by its distance v above the anchor line:
 * screen height p = D·v / (v + D), size s = D / (v + D). Things ahead shrink,
 * bunch together and fade toward a horizon D above the anchor; things you
 * have passed grow as they slide out below. Layout never changes, only
 * transforms, so scrolling stays one composite per frame.
 */
const ANCHOR = 0.74 // where on screen things are life-size, as a fraction of height
const DEPTH = 1.25 // horizon distance, as a multiple of height

/* The stair lives in a sticky stage and is moved by paint() alone. If the
 * browser scrolled it natively, the compositor would move it one frame and
 * the camera would correct it the next, and that disagreement reads as a wobble.
 * The spacer beside the stage gives the scroller its height.
 */
const layoutTop = (el: HTMLElement, stair: HTMLElement) => {
  let y = 0
  for (let n: HTMLElement | null = el; n && n !== stair; n = n.offsetParent as HTMLElement | null) y += n.offsetTop
  return y
}

const sizeSpacer = (root: HTMLElement, stair: HTMLElement) => {
  const spacer = root.querySelector<HTMLElement>('.stair-spacer')
  if (spacer) spacer.style.height = `${Math.max(0, stair.offsetHeight - root.clientHeight)}px`
}

/** Scroll so a step stands just below the life-size line, where Siraj waits beside it. */
export function focusStep(root: HTMLElement | null, el: HTMLElement | null) {
  const stair = root?.querySelector<HTMLElement>('.stair')
  if (!root || !stair || !el) return
  sizeSpacer(root, stair)
  // the ground camera's scroller reaches past the view above and below
  const line = root.classList.contains('stairwrap--ground')
    ? groundLine(root.parentElement!.clientHeight)
    : root.clientHeight * (ANCHOR - 0.04)
  root.scrollTop = layoutTop(el, stair) + el.offsetHeight / 2 - line
}

/* The fog. Full mode masks the whole stage with this ramp; lite fades each
 * body by where its centre lands instead, which is composite-only. Stops
 * are [fraction of the view's height from the top, opacity], and must
 * match the .stage mask in app.css. */
const FOG: [number, number][] = [[0.04, 0], [0.2, 0.28], [0.36, 0.7], [0.52, 1]]
const fog = (f: number) => {
  if (f <= FOG[0][0]) return 0
  for (let i = 1; i < FOG.length; i++) {
    const [b, ob] = FOG[i]
    if (f <= b) {
      const [a, oa] = FOG[i - 1]
      return oa + ((f - a) / (b - a)) * (ob - oa)
    }
  }
  return 1
}

/* ---------------- the ground camera (phones) ----------------
 * The road is laid on a real ground plane: the scroller itself is tilted
 * back in CSS 3D, and the browser scrolls it natively. Things ahead recede
 * toward a horizon and things passed grow as they slide out, with no
 * script, no animation and no style write per frame, so a busy main thread
 * cannot stall or desync any of it.
 *
 * Both earlier phone cameras failed on a real budget phone. The JS camera
 * froze the road whenever the main thread was busy. Scroll-linked
 * animations (ScrollTimeline) looked composited but still waited on the
 * main thread, so over a native scroll every body lagged and then
 * rubber-banded into place.
 *
 * The plane foreshortens: distant treads flatten as well as shrink. Each
 * body is stretched by 1/cos(tilt) so it reads life-size at the anchor
 * line, where you stand.
 */
// these must match .stairwrap--ground in app.css
const TILT_RAD = (50 * Math.PI) / 180 // how far the road leans back
const PERSP = 1.0 // viewer distance, as a multiple of the view's height
const REACH_UP = 1.3 // extra plane above the view: the road runs on into the fog

/** where the ground scroller puts a step to focus it, in its own box */
const groundLine = (hv: number) => hv * REACH_UP + hv * (ANCHOR - 0.04)

/** how far up the tilted plane a point appears p px above the anchor line */
const planeDistance = (p: number, hv: number) => {
  const P = PERSP * hv
  return (p * P) / (Math.cos(TILT_RAD) * P - p * Math.sin(TILT_RAD))
}

function groundCamera(root: HTMLElement, stair: HTMLElement, onUnit: (unitId: string) => void) {
  const home = root.parentElement!
  const sections = Array.from(root.querySelectorAll<HTMLElement>('.path-unit'))
  // The sky and its fog copy both cool from dawn to blue as you climb, in
  // twenty small steps written from a scroll listener. Neither layer is
  // composited, so each is one still texture on every scrolled frame, and a
  // step repaints them once. An opacity animation here (a scroll timeline)
  // kept both full-screen layers, and the fog's masks, blending on every
  // frame: more than a budget phone's GPU can fill at 90Hz, so the whole
  // road stuttered on the real phone while the emulator, drawing on the
  // host's GPU, stayed smooth.
  const highs = Array.from(home.querySelectorAll<HTMLElement>('.sky__high'))
  let watch: IntersectionObserver | null = null
  let shownUnit = ''
  let shownOp = ''
  let max = 1
  let queued = 0

  const paintSky = () => {
    queued = 0
    const op = (Math.round((1 - root.scrollTop / max) * 20) / 20).toFixed(2)
    if (op === shownOp) return
    shownOp = op
    for (const high of highs) high.style.opacity = op
  }
  const onScroll = () => { if (!queued) queued = requestAnimationFrame(paintSky) }
  root.addEventListener('scroll', onScroll, { passive: true })

  const build = () => {
    const hv = home.clientHeight
    // where the life-size line sits in the scroller's own box
    const anchor = hv * REACH_UP + hv * ANCHOR
    max = Math.max(1, root.scrollHeight - root.clientHeight)
    paintSky()

    // The banner names whichever unit is under the middle of the screen. On
    // the plane that is a fixed line in the scroller's box, so a one-pixel
    // band on an IntersectionObserver finds it with no script per scroll.
    watch?.disconnect()
    const line = Math.round(anchor - planeDistance(hv * (ANCHOR - 0.5), hv))
    watch = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.unit ?? ''
        if (entry.isIntersecting && id !== shownUnit) { shownUnit = id; onUnit(id) }
      }
    }, { root, rootMargin: `${-line}px 0px ${line + 1 - root.clientHeight}px 0px` })
    for (const section of sections) watch.observe(section)
  }

  let pending = 0
  const rebuild = () => {
    if (pending) return
    pending = requestAnimationFrame(() => { pending = 0; build() })
  }
  const observer = new ResizeObserver(rebuild)
  observer.observe(home)
  observer.observe(stair)
  build()
  let alive = true
  document.fonts?.ready.then(() => { if (alive) rebuild() })
  return () => {
    alive = false
    cancelAnimationFrame(pending)
    cancelAnimationFrame(queued)
    observer.disconnect()
    watch?.disconnect()
    root.removeEventListener('scroll', onScroll)
    for (const high of highs) high.style.opacity = ''
  }
}

/** One passive listener, no React updates per frame, and no idle animation loop.
 * Geometry is cached on resize, and a style is only written when its value
 * changed, so a still body costs nothing on a scrolled frame.
 */
export function useLandscapeParallax(
  scroller: RefObject<HTMLDivElement | null>,
  calm: boolean,
  {
    sky, onUnit, lite = false, ground = false,
  }: {
    sky?: RefObject<HTMLDivElement | null>
    onUnit?: (unitId: string) => void
    lite?: boolean
    /** lay the road on a tilted plane and let the browser scroll it (phones) */
    ground?: boolean
  } = {},
) {
  const frame = useRef(0)
  const unitCb = useRef(onUnit)
  unitCb.current = onUnit
  useEffect(() => {
    const root = scroller.current
    const stair = root?.querySelector<HTMLElement>('.stair')
    if (!root || !stair) return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (ground) return groundCamera(root, stair, u => unitCb.current?.(u))
    const wide = window.matchMedia('(min-width: 700px)')
    const sections = Array.from(root.querySelectorAll<HTMLElement>('.path-unit'))
    const scenes = sections.map(section => ({
      section, top: 0, height: 0, unit: section.dataset.unit ?? '',
      layers: Array.from(section.querySelectorAll<HTMLElement>('[data-depth]')).map(element => ({
        element, depth: Number(element.dataset.depth), tf: '',
      })),
    }))
    const bodies = Array.from(root.querySelectorAll<HTMLElement>('[data-persp]')).map(element => ({
      element, top: 0, mid: 0, dx: Number(element.dataset.dx ?? 0),
      step: element.classList.contains('step'),
      tf: '', vis: '', op: '', wc: '',
    }))
    type Body = (typeof bodies)[number]
    const put = (body: Body, tf: string, vis: string, op: string, wc: string) => {
      const st = body.element.style
      if (tf !== body.tf) { st.transform = tf; body.tf = tf }
      if (vis !== body.vis) { st.visibility = vis; body.vis = vis }
      if (op !== body.op) { st.opacity = op; body.op = op }
      if (wc !== body.wc) { st.willChange = wc; body.wc = wc }
    }
    const skyEl = sky?.current
    const high = skyEl?.querySelector<HTMLElement>('.sky__high')
    const banks = Array.from(skyEl?.querySelectorAll<HTMLElement>('[data-speed]') ?? []).map(element => ({
      element, speed: Number(element.dataset.speed), ratio: Number(element.dataset.ratio), tile: 1, tf: '',
    }))
    let height = root.clientHeight
    let maxScroll = 1
    let shownUnit = ''
    let highOp = ''
    const paint = (now?: number) => {
      frame.current = 0
      if (now !== undefined) sampleScrollFrame(now)
      const scroll = root.scrollTop
      const reduced = calm || media.matches
      stair.style.transform = `translate3d(0,${-scroll}px,0)`
      const anchor = height * ANCHOR
      const D = height * DEPTH
      // the banner names whichever unit is under the middle of the screen, in road coordinates
      const pMid = anchor - height * 0.5
      const probe = scroll + anchor - (reduced ? pMid : (pMid * D) / (D - pMid))
      for (const scene of scenes) {
        if (probe >= scene.top && probe < scene.top + scene.height) {
          if (scene.unit !== shownUnit) { shownUnit = scene.unit; unitCb.current?.(scene.unit) }
          break
        }
      }
      // 0 at the first step, 1 at the last: the sky cools from dawn to open blue as you climb
      const op = (1 - scroll / maxScroll).toFixed(2)
      if (high && op !== highOp) { high.style.opacity = op; highOp = op }
      for (const bank of banks) {
        const tf = reduced ? '' : `translate3d(0,${(-((scroll * bank.speed) % bank.tile)).toFixed(1)}px,0)`
        if (tf !== bank.tf) { bank.element.style.transform = tf; bank.tf = tf }
      }
      for (const body of bodies) {
        if (reduced) {
          const y = body.mid - scroll
          put(body, body.step ? `translateX(${body.dx}px)` : '', '', lite ? fog(y / height).toFixed(2) : '', 'auto')
          continue
        }
        // Compute each body every frame, but only promote and write the ones
        // close enough to appear. This keeps the road continuous without
        // reserving a texture for every step on a small GPU.
        const y = body.mid - scroll
        const v = anchor - y
        // passed and gone below the fold (the second test keeps v + D well above zero on short screens)
        const gone = y > height + 400 || v < -D * 0.8
        if (gone) { put(body, body.tf, 'hidden', body.op, 'auto'); continue }
        const s = D / (v + D)
        const screenY = anchor - v * s
        // Only nearby bodies need their own GPU layer. Keeping the whole road
        // promoted exhausted tile memory on mid-range Android GPUs.
        if (screenY < -100 || screenY > height + 300) {
          put(body, body.tf, 'hidden', body.op, 'auto')
          continue
        }
        // lite has no stage mask, so each body fades by where its centre lands
        const f = lite ? fog(screenY / height) : 1
        put(body,
          `translate3d(${(body.dx * s).toFixed(1)}px,${(v - v * s).toFixed(1)}px,0) scale(${s.toFixed(3)})`,
          f < 0.01 ? 'hidden' : '',
          lite ? f.toFixed(2) : '',
          f < 0.01 ? 'auto' : 'transform, opacity')
      }
      // lite keeps the islands still inside their frames: one texture each, no per-frame layers
      if (lite) return
      for (const scene of scenes) {
        if (!reduced && (scene.top > scroll + height * 3 || scene.top + scene.height < scroll - 200)) continue
        // eased, not clamped: a hard clamp stops the layer dead mid-scroll
        const distance = 420 * Math.tanh((scroll + height / 2 - scene.top - scene.height / 2) / 420)
        for (const layer of scene.layers) {
          const tf = reduced ? '' : `translate3d(0,${(distance * layer.depth).toFixed(1)}px,0)`
          if (tf !== layer.tf) { layer.element.style.transform = tf; layer.tf = tf }
        }
      }
    }
    const schedule = () => { if (!frame.current) frame.current = requestAnimationFrame(paint) }
    // resizes and font swaps are not scroll frames, so they stay out of the jank watch
    const repaint = () => { if (!frame.current) frame.current = requestAnimationFrame(() => paint()) }
    const measure = () => {
      height = root.clientHeight
      sizeSpacer(root, stair)
      maxScroll = Math.max(1, root.scrollHeight - height)
      for (const scene of scenes) {
        scene.top = scene.section.offsetTop
        scene.height = scene.section.offsetHeight
      }
      for (const body of bodies) {
        body.top = layoutTop(body.element, stair)
        body.mid = body.top + body.element.offsetHeight / 2
      }
      // wide screens tile the banks at a fixed size (app.css 14) so clouds
      // stay cloud-sized instead of stretching across the whole column
      const tileW = wide.matches ? 520 : 0
      for (const bank of banks) {
        bank.tile = Math.max(1, (tileW || bank.element.clientWidth) * bank.ratio)
        bank.element.style.height = `${Math.ceil(height + bank.tile + 2)}px`
      }
      repaint()
    }
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    observer.observe(stair)
    root.addEventListener('scroll', schedule, { passive: true })
    media.addEventListener('change', repaint)
    measure()
    paint() // place the stair now, not a frame later, so it never flashes at the top
    // web fonts can reflow the steps after first paint without resizing the stair
    let alive = true
    document.fonts?.ready.then(() => { if (alive) measure() })
    return () => {
      alive = false
      cancelAnimationFrame(frame.current)
      frame.current = 0
      observer.disconnect()
      root.removeEventListener('scroll', schedule)
      media.removeEventListener('change', repaint)
      for (const scene of scenes) for (const { element } of scene.layers) element.style.transform = ''
      for (const { element } of banks) element.style.transform = ''
      for (const { element } of bodies) {
        element.style.transform = ''
        element.style.visibility = ''
        element.style.opacity = ''
        element.style.willChange = ''
      }
      if (high) high.style.opacity = ''
      stair.style.transform = ''
    }
  }, [scroller, sky, calm, lite, ground])
}

export const LANDSCAPE_UNITS = [...UNITS].reverse()
