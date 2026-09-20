import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { sfx, primeAudio } from '../../platform/sound'
import { haptic } from '../../platform/haptics'

type Tone = 'primary' | 'gold' | 'good' | 'quiet' | 'ghost' | 'danger'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone
  size?: 'lg' | 'md' | 'sm'
  block?: boolean
  children: ReactNode
  /** skip the click sound (for controls that make their own noise) */
  silent?: boolean
}

/* The chunky button: a solid colour slab sitting on a darker under-edge.
   Pressing it physically drops the slab onto the edge. That single detail
   is most of what makes this family of apps feel good to touch. */
export function Button({
  tone = 'primary', size = 'lg', block, children, silent, onPointerDown, onClick, className = '', ...rest
}: Props) {
  return (
    <button
      {...rest}
      className={`btn btn--${tone} btn--${size}${block ? ' btn--block' : ''} ${className}`}
      onPointerDown={(e) => {
        primeAudio()
        if (!silent) sfx.tap()
        haptic('tap')
        onPointerDown?.(e)
      }}
      onClick={onClick}
    >
      <span className="btn__label">{children}</span>
    </button>
  )
}

/** A borderless tap target that still gives audio + haptic feedback. */
export function IconButton({
  children, label, onClick, className = '', ...rest
}: { children: ReactNode; label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      aria-label={label}
      className={`iconbtn ${className}`}
      onPointerDown={() => {
        primeAudio()
        sfx.tap()
        haptic('tap')
      }}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
