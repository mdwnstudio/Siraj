/* Client half of اسأل سراج. Pure fetch - no DOM, ports to native as-is. */

import type { AskContext } from './systemPrompt'

export type AskState =
  | { status: 'idle' }
  | { status: 'thinking' }
  | { status: 'answered'; answer: string; sources: { title: string; url: string }[]; canned: boolean }
  | { status: 'error'; message: string; code: string }

export interface AskResult {
  ok: boolean
  answer?: string
  sources?: { title: string; url: string }[]
  message?: string
  code?: string
}

const ENDPOINT = '/api/chat'

/* The suggested-question pills answer from bundled text, so the feature
   still demonstrates itself with no server and no network. */
const OFFLINE = 'المحادثة المباشرة غير متاحة الآن، لكن الأسئلة المقترحة أعلاه تعمل دون اتصال.'

export async function askSiraj(question: string, context: AskContext): Promise<AskResult> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question, context }),
    })
    const data = await res.json().catch(() => null)
    if (!data) {
      return { ok: false, code: 'network', message: OFFLINE }
    }
    if (data.ok) return { ok: true, answer: data.answer, sources: data.sources ?? [] }
    return { ok: false, code: data.code ?? 'upstream', message: data.message ?? 'حدث خطأ.' }
  } catch {
    return { ok: false, code: 'network', message: OFFLINE }
  }
}
