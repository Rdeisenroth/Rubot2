import ChannelType, { EmojiIdentifierResolvable, MessageEmbed } from "discord.js";
import { OverwriteData } from "discord.js";
import { Command, RunCommand } from "../../typings";
import GuildSchema, { Guild } from "../models/guilds";
import { VoiceChannel, VoiceChannelDocument } from "../models/voice_channels";
import { VoiceChannelSpawner } from "../models/voice_channel_spawner";

const command: Command = {
    name: 'lockorunlock',
    description: 'locks or unlocks the current voice Channel',
    aliases: ['togglelocked', 'vctogglel', 'vctl', 'lou'],
    usage: '[channel resolvable]',
    cooldown: 5,
    category: "Miscellaneous",
    guildOnly: true,
    execute: async (client, message, args) => {
        //let owner = client.users.cache.find(m => m.id == client.ownerID);
        // if (message?.author.id !== client.ownerID as String) {
        //     return await message?.reply(`You do not have permission to execute this command.`);
        // }

        const g = message!.guild!;

        // Check if user is in VC
        const channel = message?.member?.voice.channel;
        if (!channel) {
            return await message!.reply(`You are currently not in a Voice Channel on this Server.`);
        }

        // Get Channel from DB
        const guildData = (await GuildSchema.findById(g.id));
        const channelData = guildData!.voice_channels.find(x => x._id == channel.id);

        if (!channelData?.temporary) {
            return await message!.reply(`The Voice Channel you are in is not a Temporary Voice Channel.`);
        }

        // Check if User has Permission to lock/Unlock Channel
        if (!(channelData.owner === message?.author.id || (channelData.supervisors && channelData.supervisors.includes(message!.author.id)))) {
            return await message!.reply(`You have no Permission to Lock/Unlock the current Voice Channel.`);
        }

        // get name for logging
        var cName = channel.name;

        // Channel Renaming got locked Down to 2 Renames every 10 Minutes, so we disable it (for now)

        // if (!channelData.locked) {
        //     cName = cName.substring("🔓".length);
        // }

        // Cange Locked State in DB
        channelData.set('locked', !channelData.locked);
        await guildData!.save();

        // Change permissions for everyone
        var overwrites: OverwriteData[] = channel.permissionOverwrites.array();
        if (channelData.locked) {
            overwrites.push({
                id: g.roles.everyone.id,
                deny: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK'],
            })
        } else {
            overwrites.push({
                id: g.roles.everyone.id,
                allow: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK'],
            })
        }
        await channel.overwritePermissions(overwrites);

        // // change channel name
        // var newName = cName;

        // if (!channelData.locked) {
        //     newName = "🔓" + cName;
        // }
        //await channel.setName(newName);

        await message?.reply(`Your Channel was ${channelData.locked ? "**locked**" : "**unlocked**"}.`);
    }
}

async function sleep(msec: number) {
    return new Promise(resolve => setTimeout(resolve, msec));
}

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;