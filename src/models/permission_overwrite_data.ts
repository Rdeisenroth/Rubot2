import { OverwriteData, PermissionResolvable, Snowflake } from "discord.js";
import mongoose from "mongoose";

export interface PermissionOverwriteData extends OverwriteData {
    allow?: PermissionResolvable[],
    deny?: PermissionResolvable[],
    id: Snowflake,
}

const PermissionOverwriteDataSchema = new mongoose.Schema<PermissionOverwriteDataDocument, PermissionOverwriteDataModel, PermissionOverwriteData>({
    id: {
        type: String,
        required: true,
    },
    // allow: {
    //     type: [String],
    //     enum: ["CREATE_INSTANT_INVITE", "KICK_MEMBERS", "BAN_MEMBERS", "ADMINISTRATOR", "ManageChannels", "MANAGE_GUILD", "ADD_REACTIONS", "VIEW_AUDIT_LOG", "PRIORITY_SpeakER", "Stream", "ViewChannel", "SEND_MESSAGES", "SEND_TTS_MESSAGES", "MANAGE_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "MENTION_EVERYONE", "USE_EXTERNAL_EMOJIS", "VIEW_GUILD_INSIGHTS", "Connect", "Speak", "MuteMembers", "DeafenMembers", "MoveMembers", "USE_VAD", "CHANGE_NICKNAME", "MANAGE_NICKNAMES", "MANAGE_ROLES", "MANAGE_WEBHOOKS", "MANAGE_EMOJIS"],
    //     required: false,
    // },
    // deny: {
    //     type: [String],
    //     enum: ["CREATE_INSTANT_INVITE", "KICK_MEMBERS", "BAN_MEMBERS", "ADMINISTRATOR", "ManageChannels", "MANAGE_GUILD", "ADD_REACTIONS", "VIEW_AUDIT_LOG", "PRIORITY_SpeakER", "Stream", "ViewChannel", "SEND_MESSAGES", "SEND_TTS_MESSAGES", "MANAGE_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "MENTION_EVERYONE", "USE_EXTERNAL_EMOJIS", "VIEW_GUILD_INSIGHTS", "Connect", "Speak", "MuteMembers", "DeafenMembers", "MoveMembers", "USE_VAD", "CHANGE_NICKNAME", "MANAGE_NICKNAMES", "MANAGE_ROLES", "MANAGE_WEBHOOKS", "MANAGE_EMOJIS"],
    //     required: false,
    // },
    type: {
        type: String,
        enum: ["member", "role"],
        required: false,
    },
});

export interface PermissionOverwriteDataDocument extends PermissionOverwriteData, Omit<mongoose.Document, "id"> {
    allow?: mongoose.Types.Array<PermissionResolvable>,
    deny?: mongoose.Types.Array<PermissionResolvable>,
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PermissionOverwriteDataModel extends mongoose.Model<PermissionOverwriteDataDocument> {

}

// Default export
export default PermissionOverwriteDataSchema;