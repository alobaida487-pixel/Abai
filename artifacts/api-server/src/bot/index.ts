import {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  REST,
  Routes,
  ChatInputCommandInteraction,
  ButtonInteraction,
  GuildMember,
} from "discord.js";
import { logger } from "../lib/logger";
import { loadData } from "./store";
import { commandCollection, commandsJSON } from "./commands";
import { handleMessage } from "./events/messageCreate";

export function startBot(): void {
  const token = process.env["DISCORD_BOT_TOKEN"];
  const enabled = process.env["DISCORD_ENABLED"];

  if (!token) {
    logger.warn("DISCORD_BOT_TOKEN not set — Discord bot disabled");
    return;
  }
  if (enabled && enabled.toLowerCase() !== "true" && enabled !== "1") {
    logger.info("DISCORD_ENABLED is not true — Discord bot disabled");
    return;
  }

  loadData();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel],
  });

  client.once(Events.ClientReady, async (c) => {
    logger.info({ tag: c.user.tag, guilds: c.guilds.cache.size }, "Discord bot ready");
    await registerCommands(token, c.user.id);
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    // ── Slash commands ────────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const cmd = commandCollection.get(interaction.commandName);
      if (!cmd) return;
      try {
        await cmd.execute(interaction as ChatInputCommandInteraction);
      } catch (err) {
        logger.error({ err, command: interaction.commandName }, "Command error");
        const reply = { content: "حدث خطأ أثناء تنفيذ الأمر.", flags: 64 as const };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply).catch(() => {});
        } else {
          await interaction.reply(reply).catch(() => {});
        }
      }
      return;
    }

    // ── Self-role buttons ─────────────────────────────────────────────────────
    if (interaction.isButton() && interaction.customId.startsWith("selfrole:")) {
      await handleSelfRoleButton(interaction as ButtonInteraction).catch((err) =>
        logger.error({ err }, "SelfRole button error"),
      );
    }
  });

  client.on(Events.MessageCreate, (msg) => {
    handleMessage(msg).catch((err) => logger.error({ err }, "MessageCreate error"));
  });

  client.on(Events.Error, (err) => {
    logger.error({ err }, "Discord client error");
  });

  client.login(token).catch((err) => {
    logger.error({ err }, "Failed to login to Discord");
  });
}

async function registerCommands(token: string, clientId: string): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(token);
  try {
    logger.info("Registering slash commands...");
    await rest.put(Routes.applicationCommands(clientId), { body: commandsJSON });
    logger.info({ count: commandsJSON.length }, "Slash commands registered");
  } catch (err) {
    logger.error({ err }, "Failed to register slash commands");
  }
}

async function handleSelfRoleButton(interaction: ButtonInteraction): Promise<void> {
  const roleId = interaction.customId.split(":")[1];
  const member = interaction.member as GuildMember;
  const guild = interaction.guild;

  if (!guild || !member) {
    await interaction.reply({ content: "❌ حدث خطأ.", flags: 64 });
    return;
  }

  const role = guild.roles.cache.get(roleId);
  if (!role) {
    await interaction.reply({ content: "❌ الرتبة غير موجودة في هذا السيرفر.", flags: 64 });
    return;
  }

  const hasRole = member.roles.cache.has(roleId);
  try {
    if (hasRole) {
      await member.roles.remove(role);
      await interaction.reply({
        content: `✅ تمت إزالة رتبة **${role.name}** منك.`,
        flags: 64,
      });
    } else {
      await member.roles.add(role);
      await interaction.reply({
        content: `✅ حصلت على رتبة **${role.name}**.`,
        flags: 64,
      });
    }
  } catch {
    await interaction.reply({
      content: "❌ فشل تغيير الرتبة. تأكد أن رول البوت أعلى من الرتبة المطلوبة.",
      flags: 64,
    });
  }
}
