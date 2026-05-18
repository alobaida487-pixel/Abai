import fs from "fs";
import path from "path";
import { logger } from "../lib/logger";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "bot-data.json");

export interface GuildSettings {
  logChannelId?: string;
  joinRoleId?: string;
  jailVcId?: string;
  antiSpamEnabled: boolean;
  spamMessages: number;
  spamSeconds: number;
  spamTimeoutMinutes: number;
}

export interface BannedWord {
  word: string;
  action: "timeout" | "delete" | "ban";
  timeoutMinutes: number;
}

export interface Warning {
  userId: string;
  reason: string;
  moderatorId: string;
  timestamp: number;
}

interface BotData {
  guilds: Record<string, GuildSettings>;
  bannedWords: Record<string, BannedWord[]>;
  warnings: Record<string, Warning[]>;
}

const defaultGuildSettings = (): GuildSettings => ({
  antiSpamEnabled: true,
  spamMessages: 6,
  spamSeconds: 5,
  spamTimeoutMinutes: 5,
});

let data: BotData = { guilds: {}, bannedWords: {}, warnings: {} };

export function loadData(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(DATA_FILE)) {
      data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    }
  } catch (err) {
    logger.error({ err }, "Failed to load bot data");
  }
}

function saveData(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    logger.error({ err }, "Failed to save bot data");
  }
}

export function getGuildSettings(guildId: string): GuildSettings {
  if (!data.guilds[guildId]) data.guilds[guildId] = defaultGuildSettings();
  return data.guilds[guildId];
}

export function setGuildSettings(guildId: string, settings: Partial<GuildSettings>): void {
  data.guilds[guildId] = { ...getGuildSettings(guildId), ...settings };
  saveData();
}

export function getBannedWords(guildId: string): BannedWord[] {
  return data.bannedWords[guildId] || [];
}

export function addBannedWord(guildId: string, bw: BannedWord): void {
  if (!data.bannedWords[guildId]) data.bannedWords[guildId] = [];
  const idx = data.bannedWords[guildId].findIndex(
    (w) => w.word.toLowerCase() === bw.word.toLowerCase(),
  );
  if (idx >= 0) data.bannedWords[guildId][idx] = bw;
  else data.bannedWords[guildId].push(bw);
  saveData();
}

export function removeBannedWord(guildId: string, word: string): boolean {
  if (!data.bannedWords[guildId]) return false;
  const before = data.bannedWords[guildId].length;
  data.bannedWords[guildId] = data.bannedWords[guildId].filter(
    (w) => w.word.toLowerCase() !== word.toLowerCase(),
  );
  const removed = data.bannedWords[guildId].length < before;
  if (removed) saveData();
  return removed;
}

export function getWarnings(guildId: string, userId: string): Warning[] {
  return data.warnings[`${guildId}:${userId}`] || [];
}

export function addWarning(guildId: string, w: Warning): void {
  const key = `${guildId}:${w.userId}`;
  if (!data.warnings[key]) data.warnings[key] = [];
  data.warnings[key].push(w);
  saveData();
}

export function clearWarnings(guildId: string, userId: string): void {
  data.warnings[`${guildId}:${userId}`] = [];
  saveData();
}
