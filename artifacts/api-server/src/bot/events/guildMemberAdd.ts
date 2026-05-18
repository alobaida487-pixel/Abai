import { GuildMember } from "discord.js";
import { getGuildSettings } from "../store";
import { logger } from "../../lib/logger";

export async function handleGuildMemberAdd(member: GuildMember): Promise<void> {
  const settings = getGuildSettings(member.guild.id);
  if (!settings.joinRoleId) return;
  try {
    await member.roles.add(settings.joinRoleId);
  } catch (err) {
    logger.warn({ err, guildId: member.guild.id }, "Failed to assign join role");
  }
}
