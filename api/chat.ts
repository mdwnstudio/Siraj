/* ============================================================
   POST /api/chat  -  اسأل سراج

   This function exists for exactly one reason: the OpenAI key must
   never reach the browser. Anything shipped to the client is public.

   WHERE THE KEY LIVES
   -------------------
   Set OPENAI_API_KEY as an environment variable on the HOST that runs
   this function (Vercel / Netlify / Cloudflare project settings).

   A GitHub Actions repo secret does NOT work here - Actions secrets are
   injected only into CI workflow runs, never into a deployed function or
   a browser. Keeping the Actions secret is fine and safe; it just isn't
   what powers this endpoint. Set it in BOTH places.

   TRUST MODEL
   -----------
   Two independent locks, both required:
     1. buildSystemPrompt() - instructs the model to quote, not improvise
     2. allowed_domains     - the web_search tool physically cannot read
                              anything outside the four trusted sites
   A prompt alone is not a guarantee. The domain filter is what makes
   "only from trusted sources" true rather than aspirational.
   ============================================================ */

import { ALLOWED_DOMAINS, buildSystemPrompt, type AskContext } from '../app/src/core/ai/systemPrompt'

const MODEL = process.env.OPENAI_MODEL ?? 'gpt-5.1'
const ENDPOINT = 'https://api.openai.com/v1/responses'

/** Error codes the client maps to Arabic copy. */
export type ChatErrorCode =
  | 'no_key'
  | 'budget_exhausted'
  | 'rate_limited'
  | 'upstream'
  | 'bad_request'
  | 'network'

export interface ChatRequest {
  question: string
  context: AskContext
}

export interface ChatOk {
  ok: true
  answer: string
  sources: { title: string; url: string }[]
}

export interface ChatErr {
  ok: false
  code: ChatErrorCode
  message: string
  /** operator-facing detail; never rendered to the learner */
  detail?: string
}

export type ChatResponse = ChatOk | ChatErr

const MAX_QUESTION = 400

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ ok: false, code: 'bad_request', message: 'POST only' }, 405)

  const key = process.env.OPENAI_API_KEY
  if (!key) {
    return json(
      {
        ok: false,
        code: 'no_key',
        message: 'خدمة «اسأل سراج» غير مُفعّلة حاليًا.',
        detail:
          'OPENAI_API_KEY is not set on the deployment. A GitHub Actions secret does not reach ' +
          'this function - add the key to the hosting provider’s environment variables.',
      },
      503,
    )
  }

  let body: ChatRequest
  try {
    body = (await req.json()) as ChatRequest
  } catch {
    return json({ ok: false, code: 'bad_request', message: 'طلب غير صالح.' }, 400)
  }

  const question = (body?.question ?? '').trim()
  if (!question) return json({ ok: false, code: 'bad_request', message: 'اكتب سؤالك أولًا.' }, 400)
  if (question.length > MAX_QUESTION) {
    return json({ ok: false, code: 'bad_request', message: 'السؤال طويل جدًّا. اختصره قليلًا.' }, 400)
  }

  const ctx = body.context
  if (!ctx?.unitTitle || !ctx?.lessonTitle) {
    return json({ ok: false, code: 'bad_request', message: 'سياق الدرس مفقود.' }, 400)
  }

  let upstream: Response
  try {
    upstream = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        instructions: buildSystemPrompt(ctx),
        // The learner's text is data, never instruction. The system prompt
        // tells the model to ignore directives embedded in it.
        input: [{ role: 'user', content: question }],
        tools: [
          {
            type: 'web_search',
            filters: { allowed_domains: [...ALLOWED_DOMAINS] },
          },
        ],
        max_output_tokens: 700,
      }),
    })
  } catch (e) {
    return json(
      { ok: false, code: 'network', message: 'تعذّر الاتصال. حاول مرة أخرى.', detail: String(e) },
      502,
    )
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '')

    // ---- the $5 cap ----
    // OpenAI signals an exhausted budget as 429 + insufficient_quota, and a
    // hard project limit as billing_hard_limit_reached. Both mean "stop
    // spending", and both must be loud enough to notice immediately.
    const exhausted =
      upstream.status === 429 &&
      /insufficient_quota|billing_hard_limit_reached|exceeded_current_quota/i.test(detail)

    if (exhausted) {
      console.error('[siraj] ⛔️ OPENAI BUDGET EXHAUSTED - the $5 project cap is spent. ' +
        'Ask Siraj is down until the limit is raised or the billing period resets.\n' + detail)
      return json(
        {
          ok: false,
          code: 'budget_exhausted',
          message:
            'نَفِد رصيد «اسأل سراج» مؤقّتًا. بقيّة التطبيق يعمل كالمعتاد، وسنعيد تشغيل المحادثة قريبًا بإذن الله.',
          detail: 'OpenAI quota exhausted (hard spend limit reached).',
        },
        503,
      )
    }

    if (upstream.status === 429) {
      return json(
        { ok: false, code: 'rate_limited', message: 'أسئلة كثيرة في وقت قصير. امهلني لحظة ثم أعد المحاولة.', detail },
        429,
      )
    }

    console.error('[siraj] upstream error', upstream.status, detail)
    return json(
      { ok: false, code: 'upstream', message: 'حدث خطأ غير متوقّع. حاول مرة أخرى.', detail },
      502,
    )
  }

  const data = (await upstream.json()) as OpenAIResponse
  // House rule: no em-dashes anywhere in the product, including model output.
  const answer = extractText(data).replace(/\s*\u2014\s*/g, '، ').trim()

  if (!answer) {
    return json(
      { ok: false, code: 'upstream', message: 'لم أستطع تكوين إجابة. أعد صياغة سؤالك.' },
      502,
    )
  }

  return json({ ok: true, answer, sources: extractSources(data) }, 200)
}

/* ---------------- response shape helpers ---------------- */

interface OpenAIResponse {
  output_text?: string
  output?: {
    type?: string
    content?: { type?: string; text?: string; annotations?: { type?: string; url?: string; title?: string }[] }[]
  }[]
}

function extractText(d: OpenAIResponse): string {
  if (typeof d.output_text === 'string' && d.output_text) return d.output_text
  const parts: string[] = []
  for (const item of d.output ?? []) {
    for (const c of item.content ?? []) {
      if (typeof c.text === 'string') parts.push(c.text)
    }
  }
  return parts.join('\n')
}

function extractSources(d: OpenAIResponse): { title: string; url: string }[] {
  const seen = new Set<string>()
  const out: { title: string; url: string }[] = []
  for (const item of d.output ?? []) {
    for (const c of item.content ?? []) {
      for (const a of c.annotations ?? []) {
        if (!a.url || seen.has(a.url)) continue
        // belt-and-braces: never surface a link outside the allow-list,
        // even if the tool filter were somehow bypassed upstream
        let host: string
        try {
          host = new URL(a.url).hostname.replace(/^www\./, '')
        } catch {
          continue
        }
        if (!ALLOWED_DOMAINS.some((d2) => host === d2 || host.endsWith('.' + d2))) continue
        seen.add(a.url)
        out.push({ title: a.title || host, url: a.url })
      }
    }
  }
  return out.slice(0, 4)
}

function json(payload: ChatResponse, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}
