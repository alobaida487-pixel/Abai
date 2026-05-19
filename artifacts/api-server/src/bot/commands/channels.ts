import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  TextChannel,
  OverwriteType,
  Colors,
  ChannelType,
} from "discord.js";
import { sendLog } from "../utils";

export const channelCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("lock")
      .setDescription("قفل قناة")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
      .addChannelOption((o) => o.setName("channel").setDescription("القناة (الافتراضي: الحالية)"))
      .addStringOption((o) => o.setName("reason").setDescription("السبب")),
    async execute(interaction: ChatInputCommandInteraction) {
      const channel = (interaction.options.getChannel("channel") || interaction.channel) as TextChannel;
      const reason = interaction.options.getString("reason") || "لا يوجد سبب";
      try {
        await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, {
          SendMessages: false,
          SendMessagesInThreads: false,
        });
        const embed = new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle("🔒 قناة مقفلة")
          .addFields(
            { name: "القناة", value: `${channel}`, inline: true },
            { name: "السبب", value: reason },
            { name: "المشرف", value: interaction.user.tag },
          )
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild!, embed);
      } catch {
        await interaction.reply({ content: "فشل قفل القناة.", flags: 64 });
      }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("unlock")
      .setDescription("فتح قناة")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
      .addChannelOption((o) => o.setName("channel").setDescription("القناة (الافتراضي: الحالية)")),
    async execute(interaction: ChatInputCommandInteraction) {
      const channel = (interaction.options.getChannel("channel") || interaction.channel) as TextChannel;
      try {
        await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, {
          SendMessages: null,
          SendMessagesInThreads: null,
        });
        const embed = new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle("🔓 قناة مفتوحة")
          .addFields(
            { name: "القناة", value: `${channel}`, inline: true },
            { name: "المشرف", value: interaction.user.tag },
          )
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild!, embed);
      } catch {
        await interaction.reply({ content: "فشل فتح القناة.", flags: 64 });
      }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("slowmode")
      .setDescription("تعيين وضع السلو مود")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
      .addIntegerOption((o) =>
        o.setName("seconds").setDescription("المدة بالثواني (0 = إيقاف)").setRequired(true).setMinValue(0).setMaxValue(21600),
      )
      .addChannelOption((o) => o.setName("channel").setDescription("القناة (الافتراضي: الحالية)")),
    async execute(interaction: ChatInputCommandInteraction) {
      const seconds = interaction.options.getInteger("seconds", true);
      const channel = (interaction.options.getChannel("channel") || interaction.channel) as TextChannel;
      try {
        await channel.setRateLimitPerUser(seconds);
        const embed = new EmbedBuilder()
          .setColor(Colors.Blue)
          .setTitle("⏱️ سلو مود")
          .addFields(
            { name: "القناة", value: `${channel}`, inline: true },
            { name: "المدة", value: seconds === 0 ? "معطل" : `${seconds} ثانية`, inline: true },
            { name: "المشرف", value: interaction.user.tag },
          )
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild!, embed);
      } catch {
        await interaction.reply({ content: "فشل تعيين السلو مود.", flags: 64 });
      }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("createchannel")
      .setDescription("إنشاء قناة جديدة")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
      .addStringOption((o) => o.setName("name").setDescription("اسم القناة").setRequired(true))
      .addStringOption((o) =>
        o
          .setName("type")
          .setDescription("نوع القناة")
          .setRequired(true)
          .addChoices(
            { name: "نصية", value: "text" },
            { name: "صوتية", value: "voice" },
            { name: "تصنيف", value: "category" },
            { name: "إعلانات", value: "announcement" },
            { name: "مسرح", value: "stage" },
          ),
      )
      .addChannelOption((o) => o.setName("category").setDescription("التصنيف (للقنوات النصية والصوتية)")),
    async execute(interaction: ChatInputCommandInteraction) {
      const name = interaction.options.getString("name", true);
      const type = interaction.options.getString("type", true);
      const category = interaction.options.getChannel("category");

      const typeMap: Record<string, ChannelType> = {
        text: ChannelType.GuildText,
        voice: ChannelType.GuildVoice,
        category: ChannelType.GuildCategory,
        announcement: ChannelType.GuildAnnouncement,
        stage: ChannelType.GuildStageVoice,
      };

      try {
        const channel = await interaction.guild!.channels.create({
          name,
          type: typeMap[type] as any,
          parent: category?.id,
        });
        const embed = new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle("✅ تم إنشاء القناة")
          .addFields(
            { name: "القناة", value: `${channel}`, inline: true },
            { name: "النوع", value: type, inline: true },
            { name: "المشرف", value: interaction.user.tag },
          )
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild!, embed);
      } catch {
        await interaction.reply({ content: "فشل إنشاء القناة.", flags: 64 });
      }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("deletechannel")
      .setDescription("حذف قناة")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
      .addChannelOption((o) => o.setName("channel").setDescription("القناة (الافتراضي: الحالية)"))
      .addStringOption((o) => o.setName("reason").setDescription("السبب")),
    async execute(interaction: ChatInputCommandInteraction) {
      const channel = (interaction.options.getChannel("channel") || interaction.channel) as TextChannel;
      const reason = interaction.options.getString("reason") || "لا يوجد سبب";
      try {
        const embed = new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle("🗑️ تم حذف القناة")
          .addFields(
            { name: "اسم القناة", value: channel.name, inline: true },
            { name: "السبب", value: reason },
            { name: "المشرف", value: interaction.user.tag },
          )
          .setTimestamp();
        await sendLog(interaction.guild!, embed);
        if (channel.id !== interaction.channelId) {
          await interaction.reply({ embeds: [embed] });
        }
        await channel.delete(reason);
      } catch {
        await interaction.reply({ content: "فشل حذف القناة.", flags: 64 });
      }
    },
  },
];
