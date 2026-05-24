import fs from "fs";
import path from "path";
import { logger } from "../lib/logger";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "bot-data.json");

export type Language = "arabic" | "english";

interface GuildData {
  channelId: string | null;
  language: Language;
}

interface BotData {
  guilds: Record<string, GuildData>;
}

let data: BotData = { guilds: {} };

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

function getGuild(guildId: string): GuildData {
  if (!data.guilds[guildId]) {
    data.guilds[guildId] = { channelId: null, language: "arabic" };
  }
  return data.guilds[guildId];
}

export function getChannelId(guildId: string): string | null {
  return getGuild(guildId).channelId;
}

export function setChannelId(guildId: string, channelId: string): void {
  getGuild(guildId).channelId = channelId;
  saveData();
}

export function getLanguage(guildId: string): Language {
  return getGuild(guildId).language;
}

export function setLanguage(guildId: string, language: Language): void {
  getGuild(guildId).language = language;
  saveData();
}
