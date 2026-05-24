import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  Colors,
  ChannelType,
  TextChannel,
} from "discord.js";
import { setChannelId, getChannelId } from "../store";

export const setupCommand = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("تحديد القناة التي يعمل فيها البوت الذكي")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((o) =>
      o
        .setName("channel")
        .setDescription("القناة المخصصة للبوت")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel("channel", true) as TextChannel;
    const guildId = interaction.guildId!;

    setChannelId(guildId, channel.id);

    const embed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setTitle("✅ تم إعداد البوت")
      .setDescription(`البوت سيرد على جميع الرسائل داخل ${channel} فقط.`)
      .addFields(
        { name: "القناة", value: `${channel}`, inline: true },
        { name: "تغيير اللغة", value: "استخدم `/set-language`", inline: true },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
