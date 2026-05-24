import { Collection } from "discord.js";
import { setupCommand } from "./setup";
import { setLanguageCommand } from "./setlanguage";

export interface BotCommand {
  data: { name: string; toJSON(): object };
  execute(interaction: any): Promise<unknown>;
}

const allCommands: BotCommand[] = [setupCommand, setLanguageCommand];

export const commandCollection = new Collection<string, BotCommand>();

for (const cmd of allCommands) {
  commandCollection.set(cmd.data.name, cmd);
}

export const commandsJSON = allCommands.map((c) => c.data.toJSON());
