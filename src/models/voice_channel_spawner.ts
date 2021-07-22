import { OverwriteData, OverwriteResolvable, PermissionOverwriteOptions, PermissionOverwrites } from "discord.js";
import mongoose from "mongoose";

const OverwriteDataSchema = new mongoose.Schema({
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
})

const VoiceChannelSpawnerSchema = new mongoose.Schema<VoiceChannelSpawnerDocument, VoiceChannelSpawnerModel>({
    owner: {
        type: String,
        required: false,
    },
    supervisor_roles: {
        type: [String],
        required: true,
        default: []
    },
    permission_overwrites: {
        type: [OverwriteDataSchema],
        required: true
    },
    max_users: {
        type: Number,
        required: false,
    },
    name: {
        type: String,
        required: true,
        default: "${owner_name}'s VC"
    },
    lock_initially: {
        type: Boolean,
        required: false,
        default: false,
    },
    parent: {
        type: String,
        required: false,
    },
})

export interface VoiceChannelSpawner {
    /**
     * overwrite the VC Owner for the Bot
     */
    owner?: string,
    /**
     * The Roles that can moderate this channel
     */
    supervisor_roles: string[],
    /**
     * The Channel Permissions
     */
    permission_overwrites: OverwriteData[],
    /**
     * Limit the amount of Users that can join the channel
     */
    max_users?: number,
    /**
     * The Name of the Channel, use ${owner} and so on to create dynamic channel names
     */
    name?: string,
    /**
     * Whether the Channel should initially be locked or not
     */
    lock_initially?: boolean,
    /**
     * The Category Channel ID
     */
    parent?: string,
}

export interface VoiceChannelSpawnerDocument extends VoiceChannelSpawner, mongoose.Document {

}

export interface VoiceChannelSpawnerModel extends mongoose.Model<VoiceChannelSpawnerDocument> {

}

// Default export
export default VoiceChannelSpawnerSchema;