/* Re-exported path helpers, so UI never imports the engine's internals
   piecemeal. Keeps the core/ boundary a single clean surface. */
export { currentNodeId, isCompleted, isUnlocked, completedCount, totalPlayable } from './progress'
import { NODE_INDEX } from '../content/path'

export function NODE_INDEX_SAFE(id: string): number {
  return NODE_INDEX.get(id) ?? 0
}
