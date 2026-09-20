# سراج: Siraj

> The Duolingo for learning Islam. A staircase you climb, one step at a time.

Built for a hackathon on the track **«التجارب التفاعلية والرحلة المعرفية للتعريف بالإسلام وتعلمه»**.
The tech demo covers **أركان الإسلام الخمسة** (the five pillars).

This file is the contract for anyone: human or agent: working on this repo.
Read it before touching anything.

---

## 0. House rules

These are not suggestions.

1. **No em-dashes.** Not in UI copy, not in lesson content, not in code comments,
   not in model output. Use `،` `:` `؛` or split the sentence. The API layer
   strips any the model returns (`api/chat.ts`). If you add copy, check it.
2. **`src/core/` never imports from `src/ui/` or touches the DOM.** This is what
   makes the native port cheap. See §3.
3. **Religious content is reviewed, not improvised.** See §7.
4. **Animate `transform` and `opacity` only.** Never `width`, `height`, `top`, `left`.
5. **Every new string is Arabic-first and RTL-correct.** See §8 for the traps.

---

## 1. Running it

```bash
cd app
npm install
npm run dev        # http://localhost:5173
npm run build      # -> app/dist
npm run typecheck
```

Node 20+. No database, no backend needed to run the app. The only server-side
piece is the Ask Siraj proxy (§6), and the app degrades gracefully without it.

---

## 2. What the app does

```
splash  ->  onboarding  ->  home (the stair)
                               |
                               v
                        tap a step -> warmup -> LESSON
                                                  |
                                    تعلّم (cards) -> رسّخ (exercises) -> اسأل سراج
                                                  |
                                                  v
                                          result -> back to the stair,
                                                    next step lights up
```

**The stair (الدرج)** is the home screen and the core metaphor, taken from the
Duolingo case study: the path runs **bottom to top**. Finished steps are solid
coloured slabs below you; the road ahead ghosts upward into the distance,
shrinking and fading. Moving forward means moving up. The destination is always
visible.

**A lesson is two phases, never one.** The brief was explicitly *not* generic
quizzing: you **learn first**, then the exercises **make it stick**. Every
exercise draws only on what the cards just taught.

---

## 3. Architecture: why it ports to native cheaply

The hard rule is the `core/` boundary.

```
app/src/
  core/                 <-- pure TypeScript. ZERO DOM, ZERO React.
    types.ts            domain model
    content/
      lessons.ts        the curriculum
      path.ts           the stair: units and nodes
    engine/
      progress.ts       xp, streak, oil, unlocking, achievements
      grading.ts        answer checking for all five exercise kinds
      pathView.ts       the single surface the UI imports
    ai/
      systemPrompt.ts   the Ask Siraj guardrail
      askSiraj.ts       typed client (plain fetch)
    storage.ts          an INTERFACE, plus a shared "never trust storage" reviver

  platform/             <-- the only files a native port rewrites
    webStorage.ts       localStorage  -> AsyncStorage / MMKV
    sound.ts            WebAudio      -> expo-av / react-native-sound
    haptics.ts          navigator.vibrate -> expo-haptics

  ui/                   <-- React + Framer Motion (web only)
    icons/  components/  screens/  state.tsx

  styles/
    tokens.css          THE source of truth for colour, type, depth, motion
    app.css             components and keyframes
```

**To port to React Native / Expo:** copy `core/` verbatim, write three new files
in `platform/`, rebuild `ui/`. Nothing in `core/` knows a browser exists.
`tokens.css` becomes a tokens object.

**To ship a native binary with zero rewrite:** Capacitor wraps this exact build
into a real `.ipa` / `.apk`. Both doors are deliberately left open.

**Never** import React, `window`, or `document` from anything under `core/`.
If you need a platform capability, add it to `platform/` behind an interface.

---

## 4. The Siraj Seven (icons)

A closed icon vocabulary, the way Material You repeats a small shape set.
`src/ui/icons/SirajIcons.tsx`. Every icon in the app is one of these seven.
Do not add an eighth without a very good reason.

