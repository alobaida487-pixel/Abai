import {
  Message,
  Guild,
  GuildMember,
  User,
  TextChannel,
  Role,
  EmbedBuilder,
  Colors,
  BaseChannel,
} from "discord.js";
import { commandCollection } from "./commands";
import { logger } from "../lib/logger";

export const PREFIX = "-";

// ─── Arg schema types ─────────────────────────────────────────────────────────

type ArgType = "user" | "member" | "role" | "channel" | "string" | "integer" | "boolean";

interface ArgDef {
  name: string;
  type: ArgType;
  required?: boolean;
  rest?: boolean;
}

interface CmdSchema {
  args: ArgDef[];
  subcommandArg?: boolean;
}

// ─── Schemas for all commands ─────────────────────────────────────────────────

const schemas: Record<string, CmdSchema> = {
  timeout: { args: [{ name: "user", type: "member", required: true }, { name: "minutes", type: "integer", required: true }, { name: "reason", type: "string", rest: true }] },
  untimeout: { args: [{ name: "user", type: "member", required: true }] },
  ban: { args: [{ name: "user", type: "user", required: true }, { name: "reason", type: "string", rest: true }] },
  unban: { args: [{ name: "userid", type: "string", required: true }] },
  kick: { args: [{ name: "user", type: "member", required: true }, { name: "reason", type: "string", rest: true }] },
  warn: { args: [{ name: "user", type: "user", required: true }, { name: "reason", type: "string", required: true, rest: true }] },
  warnings: { args: [{ name: "user", type: "user", required: true }] },
  clearwarnings: { args: [{ name: "user", type: "user", required: true }] },
  purge: { args: [{ name: "amount", type: "integer", required: true }, { name: "user", type: "user" }] },
  lock: { args: [{ name: "channel", type: "channel" }, { name: "reason", type: "string", rest: true }] },
  unlock: { args: [{ name: "channel", type: "channel" }] },
  slowmode: { args: [{ name: "seconds", type: "integer", required: true }, { name: "channel", type: "channel" }] },
  createchannel: { args: [{ name: "name", type: "string", required: true }, { name: "type", type: "string", required: true }] },
  deletechannel: { args: [{ name: "channel", type: "channel" }, { name: "reason", type: "string", rest: true }] },
  nuke: { args: [] },
  voicekick: { args: [{ name: "user", type: "member", required: true }] },
  move: { args: [{ name: "user", type: "member", required: true }, { name: "channel", type: "channel", required: true }] },
  mutevc: { args: [{ name: "user", type: "member", required: true }] },
  unmutevc: { args: [{ name: "user", type: "member", required: true }] },
  deafen: { args: [{ name: "user", type: "member", required: true }] },
  undeafen: { args: [{ name: "user", type: "member", required: true }] },
  join: { args: [{ name: "channel", type: "channel" }] },
  leave: { args: [] },
  role: { subcommandArg: true, args: [{ name: "user", type: "member", required: true }, { name: "role", type: "role", required: true }] },
  createrole: { args: [{ name: "name", type: "string", required: true }, { name: "color", type: "string" }] },
  deleterole: { args: [{ name: "role", type: "role", required: true }] },
  setnick: { args: [{ name: "user", type: "member", required: true }, { name: "nick", type: "string", rest: true }] },
  announce: { args: [{ name: "channel", type: "channel", required: true }, { name: "message", type: "string", required: true, rest: true }] },
  embed: { args: [{ name: "channel", type: "channel", required: true }, { name: "title", type: "string", required: true }, { name: "description", type: "string", required: true, rest: true }] },
  setlogchannel: { args: [{ name: "channel", type: "channel", required: true }] },
  setjailchannel: { args: [{ name: "channel", type: "channel", required: true }] },
  setjailrole: { args: [{ name: "role", type: "role", required: true }] },
  jail: { args: [{ name: "user", type: "member", required: true }, { name: "minutes", type: "integer" }, { name: "reason", type: "string", rest: true }] },
  unjail: { args: [{ name: "user", type: "member", required: true }] },
  setjoinrole: { args: [{ name: "role", type: "role", required: true }] },
  removejoinrole: { args: [] },
  antispam: { args: [{ name: "status", type: "string", required: true }] },
  spamsettings: { args: [{ name: "messages", type: "integer", required: true }, { name: "seconds", type: "integer", required: true }, { name: "timeout_minutes", type: "integer", required: true }] },
  settings: { args: [] },
  addword: { args: [{ name: "word", type: "string", required: true }, { name: "action", type: "string", required: true }, { name: "timeout_minutes", type: "integer" }] },
  removeword: { args: [{ name: "word", type: "string", required: true }] },
  listwords: { args: [] },
  userinfo: { args: [{ name: "user", type: "user" }] },
  serverinfo: { args: [] },
  roleinfo: { args: [{ name: "role", type: "role", required: true }] },
  avatar: { args: [{ name: "user", type: "user" }] },
  botinfo: { args: [] },
  help: { args: [] },
};

