import type { Lang } from '../core/i18n'

/* When the learner picks a language, the frame stays where it is and only
   the text changes sides: Arabic sits on the right, English on the left.
   Instead of the words jumping across, each marked line slides from where
   the old language kept it to where the new one does.

   Call it after the new text has rendered (a layout effect). Every element
   marked [data-slide] is measured: the distance is the free space beside
   its text, so a short line crosses its whole box and a full paragraph,
   which has no room to move, only fades. Transform and opacity only. */
export function slideText(root: Element | null, to: Lang, selector = '[data-slide]'): void {
  if (!root) return
  for (const el of root.querySelectorAll<HTMLElement>(selector)) {
    if (!el.clientWidth) continue
    const range = document.createRange()
    range.selectNodeContents(el)
    const text = range.getBoundingClientRect().width
    const box = el.clientWidth
    const room = Math.max(0, box - text)
    // English now sits on the left, so it arrives from the right; Arabic the reverse
    const from = to === 'en' ? room : -room
    el.animate(
      [
        { transform: `translate3d(${from}px,0,0)`, opacity: 0.25 },
        { transform: 'translate3d(0,0,0)', opacity: 1 },
      ],
      { duration: 460, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
    )
  }
}

/** the lines that carry across when the language changes inside the app */
export const APP_TEXT = [
  '.unitcard__main > div', '.page__title', '.phero__title', '.phero__text',
  '.section__label', '.section__note', '.srow__label', '.profile__name', '.profile__lvl',
  '.rcard__title', '.rcard__note', '.rcard__kicker', '.rcard--next__title', '.rcard--next__meta',
  '.badge__t', '.badge__n', '.gstat__k', '.ask__say', '.ask__note',
].join(',')
