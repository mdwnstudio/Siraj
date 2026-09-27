import { useApp, useT } from '../state'
import { UNITS, UNIT_OF, unitText } from '../../core/content/path'
import { currentNodeId, isCompleted, isUnlocked } from '../../core/engine/pathView'
import { Icon } from '../icons/SirajIcons'
import { Check, Sheet } from './AskSheets'
import { sfx, primeAudio } from '../../platform/sound'
import { haptic } from '../../platform/haptics'

/* The unit chooser, opened from under the unit's name on the stair.
   Every unit is listed in the order of the stair, so the road ahead is
   visible; one is picked only once its first step is open, and picking
   it carries the camera to that step. Its own chunk, like the gift. */

export function UnitSheet({ shown, onPick, onClose }: {
  /** the unit the banner names right now */
  shown: string
  onPick: (unitId: string) => void
  onClose: () => void
}) {
  const { progress } = useApp()
  const t = useT()
  const lang = progress.language
  const here = UNIT_OF.get(currentNodeId(progress))?.id

  return (
    <Sheet label={t.unitsTitle} onClose={onClose}>
      <p className="sheet__note">{t.unitsNote}</p>
      <div className="tgroup__rows">
        {UNITS.map((u) => {
          const open = isUnlocked(progress, u.nodes[0].id)
          const done = u.nodes.filter((n) => isCompleted(progress, n.id)).length
          const all = done === u.nodes.length
          const on = u.id === shown
          const text = unitText(u, lang)
          return (
            <button key={u.id} className={`trow urow urow--${u.tone}${on ? ' is-on' : ''}`} disabled={!open}
              aria-current={on || undefined}
              onClick={() => { primeAudio(); sfx.select(); haptic('tap'); onPick(u.id) }}>
              <span className="trow__ico urow__ico"><Icon name={u.icon} size={20} /></span>
              <span className="trow__main">
                <span className="trow__note">{t.unitKicker(u.index + 1, text.subtitle)}</span>
                <span className="trow__title">{text.title}</span>
                {(!open || all || u.id === here) && (
                  <span className={`trow__note${all ? ' is-done' : open ? ' is-here' : ''}`}>
                    {all ? t.unitDone : open ? t.topicHere : t.unitLocked}
                  </span>
                )}
              </span>
              {open && !all && <span className="urow__count num">{done}/{u.nodes.length}</span>}
              {on && <Check />}
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}
