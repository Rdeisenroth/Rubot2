import ChannelType, { EmojiIdentifierResolvable, Message, MessageEmbed, StageChannel } from "discord.js";
import { OverwriteData } from "discord.js";
import { Command, RunCommand } from "../../../typings";
import GuildSchema, { Guild } from "../../models/guilds";
import { VoiceChannel, VoiceChannelDocument } from "../../models/voice_channels";
import { VoiceChannelSpawner } from "../../models/voice_channel_spawner";

const command: Command = {
    name: 'lock',
    description: 'locks the current voice Channel',
    aliases: ['l', 'lck', 'lockchannel', 'lc'],
    usage: '[channel resolvable]',
    cooldown: 5,
    category: "Miscellaneous",
    guildOnly: true,
    execute: async (client, interaction, args) => {
        //let owner = client.users.cache.find(m => m.id == client.ownerID);
        // if (message?.author.id !== client.ownerID as String) {
        //     return await message?.reply(`You do not have permission to execute this command.`);
        // }

        const g = interaction!.guild!;

        // Check if user is in VC
        let member = client.utils.general.getMember(interaction);
        var channel = member?.voice.channel;
        if (!member || !channel) {
            await client.utils.embeds.SimpleEmbed(interaction!, `Temporary Voice Channel System`, `You are currently not in a Voice Channel on this Server.`);
            return;
        }

        // Get Channel from DB
        const guildData = (await GuildSchema.findById(g.id));
        const channelData = (guildData!.voice_channels as VoiceChannelDocument[]).find(x => x._id == channel!.id);

        if (!channelData?.temporary) {
            return await client.utils.embeds.SimpleEmbed(interaction!, `Temporary Voice Channel System`, `The Voice Channel you are in is not a Temporary Voice Channel.`);
        }

        // Check if User has Permission to lock/Unlock Channel
        if (!(channelData.owner === member.id || (channelData.supervisors && channelData.supervisors.includes(member.id)))) {
            return await client.utils.embeds.SimpleEmbed(interaction!, `Temporary Voice Channel System`, `You have no Permission to Lock the current Voice Channel.`);
        }

        if (channelData.locked) {
            return await client.utils.embeds.SimpleEmbed(interaction!, `Error`, `The Channel is already locked.`);
        }

        // get name for logging
        var cName = channel.name;

        // Channel Renaming got locked Down to 2 Renames every 10 Minutes, so we disable it (for now)

        // if (!channelData.locked) {
        //     cName = cName.substring("🔓".length);
        // }

        // Cange Locked State in DB
        channelData.set('locked', true);
        await guildData!.save();

        // Change permissions for everyone
        var overwrites: OverwriteData[] = [...channel.permissionOverwrites.cache.values()];
        overwrites.push({
            id: g.roles.everyone.id,
            deny: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK'],
        })
        await channel.permissionOverwrites.set(overwrites);

        await client.utils.embeds.SimpleEmbed(interaction!, `Temporary Voice Channel System`, `Your Channel was **locked**.`);
    }
}

async function sleep(msec: number) {
    return new Promise(resolve => setTimeout(resolve, msec));
}

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;