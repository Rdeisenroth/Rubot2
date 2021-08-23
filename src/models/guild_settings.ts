import mongoose from "mongoose";

export enum CommandListenMode {
    WHITELIST = 0,
    BLACKLIST = 1
}

export interface GuildSettings {
    /**
     * @deprecated
     * The Bot Prefix for the Guild
     */
    prefix: string,
    /**
     * @deprecated
     * The Command Listen Mode for The Guild
     */
    command_listen_mode: CommandListenMode,
}

const GuildSettingsSchema = new mongoose.Schema<GuildSettingsDocument, GuildSettingsModel, GuildSettings>({
    command_listen_mode: {
        type: Number,
        enum: [0, 1],
        default: 1,
        required: true
    },
    prefix: {
        type: String,
        required: true,
        default: "!"
    }
});

export interface GuildSettingsDocument extends GuildSettings, mongoose.Document {

}
export interface GuildSettingsModel extends mongoose.Model<GuildSettingsDocument> {

}

// Default export
export default GuildSettingsSchema;