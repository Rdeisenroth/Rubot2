import { Message } from "discord.js";
import { Command } from "../../../typings";
import { GuildModel } from "../../models/guilds";

const command: Command = {
    name: "close",
    description: "closes the Temporary Channel and kicks all members",
    aliases: ["c", "terminate", "cancel"],
    usage: "[channel resolvable]",
    cooldown: 5,
    category: "Miscellaneous",
    guildOnly: true,
    execute: async (client, interaction, args) => {
        //let owner = client.users.cache.find(m => m.id == client.config.get("ownerID"));
        // if (message?.author.id !== client.config.get("ownerID") as String) {
        //     return await message?.reply(`You do not have permission to execute this command.`);
        // }

        if (!interaction) {
            return;
        }
        if (interaction instanceof Message) {
            client.utils.embeds.SimpleEmbed(interaction, "Slash Only Command", "This Command is Slash only but you Called it with The Prefix. use the slash Command instead.");
            return;
        }

        const g = interaction.guild!;

        // Check if user is in VC
        const channelOwner = client.utils.general.getMember(interaction);
        const channel = channelOwner?.voice.channel;
        if (!channelOwner || !channel) {
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
        if (!(channelData.owner === channelOwner.id || (channelData.supervisors && channelData.supervisors.includes(channelOwner.id)))) {
            return await client.utils.embeds.SimpleEmbed(interaction!, "Temporary Voice Channel System", "You have no Permission to Close the Channel.");
        }

        try {
            for(const m of [...channel.members.values()]) {
                m.voice.setChannel(null);
            }
        } catch (error) {
            await client.utils.errors.errorMessage(interaction!, "could not kick all Users from the Voice Channel.");
        }

        return await client.utils.embeds.SimpleEmbed(interaction!, "Temporary Voice Channel System", "All Users were Kicked, the Channel should Close automatically.");

        // // Remove special Priviledges of the User
        // if(!channel.deletable){
        //     await client.utils.errors.errorMessage(interaction!, `could not delete The Channel.`);
        // }
        
        // // Try to kick the user
        // try {
        //     await channel.delete();
        //     // remove DB entry
        //     const updated = await GuildModel.updateOne(
        //         { _id: g.id },
        //         {
        //             $pull: {
        //                 "voice_channels": { _id: channel.id }
        //             }
        //         },
        //         { upsert: true, setDefaultsOnInsert: true },
        //     );
        //     // console.log(updated);
        //     console.log(`closed TEMP VC: ${channel.name} on ${g.name}`);
        // } catch (error) {
        //     await client.utils.errors.errorMessage(interaction!, error);
        // }
    },
};

async function sleep(msec: number) {
    return new Promise(resolve => setTimeout(resolve, msec));
}

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;