import { OverwriteData } from "discord.js";
import { Command } from "../../../typings";
import { GuildModel } from "../../models/guilds";

const command: Command = {
    name: "togglelock",
    description: "locks or unlocks the current voice Channel",
    aliases: ["togglelocked", "lockorunlock", "togglel", "tl", "lou"],
    usage: "[channel resolvable]",
    cooldown: 5,
    category: "Miscellaneous",
    guildOnly: true,
    execute: async (client, interaction, args) => {
        //let owner = client.users.cache.find(m => m.id == client.config.get("ownerID"));
        // if (message?.author.id !== client.config.get("ownerID") as String) {
        //     return await message?.reply(`You do not have permission to execute this command.`);
        // }

        const g = interaction!.guild!;

        // Check if user is in VC
        const member = client.utils.general.getMember(interaction);
        const channel = member?.voice.channel;
        if (!member || !channel) {
            await client.utils.embeds.SimpleEmbed(interaction!, "Temporary Voice Channel System", "You are currently not in a Voice Channel on this Server.");
            return;
        }

        // Get Channel from DB
        const guildData = (await GuildModel.findById(g.id));
        const channelData = guildData!.voice_channels.find(x => x._id == channel!.id);

        if (!channelData?.temporary) {
            return await client.utils.embeds.SimpleEmbed(interaction!, "Temporary Voice Channel System", "The Voice Channel you are in is not a Temporary Voice Channel.");
        }

        // Check if User has Permission to lock/Unlock Channel
        if (!(channelData.owner === member.id || (channelData.supervisors && channelData.supervisors.includes(member.id)))) {
            return await client.utils.embeds.SimpleEmbed(interaction!, "Temporary Voice Channel System", "You have no Permission to Lock/Unlock the current Voice Channel.");
        }

        // get name for logging
        const cName = channel.name;

        // Channel Renaming got locked Down to 2 Renames every 10 Minutes, so we disable it (for now)

        // if (!channelData.locked) {
        //     cName = cName.substring("🔓".length);
        // }

        // Cange Locked State in DB
        channelData.set("locked", !channelData.locked);
        await guildData!.save();

        // Change permissions for everyone
        const overwrites: OverwriteData[] = [...channel.permissionOverwrites.cache.values()];
        if (channelData.locked) {
            overwrites.push({
                id: g.roles.everyone.id,
                deny: ["Connect", "Speak"],
            });
        } else {
            overwrites.push({
                id: g.roles.everyone.id,
                allow: ["ViewChannel", "Connect", "Speak"],
            });
        }
        await channel.permissionOverwrites.set(overwrites);

        // // change channel name
        // var newName = cName;

        // if (!channelData.locked) {
        //     newName = "🔓" + cName;
        // }
        //await channel.setName(newName);

        await client.utils.embeds.SimpleEmbed(interaction!, "Temporary Voice Channel System", `Your Channel was ${channelData.locked ? "**locked**" : "**unlocked**"}.`);
    },
};

async function sleep(msec: number) {
    return new Promise(resolve => setTimeout(resolve, msec));
}

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;