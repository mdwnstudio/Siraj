/* Turns a model answer into display segments. Pure, no DOM.

   Two jobs:
   1. A link that is already listed under the answer's sources is noise in
      the text, so it is dropped (with the brackets and parens around it).
   2. Any other link is kept, but shown as a short label, e.g.
      "sunnah.com/bukhari…", never as a raw 120-character URL.
   3. A trusted site named in the text ("ارجع إلى islamqa.info") becomes a
      link too: to the page on that site the answer actually cites, or
      else to the site itself. Only the four trusted domains are linked. */

import { ALLOWED_DOMAINS } from './systemPrompt'

export type Segment =
  | { k: 'text'; v: string }
  | { k: 'bold'; v: string }
  | { k: 'link'; label: string; url: string }

/** Comparable form of a URL: no scheme, no www, no tracking, no trailing slash. */
export function urlKey(raw: string): string {
  try {
    const u = new URL(raw)
    for (const k of [...u.searchParams.keys()]) if (k.startsWith('utm_')) u.searchParams.delete(k)
    const q = u.searchParams.toString()
    return (u.hostname.replace(/^www\./, '') + decodeURI(u.pathname).replace(/\/+$/, '') + (q ? '?' + q : '')).toLowerCase()
  } catch {
    return raw.toLowerCase()
  }
}

/** "https://www.islamqa.info/ar/answers/12345/some-long-slug?x=1" -> "islamqa.info/ar/answers…" */
export function shortUrl(raw: string, max = 24): string {
  try {
    const u = new URL(raw)
    const host = u.hostname.replace(/^www\./, '')
    const path = decodeURI(u.pathname).replace(/\/+$/, '')
    if (!path) return host
    const full = host + path
    if (full.length <= max) return full
    // keep whole path segments while they fit: "sunnah.com/bukhari…"
    let label = host
    for (const seg of path.split('/').filter(Boolean)) {
      if ((label + '/' + seg).length > max) break
      label += '/' + seg
    }
    return label + '…'
  } catch {
    return raw.length > max ? raw.slice(0, max) + '…' : raw
  }
}

function tidy(raw: string): string {
  try {
    const u = new URL(raw)
    for (const k of [...u.searchParams.keys()]) if (k.startsWith('utm_')) u.searchParams.delete(k)
    return u.toString()
  } catch { return raw }
}

const SITES = ALLOWED_DOMAINS.map((d) => d.replace(/\./g, '\\.')).join('|')

// [label](url) with optional wrapping parens, or a bare url, or **bold**,
// or a trusted site named without its scheme (islamqa.info, sunnah.com/...)
const TOKEN = new RegExp(
  String.raw`\(?\[([^\]\n]*)\]\((https?:\/\/[^\s)]+)\)\)?|(https?:\/\/[^\s<>()"'،؛]+[^\s<>()"'،؛.,:!?])|\*\*([^*\n]+)\*\*` +
  String.raw`|(?<![\w.@/-])((?:www\.)?(?:${SITES})(?:\/[^\s<>()"'،؛]*[^\s<>()"'،؛.,:!?])?)(?![\w-])`,
  'gi',
)

/** The page on this site the answer cites, or the site's front page. A path
 *  the model wrote is followed only when it is one of the cited pages: a
 *  written path could be invented, a cited one was really found. */
function siteLink(named: string, sources: { url: string }[]): string {
  const bare = named.replace(/^www\./i, '')
  if (bare.includes('/')) {
    const exact = sources.find((s) => urlKey(s.url) === urlKey('https://' + bare))
    if (exact) return tidy(exact.url)
  }
  const host = bare.split('/')[0].toLowerCase()
  const cited = sources.find((s) => {
    try { return new URL(s.url).hostname.replace(/^www\./, '') === host } catch { return false }
  })
  return cited ? tidy(cited.url) : `https://${host}/`
}

export function parseAnswer(
  text: string,
  sources: { url: string }[] = [],
  opts: { streaming?: boolean } = {},
): Segment[] {
  let src = text
  // mid-stream, a half-written [label](url is hidden until it completes,
  // so the learner never sees markdown flicker into a link
  if (opts.streaming) {
    src = src.replace(/\(?\[[^\]\n]*(\]\([^)\s]*)?$/, '').replace(/(?<!\*)\*$/, '')
    // an odd number of ** means a bold run is still open: hold it back
    if ((src.match(/\*\*/g) ?? []).length % 2) src = src.slice(0, src.lastIndexOf('**'))
  }

  const known = new Set(sources.map((s) => urlKey(s.url)))
  const out: Segment[] = []
  const pushText = (v: string) => {
    if (!v) return
    const last = out[out.length - 1]
    if (last?.k === 'text') last.v += v
    else out.push({ k: 'text', v })
  }

  let at = 0
  for (const m of src.matchAll(TOKEN)) {
    pushText(src.slice(at, m.index))
    at = m.index! + m[0].length
    const [whole, mdLabel, mdUrl, bare, bold, site] = m
    if (bold !== undefined) { out.push({ k: 'bold', v: bold }); continue }
    // a named site is the learner's way in, so it stays even when it is also a source
    if (site !== undefined) { out.push({ k: 'link', label: site, url: siteLink(site, sources) }); continue }

    const url = mdUrl ?? bare!
    if (known.has(urlKey(url))) continue

    // parens only belong to the link when both sides were captured
    if (mdUrl && whole.startsWith('(') !== whole.endsWith('))')) {
      if (whole.startsWith('(')) pushText('(')
    }
    const label = mdLabel && !/^https?:\/\//.test(mdLabel.trim()) && mdLabel.trim().length <= 40
      ? mdLabel.trim()
      : shortUrl(url)
    out.push({ k: 'link', label, url: tidy(url) })
    if (mdUrl && !whole.startsWith('(') && whole.endsWith('))')) pushText(')')
  }
  pushText(src.slice(at))

  // dropping a link can leave "  ." or a blank trailing line behind
  for (const s of out) if (s.k === 'text') s.v = s.v.replace(/[ \t]+([.,،؛:])/g, '$1').replace(/[ \t]{2,}/g, ' ')
  const last = out[out.length - 1]
  if (last?.k === 'text') {
    // "المصدر:" with its link removed has nothing left to introduce
    last.v = last.v.replace(/[\s\-•]*(?:المصدر|المصادر|الرابط|الروابط)\s*[:：]?\s*$/, '').replace(/\s+$/, '')
    if (!last.v) out.pop()
  }
  return out
}
