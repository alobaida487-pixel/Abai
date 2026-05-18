# Discord Moderation Bot

بوت Discord متكامل للإدارة والمراقبة — يراقب الكلمات المحظورة، يكشف السبام، وينفذ جميع أوامر الإدارة عبر slash commands.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — تشغيل السيرفر والبوت (port 5000)
- `pnpm run typecheck` — فحص TypeScript لجميع الحزم
- `pnpm run build` — بناء كامل
- Required env: `DISCORD_BOT_TOKEN` — توكن البوت من Discord Developer Portal
- Optional env: `DISCORD_ENABLED` — اضبطها `true` لتشغيل البوت (افتراضي: مفعل إذا وُجد التوكن)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- Bot: discord.js v14
- DB: PostgreSQL + Drizzle ORM (للـ API)
- Bot Data: JSON file persistence (`data/bot-data.json`)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/bot/` — كود البوت بالكامل
- `artifacts/api-server/src/bot/store.ts` — حفظ البيانات (كلمات محظورة، إعدادات، تحذيرات)
- `artifacts/api-server/src/bot/commands/` — جميع الأوامر (moderation, channels, voice, admin, words, info)
- `artifacts/api-server/src/bot/events/` — معالجة الرسائل (anti-spam + banned words)
- `data/bot-data.json` — ملف بيانات البوت (يُنشأ تلقائياً)

## Slash Commands (43 أمر)

### 🔨 الإشراف (Moderation)
| الأمر | الوصف |
|-------|--------|
| `/timeout <user> <minutes>` | تايم أوت لعضو |
| `/untimeout <user>` | إلغاء تايم أوت |
| `/ban <user> [reason]` | باند عضو |
| `/unban <userid>` | إلغاء باند |
| `/kick <user> [reason]` | طرد عضو |
| `/warn <user> <reason>` | تحذير عضو |
| `/warnings <user>` | عرض التحذيرات |
| `/clearwarnings <user>` | حذف التحذيرات |
| `/purge <amount>` | حذف رسائل |

### 📺 القنوات (Channels)
| الأمر | الوصف |
|-------|--------|
| `/lock [channel]` | قفل قناة |
| `/unlock [channel]` | فتح قناة |
| `/slowmode <seconds>` | سلو مود |
| `/createchannel <name> <type>` | إنشاء قناة |
| `/deletechannel [channel]` | حذف قناة |
| `/nuke` | نيوك القناة |

### 🔊 الفويس (Voice)
| الأمر | الوصف |
|-------|--------|
| `/voicekick <user>` | طرد من الفويس |
| `/move <user> <channel>` | نقل إلى فويس |
| `/mutevc <user>` | كتم في الفويس |
| `/unmutevc <user>` | إلغاء كتم |
| `/deafen <user>` | ديفن |
| `/undeafen <user>` | إلغاء ديفن |

### 🎭 الرولات والإدارة (Admin)
| الأمر | الوصف |
|-------|--------|
| `/role add/remove <user> <role>` | إدارة الرولات |
| `/createrole <name>` | إنشاء رول |
| `/deleterole <role>` | حذف رول |
| `/setnick <user> <nick>` | تغيير اللقب |
| `/announce <channel> <msg>` | إعلان |
| `/embed <channel> <title> <desc>` | رسالة embed |

### ⚙️ الإعدادات (Config)
| الأمر | الوصف |
|-------|--------|
| `/setlogchannel <channel>` | قناة اللوقات |
| `/setjailvc <channel>` | فويس السجن للمخالفين |
| `/setjoinrole <role>` | رول الانضمام التلقائي |
| `/removejoinrole` | إزالة رول الانضمام |
| `/antispam <on/off>` | تفعيل/تعطيل anti-spam |
| `/spamsettings <msgs> <secs> <mins>` | إعداد حدود السبام |
| `/settings` | عرض الإعدادات الحالية |

### 🚫 الكلمات المحظورة (Banned Words)
| الأمر | الوصف |
|-------|--------|
| `/addword <word> <action>` | إضافة كلمة محظورة (timeout/delete/ban) |
| `/removeword <word>` | إزالة كلمة |
| `/listwords` | عرض الكلمات المحظورة |

### ℹ️ المعلومات (Info)
| الأمر | الوصف |
|-------|--------|
| `/userinfo [user]` | معلومات عضو |
| `/serverinfo` | معلومات السيرفر |
| `/roleinfo <role>` | معلومات رول |
| `/avatar [user]` | صورة البروفايل |
| `/botinfo` | معلومات البوت |
| `/help` | قائمة الأوامر |

## Auto-Moderation

- **Anti-Spam**: الافتراضي 6 رسائل / 5 ثواني → تايم أوت 5 دقائق (قابل للتخصيص)
- **Banned Words**: كل كلمة لها إجراء مستقل (timeout / delete / ban)
- **Jail VC**: المخالفون يُنقلون تلقائياً لفويس السجن المحدد

## Health Endpoints

- `GET /api/healthz` — فحص الصحة
- `GET /api/ping` — ping للـ UptimeRobot

## User preferences

- البوت يستخدم `process.env.DISCORD_BOT_TOKEN` للتوكن
- البوت يستخدم `process.env.DISCORD_ENABLED` للتفعيل

## Gotchas

- الرسائل الأقدم من 14 يوم لا يمكن حذفها بـ bulkDelete
- تأكد أن رول البوت أعلى من الرولات التي يديرها
- يجب تفعيل `MESSAGE CONTENT INTENT` في Developer Portal

## Pointers

- See the `pnpm-workspace` skill for workspace structure
