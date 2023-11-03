import { ApplicationCommandOptionType, Message } from "discord.js";
import { Command } from "../../../../typings";
import { GuildModel } from "../../../models/guilds";

const command: Command = {
    name: "rename",
    description: "Rename a Slash Command for the current guild",
    aliases: ["broadcast"],
    cooldown: 3000,
    guildOnly: true,
    options: [
        {
            name: "original-name",
            description: "The Original Command Name (before any renaming)",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "new-name",
            description: "The New command Name",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    execute: async (client, interaction, args) => {
        if (!interaction) {
            return;
        }
        if (interaction instanceof Message) {
            client.utils.embeds.SimpleEmbed(interaction, "Slash Only Command", "This Command is Slash only but you Called it with The Prefix. use the slash Command instead.");
            return;
        }

        const g = interaction.guild!;

        const guildData = (await GuildModel.findById(g.id))!;

        const originalCommandName = interaction.options.getString("original-name", true);
        const newCommandName = interaction.options.getString("new-name", true);
        if (!client.commands.has(originalCommandName)) {
            return await client.utils.errors.errorMessage(interaction, `No Command named ${originalCommandName} is known.\nPlease use the **original** command name, not one after renaming.`);
        }
        const commandSettings = await guildData.guild_settings.getOrCreateCommandByInternalName(originalCommandName);
        commandSettings.name = newCommandName;
        await guildData.save();
        await guildData.postSlashCommands(client, g);
        return await client.utils.embeds.SimpleEmbed(interaction, { title: "Server Config", text: `Successfully renamed command ${originalCommandName} to ${newCommandName}` });
        // client.utils.embeds.SimpleEmbed(interaction, "TODO", `Command \`${path.relative(process.cwd(), __filename)}\` is not Implemented Yet.`);
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;