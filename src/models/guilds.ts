// import mongoose from 'mongoose';
import mongoose from "mongoose";
import GuildSettingsSchema, { GuildSettings } from "./guild_settings";
import TextChannelSchema, { TextChannel } from "./text_channels";
import VoiceChannelSchema, { VoiceChannel } from "./voice_channels";

/**
 * A Schema For storing and Managing Guilds
 */
const GuildSchema = new mongoose.Schema<GuildDocument, GuildModel>({
    /**
     * The Guild ID provided by Discord
     */
    _id: {
        type: String,
        required: true
    },
    /**
     * The Name of the Guild
     */
    name: {
        type: String,
        required: true
    },
    /**
     * The Member Count (Makes it easier to sort Guilds by member counts)
     */
    member_count: {
        type: Number,
        required: true,
        default: 0
    },
    /**
     * The Settings for the Guild
     */
    guild_settings: {
        type: GuildSettingsSchema,
        required: true,
    },
    text_channels: [{
        type: TextChannelSchema,
        required: true,
        default: [],
    }],
    voice_channels: [{
        type: VoiceChannelSchema,
        required: true,
        default: [],
    }],
});

// TODO Find better Names so that they don't conflict with discordjs Interfaces
/**
 * A Guild from the Database
 */
export interface Guild {
    name: String,
    member_count: number,
    guild_settings: GuildSettings,
    text_channels: TextChannel[],
    voice_channels: VoiceChannel[],
}

export interface GuildDocument extends Guild, mongoose.Document {
    // List getters or non model methods here
}

export interface GuildModel extends mongoose.Model<GuildDocument> {
    // List Model methods here
}

// Default export
export default mongoose.model<GuildDocument, GuildModel>("Guilds", GuildSchema);