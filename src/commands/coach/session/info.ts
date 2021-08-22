import ChannelType, { EmojiIdentifierResolvable, GuildMember, Message, MessageEmbed, StageChannel } from "discord.js";
import { OverwriteData } from "discord.js";
import moment from "moment";
import path from "path";
import { Command, RunCommand } from "../../../../typings";
import GuildSchema, { Guild } from "../../../models/guilds";
import UserSchema, { User } from "../../../models/users";
import { VoiceChannel, VoiceChannelDocument } from "../../../models/voice_channels";
import { VoiceChannelSpawner } from "../../../models/voice_channel_spawner";

const command: Command = {
    name: 'info',
    description: 'displays Information about the current Coaching Session',
    aliases: ['i', 'details', 'd'],
    usage: '[channel resolvable]',
    cooldown: 3000,
    category: "Miscellaneous",
    guildOnly: true,
    execute: async (client, interaction, args) => {
        if (!interaction) {
            return;
        }
        if (interaction instanceof Message) {
            client.utils.embeds.SimpleEmbed(interaction, 'Slash Only Command', 'This Command is Slash only but you Called it with The Prefix. use the slash Command instead.')
            return;
        }

        const g = interaction.guild!;
        let guildData = (await GuildSchema.findById(g.id))!;

        let user = client.utils.general.getUser(interaction);
        let userEntry = await UserSchema.findOneAndUpdate({ _id: user.id }, { _id: user.id }, { new: true, upsert: true, setDefaultsOnInsert: true });
        // Check if User has Active Sessions
        let activeSessions = await userEntry.getActiveSessions();
        // We expect at most 1 active session per guild
        let coachingSession = activeSessions.find(x => x.guild && x.guild === g.id);
        if (!coachingSession) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "You Have no Active Coaching Session.", empheral: true });
        }

        client.utils.embeds.SimpleEmbed(interaction, {
            title: "Coaching System", text: `
        \\> Total Time Spent: ${moment.duration(Date.now() - (+coachingSession.started_at)).format("d[d ]h[h ]m[m ]s.S[s]")}
        \n\\> Channels visited: ${coachingSession.getRoomAmount()}
        \n\\> Participants: ${(await coachingSession.getParticipantAmount())}
        `, empheral: true
        })
    }
}

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;