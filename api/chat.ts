/* Vercel / Netlify style entry. The logic lives in server/chatHandler.ts
   so the Cloudflare Worker can share it verbatim. */
import { handleChat } from '../server/chatHandler'

export default function handler(req: Request): Promise<Response> {
  return handleChat(req, {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  })
}
