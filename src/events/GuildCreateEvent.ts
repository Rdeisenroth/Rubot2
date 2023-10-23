import { ClientEventListener, ExecuteEvent } from "../../typings";
import { ApplicationCommandData, ApplicationCommandOptionChoiceData, Client, ClientEvents, Guild } from "discord.js";
import {GuildModel} from "../models/guilds";
import { inspect } from "util";

export const name = "guildCreate";

export const execute: ExecuteEvent<"guildCreate"> = async (client, guild) => {
    await GuildModel.prepareGuild(client, guild);
};
