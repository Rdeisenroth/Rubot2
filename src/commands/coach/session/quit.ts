import ChannelType, { EmojiIdentifierResolvable, GuildMember, Message, MessageEmbed, StageChannel } from "discord.js";
import { OverwriteData } from "discord.js";
import path from "path";
import { Command, RunCommand } from "../../../../typings";
import GuildSchema, { Guild } from "../../../models/guilds";
import UserSchema, { User } from "../../../models/users";
import SessionSchema, { Session, sessionRole } from "../../../models/sessions";
import { VoiceChannel, VoiceChannelDocument } from "../../../models/voice_channels";
import { VoiceChannelSpawner } from "../../../models/voice_channel_spawner";
import moment from "moment";

const command: Command = {
    name: 'quit',
    description: 'closes the Coaching Session',
    aliases: ['q', 'exit', 'e', 'terminate'],
    usage: '[channel resolvable]',
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

        //TODO: Terminate Rooms

        // Set inactive
        coachingSession.active = false;
        coachingSession.ended_at = Date.now().toString();
        coachingSession.end_certain = true;
        await coachingSession.save();

        // Compute some Session Data

        client.utils.embeds.SimpleEmbed(interaction, {
            title: "Coaching System", text: `Your Session ended.
        \n\\> Total Time Spent: ${moment.duration((+coachingSession.ended_at!) - (+coachingSession.started_at)).format("d[d ]h[h ]m[m ]s.S[s]")}
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