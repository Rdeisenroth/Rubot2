import ChannelType, { Collection, CommandInteraction, EmojiIdentifierResolvable, Message, MessageEmbed } from "discord.js";
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
    // options: [{
    //     name: 'voice',
    //     description: 'The Subcommand to execute',
    //     type: "BOOLEAN",
    //     // required: true,
    //     // options: scopts,
    //     // options: [{
    //     //     name: 'test',
    //     //     description: "test",
    //     //     type: "SUB_COMMAND"
    //     // }],
    // }],
    options: [],
    init: async (client) => {
        const commandFiles = fs.readdirSync(`${__dirname}/${command.name}`).filter(file => file.endsWith('.js') || file.endsWith('ts'));
        //iterate over all the commands to store them in a collection
        let scopts: ChannelType.ApplicationCommandOptionData[] = []
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
            scopts.push({ name: c.name, description: c.description, type: (((c as SubcommandHandler).subcommands) ? "SUB_COMMAND_GROUP" : "SUB_COMMAND"), options: c.options });
        }
        command.options = scopts;
    },
    execute: async (client, interaction, args) => {
        let subcommand:string;
        if(interaction instanceof Message){
            if (!args || !args[0]) {
                return await client.utils.embeds.SimpleEmbed(interaction!, "Usage", `\`${client.prefix + command.name} < subcommand > [args]\`\nThe following subcommands are Available:\n${command.subcommands.map(command => "❯ " + command.name).join("\n")}`);
            }
            subcommand = args.shift()!.toLowerCase();
        } else if(interaction instanceof CommandInteraction){
            subcommand = interaction.options.getSubcommand(true);
        } else {
            return await client.utils.embeds.SimpleEmbed(interaction!, "Usage", `\`${client.prefix + command.name} < subcommand > [args]\`\nThe following subcommands are Available:\n${command.subcommands.map(command => "❯ " + command.name).join("\n")}`);
        }
        let sc = command.subcommands.find(x => x.name == subcommand || (x.aliases != null && x.aliases.includes(subcommand)));
        if (!sc) {
            return await client.utils.embeds.SimpleEmbed(interaction!, `Invalid Subcommand`, `\`${subcommand}\` is not a valid subcommand.\nThe following subcommands are Available:\n${command.subcommands.map(command => "❯ " + command.name).join("\n")}`);
        }
        sc.execute(client, interaction, args);
    }
}

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;