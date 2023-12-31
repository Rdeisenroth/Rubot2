import { Client } from "discord.js";
// import {ReadyEvent} from "../events/ready";

const reqEvent = (event: string) => require(`../events/${event}`);

module.exports = (client: Client) => {
    // client.on("ready", () => { ReadyEvent.execute(client) });
    // client.on("reConnecting", () => reqEvent("reConnecting")(client))
    // client.on("disconnect", () => reqEvent("disconnect"))
    // client.on("warn", reqEvent("warn"))
    // client.on("error", reqEvent("error"))
    // client.on('voiceStateUpdate', (oldMember, newMember) => { reqEvent("voiceStateUpdate")(client, oldMember, newMember) })
    // client.on("guildCreate", (guild) => { reqEvent("guildCreate")(client, guild) })
    // client.on("messageDelete", (messageDelete) => { reqEvent("messageDelete")(client, messageDelete) })
    // client.on('message', (message) => { reqEvent('message')(client, con, message) });
    // client.on("guildMemberAdd", (member) => { reqEvent('guildmemberadd')(member) })
    // client.on("guildMemberRemove", (member) => { })
    // client.on('messageUpdate', (oldmessage, newmessage) => { })
    // client.on('serverRoleCreated', (Role) => { })
    // client.on('serveRoleDeleted', (Role) => { })
    // client.on('serverRoleUpdated', (oldRole, newRoles) => { })


};
