import { Message, TextChannel } from "discord.js";
import { getChannelId, getLanguage } from "../store";
import { generateReply, splitForDiscord, isApiKeySet } from "../gemini";
import { logger } from "../../lib/logger";

export async function handleMessage(message: Message): Promise<void> {
  if (!message.guild || message.author.bot) return;

  const guildId = message.guild.id;
  const channelId = getChannelId(guildId);

  // Only respond in the configured channel
  if (!channelId || message.channelId !== channelId) return;

  // Check API key
  if (!isApiKeySet()) {
    await message.reply({
      content: "⚠️ مفتاح Gemini API غير مضاف. أضف `GEMINI_API_KEY` في الـ Secrets.",
    });
    return;
  }

  const userMessage = message.content.trim();
  if (!userMessage) return;

  // Show typing indicator while generating
  const channel = message.channel as TextChannel;
  await channel.sendTyping();

  try {
    const language = getLanguage(guildId);
    const reply = await generateReply(userMessage, guildId, message.author.id, language);

    if (!reply) {
      await message.reply({ content: "⚠️ لم يتم الحصول على رد من الذكاء الاصطناعي." });
      return;
    }

    // Split long replies into multiple messages
    const parts = splitForDiscord(reply);
    for (let i = 0; i < parts.length; i++) {
      if (i === 0) {
        await message.reply({ content: parts[i] });
      } else {
        await channel.send({ content: parts[i] });
      }
    }
  } catch (err) {
    logger.error({ err }, "Gemini generate error");
    const errorMsg = err instanceof Error && err.message.includes("GEMINI_API_KEY")
      ? "⚠️ مفتاح Gemini API غير صحيح أو غير مضاف."
      : "❌ حدث خطأ أثناء الرد. حاول مرة أخرى.";
    await message.reply({ content: errorMsg }).catch(() => {});
  }
}
