import { ExecuteEvent } from "../../typings";
import { UserModel } from "../models/users";

export const name = "guildMemberRemove";

export const execute: ExecuteEvent<"guildMemberRemove"> = async (client, member) => {
    // Backup Server Roles
    let databaseUser = await UserModel.findById(member.id);
    if (!databaseUser) {
        databaseUser = new UserModel({ _id: member.id });
        await databaseUser.save();
    }
    databaseUser.server_roles.push(...member.roles.cache.keys());
    await databaseUser.save();
};
