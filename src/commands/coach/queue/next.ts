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
import { QueueEntryDocument } from "../../../models/queue_entry";

const command: Command = {
    name: 'next',
    description: 'Accept X Persions from The Queue',
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
        try {
            await interaction.deferReply({ ephemeral: true });
        } catch (error) {
            return console.log(error);
        }

        const g = interaction.guild!;
        let guildData = (await GuildSchema.findById(g.id));
        if (!guildData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Guild Data Could not be found.", empheral: true });
        }

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
        let queueData = guildData.queues.id(queue);
        if (!queueData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Queue Could not be Found.", empheral: true });
        }
        if (queueData.isEmpty()) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "The Queue is Empty", empheral: true });
        }
        let entries = queueData.getSortedEntries(interaction.options.getInteger("amount") ?? 1);

        if (entries.length < (interaction.options.getInteger("amount") ?? 1)) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System Error", text: `There are less participants in the queue than requested.\n\\> Requested: ${interaction.options.getInteger("amount") ?? 1}\n\\> Available: ${entries.length}`, empheral: true });
        }

        // Get Room Spawner

        let spawner:VoiceChannelSpawner | undefined = queueData.room_spawner;
        let queue_channel_data = guildData.voice_channels.find(x => x.queue && x.queue == queue);
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
            console.log(spawner.parent);
            // queueData.set("room_spawner", spawner);
            // await guildData.save();
        }

        // Spawn Room

        let room: ChannelType.VoiceChannel
        try {
            room = await client.utils.voice.createTempVC(member, spawner);
        } catch (error) {
            console.log(error);
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Channel could not be created.", empheral: true });
        }

        let roomData = await RoomSchema.create({ _id: room.id, active: true, tampered: false, end_certain: false, guild: g.id, events: [] });
        // Update Coach Session
        coachingSession.rooms.push(roomData._id);
        await coachingSession.save();

        // Notify Match(es)
        for (let e of entries) {
            try {
                let user = await client.users.fetch(e.discord_id);
                console.log("coach queue next: Matches: Notify User");
                // Notify user
                await client.utils.embeds.SimpleEmbed((await user.createDM()), "Coaching system", `You found a Coach.\nPlease Join ${room} if you are not automatically moved.`);
                console.log("coach queue next: Matches: Remove User from Queue");
                // remove from queue
                queueData.entries.remove({ _id: e._id });
                await guildData.save();
                // Try to move
                try {
                    let member = g.members.resolve(user)!;
                    await member.voice.setChannel(room);
                } catch (error) {
                    // Ignore Errors
                }
                // TODO: User Sessions
            } catch (error) {
                console.log(error)
                return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System Error", text: error, empheral: true });
            }
        }


        // Try to move Coach
        try {
            await member.voice.setChannel(room);
        } catch (error) {
            // Ignore Errors
        }

        return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: `Done. Please Join ${room} if you are not automatically moved.`, empheral: true });
    }
}

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;