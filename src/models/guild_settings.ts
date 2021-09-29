import SlashCommandSettingsSchema, { SlashCommandSettings } from "./slash_command_settings";
import { ApplicationCommandPermissionData } from "discord.js";
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
    /**
     * The Guild Specific command Settings
     */
    slashCommands: SlashCommandSettings[]
}

const GuildSettingsSchema = new mongoose.Schema<GuildSettingsDocument, GuildSettingsModel, GuildSettings>({
    command_listen_mode: {
        type: Number,
        enum: [0, 1],
        default: 1,
        required: true,
    },
    prefix: {
        type: String,
        required: true,
        default: "!",
    },
    slashCommands: [{
        type: SlashCommandSettingsSchema,
        required: true,
        default: [],
    }],
});

export interface GuildSettingsDocument extends GuildSettings, mongoose.Document {

}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GuildSettingsModel extends mongoose.Model<GuildSettingsDocument> {

}

// Default export
export default GuildSettingsSchema;