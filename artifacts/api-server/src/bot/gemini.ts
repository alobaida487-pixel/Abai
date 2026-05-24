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

// ─── Main generate function ───────────────────────────────────────────────────

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

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
    config: {
      systemInstruction: SYSTEM[language],
      maxOutputTokens: 8192,
    },
  });

  const reply = response.text ?? "";

  // Save both turns to history after a successful response
  pushTurn(guildId, userId, "user", userMessage);
  pushTurn(guildId, userId, "model", reply);

  return reply;
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