| Icon | Arabic | Job |
|---|---|---|
| **Sun** (rising over a horizon) | الشمس | Home / the path. The "climb toward the light" metaphor. |
| **Lantern** (Siraj's silhouette) | السراج | Ask Siraj. The brand mark itself. |
| **Star** (8-point khatam) | النجمة | XP and mastery |
| **Droplet** | القطرة | **Oil for the lamp = your lives.** Wrong answer, the lamp dims. |
| **Crescent** | الهلال | Review and return |
| **Sparkle** | الشرارة | Celebration, "new", the moment of delight |
| **Flame** | الشعلة | Streak. The lamp stays lit. |

Grammar: 24x24 box, solid fills, `currentColor`, rounded corners via the
fill+stroke trick. They must stay legible at 20px: that is the real constraint.

The droplet-as-oil idea is load-bearing: it is a better metaphor than hearts
because the lamp is the brand.

---

## 5. Lesson content

`src/core/content/lessons.ts`. A lesson is:

```ts
{ id, title, icon, xp,
  cards:     Card[],       // تعلّم
  exercises: Exercise[],   // رسّخ
  ask:       AskSuggestion[] }  // 3 questions with pre-written answers
```

### Card kinds
- `fact`: one atomic idea. Optional `term` renders a tap-to-reveal definition.
  Optional `art` shows Siraj or one of the seven icons.
- `quote`: آية or حديث, in the reverent gold frame. **Always cite the source.**
- `list`: the numbered/iconed list (the five pillars, the five prayers).

### Exercise kinds (five, all implemented)
| Kind | Arabic | Mechanic |
|---|---|---|
| `order` | رتّب الخطوات | Tap items into sequence. **The signature mechanic**: ritual order (wudu, prayer times) is genuinely what a beginner needs to learn. |
| `choice` | اختر الصحيح | Multiple choice, tiles not radio buttons |
| `boolean` | صح أم خطأ | Two big tiles. Good for misconceptions. |
| `match` | طابِق | Two columns, tap a pair. Correct pairs pop and vanish. Self-resolving. |
| `sort` | صنّف | One card at a time, flung into one of two buckets. Self-resolving. |

`match` and `sort` have **no check button**: they resolve as you go. The footer
shows a hint instead. If you add a sixth kind, wire it in `grading.ts`,
`Exercises.tsx`, and the `canCheck` logic in `Lesson.tsx`.

### Current scope
Playable: `٠ البداية`, `١ الشهادة`, `٢ الصلاة` (2 lessons each).
On the stair but marked `soon: true`: `٣ الزكاة`, `٤ الصوم`, `٥ الحج`.
Writing those three is the single highest-value next task.

---

## 6. Ask Siraj (the AI)

### Where the key lives: read this before debugging

**GitHub Pages is static hosting. It cannot run `api/chat.ts`, and there is
nowhere on Pages to hide a key.** Anything shipped to the browser is public, and
an exposed OpenAI key gets drained within hours. So the deployment is split:

| piece | host | holds the key? |
|---|---|---|
| the site (`app/dist`) | GitHub Pages | no |
| Ask Siraj (`server/chatHandler.ts`) | Cloudflare Worker | **yes** |

The handler lives in `server/chatHandler.ts` and is shared verbatim by two thin
entries: `worker/src/index.ts` (Cloudflare) and `api/chat.ts` (Vercel/Netlify,
kept for portability). Only one needs to be deployed.

Set on the **Worker**, never in the repo and never in the build:

```bash
cd worker
npx wrangler secret put OPENAI_API_KEY
```

Set on the **repo** (Settings > Secrets and variables > Actions > *Variables*):

```
CHAT_ENDPOINT = https://siraj-chat.<subdomain>.workers.dev
```

That is a public URL, so it is a variable and not a secret. The build bakes it
in as `VITE_CHAT_ENDPOINT`.

> A GitHub **Actions secret** never reaches a deployed function or a browser.
> It is encrypted and safe to keep, but it cannot power this endpoint, and
> baking it into a static build would publish it. The workflow deliberately
> does not read `OPENAI_API_KEY`.

**The model id** is `DEFAULT_MODEL` in `server/chatHandler.ts`. The OpenAI API
requires a model name on every request even when a project permits only one, so
the id string still has to be sent. Override per-deployment with `OPENAI_MODEL`.

**CORS:** the site and the Worker are different origins, so `ALLOWED_ORIGINS` in
`worker/wrangler.toml` must list the Pages origin. This blocks other browser
origins from reading responses, but it is not authentication. Keep the OpenAI
project spend cap enabled, and add a Cloudflare rate-limit rule if abuse becomes
a concern.

**Base path:** Pages serves a project site from `/Siraj/`, so `vite.config.ts`
sets that as the production `base`. Vite rewrites asset URLs in HTML and CSS
automatically, but **not plain strings in JS** - `components/Siraj.tsx` builds
its image paths from `import.meta.env.BASE_URL` for exactly this reason. If you
add an asset path in JS, do the same. Moving to a custom domain means
`SIRAJ_BASE=/`.

### The guardrail: two independent locks

1. **`buildSystemPrompt()`** (`core/ai/systemPrompt.ts`): instructs the model to
   quote rather than improvise, to follow the salafi manhaj, to refuse anything
   outside the current lesson's taught concepts, to never issue a personal fatwa,
   and to say «لم أجد لهذا جوابًا في مصادري الموثوقة» rather than guess.
2. **`allowed_domains`** on the `web_search` tool: the model physically cannot
   read anything outside:
   - `islamqa.info`
   - `dorar.net`
   - `quran.com`
   - `sunnah.com`

**Keep both.** A prompt alone is an instruction, not a guarantee; the domain
filter is what makes "only from trusted sources" true rather than aspirational.
`extractSources()` re-checks every returned URL against the allow-list as a
third belt.

The prompt also receives the learner's current unit, lesson, and the exact
concepts those cards taught, so "on topic" is defined by what they have actually
seen: it can never drift from the content.

### The $5 spend cap

`api/chat.ts` detects `insufficient_quota` / `billing_hard_limit_reached` on a
429 and returns `code: 'budget_exhausted'`. It logs

```
[siraj] BUDGET EXHAUSTED - the $5 project cap is spent.
```

to the server console, and shows the learner a calm Arabic message saying the
rest of the app still works. **If Ask Siraj goes quiet, check the function logs
for that line first.**

Note that `web_search` costs more per call than a plain completion. The
suggested-question pills answer from **bundled text with no network call at all**,
so the feature demos fully at zero cost and works offline. Only free-typed
questions spend money.

---

## 7. Religious content: the review rule

The content sticks to broadly agreed, introductory-level material and cites every
آية (surah:ayah) and حديث (collection). Pillar ordering follows حديث جبريل
(رواه مسلم) so the teaching card and the ordering exercise can never contradict
each other: if you change one, change both.

**Before this ships publicly, the content must be reviewed by a qualified person.**
There is a note to this effect at the top of `lessons.ts` and in the app's
own "عن سراج" section. Do not remove either.

When adding content: prefer what is agreed over what is disputed, avoid madhhab
disputes in beginner material, and never state a ruling the cited source does not
actually contain.

---

## 8. RTL traps that have already bitten us

The app is `dir="rtl"`. These cost real debugging time: do not repeat them.

- **Centring must be physical.** `inset-inline-start: 50%` + `translateX(-50%)`
  double-shifts in RTL. Use `left: 50%`.
- **Over-constrained boxes:** if a base rule sets `inset-inline-start` and a
  variant sets `left`, RTL resolves the *inline-start* one and your `left` is
  silently ignored. Reset with `inset-inline-start: auto; right: auto`.
- **Numbers need isolation.** `.num` sets `direction: ltr; unicode-bidi: isolate`.
  Any suffix (`٪`, `%`) must live **inside** that span or RTL throws it to the
  far side of the number.
- **Stats use Western digits** deliberately: they scan far faster. Arabic-Indic
  `٠` renders as a small dot and reads as a rendering bug. `toAr()` is for
  ordinals in prose only.
- **Gender agreement:** «يومٌ متتالٍ» (singular) vs «أيام متتالية» (plural).
  Do not template `{n} يوم متتالية`.
- **Flex `align-self`:** `flex-end` is the *left* in RTL. Siraj's chat replies
  use `flex-start` so they sit on the side his head is on.

---

## 9. Motion

Guidance from the `animate` skill. `tokens.css` holds the easing curves.

- Entering: `ease-out`, 200-300ms. Exiting: `ease-in`, ~75% of the enter duration.
- `--e-back` (overshoot) is the "pop". `--e-elastic` is the big win. Use sparingly.
- Springs for anything interruptible.
- **The chunky button** (`.btn`) is the single most important detail: a colour
  slab on a darker under-edge that physically drops on press
  (`box-shadow: 0 var(--depth) 0 var(--edge)` -> `0 0 0`). The slabs on the stair
  use the same trick. Keep it.
- **Correct-answer sound rises with the streak** (`sfx.correct(streak)`), so the
  fifth in a row genuinely sounds better than the first. That is the hook.
- **`prefers-reduced-motion` and the in-app "تقليل الحركة" toggle** both add
  `.calm`, which kills bursts, shockwaves and idle loops but keeps every
  transition legible. Test with it on.

### A positioning trap
`position: fixed` inside a transformed ancestor resolves against **that ancestor**,
not the viewport. The lesson panel slides in with a transform, so its children
must be `position: absolute` inside it. `.lesson`, `.result` and `.warmup` are all
absolute within `.shell` for exactly this reason. Do not "fix" them back.

---

## 10. Performance

Budget: near-instant load. Current production build, gzipped:

| | size |
|---|---|
| app JS | ~27 KB |
| React | ~69 KB |
| Framer Motion | ~42 KB |
| CSS (single file) | ~9 KB |
| fonts (3 preloaded, subset woff2) | ~160 KB |
| Siraj artwork (2 x WebP) | ~76 KB |

Rules that keep it there:

- **Fonts are subset and converted to woff2.** 150 KB `.otf` -> ~52 KB. Only
  Regular/Medium/Bold/Black + Norsal ship; three are preloaded in `index.html`.
- **Images are WebP.** 337 KB PNG -> 34 KB. Trimmed to their alpha bbox first.
- **There are no audio files.** Every sound is synthesised at call time by
  WebAudio on a pentatonic scale (`platform/sound.ts`). Zero bytes, zero latency.
- **Celebration particles are brand icons**, not sprite sheets, animated purely
  on `transform`/`opacity` so 40 of them composite in one frame.
- **The splash is inlined in `index.html`** as a solid `#FEBD01` div, so the brand
  colour paints before any JS parses and hands off seamlessly to the React splash.
- CSS is a single file (`cssCodeSplit: false`); vendor chunks are split manually.

If you add a dependency, check the gzip delta. Framer Motion is the heaviest
thing here and it earns its place; a second animation library would not.

---

## 11. Brand

Colours (`tokens.css` is authoritative):

| | |
|---|---|
| orange | `#FE6209` |
| yellow | `#FEBD01` |
| maroon | `#450705` |
| cream | `#F9E8CC` |

Type: **Ping AR + LT** for UI, **Norsal** for display and headings (it matches the
logo's lettering). Both are in `/Fonts` at the repo root, subset into
`app/public/fonts`.

Character: **Siraj**, a little lamp with a scholar's cap. Two source images
(`Siraj Main`, `Siraj Wave`) drive six moods: the difference is **rigging, not
artwork**: squash-and-stretch, tilt and bob in CSS (`.siraj--cheer` etc).
That is how he feels alive on a 35 KB budget. More poses can be added later as
images; the mood API in `components/Siraj.tsx` will not need to change.

Light theme by default. Dark mode exists and is selectable in Settings, but
`index.html` ships `data-theme="light"` so a first-time visitor never lands dark.

---

## 12. Known gaps / next tasks

Roughly in priority order.

1. **Write units ٣ الزكاة, ٤ الصوم, ٥ الحج.** The stair already shows them.
2. **Wire the deployment env vars** (`OPENAI_API_KEY` on the Worker and
   `CHAT_ENDPOINT` in GitHub Actions) and verify the live Ask Siraj path end to
   end. The default model is `gpt-5.6-luna`; only the canned pills are proven
   today.
3. **Arabic content review by a qualified person.** Blocking for public release.
4. Real localisation. The language picker shows eight languages; all currently
   open Arabic. `progress.language` is already stored.
5. More Siraj poses.
6. Chests and trophies award XP but have no opening animation of their own yet.
7. No tests. `core/engine/grading.ts` and `progress.ts` are pure functions and
   are the obvious first thing to cover.
