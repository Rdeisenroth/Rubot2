import mongoose from "mongoose";
import PermissionOverwriteDataSchema, { PermissionOverwriteData, PermissionOverwriteDataDocument } from "./permission_overwrite_data";

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
    permission_overwrites: PermissionOverwriteData[],
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
     * Whether the Channel should initially be hidden or not
     */
    hide_initially?: boolean,
    /**
     * The Category Channel ID
     */
    parent?: string,
}

const VoiceChannelSpawnerSchema = new mongoose.Schema<VoiceChannelSpawnerDocument, VoiceChannelSpawnerModel, VoiceChannelSpawner>({
    owner: {
        type: String,
        required: false,
    },
    supervisor_roles: [{
        type: String,
        required: true,
        default: [],
    }],
    permission_overwrites: [{
        type: PermissionOverwriteDataSchema,
        required: true,
    }],
    max_users: {
        type: Number,
        required: false,
    },
    name: {
        type: String,
        required: true,
        default: "${owner_name}'s VC",
    },
    lock_initially: {
        type: Boolean,
        required: false,
        default: false,
    },
    hide_initially: {
        type: Boolean,
        required: false,
        default: false,
    },
    parent: {
        type: String,
        required: false,
    },
});

/**
 * Used for creating Voice Channels
 */
export interface VoiceChannelCreateOptions extends VoiceChannelSpawner {
    name: string,
}

export interface VoiceChannelSpawnerDocument extends VoiceChannelSpawner, mongoose.Document<mongoose.Types.ObjectId> {
    supervisor_roles: mongoose.Types.Array<string>,
    permission_overwrites: mongoose.Types.DocumentArray<PermissionOverwriteDataDocument>,
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface VoiceChannelSpawnerModel extends mongoose.Model<VoiceChannelSpawnerDocument> {

}

// Default export
export default VoiceChannelSpawnerSchema;