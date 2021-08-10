import { ClientEventListener, ExecuteEvent } from "../../typings";
import { Client, ClientEvents, Collection, MessageEmbed, OverwriteData, PremiumTier } from "discord.js";
import GuildSchema, { Guild } from "../models/guilds";
import VoiceChannelSchema, { VoiceChannel, VoiceChannelDocument } from "../models/voice_channels";
import { spawn } from "child_process";
import { QueueDocument } from "../models/queues";
export const name = "voiceStateUpdate";

export const execute: ExecuteEvent<"voiceStateUpdate"> = async (client, oldState, newState) => {
    const oldUserChannel = oldState.channel;
    const newUserChannel = newState.channel;

    // New Channel/switch Channel
    if (newState.channel && newState.channel.guild) {

        var guild = newState.channel.guild;

        // Get Channel from DB
        const guildData = (await GuildSchema.findById(guild.id));
        const channelData = (guildData!.voice_channels as VoiceChannelDocument[]).find(x => x._id == newState.channelId!);
        if (channelData) {

            // Check if Channel is Spawner
            if (channelData.spawner) {

                const spawner = channelData.spawner!;

                // Figure out Name
                var name = `${newState.member!.displayName}'s VC`;
                const shortname = name;
                if (spawner.name) {
                    name = spawner.name;
                    // Interpolate String
                    for (const [key, value] of Object.entries(
                        {
                            "owner_name": newState.member!.displayName,
                            "owner": newState.member!.id,
                            "max_users": spawner.max_users,
                        }
                    )) {
                        name = name.replace(`\${${key}}`, value as string);
                    }
                }
                // if (!spawner.lock_initially) {
                //     name = "🔓" + name;
                // }

                // Channel Permissions
                var permoverrides: OverwriteData[] = spawner.permission_overwrites;

                permoverrides.push(
                    {
                        id: guild.me!.id,
                        allow: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK', 'MOVE_MEMBERS', 'MANAGE_CHANNELS'], // Fix a bug where i cannot move Members without admin Access
                    },
                    {
                        id: newState.member!.id,
                        allow: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK'],
                    }
                );

                // allow for Supervisors to see, join and edit the channel
                for (const i of spawner.supervisor_roles) {
                    permoverrides.push({
                        id: i,
                        allow: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK', "MANAGE_CHANNELS"],
                    });
                }

                // TODO: Error Handling


                var bitrates: { [name in PremiumTier]: number } = {
                    "NONE": 96000,     // Unboosted
                    "TIER_1": 128000,  // Boost Level 1
                    "TIER_2": 256000,  // Boost Level 2
                    "TIER_3": 384000   // Boost Level 3
                }


                // Create new Voice Channel
                const createdVC = await guild.channels.create(name, {
                    type: 'GUILD_VOICE',
                    permissionOverwrites: permoverrides,
                    parent: spawner.parent,
                    userLimit: spawner.max_users,
                    bitrate: bitrates[guild.premiumTier],
                });

                // Move Member
                try {
                    await newState.member!.voice.setChannel(createdVC);
                } catch (error) {
                    throw new Error("USER_NOT_MOVABLE");
                }

                // Create Database Entry
                const updated = await GuildSchema.updateOne(
                    { _id: guild.id },
                    {
                        $push: {
                            "voice_channels": {
                                _id: createdVC.id,
                                channel_type: 2,
                                owner: newState.member!.id,
                                locked: spawner.lock_initially,
                                managed: true,
                                // blacklist_user_groups: [],
                                // whitelist_user_groups: [],
                                permitted: [],
                                afkhell: false,
                                category: spawner.parent,
                                temporary: true,
                            } as VoiceChannel
                        }
                    },
                    { upsert: true, setDefaultsOnInsert: true },
                );
                // console.log(updated);
                console.log(`Created TEMP VC: ${shortname} on ${guild.name}`);
            }else if(channelData.queue){
                const queueId = channelData.queue;
                const queue = (guildData?.queues as QueueDocument[]).find(x => x._id == queueId.toHexString());
                if (!queue){
                    client.logger.error(`Referenced Queue was not found in Database: ${queueId.toHexString()}`);
                    return;
                }
                if (queue.join_message) {
                    let join_message = queue.join_message;
                    // Interpolate String
                    for (const [key, value] of Object.entries(
                        {
                            "limit": queue.limit,
                            "member_id": newState.member!.id,
                            "user": newState.member!.user,
                            "name": queue.name,
                            "description": queue.description,
                            "eta": "null",
                            "pos": "null",
                            "total": "null",
                        }
                    )) {
                        join_message = join_message.replace(`\${${key}}`, value as string);
                    }
                    try {
                        await newState.member?.send({ embeds: [new MessageEmbed({ title: `Queue System`, description: join_message, color: guild.me?.roles.highest.color || 0x7289da})]});
                    } catch (error) {
                        console.log(error);
                    }
                }
            }
        }

    }
    if (oldUserChannel && newUserChannel?.id != oldUserChannel?.id) {

        var guild = oldUserChannel.guild;

        // Get Channel from DB
        const guildData = (await GuildSchema.findById(guild.id));
        const channelData = (guildData!.voice_channels as VoiceChannelDocument[]).find(x => x._id == oldState.channelId!);

        if (channelData) {
            if (channelData.temporary && oldUserChannel.members.size == 0) {

                // remove vc
                if (oldUserChannel.deletable) {
                    await oldUserChannel.delete();
                } else {
                    client.logger.error("Temp VC Not deletable: " + oldUserChannel.id);
                }

                // get name for logging
                var cName = oldUserChannel.name;

                // if(!channelData.locked) {
                //     cName = cName.substring("🔓".length);
                // }

                // remove DB entry
                const updated = await GuildSchema.updateOne(
                    { _id: guild.id },
                    {
                        $pull: {
                            "voice_channels": { _id: oldUserChannel.id }
                        }
                    },
                    { upsert: true, setDefaultsOnInsert: true },
                );
                // console.log(updated);
                console.log(`deleted TEMP VC: ${cName} on ${guild.name}`);
            }

        }
    }

    return;
}
