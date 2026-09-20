/* Cloudflare Worker entry. This is what a GitHub Pages deployment needs,
   because Pages itself cannot run code or hold a secret.

   Deploy:  cd worker && npx wrangler deploy
   Secret:  npx wrangler secret put OPENAI_API_KEY
*/
import { handleChat, type ChatEnv } from '../../server/chatHandler'

export default {
  fetch(req: Request, env: ChatEnv): Promise<Response> {
    return handleChat(req, env)
  },
}
