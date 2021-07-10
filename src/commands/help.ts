import { EmojiIdentifierResolvable, MessageEmbed } from "discord.js";
import { Command, RunCommand } from "../../typings";

 
const command: Command = {
    name: 'help',
    description: 'List all of my commands or info about a specific command.',
    aliases: ['commands'],
    usage: '[command name]',
    cooldown: 5,
    category: "Miscellaneous",
    execute: async (client, message, args) => {
        const commands = client.commands;
        const prefix = client.prefix;
        const flags = client.parser(args, { alias: { "showall": ["showinvis", "showinvisible", "all", "a"] }, boolean: ["showall"], default: { showall: false } });
        let owner = client.users.cache.find(m => m.id == client.ownerID);
        let embed = new MessageEmbed();
        if (message!.guild) {
            embed.setColor(message!.guild.me!.roles.highest.color || 0x7289da)
            embed.setAuthor(`${message!.guild.me!.displayName} Help`, message!.guild.iconURL()!);
        } else {
            embed.setColor(0x7289da)
            embed.setAuthor(`${client.user!.username} Help`)
        }
        if (client.user) {
            embed.setThumbnail(client.user.displayAvatarURL());
        }

        /**
         * Default Categories //TODO: Use Database to enable per-server-categories
         */
        const categories: { [name: string]: { emoji?: EmojiIdentifierResolvable; importance: number; commands: Command[] } } = {
            'Bot Owner': { emoji: ':gear:', importance: Number.MAX_VALUE, commands: [] },
            'Administration': { emoji: ':gear:', importance: 9, commands: [] },
            'Moderation': { emoji: ':gear:', importance: 8, commands: [] },
            'Rocket League': { emoji: ':gear:', importance: 7, commands: [] },
            'Deprecated': { emoji: ':gear:', importance: 6, commands: [] },
            'Miscellaneous': { emoji: ':gear:', importance: -Number.MAX_VALUE, commands: [] },
        }

        /**
         * General Help
         */
        if (!flags._.length) {
            // Populate Command Categories (we do this every time because commands can change at runtime)
            var commandCount = 0;
            commands.forEach((command) => {
                if (command.invisible == !(flags.showall as boolean)) {
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
                    embed.addField(`❯ ${`${catName}`} [${cat.commands.length}]:`, cat.commands.map(x => `\`${x.name}\``).join(', '));
                }
            }

            if (message!.guild) {
                embed.setDescription(`These are the available commands for ${message!.guild ? message!.guild.me!.displayName : client.user!.username}\n The bot prefix is: \`${prefix}\``);
            }

            embed.setFooter(`${owner ? `© 2021 ${owner.tag} | ` : ""}Total Commands: ${commandCount}`, owner?.displayAvatarURL());
        }
        /**
         * Command Specific Help
         */
        else if (flags._.length == 1) {
            const cmdName = flags._[0];
            const command = commands.get(cmdName) || commands.find(c => c.aliases! && c.aliases.includes(cmdName));
            if (owner) {
                embed.setFooter(`© 2021 ${owner.tag}`, owner.displayAvatarURL());
            }
            if (!command) {
                await client.utils.errors.errorMessage(message!, `"${cmdName}"is not a valid command, ${message!.author}!\nUse \`${prefix + name}\` to get a list of available Commands.`);
                return;
            }
            embed.setDescription(`The bot prefix is: \`${prefix}\``);
            var commandtext = `• **Name:** ${command.name}`;
            if (command.category) commandtext += `\n• **Category:** ${command.category}`
            if (command.aliases) commandtext += `\n• **Aliases:** ${command.aliases.join(', ')}`
            if (command.description) commandtext += `\n• **Description:** ${command.description}`
            if (command.usage) commandtext += `\n• **Usage:** ${prefix}${command.name} ${command.usage}`
            if (command.cooldown) commandtext += `\n• **Cooldown:** ${command.cooldown || 0} second(s)`
            embed.addField(`❯ ${command.name}-help:`, commandtext);
        } else {
            await client.utils.errors.errorMessage(message!, `Invalid argument Count: ${flags._.length}. Please do not put any arguments after the command name...`);
            return;
        }
        await message!.channel.send(embed);
    }
}

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;