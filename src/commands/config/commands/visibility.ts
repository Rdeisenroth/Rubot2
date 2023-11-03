import { ApplicationCommandOptionType, Message } from "discord.js";
import { Command } from "../../../../typings";
import { GuildModel } from "../../../models/guilds";

const command: Command = {
    name: "visibility",
    description: "Disable a Slash Command for the current guild",
    aliases: ["d"],
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
            name: "visible",
            description: "Whether the command should be visible or disabled (will be invisible for EVERYONE on the Server)",
            type: ApplicationCommandOptionType.Boolean,
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

        const originalCommandName = interaction.options.getString("original-name", true).toLowerCase();
        const shouldBeVisible = interaction.options.getBoolean("visible", true);
        if (!client.commands.has(originalCommandName)) {
            return await client.utils.errors.errorMessage(interaction, `No Command named ${originalCommandName} is known.\nPlease use the **original** command name, not one after renaming.`);
        }

        if (originalCommandName === "config") {
            return await client.utils.errors.errorMessage(interaction, "The Config Command cannot be disabled.");
        }

        const commandSettings = await guildData.guild_settings.getOrCreateCommandByInternalName(originalCommandName);
        commandSettings.disabled = !shouldBeVisible;
        await guildData.save();
        await guildData.postSlashCommands(client, g);
        return await client.utils.embeds.SimpleEmbed(interaction, { title: "Server Config", text: `Successfully chabged visibility of command ${originalCommandName} to ${shouldBeVisible}` });
        // client.utils.embeds.SimpleEmbed(interaction, "TODO", `Command \`${path.relative(process.cwd(), __filename)}\` is not Implemented Yet.`);
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;