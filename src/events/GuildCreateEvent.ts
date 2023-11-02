import { ExecuteEvent } from "../../typings";
import { GuildModel } from "../models/guilds";

export const name = "guildCreate";

export const execute: ExecuteEvent<"guildCreate"> = async (client, guild) => {
    await GuildModel.prepareGuild(client, guild);
};
