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

/* Same-origin by default (Vercel/Netlify). On GitHub Pages the site is
   static, so the function lives elsewhere: set VITE_CHAT_ENDPOINT to the
   Worker's absolute URL at build time. */
const ENDPOINT = import.meta.env.VITE_CHAT_ENDPOINT || '/api/chat'

/* The suggested-question pills answer from bundled text, so the feature
   still demonstrates itself with no server and no network. */
const OFFLINE = 'المحادثة المباشرة غير متاحة الآن، لكن الأسئلة المقترحة أعلاه تعمل دون اتصال.'

export interface StreamHandlers {
  /** what Siraj is doing: searching the sources, or writing the reply */
  onStatus?: (s: 'searching' | 'writing') => void
  /** the answer text so far, growing as it streams in */
  onText?: (soFar: string) => void
}

/* Streams the answer as it is written. Falls back cleanly when the
   endpoint is an older deployment that only speaks plain JSON, or when
   the runtime cannot read a response body incrementally. */
export async function askSirajStream(
  question: string, context: AskContext, h: StreamHandlers = {},
): Promise<AskResult> {
  let res: Response
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question, context, stream: true }),
    })
  } catch {
    return { ok: false, code: 'network', message: OFFLINE }
  }

  const type = res.headers.get('content-type') ?? ''
  if (!type.includes('ndjson')) {
    const data = await res.json().catch(() => null)
    if (!data) return { ok: false, code: 'network', message: OFFLINE }
    if (data.ok) return { ok: true, answer: data.answer, sources: data.sources ?? [] }
    return { ok: false, code: data.code ?? 'upstream', message: data.message ?? 'حدث خطأ.' }
  }

  let text = ''
  let result: AskResult | null = null
  const handle = (line: string) => {
    if (!line.trim()) return
    let ev: { t: string; s?: 'searching' | 'writing'; d?: string; answer?: string; sources?: AskResult['sources']; code?: string; message?: string }
    try { ev = JSON.parse(line) } catch { return }
    if (ev.t === 'status' && ev.s) h.onStatus?.(ev.s)
    else if (ev.t === 'delta' && ev.d) { text += ev.d; h.onText?.(text) }
    else if (ev.t === 'done') result = { ok: true, answer: ev.answer, sources: ev.sources ?? [] }
    else if (ev.t === 'error') result = { ok: false, code: ev.code ?? 'upstream', message: ev.message ?? 'حدث خطأ.' }
  }

  try {
    if (res.body && typeof res.body.getReader === 'function') {
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buf = ''
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        let nl: number
        while ((nl = buf.indexOf('\n')) !== -1) {
          handle(buf.slice(0, nl))
          buf = buf.slice(nl + 1)
        }
      }
      handle(buf)
    } else {
      (await res.text()).split('\n').forEach(handle)
    }
  } catch {
    // the connection dropped mid-answer: keep what arrived, if anything
  }

  if (result) return result
  if (text.trim()) return { ok: true, answer: text.trim(), sources: [] }
  return { ok: false, code: 'network', message: OFFLINE }
}

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
