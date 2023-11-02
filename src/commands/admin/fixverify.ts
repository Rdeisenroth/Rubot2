import { Message, Role } from "discord.js";
import { Command } from "../../../typings";
import "moment-duration-format";
import { UserModel } from "../../models/users";
import { GuildModel } from "../../models/guilds";
import { DBRole, InternalRoles, RoleScopes } from "../../models/bot_roles";
import { Types } from "mongoose";
import { DocumentType } from "@typegoose/typegoose";



/**
 * The Command Definition
 */
const command: Command = {
    name: "fixverify",
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
        const dbGuild = (await GuildModel.findOne({ _id: guild.id }))!;
        const verifiedRole = interaction.guild.roles.cache.find(x => x.name.toLowerCase() === "verified");
        let dbVerifyRole = dbGuild.guild_settings.roles?.find(x => x.internal_name === InternalRoles.VERIFIED);
        const orgaRole = interaction.guild.roles.cache.find(x => x.name.toLowerCase() === "orga");
        let dbOrgaRole = dbGuild.guild_settings.roles?.find(x => x.internal_name === InternalRoles.SERVER_ADMIN);
        const tutorRole = interaction.guild.roles.cache.find(x => x.name.toLowerCase() === "tutor");
        let dbTutorRole = dbGuild.guild_settings.roles?.find(x => x.internal_name === InternalRoles.TUTOR);

        // Create the roles if they don't exist
        for (const [r, dbr, irn] of ([[verifiedRole, dbVerifyRole, InternalRoles.VERIFIED], [orgaRole, dbOrgaRole, InternalRoles.SERVER_ADMIN], [tutorRole, dbTutorRole, InternalRoles.TUTOR]] as [Role, DocumentType<DBRole>, InternalRoles][])) {
            if (!r) continue;
            if (!dbr) {
                console.log(`creating role ${irn}`);
                if (!dbGuild.guild_settings.roles) dbGuild.guild_settings.roles = new Types.DocumentArray([]);
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

        const users = await UserModel.find({});
        let count = 0;
        for (const u of users) {
            console.log(`(${++count}/${users.length}) updating roles for user ${u.tu_id}`);
            for (const [r, dbr, irn] of ([[verifiedRole, dbVerifyRole, InternalRoles.VERIFIED], [orgaRole, dbOrgaRole, InternalRoles.SERVER_ADMIN], [tutorRole, dbTutorRole, InternalRoles.TUTOR]] as [Role, DocumentType<DBRole>, InternalRoles][])) {
                if (!r || !dbr) continue;
                if (members.get(u._id)?.roles.cache.has(r.id)) {
                    console.log(`${u.tu_id} has role ${irn}`);
                    if (!u.token_roles) u.token_roles = new Types.Array();
                    u.token_roles.push(dbr);
                    await u.save();
                }
            }
        }

        await client.utils.embeds.SimpleEmbed(interaction, "Fix Verify", "Done");

    // await client.utils.embeds.SimpleEmbed(interaction, {
    //     title: "Server Stats",
    //     text: "Server Information",
    //     empheral: false,
    //     fields: [
    //         { name: "❯ Members: ", value: `${interaction.guild.memberCount}`, inline: true },
    //         { name: "❯ Verified Members: ", value: `${verifiedRole?.members.size ?? 0}`, inline: true },
    //         { name: "❯ Unverified Members: ", value: `${interaction.guild.memberCount - (verifiedRole?.members.size ?? 0)}`, inline: true },
    //         { name: "❯ Channels: ", value: `${interaction.guild.channels.cache.size}`, inline: true },
    //         { name: "❯ Owner: ", value: `<@${interaction.guild.ownerId}>`, inline: true },
    //         { name: "❯ Created at: ", value: `<t:${Math.round(interaction.guild.createdAt.getTime() / 1000)}:f>`, inline: true },
    //     ],
    //     image: "attachment://graph.png",
    //     files: [
    //         attachment,
    //     ],
    // });
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;