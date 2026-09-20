<div align="center">

# سراج: Siraj

**The Duolingo for learning Islam.** A staircase you climb, one step at a time.

</div>

---

Siraj teaches the five pillars of Islam the way a good teacher would: it **shows
you something first**, then asks questions that make it stick. Not a quiz app
with a mascot bolted on.

Built for a hackathon on the track
**«التجارب التفاعلية والرحلة المعرفية للتعريف بالإسلام وتعلمه»**.

## What makes it different

- **The stair.** The learning path runs bottom to top. Finished steps are solid
  slabs beneath you; the road ahead ghosts upward into the distance. Progress is
  literally climbing.
- **Learn, then solidify.** Every level is بطاقات تعلّم followed by exercises
  drawn only from what those cards taught.
- **Five real mechanics**, not one: order the steps of wudu, sort what breaks a
  fast, match terms to meanings, multiple choice, true/false.
- **اسأل سراج.** After each lesson, ask the thing you did not understand. The
  assistant answers **only by quoting four trusted sources** and refuses to
  improvise or stray off topic.
- **Oil, not hearts.** Siraj is a lamp. A wrong answer costs a drop of oil.
- **No audio files.** Every sound is synthesised in the browser. The correct
  answer chime rises in pitch with your streak.

## Run it

```bash
cd app
npm install
npm run dev
```

Node 20+. Opens at `http://localhost:5173`. No backend required.

## Build

```bash
cd app && npm run build     # -> app/dist
```

~147 KB gzipped, fonts subset to woff2, artwork in WebP.

## Ask Siraj setup

The assistant runs through a serverless proxy (`api/chat.ts`) so the API key
never reaches the browser. Set on your **hosting provider**:

```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=<model id from your OpenAI project>
```

> A GitHub Actions repo secret will **not** reach the deployed function or the
> browser. Set the key in the hosting provider's environment variables too.

Without it, the app works fully; the suggested-question pills answer from
bundled text offline.

## Structure

```
app/src/core/       pure TypeScript, zero DOM  <- ports to native as-is
app/src/platform/   storage, sound, haptics    <- the only files a port rewrites
app/src/ui/         React + Framer Motion
api/chat.ts         the Ask Siraj proxy
AGENTS.md           full project contract, read before contributing
```

The `core/` boundary is deliberate: porting to React Native means copying
`core/`, writing three `platform/` files, and rebuilding the views. Capacitor can
also wrap this exact build into a native binary with no rewrite at all.

## Contributing

Read [AGENTS.md](AGENTS.md) first. In particular: no em-dashes anywhere,
`core/` never touches the DOM, and religious content must be reviewed by a
qualified person before public release.

## License

MIT. See [LICENSE](LICENSE).
