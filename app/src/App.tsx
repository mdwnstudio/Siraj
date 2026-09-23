import { lazy, Suspense, useCallback, useEffect, useState, type ComponentType } from 'react'
import { AnimatePresence, LazyMotion, domAnimation, m as motion } from 'framer-motion'
import type { Lesson as LessonT } from './core/types'
import type { ApplyResult, LessonOutcome } from './core/engine/progress'
import { PATH, UNIT_OF } from './core/content/path'
import { AppProvider, useApp, useCalmMotion } from './ui/state'
import { StatBar, NavBar, SideNav, type Tab } from './ui/components/Bars'
import { Rail } from './ui/components/Rail'
import { preloadSiraj } from './ui/components/Siraj'
import { useLayout } from './ui/useLayout'
import { Splash } from './ui/screens/Splash'
import { Home } from './ui/screens/Home'

/* Only the splash and the stair are in the first download. Everything a
   tap away arrives in its own chunk, fetched while the device is idle, so
   a budget phone parses less before the first frame and nothing waits
   when it is opened. */
const onboardingChunk = chunk(() => import('./ui/screens/Onboarding'))
const lessonChunk = chunk(() => import('./ui/screens/Lesson'))
const resultChunk = chunk(() => import('./ui/screens/Result'))
const pagesChunk = chunk(() => import('./ui/screens/Pages'))
const Onboarding = fromChunk(onboardingChunk, (m) => m.Onboarding)
const Lesson = fromChunk(lessonChunk, (m) => m.Lesson)
const Result = fromChunk(resultChunk, (m) => m.Result)
const WinsPage = fromChunk(pagesChunk, (m) => m.WinsPage)
const ReviewPage = fromChunk(pagesChunk, (m) => m.ReviewPage)
const AskPage = fromChunk(pagesChunk, (m) => m.AskPage)
const MePage = fromChunk(pagesChunk, (m) => m.MePage)

type Chunk<M> = { load: () => Promise<M>; ready: () => M | undefined }

function chunk<M>(importer: () => Promise<M>): Chunk<M> {
  let mod: M | undefined
  let pending: Promise<M> | undefined
  return {
    load: () => (pending ??= importer().then((m) => (mod = m))),
    ready: () => mod,
  }
}

/* React.lazy suspends on its first render even when the chunk is already
   downloaded, and React holds a revealed Suspense boundary back for about
   300ms. The screen's entrance animation then played on an empty frame and
   the content popped in after it. Once a chunk has arrived its component is
   rendered directly, and the callers below wait for the chunk before they
   switch screens, so an entrance always animates real content. */
function fromChunk<M, P extends object>(c: Chunk<M>, pick: (m: M) => ComponentType<P>) {
  const Lazy = lazy(() => c.load().then((m) => ({ default: pick(m) })))
  return function Loaded(props: P) {
    const m = c.ready()
    if (m) {
      const Screen = pick(m)
      return <Screen {...props} />
    }
    return <Lazy {...props} />
  }
}

/** run now if the chunk is in, otherwise as soon as it arrives */
const whenLoaded = (c: Chunk<unknown>, go: () => void) => {
  if (c.ready()) go()
  else void c.load().then(go)
}

const whenIdle = (fn: () => void) => {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }
  if (w.requestIdleCallback) w.requestIdleCallback(fn, { timeout: 2500 })
  else setTimeout(fn, 600)
}

type Scene =
  | { at: 'splash' }
  | { at: 'onboarding' }
  | { at: 'app' }
  | { at: 'lesson'; nodeId: string; lessonId: string }
  | { at: 'result'; outcome: LessonOutcome; applied: ApplyResult }

export default function App() {
  return (
    <AppProvider>
      {/* the slim motion build: every screen uses `m`, never `motion`, and
          strict turns a stray `motion.div` into an error instead of 30 KB */}
      <LazyMotion features={domAnimation} strict>
        <Shell />
      </LazyMotion>
    </AppProvider>
  )
}

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

