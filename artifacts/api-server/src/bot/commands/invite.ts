import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

const OWNER_ID = "1215908622287110217";

export const inviteCommand = {
  data: new SlashCommandBuilder()
    .setName("invite")
    .setDescription("احصل على رابط استضافة البوت — لصاحب البوت فقط"),

  async execute(interaction: ChatInputCommandInteraction) {
    if (interaction.user.id !== OWNER_ID) {
      await interaction.reply({
        content: "❌ هذا الأمر متاح لصاحب البوت فقط.",
        flags: 64,
      });
      return;
    }

    const clientId = interaction.client.user.id;
    // permissions=8 = Administrator
    const oauthUrl =
      `https://discord.com/oauth2/authorize?client_id=${clientId}` +
      `&scope=bot+applications.commands&permissions=8`;

    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle("🤖 استضف البوت في سيرفرك")
      .setDescription(
        "اضغط على الزر أدناه لإضافة البوت الذكي إلى أي سيرفر تريده.\n\n" +
        "بعد إضافته استخدم `/setup` لتحديد قناة الذكاء الاصطناعي.",
      )
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("أضف البوت للسيرفر")
        .setStyle(ButtonStyle.Link)
        .setURL(oauthUrl)
        .setEmoji("🔗"),
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
