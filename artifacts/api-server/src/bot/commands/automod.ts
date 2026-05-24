import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  Colors,
  AutoModerationRuleEventType,
  AutoModerationRuleTriggerType,
  AutoModerationActionType,
} from "discord.js";

export const automodCommand = {
  data: new SlashCommandBuilder()
    .setName("setup-automod")
    .setDescription("تفعيل AutoMod التلقائي للسيرفر (يمنح البوت شارت Uses AutoMod)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: 64 });

    const guild = interaction.guild!;
    const results: string[] = [];
    const errors: string[] = [];

    // ── 1. قاعدة حظر الكلمات المسيئة الشائعة ────────────────────────────────
    try {
      const existing = await guild.autoModerationRules.fetch();
      const hasKeyword = existing.some(
        (r) =>
          r.triggerType === AutoModerationRuleTriggerType.Keyword &&
          r.name === "Gemin AI – Block Keywords",
      );

      if (!hasKeyword) {
        await guild.autoModerationRules.create({
          name: "Gemin AI – Block Keywords",
          eventType: AutoModerationRuleEventType.MessageSend,
          triggerType: AutoModerationRuleTriggerType.Keyword,
          triggerMetadata: {
            keywordFilter: [
              "*nigga*", "*nigger*", "*fuck*", "*shit*", "*bitch*",
              "*faggot*", "*retard*", "*whore*",
            ],
            regexPatterns: [],
          },
          actions: [
            {
              type: AutoModerationActionType.BlockMessage,
              metadata: { customMessage: "🚫 تم حذف رسالتك لاحتوائها على كلمات مخالفة." },
            },
          ],
          enabled: true,
          reason: "Gemin AI AutoMod setup",
        });
        results.push("✅ قاعدة حظر الكلمات المسيئة");
      } else {
        results.push("⏭️ قاعدة الكلمات موجودة مسبقاً");
      }
    } catch {
      errors.push("❌ قاعدة الكلمات — تأكد من صلاحية Manage Guild");
    }

    // ── 2. قاعدة منع السبام (إرسال كثير من الرسائل) ─────────────────────────
    try {
      const existing = await guild.autoModerationRules.fetch();
      const hasSpam = existing.some(
        (r) =>
          r.triggerType === AutoModerationRuleTriggerType.MentionSpam &&
          r.name === "Gemin AI – Mention Spam",
      );

      if (!hasSpam) {
        await guild.autoModerationRules.create({
          name: "Gemin AI – Mention Spam",
          eventType: AutoModerationRuleEventType.MessageSend,
          triggerType: AutoModerationRuleTriggerType.MentionSpam,
          triggerMetadata: {
            mentionTotalLimit: 5,
            mentionRaidProtectionEnabled: true,
          },
          actions: [
            {
              type: AutoModerationActionType.BlockMessage,
              metadata: { customMessage: "🚫 لا يمكنك منشنة هذا العدد الكبير من الأشخاص." },
            },
            {
              type: AutoModerationActionType.Timeout,
              metadata: { durationSeconds: 60 },
            },
          ],
          enabled: true,
          reason: "Gemin AI AutoMod setup",
        });
        results.push("✅ قاعدة منع منشن سبام");
      } else {
        results.push("⏭️ قاعدة المنشن موجودة مسبقاً");
      }
    } catch {
      errors.push("❌ قاعدة المنشن — تأكد من صلاحية Moderate Members");
    }

    // ── 3. قاعدة منع الروابط الخارجية الخطرة ────────────────────────────────
    try {
      const existing = await guild.autoModerationRules.fetch();
      const hasLinks = existing.some(
        (r) =>
          r.triggerType === AutoModerationRuleTriggerType.Keyword &&
          r.name === "Gemin AI – Block Spam Links",
      );

      if (!hasLinks) {
        await guild.autoModerationRules.create({
          name: "Gemin AI – Block Spam Links",
          eventType: AutoModerationRuleEventType.MessageSend,
          triggerType: AutoModerationRuleTriggerType.Keyword,
          triggerMetadata: {
            keywordFilter: [],
            regexPatterns: [
              "discord\\.gift\\/[a-zA-Z0-9]+",
              "free-nitro\\.[a-zA-Z]+",
            ],
          },
          actions: [
            {
              type: AutoModerationActionType.BlockMessage,
              metadata: { customMessage: "🚫 تم حذف رسالتك لاحتوائها على رابط مشبوه." },
            },
          ],
          enabled: true,
          reason: "Gemin AI AutoMod setup",
        });
        results.push("✅ قاعدة حظر الروابط المشبوهة");
      } else {
        results.push("⏭️ قاعدة الروابط موجودة مسبقاً");
      }
    } catch {
      errors.push("❌ قاعدة الروابط");
    }

    // ── Build result embed ────────────────────────────────────────────────────
    const allGood = errors.length === 0;

    const embed = new EmbedBuilder()
      .setColor(allGood ? Colors.Green : Colors.Orange)
      .setTitle(allGood ? "🛡️ تم تفعيل AutoMod" : "⚠️ تم تفعيل AutoMod (مع تحذيرات)")
      .setDescription(
        "تم إنشاء قواعد AutoMod للسيرفر.\n" +
        "البوت حصل الآن على شارت **Uses AutoMod** ✨\n\n" +
        [...results, ...errors].join("\n"),
      )
      .addFields({
        name: "📌 ملاحظة",
        value:
          "يمكنك تعديل القواعد أو إضافة استثناءات من **Server Settings → Safety Setup → AutoMod**.",
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
