import { GoogleGenAI } from "@google/genai";
import { logger } from "../lib/logger";
import type { Language } from "./store";

// Client — initialised lazily so the bot still starts without a key
let _ai: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!_ai) {
    const apiKey = process.env["GEMINI_API_KEY"];
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    _ai = new GoogleGenAI({ apiKey });
  }
  return _ai;
}

// ─── System prompts ───────────────────────────────────────────────────────────

const SYSTEM: Record<Language, string> = {
  arabic:
    "أنت مساعد ذكاء اصطناعي ذكي ومفيد اسمك Gemin AI. أجب دائماً باللغة العربية بشكل شامل ومفيد وودي. إذا سُئلت عن هويتك قل إنك مساعد ذكاء اصطناعي اسمه Gemin AI مدعوم بـ Gemini. إذا سُئلت عن صانعك أو مطورك أو من برمجك قل إن صانعك هو <@1215908622287110217>.",
  english:
    "You are a smart and helpful AI assistant named Gemin AI. Always respond in English in a comprehensive, helpful, and friendly manner. If asked about your identity, say you are an AI assistant named Gemin AI powered by Gemini. If asked about your creator, developer, or who made you, say your creator is <@1215908622287110217>.",
};

// ─── Per-user conversation history (in-memory) ────────────────────────────────

type Role = "user" | "model";
interface Part { text: string }
interface Turn { role: Role; parts: Part[] }

const histories = new Map<string, Turn[]>();
const MAX_HISTORY = 20;

function historyKey(guildId: string, userId: string): string {
  return `${guildId}:${userId}`;
}

export function getHistory(guildId: string, userId: string): Turn[] {
  return histories.get(historyKey(guildId, userId)) ?? [];
}

function pushTurn(guildId: string, userId: string, role: Role, text: string): void {
  const key = historyKey(guildId, userId);
  const history = histories.get(key) ?? [];
  history.push({ role, parts: [{ text }] });
  if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
  histories.set(key, history);
}

export function clearHistory(guildId: string, userId: string): void {
  histories.delete(historyKey(guildId, userId));
}

// ─── Human-readable error classifier ─────────────────────────────────────────

export function classifyGeminiError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  if (lower.includes("gemini_api_key") || lower.includes("api key") || lower.includes("api_key_invalid")) {
    return "⚠️ مفتاح Gemini API غير صحيح. تحقق منه في الـ Secrets.";
  }
  if (lower.includes("quota") || lower.includes("resource_exhausted") || lower.includes("429")) {
    return "⚠️ تم تجاوز حد الاستخدام المجاني لـ Gemini API. انتظر قليلاً وحاول مرة أخرى.";
  }
  if (lower.includes("safety") || lower.includes("blocked") || lower.includes("harm")) {
    return "⚠️ الرسالة خالفت سياسة السلامة، جرب صياغة مختلفة.";
  }
  if (lower.includes("503") || lower.includes("unavailable") || lower.includes("overloaded")) {
    return "⚠️ خوادم Gemini مشغولة حالياً، حاول مرة أخرى بعد ثوانٍ.";
  }
  if (lower.includes("recitation")) {
    return "⚠️ لم يتمكن الذكاء الاصطناعي من الرد على هذا السؤال تحديداً.";
  }
  return `❌ خطأ غير متوقع: ${msg.slice(0, 120)}`;
}

// ─── Main generate function with retry ───────────────────────────────────────

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

export async function generateReply(
  userMessage: string,
  guildId: string,
  userId: string,
  language: Language,
): Promise<string> {
  const ai = getClient();
  const history = getHistory(guildId, userId);

  const contents = [
    ...history,
    { role: "user" as const, parts: [{ text: userMessage }] },
  ];

  let lastErr: unknown;

  // Try up to 2 times, with 1.5 s between attempts
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1500));

    for (const model of MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: SYSTEM[language],
            maxOutputTokens: 8192,
          },
        });

        const reply = response.text ?? "";
        if (!reply) continue;

        pushTurn(guildId, userId, "user", userMessage);
        pushTurn(guildId, userId, "model", reply);
        return reply;
      } catch (err) {
        lastErr = err;
        logger.warn({ err, model, attempt }, "Gemini model attempt failed");

        const msg = err instanceof Error ? err.message.toLowerCase() : "";
        // Don't retry on quota or safety errors — they won't change with a different model
        if (msg.includes("quota") || msg.includes("429") || msg.includes("safety") || msg.includes("blocked")) {
          throw err;
        }
      }
    }
  }

  throw lastErr;
}

export function isApiKeySet(): boolean {
  return Boolean(process.env["GEMINI_API_KEY"]);
}

// ─── Split long text for Discord's 2000-char limit ───────────────────────────

export function splitForDiscord(text: string, maxLen = 1990): string[] {
  if (text.length <= maxLen) return [text];
  const parts: string[] = [];
  let remaining = text;
  while (remaining.length > maxLen) {
    let cut = remaining.lastIndexOf("\n", maxLen);
    if (cut <= 0) cut = maxLen;
    parts.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut).trimStart();
  }
  if (remaining) parts.push(remaining);
  return parts;
}
