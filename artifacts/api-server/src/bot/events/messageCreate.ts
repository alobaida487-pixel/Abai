import { Message, EmbedBuilder, Colors, GuildMember, TextChannel } from "discord.js";
import { getGuildSettings, getBannedWords } from "../store";
import { sendLog } from "../utils";
import { logger } from "../../lib/logger";

const spamTracker = new Map<string, number[]>();

export async function handleMessage(message: Message): Promise<void> {
  if (!message.guild || message.author.bot) return;

  const guildId = message.guild.id;
  const settings = getGuildSettings(guildId);
  const member = message.member as GuildMember;

  if (!member || member.permissions.has("ManageMessages")) return;

  const content = message.content.toLowerCase();

  const bannedWords = getBannedWords(guildId);
  for (const bw of bannedWords) {
    if (content.includes(bw.word.toLowerCase())) {
      try {
        if (bw.action === "delete") {
          await message.delete().catch(() => {});
          const warn = await (message.channel as TextChannel)
            .send(`${message.author} ⚠️ هذه الكلمة محظورة!`)
            .catch(() => null);
          if (warn) setTimeout(() => warn.delete().catch(() => {}), 5000);

          const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle("🚫 كلمة محظورة — حذف رسالة")
            .addFields(
              { name: "العضو", value: `${message.author.tag}`, inline: true },
              { name: "الكلمة", value: `\`${bw.word}\``, inline: true },
            )
            .setTimestamp();
          await sendLog(message.guild!, embed);
        } else if (bw.action === "timeout") {
          await message.delete().catch(() => {});
          await member.timeout(bw.timeoutMinutes * 60 * 1000, `كلمة محظورة: ${bw.word}`);

          const jailVcId = settings.jailVcId;
          if (jailVcId && member.voice.channel) {
            await member.voice.setChannel(jailVcId).catch(() => {});
          }

          const warn = await (message.channel as TextChannel)
            .send(`${message.author} 🔇 تم إعطاؤك تايم أوت لمدة **${bw.timeoutMinutes} دقيقة** بسبب كلمة محظورة.`)
            .catch(() => null);
          if (warn) setTimeout(() => warn.delete().catch(() => {}), 8000);

          const embed = new EmbedBuilder()
            .setColor(Colors.Orange)
            .setTitle("🔇 كلمة محظورة — تايم أوت")
            .addFields(
              { name: "العضو", value: `${message.author.tag}`, inline: true },
              { name: "الكلمة", value: `\`${bw.word}\``, inline: true },
              { name: "المدة", value: `${bw.timeoutMinutes} دقيقة`, inline: true },
            )
            .setTimestamp();
          await sendLog(message.guild!, embed);
        } else if (bw.action === "ban") {
          await message.delete().catch(() => {});
          await message.guild!.members.ban(message.author, { reason: `كلمة محظورة: ${bw.word}` });
          const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle("🔨 كلمة محظورة — باند")
            .addFields(
              { name: "العضو", value: `${message.author.tag}`, inline: true },
              { name: "الكلمة", value: `\`${bw.word}\``, inline: true },
            )
            .setTimestamp();
          await sendLog(message.guild!, embed);
        }
      } catch (err) {
        logger.warn({ err }, "Failed to handle banned word");
      }
      return;
    }
  }

  if (!settings.antiSpamEnabled) return;

  const key = `${guildId}:${message.author.id}`;
  const now = Date.now();
  const windowMs = settings.spamSeconds * 1000;

  if (!spamTracker.has(key)) spamTracker.set(key, []);
  const timestamps = spamTracker.get(key)!;

  const recent = timestamps.filter((t) => now - t < windowMs);
  recent.push(now);
  spamTracker.set(key, recent);

  if (recent.length >= settings.spamMessages) {
    spamTracker.delete(key);
    try {
      await member.timeout(
        settings.spamTimeoutMinutes * 60 * 1000,
        `سبام: ${recent.length} رسائل في ${settings.spamSeconds} ثانية`,
      );

      const jailVcId = settings.jailVcId;
      if (jailVcId && member.voice.channel) {
        await member.voice.setChannel(jailVcId).catch(() => {});
      }

      const warn = await (message.channel as TextChannel)
        .send(
          `${message.author} 🔇 تم إعطاؤك تايم أوت لمدة **${settings.spamTimeoutMinutes} دقيقة** بسبب السبام.`,
        )
        .catch(() => null);
      if (warn) setTimeout(() => warn.delete().catch(() => {}), 8000);

      const embed = new EmbedBuilder()
        .setColor(Colors.Orange)
        .setTitle("🔇 سبام — تايم أوت تلقائي")
        .addFields(
          { name: "العضو", value: `${message.author.tag}`, inline: true },
          { name: "الرسائل", value: `${recent.length} في ${settings.spamSeconds}ث`, inline: true },
          { name: "التايم أوت", value: `${settings.spamTimeoutMinutes} دقيقة`, inline: true },
        )
        .setTimestamp();
      await sendLog(message.guild!, embed);
    } catch (err) {
      logger.warn({ err }, "Failed to timeout spammer");
    }
  }
}
