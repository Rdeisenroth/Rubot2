import { TextChannelType } from "discord.js";
import mongoose from "mongoose";

/**
 * Database Representation of a Discord Channel
 */
export interface Channel {
    /**
     * The Channel ID
     */
    _id: string,
    /**
     * The Channel Type
     */
    channel_type: TextChannelType,
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
    owner?: string,
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

const TextChannelSchema = new mongoose.Schema<TextChannelDocument, TextChannelModel, TextChannel>({
    channel_type: {
        type: Number,
        enum: [0, 1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13],
        required: true,
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
        type: Boolean,
        required: true,
    },
    rage_channel: {
        type: String,
        required: false,
    },
});

export interface TextChannelDocument extends TextChannel, Omit<mongoose.Document, "_id"> {

}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TextChannelModel extends mongoose.Model<TextChannelDocument> {

}

// Default export
export default TextChannelSchema;