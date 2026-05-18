import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  GuildMember,
  Colors,
  ChannelType,
} from "discord.js";
import {
  joinVoiceChannel,
  getVoiceConnection,
  VoiceConnectionStatus,
  entersState,
} from "@discordjs/voice";
import { sendLog } from "../utils";

export const voiceJoinCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("join")
      .setDescription("أدخل البوت إلى قناة صوتية")
      .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
      .addChannelOption((o) =>
        o
          .setName("channel")
          .setDescription("القناة الصوتية (الافتراضي: قناتك الحالية)")
          .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice),
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      const specified = interaction.options.getChannel("channel");
      const member = interaction.member as GuildMember;

      const channelId = specified?.id ?? member.voice.channelId;
      if (!channelId) {
        await interaction.reply({ content: "أنت لست في قناة صوتية وما حددت قناة.", flags: 64 });
        return;
      }

      const channel = interaction.guild!.channels.cache.get(channelId);
      if (!channel) {
        await interaction.reply({ content: "القناة غير موجودة.", flags: 64 });
        return;
      }

      try {
        const connection = joinVoiceChannel({
          channelId,
          guildId: interaction.guild!.id,
          adapterCreator: interaction.guild!.voiceAdapterCreator,
          selfDeaf: false,
          selfMute: true,
        });

        await entersState(connection, VoiceConnectionStatus.Ready, 10_000);

        const embed = new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle("🔊 انضم البوت للفويس")
          .addFields(
            { name: "القناة", value: `<#${channelId}>`, inline: true },
            { name: "المشرف", value: interaction.user.tag },
          )
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild!, embed);
      } catch {
        await interaction.reply({ content: "فشل الانضمام للقناة الصوتية.", flags: 64 });
      }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("leave")
      .setDescription("أخرج البوت من القناة الصوتية الحالية")
      .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
    async execute(interaction: ChatInputCommandInteraction) {
      const connection = getVoiceConnection(interaction.guild!.id);
      if (!connection) {
        await interaction.reply({ content: "البوت ليس في أي قناة صوتية حالياً.", flags: 64 });
        return;
      }
      const channelId = connection.joinConfig.channelId;
      connection.destroy();
      const embed = new EmbedBuilder()
        .setColor(Colors.Orange)
        .setTitle("🔇 خرج البوت من الفويس")
        .addFields(
          { name: "القناة", value: channelId ? `<#${channelId}>` : "غير محددة", inline: true },
          { name: "المشرف", value: interaction.user.tag },
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
      await sendLog(interaction.guild!, embed);
    },
  },
];
