import { useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, m as motion } from 'framer-motion'
import { Siraj } from '../components/Siraj'
import { Button } from '../components/Button'
import { Burst, Shockwave } from '../components/Burst'
import { useApp, useCalmMotion, useSetLanguage, useT } from '../state'
import { isLang } from '../../core/i18n'
import { slideText } from '../textSlide'
import { sfx, primeAudio } from '../../platform/sound'
import { haptic } from '../../platform/haptics'
import { avatarsFor, pictureLabel, type Gender } from '../../core/content/avatars'
import { Avatar, avatarSrc } from '../components/Profile'
import { LANGS } from '../languages'


type Step = 'hello' | 'lang' | 'name' | 'gender' | 'avatar' | 'ready'

const slide = {
  initial: (d: number) => ({ x: d * 40, opacity: 0 }),
  animate: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d * -40, opacity: 0 }),
}

export function Onboarding({ onDone }: { onDone: () => void }) {
  const { progress, dispatch } = useApp()
  const t = useT()
  const calm = useCalmMotion()
  const setLanguage = useSetLanguage()
  // the language is live from the moment it is tapped: the whole app turns
  // with it, and it is kept (with everything else) when onboarding ends
  const lang = progress.language
  const [step, setStep] = useState<Step>('hello')
  const root = useRef<HTMLDivElement>(null)
  const [name, setName] = useState('')
  const [gender, setGender] = useState<Gender | null>(null)
  const [avatar, setAvatar] = useState<string | null>(null)
  const keepName = useRef(true)

  const go = (s: Step) => {
    primeAudio()
    sfx.swoosh()
    setStep(s)
  }

  // the name step's button, its skip link and the keyboard's Enter all lead
  // on to the gender step; skipping forgets whatever was typed
  const toGender = (keep: boolean) => {
    keepName.current = keep
    if (!keep) setName('')
    go('gender')
  }

  // the gender decides which pictures are offered; a picture from the other
  // set does not survive a change of mind
  const pickGender = (g: Gender) => {
    setGender(g)
    if (avatar && !avatarsFor(g).some((a) => a.id === avatar)) setAvatar(null)
  }

  // the avatar step's button and skip link end here, once
  const started = useRef(false)
  const start = (withAvatar: boolean) => {
    if (started.current) return
    started.current = true
    const pic = withAvatar ? avatar : null
    go('ready')
    setTimeout(() => finish(pic), 120)
  }

  const finish = (pic: string | null) => {
    sfx.win()
    haptic('win')
    dispatch({ type: 'onboard', name: (keepName.current && name.trim()) || null, gender, avatar: pic })
    setTimeout(onDone, 1450)
  }

  // a new language: its words slide across to the side it reads from
  const shownLang = useRef(lang)
  useLayoutEffect(() => {
    if (shownLang.current === lang) return
    shownLang.current = lang
    if (!calm) slideText(root.current, lang)
  }, [lang, calm])

  const pickLang = (id: string, ready: boolean) => {
    if (!ready || !isLang(id)) { sfx.wrong(); haptic('wrong'); return }
    void setLanguage(id)
  }

  return (
    <div className="ob" ref={root}>
      <div className="ob__top">
        <div style={{ flex: 1 }}>
          <div className="pbar" style={{ height: 12 }}>
            <motion.div
              className="pbar__fill"
              style={{ background: 'var(--orange)' }}
              initial={false}
              animate={{ width: `${{ hello: 16, lang: 33, name: 50, gender: 66, avatar: 83, ready: 100 }[step]}%` }}
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
                <span className="slidetext" data-slide>
                  {t.obHello.before}<b style={{ color: 'var(--orange)' }}>{t.obHello.name}</b>{t.obHello.after}
                </span>
              </div>
            </motion.div>
          )}

          {step === 'lang' && (
            <motion.div key="lang" custom={1} variants={slide} initial="initial" animate="animate" exit="exit"
              transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
              style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                <Siraj mood="idle" size={78} />
                <div className="bubble bubble--side" style={{ flex: 1, fontSize: '1.02rem' }}>
                  <span className="slidetext" data-slide>{t.obLang}</span>
                </div>
              </div>
              <div className="langlist">
                {LANGS.map((l, i) => (
                  <button
                    key={l.id}
                    className={`lang${lang === l.id ? ' is-on' : ''}`}
                    style={{ animationDelay: `${i * 42}ms` }}
                    aria-disabled={!l.ready}
                    onPointerDown={() => { primeAudio(); if (l.ready) { sfx.select(); haptic('tap') } }}
                    onClick={() => pickLang(l.id, l.ready)}
                  >
                    <span className="lang__flag"><l.Flag /></span>
                    <span lang={l.id} dir="auto">{l.label}</span>
                    {'beta' in l && l.beta && <span className="lang__beta">{t.beta}</span>}
                    {!l.ready && <span className="lang__soon">{t.soon}</span>}
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
                <div className="bubble bubble--side" style={{ flex: 1 }}>{t.obName}</div>
              </div>
              <input
                className="field"
                style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 800 }}
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 24))}
                placeholder={t.obNamePlaceholder}
                autoComplete="off"
                enterKeyHint="done"
                onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && toGender(true)}
              />
              <p style={{ textAlign: 'center', color: 'var(--ink-3)', fontSize: '.84rem', fontWeight: 600 }}>
                {t.obNameLocal}
              </p>
            </motion.div>
          )}

          {step === 'gender' && (
            <motion.div key="gender" custom={1} variants={slide} initial="initial" animate="animate" exit="exit"
              transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                <Siraj mood="think" size={90} />
                <div className="bubble bubble--side" style={{ flex: 1 }}>
                  {t.obGender(name.trim())}
                </div>
              </div>
              <div className="gpick" role="radiogroup" aria-label={t.obGenderAria}>
                {([['m', t.brother, 'av-1'], ['f', t.sister, 'av-8']] as const).map(([g, label, pic], i) => (
                  <button key={g} role="radio" aria-checked={gender === g}
                    className={`gpick__b${gender === g ? ' is-on' : ''}`}
                    style={{ animationDelay: `${i * 60}ms` }}
                    onPointerDown={() => { primeAudio(); sfx.select(); haptic('tap') }}
                    onClick={() => pickGender(g)}>
                    <img src={avatarSrc(pic)} alt="" width={84} height={84} decoding="async" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'avatar' && (
            <motion.div key="avatar" custom={1} variants={slide} initial="initial" animate="animate" exit="exit"
              transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
              style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 18, paddingTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                <Siraj mood="idle" size={78} />
                <div className="bubble bubble--side" style={{ flex: 1, fontSize: '1.02rem' }}>
                  {t.obAvatar(name.trim())}
                </div>
              </div>
              {/* the choice, large: pops each time a new picture is tapped */}
              <div className="avpreview">
                <motion.div key={avatar ?? 'none'} initial={{ scale: 0.8, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.36, ease: [0.34, 1.56, 0.64, 1] }}>
                  <Avatar id={avatar} name={name.trim() || null} size={132} className="avpreview__img" />
                </motion.div>
              </div>
              <div className="avpick avpick--ob" role="radiogroup" aria-label={t.yourPicture}>
                {avatarsFor(gender).map((a, i) => (
                  <button key={a.id} role="radio" aria-checked={avatar === a.id} aria-label={pictureLabel(a, lang)}
                    className={`avpick__b${avatar === a.id ? ' is-on' : ''}`}
                    style={{ animationDelay: `${i * 36}ms` }}
                    onPointerDown={() => { primeAudio(); sfx.select(); haptic('tap') }}
                    onClick={() => setAvatar(a.id)}>
                    <img src={avatarSrc(a.id)} alt="" width={72} height={72} decoding="async" />
                  </button>
                ))}
              </div>
              <p style={{ textAlign: 'center', color: 'var(--ink-3)', fontSize: '.84rem', fontWeight: 600 }}>
                {t.obAvatarLater}
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
                {t.obReady(name.trim())}
              </h1>
              <p style={{ textAlign: 'center', color: 'var(--ink-2)', fontWeight: 650, maxWidth: '24ch', lineHeight: 1.7 }}>
                {t.obReadyText}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="ob__foot">
        {step === 'hello' && <Button block onClick={() => go('lang')}>{t.letsGo}</Button>}
        {step === 'lang' && <Button block onClick={() => go('name')}>{t.continue}</Button>}
        {step === 'name' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Button block onClick={() => toGender(true)}>{t.continue}</Button>
            <Button block tone="quiet" size="md" onClick={() => toGender(false)}>
              {t.skip}
            </Button>
          </div>
        )}
        {step === 'gender' && <Button block disabled={!gender} onClick={() => go('avatar')}>{t.continue}</Button>}
        {step === 'avatar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Button block disabled={!avatar} onClick={() => start(true)}>{t.startJourney}</Button>
            <Button block tone="quiet" size="md" onClick={() => start(false)}>
              {t.skip}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
