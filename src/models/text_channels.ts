import { ChannelTypes } from "discord.js/typings/enums";
import mongoose from "mongoose";

const TextChannelSchema = new mongoose.Schema<TextChannelDocument, TextChannelModel>({
    channel_type: {
        type: Number,
        enum: [0, 1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13],
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
    listen_for_commands: {
        type: String,
        required: true,
    },
    rage_channel: {
        type: String,
        required: false,
    },
})

/**
 * Database Representation of a Discord Channel
 */
export interface Channel {
    /**
     * The Channel Type
     */
    channel_type: ChannelTypes,
    // whitelist_user_groups: string[],
    // blacklist_user_groups: string[],
    /**
     * Whether the Channel is being managed by or relevant to the bot
     */
    managed: boolean,
    /**
     * The Parent Category channel
     */
    category?: string,
    /**
     * The Channel owner
     */
    owner?: String
}

export interface TextChannel extends Channel {
    /**
     * Channel Specific Prefix, cuz why not? :D
     */
    prefix?: string,
    /**
     * If the Bot is enabled in this channel
     */
    listen_for_commands: boolean,
    /**
     * WHETHER THE CHANNEL IS CAPS-ONLY
     */
    rage_channel?: boolean,
}

// export interface VoiceChannel extends Channel {
//     channel_type: ChannelType,
//     whitelist_user_groups: string[],
//     blacklist_user_groups: string[],
//     managed: boolean,
//     owner?: String,
//     afkhell?: boolean,
//     song_link?: String,
// }

export interface TextChannelDocument extends TextChannel, mongoose.Document {

}

export interface TextChannelModel extends mongoose.Model<TextChannelDocument> {

}

// Default export
export default TextChannelSchema;