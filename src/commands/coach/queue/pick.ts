import { FilterOutFunctionKeys } from "@typegoose/typegoose/lib/types";
import { Event as EVT, eventType } from "../../../models/events";
import { PermissionOverwriteData } from "../../../models/permission_overwrite_data";
import ChannelType, { ApplicationCommandOptionType, Message } from "discord.js";
import { Command } from "../../../../typings";
import { GuildModel } from "../../../models/guilds";
import { UserModel } from "../../../models/users";
import { RoomModel } from "../../../models/rooms";
import { VoiceChannelSpawner } from "../../../models/voice_channel_spawner";
import { mongoose } from "@typegoose/typegoose";

const command: Command = {
    name: "pick",
    description: "Accept one Persons from The Queue",
    aliases: ["p"],
    options: [
        {
            name: "member",
            description: "A Member of the queue",
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        // {
        //     name: "current",
        //     description: "Add to current Room?",
        //     type: ApplicationCommandOptionType.Boolean,
        //     required: true,
        // },
    ],
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
        if (queueData.isEmpty()) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "The Queue is Empty", empheral: true });
        }

        const pickedUser = interaction.options.getUser("member", true);

        if (!queueData.contains(pickedUser.id)) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System Error", text: "The Picked User is not in the Queue", empheral: true });
        }

        const queueEntry = queueData.getEntry(pickedUser.id)!;

        // const add_to_current = interaction.options.getBoolean("current", true);
        const add_to_current = false;

        if (!add_to_current) {

            // Get Room Spawner

            let spawner: VoiceChannelSpawner | undefined = queueData.room_spawner?.toObject();
            const queue_channel_data = guildData.voice_channels.find(x => x.queue && x.queue == queue);
            const queue_channel = g.channels.cache.get(queue_channel_data?._id ?? "");
            const member = client.utils.general.getMember(interaction)!;
            if (!spawner) {
                spawner = {
                    owner: user.id,
                    supervisor_roles: queue_channel_data?.supervisors ?? [],
                    permission_overwrites: [
                        {
                            id: pickedUser.id,
                            allow: ["ViewChannel", "Connect", "Speak", "Stream"],
                        } as PermissionOverwriteData,
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
                spawner.supervisor_roles = new mongoose.Types.Array(...spawner.supervisor_roles.concat(queue_channel_data?.supervisors ?? []));
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
                    spawner.name = spawner.name ?? `${member.displayName}' ${queueData.name} Room ${coachingSession.getRoomAmount() + 1}`;
                }
                spawner.permission_overwrites = new mongoose.Types.DocumentArray([
                    {
                        id: pickedUser.id,
                        allow: ["ViewChannel", "Connect", "Speak", "Stream"],
                    } as FilterOutFunctionKeys<PermissionOverwriteData>,
                ]);
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
            try {
                const guildData = (await GuildModel.findById(g.id))!;
                const queueData = guildData.queues.id(queue)!;
                const user = await client.users.fetch(queueEntry.discord_id);
                console.log("coach queue pick: Matches: Notify User");
                // Notify user
                await client.utils.embeds.SimpleEmbed((await user.createDM()), "Coaching system", `You found a Coach.\nPlease Join ${room} if you are not automatically moved.`);
                console.log("coach queue pick: Matches: Remove User from Queue");
                // remove from queue
                queueData.entries.pull({ _id: queueEntry._id });
                await guildData.save();

                const roles = await g.roles.fetch();
                const waiting_role = roles.find(x => x.name.toLowerCase() === queueData.name.toLowerCase() + "-waiting");

                if (waiting_role && member && member.roles.cache.has(waiting_role.id)) {
                    await member.roles.remove(waiting_role);
                }

                // Try to move
                try {
                    const member = g.members.resolve(user)!;
                    roomData.events.push({ emitted_by: "me", type: eventType.move_member, timestamp: Date.now().toString(), reason: `Queue System: '${queueData.name}' Queue automated member Move: ${member.id}`, target:member.id } as EVT);
                    await member.voice.setChannel(room);
                } catch (error) {
                    // Ignore Errors
                }
                // TODO: User Sessions
            } catch (error) {
                console.log(error);
                return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System Error", text: `${error}`, empheral: true });
            }


            // Try to move Coach
            try {
                await member.voice.setChannel(room);
                roomData.events.push({ emitted_by: "me", type: eventType.move_member, timestamp: Date.now().toString(), reason: `Queue System: '${queueData.name}' Queue automated member Move: ${member.id} (coach)`, target:member.id } as EVT);
            } catch (error) {
                // Ignore Errors
            }
            await roomData.save();
            return await client.utils.embeds.SimpleEmbed(interaction, {
                title: "Coaching System",
                text: `Done. Please Join ${room} if you are not automatically moved.\nYour Participant is ${pickedUser}`,
                empheral: true,
            });
            // } else {

            // }
        }
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;