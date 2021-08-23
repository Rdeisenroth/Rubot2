import { Guild, GuildMember, OverwriteData, PremiumTier } from "discord.js";
import { Bot } from "../bot";
import GuildSchema from "../models/guilds";
import { VoiceChannel } from "../models/voice_channels";
import { VoiceChannelCreateOptions, VoiceChannelSpawner } from "../models/voice_channel_spawner";

/**
 * Creates a managed Voice Channel Based on a Voice Channel Spawner
 * @param guild The Guild to create the Channel in
 * @param options The Options from the Voice Channel Spawner
 */
export async function createManagedVC(guild: Guild, options: VoiceChannelCreateOptions) {
    // Channel Permissions
    let permoverrides: OverwriteData[] = options.permission_overwrites;

    permoverrides.push(
        {
            id: guild.me!.id,
            allow: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK', 'STREAM', 'MOVE_MEMBERS', 'MANAGE_CHANNELS', "DEAFEN_MEMBERS", "MUTE_MEMBERS"], // Fix a bug where i cannot move Members without admin Access
        },
    );

    // allow for Supervisors to see, join and edit the channel
    for (const i of options.supervisor_roles) {
        permoverrides.push({
            id: i,
            allow: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK', 'STREAM', 'MOVE_MEMBERS', 'MANAGE_CHANNELS', "DEAFEN_MEMBERS", "MUTE_MEMBERS"],
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
    const createdVC = await guild.channels.create(options.name, {
        type: 'GUILD_VOICE',
        permissionOverwrites: permoverrides,
        parent: options.parent,
        userLimit: options.max_users,
        bitrate: bitrates[guild.premiumTier],
    });

    // Create Database Entry
    const guildData = (await GuildSchema.findById(guild.id))!;
    guildData.voice_channels.push({
        _id: createdVC.id,
        channel_type: 2,
        owner: options.owner,
        locked: options.lock_initially,
        managed: true,
        // blacklist_user_groups: [],
        // whitelist_user_groups: [],
        permitted: [],
        afkhell: false,
        category: options.parent,
        temporary: true,
    } as VoiceChannel);
    await guildData.save();
    return createdVC;
};

/**
 * Creates a managed Voice Channel Based on a Voice Channel Spawner
 * @param member The Owner of the Channel
 * @param spawner The Options from the Voice Channel Spawner
 */
export async function createTempVC(member: GuildMember, spawner: VoiceChannelSpawner) {
    let options: VoiceChannelCreateOptions;
    let client = member.client as Bot;
    // Figure out Name
    let name = `${member.displayName}'s VC`;
    const shortname = name;
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
        allow: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK', 'STREAM'],
    })

    spawner.name = name;
    return await createManagedVC(member.guild, spawner as VoiceChannelCreateOptions);
}