import { ExecuteEvent } from "../../typings";
import { Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { GuildModel } from "../models/guilds";
import { QueueEntry } from "../models/queue_entry";
export const name = "voiceStateUpdate";
import { RoomModel } from "../models/rooms";
import { Event as EVT, eventType } from "../models/events";

export const execute: ExecuteEvent<"voiceStateUpdate"> = async (client, oldState, newState) => {
    const oldUserChannel = oldState.channel;
    const newUserChannel = newState.channel;

    // New Channel/switch Channel
    if (newState.channel && newState.channel.guild && newUserChannel?.id != oldUserChannel?.id) {

        const guild = newState.channel.guild;

        // Get Channel from DB
        const guildData = (await GuildModel.findById(guild.id));
        const channelData = (guildData!.voice_channels).find(x => x._id == newState.channelId!);
        const roomData = (await RoomModel.findById(newState.channelId));
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
                const queueRef = channelData.queue;
                const queue = guildData?.queues.find(x => x._id?.equals(queueRef));
                if (!queue) {
                    client.logger.error(`Referenced Queue was not found in Database: ${queueRef._id.toHexString()}`);
                    return;
                }
                let queueEntry: QueueEntry;
                try {
                    if (queue.contains(newState.member!.id)) {
                        if (client.queue_stays.get(newState.member!.id)?.get(queueRef._id.toHexString()) === client.utils.general.QueueStayOptions.PENDING) {
                            client.queue_stays.get(newState.member!.id)!.set(queue._id!.toHexString(), client.utils.general.QueueStayOptions.STAY);
                            await client.utils.embeds.SimpleEmbed(await newState.member!.createDM(), {
                                title: "Queue System", text: "You stayed in the queue.", components: [
                                    new ActionRowBuilder<ButtonBuilder>()
                                        .addComponents(
                                            new ButtonBuilder({ customId: "queue_refresh", label: "Show Queue Information", style: ButtonStyle.Primary }),
                                            new ButtonBuilder({ customId: "queue_leave", label: "Leave queue", style: ButtonStyle.Danger }),
                                        ),
                                ],
                            });
                        }
                        return;
                    }
                    // let userData = await UserModel.findById(newState.member!.id);
                    if (newState.member?.roles.cache.find(x => x.name.toLowerCase() === "tutor" || x.name.toLowerCase() === "orga")) {
                        return;
                    }
                    if (queue.locked && !queue.contains(newState.member!.id)) {
                        await newState.member?.voice.setChannel(null);
                        await client.utils.embeds.SimpleEmbed(await newState.member!.createDM(), {
                            title: "Queue System", text: `The Queue ${queue.name} is currently locked.`,
                        });
                    }
                    queueEntry = await queue.join({
                        discord_id: newState.member!.id,
                        joinedAt: Date.now().toString(),
                        importance: 1,
                    });

                    const roles = await guild.roles.fetch();
                    const waiting_role = roles.find(x => x.name.toLowerCase() === queue.name.toLowerCase() + "-waiting");

                    const member = newState.member!;
                    if (waiting_role && member && !member.roles.cache.has(waiting_role.id)) {
                        member.roles.add(waiting_role);
                    }
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
                    const row = new ActionRowBuilder<ButtonBuilder>({
                        components:
                            [
                                new ButtonBuilder({ customId: "queue_refresh", label: "Refresh", style: ButtonStyle.Primary }),
                                new ButtonBuilder({ customId: "queue_leave", label: "Leave queue", style: ButtonStyle.Danger }),
                            ],
                    });
                    try {
                        await newState.member?.send({
                            embeds: [
                                new EmbedBuilder(
                                    {
                                        title: "Queue System",
                                        description: join_message,
                                        color: guild.members.me?.roles.highest.color || 0x7289da,
                                    },
                                ),
                            ],
                            components: [row],
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
        const guildData = (await GuildModel.findById(guild.id));
        const channelData = guildData!.voice_channels.find(x => x._id == oldState.channelId!);
        const roomData = (await RoomModel.findById(oldState.channelId));
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
                const updated = await GuildModel.updateOne(
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
                const queueRef = channelData.queue;
                const queue = guildData?.queues.id(queueRef);
                if (!queue) {
                    client.logger.error(`Referenced Queue was not found in Database: ${queueRef._id.toHexString()}`);
                    return;
                }
                const member = oldState.member!;
                const member_id = member.id;
                // Set Timeout
                if (queue.contains(member_id)) {
                    const dm = await member.createDM();
                    if (queue.disconnect_timeout) {
                        await client.utils.embeds.SimpleEmbed(dm, {
                            title: "Queue System",
                            text: queue.getLeaveRoomMessage(member_id),
                            components: [
                                new ActionRowBuilder<ButtonBuilder>(
                                    {
                                        components:
                                            [
                                                new ButtonBuilder({ customId: "queue_stay", label: "Stay in Queue", style: ButtonStyle.Primary }),
                                                new ButtonBuilder({ customId: "queue_leave", label: "Leave queue", style: ButtonStyle.Danger }),
                                            ],
                                    }),
                            ],
                        });
                        if (!client.queue_stays.has(member_id)) {
                            client.queue_stays.set(member_id, new Collection());
                        }

                        client.queue_stays.get(member_id)!.set(queue._id!.toHexString(), client.utils.general.QueueStayOptions.PENDING);
                        // Create Timer
                        setTimeout(async () => {
                            const queue_stays = client.queue_stays.get(member_id)?.get(queue._id!.toHexString());
                            client.queue_stays.get(member_id)?.delete(queue._id!.toHexString());
                            if (queue_stays !== client.utils.general.QueueStayOptions.PENDING) {
                                return;
                            }
                            const leave_msg = queue.getLeaveMessage(member_id);
                            await queue.leave(member_id);
                            const roles = await guild.roles.fetch();
                            const waiting_role = roles.find(x => x.name.toLowerCase() === queue.name.toLowerCase() + "-waiting");

                            const member = newState.member!;
                            if (waiting_role && member && member.roles.cache.has(waiting_role.id)) {
                                await member.roles.remove(waiting_role);
                            }
                            await client.utils.embeds.SimpleEmbed(dm, {
                                title: "Queue System",
                                text: leave_msg,
                            });
                        }, queue.disconnect_timeout);
                    } else {
                        const leave_msg = queue.getLeaveMessage(member_id);
                        await queue.leave(member_id);
                        const roles = await guild.roles.fetch();
                        const waiting_role = roles.find(x => x.name.toLowerCase() === queue.name.toLowerCase() + "-waiting");

                        const member = newState.member!;
                        if (waiting_role && member && member.roles.cache.has(waiting_role.id)) {
                            await member.roles.remove(waiting_role);
                        }
                        await client.utils.embeds.SimpleEmbed(dm, { title: "Queue System", text: leave_msg });
                    }
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
