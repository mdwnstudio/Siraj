import { memo, useMemo } from 'react'
import { Sparkle, Star, Droplet } from '../icons/SirajIcons'

type Flavour = 'gold' | 'ember' | 'mixed'

/* Celebration particles, built from the brand icons rather than generic
   confetti. Everything is a single CSS animation on transform+opacity, so
   forty particles still composite on the GPU in one frame. */
export const Burst = memo(function Burst({
  count = 22, flavour = 'mixed', spread = 190, className = '',
}: {
  count?: number
  flavour?: Flavour
  spread?: number
  className?: string
}) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        // deterministic pseudo-random, so React re-renders don't re-scatter
        const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1
        const angle = r(1) * Math.PI * 2
        const dist = spread * (0.42 + r(2) * 0.58)
        return {
          i,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - spread * 0.22, // bias upward
          rot: (r(3) - 0.5) * 540,
          scale: 0.5 + r(4) * 0.8,
          delay: r(5) * 120,
          dur: 760 + r(6) * 520,
          kind: Math.floor(r(7) * 3),
        }
      }),
    [count, spread],
  )

  return (
    <div className={`burst burst--${flavour} ${className}`} aria-hidden>
      {bits.map((b) => (
        <span
          key={b.i}
          className={`burst__bit burst__bit--${b.kind}`}
          style={{
            ['--x' as string]: `${b.x}px`,
            ['--y' as string]: `${b.y}px`,
            ['--r' as string]: `${b.rot}deg`,
            ['--s' as string]: b.scale,
            animationDelay: `${b.delay}ms`,
            animationDuration: `${b.dur}ms`,
          }}
        >
          {b.kind === 0 ? <Sparkle size={16} /> : b.kind === 1 ? <Star size={13} /> : <Droplet size={11} />}
        </span>
      ))}
    </div>
  )
})

/** A single expanding ring of light - the "something just happened" pulse. */
export function Shockwave({ className = '' }: { className?: string }) {
  return <span className={`shockwave ${className}`} aria-hidden />
}
