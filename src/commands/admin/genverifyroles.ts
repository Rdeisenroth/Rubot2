import { Message, Role } from "discord.js";
import { Command } from "../../../typings";
import "moment-duration-format";
import UserSchema, { User } from "../../models/users";
import GuildSchema from "../../models/guilds";
import { DBRole, DBRoleDocument, InternalRoles, RoleScopes } from "../../models/bot_roles";
import { Types } from "mongoose";



/**
 * The Command Definition
 */
const command: Command = {
    name: "genverifyroles",
    guildOnly: false,
    description: "Temp Command that fixes the Verify DB.",
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
        const roles = await interaction.guild.roles.fetch();
        const members = await interaction.guild.members.fetch();
        const dbGuild = (await GuildSchema.findOne({ _id: guild.id }))!;
        const verifiedRole = interaction.guild.roles.cache.find(x => x.name.toLowerCase() === "verified");
        let dbVerifyRole = dbGuild.guild_settings.roles?.find(x => x.internal_name === InternalRoles.VERIFIED);
        const orgaRole = interaction.guild.roles.cache.find(x => x.name.toLowerCase() === "orga");
        let dbOrgaRole = dbGuild.guild_settings.roles?.find(x => x.internal_name === InternalRoles.SERVER_ADMIN);
        const tutorRole = interaction.guild.roles.cache.find(x => x.name.toLowerCase() === "tutor");
        let dbTutorRole = dbGuild.guild_settings.roles?.find(x => x.internal_name === InternalRoles.TUTOR);

        // Create the roles if they don't exist
        for (const [r, dbr, irn] of ([[verifiedRole, dbVerifyRole, InternalRoles.VERIFIED], [orgaRole, dbOrgaRole, InternalRoles.SERVER_ADMIN], [tutorRole, dbTutorRole, InternalRoles.TUTOR]] as [Role, DBRoleDocument, InternalRoles][])) {
            if (!r) continue;
            if (!dbr) {
                console.log(`creating role ${irn}`);
                if (!dbGuild.guild_settings.roles) dbGuild.guild_settings.roles = new Types.DocumentArray<DBRoleDocument>([]);
                dbGuild.guild_settings.roles.push({
                    internal_name: irn,
                    role_id: r.id,
                    scope: RoleScopes.SERVER,
                    server_id: guild.id,
                    server_role_name: r.name,
                });
                await dbGuild.save();
                if(irn === InternalRoles.VERIFIED) {
                    dbVerifyRole = dbGuild.guild_settings.roles.find(x => x.role_id === r.id)!;
                } else if(irn === InternalRoles.SERVER_ADMIN) {
                    dbOrgaRole = dbGuild.guild_settings.roles.find(x => x.role_id === r.id)!;
                } else if(irn === InternalRoles.TUTOR) {
                    dbTutorRole = dbGuild.guild_settings.roles.find(x => x.role_id === r.id)!;
                }
            }
        }
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;