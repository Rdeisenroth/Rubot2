import { Command } from "../../../typings";
import { GuildModel } from "../../models/guilds";

const command: Command = {
    name: "lock",
    description: "locks the current voice Channel",
    aliases: ["l", "lck", "lockchannel", "lc"],
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
        const channelData = (guildData!.voice_channels).find(x => x._id == channel!.id);

        if (!channelData?.temporary) {
            return await client.utils.embeds.SimpleEmbed(interaction!, "Temporary Voice Channel System", "The Voice Channel you are in is not a Temporary Voice Channel.");
        }

        // Check if User has Permission to lock/Unlock Channel
        if (!(channelData.owner === member.id || (channelData.supervisors && channelData.supervisors.includes(member.id)))) {
            return await client.utils.embeds.SimpleEmbed(interaction!, "Temporary Voice Channel System", "You have no Permission to Lock the current Voice Channel.");
        }

        if (channelData.locked) {
            return await client.utils.embeds.SimpleEmbed(interaction!, "Error", "The Channel is already locked.");
        }

        // get name for logging
        const cName = channel.name;

        // Channel Renaming got locked Down to 2 Renames every 10 Minutes, so we disable it (for now)

        // if (!channelData.locked) {
        //     cName = cName.substring("🔓".length);
        // }

        // Cange Locked State in DB
        channelData.set("locked", true);
        await guildData!.save();
        
        await channel.permissionOverwrites.edit(g.roles.everyone.id, { "Connect": false, "Speak": false });

        await client.utils.embeds.SimpleEmbed(interaction!, "Temporary Voice Channel System", "Your Channel was **locked**.");
    },
};

async function sleep(msec: number) {
    return new Promise(resolve => setTimeout(resolve, msec));
}

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;