import ChannelType, { EmojiIdentifierResolvable, GuildMember, Message, MessageEmbed, StageChannel } from "discord.js";
import { OverwriteData } from "discord.js";
import { Command, RunCommand } from "../../../typings";
import GuildSchema, { Guild } from "../../models/guilds";
import { VoiceChannel, VoiceChannelDocument } from "../../models/voice_channels";
import { VoiceChannelSpawner } from "../../models/voice_channel_spawner";

const command: Command = {
    name: 'kick',
    description: 'kicks a User to join and view the channel even if it\'s locked or hidden',
    aliases: ['k', 'rm', 'remove'],
    usage: '[channel resolvable]',
    cooldown: 5,
    options: [{
        name: "member",
        description: "The member to Kick",
        type: "USER",
        required: true,
    }],
    category: "Miscellaneous",
    guildOnly: true,
    execute: async (client, interaction, args) => {
        //let owner = client.users.cache.find(m => m.id == client.ownerID);
        // if (message?.author.id !== client.ownerID as String) {
        //     return await message?.reply(`You do not have permission to execute this command.`);
        // }

        if (!interaction) {
            return;
        }
        if (interaction instanceof Message) {
            client.utils.embeds.SimpleEmbed(interaction, 'Slash Only Command', 'This Command is Slash only but you Called it with The Prefix. use the slash Command instead.')
            return;
        }

        const g = interaction.guild!;

        // Check if user is in VC
        let channelOwner = client.utils.general.getMember(interaction);
        var channel = channelOwner?.voice.channel;
        if (!channelOwner || !channel) {
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
        if (!(channelData.owner === channelOwner.id || (channelData.supervisors && channelData.supervisors.includes(channelOwner.id)))) {
            return await client.utils.embeds.SimpleEmbed(interaction!, `Temporary Voice Channel System`, `You have no Permission to Kick a Member.`);
        }

        let kickMember = interaction.options.getMember("member", true);

        if (!(kickMember instanceof GuildMember)) {
            return await client.utils.embeds.SimpleEmbed(interaction!, `Temporary Voice Channel System`, `You have to specify a valid Member.`);
        }

        if (kickMember.voice.channelId !== channel.id) {
            return await client.utils.embeds.SimpleEmbed(interaction!, `Temporary Voice Channel System`, `The Member is not in your Voice Channel.`);
        }

        if (kickMember.id === channelData.owner) {
            return await client.utils.embeds.SimpleEmbed(interaction!, `Temporary Voice Channel System`, `You cannot kick the owner Of a Channel. Use \`transfer\` or \`close\` instead.`);
        }

        // Cange Permitted Users in DB
        if (channelData.permitted.includes(kickMember.id)) {
            channelData.permitted.splice(channelData.permitted.indexOf(kickMember.id), 1);
        }

        await guildData!.save();

        // Remove special Priviledges of the User
        await channel.permissionOverwrites.delete(kickMember.id);

        // Try to kick the user
        try {
            await kickMember.voice.setChannel(null);
            await client.utils.embeds.SimpleEmbed(interaction!, `Temporary Voice Channel System`, `${kickMember} was kicked from your channel.`);
        } catch (error) {
            await client.utils.errors.errorMessage(interaction!, `${kickMember} could not be kicked from the Voice Channel.`);
        }
    }
}

async function sleep(msec: number) {
    return new Promise(resolve => setTimeout(resolve, msec));
}

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;