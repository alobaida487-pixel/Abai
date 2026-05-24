import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  TextChannel,
  Role,
} from "discord.js";

export const setupRolesCommand = {
  data: new SlashCommandBuilder()
    .setName("setup-roles")
    .setDescription("إنشاء رسالة الرتب الذاتية بأزرار")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((o) =>
      o.setName("channel").setDescription("القناة التي تُرسل فيها الرسالة")
        .addChannelTypes(ChannelType.GuildText).setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("title").setDescription("عنوان الرسالة").setRequired(true),
    )
    // Role 1
    .addRoleOption((o) => o.setName("role1").setDescription("الرتبة الأولى").setRequired(true))
    .addStringOption((o) => o.setName("emoji1").setDescription("إيموجي الزر الأول (مثال: 🔔)").setRequired(true))
    .addStringOption((o) => o.setName("desc1").setDescription("وصف الرتبة الأولى").setRequired(true))
    // Role 2
    .addRoleOption((o) => o.setName("role2").setDescription("الرتبة الثانية"))
    .addStringOption((o) => o.setName("emoji2").setDescription("إيموجي الزر الثاني"))
    .addStringOption((o) => o.setName("desc2").setDescription("وصف الرتبة الثانية"))
    // Role 3
    .addRoleOption((o) => o.setName("role3").setDescription("الرتبة الثالثة"))
    .addStringOption((o) => o.setName("emoji3").setDescription("إيموجي الزر الثالث"))
    .addStringOption((o) => o.setName("desc3").setDescription("وصف الرتبة الثالثة"))
    // Role 4
    .addRoleOption((o) => o.setName("role4").setDescription("الرتبة الرابعة"))
    .addStringOption((o) => o.setName("emoji4").setDescription("إيموجي الزر الرابع"))
    .addStringOption((o) => o.setName("desc4").setDescription("وصف الرتبة الرابعة"))
    // Role 5
    .addRoleOption((o) => o.setName("role5").setDescription("الرتبة الخامسة"))
    .addStringOption((o) => o.setName("emoji5").setDescription("إيموجي الزر الخامس"))
    .addStringOption((o) => o.setName("desc5").setDescription("وصف الرتبة الخامسة")),

  async execute(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel("channel", true) as TextChannel;
    const title = interaction.options.getString("title", true);

    const entries: { role: Role; emoji: string; desc: string }[] = [];

    for (let i = 1; i <= 5; i++) {
      const role = interaction.options.getRole(`role${i}`) as Role | null;
      const emoji = interaction.options.getString(`emoji${i}`);
      const desc = interaction.options.getString(`desc${i}`);
      if (role && emoji && desc) entries.push({ role, emoji, desc });
    }

    if (!entries.length) {
      await interaction.reply({ content: "❌ يجب إضافة رتبة واحدة على الأقل.", flags: 64 });
      return;
    }

    const description =
      "تفاعل مع الأزرار لأخذ الرتب التي تناسبك\n\n" +
      entries.map((e) => `${e.emoji} | ${e.desc}`).join("\n");

    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle(title)
      .setDescription(description);

    const buttons = entries.map((e) =>
      new ButtonBuilder()
        .setCustomId(`selfrole:${e.role.id}`)
        .setEmoji(e.emoji)
        .setStyle(ButtonStyle.Secondary),
    );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);

    await channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({
      content: `✅ تم إرسال رسالة الرتب الذاتية في ${channel}.`,
      flags: 64,
    });
  },
};
