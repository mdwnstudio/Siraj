/* ============================================================
   THE SIRAJ SEVEN
   A closed icon vocabulary. Every icon in the app is one of
   these seven, the way Material You repeats a small shape set.

     الشمس    Sun       home / the path / a new day
     السراج   Lantern   Siraj himself - the AI, the brand mark
     النجمة   Star      XP & mastery  (8-point khatam / رُبع الحزب)
     القطرة   Droplet   water and giving: wudu, zakah
     الهلال   Crescent  review & return / the cycle
     الشرارة  Sparkle   celebration, "new", the moment of delight
     الشعلة   Flame     streak - the lamp stays lit

   Grammar: 24×24 box, solid fills, currentColor, rounded joins
   via the fill+stroke trick so corners stay friendly at any size.
   ============================================================ */

export type IconProps = {
  size?: number
  className?: string
  style?: React.CSSProperties
  title?: string
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'currentColor',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true as const,
  focusable: 'false' as const,
})

/* soften every corner without hand-rounding each vertex */
const soft = { stroke: 'currentColor', strokeWidth: 1.15, strokeLinejoin: 'round' as const }

/* ---------------- الشمس - Sun (الإشراق) ---------------- */
/* not a stock 8-ray sun: a sun RISING over a horizon. it carries the
   whole app's metaphor - every lesson takes you higher, toward the light */
export function Sun({ size = 24, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      {p.title && <title>{p.title}</title>}
      {/* three rays, fanned */}
      {[0, 42, -42].map((a) => (
        <rect
          key={a}
          x="10.85"
          y="4.6"
          width="2.3"
          height="5.0"
          rx="1.15"
          transform={`rotate(${a} 12 20.4)`}
        />
      ))}
      {/* the dome, cresting */}
      <path d="M4.7 20.4 A7.3 7.3 0 0 1 19.3 20.4 Z" />
      {/* the horizon */}
      <rect x="3.2" y="21.0" width="17.6" height="2.6" rx="1.3" />
    </svg>
  )
}

/* ---------------- السراج - Lantern ---------------- */
/* the brand silhouette: sprout-loop, flaring lamp body, solid base */
export function Lantern({ size = 24, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      {p.title && <title>{p.title}</title>}
      {/* the sprout */}
      <path
        d="M12.95 7.3 C11.75 5.5 12.75 3.0 14.45 3.0 C15.8 3.0 15.75 5.3 13.85 6.85"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      {/* the body - rounded, bottom-heavy, exactly Siraj's stance */}
      <path
        d="M12 7.35 C14.95 7.35 16.45 9.0 16.85 11.5 L17.75 16.75
           C18.15 19.15 15.95 20.7 12 20.7 C8.05 20.7 5.85 19.15 6.25 16.75
           L7.15 11.5 C7.55 9.0 9.05 7.35 12 7.35 Z"
        {...soft}
        strokeWidth="0.9"
      />
      {/* two feet */}
      <path d="M9.2 20.0 C10.55 20.0 11.3 20.95 11.3 21.9 C11.3 22.65 10.7 23.05 9.2 23.05 C7.7 23.05 7.1 22.65 7.1 21.9 C7.1 20.95 7.85 20.0 9.2 20.0 Z" />
      <path d="M14.8 20.0 C16.15 20.0 16.9 20.95 16.9 21.9 C16.9 22.65 16.3 23.05 14.8 23.05 C13.3 23.05 12.7 22.65 12.7 21.9 C12.7 20.95 13.45 20.0 14.8 20.0 Z" />
    </svg>
  )
}

