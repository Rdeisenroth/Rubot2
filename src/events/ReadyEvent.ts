import { ClientEventListener, ExecuteEvent } from "../../typings";
import { Client, ClientEvents } from "discord.js";
import * as colors from "colors";
import GuildSchema, { Guild } from "../models/guilds";

export const execute: ExecuteEvent<"ready"> = async (client) => {
    // -- Setup Databases -- //

    // Guilds
    client.logger.info(`Processing Guilds`);
    for (const g of [...client.guilds.cache.values()]) {
        console.log(`Processing guild "${g.name}" (${g.id})`);
        // if (!(await GuildSchema.findOne({ _id: g.id }))){

        // }
        const updated = await GuildSchema.updateOne(
            { _id: g.id },
            {
                $set: {
                    _id: g.id,
                    name: g.name,
                    member_count: g.memberCount,
                }
            },
            { upsert: true, setDefaultsOnInsert: true }
        );
        if (updated.ok) {
            if (updated.upserted) {
                client.logger.info(`Joined new Guild: "${g.name}" (${g.id})`);
            }
            if (updated.nModified > 0) {
                client.logger.info(`Updated Guild: "${g.name}" (${g.id})`);
            }
        } else {
            client.logger.error(JSON.stringify(updated));
        }
        // Post slash Commands
        // TODO: Per Guild Slash Command Config
        // let res = client.api
    }

    await client.user?.setPresence({ status: 'online', activities: [{ name: 'The name is Bot, Rubot.', type: "PLAYING" }], afk: false });
    // Bot is ready
    client.logger.ready({
        message: `"${client.user?.username}" is Ready! (${(Date.now() - client.initTimestamp) / 1000}s)`,
        badge: true
    })
    console.log("-".repeat(26));
    console.log(`Bot Stats:`);
    console.log(`${client.users.cache.size} user(s)`);
    console.log(`${client.channels.cache.size} channel(s)`);
    console.log(`${client.guilds.cache.size} guild(s)`);
    console.log("=".repeat(26));
    return;
}

export const name = "ready";