import { getModelForClass } from "@typegoose/typegoose";
import { DBRole } from "./BotRoles";
import { Queue } from "./Queue";
import { QueueEntry } from "./QueueEntry";
import { Room } from "./Room";
import { Session } from "./Session";
import { User } from "./User";
import { Guild } from "./Guild";
import { VoiceChannel } from "./VoiceChannel";

export const DBRoleModel = getModelForClass(DBRole, {
    schemaOptions: {
        autoCreate: false,
    },
});

export const GuildModel = getModelForClass(Guild, {
    schemaOptions: {
        autoCreate: true,
    },
});

export const QueueModel = getModelForClass(Queue, {
    schemaOptions: {
        autoCreate: false,
    },
});

export const QueueEntryModel = getModelForClass(QueueEntry, {
    schemaOptions: {
        autoCreate: false,
    },
});

export const RoomModel = getModelForClass(Room, {
    schemaOptions: {
        autoCreate: true,
    },
});

export const SessionModel = getModelForClass(Session, {
    schemaOptions: {
        autoCreate: true,
    },
});

export const UserModel = getModelForClass(User, {
    schemaOptions: {
        autoCreate: true,
    },
});

export const VoiceChannelModel = getModelForClass(VoiceChannel, {
    schemaOptions: {
        autoCreate: false,
    },
});