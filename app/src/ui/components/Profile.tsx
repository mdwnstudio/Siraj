import { useId } from 'react'
import { m as motion } from 'framer-motion'
import { BANNERS, avatarsFor, isAvatarId, isBannerId, pictureLabel, DEFAULT_BANNER, type BannerId, type Gender } from '../../core/content/avatars'
import { useLang, useT } from '../state'
import type { Strings } from '../strings'
import { Sun, Star, Droplet, Crescent, Sparkle, Flame } from '../icons/SirajIcons'
import { useLayout } from '../useLayout'
import { Button } from './Button'
import { sfx, primeAudio } from '../../platform/sound'
import { haptic } from '../../platform/haptics'

const AVATAR_DIR = `${import.meta.env.BASE_URL}img/avatars/`

export const avatarSrc = (id: string) => `${AVATAR_DIR}${id}.webp`

/* ---------------- the learner's picture ----------------
   A drawn avatar once one is picked; until then, the first letter of their
   name on a gold disc, the way the app has always shown them. */

export function Avatar({ id, name, size = 30, className = '' }: {
  id: string | null
  name: string | null
  size?: number
  className?: string
}) {
  const t = useT()
  if (isAvatarId(id)) {
    return (
      <img className={`avatar ${className}`} src={avatarSrc(id)} alt="" width={size} height={size}
        style={{ width: size, height: size }} decoding="async" />
    )
  }
  return (
    <span className={`avatar avatar--letter ${className}`} style={{ width: size, height: size, fontSize: size * 0.46 }}>
      {name?.trim()?.[0] ?? t.initialFallback}
    </span>
  )
}

/** the name the learner goes by in the nav: their own, or ملفي until they give one */
export function profileLabel(name: string | null, t: Strings): string {
  return name?.trim() || t.me
}

/* ---------------- the pencil ----------------
   Not one of the Siraj Seven: a plain utility glyph for "edit", drawn to the
   same grammar (24 box, solid fill, rounded joins) so it sits beside them. */

