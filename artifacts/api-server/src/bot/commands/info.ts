import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  Colors,
} from "discord.js";

export const infoCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("userinfo")
      .setDescription("معلومات عضو")
      .addUserOption((o) => o.setName("user").setDescription("العضو (الافتراضي: أنت)")),
    async execute(interaction: ChatInputCommandInteraction) {
      const target = (interaction.options.getMember("user") || interaction.member) as GuildMember;
      const user = target.user;
      const roles = target.roles.cache
        .filter((r) => r.id !== interaction.guild!.id)
        .sort((a, b) => b.position - a.position)
        .map((r) => `${r}`)
        .slice(0, 10)
        .join(", ") || "لا يوجد";

      const embed = new EmbedBuilder()
        .setColor(target.displayColor || Colors.Blue)
        .setTitle(`👤 ${user.tag}`)
        .setThumbnail(user.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: "ID", value: user.id, inline: true },
          { name: "اللقب", value: target.displayName, inline: true },
          { name: "بوت؟", value: user.bot ? "نعم" : "لا", inline: true },
          { name: "انضم للسيرفر", value: `<t:${Math.floor(target.joinedTimestamp! / 1000)}:R>`, inline: true },
          { name: "تاريخ الإنشاء", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: `الرولات (${target.roles.cache.size - 1})`, value: roles },
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("serverinfo").setDescription("معلومات السيرفر"),
    async execute(interaction: ChatInputCommandInteraction) {
      const guild = interaction.guild!;
      await guild.fetch();
      const embed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle(`🏠 ${guild.name}`)
        .setThumbnail(guild.iconURL({ size: 256 }))
        .addFields(
          { name: "ID", value: guild.id, inline: true },
          { name: "الأعضاء", value: `${guild.memberCount}`, inline: true },
          { name: "المالك", value: `<@${guild.ownerId}>`, inline: true },
          { name: "القنوات", value: `${guild.channels.cache.size}`, inline: true },
          { name: "الرولات", value: `${guild.roles.cache.size}`, inline: true },
          { name: "الإيموجيز", value: `${guild.emojis.cache.size}`, inline: true },
          { name: "مستوى البوست", value: `${guild.premiumTier}`, inline: true },
          { name: "عدد البوستات", value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
          { name: "تاريخ الإنشاء", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>` },
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("roleinfo")
      .setDescription("معلومات رول")
      .addRoleOption((o) => o.setName("role").setDescription("الرول").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const role = interaction.options.getRole("role", true) as import("discord.js").Role;
      const embed = new EmbedBuilder()
        .setColor(role.color || Colors.Blue)
        .setTitle(`🎭 ${role.name}`)
        .addFields(
          { name: "ID", value: role.id, inline: true },
          { name: "اللون", value: role.hexColor, inline: true },
          { name: "الأعضاء", value: `${role.members.size}`, inline: true },
          { name: "قابل للمنشن؟", value: role.mentionable ? "نعم" : "لا", inline: true },
          { name: "مُدار؟", value: role.managed ? "نعم" : "لا", inline: true },
          { name: "الترتيب", value: `${role.position}`, inline: true },
          { name: "تاريخ الإنشاء", value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>` },
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("avatar")
      .setDescription("صورة بروفايل عضو")
      .addUserOption((o) => o.setName("user").setDescription("العضو (الافتراضي: أنت)")),
    async execute(interaction: ChatInputCommandInteraction) {
      const target = interaction.options.getUser("user") || interaction.user;
      const member = interaction.guild?.members.cache.get(target.id);
      const serverAvatar = member?.displayAvatarURL({ size: 512 });
      const globalAvatar = target.displayAvatarURL({ size: 512 });
      const embed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle(`🖼️ صورة ${target.tag}`)
        .setImage(serverAvatar || globalAvatar);
      if (serverAvatar && serverAvatar !== globalAvatar) {
        embed.addFields({ name: "الصورة العالمية", value: `[رابط](${globalAvatar})`, inline: true });
      }
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("botinfo").setDescription("معلومات البوت"),
    async execute(interaction: ChatInputCommandInteraction) {
      const client = interaction.client;
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const embed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle(`🤖 ${client.user!.tag}`)
        .setThumbnail(client.user!.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: "ID", value: client.user!.id, inline: true },
          { name: "السيرفرات", value: `${client.guilds.cache.size}`, inline: true },
          { name: "وقت التشغيل", value: `${hours}س ${minutes}د`, inline: true },
          { name: "البينق", value: `${client.ws.ping}ms`, inline: true },
          { name: "الإصدار", value: "1.0.0", inline: true },
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("help").setDescription("قائمة جميع الأوامر"),
    async execute(interaction: ChatInputCommandInteraction) {
      const embed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle("📋 قائمة الأوامر")
        .addFields(
          {
            name: "🔨 الإشراف",
            value: "`/timeout` `/untimeout` `/ban` `/unban` `/kick` `/warn` `/warnings` `/clearwarnings` `/purge`",
          },
          {
            name: "📺 القنوات",
            value: "`/lock` `/unlock` `/slowmode` `/createchannel` `/deletechannel`",
          },
          {
            name: "🔊 الفويس",
            value: "`/voicekick` `/move` `/mutevc` `/unmutevc` `/deafen` `/undeafen`",
          },
          {
            name: "🎭 الرولات",
            value: "`/role` `/createrole` `/deleterole` `/setnick`",
          },
          {
            name: "🚫 الكلمات المحظورة",
            value: "`/addword` `/removeword` `/listwords`",
          },
          {
            name: "📢 الإعلانات",
            value: "`/announce` `/embed`",
          },
          {
            name: "⚙️ الإعدادات",
            value: "`/setlogchannel` `/setjailvc` `/setjoinrole` `/removejoinrole` `/antispam` `/spamsettings` `/settings`",
          },
          {
            name: "ℹ️ المعلومات",
            value: "`/userinfo` `/serverinfo` `/roleinfo` `/avatar` `/botinfo`",
          },
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    },
  },
];
