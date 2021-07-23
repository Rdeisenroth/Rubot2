import { ClientEventListener, ExecuteEvent } from "../../typings";
import { Client, ClientEvents, Collection, OverwriteData } from "discord.js";
import GuildSchema, { Guild } from "../models/guilds";
import VoiceChannelSchema, { VoiceChannel } from "../models/voice_channels";
import { spawn } from "child_process";
export const name = "voiceStateUpdate";

export const execute: ExecuteEvent<"voiceStateUpdate"> = async (client, oldState, newState) => {
    const oldUserChannel = oldState.channel;
    const newUserChannel = newState.channel;

    // New Channel/switch Channel
    if (newState.channel && newState.channel.guild) {

        var guild = newState.channel.guild;

        // Get Channel from DB
        const guildData = (await GuildSchema.findById(guild.id));
        const channelData = guildData!.voice_channels.find(x => x._id == newState.channelID!);
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
                if (!spawner.lock_initially) {
                    name = "🔓" + name;
                }

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

                // Create new Voice Channel
                const createdVC = await guild.channels.create(name, {
                    type: 'voice',
                    permissionOverwrites: permoverrides,
                    parent: spawner.parent,
                    userLimit: spawner.max_users
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
            }
        }

    }
    if (oldUserChannel && newUserChannel?.id != oldUserChannel?.id) {

        var guild = oldUserChannel.guild;

        // Get Channel from DB
        const guildData = (await GuildSchema.findById(guild.id));
        const channelData = guildData!.voice_channels.find(x => x._id == oldState.channelID!);

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

                if(channelData.locked) {
                    cName = cName.split("🔓", 2)[1];
                }

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

    return true;
}
