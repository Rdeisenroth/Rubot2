import mongoose from "mongoose";
import { Channel } from "./text_channels";

const VoiceChannelSchema = new mongoose.Schema<VoiceChannelDocument, VoiceChannelModel>({
    channel_type: {
        type: Number,
        enum: [0, 1,2,3,4,5,6,7],
        required: true
    },
    whitelist_user_groups: [{
        type: String,
        required: true
    }],
    blacklist_user_groups: [{
        type: String,
        required: true
    }],
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
    listen_for_commands: {
        type: String,
        required: true,
    },
    rage_channel: {
        type: String,
        required: false,
    },
})

export interface VoiceChannel extends Channel {
    afkhell?: boolean,
    song_link?: string,
    locked: boolean,
    permitted: string[]
}

export interface VoiceChannelDocument extends VoiceChannel, mongoose.Document {

}

export interface VoiceChannelModel extends mongoose.Model<VoiceChannelDocument> {

}

// Default export
export default VoiceChannelSchema;