export function Pencil({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false">
      <path d="M15.6 3.9 a2.2 2.2 0 0 1 3.1 0 l1.4 1.4 a2.2 2.2 0 0 1 0 3.1 L9.3 19.2 4 20.6 a.5.5 0 0 1 -.6 -.6 L4.8 14.7 Z"
        stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

/* ---------------- the cover banner ----------------
   Five covers in the brand's colours: two patterns (the khatam star, and the
   Siraj icons), and three gradients (dawn, ember, night). Drawn as one SVG in
   user units, so a pattern tile stays the same size at any banner width. */

export function ProfileBanner({ id, className = '' }: { id: string; className?: string }) {
  const uid = useId().replace(/:/g, '')
  const b: BannerId = isBannerId(id) ? id : DEFAULT_BANNER
  const g = `g${uid}`
  const p = `p${uid}`
  const glow = `w${uid}`

  return (
    <svg className={`pbanner ${className}`} width="100%" height="100%" aria-hidden focusable="false"
      preserveAspectRatio="none">
      <defs>
        {b === 'khatam' && (
          <>
            <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FEBD01" />
              <stop offset="1" stopColor="#FE6209" />
            </linearGradient>
            <pattern id={p} width="56" height="56" patternUnits="userSpaceOnUse">
              <g style={{ color: '#fff' }} opacity=".24">
                <g transform="translate(3 3)"><Star size={22} /></g>
                <g transform="translate(31 31)"><Star size={22} /></g>
              </g>
            </pattern>
          </>
        )}
        {b === 'dawn' && (
          <>
            <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#6B1512" />
              <stop offset=".55" stopColor="#FE6209" />
              <stop offset="1" stopColor="#FEBD01" />
            </linearGradient>
            <radialGradient id={glow} cx=".5" cy="1.05" r=".6">
              <stop offset="0" stopColor="#FFF6E6" stopOpacity=".85" />
              <stop offset="1" stopColor="#FFF6E6" stopOpacity="0" />
            </radialGradient>
          </>
        )}
        {b === 'icons' && (
          <>
            <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FFF3CD" />
              <stop offset="1" stopColor="#FFE6D2" />
            </linearGradient>
            <pattern id={p} width="108" height="72" patternUnits="userSpaceOnUse">
              <g style={{ color: '#FE6209' }} opacity=".3">
                <g transform="translate(8 8) rotate(-8 10 10)"><Sun size={20} /></g>
                <g transform="translate(44 6)"><Droplet size={18} /></g>
                <g transform="translate(78 10) rotate(12 10 10)"><Crescent size={18} /></g>
                <g transform="translate(24 42) rotate(10 10 10)"><Sparkle size={20} /></g>
                <g transform="translate(60 42)"><Star size={18} /></g>
                <g transform="translate(92 44) rotate(-10 10 10)"><Flame size={18} /></g>
              </g>
            </pattern>
          </>
        )}
        {b === 'ember' && (
          <radialGradient id={g} cx=".75" cy=".15" r="1">
            <stop offset="0" stopColor="#FFD44A" />
            <stop offset=".35" stopColor="#FE6209" />
            <stop offset=".8" stopColor="#D24700" />
            <stop offset="1" stopColor="#6B1512" />
          </radialGradient>
        )}
        {b === 'night' && (
          <>
            <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#450705" />
              <stop offset="1" stopColor="#1C0806" />
            </linearGradient>
            <pattern id={p} width="132" height="88" patternUnits="userSpaceOnUse">
              <g style={{ color: '#FEBD01' }}>
                <g transform="translate(10 12)" opacity=".55"><Sparkle size={12} /></g>
                <g transform="translate(70 30)" opacity=".35"><Star size={9} /></g>
                <g transform="translate(106 8)" opacity=".45"><Sparkle size={9} /></g>
                <g transform="translate(40 62)" opacity=".4"><Star size={8} /></g>
                <g transform="translate(96 64)" opacity=".6"><Sparkle size={13} /></g>
              </g>
            </pattern>
          </>
        )}
      </defs>
      <rect width="100%" height="100%" fill={`url(#${g})`} />
      {b === 'dawn' && <rect width="100%" height="100%" fill={`url(#${glow})`} />}
      {(b === 'khatam' || b === 'icons' || b === 'night') && <rect width="100%" height="100%" fill={`url(#${p})`} />}
      {b === 'night' && (
        <g style={{ color: '#FEBD01' }} transform="translate(22 18)"><Crescent size={38} /></g>
      )}
    </svg>
  )
}

/* ---------------- the edit sheet ----------------
   Name, picture and cover. Every choice applies as it is tapped, so the
   profile behind the sheet changes live; the button only closes it. */

export function ProfileSheet({ name, gender, avatar, banner, onChange, onClose }: {
  name: string | null
  gender: Gender | null
  avatar: string | null
  banner: string
  onChange: (patch: { name?: string | null; gender?: Gender; avatar?: string; banner?: string }) => void
  onClose: () => void
}) {
  const phone = useLayout() === 'phone'
  const motionProps = phone
    ? { initial: { y: '100%' }, animate: { y: '0%' }, exit: { y: '100%' }, transition: { type: 'spring' as const, stiffness: 380, damping: 36 } }
    : { initial: { opacity: 0, scale: 0.92, y: 16 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.96, y: 8 }, transition: { type: 'spring' as const, stiffness: 420, damping: 30 } }
  const tap = () => { primeAudio(); sfx.select(); haptic('tap') }
  const t = useT()
  const lang = useLang()

  return (
    <>
      <motion.div className="scrim" onClick={onClose}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
      <motion.div className="sheet sheet--profile" role="dialog" aria-label={t.editProfile} {...motionProps}>
        <span className="sheet__grab" />
        <h2 className="sheet__title">{t.editProfile}</h2>

        <label className="section__label" htmlFor="profile-name">{t.name}</label>
        <input id="profile-name" className="field" value={name ?? ''} placeholder={t.namePlaceholder}
          autoComplete="off" enterKeyHint="done"
          onChange={(e) => onChange({ name: e.target.value.slice(0, 24) || null })} />

        <div className="section__label" style={{ marginTop: 16 }}>{t.yourPicture}</div>
        <div className="seg" style={{ marginBottom: 12 }}>
          {([['m', t.brother], ['f', t.sister]] as const).map(([g, l]) => (
            <button key={g} className={`seg__b${gender === g ? ' is-on' : ''}`} aria-pressed={gender === g}
              onPointerDown={tap} onClick={() => onChange({ gender: g })}>
              {l}
            </button>
          ))}
        </div>
        <div className="avpick" role="radiogroup" aria-label={t.yourPicture}>
          {avatarsFor(gender).map((a) => (
            <button key={a.id} role="radio" aria-checked={avatar === a.id} aria-label={pictureLabel(a, lang)}
              className={`avpick__b${avatar === a.id ? ' is-on' : ''}`}
              onPointerDown={tap} onClick={() => onChange({ avatar: a.id })}>
              <img src={avatarSrc(a.id)} alt="" width={56} height={56} decoding="async" />
            </button>
          ))}
        </div>

        <div className="section__label" style={{ marginTop: 16 }}>{t.cover}</div>
        <div className="bnpick" role="radiogroup" aria-label={t.cover}>
          {BANNERS.map((b) => (
            <button key={b.id} role="radio" aria-checked={banner === b.id} title={pictureLabel(b, lang)} aria-label={pictureLabel(b, lang)}
              className={`bnpick__b${banner === b.id ? ' is-on' : ''}`}
              onPointerDown={tap} onClick={() => onChange({ banner: b.id })}>
              <ProfileBanner id={b.id} />
            </button>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <Button block onClick={onClose}>{t.done}</Button>
        </div>
      </motion.div>
    </>
  )
}
