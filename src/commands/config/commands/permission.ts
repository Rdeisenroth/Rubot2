import { SlashCommandPermission } from "./../../../models/slash_command_permission";
import { ApplicationCommandOptionType, Message, Role } from "discord.js";
import { Command } from "../../../../typings";
import { GuildModel } from "../../../models/guilds";

const command: Command = {
    name: "permission",
    description: "Permit or Unpermit a Mentionable Role or User",
    aliases: ["p"],
    cooldown: 3000,
    guildOnly: true,
    options: [
        {
            name: "original-name",
            description: "a command Name(original) or a category wrapped in [], or \\* for all available commands",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "roleoruser",
            description: "A mentionable role or user whose permission should be changed",
            type: ApplicationCommandOptionType.Mentionable,
            required: true,
        },
        {
            name: "can-execute",
            description: "If true the role or user can execute the given command",
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
        await interaction.deferReply();
        const g = interaction.guild!;

        const guildData = (await GuildModel.findById(g.id))!;

        const cmdName = interaction.options.getString("original-name", true);
        if (!client.commands.has(cmdName)) {
            return await client.utils.errors.errorMessage(interaction, `No Command named ${cmdName} is known.\nPlease use the **original** command name, not one after renaming.`);
        }
        const roleoruser = interaction.options.getMentionable("roleoruser", true);
        if (!("id" in roleoruser)) {
            return await client.utils.errors.errorMessage(interaction, "Please specify a valid mentionable");
        }
        const can_execute = interaction.options.getBoolean("can-execute", true);
        const commandSettings = await guildData.guild_settings.getOrCreateCommandByInternalName(cmdName);
        const permission = commandSettings.permissions.find(x => x.id === roleoruser.id);
        if (permission) {
            permission.permission = can_execute;
        } else {
            commandSettings.permissions.push({
                id: roleoruser.id,
                type: roleoruser instanceof Role ? 1 : 2,
                permission: can_execute,
            } as SlashCommandPermission);
        }
        await guildData.save();
        await guildData.postSlashCommands(client, g);
        return await client.utils.embeds.SimpleEmbed(interaction, { title: "Server Config", text: `Successfully updated Permissions for Command ${cmdName}` });
        // client.utils.embeds.SimpleEmbed(interaction, "TODO", `Command \`${path.relative(process.cwd(), __filename)}\` is not Implemented Yet.`);
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;