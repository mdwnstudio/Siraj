import { memo } from 'react'

export type Mood = 'idle' | 'wave' | 'cheer' | 'think' | 'sad' | 'peek'

const SRC: Record<Mood, string> = {
  idle: '/img/siraj-main.webp',
  think: '/img/siraj-main.webp',
  sad: '/img/siraj-main.webp',
  peek: '/img/siraj-main.webp',
  wave: '/img/siraj-wave.webp',
  cheer: '/img/siraj-wave.webp',
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
