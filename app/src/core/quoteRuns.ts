/* ============================================================
   An ayah or hadith quoted inside running text is set apart in
   its own colour. Pure, no DOM: this only finds where they are.

   A quote is a «…» (Arabic) or “…” (English) straight followed by
   its reference in brackets: «لا صلاةَ لمن…» (متفق عليه). That is
   how every lesson cites one, and it keeps a phrase in «» that is
   not a quote («الله أكبر», «مُسلِمًا») in the plain text colour.
   ============================================================ */

export interface Run {
  text: string
  /** an ayah or hadith, quote marks included */
  quote: boolean
}

const QUOTE = /«[^«»]+»(?=\s*\()|“[^“”]+”(?=\s*\()/g

export function quoteRuns(text: string): Run[] {
  const out: Run[] = []
  let at = 0
  for (const m of text.matchAll(QUOTE)) {
    const i = m.index ?? 0
    if (i > at) out.push({ text: text.slice(at, i), quote: false })
    out.push({ text: m[0], quote: true })
    at = i + m[0].length
  }
  if (at < text.length) out.push({ text: text.slice(at), quote: false })
  return out
}
