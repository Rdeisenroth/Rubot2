import mongoose from "mongoose";

const GuildSettingsSchema = new mongoose.Schema<GuildSettingsDocument, GuildSettingsModel>({
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
})

export enum CommandListenMode {
    WHITELIST = 0,
    BLACKLIST = 1
}

export interface GuildSettings {
    prefix: string,
    command_listen_mode: CommandListenMode,
}

export interface GuildSettingsDocument extends GuildSettings, mongoose.Document {

}
export interface GuildSettingsModel extends mongoose.Model<GuildSettingsDocument> {

}

// Default export
export default GuildSettingsSchema;