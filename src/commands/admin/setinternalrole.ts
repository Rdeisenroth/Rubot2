import { Message, ApplicationCommandOptionType } from "discord.js";
import { Command } from "../../../typings";
import "moment-duration-format";
import { GuildModel } from "../../models/guilds";
import { InternalGuildRoles, InternalRoles, RoleScopes } from "../../models/bot_roles";
import { mongoose } from "@typegoose/typegoose";



/**
 * The Command Definition
 */
const command: Command = {
    name: "setinternalrole",
    guildOnly: false,
    description: "This command generates the database entries for the internal roles",
    options: [
        {
            name: "internal-role-name",
            description: "The Internal Role Name used for tracking",
            type: ApplicationCommandOptionType.String,
            choices: InternalGuildRoles.map(x => ({ name: Object.keys(InternalRoles).find(y => InternalRoles[y as keyof typeof InternalRoles] === x)!, value: x })),
            required: true,
        },
        {
            name: "guild-role",
            description: "The Guild Role to use for the Internal Role",
            type: ApplicationCommandOptionType.Role,
            required: true,
        },
    ],
    async execute(client, interaction, args) {
        if (!interaction || !interaction.guild) {
            return;
        }
        if (interaction instanceof Message) {
            client.utils.embeds.SimpleEmbed(interaction, "Slash Only Command", "This Command is Slash only but you Called it with The Prefix. use the slash Command instead.");
            return;
        }
        await interaction.deferReply();
        const guild = interaction.guild;
        const internalRoleName = interaction.options.getString("internal-role-name", true) as typeof InternalGuildRoles[number];
        const guildRole = interaction.options.getRole("guild-role", true);
        const dbGuild = await GuildModel.findById(guild.id);
        if(!dbGuild) {
            return await client.utils.embeds.SimpleEmbed(interaction, "Adminstration", "Guild not found in Database.");
        }
        let roles = dbGuild.guild_settings.roles;
        if (!roles) {
            dbGuild.guild_settings.roles = new mongoose.Types.DocumentArray([]);
            roles = dbGuild.guild_settings.roles;
        }
        const role = roles.find(x => x.internal_name === internalRoleName);
        if (role) {
            // Update
            role.role_id = guildRole.id;
            role.server_role_name = guildRole.name;
        } else {
            roles.push({
                internal_name: internalRoleName,
                role_id: guildRole.id,
                scope: RoleScopes.SERVER,
                server_id: guild.id,
                server_role_name: guildRole.name,
            });
        }

        await dbGuild.save();

        await client.utils.embeds.SimpleEmbed(
            interaction,
            "Adminstration",
            `Internal Role ${internalRoleName} set to <@&${guildRole.id}>. Note that orphans are not automatically removed.`,
        );
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;