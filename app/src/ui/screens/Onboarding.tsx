import { useState } from 'react'
import { AnimatePresence, m as motion } from 'framer-motion'
import { Siraj } from '../components/Siraj'
import { Button } from '../components/Button'
import { Burst, Shockwave } from '../components/Burst'
import { useApp } from '../state'
import { sfx, primeAudio } from '../../platform/sound'
import { haptic } from '../../platform/haptics'
import { FlagAR, FlagEN, FlagFR, FlagTR, FlagID, FlagUR, FlagES, FlagDE } from '../icons/Flags'

const LANGS = [
  { id: 'ar', label: 'العربية', Flag: FlagAR, ready: true },
  { id: 'en', label: 'English', Flag: FlagEN, ready: false },
  { id: 'fr', label: 'Français', Flag: FlagFR, ready: false },
  { id: 'tr', label: 'Türkçe', Flag: FlagTR, ready: false },
  { id: 'id', label: 'Bahasa Indonesia', Flag: FlagID, ready: false },
  { id: 'ur', label: 'اردو', Flag: FlagUR, ready: false },
  { id: 'es', label: 'Español', Flag: FlagES, ready: false },
  { id: 'de', label: 'Deutsch', Flag: FlagDE, ready: false },
]

type Step = 'hello' | 'lang' | 'name' | 'ready'

const slide = {
  initial: (d: number) => ({ x: d * 40, opacity: 0 }),
  animate: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d * -40, opacity: 0 }),
}

export function Onboarding({ onDone }: { onDone: () => void }) {
  const { dispatch } = useApp()
  const [step, setStep] = useState<Step>('hello')
  const [lang, setLang] = useState('ar')
  const [name, setName] = useState('')

  const go = (s: Step) => {
    primeAudio()
    sfx.swoosh()
    setStep(s)
  }

  const finish = () => {
    sfx.win()
    haptic('win')
    dispatch({ type: 'onboard', name: name.trim() || null, language: lang })
    setTimeout(onDone, 1450)
  }

  return (
    <div className="ob">
      <div className="ob__top">
        <div style={{ flex: 1 }}>
          <div className="pbar" style={{ height: 12 }}>
            <motion.div
              className="pbar__fill"
              style={{ background: 'var(--orange)' }}
              initial={false}
              animate={{ width: `${{ hello: 25, lang: 50, name: 75, ready: 100 }[step]}%` }}
              transition={{ type: 'spring', stiffness: 240, damping: 26 }}
            >
              <span className="pbar__gloss" />
            </motion.div>
          </div>
        </div>
      </div>

      <div className="ob__body">
        <AnimatePresence mode="wait" custom={1}>
          {step === 'hello' && (
            <motion.div key="hello" custom={1} variants={slide} initial="initial" animate="animate" exit="exit"
              transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 26 }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Siraj mood="wave" size={190} />
              </div>
              <div className="bubble bubble--up rise">
                أهلًا بك! أنا <b style={{ color: 'var(--orange)' }}>سراج</b>، ورفيقك في رحلة تعلّم الإسلام، خطوةً خطوة.
              </div>
            </motion.div>
          )}

          {step === 'lang' && (
            <motion.div key="lang" custom={1} variants={slide} initial="initial" animate="animate" exit="exit"
              transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
              style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                <Siraj mood="idle" size={78} />
                <div className="bubble bubble--side" style={{ flex: 1, fontSize: '1.02rem' }}>بأيّ لغة تحبّ أن نتعلّم؟</div>
              </div>
              <div className="langlist">
                {LANGS.map((l, i) => (
                  <button
                    key={l.id}
                    className={`lang${lang === l.id ? ' is-on' : ''}`}
                    style={{ animationDelay: `${i * 42}ms` }}
                    onPointerDown={() => { primeAudio(); sfx.select(); haptic('tap') }}
                    onClick={() => setLang(l.id)}
                  >
                    <span className="lang__flag"><l.Flag /></span>
                    <span>{l.label}</span>
                    {!l.ready && <span className="lang__soon">قريبًا</span>}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'name' && (
            <motion.div key="name" custom={1} variants={slide} initial="initial" animate="animate" exit="exit"
              transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                <Siraj mood="think" size={90} />
                <div className="bubble bubble--side" style={{ flex: 1 }}>بماذا أُناديك؟</div>
              </div>
              <input
                className="field"
                style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 800 }}
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 24))}
                placeholder="اسمك (اختياري)"
                autoComplete="off"
                enterKeyHint="done"
                onKeyDown={(e) => e.key === 'Enter' && go('ready')}
              />
              <p style={{ textAlign: 'center', color: 'var(--ink-3)', fontSize: '.84rem', fontWeight: 600 }}>
                يبقى على جهازك وحده.
              </p>
            </motion.div>
          )}

          {step === 'ready' && (
            <motion.div key="ready" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, position: 'relative' }}>
              <span className="lightsweep" />
              <Shockwave />
              <Burst count={30} flavour="gold" spread={230} />
              <Siraj mood="cheer" size={200} />
              <h1 style={{ fontSize: 'var(--t-hero)', color: 'var(--orange)', textAlign: 'center' }}>
                {name.trim() ? `أهلًا يا ${name.trim()}!` : 'كلّ شيء جاهز!'}
              </h1>
              <p style={{ textAlign: 'center', color: 'var(--ink-2)', fontWeight: 650, maxWidth: '24ch', lineHeight: 1.7 }}>
                رحلتك تبدأ الآن، من أوّل درجة وصعودًا.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="ob__foot">
        {step === 'hello' && <Button block onClick={() => go('lang')}>هيّا بنا</Button>}
        {step === 'lang' && <Button block onClick={() => go('name')}>متابعة</Button>}
        {step === 'name' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Button block onClick={() => { go('ready'); setTimeout(finish, 120) }}>ابدأ الرحلة</Button>
            <Button block tone="quiet" size="md" onClick={() => { setName(''); go('ready'); setTimeout(finish, 120) }}>
              تخطّي
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
