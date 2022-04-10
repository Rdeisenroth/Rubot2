import DBRoleSchema, { DBRole, DBRoleDocument } from "./bot_roles";
import SlashCommandSettingsSchema, { SlashCommandSettings, SlashCommandSettingsDocument } from "./slash_command_settings";
import { ApplicationCommandPermissionData } from "discord.js";
import mongoose from "mongoose";

/**
 * Command Listen Modes
 */
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
    slashCommands: SlashCommandSettings[],
    /**
     * The Guild Specific role Settings
     */
    roles?: DBRole[],
    /**
     * The User Account URL related to the guild
     */
    account_url?: string,
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
    roles: [{
        type: DBRoleSchema,
        required: false,
        default: [],
    }],
});

export interface GuildSettingsDocument extends GuildSettings, mongoose.Document<mongoose.Types.ObjectId> {
    slashCommands: mongoose.Types.DocumentArray<SlashCommandSettingsDocument>,
    roles: mongoose.Types.DocumentArray<DBRoleDocument>,
    /**
    * Checks whether command Settings exist
    * @param name The internal Command Name
    */
    hasCommandSettings(name: string): boolean,
    /**
    * Gets the Settings for a specified command
    * @param name The internal Command Name
    */
    getCommandByInternalName(name: string): SlashCommandSettingsDocument | null,
    /**
    * Gets the Settings for a specified command
    * @param name The guild Command Name
    */
    getCommandByGuildName(name: string): SlashCommandSettingsDocument | null,
    getOrCreateCommandByInternalName(name: string): Promise<SlashCommandSettingsDocument>,
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GuildSettingsModel extends mongoose.Model<GuildSettingsDocument> {

}

GuildSettingsSchema.method("hasCommandSettings", function (name: string) {
    return this.slashCommands.some(x => x.internal_name === name);
});

GuildSettingsSchema.method("getCommandByInternalName", function (name: string) {
    return this.slashCommands.find(x => x.internal_name === name) ?? null;
});
GuildSettingsSchema.method("getCommandByGuildName", function (name: string) {
    return this.slashCommands.find(x => x.name === name) ?? this.getCommandByInternalName(name);
});

GuildSettingsSchema.method("getOrCreateCommandByInternalName", async function (name: string) {
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
    return this.getCommandByInternalName(name)!;
});

// Default export
export default GuildSettingsSchema;