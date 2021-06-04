import { ClientEventListener, ExecuteEvent } from "../../typings";
import { Client, ClientEvents } from "discord.js";
import * as colors from "colors";

export const execute: ExecuteEvent<"ready"> = async (client) => {
    client.user?.setPresence({ status: 'online', activity: { name: 'The name is Bot, Rubot.', type: "PLAYING" }, afk: false });
    // Bot is ready
    client.logger.ready({
        message: `"${client.user?.username}" is Ready!`,
        badge: true
    })
    console.log("-".repeat(26));
    console.log(`Bot Stats:`);
    console.log(`${client.users.cache.size} user(s)`);
    console.log(`${client.channels.cache.size} channel(s)`);
    console.log(`${client.guilds.cache.size} guild(s)`);
    console.log("=".repeat(26));
    return true;
}

export const name = "ready";