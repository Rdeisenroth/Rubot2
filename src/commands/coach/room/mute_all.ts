import ChannelType, { EmojiIdentifierResolvable, GuildMember, Message, MessageEmbed, StageChannel } from "discord.js";
import { OverwriteData } from "discord.js";
import { Command, RunCommand } from "../../../../typings";
import GuildSchema, { Guild } from "../../../models/guilds";
import { VoiceChannel, VoiceChannelDocument } from "../../../models/voice_channels";
import { VoiceChannelSpawner } from "../../../models/voice_channel_spawner";

const command: Command = {
    name: 'mute_all',
    description: 'Mutes all Users of the Room except for You and Supervisors',
    aliases: ['broadcast'],
    cooldown: 3000,
    guildOnly: true,
    options: [{
        name: "message",
        description: "The Message to brodcast",
        type: "STRING",
        required: true,
    }],
    execute: async (client, interaction, args) => {
        if (!interaction) {
            return;
        }
        if (interaction instanceof Message) {
            client.utils.embeds.SimpleEmbed(interaction, 'Slash Only Command', 'This Command is Slash only but you Called it with The Prefix. use the slash Command instead.')
            return;
        }

        const g = interaction.guild!;

        client.utils.embeds.SimpleEmbed(interaction, "TODO", "Command is not Implemented Yet.")
    }
}

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;