/* ============================================================
   The Ask Siraj handler, shared by every host.

   Two thin entries wrap this:
     api/chat.ts        -> Vercel / Netlify style function
     worker/src/index.ts -> Cloudflare Worker  (what GitHub Pages needs)

   GitHub Pages is static only. It cannot run this file, and there is
   nowhere on Pages to hide an API key. The site is served by Pages; this
   handler must live somewhere that can hold a secret. See AGENTS.md §6.
   ============================================================ */

import { ALLOWED_DOMAINS, buildSystemPrompt, type AskContext } from '../app/src/core/ai/systemPrompt'

/** The OpenAI model id. The API requires a model name on every request,
 *  even when a project only permits one, so this must be a real id.
 *  Override per-deployment with the OPENAI_MODEL env var. */
export const DEFAULT_MODEL = 'gpt-5.6-luna'

const ENDPOINT = 'https://api.openai.com/v1/responses'
const MAX_QUESTION = 400

export interface ChatEnv {
  OPENAI_API_KEY?: string
  OPENAI_MODEL?: string
  /** comma separated; omit to allow any origin */
  ALLOWED_ORIGINS?: string
}

export type ChatErrorCode =
  | 'no_key' | 'budget_exhausted' | 'rate_limited'
  | 'upstream' | 'bad_request' | 'network'

export interface ChatRequest { question: string; context: AskContext }
export interface ChatOk { ok: true; answer: string; sources: { title: string; url: string }[] }
export interface ChatErr { ok: false; code: ChatErrorCode; message: string; detail?: string }
export type ChatResponse = ChatOk | ChatErr

/* ---------------- CORS ---------------- */

function corsHeaders(req: Request, env: ChatEnv): Record<string, string> {
  const origin = req.headers.get('origin') ?? ''
  const allowList = (env.ALLOWED_ORIGINS ?? '')
    .split(',').map((s) => s.trim()).filter(Boolean)

  // No list configured means allow anything. Fine for a demo, but set
  // ALLOWED_ORIGINS in production or anyone can spend your budget.
  const allow = allowList.length === 0 ? origin || '*' : allowList.includes(origin) ? origin : ''

  const h: Record<string, string> = {
    vary: 'origin',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
  }
  if (allow) h['access-control-allow-origin'] = allow
  return h
}

export async function handleChat(req: Request, env: ChatEnv): Promise<Response> {
  const cors = corsHeaders(req, env)

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (req.method !== 'POST') return json({ ok: false, code: 'bad_request', message: 'POST only' }, 405, cors)

  const key = env.OPENAI_API_KEY
  if (!key) {
    return json({
      ok: false, code: 'no_key',
      message: 'خدمة «اسأل سراج» غير مُفعّلة حاليًا.',
      detail: 'OPENAI_API_KEY is not set on this deployment. A GitHub Actions secret does not ' +
              'reach a running function; set it as a secret on the host that serves this endpoint.',
    }, 503, cors)
  }

  let body: ChatRequest
  try { body = (await req.json()) as ChatRequest }
  catch { return json({ ok: false, code: 'bad_request', message: 'طلب غير صالح.' }, 400, cors) }

  const question = (body?.question ?? '').trim()
  if (!question) return json({ ok: false, code: 'bad_request', message: 'اكتب سؤالك أولًا.' }, 400, cors)
  if (question.length > MAX_QUESTION)
    return json({ ok: false, code: 'bad_request', message: 'السؤال طويل جدًّا. اختصره قليلًا.' }, 400, cors)

  const ctx = body.context
  if (!ctx?.unitTitle || !ctx?.lessonTitle)
    return json({ ok: false, code: 'bad_request', message: 'سياق الدرس مفقود.' }, 400, cors)

  let upstream: Response
  try {
    upstream = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || DEFAULT_MODEL,
        instructions: buildSystemPrompt(ctx),
        // The learner's text is data, never instruction. The system prompt
        // tells the model to ignore directives embedded in it.
        input: [{ role: 'user', content: question }],
        tools: [{ type: 'web_search', filters: { allowed_domains: [...ALLOWED_DOMAINS] } }],
        max_output_tokens: 700,
      }),
    })
  } catch (e) {
    return json({ ok: false, code: 'network', message: 'تعذّر الاتصال. حاول مرة أخرى.', detail: String(e) }, 502, cors)
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '')

    // The spend cap. OpenAI reports an exhausted budget as 429 +
    // insufficient_quota, and a hard project limit as billing_hard_limit_reached.
    const exhausted = upstream.status === 429 &&
      /insufficient_quota|billing_hard_limit_reached|exceeded_current_quota/i.test(detail)

    if (exhausted) {
      console.error('[siraj] BUDGET EXHAUSTED: the project spend cap is spent. ' +
        'Ask Siraj is down until the limit is raised or the billing period resets.\n' + detail)
      return json({
        ok: false, code: 'budget_exhausted',
        message: 'نَفِد رصيد «اسأل سراج» مؤقّتًا. بقيّة التطبيق يعمل كالمعتاد، وسنعيد تشغيل المحادثة قريبًا بإذن الله.',
        detail: 'OpenAI quota exhausted (hard spend limit reached).',
      }, 503, cors)
    }

    if (upstream.status === 429)
      return json({ ok: false, code: 'rate_limited', message: 'أسئلة كثيرة في وقت قصير. امهلني لحظة ثم أعد المحاولة.', detail }, 429, cors)

    console.error('[siraj] upstream error', upstream.status, detail)
    return json({ ok: false, code: 'upstream', message: 'حدث خطأ غير متوقّع. حاول مرة أخرى.', detail }, 502, cors)
  }

  const data = (await upstream.json()) as OpenAIResponse
  // House rule: no em-dashes anywhere in the product, including model output.
  const answer = extractText(data).replace(/\s*\u2014\s*/g, '، ').trim()

  if (!answer)
    return json({ ok: false, code: 'upstream', message: 'لم أستطع تكوين إجابة. أعد صياغة سؤالك.' }, 502, cors)

  return json({ ok: true, answer, sources: extractSources(data) }, 200, cors)
}

/* ---------------- response shape ---------------- */

interface OpenAIResponse {
  output_text?: string
  output?: {
    content?: { text?: string; annotations?: { url?: string; title?: string }[] }[]
  }[]
}

function extractText(d: OpenAIResponse): string {
  if (typeof d.output_text === 'string' && d.output_text) return d.output_text
  const parts: string[] = []
  for (const item of d.output ?? [])
    for (const c of item.content ?? [])
      if (typeof c.text === 'string') parts.push(c.text)
  return parts.join('\n')
}

function extractSources(d: OpenAIResponse): { title: string; url: string }[] {
  const seen = new Set<string>()
  const out: { title: string; url: string }[] = []
  for (const item of d.output ?? []) {
    for (const c of item.content ?? []) {
      for (const a of c.annotations ?? []) {
        if (!a.url || seen.has(a.url)) continue
        // third lock: never surface a link outside the allow-list, even if
        // the tool filter were somehow bypassed upstream
        let host: string
        try { host = new URL(a.url).hostname.replace(/^www\./, '') } catch { continue }
        if (!ALLOWED_DOMAINS.some((d2) => host === d2 || host.endsWith('.' + d2))) continue
        seen.add(a.url)
        out.push({ title: a.title || host, url: a.url })
      }
    }
  }
  return out.slice(0, 4)
}

function json(payload: ChatResponse, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}
