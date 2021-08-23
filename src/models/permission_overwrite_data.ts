import { OverwriteData, OverwriteResolvable, PermissionOverwriteOptions, PermissionOverwrites, PermissionString, Snowflake } from "discord.js";
import mongoose from "mongoose";

export interface PermissionOverwriteData extends OverwriteData {
    allow?: PermissionString[],
    deny?: PermissionString[],
    id: Snowflake,
}

const PermissionOverwriteDataSchema = new mongoose.Schema<PermissionOverwriteDataDocument, PermissionOverwriteDataModel, PermissionOverwriteData>({
    id: {
        type: String,
        required: true,
    },
    allow: {
        type: [String],
        enum: ['CREATE_INSTANT_INVITE', 'KICK_MEMBERS', 'BAN_MEMBERS', 'ADMINISTRATOR', 'MANAGE_CHANNELS', 'MANAGE_GUILD', 'ADD_REACTIONS', 'VIEW_AUDIT_LOG', 'PRIORITY_SPEAKER', 'STREAM', 'VIEW_CHANNEL', 'SEND_MESSAGES', 'SEND_TTS_MESSAGES', 'MANAGE_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'MENTION_EVERYONE', 'USE_EXTERNAL_EMOJIS', 'VIEW_GUILD_INSIGHTS', 'CONNECT', 'SPEAK', 'MUTE_MEMBERS', 'DEAFEN_MEMBERS', 'MOVE_MEMBERS', 'USE_VAD', 'CHANGE_NICKNAME', 'MANAGE_NICKNAMES', 'MANAGE_ROLES', 'MANAGE_WEBHOOKS', 'MANAGE_EMOJIS',],
        required: false,
    },
    deny: {
        type: [String],
        enum: ['CREATE_INSTANT_INVITE', 'KICK_MEMBERS', 'BAN_MEMBERS', 'ADMINISTRATOR', 'MANAGE_CHANNELS', 'MANAGE_GUILD', 'ADD_REACTIONS', 'VIEW_AUDIT_LOG', 'PRIORITY_SPEAKER', 'STREAM', 'VIEW_CHANNEL', 'SEND_MESSAGES', 'SEND_TTS_MESSAGES', 'MANAGE_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'MENTION_EVERYONE', 'USE_EXTERNAL_EMOJIS', 'VIEW_GUILD_INSIGHTS', 'CONNECT', 'SPEAK', 'MUTE_MEMBERS', 'DEAFEN_MEMBERS', 'MOVE_MEMBERS', 'USE_VAD', 'CHANGE_NICKNAME', 'MANAGE_NICKNAMES', 'MANAGE_ROLES', 'MANAGE_WEBHOOKS', 'MANAGE_EMOJIS',],
        required: false,
    },
    type: {
        type: String,
        enum: ['member', 'role'],
        required: false,
    },
});

export interface PermissionOverwriteDataDocument extends PermissionOverwriteData, Omit<mongoose.Document, "id"> {
    allow?: mongoose.Types.Array<PermissionString>,
    deny?: mongoose.Types.Array<PermissionString>,
}

export interface PermissionOverwriteDataModel extends mongoose.Model<PermissionOverwriteDataDocument> {

}

// Default export
export default PermissionOverwriteDataSchema;