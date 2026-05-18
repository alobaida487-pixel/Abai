import { Message, EmbedBuilder, Colors, GuildMember, TextChannel } from "discord.js";
import { getGuildSettings, getBannedWords } from "../store";
import { sendLog } from "../utils";
import { logger } from "../../lib/logger";
import { handlePrefixCommand, PREFIX } from "../prefix";

const spamTracker = new Map<string, number[]>();

async function jailMember(member: GuildMember, reason: string, timeoutMs: number, settings: ReturnType<typeof getGuildSettings>): Promise<void> {
  if (settings.jailRoleId) {
    await member.roles.add(settings.jailRoleId).catch(() => {});
    setTimeout(() => member.roles.remove(settings.jailRoleId!).catch(() => {}), timeoutMs);
  }

  if (settings.jailChannelId) {
    const jailCh = member.guild.channels.cache.get(settings.jailChannelId) as TextChannel | undefined;
    if (jailCh?.isTextBased()) {
      await jailCh.send(`🔒 ${member} تم إيداعك في السجن بسبب: **${reason}**`).catch(() => {});
    }
  }
}

export async function handleMessage(message: Message): Promise<void> {
  if (!message.guild || message.author.bot) return;

  if (message.content.startsWith(PREFIX)) {
    await handlePrefixCommand(message);
    return;
  }

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
            .setColor(Colors.Red).setTitle("🚫 كلمة محظورة — حذف رسالة")
            .addFields(
              { name: "العضو", value: message.author.tag, inline: true },
              { name: "الكلمة", value: `\`${bw.word}\``, inline: true },
            ).setTimestamp();
          await sendLog(message.guild!, embed);

        } else if (bw.action === "timeout") {
          await message.delete().catch(() => {});
          const ms = bw.timeoutMinutes * 60 * 1000;
          await member.timeout(ms, `كلمة محظورة: ${bw.word}`);
          await jailMember(member, `كلمة محظورة: ${bw.word}`, ms, settings);

          const warn = await (message.channel as TextChannel)
            .send(`${message.author} 🔇 تم إعطاؤك تايم أوت لمدة **${bw.timeoutMinutes} دقيقة** بسبب كلمة محظورة.`)
            .catch(() => null);
          if (warn) setTimeout(() => warn.delete().catch(() => {}), 8000);

          const embed = new EmbedBuilder()
            .setColor(Colors.Orange).setTitle("🔇 كلمة محظورة — تايم أوت + سجن")
            .addFields(
              { name: "العضو", value: message.author.tag, inline: true },
              { name: "الكلمة", value: `\`${bw.word}\``, inline: true },
              { name: "المدة", value: `${bw.timeoutMinutes} دقيقة`, inline: true },
            ).setTimestamp();
          await sendLog(message.guild!, embed);

        } else if (bw.action === "ban") {
          await message.delete().catch(() => {});
          await message.guild!.members.ban(message.author, { reason: `كلمة محظورة: ${bw.word}` });
          const embed = new EmbedBuilder()
            .setColor(Colors.Red).setTitle("🔨 كلمة محظورة — باند")
            .addFields(
              { name: "العضو", value: message.author.tag, inline: true },
              { name: "الكلمة", value: `\`${bw.word}\``, inline: true },
            ).setTimestamp();
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
      const ms = settings.spamTimeoutMinutes * 60 * 1000;
      await member.timeout(ms, `سبام: ${recent.length} رسائل في ${settings.spamSeconds} ثانية`);
      await jailMember(member, `سبام (${recent.length} رسائل)`, ms, settings);

      const warn = await (message.channel as TextChannel)
        .send(`${message.author} 🔇 تم إعطاؤك تايم أوت لمدة **${settings.spamTimeoutMinutes} دقيقة** بسبب السبام.`)
        .catch(() => null);
      if (warn) setTimeout(() => warn.delete().catch(() => {}), 8000);

      const embed = new EmbedBuilder()
        .setColor(Colors.Orange).setTitle("🔇 سبام — تايم أوت + سجن")
        .addFields(
          { name: "العضو", value: message.author.tag, inline: true },
          { name: "الرسائل", value: `${recent.length} في ${settings.spamSeconds}ث`, inline: true },
          { name: "التايم أوت", value: `${settings.spamTimeoutMinutes} دقيقة`, inline: true },
        ).setTimestamp();
      await sendLog(message.guild!, embed);
    } catch (err) {
      logger.warn({ err }, "Failed to timeout spammer");
    }
  }
}