function Shell() {
  const { progress, finishLesson } = useApp()
  const calm = useCalmMotion()
  const layout = useLayout()
  const [scene, setScene] = useState<Scene>({ at: 'splash' })
  const [tab, setTab] = useState<Tab>('path')
  const [celebrate, setCelebrate] = useState<string | null>(null)
  const [crossFrom, setCrossFrom] = useState<string | null>(null)
  const clearCrossFrom = useCallback(() => setCrossFrom(null), [])

  // a first visit goes to onboarding straight after the splash: fetch it now
  useEffect(() => {
    if (!progress.onboarded) void onboardingChunk.load()
  }, [progress.onboarded])

  // once the stair is up, quietly bring in everything one tap away
  const inApp = scene.at === 'app'
  useEffect(() => {
    if (inApp) whenIdle(() => { void lessonChunk.load(); void resultChunk.load(); void pagesChunk.load(); preloadSiraj() })
  }, [inApp])

  const afterSplash = useCallback(() => {
    if (progress.onboarded) setScene({ at: 'app' })
    else whenLoaded(onboardingChunk, () => setScene({ at: 'onboarding' }))
  }, [progress.onboarded])

  // the stair is in the first download; every other tab waits for its chunk
  const goTab = useCallback((t: Tab) => {
    if (t === 'path') setTab(t)
    else whenLoaded(pagesChunk, () => setTab(t))
  }, [])

  const startNode = (nodeId: string) => {
    const node = PATH.find((n) => n.id === nodeId)
    if (!node?.lessonId) return
    const lessonId = node.lessonId
    whenLoaded(lessonChunk, () => setScene({ at: 'lesson', nodeId, lessonId }))
  }

  const lessonDone = (o: LessonOutcome, _lesson: LessonT) => {
    const applied = finishLesson(o)
    whenLoaded(resultChunk, () => setScene({ at: 'result', outcome: o, applied }))
  }

  const resultDone = () => {
    // light up the step that just opened, one above the one finished
    if (scene.at !== 'result') return
    const i = PATH.findIndex((n) => n.id === scene.outcome.nodeId)
    const next = PATH[i + 1]
    setScene({ at: 'app' })
    setTab('path')
    if (!next || next.soon) return
    // the next step is in a new unit: the stair climbs to it and opens the unit
    if (UNIT_OF.get(next.id) !== UNIT_OF.get(scene.outcome.nodeId)) setCrossFrom(scene.outcome.nodeId)
    else setTimeout(() => setCelebrate(next.id), 420)
  }

  return (
    <div className={`shell${calm ? ' calm' : ''}`}>
      <AnimatePresence mode="wait">
        {scene.at === 'splash' && <Splash key="splash" onDone={afterSplash} />}

        {scene.at === 'onboarding' && (
          <motion.div key="ob" {...fade} transition={{ duration: 0.3 }} style={{ flex: 1, minHeight: 0 }}>
            <Suspense fallback={null}>
              <Onboarding onDone={() => setScene({ at: 'app' })} />
            </Suspense>
          </motion.div>
        )}

        {scene.at === 'app' && (
          <motion.div key="app" className={`app app--${layout}`} {...fade} transition={{ duration: 0.25 }}>
            {layout !== 'phone' && <SideNav tab={tab} onTab={goTab} />}
            <div className="app__main">
              {/* always mounted within a layout: unmounting it on one tab made the
                  whole view jump as the header height collapsed. On desktop the
                  stats live in the rail instead. */}
              {layout !== 'desktop' && <StatBar wordmark={layout === 'phone'} />}
              <main className="grow" style={{ position: 'relative' }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}
                  >
                    {tab === 'path' && (
                      <Home onStart={startNode} celebrate={celebrate} onCelebrated={() => setCelebrate(null)}
                        crossFrom={crossFrom} onCrossFrom={clearCrossFrom} />
                    )}
                    <Suspense fallback={null}>
                      {tab === 'review' && <ReviewPage onStart={startNode} />}
                      {tab === 'ask' && <AskPage />}
                      {tab === 'wins' && <WinsPage />}
                      {tab === 'me' && <MePage />}
                    </Suspense>
                  </motion.div>
                </AnimatePresence>
              </main>
              {layout === 'phone' && <NavBar tab={tab} onTab={goTab} />}
            </div>
            {layout === 'desktop' && <Rail tab={tab} onTab={goTab} onStart={startNode} />}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {scene.at === 'lesson' && (
          <motion.div key="lesson"
            style={{ position: 'absolute', inset: 0, zIndex: 40 }}
            initial={{ y: '100%', opacity: 0.6 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0.6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 34 }}>
            <Suspense fallback={null}>
              <Lesson
                nodeId={scene.nodeId}
                lessonId={scene.lessonId}
                onExit={() => setScene({ at: 'app' })}
                onDone={lessonDone}
              />
            </Suspense>
          </motion.div>
        )}

        {scene.at === 'result' && (
          <motion.div key="result" style={{ position: 'absolute', inset: 0, zIndex: 50 }} {...fade} transition={{ duration: 0.3 }}>
            <Suspense fallback={null}>
              <Result outcome={scene.outcome} applied={scene.applied} onDone={resultDone} />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
