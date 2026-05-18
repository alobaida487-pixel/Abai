import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  GuildMember,
  Colors,
  ChannelType,
} from "discord.js";
import { sendLog } from "../utils";

export const voiceCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("voicekick").setDescription("طرد عضو من الفويس")
      .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
      .addUserOption((o) => o.setName("user").setDescription("العضو").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const target = interaction.options.getMember("user") as GuildMember;
      if (!target) { await interaction.reply({ content: "العضو غير موجود.", flags: 64 }); return; }
      if (!target.voice.channel) { await interaction.reply({ content: "العضو ليس في فويس.", flags: 64 }); return; }
      try {
        await target.voice.disconnect();
        const embed = new EmbedBuilder()
          .setColor(Colors.Orange).setTitle("👢 طرد من الفويس")
          .addFields({ name: "العضو", value: target.user.tag, inline: true }, { name: "المشرف", value: interaction.user.tag })
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild!, embed);
      } catch { await interaction.reply({ content: "فشل تنفيذ الأمر.", flags: 64 }); }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("move").setDescription("نقل عضو إلى فويس آخر")
      .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
      .addUserOption((o) => o.setName("user").setDescription("العضو").setRequired(true))
      .addChannelOption((o) =>
        o.setName("channel").setDescription("الفويس المقصود").setRequired(true)
          .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice),
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      const target = interaction.options.getMember("user") as GuildMember;
      const channel = interaction.options.getChannel("channel", true);
      if (!target) { await interaction.reply({ content: "العضو غير موجود.", flags: 64 }); return; }
      if (!target.voice.channel) { await interaction.reply({ content: "العضو ليس في فويس.", flags: 64 }); return; }
      try {
        await target.voice.setChannel(channel.id);
        const embed = new EmbedBuilder()
          .setColor(Colors.Blue).setTitle("🔀 نقل إلى فويس")
          .addFields(
            { name: "العضو", value: target.user.tag, inline: true },
            { name: "القناة", value: `<#${channel.id}>`, inline: true },
            { name: "المشرف", value: interaction.user.tag },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild!, embed);
      } catch { await interaction.reply({ content: "فشل نقل العضو.", flags: 64 }); }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("mutevc").setDescription("كتم صوت عضو في الفويس")
      .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers)
      .addUserOption((o) => o.setName("user").setDescription("العضو").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const target = interaction.options.getMember("user") as GuildMember;
      if (!target) { await interaction.reply({ content: "العضو غير موجود.", flags: 64 }); return; }
      try {
        await target.voice.setMute(true);
        const embed = new EmbedBuilder()
          .setColor(Colors.Orange).setTitle("🔇 كتم صوت في الفويس")
          .addFields({ name: "العضو", value: target.user.tag, inline: true }, { name: "المشرف", value: interaction.user.tag })
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild!, embed);
      } catch { await interaction.reply({ content: "فشل تنفيذ الأمر.", flags: 64 }); }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("unmutevc").setDescription("إلغاء كتم صوت عضو في الفويس")
      .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers)
      .addUserOption((o) => o.setName("user").setDescription("العضو").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const target = interaction.options.getMember("user") as GuildMember;
      if (!target) { await interaction.reply({ content: "العضو غير موجود.", flags: 64 }); return; }
      try {
        await target.voice.setMute(false);
        const embed = new EmbedBuilder()
          .setColor(Colors.Green).setTitle("🔊 إلغاء كتم الفويس")
          .addFields({ name: "العضو", value: target.user.tag, inline: true }, { name: "المشرف", value: interaction.user.tag })
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild!, embed);
      } catch { await interaction.reply({ content: "فشل تنفيذ الأمر.", flags: 64 }); }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("deafen").setDescription("ديفن عضو في الفويس")
      .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers)
      .addUserOption((o) => o.setName("user").setDescription("العضو").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const target = interaction.options.getMember("user") as GuildMember;
      if (!target) { await interaction.reply({ content: "العضو غير موجود.", flags: 64 }); return; }
      try {
        await target.voice.setDeaf(true);
        const embed = new EmbedBuilder()
          .setColor(Colors.Orange).setTitle("🔕 ديفن")
          .addFields({ name: "العضو", value: target.user.tag, inline: true }, { name: "المشرف", value: interaction.user.tag })
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild!, embed);
      } catch { await interaction.reply({ content: "فشل تنفيذ الأمر.", flags: 64 }); }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("undeafen").setDescription("إلغاء ديفن عضو في الفويس")
      .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers)
      .addUserOption((o) => o.setName("user").setDescription("العضو").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const target = interaction.options.getMember("user") as GuildMember;
      if (!target) { await interaction.reply({ content: "العضو غير موجود.", flags: 64 }); return; }
      try {
        await target.voice.setDeaf(false);
        const embed = new EmbedBuilder()
          .setColor(Colors.Green).setTitle("🔔 إلغاء ديفن")
          .addFields({ name: "العضو", value: target.user.tag, inline: true }, { name: "المشرف", value: interaction.user.tag })
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild!, embed);
      } catch { await interaction.reply({ content: "فشل تنفيذ الأمر.", flags: 64 }); }
    },
  },
];
