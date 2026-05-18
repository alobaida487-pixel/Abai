import { Collection } from "discord.js";
import { moderationCommands } from "./moderation";
import { channelCommands } from "./channels";
import { voiceCommands } from "./voice";
import { adminCommands } from "./admin";
import { wordCommands } from "./words";
import { infoCommands } from "./info";

export interface BotCommand {
  data: { name: string; toJSON(): object };
  execute(interaction: any): Promise<unknown>;
}

const allCommands: BotCommand[] = [
  ...moderationCommands,
  ...channelCommands,
  ...voiceCommands,
  ...adminCommands,
  ...wordCommands,
  ...infoCommands,
];

export const commandCollection = new Collection<string, BotCommand>();

for (const cmd of allCommands) {
  commandCollection.set(cmd.data.name, cmd);
}

export const commandsJSON = allCommands.map((c) => c.data.toJSON());
