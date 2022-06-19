import { ClientEventListener, ExecuteEvent, StringReplacements } from "../../typings";
import { ApplicationCommandData, ApplicationCommandOptionChoiceData, Client, ClientEvents, Guild } from "discord.js";
import GuildSchema from "../models/guilds";
import UserSchema from "../models/users";
import { inspect } from "util";

export const name = "guildMemberAdd";

export const execute: ExecuteEvent<"guildMemberAdd"> = async (client, member) => {
    const guild = member.guild;
    const guildData = await GuildSchema.findById(guild.id);
    // Create User Entry
    let databaseUser = await UserSchema.findById(member.id);
    if (!databaseUser) {
        databaseUser = new UserSchema({ _id: member.id });
        await databaseUser.save();
    }
    // Give Roles
    const guildRoles = databaseUser.server_roles.toObject<string[]>().flatMap(x => {
        const role = member.guild.roles.resolve(x);
        if (role) {
            return [role];
        } else {
            return [];
        }
    });
    // try {
    //     await member.roles.add(guildRoles);
    //     console.log(`Updated Roles for Member ${member.displayName}`);
    // } catch (error) {
    //     console.error(`Could not restore Roles for Member ${member.displayName}:\n${error}`);
    // }
    await databaseUser.save();
    // Send Welcome Message
    if (guildData?.welcome_text) {
        try {
            const replacements: StringReplacements = {
                "guild_name": guild.name,
                "member": member,
                "member_count": guild.memberCount,
                "guild_owner": await guild.fetchOwner(),
            };
            const title = client.utils.general.interpolateString(guildData.welcome_title ?? "Welcome to ${name}", replacements);
            const text = client.utils.general.interpolateString(guildData.welcome_text, replacements);
            const dm = await member.createDM();
            await client.utils.embeds.SimpleEmbed(dm, title, text);
        } catch (error) {
            console.error(`Could not Send Welcome Message to Member ${member.displayName}:\n${error}`);
        }
    }
};
