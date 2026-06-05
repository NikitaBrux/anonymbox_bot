import { Telegraf, Markup } from 'telegraf'

const BOT_TOKEN = process.env.BOT_TOKEN!
const FRONTEND_URL = process.env.FRONTEND_URL!

if (!BOT_TOKEN) throw new Error('BOT_TOKEN is required')
if (!FRONTEND_URL) throw new Error('FRONTEND_URL is required')

const bot = new Telegraf(BOT_TOKEN)

const webAppButton = (label: string, path = '') =>
  Markup.button.webApp(label, `${FRONTEND_URL}${path}`)

bot.start(async (ctx) => {
  const startParam = ctx.startPayload // e.g. "session_<id>"
  let url = FRONTEND_URL

  if (startParam?.startsWith('session_')) {
    const sessionId = startParam.replace('session_', '')
    url = `${FRONTEND_URL}/session/${sessionId}`
  }

  await ctx.reply(
    '👋 Welcome to *AnonymBox* — anonymous Q&A for events!\n\nCreate a session and let your audience ask questions anonymously with live voting.',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.webApp('🚀 Open AnonymBox', url)],
      ]),
    },
  )
})

bot.command('newsession', async (ctx) => {
  await ctx.reply(
    '➕ Create a new Q&A session:',
    Markup.inlineKeyboard([
      [webAppButton('Create Session', '/create')],
    ]),
  )
})

bot.command('help', async (ctx) => {
  await ctx.reply(
    `*AnonymBox Commands*\n\n` +
    `/start — open the app\n` +
    `/newsession — create a new Q&A session\n` +
    `/help — show this message`,
    { parse_mode: 'Markdown' },
  )
})

bot.launch()
console.log('Bot started')

// Render требует открытый порт даже для фоновых сервисов
import { createServer } from 'http'
const port = Number(process.env.PORT ?? 3000)
createServer((_, res) => res.end('ok')).listen(port, () => {
  console.log(`Health check listening on :${port}`)
})

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
