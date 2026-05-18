import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  GuildMember,
  Colors,
  Role,
  TextChannel,
} from "discord.js";
import { setGuildSettings, getGuildSettings } from "../store";
import { sendLog } from "../utils";

export const adminCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("role").setDescription("إضافة أو إزالة رول من عضو")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
      .addSubcommand((s) =>
        s.setName("add").setDescription("إضافة رول")
          .addUserOption((o) => o.setName("user").setDescription("العضو").setRequired(true))
          .addRoleOption((o) => o.setName("role").setDescription("الرول").setRequired(true)),
      )
      .addSubcommand((s) =>
        s.setName("remove").setDescription("إزالة رول")
          .addUserOption((o) => o.setName("user").setDescription("العضو").setRequired(true))
          .addRoleOption((o) => o.setName("role").setDescription("الرول").setRequired(true)),
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      const sub = interaction.options.getSubcommand();
      const target = interaction.options.getMember("user") as GuildMember;
      const role = interaction.options.getRole("role") as Role;
      if (!target) { await interaction.reply({ content: "العضو غير موجود.", flags: 64 }); return; }
      try {
        if (sub === "add") await target.roles.add(role);
        else await target.roles.remove(role);
        const embed = new EmbedBuilder()
          .setColor(sub === "add" ? Colors.Green : Colors.Orange)
          .setTitle(sub === "add" ? "✅ إضافة رول" : "➖ إزالة رول")
          .addFields(
            { name: "العضو", value: target.user.tag, inline: true },
            { name: "الرول", value: `${role}`, inline: true },
            { name: "المشرف", value: interaction.user.tag },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild!, embed);
      } catch { await interaction.reply({ content: "فشل تنفيذ الأمر. تأكد أن الرول أقل من رول البوت.", flags: 64 }); }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("createrole").setDescription("إنشاء رول جديد")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
      .addStringOption((o) => o.setName("name").setDescription("اسم الرول").setRequired(true))
      .addStringOption((o) => o.setName("color").setDescription("اللون hex مثال: #ff0000"))
      .addBooleanOption((o) => o.setName("hoist").setDescription("إظهاره منفصلاً في القائمة")),
    async execute(interaction: ChatInputCommandInteraction) {
      const name = interaction.options.getString("name", true);
      const color = interaction.options.getString("color") as `#${string}` | null;
      const hoist = interaction.options.getBoolean("hoist") ?? false;
      try {
        const role = await interaction.guild!.roles.create({ name, color: color ?? undefined, hoist });
        const embed = new EmbedBuilder()
          .setColor(Colors.Green).setTitle("✅ تم إنشاء الرول")
          .addFields({ name: "الرول", value: `${role}`, inline: true }, { name: "المشرف", value: interaction.user.tag })
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild!, embed);
      } catch { await interaction.reply({ content: "فشل إنشاء الرول.", flags: 64 }); }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("deleterole").setDescription("حذف رول")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
      .addRoleOption((o) => o.setName("role").setDescription("الرول").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const role = interaction.options.getRole("role") as Role;
      try {
        const roleName = role.name;
        await role.delete(`Deleted by ${interaction.user.tag}`);
        const embed = new EmbedBuilder()
          .setColor(Colors.Red).setTitle("🗑️ تم حذف الرول")
          .addFields({ name: "اسم الرول", value: roleName, inline: true }, { name: "المشرف", value: interaction.user.tag })
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild!, embed);
      } catch { await interaction.reply({ content: "فشل حذف الرول.", flags: 64 }); }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("setnick").setDescription("تغيير لقب عضو")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
      .addUserOption((o) => o.setName("user").setDescription("العضو").setRequired(true))
      .addStringOption((o) => o.setName("nick").setDescription("اللقب الجديد (فارغ = إعادة تعيين)")),
    async execute(interaction: ChatInputCommandInteraction) {
      const target = interaction.options.getMember("user") as GuildMember;
      const nick = interaction.options.getString("nick") ?? null;
      if (!target) { await interaction.reply({ content: "العضو غير موجود.", flags: 64 }); return; }
      try {
        await target.setNickname(nick);
        await interaction.reply({ content: `✅ تم تغيير لقب ${target.user.tag} إلى **${nick ?? "(الاسم الأصلي)"}**` });
      } catch { await interaction.reply({ content: "فشل تغيير اللقب.", flags: 64 }); }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("announce").setDescription("إرسال إعلان إلى قناة")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addChannelOption((o) => o.setName("channel").setDescription("القناة").setRequired(true))
      .addStringOption((o) => o.setName("message").setDescription("نص الإعلان").setRequired(true))
      .addBooleanOption((o) => o.setName("ping_everyone").setDescription("تاق @everyone")),
    async execute(interaction: ChatInputCommandInteraction) {
      const channel = interaction.options.getChannel("channel", true) as TextChannel;
      const message = interaction.options.getString("message", true);
      const pingEveryone = interaction.options.getBoolean("ping_everyone") ?? false;
      try {
        const embed = new EmbedBuilder()
          .setColor(Colors.Gold).setTitle("📢 إعلان").setDescription(message)
          .setFooter({ text: `بواسطة ${interaction.user.tag}` }).setTimestamp();
        await channel.send({ content: pingEveryone ? "@everyone" : undefined, embeds: [embed] });
        await interaction.reply({ content: `✅ تم إرسال الإعلان إلى ${channel}`, flags: 64 });
      } catch { await interaction.reply({ content: "فشل إرسال الإعلان.", flags: 64 }); }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("embed").setDescription("إرسال رسالة embed مخصصة")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addChannelOption((o) => o.setName("channel").setDescription("القناة").setRequired(true))
      .addStringOption((o) => o.setName("title").setDescription("العنوان").setRequired(true))
      .addStringOption((o) => o.setName("description").setDescription("الوصف").setRequired(true))
      .addStringOption((o) => o.setName("color").setDescription("اللون hex مثال: #ff0000")),
    async execute(interaction: ChatInputCommandInteraction) {
      const channel = interaction.options.getChannel("channel", true) as TextChannel;
      const title = interaction.options.getString("title", true);
      const description = interaction.options.getString("description", true);
      const colorStr = interaction.options.getString("color");
      const color = colorStr ? parseInt(colorStr.replace("#", ""), 16) : Colors.Blue;
      try {
        const embed = new EmbedBuilder().setColor(color).setTitle(title).setDescription(description).setTimestamp();
        await channel.send({ embeds: [embed] });
        await interaction.reply({ content: `✅ تم إرسال الرسالة إلى ${channel}`, flags: 64 });
      } catch { await interaction.reply({ content: "فشل إرسال الرسالة.", flags: 64 }); }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("setlogchannel").setDescription("تعيين قناة اللوق")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addChannelOption((o) => o.setName("channel").setDescription("القناة").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const channel = interaction.options.getChannel("channel", true);
      setGuildSettings(interaction.guild!.id, { logChannelId: channel.id });
      await interaction.reply({ content: `✅ تم تعيين قناة اللوق إلى ${channel}` });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("setjailchannel").setDescription("تعيين قناة السجن النصية (يُرسل فيها تنبيه المخالفين)")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addChannelOption((o) => o.setName("channel").setDescription("القناة النصية").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const channel = interaction.options.getChannel("channel", true);
      setGuildSettings(interaction.guild!.id, { jailChannelId: channel.id });
      await interaction.reply({ content: `✅ تم تعيين قناة السجن إلى ${channel}` });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("setjailrole").setDescription("تعيين رول السجن (يُعطى للمخالفين تلقائياً)")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addRoleOption((o) => o.setName("role").setDescription("رول السجن").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const role = interaction.options.getRole("role", true);
      setGuildSettings(interaction.guild!.id, { jailRoleId: role.id });
      await interaction.reply({ content: `✅ تم تعيين رول السجن إلى ${role}\n⚠️ تأكد أن هذا الرول يمنع الوصول لجميع القنوات ما عدا قناة السجن.` });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("jail").setDescription("سجن عضو يدوياً (إعطاؤه رول السجن)")
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption((o) => o.setName("user").setDescription("العضو").setRequired(true))
      .addStringOption((o) => o.setName("reason").setDescription("السبب"))
      .addIntegerOption((o) =>
        o.setName("minutes").setDescription("مدة السجن بالدقائق (0 = دائم حتى /unjail)").setMinValue(0),
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      const target = interaction.options.getMember("user") as GuildMember;
      const reason = interaction.options.getString("reason") ?? "لا يوجد سبب";
      const minutes = interaction.options.getInteger("minutes") ?? 0;
      if (!target) { await interaction.reply({ content: "العضو غير موجود.", flags: 64 }); return; }

      const settings = getGuildSettings(interaction.guild!.id);
      if (!settings.jailRoleId) {
        await interaction.reply({ content: "لم يتم تعيين رول السجن بعد. استخدم `/setjailrole` أولاً.", flags: 64 });
        return;
      }
      try {
        await target.roles.add(settings.jailRoleId);
        if (minutes > 0) {
          const ms = minutes * 60 * 1000;
          await target.timeout(ms, reason);
          setTimeout(() => target.roles.remove(settings.jailRoleId!).catch(() => {}), ms);
        }

        const jailCh = settings.jailChannelId
          ? interaction.guild!.channels.cache.get(settings.jailChannelId) as TextChannel | undefined
          : null;
        if (jailCh?.isTextBased()) {
          await jailCh.send(`🔒 ${target} تم إيداعك في السجن بسبب: **${reason}**${minutes > 0 ? ` لمدة ${minutes} دقيقة.` : " حتى يقرر الإدارة."}`);
        }

        const embed = new EmbedBuilder()
          .setColor(Colors.DarkRed).setTitle("🔒 تم السجن")
          .addFields(
            { name: "العضو", value: target.user.tag, inline: true },
            { name: "السبب", value: reason },
            { name: "المدة", value: minutes > 0 ? `${minutes} دقيقة` : "دائم", inline: true },
            { name: "المشرف", value: interaction.user.tag },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild!, embed);
      } catch { await interaction.reply({ content: "فشل سجن العضو.", flags: 64 }); }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("unjail").setDescription("الإفراج عن عضو من السجن")
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption((o) => o.setName("user").setDescription("العضو").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const target = interaction.options.getMember("user") as GuildMember;
      if (!target) { await interaction.reply({ content: "العضو غير موجود.", flags: 64 }); return; }

      const settings = getGuildSettings(interaction.guild!.id);
      if (!settings.jailRoleId) {
        await interaction.reply({ content: "لم يتم تعيين رول السجن.", flags: 64 });
        return;
      }
      try {
        await target.roles.remove(settings.jailRoleId);
        await target.timeout(null).catch(() => {});
        const embed = new EmbedBuilder()
          .setColor(Colors.Green).setTitle("🔓 الإفراج من السجن")
          .addFields(
            { name: "العضو", value: target.user.tag, inline: true },
            { name: "المشرف", value: interaction.user.tag },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild!, embed);
      } catch { await interaction.reply({ content: "فشل الإفراج عن العضو.", flags: 64 }); }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("setjoinrole").setDescription("تعيين رول يُعطى للأعضاء الجدد")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addRoleOption((o) => o.setName("role").setDescription("الرول").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const role = interaction.options.getRole("role", true);
      setGuildSettings(interaction.guild!.id, { joinRoleId: role.id });
      await interaction.reply({ content: `✅ تم تعيين رول الانضمام إلى ${role}` });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("removejoinrole").setDescription("إزالة رول الانضمام التلقائي")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction: ChatInputCommandInteraction) {
      setGuildSettings(interaction.guild!.id, { joinRoleId: undefined });
      await interaction.reply({ content: "✅ تم إزالة رول الانضمام التلقائي." });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("antispam").setDescription("تفعيل أو تعطيل الحماية من السبام")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addStringOption((o) =>
        o.setName("status").setDescription("الحالة").setRequired(true)
          .addChoices({ name: "تفعيل", value: "on" }, { name: "تعطيل", value: "off" }),
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      const status = interaction.options.getString("status", true);
      setGuildSettings(interaction.guild!.id, { antiSpamEnabled: status === "on" });
      await interaction.reply({ content: `✅ الحماية من السبام: **${status === "on" ? "مفعلة" : "معطلة"}**` });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("spamsettings").setDescription("إعداد حدود السبام")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addIntegerOption((o) =>
        o.setName("messages").setDescription("عدد الرسائل قبل التايم أوت").setRequired(true).setMinValue(2).setMaxValue(50),
      )
      .addIntegerOption((o) =>
        o.setName("seconds").setDescription("الفترة الزمنية بالثواني").setRequired(true).setMinValue(1).setMaxValue(60),
      )
      .addIntegerOption((o) =>
        o.setName("timeout_minutes").setDescription("مدة التايم أوت بالدقائق").setRequired(true).setMinValue(1).setMaxValue(40320),
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      const messages = interaction.options.getInteger("messages", true);
      const seconds = interaction.options.getInteger("seconds", true);
      const timeout = interaction.options.getInteger("timeout_minutes", true);
      setGuildSettings(interaction.guild!.id, { spamMessages: messages, spamSeconds: seconds, spamTimeoutMinutes: timeout });
      const embed = new EmbedBuilder()
        .setColor(Colors.Blue).setTitle("⚙️ إعدادات السبام")
        .addFields(
          { name: "الحد", value: `${messages} رسائل / ${seconds} ثانية`, inline: true },
          { name: "التايم أوت", value: `${timeout} دقيقة`, inline: true },
        ).setTimestamp();
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("settings").setDescription("عرض إعدادات البوت الحالية")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction: ChatInputCommandInteraction) {
      const s = getGuildSettings(interaction.guild!.id);
      const embed = new EmbedBuilder()
        .setColor(Colors.Blue).setTitle("⚙️ إعدادات البوت")
        .addFields(
          { name: "قناة اللوق", value: s.logChannelId ? `<#${s.logChannelId}>` : "غير محددة", inline: true },
          { name: "رول الانضمام", value: s.joinRoleId ? `<@&${s.joinRoleId}>` : "غير محدد", inline: true },
          { name: "قناة السجن", value: s.jailChannelId ? `<#${s.jailChannelId}>` : "غير محددة", inline: true },
          { name: "رول السجن", value: s.jailRoleId ? `<@&${s.jailRoleId}>` : "غير محدد", inline: true },
          { name: "الحماية من السبام", value: s.antiSpamEnabled ? "✅ مفعلة" : "❌ معطلة", inline: true },
          { name: "حدود السبام", value: `${s.spamMessages} رسائل / ${s.spamSeconds} ثانية → ${s.spamTimeoutMinutes} دقيقة` },
        ).setTimestamp();
      await interaction.reply({ embeds: [embed] });
    },
  },
];
