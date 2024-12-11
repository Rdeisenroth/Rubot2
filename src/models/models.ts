import {getModelForClass} from "@typegoose/typegoose";
import {User} from "./users";
import {Session} from "./sessions";
import {DBRole} from "./bot_roles";
import {GuildSettings} from "./guild_settings";
import {Guild} from "./guilds";
import {PermissionOverwriteData} from "./permission_overwrite_data";
import {QueueEntry} from "./queue_entry";
import {QueueSpan} from "./queue_span";
import {Queue} from "./queues";
import {Room} from "./rooms";
import {SlashCommandSettings} from "./slash_command_settings";
import {TextChannel} from "./text_channels";
import {VoiceChannelSpawner} from "./voice_channel_spawner";
import {VoiceChannel} from "./voice_channels";
import {WeekTimestamp} from "./week_timestamp";

export const UserModel = getModelForClass(User, {
    schemaOptions: {
        autoCreate: true,
    },
});


export const SessionModel = getModelForClass(Session, {
    schemaOptions: {
        autoCreate: true,
    },
});


export const DBRoleModel = getModelForClass(DBRole, {
    schemaOptions: {
        autoCreate: false,
    },
});


export const GuildSettingsModel = getModelForClass(GuildSettings, {
    schemaOptions: {
        autoCreate: false,
    },
});


export const GuildModel = getModelForClass(Guild, {
    schemaOptions: {
        autoCreate: true,
    },
});


export const PermissionOverwriteDataModel = getModelForClass(PermissionOverwriteData, {
    schemaOptions: {
        autoCreate: false,
    },
});


export const QueueEntryModel = getModelForClass(QueueEntry, {
    schemaOptions: {
        autoCreate: false,
    },
});


export const QueueSpanModel = getModelForClass(QueueSpan, {
    schemaOptions: {
        autoCreate: false,
    },
});


export const QueueModel = getModelForClass(Queue, {
    schemaOptions: {
        autoCreate: false,
    },
});


export const RoomModel = getModelForClass(Room, {
    schemaOptions: {
        autoCreate: true,
    },
});


export const SlashCommandSettingsModel = getModelForClass(SlashCommandSettings, {
    schemaOptions: {
        autoCreate: false,
    },
});


export const TextChannelModel = getModelForClass(TextChannel, {
    schemaOptions: {
        autoCreate: false,
    },
});


export const VoiceChannelSpawnerModel = getModelForClass(VoiceChannelSpawner, {
    schemaOptions: {
        autoCreate: false,
    },
});


export const VoiceChannelModel = getModelForClass(VoiceChannel, {
    schemaOptions: {
        autoCreate: false,
    },
});


export const WeekTimestampModel = getModelForClass(WeekTimestamp, {
    schemaOptions: {
        autoCreate: false,
    },
});