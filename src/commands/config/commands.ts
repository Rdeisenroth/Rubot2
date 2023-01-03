import ChannelType, { ApplicationCommandOptionData, ApplicationCommandOptionType, ApplicationCommandSubCommandData, ApplicationCommandSubGroupData, Collection, CommandInteraction, Message } from "discord.js";
import * as fs from "fs";
import { Command, SubcommandHandler } from "../../../typings";
import path from "path";

const command: SubcommandHandler = {
    name: "commands",
    description: "Commands Config Subcommand Handler",
    aliases: ["cmd"],
    category: "Administration",
    guildOnly: true,
    subcommands: new Collection(),
    options: [],
    defaultPermission: false,
    init: async (client) => {
        const commandFiles = fs.readdirSync(`${__dirname}/${command.name}`).filter(file => file.endsWith(".js") || file.endsWith("ts"));
        //iterate over all the commands to store them in a collection
        const scopts: ChannelType.ApplicationCommandOptionData[] = [];
        for (const file of commandFiles) {
            const c: Command = await import(`${__dirname}/${command.name}/${file}`);
            console.log(`\t\t∘${JSON.stringify(c.name)} (./${path.relative(process.cwd(), __dirname)}/${command.name}/${file})`);
            // Check Command Name
            if (c.name !== c.name.toLowerCase() || !c.name.match("^[\\w-]{1,32}$")) {
                throw new Error(`Invalid Command Name for ${c.name} at ./${path.relative(process.cwd(), __dirname)}/${command.name}/${file}: ${c.name}\nCommand Names must be all lowercase and must match ^[\\w-]{1,32}$`);
            }
            // Check Command Description
            if (c.description.length < 1 || c.description.length > 100) {
                throw new Error(`Invalid Command Description for ./${path.relative(process.cwd(), __dirname)}/${command.name}/${file}\nDescription Must be 1-100 Characters Long`);
            }
            if (c.options) {
                // Check Command Options
                for (const opt of c.options) {
                    if (opt.name !== opt.name.toLowerCase() || !opt.name.match("^[\\w-]{1,32}$")) {
                        throw new Error(`Invalid Option Name: ${opt.name} at ./${path.relative(process.cwd(), __dirname)}/${command.name}/${file}\nOption Names must be all lowercase and must match ^[\\w-]{1,32}$`);
                    }
                }
            }
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
            if (((c as SubcommandHandler).subcommands)) {
                scopts.push({ name: c.name, description: c.description, type: ApplicationCommandOptionType.SubcommandGroup, options: (c.options as ChannelType.ApplicationCommandSubCommandData[]) });
            } else {
                scopts.push({ name: c.name, description: c.description, type: ApplicationCommandOptionType.Subcommand, options: (c.options as Exclude<ApplicationCommandOptionData, ApplicationCommandSubGroupData | ApplicationCommandSubCommandData>[]) });
            }
        }
        command.options = scopts;
    },
    execute: async (client, interaction, args) => {
        let subcommand: string;
        if (interaction instanceof Message) {
            if (!args || !args[0]) {
                return await client.utils.embeds.SimpleEmbed(interaction!, "Usage", `\`${client.config.get("prefix") + command.name} < subcommand > [args]\`\nThe following subcommands are Available:\n${command.subcommands.map(command => "❯ " + command.name).join("\n")}`);
            }
            subcommand = args.shift()!.toLowerCase();
        } else if (interaction instanceof CommandInteraction) {
            const scInteraction = (interaction as CommandInteraction & { resolved_subcommand?: ChannelType.CommandInteractionOption });
            if (!scInteraction.resolved_subcommand) {
                scInteraction.resolved_subcommand = scInteraction.options.data[0];
            } else {
                scInteraction.resolved_subcommand = scInteraction.resolved_subcommand.options![0];
            }
            subcommand = scInteraction.resolved_subcommand.name;
        } else {
            return await client.utils.embeds.SimpleEmbed(interaction!, "Usage", `\`${client.config.get("prefix") + command.name} < subcommand > [args]\`\nThe following subcommands are Available:\n${command.subcommands.map(command => "❯ " + command.name).join("\n")}`);
        }
        const sc = command.subcommands.find(x => x.name == subcommand || (x.aliases != null && x.aliases.includes(subcommand)));
        if (!sc) {
            return await client.utils.embeds.SimpleEmbed(interaction!, "Invalid Subcommand", `\`${subcommand}\` is not a valid subcommand.\nThe following subcommands are Available:\n${command.subcommands.map(command => "❯ " + command.name).join("\n")}`);
        }
        sc.execute(client, interaction, args);
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;