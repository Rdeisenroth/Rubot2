import { DBRole, RoleScopes } from "@models/BotRoles";
import { QueueEventType } from "@models/Event";
import { Guild } from "@models/Guild"
import { QueueModel, SessionModel, DBRoleModel, VoiceChannelModel, RoomModel } from "@models/Models";
import { Queue } from "@models/Queue";
import { QueueEntry } from "@models/QueueEntry";
import { Room } from "@models/Room";
import {SessionRole, Session } from "@models/Session";
import { VoiceChannel } from "@models/VoiceChannel";
import { DocumentType, mongoose } from "@typegoose/typegoose"
import { randomInt } from "crypto";
import { ChannelType, } from "discord.js";
import events from "events";

export const config = {
    Memory: true,
    IP: '127.0.0.1',
    Port: '27017',
    Database: 'test'
}

export async function createQueue(guild: DocumentType<Guild>, {
    name = "test queue",
    description = "test description",
    entries = [],
    locked = false,
    disconnect_timeout = 1,
    info_channels = []
}: {
    name?: string,
    description?: string,
    entries?: QueueEntry[],
    locked?: boolean,
    disconnect_timeout?: number,
    info_channels?: {
        channel_id: string;
        events: QueueEventType[];
    }[]
} = {}): Promise<DocumentType<Queue>> {
    const queue = new QueueModel({
        name: name,
        description: description,
        disconnect_timeout: disconnect_timeout,
        match_timeout: 120000,
        limit: 150,
        join_message: "You joined the ${name} queue.\n\\> Your Position: ${pos}/${total}\n\\> Total Time Spent: ${time_spent}",
        match_found_message: "You have found a Match with ${match}. Please Join ${match_channel} if you are not moved automatically. If you don't join in ${timeout} seconds, your position in the queue is dropped.",
        timeout_message: "Your queue Timed out after ${timeout} seconds.",
        leave_message: "You Left the `${name}` queue.\nTotal Time Spent: ${time_spent}",
        entries: entries,
        opening_times: [],
        info_channels: info_channels,
        locked: locked,
    });
    guild.queues.push(queue);
    await guild.save();
    return queue;
}

export async function createSession(queue: DocumentType<Queue> | null, userId: string, guildId: string, active: boolean = true): Promise<DocumentType<Session>> {
    const session = await SessionModel.create({
        queue: queue,
        user: userId,
        guild: guildId,
        role: SessionRole.coach,
        active: active,
        started_at: new Date(),
        end_certain: !active,
        rooms: [],
    })
    return session;
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

// export async function createVoiceChannel(guild: DocumentType<Guild>, channelId: string, queue: Queue, supervisor: string): Promise<VoiceChannel> {
export async function createVoiceChannel(guild: DocumentType<Guild>, {
    queue = null,
    channelID = randomInt(281474976710655).toString(),
    supervisor = null,
    temporary = false,
}: {
    queue?: DocumentType<Queue> | null,
    channelID?: string,
    supervisor?: string | null,
    temporary?: boolean,
} = {}): Promise<DocumentType<VoiceChannel>> {
    const waitingRoomChannel = new VoiceChannelModel({
        _id: channelID,
        channel_type: ChannelType.GuildVoice,
        locked: false,
        managed: true,
        permitted: [],
        queue: queue,
        supervisors: [supervisor],
        temporary: temporary,
    });

    guild.voice_channels.push(waitingRoomChannel);
    await guild.save();
    return waitingRoomChannel;
}

export async function createRoom(guild: DocumentType<Guild>, { 
    roomId = randomInt(281474976710655).toString(),
    active = true,
    tampered = false,
    endCertain = false,
    events = []
}: {
    roomId?: string,
    active?: boolean,
    tampered?: boolean,
    endCertain?: boolean,
    events?: {
        emitted_by: string,
        type: string,
        timestamp: string
    }[]
} = {}): Promise<DocumentType<Room>> {
    const room = await RoomModel.create({
        _id: roomId,
        active: active,
        tampered: tampered,
        end_certain: endCertain,
        guild: guild.id,
        events: events,
    });
    return room;
}