import { ClientEventListener, ExecuteEvent } from "../../typings";
import { ApplicationCommandData, ApplicationCommandOptionChoiceData, Client, ClientEvents, Guild } from "discord.js";
import GuildSchema from "../models/guilds";
import UserSchema from "../models/users";
import { inspect } from "util";

export const name = "guildMemberRemove";

export const execute: ExecuteEvent<"guildMemberRemove"> = async (client, member) => {
    // Backup Server Roles
    let databaseUser = await UserSchema.findById(member.id);
    if (!databaseUser) {
        databaseUser = new UserSchema({ _id: member.id });
        await databaseUser.save();
    }
    databaseUser.server_roles.push(...member.roles.cache.keys());
    await databaseUser.save();
};
