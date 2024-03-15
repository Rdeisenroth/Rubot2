import { DBRole, DBRoleModel, InternalRoles, RoleScopes } from "@models/BotRoles";
import { Guild } from "@models/Guild"
import { Queue, QueueModel } from "@models/Queue";
import { VoiceChannel, VoiceChannelModel } from "@models/VoiceChannel";
import { DocumentType, mongoose } from "@typegoose/typegoose"
import { ChannelType } from "discord.js";

export const config = {
    Memory: true,
    IP: '127.0.0.1',
    Port: '27017',
    Database: 'test'
}

export async function createQueue(guild: DocumentType<Guild>, name: string, description: string): Promise<DocumentType<Queue>> {
    const queue = new QueueModel({
        name: name,
        description: description,
        disconnect_timeout: 60000,
        match_timeout: 120000,
        limit: 150,
        join_message: "You joined the ${name} queue.\n\\> Your Position: ${pos}/${total}\n\\> Total Time Spent: ${time_spent}",
        match_found_message: "You have found a Match with ${match}. Please Join ${match_channel} if you are not moved automatically. If you don't join in ${timeout} seconds, your position in the queue is dropped.",
        timeout_message: "Your queue Timed out after ${timeout} seconds.",
        leave_message: "You Left the `${name}` queue.\nTotal Time Spent: ${time_spent}",
        entries: [],
        opening_times: [],
        info_channels: [],
    });
    guild.queues.push(queue);
    await guild.save();
    return queue;
}

export async function createRole(guild: DocumentType<Guild>, name: string, internalName: string = "tutor"): Promise<DBRole> {
    if (!guild.guild_settings.roles) guild.guild_settings.roles = new mongoose.Types.DocumentArray([]);
    const role = new DBRoleModel({
        internal_name: internalName,
        role_id: name,
        scope: RoleScopes.SERVER,
        server_id: guild.id,
        server_role_name: name,
    });
    guild.guild_settings.roles.push(role);
    await guild.save();
    return role;
}

export async function createWaitingRoom(guild: DocumentType<Guild>, channel: string, queue: Queue, supervisor: string): Promise<VoiceChannel> {
    const waitingRoomChannel = new VoiceChannelModel({
        _id: channel,
        channel_type: ChannelType.GuildVoice,
        locked: false,
        managed: true,
        permitted: [],
        queue: queue,
        supervisors: [supervisor],
    });
    guild.voice_channels.push(waitingRoomChannel);
    await guild.save();
    return waitingRoomChannel;
}