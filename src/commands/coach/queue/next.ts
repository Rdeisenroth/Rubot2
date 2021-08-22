import ChannelType, { EmojiIdentifierResolvable, GuildMember, Message, MessageEmbed, StageChannel } from "discord.js";
import { OverwriteData } from "discord.js";
import moment from "moment";
import path from "path";
import { Command, RunCommand } from "../../../../typings";
import GuildSchema, { Guild } from "../../../models/guilds";
import { QueueDocument } from "../../../models/queues";
import UserSchema, { User } from "../../../models/users";
import RoomSchema, { Room } from "../../../models/rooms";
import { VoiceChannel, VoiceChannelDocument } from "../../../models/voice_channels";
import { VoiceChannelSpawner } from "../../../models/voice_channel_spawner";

const command: Command = {
    name: 'next',
    description: 'Create A Private Room for coaching the first Person in the queue, or marks you as ready if noone is in the queue',
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
        if (!coachingSession.queue) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "There is no Queue Linked to your Session.", empheral: true });
        }

        let queue = coachingSession.queue;
        let queueData = await (guildData.queues as QueueDocument[]).find(x => x._id === queue);
        if (!queueData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Queue Could not be Found.", empheral: true });
        }
        let entries = queueData.getSortedEntries(interaction.options.getInteger("amount") ?? 1);

        // Notify Match(es)
        for (let e of entries) {
            try {
                let user = await client.users.fetch(e.discord_id);
                client.utils.embeds.SimpleEmbed((await user.createDM()), "Coaching system", "Your Match was Found.");
            } catch (error) {
                return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System Error", text: error, empheral: true });
            }
        }

        let spawner = queueData.room_spawner;
        let queue_channel_data = guildData.voice_channels.find(x => x.queue && x.queue === queue);
        let queue_channel = g.channels.cache.get(queue_channel_data?._id ?? "");
        let member = client.utils.general.getMember(interaction)!;
        if (!spawner) {
            spawner = {
                owner: user.id,
                supervisor_roles: [], // TODO
                permission_overwrites: [{ id: interaction!.guild!.me!.id, allow: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK', 'MOVE_MEMBERS', "MANAGE_CHANNELS"] }],
                max_users: 5,
                parent: queue_channel?.parentId ?? undefined,
                lock_initially: true,
                name: `${member.displayName}'s ${queueData.name} Room ${coachingSession.getRoomAmount() + 1}`
            } as VoiceChannelSpawner;
        }

        let room: ChannelType.VoiceChannel
        try {
            room = await client.utils.voice.createTempVC(member, spawner);
        } catch (error) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Channel could not be created.", empheral: true });
        }

        let roomData = await RoomSchema.create({ _id: room.id, active: true, tampered: false, end_certain: false, guild: g.id, events: [] });


        // client.utils.embeds.SimpleEmbed(interaction, {
        //     title: "Coaching System", text: `
        // \\> Total Time Spent: ${moment.duration(Date.now() - (+coachingSession.started_at)).format("d[d ]h[h ]m[m ]s.S[s]")}
        // \n\\> Channels visited: ${coachingSession.getRoomAmount()}
        // \n\\> Participants: ${(await coachingSession.getParticipantAmount())}
        // `, empheral: true
        // })

        // client.utils.embeds.SimpleEmbed(interaction, "TODO", `Command \`${path.relative(process.cwd(), __filename)}\` is not Implemented Yet.`)
    }
}

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;