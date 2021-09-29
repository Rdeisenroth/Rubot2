import SlashCommandPermissionSchema, { SlashCommandPermission, SlashCommandPermissionDocument } from "./slash_command_permission";
import { ApplicationCommandPermissionData, ApplicationCommandPermissionType, OverwriteData, PermissionString, Snowflake } from "discord.js";
import { ApplicationCommandPermissionTypes } from "discord.js/typings/enums";
import mongoose from "mongoose";

export interface SlashCommandSettings {
    /**
     * The Command ID
     */
    id: string,
    /**
     * The Command Name
     */
    name?: string,
    /**
     * The Command Description
     */
    description?: string,
    /**
     * If the command should be completely removed from the slash command List
     */
    disabled?: boolean,
    /**
     * The Command permissions
     */
    permissions: SlashCommandPermission[],
}

const SlashCommandSettingsSchema = new mongoose.Schema<SlashCommandSettingsDocument, SlashCommandSettingsModel, SlashCommandSettings>({
    id: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: false,
    },
    description: {
        type: String,
        required: false,
    },
    disabled: {
        type: Boolean,
        required: false,
    },
    permissions: [SlashCommandPermissionSchema],
});

export interface SlashCommandSettingsDocument extends SlashCommandSettings, Omit<mongoose.Document, "id"> {
    permissions: mongoose.Types.DocumentArray<SlashCommandPermissionDocument>,
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SlashCommandSettingsModel extends mongoose.Model<SlashCommandSettingsDocument> {

}

// Default export
export default SlashCommandSettingsSchema;