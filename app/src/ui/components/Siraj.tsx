import { memo } from 'react'

export type Mood = 'idle' | 'wave' | 'cheer' | 'think' | 'sad' | 'peek'

/* BASE_URL, not a leading slash: GitHub Pages serves this from /Siraj/,
   and Vite only rewrites asset paths it can see in HTML and CSS, never
   plain strings in JS. */
const B = import.meta.env.BASE_URL
const MAIN = `${B}img/siraj-main.webp`
const WAVE = `${B}img/siraj-wave.webp`

const SRC: Record<Mood, string> = {
  idle: MAIN, think: MAIN, sad: MAIN, peek: MAIN,
  wave: WAVE, cheer: WAVE,
}

/* Two source images, six moods. The difference is rigging, not artwork:
   squash-and-stretch, tilt and bob are applied in CSS, which is why the
   character feels alive on a 35KB budget. */
export const Siraj = memo(function Siraj({
  mood = 'idle', size = 140, flip, className = '',
}: {
  mood?: Mood
  size?: number
  flip?: boolean
  className?: string
}) {
  return (
    <div
      className={`siraj siraj--${mood} ${className}`}
      style={{ width: size, ['--flip' as string]: flip ? -1 : 1 }}
    >
      <img
        src={SRC[mood]}
        alt=""
        width={size}
        height={Math.round(size * (mood === 'wave' || mood === 'cheer' ? 960 / 803 : 974 / 722))}
        draggable={false}
        decoding="async"
        fetchPriority={mood === 'wave' ? 'high' : 'auto'}
      />
      <span className="siraj__shadow" aria-hidden />
    </div>
  )
})
