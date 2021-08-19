import mongoose, { ObjectId } from "mongoose";
import { Channel } from "./text_channels";
import VoiceChannelSpawnerSchema, { VoiceChannelSpawner } from "./voice_channel_spawner";

const VoiceChannelSchema = new mongoose.Schema<VoiceChannelDocument, VoiceChannelModel>({
    /**
     * The Channel ID provided by Discord
     */
    _id: {
        type: String,
        required: true
    },
    channel_type: {
        type: Number,
        enum: [0, 1, 2, 3, 4, 5, 6, 7],
        required: true
    },
    // whitelist_user_groups: [{
    //     type: String,
    //     required: true
    // }],
    // blacklist_user_groups: [{
    //     type: String,
    //     required: true
    // }],
    managed: {
        type: Boolean,
        required: true,
    },
    owner: {
        type: String,
        required: false,
    },
    prefix: {
        type: String,
        required: false,
    },
    category: {
        type: String,
        required: false
    },
    afkhell: {
        type: Boolean,
        required: false
    },
    song_link: {
        type: String,
        required: false
    },
    locked: {
        type: Boolean,
        required: true,
        default: false,
    },
    permitted: {
        type: [String],
        required: true,
        default: [],
    },
    spawner: {
        type: VoiceChannelSpawnerSchema,
        required: false,
    },
    /**
     * A Queue that is entered with joining this Channel
     */
    queue: {
        type: mongoose.Types.ObjectId,
        required: false,
    },
    temporary: {
        type: Boolean,
        required: false,
        default: false,
    },
    supervisors: {
        type: [String],
        required: false,
        default: [],
    },
})

export interface VoiceChannel extends Channel {
    /**
     * If the channel is an AFK-Hell (constantly plays a Song)
     */
    afkhell?: boolean,
    /**
     * The Song Link for AFK Hell
     */
    song_link?: string,
    /**
     * If the voice Channel is locked to a specific user group (used to keep track of lock icon)
     */
    locked: boolean,
    /**
     * The Permitted Users/Roles that can enter this channel
     */
    permitted: string[],
    /**
     * Makes the Channel a spawner Channel which creates a new channel for every joined member
     */
    spawner?: VoiceChannelSpawner,
    /**
     * A Queue that is entered with joining this Channel
     */
    queue?: mongoose.Types.ObjectId,
    /**
     * If the VC is a Temporary Voice Channel
     */
    temporary?: boolean,
    /**
     * The Channel Supervisor Roles/ User IDs
     */
    supervisors?: string[],
}

export interface DatabaseVoiceChannel extends VoiceChannel {
    /**
     * The Channel ID
     */
    _id: string,
}

export interface VoiceChannelDocument extends VoiceChannel, mongoose.Document {

}

export interface VoiceChannelModel extends mongoose.Model<VoiceChannelDocument> {

}

// Default export
export default VoiceChannelSchema;