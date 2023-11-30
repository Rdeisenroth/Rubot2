import { Message, Role } from "discord.js";
import { Command } from "../../../typings";
import "moment-duration-format";
import { UserModel } from "../../models/users";
import { GuildModel } from "../../models/guilds";
import { DBRole } from "../../models/bot_roles";
import { Types } from "mongoose";
import { ArraySubDocumentType } from "@typegoose/typegoose";



/**
 * The Command Definition
 */
const command: Command = {
    name: "updateuserroles",
    guildOnly: false,
    description: "This command updates the db roles for all users based on their guild roles.",
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
        const members = await interaction.guild.members.fetch();
        const dbGuild = await GuildModel.findById(guild.id);
        if(!dbGuild) {
            return await client.utils.embeds.SimpleEmbed(interaction, "Adminstration", "Guild not found in Database.");
        }
        const dbRoles = dbGuild.guild_settings.roles;
        if (!dbRoles) {
            return await client.utils.embeds.SimpleEmbed(interaction, "Adminstration", "No Roles found in Database.");
        }
        const roles = new Map(await Promise.all(dbRoles.map(async (x) => [x, await interaction.guild?.roles.resolve(x.role_id!) ?? null] as [ArraySubDocumentType<DBRole>, Role | null])));
        const users = await UserModel.find({});

        let count = 0;
        let updatedCount = 0;
        for (const u of users) {
            console.log(`(${++count}/${users.length}) updating roles for user ${u.tu_id}`);
            for (const [dbr, r] of roles) {
                if (!r || !dbr) continue;
                if (members.get(u._id)?.roles.cache.has(r.id)) {
                    if (!u.token_roles) u.token_roles = new Types.Array();
                    if(!u.token_roles.find(x => dbr._id.equals(x._id))) {
                        console.log(`${u.tu_id} has new role ${dbr.internal_name}`);
                        u.token_roles.push(dbr);
                        updatedCount++;
                    }
                    await u.save();
                }
            }
        }

        await client.utils.embeds.SimpleEmbed(interaction, "Administration", `Done. Updated ${updatedCount} User-Roles in the DB.`);
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;