/* ---------------- النجمة - 8-point khatam star ---------------- */
/* two squares at 0° and 45°, unioned - رُبع الحزب geometry */
export function Star({ size = 24, ...p }: IconProps) {
  const R = 10.1
  const r = R * 0.655 // notched past true square-union so points read at 20px
  const pts: string[] = []
  for (let i = 0; i < 16; i++) {
    const rad = i % 2 === 0 ? R : r
    const a = (Math.PI / 8) * i - Math.PI / 2
    pts.push(`${(12 + rad * Math.cos(a)).toFixed(2)} ${(12 + rad * Math.sin(a)).toFixed(2)}`)
  }
  return (
    <svg {...base(size)} {...p}>
      {p.title && <title>{p.title}</title>}
      <path d={`M${pts.join(' L')} Z`} {...soft} strokeWidth="1.05" />
    </svg>
  )
}

/* ---------------- القطرة - Droplet ---------------- */
/* water and giving: wudu, zakah. (It was the lamp's oil, the old lives,
   until those were retired.) */
export function Droplet({ size = 24, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      {p.title && <title>{p.title}</title>}
      <path
        d="M12 1.9 C12 1.9 19.3 9.9 19.3 14.6 C19.3 18.65 16.03 21.9 12 21.9
           C7.97 21.9 4.7 18.65 4.7 14.6 C4.7 9.9 12 1.9 12 1.9 Z"
        {...soft}
        strokeWidth="0.8"
      />
      <path
        d="M8.5 14.9 C8.5 12.9 9.5 11.4 10.6 10.5"
        fill="none"
        stroke="var(--drop-gleam, rgba(255,255,255,.65))"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* ---------------- الهلال - Crescent ---------------- */
/* a true tapered crescent (outer arc R=9.9, inner arc r=10.12 offset
   up-right), but the two cusps are blunted by a round-joined stroke so
   the terminals match the roundness of every other shape in the set */
export function Crescent({ size = 24, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      {p.title && <title>{p.title}</title>}
      <path
        d="M6.32 3.89 A9.9 9.9 0 1 0 20.11 17.68 A10.12 10.12 0 0 1 6.32 3.89 Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ---------------- الشرارة - Sparkle ---------------- */
/* the delight mark: one big four-point star + a satellite */
export function Sparkle({ size = 24, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      {p.title && <title>{p.title}</title>}
      <path
        d="M10.1 1.6 C11.05 6.9 13.55 9.4 18.85 10.35 C13.55 11.3 11.05 13.8 10.1 19.1
           C9.15 13.8 6.65 11.3 1.35 10.35 C6.65 9.4 9.15 6.9 10.1 1.6 Z"
        {...soft}
        strokeWidth="0.7"
      />
      <path
        d="M18.6 14.3 C19.02 16.62 20.1 17.7 22.42 18.12 C20.1 18.54 19.02 19.62 18.6 21.94
           C18.18 19.62 17.1 18.54 14.78 18.12 C17.1 17.7 18.18 16.62 18.6 14.3 Z"
        {...soft}
        strokeWidth="0.6"
      />
    </svg>
  )
}

/* ---------------- الشعلة - Flame ---------------- */
/* the streak. inverse of the droplet: the oil becomes light. */
export function Flame({ size = 24, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      {p.title && <title>{p.title}</title>}
      <path
        d="M14.6 0.75 C9.6 4.6 8.15 8.6 9.7 12.3 C8.5 11.85 7.75 10.7 7.45 8.85
           C5.6 11.05 4.7 13.4 4.7 15.85 C4.7 19.85 7.9 23.1 11.9 23.1
           C15.95 23.1 19.3 19.9 19.3 15.75 C19.3 12.1 17.35 10.05 15.7 7.85
           C14.5 6.25 14.05 3.55 14.6 0.75 Z"
        {...soft}
        strokeWidth="0.75"
      />
    </svg>
  )
}

/* ---- the set, addressable by name ---- */
export const SIRAJ_ICONS = { Sun, Lantern, Star, Droplet, Crescent, Sparkle, Flame } as const
export type SirajIconName = keyof typeof SIRAJ_ICONS

export function Icon({ name, ...rest }: { name: SirajIconName } & IconProps) {
  const C = SIRAJ_ICONS[name]
  return <C {...rest} />
}
