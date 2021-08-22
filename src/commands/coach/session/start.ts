import ChannelType, { EmojiIdentifierResolvable, GuildMember, Message, MessageEmbed, StageChannel } from "discord.js";
import { OverwriteData } from "discord.js";
import path from "path";
import { Command, RunCommand } from "../../../../typings";
import GuildSchema, { Guild } from "../../../models/guilds";
import UserSchema, { User } from "../../../models/users";
import SessionSchema, { Session, sessionRole } from "../../../models/sessions";
import { VoiceChannelSpawner } from "../../../models/voice_channel_spawner";
import QueueSchema, { QueueDocument } from "../../../models/queues";

const command: Command = {
    name: 'start',
    description: 'starts the Coaching Session',
    aliases: ['s', 'begin', 'b'],
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
        if (await userEntry.hasActiveSessions()) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "You already Have an active Session.", empheral: true });
        }

        // for now we take the first queue
        // TODO: Queue Selector with Select Menu
        if (!guildData.queues || !guildData.queues.length) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Current Guild has no Coaching Support.", empheral: true });
        }
        let queue = (guildData.queues[0] as QueueDocument);
        // Create New Session
        let session = await SessionSchema.create({ active: true, user: user.id, guild: g.id, queue: queue._id, role: sessionRole.coach, started_at: Date.now(), end_certain: false, rooms: [] });
        userEntry.sessions.push(session._id);
        await userEntry.save();
        client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: `The Session was started.`, empheral: true });
    }
}

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;