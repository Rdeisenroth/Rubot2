import { Event as EVT, eventType } from "./../../../models/events";
import { PermissionOverwriteData } from "./../../../models/permission_overwrite_data";
import ChannelType, { ApplicationCommandOptionType, Message, TextChannel } from "discord.js";
import { Command } from "../../../../typings";
import { GuildModel } from "../../../models/guilds";
import { UserModel } from "../../../models/users";
import { RoomModel } from "../../../models/rooms";
import { VoiceChannelSpawner } from "../../../models/voice_channel_spawner";
import { mongoose } from "@typegoose/typegoose";

const command: Command = {
    name: "next",
    description: "Accept X Persons from The Queue",
    aliases: ["n"],
    options: [{
        name: "amount",
        description: "The Amount of Entries to put into the Room",
        type: ApplicationCommandOptionType.Integer,
        required: false,
    }],
    guildOnly: true,
    execute: async (client, interaction, args) => {
        if (!interaction) {
            return;
        }
        if (interaction instanceof Message) {
            client.utils.embeds.SimpleEmbed(interaction, "Slash Only Command", "This Command is Slash only but you Called it with The Prefix. use the slash Command instead.");
            return;
        }
        try {
            await interaction.deferReply({ ephemeral: true });
        } catch (error) {
            return console.log(error);
        }

        const g = interaction.guild!;
        const guildData = (await GuildModel.findById(g.id));
        if (!guildData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Guild Data Could not be found.", empheral: true });
        }

        const user = client.utils.general.getUser(interaction);
        const userEntry = await UserModel.findOneAndUpdate({ _id: user.id }, { _id: user.id }, { new: true, upsert: true, setDefaultsOnInsert: true });
        // Check if User has Active Sessions
        const activeSessions = await userEntry.getActiveSessions();
        // We expect at most 1 active session per guild
        const coachingSession = activeSessions.find(x => x.guild && x.guild === g.id);
        if (!coachingSession) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "You Have no Active Coaching Session.", empheral: true });
        }
        if (!coachingSession.queue) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "There is no Queue Linked to your Session.", empheral: true });
        }

        const queue = coachingSession.queue;
        const queueData = guildData.queues.id(queue);
        if (!queueData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Queue Could not be Found.", empheral: true });
        }
        const members = await g.members.fetch();

        // check if user is still on the server
        await queueData.kickNonServerMembers(g, members);

        if (queueData.isEmpty()) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "The Queue is Empty", empheral: true });
        }
        const entries = queueData.getSortedEntries(interaction.options.getInteger("amount") ?? 1);

        if (entries.length < (interaction.options.getInteger("amount") ?? 1)) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System Error", text: `There are less participants in the queue than requested.\n\\> Requested: ${interaction.options.getInteger("amount") ?? 1}\n\\> Available: ${entries.length}`, empheral: true });
        }


        // Get Room Spawner

        let spawner: VoiceChannelSpawner | undefined = queueData.room_spawner?.toObject();
        const queue_channel_data = guildData.voice_channels.find(x => x.queue && x.queue._id.equals(queue));
        const queue_channel = g.channels.cache.get(queue_channel_data?._id ?? "");
        const member = client.utils.general.getMember(interaction)!;
        if (!spawner) {
            spawner = {
                owner: user.id,
                supervisor_roles: queue_channel_data?.supervisors ?? [],
                permission_overwrites: [
                    ...entries.map(x => {
                        return {
                            id: x.discord_id,
                            allow: ["ViewChannel", "Connect", "Speak", "Stream"],
                        } as PermissionOverwriteData;
                    }),
                ],
                max_users: 5,
                parent: queue_channel?.parentId ?? undefined,
                lock_initially: true,
                hide_initially: true,
                name: `${member.displayName}'s ${queueData.name} Room ${coachingSession.getRoomAmount() + 1}`,
            } as VoiceChannelSpawner;
            console.log(spawner.parent);
            // queueData.set("room_spawner", spawner);
            // await guildData.save();
        } else {
            spawner.supervisor_roles.push(...(queue_channel_data?.supervisors ?? []));
            spawner.owner = user.id;
            if (spawner.name) {
                spawner.name = client.utils.general.interpolateString(
                    spawner.name,
                    {
                        "coach": member.displayName,
                        "queue": queueData.name,
                        "room_id": coachingSession.getRoomAmount() + 1,
                    },
                );
            } else {
                spawner.name = spawner.name ?? `${member.displayName}${member.displayName.endsWith("s") ? "'" : "s'"} ${queueData.name} Room ${coachingSession.getRoomAmount() + 1}`;
            }
            spawner.permission_overwrites = new mongoose.Types.DocumentArray(
                entries.map(x => {
                    return {
                        id: x.discord_id,
                        allow: ["ViewChannel", "Connect", "Speak", "Stream"],
                    } as PermissionOverwriteData;
                }),
            );
        }

        // Spawn Room

        let room: ChannelType.VoiceChannel;
        try {
            room = await client.utils.voice.createTempVC(member, spawner);
        } catch (error) {
            console.log(error);
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Channel could not be created.", empheral: true });
        }

        const roomData = await RoomModel.create({ _id: room.id, active: true, tampered: false, end_certain: false, guild: g.id });
        roomData.events.push({ emitted_by: "me", type: eventType.create_channel, timestamp: Date.now().toString(), reason: `Queue System: '${queueData.name}' Queue automated room Creation` } as EVT);
        // Update Coach Session
        coachingSession.rooms.push(roomData._id);
        await coachingSession.save();

        // Notify Match(es)
        for (const e of entries) {
            try {
                const user = await client.users.fetch(e.discord_id);
                console.log("coach queue next: Matches: Notify User");
                try {
                    // remove from queue
                    const guildData = (await GuildModel.findById(g.id))!;
                    const queueData = guildData.queues.id(queue)!;
                    queueData.entries.remove({ _id: e._id });
                    await guildData.save();
                    // const vcData = await guildData.voice_channels.id(member?.voice.channelId);
                    // if (vcData?.queue?.equals(queueData._id!)) {
                    //     await member!.voice.disconnect();
                    // }
                    const roles = await g.roles.fetch();
                    const waiting_role = roles.find(x => x.name.toLowerCase() === queueData.name.toLowerCase() + "-waiting");

                    if (waiting_role && member && member.roles.cache.has(waiting_role.id)) {
                        await member.roles.remove(waiting_role);
                    }
                    // Notify user
                    try {
                        await client.utils.embeds.SimpleEmbed((await user.createDM()), "Coaching system", `You found a Coach.\nPlease Join ${room} if you are not automatically moved.`);
                        console.log("coach queue next: Matches: Remove User from Queue");
                    } catch (error) {
                        if (queueData.text_channel) {
                            const c = await g.channels.fetch(queueData.text_channel);
                            await client.utils.embeds.SimpleEmbed(c as TextChannel, { title: "Coaching system", text: `You found a Coach, ${user}.\nPlease Join ${room} if you are not automatically moved.`, deleteinterval: 60000 });
                        }
                    }
                } catch (error) {
                    console.log(error);
                    return await client.utils.embeds.SimpleEmbed(interaction, "Coaching System", ":X: An Internal Error Occured.");
                }
                // Try to move
                try {
                    const member = g.members.resolve(user)!;
                    roomData.events.push({ emitted_by: "me", type: eventType.move_member, timestamp: Date.now().toString(), reason: `Queue System: '${queueData.name}' Queue automated member Move: ${member.id}`, target: member.id } as EVT);
                    await member.voice.setChannel(room);
                } catch (error) {
                    // Ignore Errors
                }
                // TODO: User Sessions
            } catch (error) {
                console.log(error);
                return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System Error", text: `${error}`, empheral: true });
            }
        }


        // Try to move Coach
        try {
            await member.voice.setChannel(room);
            roomData.events.push({ emitted_by: "me", type: eventType.move_member, timestamp: Date.now().toString(), reason: `Queue System: '${queueData.name}' Queue automated member Move: ${member.id} (coach)`, target: member.id } as EVT);
        } catch (error) {
            // Ignore Errors
        }
        await roomData.save();
        return await client.utils.embeds.SimpleEmbed(interaction, {
            title: "Coaching System",
            text: `Done. Please Join ${room} if you are not automatically moved.\nYour Participant(s) are: ${entries.map(x => `<@${x.discord_id}>`).join(", ")} `,
            empheral: true,
        });
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;