import { FilterOutFunctionKeys } from "@typegoose/typegoose/lib/types";
import { ChannelType, Guild, GuildMember, GuildPremiumTier, OverwriteData } from "discord.js";
import { Bot } from "../bot";
import { GuildModel } from "../models/guilds";
import { VoiceChannel } from "../models/voice_channels";
import { VoiceChannelSpawner } from "../models/voice_channel_spawner";
import { mongoose } from "@typegoose/typegoose";

/**
 * Creates a managed Voice Channel Based on a Voice Channel Spawner
 * @param guild The Guild to create the Channel in
 * @param options The Options from the Voice Channel Spawner
 */
export async function createManagedVC(guild: Guild, options: FilterOutFunctionKeys<VoiceChannelSpawner>) {
    // Channel Permissions
    const permoverrides: OverwriteData[] = options.permission_overwrites;

    permoverrides.push(
        {
            id: guild.members.me!.id,
            allow: ["ViewChannel", "Connect", "Speak", "Stream", "MoveMembers", "ManageChannels", "DeafenMembers", "MuteMembers"], // Fix a bug where i cannot move Members without admin Access
        },
    );

    // allow for Supervisors to see, join and edit the channel
    for (const i of options.supervisor_roles) {
        if (await guild.roles.fetch(i) || await guild.members.fetch(i)) {
            permoverrides.push({
                id: i,
                allow: ["ViewChannel", "Connect", "Speak", "Stream", "MoveMembers", "ManageChannels", "DeafenMembers", "MuteMembers"],
            });
        }
    }

    // Lock?
    if (options.lock_initially) {
        permoverrides.push({
            id: guild.roles.everyone.id,
            deny: ["Connect", "Speak"],
        });
    }

    // Hide?
    if (options.hide_initially) {
        permoverrides.push({
            id: guild.roles.everyone.id,
            deny: ["ViewChannel"],
        });
    }

    // TODO: Error Handling


    const bitrates: { [name in GuildPremiumTier]: number } = {
        "0": 96000,     // Unboosted
        "1": 128000,  // Boost Level 1
        "2": 256000,  // Boost Level 2
        "3": 384000,   // Boost Level 3
    };


    // Create new Voice Channel
    const createdVC = await guild.channels.create({
        name: options.name,
        type: ChannelType.GuildVoice,
        permissionOverwrites: permoverrides,
        parent: options.parent,
        userLimit: options.max_users,
        bitrate: bitrates[guild.premiumTier],
    });

    // Create Database Entry
    const guildData = (await GuildModel.findById(guild.id))!;
    guildData.voice_channels.push({
        _id: createdVC.id,
        channel_type: 2,
        owner: options.owner,
        locked: options.lock_initially,
        managed: true,
        // blacklist_user_groups: [],
        // whitelist_user_groups: [],
        permitted: new mongoose.Types.Array(),
        afkhell: false,
        category: options.parent,
        temporary: true,
    } as FilterOutFunctionKeys<VoiceChannel>);
    await guildData.save();
    return createdVC;
}

/**
 * Creates a managed Voice Channel Based on a Voice Channel Spawner
 * @param member The Owner of the Channel
 * @param spawner The Options from the Voice Channel Spawner
 */
export async function createTempVC(member: GuildMember, spawner: VoiceChannelSpawner) {
    const client = member.client as Bot;
    // Figure out Name
    let name = `${member.displayName}'s VC`;
    if (spawner.name) {
        name = spawner.name;
        // Interpolate String
        name = client.utils.general.interpolateString(name, {
            "owner_name": member.displayName,
            "owner": member.id,
            "max_users": spawner.max_users,
        });
    }
    // if (!spawner.lock_initially) {
    //     name = "🔓" + name;
    // }
    spawner.permission_overwrites.push({
        id: member.id,
        allow: ["ViewChannel", "Connect", "Speak", "Stream", "ManageChannels", "KickMembers"],
    });

    spawner.name = name;
    spawner.owner = member.id;
    return await createManagedVC(member.guild, spawner);
}