// ─── Token splitter (respects "quoted strings") ───────────────────────────────

function tokenize(str: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === '"' || c === '"' || c === '"') { inQuotes = !inQuotes; continue; }
    if (c === " " && !inQuotes) { if (current) { tokens.push(current); current = ""; } continue; }
    current += c;
  }
  if (current) tokens.push(current);
  return tokens;
}

// ─── Resolvers ────────────────────────────────────────────────────────────────

function extractId(token: string): string | null {
  const m = token.match(/^<[@#&!]{0,2}(\d+)>$/);
  return m ? m[1] : /^\d{17,20}$/.test(token) ? token : null;
}

async function resolveUser(token: string, guild: Guild): Promise<User | null> {
  const id = extractId(token);
  if (!id) return null;
  return guild.client.users.fetch(id).catch(() => null);
}

async function resolveMember(token: string, guild: Guild): Promise<GuildMember | null> {
  const id = extractId(token);
  if (!id) return null;
  return guild.members.fetch(id).catch(() => null);
}

function resolveRole(token: string, guild: Guild): Role | null {
  const id = extractId(token);
  if (!id) return null;
  return guild.roles.cache.get(id) ?? null;
}

function resolveChannel(token: string, guild: Guild): BaseChannel | null {
  const id = extractId(token);
  if (!id) return null;
  return guild.channels.cache.get(id) ?? null;
}

// ─── FakeInteraction ─────────────────────────────────────────────────────────

class FakeInteraction {
  guild: Guild;
  user: User;
  member: GuildMember;
  channel: TextChannel;
  channelId: string;
  client: typeof this.guild.client;
  replied = false;
  deferred = false;
  private _replyMsg: Message | null = null;
  private _parsedArgs: Map<string, unknown>;
  private _subcommand: string | null;

  constructor(
    private _message: Message,
    parsedArgs: Map<string, unknown>,
    subcommand: string | null = null,
  ) {
    this.guild = _message.guild!;
    this.user = _message.author;
    this.member = _message.member as GuildMember;
    this.channel = _message.channel as TextChannel;
    this.channelId = _message.channelId;
    this.client = _message.client;
    this._parsedArgs = parsedArgs;
    this._subcommand = subcommand;
  }

  options = {
    getString: (name: string, _required?: boolean): string | null =>
      (this._parsedArgs.get(name) as string | undefined) ?? null,

    getInteger: (name: string, _required?: boolean): number | null =>
      (this._parsedArgs.get(name) as number | undefined) ?? null,

    getBoolean: (name: string, _required?: boolean): boolean | null =>
      (this._parsedArgs.get(name) as boolean | undefined) ?? null,

    getUser: (name: string, _required?: boolean): User | null =>
      (this._parsedArgs.get(name) as User | undefined) ?? null,

    getMember: (name: string, _required?: boolean): GuildMember | null =>
      (this._parsedArgs.get(name) as GuildMember | undefined) ?? null,

    getRole: (name: string, _required?: boolean): Role | null =>
      (this._parsedArgs.get(name) as Role | undefined) ?? null,

    getChannel: (name: string, _required?: boolean): BaseChannel | null =>
      (this._parsedArgs.get(name) as BaseChannel | undefined) ?? null,

    getSubcommand: (_required?: boolean): string => this._subcommand ?? "",
  };

  async reply(options: string | { content?: string; embeds?: EmbedBuilder[]; flags?: number }): Promise<void> {
    if (this.replied) return;
    this.replied = true;
    const payload = typeof options === "string"
      ? { content: options }
      : { content: options.content, embeds: options.embeds };
    this._replyMsg = await this._message.reply(payload as any).catch(() => null);
  }

  async deferReply(_options?: { flags?: number }): Promise<void> {
    this.deferred = true;
    this._replyMsg = await this._message.reply("⏳ جاري التنفيذ...").catch(() => null);
  }

  async editReply(options: string | { content?: string; embeds?: EmbedBuilder[] }): Promise<void> {
    const payload = typeof options === "string"
      ? { content: options, embeds: [] }
      : { content: options.content ?? "", embeds: options.embeds ?? [] };
    if (this._replyMsg) {
      await this._replyMsg.edit(payload as any).catch(() => {});
    } else {
      await this._message.reply(payload as any).catch(() => {});
    }
  }

  async followUp(options: string | { content?: string; embeds?: EmbedBuilder[]; flags?: number }): Promise<void> {
    const payload = typeof options === "string"
      ? { content: options }
      : { content: options.content, embeds: options.embeds };
    await this._message.reply(payload as any).catch(() => {});
  }
}

// ─── Main prefix handler ──────────────────────────────────────────────────────

export async function handlePrefixCommand(message: Message): Promise<void> {
  if (!message.guild || message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const rawContent = message.content.slice(PREFIX.length).trim();
  if (!rawContent) return;

  const firstTokens = tokenize(rawContent);
  if (!firstTokens.length) return;

  const cmdName = firstTokens[0].toLowerCase();
  const cmd = commandCollection.get(cmdName);
  if (!cmd) return;

  const schema = schemas[cmdName];
  if (!schema) {
    await message.reply({ content: `❌ الأمر \`${cmdName}\` غير مدعوم بالبريفكس بعد.` }).catch(() => {});
    return;
  }

  let tokens = firstTokens.slice(1);
  let subcommand: string | null = null;

  if (schema.subcommandArg) {
    if (!tokens.length) {
      await message.reply({ content: `❌ استخدام: \`${PREFIX}${cmdName} <subcommand> ...\`` }).catch(() => {});
      return;
    }
    subcommand = tokens[0].toLowerCase();
    tokens = tokens.slice(1);
  }

  const parsedArgs = new Map<string, unknown>();

  for (let i = 0; i < schema.args.length; i++) {
    const def = schema.args[i];

    if (def.rest) {
      const rest = tokens.slice(i).join(" ");
      if (def.required && !rest) {
        await message.reply({ content: `❌ ينقصك: \`${def.name}\`` }).catch(() => {});
        return;
      }
      if (rest) parsedArgs.set(def.name, rest);
      break;
    }

    const token = tokens[i];

    if (!token) {
      if (def.required) {
        await message.reply({ content: `❌ ينقصك: \`${def.name}\`` }).catch(() => {});
        return;
      }
      continue;
    }

    try {
      switch (def.type) {
        case "user": {
          const user = await resolveUser(token, message.guild);
          if (!user && def.required) { await message.reply({ content: `❌ ما قدرت أجد المستخدم: \`${token}\`` }).catch(() => {}); return; }
          if (user) parsedArgs.set(def.name, user);
          break;
        }
        case "member": {
          const member = await resolveMember(token, message.guild);
          if (!member && def.required) { await message.reply({ content: `❌ ما قدرت أجد العضو: \`${token}\`` }).catch(() => {}); return; }
          if (member) parsedArgs.set(def.name, member);
          break;
        }
        case "role": {
          const role = resolveRole(token, message.guild);
          if (!role && def.required) { await message.reply({ content: `❌ ما قدرت أجد الرول: \`${token}\`` }).catch(() => {}); return; }
          if (role) parsedArgs.set(def.name, role);
          break;
        }
        case "channel": {
          const channel = resolveChannel(token, message.guild);
          if (!channel && def.required) { await message.reply({ content: `❌ ما قدرت أجد القناة: \`${token}\`` }).catch(() => {}); return; }
          if (channel) parsedArgs.set(def.name, channel);
          break;
        }
        case "integer": {
          const n = parseInt(token, 10);
          if (isNaN(n) && def.required) { await message.reply({ content: `❌ \`${def.name}\` يجب أن يكون رقماً صحيحاً.` }).catch(() => {}); return; }
          if (!isNaN(n)) parsedArgs.set(def.name, n);
          break;
        }
        case "boolean": {
          const val = ["on", "true", "yes", "1"].includes(token.toLowerCase());
          parsedArgs.set(def.name, val);
          break;
        }
        default: {
          parsedArgs.set(def.name, token);
        }
      }
    } catch (err) {
      logger.warn({ err, def, token }, "Prefix arg parse error");
    }
  }

  try {
    const fakeInteraction = new FakeInteraction(message, parsedArgs, subcommand);
    await cmd.execute(fakeInteraction as any);
  } catch (err) {
    logger.error({ err, cmd: cmdName }, "Prefix command error");
    await message.reply({ content: "❌ حدث خطأ أثناء تنفيذ الأمر." }).catch(() => {});
  }
}
