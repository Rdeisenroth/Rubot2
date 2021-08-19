import ChannelType, { EmojiIdentifierResolvable, GuildMember, Message, MessageEmbed, StageChannel } from "discord.js";
import { OverwriteData } from "discord.js";
import { Command, RunCommand } from "../../../typings";
import GuildSchema, { Guild } from "../../models/guilds";
import { VoiceChannel, VoiceChannelDocument } from "../../models/voice_channels";
import { VoiceChannelSpawner } from "../../models/voice_channel_spawner";

const command: Command = {
    name: 'transfer',
    description: 'transfers Ownership of the Channel to another Member',
    aliases: ['t', 'tf'],
    usage: '[channel resolvable]',
    cooldown: 5,
    options: [{
        name: "member",
        description: "The new Owner",
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
            return await client.utils.embeds.SimpleEmbed(interaction!, `Temporary Voice Channel System`, `You have no Permission to transfer the Ownership.`);
        }

        let newOwner = interaction.options.getMember("member", true);

        if (!(newOwner instanceof GuildMember)) {
            return await client.utils.embeds.SimpleEmbed(interaction!, `Temporary Voice Channel System`, `You have to specify a valid Member.`);
        }

        if (newOwner.id === channelData.owner) {
            return await client.utils.embeds.SimpleEmbed(interaction!, `Temporary Voice Channel System`, `Task Failed sucessfully. No, like seriously why would you transfer it to the same person? :thinking:`);
        }

        // Cange Permitted Users in DB
        if (channelData.permitted.includes(newOwner.id)) {
            channelData.permitted.splice(channelData.permitted.indexOf(newOwner.id), 1);
        }
        if (!channelData.permitted.includes(channelData.owner!)) {
            channelData.permitted.push(channelData.owner!);
        }
        let oldOwnerID = channelData.owner!;
        channelData.set("owner", newOwner.id);
        await guildData!.save();

        // Ensure both new and Old owner are permitted
        await channel.permissionOverwrites.edit(oldOwnerID, { "VIEW_CHANNEL": true, "CONNECT": true, "SPEAK": true });
        await channel.permissionOverwrites.edit(newOwner.id, { "VIEW_CHANNEL": true, "CONNECT": true, "SPEAK": true });

        await client.utils.embeds.SimpleEmbed(interaction!, `Temporary Voice Channel System`, `The ownershif of **${channel.name}** was transfered to ${newOwner}. The Old owner is still Permitted to join.`);
    }
}

async function sleep(msec: number) {
    return new Promise(resolve => setTimeout(resolve, msec));
}

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;