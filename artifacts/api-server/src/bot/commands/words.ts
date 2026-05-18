import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  Colors,
} from "discord.js";
import { addBannedWord, removeBannedWord, getBannedWords } from "../store";

export const wordCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("addword").setDescription("إضافة كلمة محظورة")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addStringOption((o) => o.setName("word").setDescription("الكلمة المحظورة").setRequired(true))
      .addStringOption((o) =>
        o.setName("action").setDescription("الإجراء عند الكشف").setRequired(true)
          .addChoices(
            { name: "تايم أوت", value: "timeout" },
            { name: "حذف الرسالة فقط", value: "delete" },
            { name: "باند", value: "ban" },
          ),
      )
      .addIntegerOption((o) =>
        o.setName("timeout_minutes").setDescription("مدة التايم أوت بالدقائق (للإجراء: تايم أوت)").setMinValue(1).setMaxValue(40320),
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      const word = interaction.options.getString("word", true).toLowerCase();
      const action = interaction.options.getString("action", true) as "timeout" | "delete" | "ban";
      const timeoutMinutes = interaction.options.getInteger("timeout_minutes") ?? 5;
      addBannedWord(interaction.guild!.id, { word, action, timeoutMinutes });
      const actionLabel = { timeout: `تايم أوت ${timeoutMinutes} دقيقة`, delete: "حذف الرسالة", ban: "باند" }[action];
      const embed = new EmbedBuilder()
        .setColor(Colors.Red).setTitle("🚫 تمت إضافة كلمة محظورة")
        .addFields(
          { name: "الكلمة", value: `\`${word}\``, inline: true },
          { name: "الإجراء", value: actionLabel, inline: true },
          { name: "المشرف", value: interaction.user.tag },
        ).setTimestamp();
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("removeword").setDescription("إزالة كلمة محظورة")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addStringOption((o) => o.setName("word").setDescription("الكلمة").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const word = interaction.options.getString("word", true).toLowerCase();
      const removed = removeBannedWord(interaction.guild!.id, word);
      if (!removed) { await interaction.reply({ content: `الكلمة \`${word}\` غير موجودة في القائمة.`, flags: 64 }); return; }
      await interaction.reply({ content: `✅ تمت إزالة الكلمة \`${word}\` من قائمة الكلمات المحظورة.` });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("listwords").setDescription("عرض جميع الكلمات المحظورة")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction: ChatInputCommandInteraction) {
      const words = getBannedWords(interaction.guild!.id);
      const actionLabel = (a: string, m: number) =>
        ({ timeout: `تايم أوت ${m}د`, delete: "حذف", ban: "باند" } as Record<string, string>)[a] ?? a;
      const embed = new EmbedBuilder()
        .setColor(Colors.Orange).setTitle("🚫 الكلمات المحظورة")
        .setDescription(
          words.length === 0
            ? "لا توجد كلمات محظورة."
            : words.map((w, i) => `**${i + 1}.** \`${w.word}\` — ${actionLabel(w.action, w.timeoutMinutes)}`).join("\n"),
        )
        .setFooter({ text: `الإجمالي: ${words.length} كلمة` }).setTimestamp();
      await interaction.reply({ embeds: [embed] });
    },
  },
];
