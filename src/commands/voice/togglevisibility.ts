import ChannelType, { EmojiIdentifierResolvable, MessageEmbed, PermissionOverwrites } from "discord.js";
import { OverwriteData } from "discord.js";
import { Command, RunCommand } from "../../../typings";
import GuildSchema, { Guild } from "../../models/guilds";
import { VoiceChannel, VoiceChannelDocument } from "../../models/voice_channels";
import { VoiceChannelSpawner } from "../../models/voice_channel_spawner";

const command: Command = {
    name: 'togglevisibility',
    description: 'hides or unhides the current voice Channel',
    aliases: ['togglevis', 'tv', 'hideorunhide', 'hou', 'vis'],
    cooldown: 5,
    category: "Miscellaneous",
    guildOnly: true,
    execute: async (client, message, args) => {

        const g = message!.guild!;

        // Check if user is in VC
        const channel = message?.member?.voice.channel;
        if (!channel) {
            return await client.utils.embeds.SimpleEmbed(message!, `Temporary Voice Channel System`, `You are currently not in a Voice Channel on this Server.`);
        }

        // Get Channel from DB
        const guildData = (await GuildSchema.findById(g.id));
        const channelData = guildData!.voice_channels.find(x => x._id == channel.id);

        if (!channelData?.temporary) {
            return await client.utils.embeds.SimpleEmbed(message!, `Temporary Voice Channel System`, `The Voice Channel you are in is not a Temporary Voice Channel.`);
        }

        // Check if User has Permission to Hide/Unhide the Channel
        if (!(channelData.owner === message?.author.id || (channelData.supervisors && channelData.supervisors.includes(message!.author.id)))) {
            return await client.utils.embeds.SimpleEmbed(message!, `Temporary Voice Channel System`, `You have no Permission to Lock/Unlock the current Voice Channel.`);
        }

        // Check if Visible or invisible
        let overwrites = channel.permissionOverwrites.cache.get(g.roles.everyone.id);
        let hidden = false;
        if (overwrites && overwrites.deny?.has('VIEW_CHANNEL')) {
            hidden = true;
        }

        // Change permissions for everyone
        await channel.permissionOverwrites.edit(g.roles.everyone.id, { VIEW_CHANNEL: hidden });

        await client.utils.embeds.SimpleEmbed(message!, `Temporary Voice Channel System`, `Your Channel was ${hidden ? "**unhidden**" : "**hidden**"}.`);
    }
}

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;