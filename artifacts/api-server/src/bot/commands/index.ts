import { Collection } from "discord.js";
import { setupCommand } from "./setup";
import { setLanguageCommand } from "./setlanguage";
import { inviteCommand } from "./invite";
import { setupRolesCommand } from "./setuproles";

export interface BotCommand {
  data: { name: string; toJSON(): object };
  execute(interaction: any): Promise<unknown>;
}

const allCommands: BotCommand[] = [setupCommand, setLanguageCommand, inviteCommand, setupRolesCommand];

export const commandCollection = new Collection<string, BotCommand>();

for (const cmd of allCommands) {
  commandCollection.set(cmd.data.name, cmd);
}

export const commandsJSON = allCommands.map((c) => c.data.toJSON());
