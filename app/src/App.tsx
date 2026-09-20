import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Lesson as LessonT } from './core/types'
import type { ApplyResult, LessonOutcome } from './core/engine/progress'
import { PATH } from './core/content/path'
import { AppProvider, useApp, useCalmMotion } from './ui/state'
import { StatBar, NavBar, type Tab } from './ui/components/Bars'
import { Splash } from './ui/screens/Splash'
import { Onboarding } from './ui/screens/Onboarding'
import { Home } from './ui/screens/Home'
import { Lesson } from './ui/screens/Lesson'
import { Result } from './ui/screens/Result'
import { WinsPage, ReviewPage, AskPage, MePage } from './ui/screens/Pages'

type Scene =
  | { at: 'splash' }
  | { at: 'onboarding' }
  | { at: 'app' }
  | { at: 'lesson'; nodeId: string; lessonId: string }
  | { at: 'result'; outcome: LessonOutcome; applied: ApplyResult }

export default function App() {
  return (
    <AppProvider>
      <Shell />
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
  const [scene, setScene] = useState<Scene>({ at: 'splash' })
  const [tab, setTab] = useState<Tab>('path')
  const [celebrate, setCelebrate] = useState<string | null>(null)

  const afterSplash = useCallback(() => {
    setScene(progress.onboarded ? { at: 'app' } : { at: 'onboarding' })
  }, [progress.onboarded])

  const startNode = (nodeId: string) => {
    const node = PATH.find((n) => n.id === nodeId)
    if (!node?.lessonId) return
    setScene({ at: 'lesson', nodeId, lessonId: node.lessonId })
  }

  const lessonDone = (o: LessonOutcome, _lesson: LessonT) => {
    const applied = finishLesson(o)
    setScene({ at: 'result', outcome: o, applied })
  }

  const resultDone = () => {
    // light up the step that just opened, one above the one finished
    if (scene.at !== 'result') return
    const i = PATH.findIndex((n) => n.id === scene.outcome.nodeId)
    const next = PATH[i + 1]
    setScene({ at: 'app' })
    setTab('path')
    if (next && !next.soon) setTimeout(() => setCelebrate(next.id), 420)
  }

  return (
    <div className={`shell${calm ? ' calm' : ''}`}>
      <AnimatePresence mode="wait">
        {scene.at === 'splash' && <Splash key="splash" onDone={afterSplash} />}

        {scene.at === 'onboarding' && (
          <motion.div key="ob" {...fade} transition={{ duration: 0.3 }} style={{ flex: 1, minHeight: 0 }}>
            <Onboarding onDone={() => setScene({ at: 'app' })} />
          </motion.div>
        )}

        {scene.at === 'app' && (
          <motion.div key="app" {...fade} transition={{ duration: 0.25 }}
            style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {/* always mounted: unmounting it on one tab made the whole
                view jump as the header height collapsed */}
            <StatBar />
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
                    <Home onStart={startNode} celebrate={celebrate} onCelebrated={() => setCelebrate(null)} />
                  )}
                  {tab === 'review' && <ReviewPage onStart={startNode} />}
                  {tab === 'ask' && <AskPage />}
                  {tab === 'wins' && <WinsPage />}
                  {tab === 'me' && <MePage />}
                </motion.div>
              </AnimatePresence>
            </main>
            <NavBar tab={tab} onTab={setTab} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {scene.at === 'lesson' && (
          <motion.div key="lesson"
            style={{ position: 'absolute', inset: 0, zIndex: 40 }}
            initial={{ y: '100%', opacity: 0.6 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0.6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 34 }}>
            <Lesson
              nodeId={scene.nodeId}
              lessonId={scene.lessonId}
              onExit={() => setScene({ at: 'app' })}
              onDone={lessonDone}
            />
          </motion.div>
        )}

        {scene.at === 'result' && (
          <motion.div key="result" style={{ position: 'absolute', inset: 0, zIndex: 50 }} {...fade} transition={{ duration: 0.3 }}>
            <Result outcome={scene.outcome} applied={scene.applied} onDone={resultDone} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
