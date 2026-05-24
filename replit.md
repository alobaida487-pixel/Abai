# Discord AI Bot (Gemini)

بوت Discord ذكاء اصطناعي مدعوم بـ Google Gemini — يرد على جميع الرسائل داخل قناة محددة فقط، مع ذاكرة محادثة لكل مستخدم.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — تشغيل السيرفر والبوت (port 5000)
- Required env: `DISCORD_BOT_TOKEN` — توكن البوت من Discord Developer Portal
- Required secret: `GEMINI_API_KEY` — مفتاح Gemini API من Google AI Studio
- Optional env: `DISCORD_ENABLED` — اضبطها `true` لتشغيل البوت

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- Bot: discord.js v14
- AI: @google/genai (Gemini 2.5 Flash)
- Bot Data: JSON file persistence (`data/bot-data.json`)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/bot/` — كود البوت
- `artifacts/api-server/src/bot/store.ts` — حفظ البيانات (channelId، اللغة)
- `artifacts/api-server/src/bot/gemini.ts` — Gemini client + سجل المحادثات
- `artifacts/api-server/src/bot/commands/` — الأوامر (setup، set-language)
- `artifacts/api-server/src/bot/events/messageCreate.ts` — معالج الرسائل + الرد بالذكاء الاصطناعي
- `data/bot-data.json` — ملف بيانات البوت (يُنشأ تلقائياً)

## Slash Commands (2 أوامر)

| الأمر | الوصف | الصلاحية |
|-------|--------|-----------|
| `/setup #قناة` | تحديد القناة التي يعمل فيها البوت | Administrator |
| `/set-language` | تغيير لغة الردود (عربي / إنجليزي) | الجميع |

## Bot Behavior

- **القناة المحددة فقط**: البوت لا يرد إلا داخل القناة التي حددتها بـ `/setup`
- **ذاكرة المحادثة**: آخر 20 رسالة لكل مستخدم (في الذاكرة)
- **اللغة الافتراضية**: العربية (قابلة للتغيير بـ `/set-language`)
- **Typing Indicator**: البوت يظهر "يكتب..." أثناء توليد الرد

## Health Endpoints

- `GET /api/healthz` — فحص الصحة
- `GET /api/ping` — ping

## User preferences

- البوت يستخدم `DISCORD_BOT_TOKEN` للتوكن
- البوت يستخدم `GEMINI_API_KEY` لـ Gemini
