import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  GuildMember,
  TextChannel,
  Colors,
} from "discord.js";
import { getWarnings, addWarning, clearWarnings } from "../store";
import { sendLog } from "../utils";

export const moderationCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("timeout")
      .setDescription("تايم أوت لعضو")
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption((o) => o.setName("user").setDescription("العضو").setRequired(true))
      .addIntegerOption((o) =>
        o.setName("minutes").setDescription("المدة بالدقائق").setRequired(true).setMinValue(1).setMaxValue(40320),
      )
      .addStringOption((o) => o.setName("reason").setDescription("السبب")),
    async execute(interaction: ChatInputCommandInteraction) {
      const target = interaction.options.getMember("user") as GuildMember;
      const minutes = interaction.options.getInteger("minutes", true);
      const reason = interaction.options.getString("reason") ?? "لا يوجد سبب";
      if (!target) { await interaction.reply({ content: "العضو غير موجود.", flags: 64 }); return; }
      try {
        await target.timeout(minutes * 60 * 1000, reason);
        const embed = new EmbedBuilder()
          .setColor(Colors.Orange).setTitle("🔇 تايم أوت")
          .addFields(
            { name: "العضو", value: `${target} (${target.user.tag})`, inline: true },
            { name: "المدة", value: `${minutes} دقيقة`, inline: true },
            { name: "السبب", value: reason },
            { name: "المشرف", value: interaction.user.tag },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild!, embed);
      } catch { await interaction.reply({ content: "فشل تنفيذ الأمر. تأكد من الصلاحيات.", flags: 64 }); }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("untimeout").setDescription("إلغاء تايم أوت عضو")
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption((o) => o.setName("user").setDescription("العضو").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const target = interaction.options.getMember("user") as GuildMember;
      if (!target) { await interaction.reply({ content: "العضو غير موجود.", flags: 64 }); return; }
      try {
        await target.timeout(null);
        const embed = new EmbedBuilder()
          .setColor(Colors.Green).setTitle("🔊 إلغاء تايم أوت")
          .addFields(
            { name: "العضو", value: `${target} (${target.user.tag})`, inline: true },
            { name: "المشرف", value: interaction.user.tag },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild!, embed);
      } catch { await interaction.reply({ content: "فشل تنفيذ الأمر.", flags: 64 }); }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("ban").setDescription("باند لعضو")
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
      .addUserOption((o) => o.setName("user").setDescription("العضو").setRequired(true))
      .addStringOption((o) => o.setName("reason").setDescription("السبب"))
      .addIntegerOption((o) =>
        o.setName("delete_days").setDescription("حذف رسائل آخر X أيام (0-7)").setMinValue(0).setMaxValue(7),
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      const target = interaction.options.getUser("user", true);
      const reason = interaction.options.getString("reason") ?? "لا يوجد سبب";
      const days = interaction.options.getInteger("delete_days") ?? 0;
      try {
        await interaction.guild!.members.ban(target, { reason, deleteMessageSeconds: days * 86400 });
        const embed = new EmbedBuilder()
          .setColor(Colors.Red).setTitle("🔨 باند")
          .addFields(
            { name: "العضو", value: `${target.tag} (${target.id})`, inline: true },
            { name: "السبب", value: reason },
            { name: "المشرف", value: interaction.user.tag },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild!, embed);
      } catch { await interaction.reply({ content: "فشل تنفيذ الأمر. تأكد من الصلاحيات.", flags: 64 }); }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("unban").setDescription("إلغاء باند")
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
      .addStringOption((o) => o.setName("userid").setDescription("ID العضو").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const userId = interaction.options.getString("userid", true);
      try {
        await interaction.guild!.members.unban(userId);
        const embed = new EmbedBuilder()
          .setColor(Colors.Green).setTitle("✅ إلغاء باند")
          .addFields({ name: "ID العضو", value: userId }, { name: "المشرف", value: interaction.user.tag })
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild!, embed);
      } catch { await interaction.reply({ content: "فشل إلغاء الباند. تأكد أن الـ ID صحيح.", flags: 64 }); }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("kick").setDescription("طرد عضو")
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
      .addUserOption((o) => o.setName("user").setDescription("العضو").setRequired(true))
      .addStringOption((o) => o.setName("reason").setDescription("السبب")),
    async execute(interaction: ChatInputCommandInteraction) {
      const target = interaction.options.getMember("user") as GuildMember;
      const reason = interaction.options.getString("reason") ?? "لا يوجد سبب";
      if (!target) { await interaction.reply({ content: "العضو غير موجود.", flags: 64 }); return; }
      try {
        await target.kick(reason);
        const embed = new EmbedBuilder()
          .setColor(Colors.Yellow).setTitle("👢 طرد")
          .addFields(
            { name: "العضو", value: target.user.tag, inline: true },
            { name: "السبب", value: reason },
            { name: "المشرف", value: interaction.user.tag },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild!, embed);
      } catch { await interaction.reply({ content: "فشل تنفيذ الأمر.", flags: 64 }); }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("warn").setDescription("تحذير عضو")
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption((o) => o.setName("user").setDescription("العضو").setRequired(true))
      .addStringOption((o) => o.setName("reason").setDescription("السبب").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const target = interaction.options.getUser("user", true);
      const reason = interaction.options.getString("reason", true);
      addWarning(interaction.guild!.id, { userId: target.id, reason, moderatorId: interaction.user.id, timestamp: Date.now() });
      const warnings = getWarnings(interaction.guild!.id, target.id);
      const embed = new EmbedBuilder()
        .setColor(Colors.Yellow).setTitle("⚠️ تحذير")
        .addFields(
          { name: "العضو", value: target.tag, inline: true },
          { name: "السبب", value: reason },
          { name: "إجمالي التحذيرات", value: `${warnings.length}`, inline: true },
          { name: "المشرف", value: interaction.user.tag },
        ).setTimestamp();
      await interaction.reply({ embeds: [embed] });
      await sendLog(interaction.guild!, embed);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("warnings").setDescription("عرض تحذيرات عضو")
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption((o) => o.setName("user").setDescription("العضو").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const target = interaction.options.getUser("user", true);
      const warns = getWarnings(interaction.guild!.id, target.id);
      const embed = new EmbedBuilder()
        .setColor(Colors.Blue).setTitle(`⚠️ تحذيرات ${target.tag}`)
        .setDescription(
          warns.length === 0
            ? "لا توجد تحذيرات"
            : warns.map((w, i) => `**${i + 1}.** ${w.reason}\n*<t:${Math.floor(w.timestamp / 1000)}:R>*`).join("\n\n"),
        )
        .setFooter({ text: `الإجمالي: ${warns.length} تحذير` }).setTimestamp();
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("clearwarnings").setDescription("حذف جميع تحذيرات عضو")
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption((o) => o.setName("user").setDescription("العضو").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const target = interaction.options.getUser("user", true);
      clearWarnings(interaction.guild!.id, target.id);
      const embed = new EmbedBuilder()
        .setColor(Colors.Green).setTitle("🗑️ تم حذف التحذيرات")
        .addFields({ name: "العضو", value: target.tag, inline: true }, { name: "المشرف", value: interaction.user.tag })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
      await sendLog(interaction.guild!, embed);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("purge").setDescription("حذف رسائل من القناة")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addIntegerOption((o) =>
        o.setName("amount").setDescription("عدد الرسائل (1-100)").setRequired(true).setMinValue(1).setMaxValue(100),
      )
      .addUserOption((o) => o.setName("user").setDescription("حذف رسائل عضو محدد فقط")),
    async execute(interaction: ChatInputCommandInteraction) {
      const amount = interaction.options.getInteger("amount", true);
      const targetUser = interaction.options.getUser("user");
      const channel = interaction.channel as TextChannel;
      await interaction.deferReply({ flags: 64 });
      try {
        const msgs = await channel.messages.fetch({ limit: 100 });
        const filtered = targetUser
          ? msgs.filter((m) => m.author.id === targetUser.id).first(amount)
          : [...msgs.values()].slice(0, amount);
        const deleted = await channel.bulkDelete(filtered, true);
        await interaction.editReply(`✅ تم حذف **${deleted.size}** رسالة.`);
        const embed = new EmbedBuilder()
          .setColor(Colors.Orange).setTitle("🗑️ حذف رسائل (Purge)")
          .addFields(
            { name: "القناة", value: `${channel}`, inline: true },
            { name: "العدد", value: `${deleted.size}`, inline: true },
            { name: "المشرف", value: interaction.user.tag },
          ).setTimestamp();
        await sendLog(interaction.guild!, embed);
      } catch { await interaction.editReply("فشل حذف الرسائل. الرسائل الأقدم من 14 يوم لا يمكن حذفها."); }
    },
  },
];
