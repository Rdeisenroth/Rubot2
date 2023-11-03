import { ApplicationCommandOptionType, EmojiIdentifierResolvable, Message, EmbedBuilder } from "discord.js";
import yargsParser from "yargs-parser";
import { Command } from "../../typings";
import { GuildModel } from "../models/guilds";


const command: Command = {
    name: "help",
    description: "List all of my commands or info about a specific command.",
    aliases: ["commands"],
    usage: "[command name]",
    cooldown: 5,
    options: [{
        description: "Get Help of a Specific Command",
        name: "command",
        type: ApplicationCommandOptionType.String,
        required: false,
        // choices: {}
    }],
    category: "Miscellaneous",
    execute: async (client, interaction, args) => {
        const commands = client.commands;
        const prefix = client.config.get("prefix");
        let flags: yargsParser.Arguments;
        if (interaction instanceof Message) {
            flags = client.parser(args, { alias: { "showall": ["showinvis", "showinvisible", "all", "a"] }, boolean: ["showall"], default: { showall: false } });
        } else {
            const commandArg = interaction?.options.getString("command", command.options![0].required);
            flags = { "_": commandArg ? [commandArg] : [], $0: "help" };
        }
        const owner = client.users.cache.find(m => m.id == client.config.get("ownerID"));
        const embed = new EmbedBuilder();
        if (interaction!.guild) {
            embed.setColor(interaction!.guild.members.me!.roles.highest.color || 0x7289da);
            embed.setAuthor({ name: `${interaction!.guild.members.me!.displayName} Help`, iconURL: interaction!.guild.iconURL()! });
        } else {
            embed.setColor(0x7289da);
            embed.setAuthor({ name: `${client.user!.username} Help` });
        }
        if (client.user) {
            embed.setThumbnail(client.user.displayAvatarURL());
        }

        const guildData = await GuildModel.findById(interaction?.guildId ?? 0);
        const guildSettings = guildData?.guild_settings;

        /**
         * Default Categories //TODO: Use Database to enable per-server-categories
         */
        const categories: { [name: string]: { emoji?: EmojiIdentifierResolvable; importance: number; commands: Command[] } } = {
            "Bot Owner": { emoji: ":gear:", importance: Number.MAX_VALUE, commands: [] },
            "Administration": { emoji: ":gear:", importance: 9, commands: [] },
            "Moderation": { emoji: ":gear:", importance: 8, commands: [] },
            "Rocket League": { emoji: ":gear:", importance: 7, commands: [] },
            "Deprecated": { emoji: ":gear:", importance: 6, commands: [] },
            "Miscellaneous": { emoji: ":gear:", importance: -Number.MAX_VALUE, commands: [] },
        };

        /**
         * General Help
         */
        if (!flags._.length) {
            if (interaction!.guild) {
                embed.setDescription(`These are the available commands for ${interaction!.guild ? interaction!.guild.members.me!.displayName : client.user!.username}\n The bot prefix is: \`${prefix}\``);
            }
            // Populate Command Categories (we do this every time because commands can change at runtime)
            let commandCount = 0;
            commands.forEach((command) => {
                if ((command.invisible || guildSettings?.getCommandByInternalName(command.name)?.disabled) && !flags.showall) {
                    return;
                }
                commandCount++;
                const catName = command.category ? command.category : "Miscellaneous";
                if (!(catName in categories)) {
                    categories[catName] = { importance: 0, commands: [] };
                }
                categories[catName].commands.push(command);
            });

            for (const catName of Object.keys(categories).sort((x, y) => categories[y].importance - categories[x].importance)) {
                const cat = categories[catName];
                if (cat.commands.length > 0) {
                    embed.addFields({ name: `❯ ${`${catName}`} [${cat.commands.length}]:`, value: cat.commands.map(x => `\`${x.name}\``).join(", "), inline: false });
                }
            }
            embed.setFooter({ text: `${owner ? `© 2021 ${owner.tag} | ` : ""}Total Commands: ${commandCount}`, iconURL: owner?.displayAvatarURL() });
        }
        /**
         * Command Specific Help
         */
        else if (flags._.length == 1) {
            const cmdName = `${flags._[0]}`;
            const command = commands.get(cmdName) || commands.find(c => c.aliases! && c.aliases.includes(cmdName));
            if (!command) {
                await client.utils.errors.errorMessage(interaction!, `"${cmdName}"is not a valid command, ${client.utils.general.getUser(interaction)}!\nUse \`${prefix + name}\` to get a list of available Commands.`);
                return;
            }
            // textContent += `\nThe bot prefix is: \`${prefix}\``;
            embed.setDescription(`The bot prefix is: \`${prefix}\``);
            let commandtext = `• **Name:** ${command.name}`;
            if (command.category) commandtext += `\n• **Category:** ${command.category}`;
            if (command.aliases) commandtext += `\n• **Aliases:** ${command.aliases.join(", ")}`;
            if (command.description) commandtext += `\n• **Description:** ${command.description}`;
            if (command.usage) commandtext += `\n• **Usage:** ${prefix}${command.name} ${command.usage}`;
            if (command.cooldown) commandtext += `\n• **Cooldown:** ${command.cooldown || 0} second(s)`;
            embed.addFields({ name: `❯ ${command.name}-help:`, value: commandtext });
            if (owner) {
                embed.setFooter({ text: `© 2021 ${owner.tag}`, iconURL: owner.displayAvatarURL() });
            }
        } else {
            await client.utils.errors.errorMessage(interaction!, `Invalid argument Count: ${flags._.length}. Please do not put any arguments after the command name...`);
            return;
        }
        await interaction!.reply({ embeds: [embed] });
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;