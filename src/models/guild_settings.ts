import SlashCommandSettingsSchema, { SlashCommandSettings, SlashCommandSettingsDocument } from "./slash_command_settings";
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
    slashCommands: mongoose.Types.DocumentArray<SlashCommandSettingsDocument>,
    /**
    * Checks whether command Settings exist
    * @param name The internal Command Name
    */
    hasCommandSettings(name: string): boolean,
    /**
    * Gets the Settings for a specified command
    * @param name The internal Command Name
    */
    getCommandByName(name: string): SlashCommandSettingsDocument | null,
    getOrCreateCommandByName(name: string): Promise<SlashCommandSettingsDocument>,
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GuildSettingsModel extends mongoose.Model<GuildSettingsDocument> {

}

GuildSettingsSchema.method("hasCommandSettings", function (name: string) {
    return this.slashCommands.some(x => x.internal_name === name);
});

GuildSettingsSchema.method("getCommandByName", function (name: string) {
    return this.slashCommands.find(x => x.internal_name === name) ?? null;
});

GuildSettingsSchema.method("getOrCreateCommandByName", async function (name: string) {
    if (!this.hasCommandSettings(name)) {
        this.slashCommands.push(
            {
                internal_name: name,
                aliases: [],
                permissions: [],
            } as SlashCommandSettings,
        );
        await this.$parent()?.save();
    }
    return this.getCommandByName(name)!;
});

// Default export
export default GuildSettingsSchema;