import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Colors,
} from "discord.js";
import { setLanguage, getLanguage } from "../store";
import type { Language } from "../store";

export const setLanguageCommand = {
  data: new SlashCommandBuilder()
    .setName("set-language")
    .setDescription("تغيير لغة ردود البوت")
    .addStringOption((o) =>
      o
        .setName("language")
        .setDescription("اختر اللغة")
        .setRequired(true)
        .addChoices(
          { name: "🇸🇦 العربية (Arabic)", value: "arabic" },
          { name: "🇺🇸 الإنجليزية (English)", value: "english" },
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const lang = interaction.options.getString("language", true) as Language;
    const guildId = interaction.guildId!;

    setLanguage(guildId, lang);

    const isArabic = lang === "arabic";

    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle(isArabic ? "🌐 تم تغيير اللغة" : "🌐 Language Changed")
      .setDescription(
        isArabic
          ? "سيرد البوت الآن باللغة **العربية**."
          : "The bot will now respond in **English**.",
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
