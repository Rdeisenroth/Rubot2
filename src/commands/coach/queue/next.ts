import ChannelType, { EmojiIdentifierResolvable, GuildMember, Message, MessageEmbed, StageChannel } from "discord.js";
import { OverwriteData } from "discord.js";
import path from "path";
import { Command, RunCommand } from "../../../../typings";
import GuildSchema, { Guild } from "../../../models/guilds";
import { VoiceChannel, VoiceChannelDocument } from "../../../models/voice_channels";
import { VoiceChannelSpawner } from "../../../models/voice_channel_spawner";

const command: Command = {
    name: 'next',
    description: 'Create A Private Room for coaching the first Person in the queue',
    aliases: ['n'],
    options: [{
        name: "amount",
        description: "The Amount of Entries to put into the Room",
        type: "INTEGER",
        required: false,
    }],
    guildOnly: true,
    execute: async (client, interaction, args) => {
        if (!interaction) {
            return;
        }
        if (interaction instanceof Message) {
            client.utils.embeds.SimpleEmbed(interaction, 'Slash Only Command', 'This Command is Slash only but you Called it with The Prefix. use the slash Command instead.');
            return;
        }

        const g = interaction.guild!;

        client.utils.embeds.SimpleEmbed(interaction, "TODO", `Command \`${path.relative(process.cwd(), __filename)}\` is not Implemented Yet.`)
    }
}

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;