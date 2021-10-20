import { ExecuteEvent } from "../../typings";
import { MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import GuildSchema from "../models/guilds";
import { VoiceChannelDocument } from "../models/voice_channels";
import { QueueDocument } from "../models/queues";
import { QueueEntry } from "../models/queue_entry";
import moment from "moment";
export const name = "voiceStateUpdate";
import RoomSchema from "../models/rooms";
import UserSchema from "../models/users";
import EventSchema, { Event as EVT, eventType } from "../models/events";

export const execute: ExecuteEvent<"voiceStateUpdate"> = async (client, oldState, newState) => {
    const oldUserChannel = oldState.channel;
    const newUserChannel = newState.channel;

    // New Channel/switch Channel
    if (newState.channel && newState.channel.guild && newUserChannel?.id != oldUserChannel?.id) {

        const guild = newState.channel.guild;

        // Get Channel from DB
        const guildData = (await GuildSchema.findById(guild.id));
        const channelData = (guildData!.voice_channels as VoiceChannelDocument[]).find(x => x._id == newState.channelId!);
        const roomData = (await RoomSchema.findById(newState.channelId));
        if (channelData) {

            // Check if Channel is Spawner
            if (channelData.spawner) {

                const spawner = channelData.spawner!;

                const createdVC = await client.utils.voice.createTempVC(newState.member!, spawner);

                // Move Member
                try {
                    await newState.member!.voice.setChannel(createdVC);
                } catch (error) {
                    throw new Error("USER_NOT_MOVABLE");
                }


                console.log(`Created TEMP VC: ${createdVC.name} on ${guild.name}`);
            } else if (channelData.queue) {
                const queueId = channelData.queue;
                const queue = (guildData?.queues as QueueDocument[]).find(x => x._id == queueId.toHexString());
                if (!queue) {
                    client.logger.error(`Referenced Queue was not found in Database: ${queueId.toHexString()}`);
                    return;
                }
                let queueEntry: QueueEntry;
                try {
                    if (queue.contains(newState.member!.id)) {
                        return;
                    }
                    let userData = await UserSchema.findById(newState.member!.id);
                    if (userData?.hasActiveSessions()) {
                        return;
                    }
                    queueEntry = await queue.join({
                        discord_id: newState.member!.id,
                        joinedAt: Date.now().toString(),
                        importance: 1,
                    });
                } catch (error) {
                    try {
                        await client.utils.embeds.SimpleEmbed(await newState.member!.createDM(), { title: "Queue System", text: `An error occurred: ${error}` });
                        return;
                    } catch (error2) {
                        console.log(error);
                        return;
                    }
                }
                if (queue.join_message) {
                    const replacements = {
                        "limit": queue.limit,
                        "member_id": newState.member!.id,
                        "user": newState.member!.user,
                        "name": queue.name,
                        "description": queue.description,
                        "eta": "null",
                        "pos": queue.getPosition(queueEntry.discord_id) + 1,
                        "total": queue.entries.length,
                        "time_spent": "0s",
                    };
                    // Interpolate String
                    const join_message = client.utils.general.interpolateString(queue.join_message, replacements);
                    try {
                        await newState.member?.send({
                            embeds: [new MessageEmbed({ title: "Queue System", description: join_message, color: guild.me?.roles.highest.color || 0x7289da })],
                            components: [
                                new MessageActionRow(
                                    {
                                        components:
                                            [
                                                new MessageButton({ customId: "queue_refresh", label: "Refresh", style: "PRIMARY" }),
                                                new MessageButton({ customId: "queue_leave", label: "Leave queue", style: "DANGER" }),
                                            ],
                                    }),
                            ],
                        });
                    } catch (error) {
                        console.log(error);
                    }
                }
            } else if (roomData) {
                roomData.events.push({ emitted_by: newState.member!.id, type: eventType.user_join, timestamp: Date.now().toString() } as EVT);
                await roomData.save();
            }
        }

    }
    if (oldUserChannel && newUserChannel?.id != oldUserChannel?.id) {

        const guild = oldUserChannel.guild;

        // Get Channel from DB
        const guildData = (await GuildSchema.findById(guild.id));
        const channelData = (guildData!.voice_channels as VoiceChannelDocument[]).find(x => x._id == oldState.channelId!);
        const roomData = (await RoomSchema.findById(oldState.channelId));
        if (channelData) {
            if (channelData.temporary && oldUserChannel.members.size == 0) {

                // remove vc
                if (oldUserChannel.deletable) {
                    await oldUserChannel.delete();
                } else {
                    client.logger.error("Temp VC Not deletable: " + oldUserChannel.id);
                }

                if (roomData) {
                    roomData.events.push({ emitted_by: "me", type: eventType.destroy_channel, timestamp: Date.now().toString(), reason: "Queue System: Room destroyed last user left, clean exit" } as EVT);
                    await roomData.save();
                }

                // get name for logging
                const cName = oldUserChannel.name;

                // if(!channelData.locked) {
                //     cName = cName.substring("🔓".length);
                // }

                // remove DB entry
                const updated = await GuildSchema.updateOne(
                    { _id: guild.id },
                    {
                        $pull: {
                            "voice_channels": { _id: oldUserChannel.id },
                        },
                    },
                    { upsert: true, setDefaultsOnInsert: true },
                );
                // console.log(updated);
                console.log(`deleted TEMP VC: ${cName} on ${guild.name}`);
            } else if (channelData.queue) {
                const queueId = channelData.queue;
                const queue: QueueDocument | null | undefined = guildData?.queues.id(queueId);
                if (!queue) {
                    client.logger.error(`Referenced Queue was not found in Database: ${queueId.toHexString()}`);
                    return;
                }
                const member = oldState.member!;
                const member_id = member.id;
                // Set Timeout
                if (queue.contains(member_id)) {
                    const dm = await member.createDM();
                    // if (queue.disconnect_timeout) {
                    //     await client.utils.embeds.SimpleEmbed(dm, {
                    //         title: "Queue System",
                    //         text: queue.getLeaveRoomMessage(member_id),
                    //         components: [
                    //             new MessageActionRow(
                    //                 {
                    //                     components:
                    //                         [
                    //                             new MessageButton({ customId: "queue_stay", label: "Stay in Queue", style: "PRIMARY" }),
                    //                             new MessageButton({ customId: "queue_leave", label: "Leave queue", style: "DANGER" }),
                    //                         ],
                    //                 }),
                    //         ],
                    //     });
                    //     // Create Timer
                    //     setTimeout(async () => {
                    //         if (client.queue_stays.get(member_id)?.get(queue._id) ?? false) {
                    //             client.queue_stays.get(member_id)?.delete(queue._id);
                    //             return;
                    //         }
                    //         const leave_msg = queue.getLeaveMessage(member_id);
                    //         await queue.leave(member_id);
                    //         await client.utils.embeds.SimpleEmbed(dm, {
                    //             title: "Queue System",
                    //             text: leave_msg,
                    //         });
                    //     }, queue.disconnect_timeout);
                    // } else {
                    const leave_msg = queue.getLeaveMessage(member_id);
                    await queue.leave(member_id);
                    await client.utils.embeds.SimpleEmbed(dm, { title: "Queue System", text: leave_msg });
                    // }
                }

            }
            if (roomData) {
                roomData.events.push({ emitted_by: newState.member!.id, type: eventType.user_leave, timestamp: Date.now().toString() } as EVT);
                await roomData.save();
            }
        }

    }


    return;
};
