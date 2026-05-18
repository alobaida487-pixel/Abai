import { Guild, EmbedBuilder, TextChannel } from "discord.js";
import { getGuildSettings } from "./store";
import { logger } from "../lib/logger";

export async function sendLog(guild: Guild, embed: EmbedBuilder): Promise<void> {
  const settings = getGuildSettings(guild.id);
  if (!settings.logChannelId) return;
  try {
    const channel = guild.channels.cache.get(settings.logChannelId) as TextChannel | undefined;
    if (!channel || !channel.isTextBased()) return;
    await channel.send({ embeds: [embed] });
  } catch (err) {
    logger.warn({ err }, "Failed to send log");
  }
}
