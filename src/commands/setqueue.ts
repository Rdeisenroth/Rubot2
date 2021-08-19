import { GuildChannel, Message, MessageEmbed } from "discord.js";
import { Command, RunCommand } from "../../typings";
import GuildSchema, { Guild } from "../models/guilds";
import { VoiceChannel, VoiceChannelDocument } from "../models/voice_channels";
import mongoose, { ObjectId } from 'mongoose';

const command: Command = {
    name: 'setqueue',
    description: 'sets the given channel as join to create',
    aliases: ['setwaitingroom', 'swr', 'setwr', 'setqueue', 'sq'],
    usage: '[channel resolvable]',
    cooldown: 5,
    category: "Miscellaneous",
    options: [
        {
            name: "channel",
            description: "The Channel to be the Waiting Room",
            type: "CHANNEL",
            required: true,
        },
        {
            name: "queue",
            description: "A valid queue",
            type: "STRING",
            required: true,
        },
        {
            name: "supervisor",
            description: "A Supervisor Role",
            type: "ROLE",
            required: true,
        },
    ],
    guildOnly: true,
    defaultPermission: false,
    execute: async (client, interaction, args) => {
        if (!interaction) {
            return;
        }
        if (interaction instanceof Message) {
            client.utils.embeds.SimpleEmbed(interaction, 'Slash Only Command', 'This Command is Slash only but you Called it with The Prefix. use the slash Command instead.')
            return;
        }
        let owner = client.users.cache.find(m => m.id == client.ownerID);
        let member = client.utils.general.getMember(interaction);
        if (!member || member.id !== client.ownerID as String) {
            await interaction?.reply(`You do not have permission to execute this command.`);
            return;
        }

        const g = interaction!.guild!;

        // Find channel
        // const channel = g!.channels.cache.find(x => x.id == args[0]);
        const channel = interaction.options.getChannel('channel', true);
        if (!channel) {
            return await interaction.reply(`Channel could not be found.`);
        }
        if (!(channel instanceof GuildChannel)) {
            return await interaction.reply(`Channel is invalid.`);
        }
        const guildData = (await GuildSchema.findById(g.id))!;
        const waitingroom_channel: VoiceChannel & {_id:string} = {
            _id: channel.id,
            channel_type: 2,
            locked: false,
            managed: true,
            permitted: [],
            queue: new mongoose.Types.ObjectId(interaction.options.getString('queue', true)),
            supervisors: interaction.options.getRole('supervisor') ? [interaction.options.getRole('supervisor')!.id] : undefined,
        }
        guildData.voice_channels.push(waitingroom_channel);
        await guildData.save();
        await client.utils.embeds.SimpleEmbed(interaction, 'Queue System', `The Queue was Linked to this Channel.`);
    }
}

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;