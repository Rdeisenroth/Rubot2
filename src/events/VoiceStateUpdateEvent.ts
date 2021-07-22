import { ClientEventListener, ExecuteEvent } from "../../typings";
import { Client, ClientEvents, Collection, OverwriteData } from "discord.js";
import GuildSchema, { Guild } from "../models/guilds";
export const name = "voiceStateUpdate";

export const execute: ExecuteEvent<"voiceStateUpdate"> = async (client, oldState, newState) => {

    const oldUserChannel = oldState.channel;
    const newUserChannel = newState.channel;

    if (newState.channel && newState.channel.guild) {

        var guild = newState.channel.guild;

        // Get Channel from DB
        const guildData = (await GuildSchema.findById(guild.id).lean());
        const channelData = guildData!.voice_channels.find(x => x._id == newState.channelID!);
        if (channelData) {

            // Check if Channel is Spawner
            if (channelData.spawner) {

                const spawner = channelData.spawner!;

                // Figure out Name
                var name: string = `${newState.member!.displayName}'s VC`;
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
            }
        }
    }

    return true;
}
