import ChannelType, { Collection, EmojiIdentifierResolvable, MessageEmbed } from "discord.js";
import * as fs from "fs";
import { OverwriteData } from "discord.js";
import { Command, RunCommand, SubcommandHandler } from "../../typings";
import GuildSchema, { Guild } from "../models/guilds";
import { VoiceChannel, VoiceChannelDocument } from "../models/voice_channels";
import { VoiceChannelSpawner } from "../models/voice_channel_spawner";

var command: SubcommandHandler = {
    name: 'voice',
    description: 'voice Command Handler',
    aliases: ['v', 'vc'],
    cooldown: 1,
    category: "Miscellaneous",
    guildOnly: true,
    subcommands: new Collection(),
    init: async (client) => {
        const commandFiles = fs.readdirSync(`${__dirname}/${command.name}`).filter(file => file.endsWith('.js') || file.endsWith('ts'));
        //iterate over all the commands to store them in a collection
        for (const file of commandFiles) {
            const c: Command = await import(`${__dirname}/${command.name}/${file}`);
            console.log(`\t∘${JSON.stringify(c.name)} ($./commands/${command.name}/${file})`);
            // set a new item in the Collection
            // with the key as the command name and the value as the exported module
            command.subcommands.set(c.name, c);
            // Let The initialisation Code completely run before continuing
            if (c.init) {
                let initPromise = c.init(client);
                while (initPromise instanceof Promise) {
                    initPromise = await initPromise;
                }
            }
        }
    },
    execute: async (client, message, args) => {
        if (!args || !args[0]) {
            return await client.utils.embeds.SimpleEmbed(message!, "Usage", `\`${client.prefix + command.name} < subcommand > [args]\`\nThe following subcommands are Available:\n${command.subcommands.map(command => "❯ " + command.name).join("\n")}`);
        }
        const subcommand = args.shift()!.toLowerCase();
        let sc = command.subcommands.find(x => x.name == subcommand || (x.aliases != null && x.aliases.includes(subcommand)));
        if (!sc) {
            return await client.utils.embeds.SimpleEmbed(message!, `Invalid Subcommand`, `\`${subcommand}\` is not a valid subcommand.\nThe following subcommands are Available:\n${command.subcommands.map(command => "❯ " + command.name).join("\n")}`);
        }
        sc.execute(client, message, args);
    }
}

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;